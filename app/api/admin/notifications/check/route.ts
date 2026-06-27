import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import resend, { FROM_AUTH, ADMIN_NOTIFICATION_EMAIL } from "@/lib/resend";
import {
  adminEndingSoonHtml,
  adminNearlySoldOutHtml,
} from "@/lib/email-templates";

/**
 * Cron endpoint for admin notifications.
 *
 * Call this every hour (e.g. cron-job.org, Vercel Cron Jobs).
 * It checks:
 *   1. ACTIVE competitions within 24h of draw date
 *   2. ACTIVE competitions at ≥95% tickets sold
 *
 * Uses a simple dedup lookup table so each alert fires once per competition.
 */

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://goldendreandraw.com";

// Simple in-memory dedup — resets on deploy/restart. Good enough for hourly cron.
const notifiedEndingSoon = new Set<string>();
const notifiedSoldOut = new Set<string>();

export async function GET(request: NextRequest) {
  // Auth via shared secret. Never query the DB if cron auth is missing/invalid.
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const authToken = request.nextUrl.searchParams.get("token") || bearer;
  if (authToken !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ADMIN_NOTIFICATION_EMAIL) {
    return NextResponse.json({ error: "ADMIN_NOTIFICATION_EMAIL not set" }, { status: 500 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const competitions = await prisma.competition.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      titleEn: true,
      slug: true,
      ticketsSold: true,
      maxTickets: true,
      drawDate: true,
    },
  });

  const sent: string[] = [];

  for (const comp of competitions) {
    const hoursLeft = (comp.drawDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // ── 1. Ending within 24h ──────────────────────────────────
    if (hoursLeft <= 24 && hoursLeft > 0 && !notifiedEndingSoon.has(comp.id)) {
      notifiedEndingSoon.add(comp.id);
      try {
        await resend.emails.send({
          from: FROM_AUTH,
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `⏰ Ending soon: ${comp.titleEn} (${Math.round(hoursLeft)}h left)`,
          html: adminEndingSoonHtml({
            competitionTitle: comp.titleEn,
            competitionSlug: comp.slug,
            ticketsSold: comp.ticketsSold,
            maxTickets: comp.maxTickets,
            drawDate: comp.drawDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            hoursLeft: Math.round(hoursLeft),
          }),
        });
        sent.push(`ending-soon:${comp.slug}`);
      } catch (e) {
        console.error(`Failed to send ending-soon alert for ${comp.slug}:`, e);
      }
    }

    // ── 2. ≥95% sold ───────────────────────────────────────────
    const pct = comp.maxTickets > 0 ? (comp.ticketsSold / comp.maxTickets) * 100 : 0;
    const remaining = comp.maxTickets - comp.ticketsSold;

    if (pct >= 95 && remaining > 0 && !notifiedSoldOut.has(comp.id)) {
      notifiedSoldOut.add(comp.id);
      try {
        await resend.emails.send({
          from: FROM_AUTH,
          to: ADMIN_NOTIFICATION_EMAIL,
          subject: `📊 Nearly sold out: ${comp.titleEn} (${remaining} left)`,
          html: adminNearlySoldOutHtml({
            competitionTitle: comp.titleEn,
            competitionSlug: comp.slug,
            ticketsSold: comp.ticketsSold,
            maxTickets: comp.maxTickets,
            remaining,
          }),
        });
        sent.push(`nearly-sold-out:${comp.slug}`);
      } catch (e) {
        console.error(`Failed to send nearly-sold-out alert for ${comp.slug}:`, e);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    checked: competitions.length,
    sent,
  });
}
