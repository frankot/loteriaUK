import { prisma } from "@/lib/prisma";
import { cacheLife, cacheTag } from "next/cache";

// ── Helpers ───────────────────────────────────────────────────

/** Prisma Decimal → plain number (required for "use cache" serialization) */
function decimal(d: unknown): number {
  return Number(String(d));
}
function maybeDecimal(d: unknown): number | null {
  return d != null ? Number(String(d)) : null;
}

/**
 * Strip Prisma Decimal instances from a competition-shaped object.
 * Required because React's "use cache" serialization rejects Decimal.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeComp(c: any) {
  if (!c) return c;
  return {
    ...c,
    pricePounds: decimal(c.pricePounds),
    prizeValue: maybeDecimal(c.prizeValue),
  };
}

// ── Trending competitions (ACTIVE, ordered by urgency) ────────
export async function getTrendingCompetitions(limit = 6) {
  "use cache";
  cacheLife("seconds");
  cacheTag("trending-competitions");

  const rows = await prisma.competition.findMany({
    where: {
      status: "ACTIVE",
      drawDate: { gte: new Date() },
    },
    orderBy: { drawDate: "asc" },
    take: limit,
    select: {
      id: true,
      slug: true,
      titleEn: true,
      titlePl: true,
      titleRo: true,
      titleBg: true,
      descEn: true,
      pricePounds: true,
      maxTickets: true,
      ticketsSold: true,
      drawDate: true,
      prizeImageUrl: true,
      prizeCategory: true,
      prizeValue: true,
    },
  });

  return rows.map(serializeComp);
}

// ── Featured competition (admin-picked, for hero card) ────
export async function getFeaturedCompetition() {
  "use cache";
  cacheLife("minutes");
  cacheTag("featured-competition");

  const comp = await prisma.competition.findFirst({
    where: {
      featured: true,
      status: "ACTIVE",
      drawDate: { gte: new Date() },
    },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      pricePounds: true,
      maxTickets: true,
      ticketsSold: true,
      drawDate: true,
      prizeImageUrl: true,
      prizeCategory: true,
      prizeValue: true,
    },
  });

  return serializeComp(comp);
}

// ── Hero competition — featured first (any status), else most urgent ACTIVE ──
export async function getHeroCompetition() {
  "use cache";
  cacheLife("seconds");
  cacheTag("hero-competition");

  // Try admin-picked featured first — allows ACTIVE, CLOSED, and DRAWN
  const featured = await prisma.competition.findFirst({
    where: {
      featured: true,
      status: { in: ["ACTIVE", "CLOSED", "DRAWN"] },
    },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      pricePounds: true,
      maxTickets: true,
      ticketsSold: true,
      drawDate: true,
      prizeImageUrl: true,
      prizeCategory: true,
      prizeValue: true,
      status: true,
      winners: {
        select: {
          user: { select: { name: true } },
          claimed: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (featured) return serializeComp(featured);

  // Fall back to the most urgent ACTIVE competition (closest draw date)
  const fallback = await prisma.competition.findFirst({
    where: {
      status: "ACTIVE",
      drawDate: { gte: new Date() },
    },
    orderBy: { drawDate: "asc" },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      pricePounds: true,
      maxTickets: true,
      ticketsSold: true,
      drawDate: true,
      prizeImageUrl: true,
      prizeCategory: true,
      prizeValue: true,
      status: true,
      winners: {
        select: {
          user: { select: { name: true } },
          claimed: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return serializeComp(fallback);
}

// ── Recent winners (with user + competition info) ─────────────
export async function getRecentWinners(limit = 6) {
  "use cache";
  cacheLife("minutes");
  cacheTag("recent-winners");

  return prisma.winner.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      photoUrl: true,
      createdAt: true,
      user: {
        select: { name: true, email: true },
      },
      competition: {
        select: { titleEn: true, titlePl: true, titleRo: true, titleBg: true, slug: true },
      },
    },
  });
}

// ── Paginated winners (for /winners subpage) ──────────────────
export async function getWinnersPaginated(page: number, perPage: number) {
  const [winners, totalCount] = await Promise.all([
    prisma.winner.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        photoUrl: true,
        createdAt: true,
        user: {
          select: { name: true, email: true },
        },
        competition: {
          select: { titleEn: true, titlePl: true, titleRo: true, titleBg: true, slug: true },
        },
      },
    }),
    prisma.winner.count(),
  ]);

  return { winners, totalCount };
}

// ── Competition detail (by slug, for /competitions/[slug]) ──
export async function getCompetitionBySlug(slug: string) {
  "use cache";
  cacheLife("minutes");
  cacheTag("competition-detail");

  const comp = await prisma.competition.findUnique({
    where: { slug },
    include: {
      winners: {
        include: {
          user: {
            select: { name: true },
          },
        },
        take: 1,
      },
    },
  });

  return serializeComp(comp);
}

// ── Competition list (paginated, for /competitions) ────────────
export async function getCompetitionsList(
  where: { status: "ACTIVE"; drawDate: { gte: Date }; prizeCategory?: string },
  page: number,
  pageSize: number
) {
  "use cache";
  cacheLife("seconds");
  cacheTag("competitions-list");

  const [rows, totalCount] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: { drawDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.competition.count({ where }),
  ]);

  return {
    competitions: rows.map(serializeComp),
    totalCount,
  };
}

// ── Homepage stats ────────────────────────────────────────────
export async function getHomepageStats() {
  "use cache";
  cacheLife("minutes");
  cacheTag("homepage-stats");

  const [activeCompetitions, totalWinners, totalEntries, prizesGiven] = await Promise.all([
    prisma.competition.count({
      where: {
        status: "ACTIVE",
        drawDate: { gte: new Date() },
      },
    }),
    prisma.winner.count(),
    prisma.entry.count(),
    prisma.winner.count(), // each winner = one prize given
  ]);

  return {
    activeCompetitions,
    totalWinners,
    totalEntries,
    prizesGiven,
  };
}
