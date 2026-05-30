import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AddPostalEntryButton } from "./add-postal-button";
import { EntriesTable } from "./entries-table";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ search?: string; type?: string; correct?: string; page?: string }>;
};

const PAGE_SIZE = 50;

export default async function AdminEntriesPage({
  params,
  searchParams,
}: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { search, type, correct, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1") || 1);

  const competition = await prisma.competition.findUnique({
    where: { id },
    select: { id: true, titleEn: true, slug: true, questionId: true },
  });

  if (!competition) notFound();

  const where: Record<string, unknown> = { competitionId: id };

  if (type && type !== "all") {
    where.type = type;
  }

  if (correct === "true") where.answerCorrect = true;
  if (correct === "false") where.answerCorrect = false;

  if (search) {
    where.user = {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [entries, totalCount] = await Promise.all([
    prisma.entry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { email: true, name: true } },
        ticket: { select: { number: true } },
      },
    }),
    prisma.entry.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // Counts
  const [paidCount, postalCount, correctCount, incorrectCount] =
    await Promise.all([
      prisma.entry.count({ where: { competitionId: id, type: "PAID" } }),
      prisma.entry.count({ where: { competitionId: id, type: "POSTAL" } }),
      prisma.entry.count({ where: { competitionId: id, answerCorrect: true } }),
      prisma.entry.count({ where: { competitionId: id, answerCorrect: false } }),
    ]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="mb-2 text-xs text-ink-muted">
            <Link
              href={`/${locale}/admin/competitions`}
              className="hover:text-gold-dark"
            >
              Competitions
            </Link>
            <span className="mx-1.5">/</span>
            <Link
              href={`/${locale}/admin/competitions/${id}`}
              className="hover:text-gold-dark text-ink"
            >
              {competition.titleEn}
            </Link>
            <span className="mx-1.5">/</span>
            <span className="text-ink">Entries</span>
          </nav>
          <h1 className="font-serif text-3xl font-semibold text-ink">
            Entries
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {totalCount} total entries
          </p>
        </div>
        <div className="flex gap-3">
          <AddPostalEntryButton
            competitionId={id}
            locale={locale}
          />
          <Link
            href={`/${locale}/admin/competitions/${id}/entries/export`}
            className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            Export CSV
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <EntriesTable
        entries={JSON.parse(JSON.stringify(entries))}
        competitionId={id}
        locale={locale}
        totalPages={totalPages}
        currentPage={page}
        searchParam={search}
        typeParam={type}
        correctParam={correct}
        counts={{ paidCount, postalCount, correctCount, incorrectCount }}
      />
    </div>
  );
}
