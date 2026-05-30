"use client";

import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";

interface Entry {
  id: string;
  type: string;
  answerCorrect: boolean | null;
  createdAt: string;
  user: { email: string; name: string | null };
  ticket: { number: number } | null;
}

interface EntriesTableProps {
  entries: Entry[];
  competitionId: string;
  locale: string;
  totalPages: number;
  currentPage: number;
  searchParam?: string;
  typeParam?: string;
  correctParam?: string;
  counts: {
    paidCount: number;
    postalCount: number;
    correctCount: number;
    incorrectCount: number;
  };
}

export function EntriesTable({
  entries,
  locale,
  totalPages,
  currentPage,
  searchParam,
  typeParam,
  correctParam,
  counts,
}: EntriesTableProps) {
  const router = useRouter();

  function buildUrl(p: number) {
    const params = new URLSearchParams();
    if (searchParam) params.set("search", searchParam);
    if (typeParam && typeParam !== "all") params.set("type", typeParam);
    if (correctParam) params.set("correct", correctParam);
    params.set("page", String(p));
    return `?${params.toString()}`;
  }

  const filterTabs = [
    { key: "type", value: "all", label: `All (${counts.paidCount + counts.postalCount})` },
    { key: "type", value: "PAID", label: `Paid (${counts.paidCount})` },
    { key: "type", value: "POSTAL", label: `Postal (${counts.postalCount})` },
  ];

  const correctTabs = [
    { value: "", label: `All` },
    { value: "true", label: `Correct (${counts.correctCount})` },
    { value: "false", label: `Incorrect (${counts.incorrectCount})` },
  ];

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div className="flex gap-1.5">
          {filterTabs.map((tab) => {
            const isActive = (typeParam || "all") === tab.value;
            const params = new URLSearchParams();
            if (tab.value !== "all") params.set("type", tab.value);
            if (correctParam) params.set("correct", correctParam);
            if (searchParam) params.set("search", searchParam);
            const href = params.toString() ? `?${params.toString()}` : "?";
            return (
              <a
                key={tab.value}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-ink text-white"
                    : "border border-border bg-white text-ink-muted hover:border-gold"
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex gap-1.5">
          {correctTabs.map((tab) => {
            const isActive = (correctParam || "") === tab.value;
            const params = new URLSearchParams();
            if (tab.value) params.set("correct", tab.value);
            if (typeParam && typeParam !== "all") params.set("type", typeParam);
            if (searchParam) params.set("search", searchParam);
            const href = params.toString() ? `?${params.toString()}` : "?";
            return (
              <a
                key={tab.value}
                href={href}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-success/10 text-success border border-success/20"
                    : tab.value === "false" && isActive
                    ? "bg-urgent/10 text-urgent border border-urgent/20"
                    : "border border-border bg-white text-ink-muted hover:border-gold"
                }`}
              >
                {tab.label}
              </a>
            );
          })}
        </div>
        <form className="ml-auto">
          <input
            type="search"
            name="search"
            defaultValue={searchParam || ""}
            placeholder="Search by email or name..."
            className="rounded-xl border border-border bg-white px-4 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale"
          />
        </form>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream-warm">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Ticket #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Answer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <EmptyState
                asTableCell
                colSpan={6}
                icon="search"
                message="No entries found"
              />
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {entry.user.email}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {entry.user.name || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-ink-soft">
                    {entry.ticket ? `#${entry.ticket.number}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.type === "PAID"
                          ? "bg-gold-pale text-gold-dark"
                          : "bg-cream-warm text-ink-muted"
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.answerCorrect === null ? (
                      <span className="text-ink-muted">—</span>
                    ) : entry.answerCorrect ? (
                      <span className="inline-flex rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-urgent/10 px-2 py-0.5 text-xs font-medium text-urgent">
                        Incorrect
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-muted text-xs">
                    {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={buildUrl(p)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                p === currentPage
                  ? "bg-ink text-white"
                  : "border border-border bg-white text-ink-muted hover:border-gold"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
