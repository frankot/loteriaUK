import { prisma } from "@/lib/prisma";

// ── Trending competitions (ACTIVE, ordered by urgency) ────────
export async function getTrendingCompetitions(limit = 6) {
  return prisma.competition.findMany({
    where: { status: "ACTIVE" },
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
}

// ── Featured competition (admin-picked, for hero card) ────
export async function getFeaturedCompetition() {
  return prisma.competition.findFirst({
    where: { featured: true, status: "ACTIVE" },
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
}

// ── Hero competition — featured first, else most urgent ACTIVE ──
export async function getHeroCompetition() {
  // Try admin-picked featured first
  const featured = await prisma.competition.findFirst({
    where: { featured: true, status: "ACTIVE" },
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

  if (featured) return featured;

  // Fall back to the most urgent ACTIVE competition (closest draw date)
  return prisma.competition.findFirst({
    where: { status: "ACTIVE" },
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
    },
  });
}

// ── Recent winners (with user + competition info) ─────────────
export async function getRecentWinners(limit = 6) {
  return prisma.winner.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: {
        select: { name: true, email: true },
      },
      competition: {
        select: { titleEn: true, titlePl: true, titleRo: true, titleBg: true, slug: true },
      },
    },
  });
}

// ── Homepage stats ────────────────────────────────────────────
export async function getHomepageStats() {
  const [activeCompetitions, totalWinners, totalEntries, prizesGiven] = await Promise.all([
    prisma.competition.count({ where: { status: "ACTIVE" } }),
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
