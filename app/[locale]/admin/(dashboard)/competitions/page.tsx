import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DeleteButton } from "./delete-button";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; search?: string }>;
};

const statusColors: Record<string, string> = {
  DRAFT: "bg-cream-warm text-ink-muted",
  ACTIVE: "bg-success/10 text-success",
  CLOSED: "bg-gold-pale text-gold-dark",
  DRAWN: "bg-badge-electronics text-white",
  CANCELLED: "bg-urgent/10 text-urgent",
};

export default async function AdminCompetitionsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { status, search } = await searchParams;

  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { titleEn: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const competitions = await prisma.competition.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const statusCounts = await prisma.competition.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const counts: Record<string, number> = {};
  for (const s of statusCounts) {
    counts[s.status] = s._count.id;
  }

  const filterTabs = [
    { value: "all", label: "All", count: competitions.length },
    { value: "ACTIVE", label: "Active", count: counts.ACTIVE || 0 },
    { value: "DRAFT", label: "Draft", count: counts.DRAFT || 0 },
    { value: "CLOSED", label: "Closed", count: counts.CLOSED || 0 },
    { value: "DRAWN", label: "Drawn", count: counts.DRAWN || 0 },
    { value: "CANCELLED", label: "Cancelled", count: counts.CANCELLED || 0 },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Competitions
        </h1>
        <Link
          href={`/${locale}/admin/competitions/new`}
          className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
        >
          + New Competition
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <a
              key={tab.value}
              href={
                tab.value === "all"
                  ? `/${locale}/admin/competitions`
                  : `/${locale}/admin/competitions?status=${tab.value}`
              }
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                (status || "all") === tab.value
                  ? "bg-ink text-white"
                  : "border border-border bg-white text-ink-muted hover:border-gold"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 opacity-60">({tab.count})</span>
            </a>
          ))}
        </div>

        <form className="ml-auto">
          <input
            type="search"
            name="search"
            defaultValue={search || ""}
            placeholder="Search..."
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream-warm">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Tickets
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Draw Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {competitions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                  No competitions found
                </td>
              </tr>
            ) : (
              competitions.map((comp: typeof competitions[number]) => (
                <tr
                  key={comp.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {comp.titleEn}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                    {comp.slug}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    £{Number(comp.pricePounds).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {comp.ticketsSold}/{comp.maxTickets}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {comp.drawDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[comp.status] || ""
                      }`}
                    >
                      {comp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/competitions/${comp.id}/entries`}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
                      >
                        Entries
                      </Link>
                      <Link
                        href={`/${locale}/admin/competitions/${comp.id}/edit`}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
                      >
                        Edit
                      </Link>
                      <DeleteButton
                        competitionId={comp.id}
                        title={comp.titleEn}
                        locale={locale}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
