import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Ticket, Trophy, Edit, Users } from "lucide-react";
import { AddPostalEntryButton } from "./entries/add-postal-button";
import { EntriesTable } from "./entries/entries-table";
import FeaturedToggle from "@/components/admin/featured-toggle";

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ search?: string; type?: string; correct?: string; page?: string }>;
};

const PAGE_SIZE = 50;

const statusColors: Record<string, string> = {
  DRAFT: "bg-cream-warm text-ink-muted",
  ACTIVE: "bg-success/10 text-success",
  CLOSED: "bg-gold-pale text-gold-dark",
  DRAWN: "bg-badge-electronics text-white",
  CANCELLED: "bg-urgent/10 text-urgent",
};

export default async function CompetitionDetailPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const { search, type, correct, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1") || 1);

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      question: { select: { questionEn: true } },
      winners: {
        include: { user: { select: { name: true, email: true } } },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { entries: true, tickets: { where: { status: "SOLD" } } },
      },
    },
  });

  if (!competition) notFound();

  const winner = competition.winners[0] ?? null;

  // ── Featured competition info ────────────────────────────────
  const otherFeatured = competition.featured
    ? null
    : await prisma.competition.findFirst({
        where: { featured: true, id: { not: id } },
        select: { id: true, titleEn: true },
      });

  // ── Entries data ──────────────────────────────────────────────
  const entryWhere: Record<string, unknown> = { competitionId: id };
  if (type && type !== "all") entryWhere.type = type;
  if (correct === "true") entryWhere.answerCorrect = true;
  if (correct === "false") entryWhere.answerCorrect = false;
  if (search) {
    entryWhere.user = {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ],
    };
  }

  const [entries, totalEntryCount, paidCount, postalCount, correctCount, incorrectCount] =
    await Promise.all([
      prisma.entry.findMany({
        where: entryWhere,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: { select: { email: true, name: true } },
          ticket: { select: { number: true } },
        },
      }),
      prisma.entry.count({ where: entryWhere }),
      prisma.entry.count({ where: { competitionId: id, type: "PAID" } }),
      prisma.entry.count({ where: { competitionId: id, type: "POSTAL" } }),
      prisma.entry.count({ where: { competitionId: id, answerCorrect: true } }),
      prisma.entry.count({ where: { competitionId: id, answerCorrect: false } }),
    ]);

  const totalPages = Math.ceil(totalEntryCount / PAGE_SIZE);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-ink-muted">
        <Link href={`/${locale}/admin/competitions`} className="hover:text-gold-dark">
          Competitions
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/${locale}/admin/competitions/${id}`}
          className="hover:text-gold-dark text-ink"
        >
          {competition.titleEn}
        </Link>
      </nav>

      {/* Header row: thumbnail + info + Edit */}
      <div className="mb-8 flex flex-wrap items-start gap-5">
        {competition.prizeImageUrl && (
          <div className="h-28 w-44 flex-shrink-0 overflow-hidden rounded-xl border border-border bg-cream-warm">
            <img
              src={competition.prizeImageUrl}
              alt={competition.titleEn}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <h1 className="font-serif text-3xl font-semibold text-ink">
            {competition.titleEn}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                statusColors[competition.status] || ""
              }`}
            >
              {competition.status}
            </span>
            <span className="text-sm text-ink-muted">
              Draw:{" "}
              {competition.drawDate.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
            {competition.question && (
              <span className="text-sm text-ink-muted">
                Question: {competition.question.questionEn.slice(0, 60)}...
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/${locale}/admin/competitions/${id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Ticket className="h-4 w-4 text-gold-dark" />
            <span className="text-xs font-medium text-ink-muted">Tickets</span>
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {competition._count.tickets}
            <span className="text-base font-normal text-ink-muted">
              {" "}/ {competition.maxTickets}
            </span>
          </div>
          <div className="mt-1 text-xs text-ink-muted">{competition.ticketsSold} sold</div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-ink-muted">Entries</span>
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            {competition._count.entries}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">Price</span>
          </div>
          <div className="font-serif text-2xl font-bold text-ink">
            £{Number(competition.pricePounds).toFixed(2)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-white p-5 shadow-card">
          <div className="mb-2 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-gold-dark" />
            <span className="text-xs font-medium text-ink-muted">Winner</span>
          </div>
          {winner ? (
            <div className="font-serif text-lg font-bold text-gold-dark">
              {winner.user.name || winner.user.email}
            </div>
          ) : (
            <div className="text-ink-muted text-sm">Not yet drawn</div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {competition.status === "CLOSED" && (
          <Link
            href={`/${locale}/admin/competitions/${id}/assign-winner`}
            className="flex items-center gap-3 rounded-xl border border-gold-pale bg-gold-pale/20 p-5 shadow-card transition-colors hover:border-gold hover:bg-gold-pale/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="font-medium text-gold-dark">Assign Winner</div>
              <div className="text-xs text-gold-dark/70">
                Enter the winning ticket number from the live draw
              </div>
            </div>
          </Link>
        )}

        {competition.status === "DRAWN" && winner && (
          <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 p-5 shadow-card">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Trophy className="h-5 w-5 text-success" />
            </div>
            <div>
              <div className="font-medium text-success">Winner Drawn</div>
              <div className="text-xs text-success/70">
                {winner.user.name || winner.user.email}
              </div>
            </div>
          </div>
        )}

        <Link
          href={`/${locale}/competitions/${competition.slug}`}
          target="_blank"
          className="flex items-center gap-3 rounded-xl border border-border bg-white p-5 shadow-card transition-colors hover:border-gold hover:shadow-featured"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cream-warm">
            <svg className="h-5 w-5 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div>
            <div className="font-medium text-ink">View Public Page</div>
            <div className="text-xs text-ink-muted">Open in new tab</div>
          </div>
        </Link>

        {/* Featured Toggle card */}
        <FeaturedToggle
          competitionId={id}
          currentlyFeatured={competition.featured}
          otherFeatured={otherFeatured}
          locale={locale}
        />
      </div>

      {/* ── Entries Section ─────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">Entries</h2>
            <p className="mt-1 text-sm text-ink-muted">{totalEntryCount} total entries</p>
          </div>
          <div className="flex gap-3">
            <AddPostalEntryButton competitionId={id} locale={locale} />
            <Link
              href={`/${locale}/admin/competitions/${id}/entries/export`}
              className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
            >
              Export CSV
            </Link>
          </div>
        </div>

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
    </div>
  );
}
