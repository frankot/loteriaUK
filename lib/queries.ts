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

/**
 * unstable_cache serializes with JSON — Date objects become ISO strings.
 * Walk the result tree and revive ISO date strings back to Date objects.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = reviveDates(v);
    }
    return out;
  }
  // ISO 8601 date strings → Date
  if (
    typeof obj === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)
  ) {
    return new Date(obj);
  }
  return obj;
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

/**
 * Wraps an async function with unstable_cache + date revival.
 * unstable_cache's JSON serialization turns Dates into strings;
 * reviveDates converts them back on every cache read.
 */
function cached<T extends (...args: any[]) => Promise<any>>(
  keyParts: string[],
  tags: string[],
  revalidate: number,
  fn: T
): T {
  const inner = unstable_cache(fn, keyParts, { tags, revalidate });
  return (async (...args: Parameters<T>) => {
    const result = await inner(...args);
    return reviveDates(result);
  }) as T;
}

// ── Trending competitions (ACTIVE, ordered by urgency) ────────

export const getTrendingCompetitions = cached(
  ["trending-competitions"],
  ["trending-competitions"],
  30,
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
  }
);

// ── Featured competition (admin-picked, for hero card) ────────

export const getFeaturedCompetition = cached(
  ["featured-competition"],
  ["featured-competition"],
  300,
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
  }
);

// ── Hero competition — featured first (any status), else most urgent ACTIVE ──

export const getHeroCompetition = cached(
  ["hero-competition"],
  ["hero-competition"],
  30,
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
  }
);

// ── Recent winners (with user + competition info) ─────────────

export const getRecentWinners = cached(
  ["recent-winners"],
  ["recent-winners"],
  300,
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
  }
);

// ── Paginated winners (for /winners subpage) ──────────────────
// Not cached — page/offset varies per request

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

export const getCompetitionBySlug = cached(
  ["competition-detail"],
  ["competition-detail"],
  300,
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
  }
);

// ── Competition list (paginated, for /competitions) ────────────

export const getCompetitionsList = cached(
  ["competitions-list"],
  ["competitions-list"],
  30,
  async (category: string | undefined, page: number, pageSize: number) => {
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
  }
);

// ── Homepage stats ────────────────────────────────────────────

export const getHomepageStats = cached(
  ["homepage-stats"],
  ["homepage-stats"],
  300,
  async () => {
    const [activeCompetitions, totalWinners, totalEntries, prizesGiven] =
      await Promise.all([
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
  }
);
