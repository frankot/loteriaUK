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
        // No-op — user can retry, tickets not reserved until payment
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

  if (!competitionId || !userId || quantity < 1) {
    console.error("Missing metadata in checkout session:", session.id);
    return;
  }

  // Use a transaction to ensure atomicity
  await prisma.$transaction(async (tx: any) => {
    // 1. Get competition and lock row (via update)
    const competition = await tx.competition.findUnique({
      where: { id: competitionId },
      select: { ticketsSold: true, maxTickets: true, status: true },
    });

    if (!competition || competition.status !== "ACTIVE") {
      throw new Error(`Competition ${competitionId} is not active`);
    }

    const left = competition.maxTickets - competition.ticketsSold;
    if (left < quantity) {
      throw new Error(
        `Not enough tickets: ${left} left, requested ${quantity}`
      );
    }

    // 2. Get the next sequential ticket number
    const lastTicket = await tx.ticket.findFirst({
      where: { competitionId },
      orderBy: { number: "desc" },
      select: { number: true },
    });
    const startNumber = (lastTicket?.number ?? 0) + 1;

    // 3. Create tickets + entries
    const ticketIds: number[] = [];
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
      ticketIds.push(ticketNumber);

      await tx.entry.create({
        data: {
          competitionId,
          userId,
          ticketId: ticket.id,
          type: "PAID",
          answerCorrect: true,
        },
      });
    }

    // 4. Update ticketsSold
    await tx.competition.update({
      where: { id: competitionId },
      data: {
        ticketsSold: { increment: quantity },
      },
    });

    console.log(
      `✅ Purchase complete: user=${userId} comp=${competitionId} tickets=${ticketIds.join(", ")}`
    );

    // TODO: Send confirmation email via Resend
  });
}
