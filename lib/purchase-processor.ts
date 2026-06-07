/**
 * Shared purchase processing logic — used by both the Stripe webhook
 * and the on-demand recovery endpoint (session-tickets).
 *
 * Key guarantees:
 * - Idempotent: safe to call multiple times for the same Stripe session
 * - Atomic: ticket allocation + entry creation in one DB transaction
 * - The atomic UPDATE on ticketsSold is the concurrency gate — only one
 *   caller can increment past the capacity check. Others get 0 rows and
 *   return 500, which causes Stripe to retry. On retry, the fast-path
 *   idempotency check (findFirst by stripeSessionId) sees existing entries.
 */

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import resend, { FROM_AUTH, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";
import { purchaseConfirmationHtml, adminPurchaseNotificationHtml } from "@/lib/email-templates";
import type Stripe from "stripe";

export interface ProcessResult {
  success: boolean;
  ticketNumbers?: number[];
  alreadyProcessed?: boolean;
  error?: string;
  status: number; // HTTP status for the caller
}

/**
 * Process a completed Stripe checkout session: allocate tickets,
 * create entries, send confirmation email.
 *
 * Call with a session ID (fetches from Stripe) or a pre-fetched session object.
 */
export async function processStripeCheckout(
  sessionOrId: string | Stripe.Checkout.Session
): Promise<ProcessResult> {
  // Resolve session
  let session: Stripe.Checkout.Session;
  if (typeof sessionOrId === "string") {
    try {
      session = await stripe.checkout.sessions.retrieve(sessionOrId);
    } catch (err) {
      console.error(`Failed to retrieve Stripe session ${sessionOrId}:`, err);
      return { success: false, error: "Failed to retrieve Stripe session", status: 500 };
    }
  } else {
    session = sessionOrId;
  }

  const stripeSessionId = session.id;

  // ── Validate payment status ──────────────────────────────────
  if (session.payment_status !== "paid") {
    console.log(`Stripe session ${stripeSessionId} not paid (status: ${session.payment_status}) — skipping`);
    return {
      success: false,
      error: `Payment not complete (status: ${session.payment_status})`,
      status: 200, // 200 so Stripe doesn't retry — not an error, just not ready
    };
  }

  // ── Extract and validate metadata ────────────────────────────
  const { competitionId, userId, quantity: quantityStr } = session.metadata || {};
  const quantity = parseInt(quantityStr || "0", 10);

  if (!competitionId || !userId || quantity < 1) {
    console.error(`Missing/invalid metadata in checkout session ${stripeSessionId}:`, session.metadata);
    return { success: false, error: "Missing or invalid session metadata", status: 400 };
  }

  // ── Idempotency check (fast path) ────────────────────────────
  const existingEntry = await prisma.entry.findFirst({
    where: { stripeSessionId },
    select: { id: true },
  });
  if (existingEntry) {
    const existingTickets = await prisma.ticket.findMany({
      where: { entry: { stripeSessionId } },
      select: { number: true },
      orderBy: { number: "asc" },
    });
    console.log(`Stripe session ${stripeSessionId} already processed — returning existing tickets`);
    return {
      success: true,
      alreadyProcessed: true,
      ticketNumbers: existingTickets.map((t) => t.number),
      status: 200,
    };
  }

  // ── Atomic ticket allocation ────────────────────────────────
  // This is the concurrency gate: only one caller can succeed.
  // All others get 0 rows → return 500 → Stripe retries → idempotency catches it.
  const result = await prisma.$queryRaw<{ tickets_sold: number }[]>`
    UPDATE competitions
    SET "ticketsSold" = "ticketsSold" + ${quantity}
    WHERE id = ${competitionId}
      AND status = 'ACTIVE'
      AND ("ticketsSold" + ${quantity}) <= "maxTickets"
    RETURNING "ticketsSold" AS tickets_sold
  `;

  if (result.length === 0) {
    // Check why it failed
    const comp = await prisma.competition.findUnique({
      where: { id: competitionId },
      select: { status: true, ticketsSold: true, maxTickets: true },
    });

    const reason = !comp
      ? "Competition not found"
      : comp.status !== "ACTIVE"
        ? `Competition not active (status: ${comp.status})`
        : `Capacity exceeded: need ${quantity}, only ${comp.maxTickets - comp.ticketsSold} left`;

    console.error(`Purchase processing failed for ${stripeSessionId}: ${reason}`);

    // Return 500 so Stripe retries — the problem may be transient (e.g. competition
    // was briefly deactivated, or another webhook is racing us and will succeed).
    // On retry, idempotency check above will find the entries if the other call succeeded.
    return { success: false, error: reason, status: 500 };
  }

  // ── Pick random ticket numbers ─────────────────────────────
  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    select: { maxTickets: true },
  });
  const maxTickets = comp?.maxTickets ?? 0;

  const takenRows = await prisma.ticket.findMany({
    where: { competitionId },
    select: { number: true },
  });
  const taken = new Set(takenRows.map((t) => t.number));

  const available: number[] = [];
  for (let n = 1; n <= maxTickets; n++) {
    if (!taken.has(n)) available.push(n);
  }

  if (available.length < quantity) {
    console.error(
      `Not enough free ticket numbers: need ${quantity}, only ${available.length} available — session ${stripeSessionId}`
    );
    // Rollback ticketsSold
    await prisma.competition.update({
      where: { id: competitionId },
      data: { ticketsSold: { decrement: quantity } },
    });
    return { success: false, error: "Not enough free ticket numbers", status: 500 };
  }

  // Fisher-Yates shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  const ticketNumbers = available.slice(0, quantity);

  // ── Create tickets + entries in transaction ────────────────
  try {
    await prisma.$transaction(async (tx) => {
      await tx.ticket.createMany({
        data: ticketNumbers.map((num) => ({
          competitionId,
          userId,
          number: num,
          status: "SOLD" as const,
        })),
      });

      const createdTickets = await tx.ticket.findMany({
        where: {
          competitionId,
          number: { in: ticketNumbers },
        },
        select: { id: true },
      });

      if (createdTickets.length !== ticketNumbers.length) {
        throw new Error(
          `Ticket creation mismatch: expected ${ticketNumbers.length}, got ${createdTickets.length}`
        );
      }

      await tx.entry.createMany({
        data: createdTickets.map((ticket) => ({
          competitionId,
          userId,
          ticketId: ticket.id,
          type: "PAID" as const,
          answerCorrect: true,
          stripeSessionId,
        })),
      });
    });

    console.log(
      `Purchase complete: user=${userId} comp=${competitionId} tickets=[${ticketNumbers.join(",")}] session=${stripeSessionId}`
    );

    // ── Send confirmation emails (non-blocking) ──────────────
    sendPurchaseEmails(userId, competitionId, ticketNumbers, quantity, session).catch(
      (err) => console.error("Failed to send purchase emails:", err)
    );

    return { success: true, ticketNumbers, status: 200 };
  } catch (error) {
    console.error(`Ticket/entry creation failed for session ${stripeSessionId}:`, error);
    // Rollback ticketsSold since the transaction failed
    await prisma.competition.update({
      where: { id: competitionId },
      data: { ticketsSold: { decrement: quantity } },
    });
    console.log(`Rolled back ticketsSold for failed session ${stripeSessionId}`);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ticket creation failed",
      status: 500,
    };
  }
}

/**
 * Send purchase confirmation and admin notification emails.
 * Non-blocking — never throws to caller.
 */
async function sendPurchaseEmails(
  userId: string,
  competitionId: string,
  ticketNumbers: number[],
  quantity: number,
  session: Stripe.Checkout.Session
) {
  if (!process.env.RESEND_API_KEY) return;

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

    if (!user?.email || !comp) return;

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
  } catch (emailError) {
    console.error("Failed to send purchase confirmation email:", emailError);
  }
}
