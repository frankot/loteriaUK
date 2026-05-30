import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Stripe webhook: stripe client not initialized");
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "checkout.session.expired": {
        console.log("Checkout session expired:", event.data.object.id);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { competitionId, userId, quantity: quantityStr } = session.metadata || {};
  const quantity = parseInt(quantityStr || "0", 10);
  const stripeSessionId = session.id;

  if (!competitionId || !userId || quantity < 1) {
    console.error("Missing metadata in checkout session:", stripeSessionId);
    return;
  }

  // ── Idempotency: skip if this Stripe session was already processed ──
  const existingEntry = await prisma.entry.findFirst({
    where: { stripeSessionId },
    select: { id: true },
  });
  if (existingEntry) {
    console.log(`Stripe session ${stripeSessionId} already processed — skipping`);
    return;
  }

  // ── Atomic ticket allocation + counter ──────────────────────────
  // Use a raw SQL UPDATE that atomically checks capacity AND increments.
  // This eliminates the TOCTOU race: only one transaction can succeed
  // when the capacity check passes, because PostgreSQL locks the row.
  const result = await prisma.$queryRaw<{ tickets_sold: number }[]>`
    UPDATE competitions
    SET "ticketsSold" = "ticketsSold" + ${quantity}
    WHERE id = ${competitionId}
      AND status = 'ACTIVE'
      AND ("ticketsSold" + ${quantity}) <= "maxTickets"
    RETURNING "ticketsSold" AS tickets_sold
  `;

  if (result.length === 0) {
    // Either competition not active, or capacity exceeded
    // Check which case by re-reading
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, ticketsSold: true, maxTickets: true },
    });

    if (!comp || comp.status !== "ACTIVE") {
      console.error(`Competition ${competitionId} not active — session ${stripeSessionId}`);
    } else {
      console.error(
        `Oversell prevented: ${quantity} requested, only ${comp.maxTickets - comp.ticketsSold} left — session ${stripeSessionId}`
      );
      // Refund logic could go here — for now, log and alert admins
    }
    return;
  }

  // New total after increment — old total was newTotal - quantity
  const newTicketsSold = Number(result[0].tickets_sold);
  const startNumber = newTicketsSold - quantity + 1;

  // ── Create tickets + entries ────────────────────────────────────
  // Ticket numbers are computed from the atomic counter — no race possible
  // The @@unique([competitionId, number]) constraint is a safety net
  try {
    await prisma.$transaction(async (tx: any) => {
      for (let i = 0; i < quantity; i++) {
        const ticketNumber = startNumber + i;

        const ticket = await tx.ticket.create({
          data: {
            competitionId,
            userId,
            number: ticketNumber,
            status: "SOLD",
          },
        });

        await tx.entry.create({
          data: {
            competitionId,
            userId,
            ticketId: ticket.id,
            type: "PAID",
            answerCorrect: true, // verified server-side before checkout
            stripeSessionId,
          },
        });
      }
    });

    console.log(
      `Purchase complete: user=${userId} comp=${competitionId} tickets=${startNumber}-${startNumber + quantity - 1} session=${stripeSessionId}`
    );
  } catch (error) {
    console.error(`Ticket creation failed for session ${stripeSessionId}:`, error);
    // ticketsSold was already incremented — we need to roll it back
    // to avoid permanently losing capacity
    await prisma.competition.update({
      where: { id: competitionId },
      data: { ticketsSold: { decrement: quantity } },
    });
    console.log(`Rolled back ticketsSold for failed session ${stripeSessionId}`);
    throw error;
  }
}
