import { NextRequest, NextResponse } from "next/server";
import { stripe, getWebhookSecret } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import resend, { FROM_AUTH, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";
import { purchaseConfirmationHtml, adminPurchaseNotificationHtml } from "@/lib/email-templates";
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

  // ── Pick random ticket numbers from the available pool ──────────
  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { maxTickets: true },
  });
  const maxTickets = comp?.maxTickets ?? 0;

  // Fetch already-taken numbers for this competition
  const takenRows = await prisma.ticket.findMany({
    where: { competitionId },
    select: { number: true },
  });
  const taken = new Set(takenRows.map((t) => t.number));

  // Build available pool: 1..maxTickets minus taken numbers
  const available: number[] = [];
  for (let n = 1; n <= maxTickets; n++) {
    if (!taken.has(n)) available.push(n);
  }

  if (available.length < quantity) {
    console.error(
      `Not enough free numbers: need ${quantity}, only ${available.length} available — session ${stripeSessionId}`
    );
    await prisma.competition.update({
      where: { id: competitionId },
      data: { ticketsSold: { decrement: quantity } },
    });
    return;
  }

  // Shuffle and pick
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const ticketNumbers = available.slice(0, quantity);

  // ── Create tickets + entries (batch) ──────────────────────────
  // Use createMany to avoid transaction timeout on large quantities
  try {
    await prisma.$transaction(async (tx) => {
      // Step 1: bulk-insert all tickets
      await tx.ticket.createMany({
        data: ticketNumbers.map((num) => ({
          competitionId,
          userId,
          number: num,
          status: "SOLD",
        })),
        skipDuplicates: true,
      });

      // Step 2: fetch the created ticket IDs
      const createdTickets = await tx.ticket.findMany({
        where: {
          competitionId,
          number: { in: ticketNumbers },
        },
        select: { id: true },
      });

      // Step 3: bulk-insert all entries
      await tx.entry.createMany({
        data: createdTickets.map((ticket) => ({
          competitionId,
          userId,
          ticketId: ticket.id,
          type: "PAID",
          answerCorrect: true,
          stripeSessionId,
        })),
      });
    });

    console.log(
      `Purchase complete: user=${userId} comp=${competitionId} tickets=[${ticketNumbers.join(",")}] session=${stripeSessionId}`
    );

    // ── Send confirmation email (non-blocking) ────────────────
    if (process.env.RESEND_API_KEY) {
      try {
        const [user, comp] = await Promise.all([
          prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, phone: true, address: true },
          }),
          prisma.competition.findUnique({
            where: { id: competitionId },
            select: { titleEn: true, slug: true, drawDate: true },
          }),
        ]);

        if (user?.email && comp) {
          const totalPaid =
            session.amount_total != null
              ? (session.amount_total / 100).toFixed(2)
              : "0.00";

          await resend.emails.send({
            from: FROM_AUTH,
            to: user.email,
            subject: `🎟️ Tickets confirmed — ${comp.titleEn}`,
            html: purchaseConfirmationHtml({
              userName: user.name || "Player",
              ticketNumbers,
              competitionTitle: comp.titleEn,
              competitionSlug: comp.slug,
              drawDate: comp.drawDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              totalPaid,
            }),
          });

          console.log(`📧 Purchase confirmation sent to ${user.email}`);

          // ── Admin notification ────────────────────────────────
          if (ADMIN_NOTIFICATION_EMAIL) {
            await resend.emails.send({
              from: FROM_AUTH,
              to: ADMIN_NOTIFICATION_EMAIL,
              subject: `💰 New purchase: ${user.name || "Someone"} bought ${quantity} ticket(s) for ${comp.titleEn}`,
              html: adminPurchaseNotificationHtml({
                userName: user.name || "Unknown",
                userEmail: user.email,
                competitionTitle: comp.titleEn,
                ticketCount: quantity,
                ticketNumbers,
                totalPaid,
                userPhone: user.phone,
                userAddress: user.address,
              }),
            });
            console.log(`📧 Admin purchase notification sent to ${ADMIN_NOTIFICATION_EMAIL}`);
          }
        }
      } catch (emailError) {
        console.error("Failed to send purchase confirmation email:", emailError);
      }
    }
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
