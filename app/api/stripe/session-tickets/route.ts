import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Polling endpoint for the success page.
 * Returns tickets for a given stripe session — used by the
 * TicketPoller client component to wait for the webhook.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ tickets: [] });
  }

  const entries = await prisma.entry.findMany({
    where: { stripeSessionId: sessionId },
    select: {
      ticket: {
        select: { number: true },
      },
      competition: {
        select: { titleEn: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const tickets = entries
    .filter((e) => e.ticket)
    .map((e) => ({ number: e.ticket!.number }));

  return NextResponse.json({ tickets });
}
