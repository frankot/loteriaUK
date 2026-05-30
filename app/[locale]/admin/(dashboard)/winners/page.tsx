import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { WinnersTable } from "./winners-table";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminWinnersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const winners = await prisma.winner.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, email: true, name: true } },
      competition: { select: { id: true, titleEn: true, slug: true } },
      entry: { select: { ticketId: true, type: true, ticket: { select: { number: true } } } },
    },
  });

  // Serialize dates
  const serialized = winners.map((w) => ({
    id: w.id,
    competitionId: w.competitionId,
    entryId: w.entryId,
    notified: w.notified,
    claimed: w.claimed,
    notifiedAt: w.notifiedAt?.toISOString() ?? null,
    claimedAt: w.claimedAt?.toISOString() ?? null,
    createdAt: w.createdAt.toISOString(),
    user: {
      id: w.user.id,
      email: w.user.email,
      name: w.user.name,
    },
    competition: {
      id: w.competition.id,
      titleEn: w.competition.titleEn,
      slug: w.competition.slug,
    },
    entry: {
      ticketId: w.entry.ticketId,
      type: w.entry.type,
      ticketNumber: w.entry.ticket?.number ?? null,
    },
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-ink">Winners</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {winners.length} total winner{winners.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <WinnersTable winners={serialized} locale={locale} />
    </div>
  );
}
