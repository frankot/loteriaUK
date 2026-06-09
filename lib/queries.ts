import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// ── Helpers ───────────────────────────────────────────────────

/** Prisma Decimal → plain number */
function decimal(d: unknown): number {
  return Number(String(d));
}
function maybeDecimal(d: unknown): number | null {
  return d != null ? Number(String(d)) : null;
}

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

export const getTrendingCompetitions = unstable_cache(
  async (limit = 6) => {
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
  },
  ["trending-competitions"],
  { tags: ["trending-competitions"], revalidate: 30 }
);

// ── Featured competition (admin-picked, for hero card) ────────

export const getFeaturedCompetition = unstable_cache(
  async () => {
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
  },
  ["featured-competition"],
  { tags: ["featured-competition"], revalidate: 300 }
);

// ── Hero competition — featured first (any status), else most urgent ACTIVE ──

export const getHeroCompetition = unstable_cache(
  async () => {
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
  },
  ["hero-competition"],
  { tags: ["hero-competition"], revalidate: 30 }
);

// ── Recent winners (with user + competition info) ─────────────

export const getRecentWinners = unstable_cache(
  async (limit = 6) => {
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
  },
  ["recent-winners"],
  { tags: ["recent-winners"], revalidate: 300 }
);

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

export const getCompetitionBySlug = unstable_cache(
  async (slug: string) => {
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
  },
  ["competition-detail"],
  { tags: ["competition-detail"], revalidate: 300 }
);

// ── Competition list (paginated, for /competitions) ────────────

export const getCompetitionsList = unstable_cache(
  async (
    category: string | undefined,
    page: number,
    pageSize: number
  ) => {
    const where = {
      status: "ACTIVE" as const,
      drawDate: { gte: new Date() },
      ...(category ? { prizeCategory: category } : {}),
    };

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
  },
  ["competitions-list"],
  { tags: ["competitions-list"], revalidate: 30 }
);

// ── Homepage stats ────────────────────────────────────────────

export const getHomepageStats = unstable_cache(
  async () => {
    const [activeCompetitions, totalWinners, totalEntries, prizesGiven] = await Promise.all([
      prisma.competition.count({
        where: {
          status: "ACTIVE",
          drawDate: { gte: new Date() },
        },
      }),
      prisma.winner.count(),
      prisma.entry.count(),
      prisma.winner.count(),
    ]);

    return {
      activeCompetitions,
      totalWinners,
      totalEntries,
      prizesGiven,
    };
  },
  ["homepage-stats"],
  { tags: ["homepage-stats"], revalidate: 300 }
);
