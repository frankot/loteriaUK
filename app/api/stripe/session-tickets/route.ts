import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processStripeCheckout } from "@/lib/purchase-processor";

/**
 * Polling endpoint for the success page.
 *
 * Two-phase behavior:
 * 1. First, check if entries already exist for this Stripe session (webhook processed).
 * 2. After a configurable number of poll attempts with no results,
 *    attempt on-demand processing as a fallback (webhook recovery).
 *
 * Query params:
 *   session_id  — Stripe checkout session ID (required)
 *   attempt     — current poll attempt number (used to decide when to trigger recovery)
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  const attempt = parseInt(request.nextUrl.searchParams.get("attempt") || "0", 10);

  if (!sessionId) {
    return NextResponse.json({ tickets: [] });
  }

  // ── Check if entries exist ───────────────────────────────────
  const entries = await prisma.entry.findMany({
    where: { stripeSessionId: sessionId },
    select: {
      ticket: { select: { number: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (entries.length > 0) {
    const tickets = entries
      .filter((e) => e.ticket)
      .map((e) => ({ number: e.ticket!.number }));

    return NextResponse.json({ tickets });
  }

  // ── Recovery: after 5 attempts (~10 seconds), process on-demand ──
  // This handles cases where the webhook failed or was delayed.
  if (attempt >= 5) {
    console.log(`Session ${sessionId}: no entries after ${attempt} polls — attempting recovery`);

    const result = await processStripeCheckout(sessionId);

    if (result.success && result.ticketNumbers) {
      return NextResponse.json({
        tickets: result.ticketNumbers.map((n) => ({ number: n })),
        recovered: true,
      });
    }

    // If recovery also failed, return what we have (empty)
    return NextResponse.json({
      tickets: [],
      recoveryFailed: true,
      error: result.error,
    });
  }

  // ── Webhook hasn't fired yet — return empty, client will retry ──
  return NextResponse.json({ tickets: [] });
}
