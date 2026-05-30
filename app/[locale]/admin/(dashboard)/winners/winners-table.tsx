"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  toggleWinnerNotified,
  toggleWinnerClaimed,
  resetWinner,
} from "@/actions/admin";
import { Mail, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface WinnerData {
  id: string;
  competitionId: string;
  entryId: string;
  notified: boolean;
  claimed: boolean;
  notifiedAt: string | null;
  claimedAt: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string | null };
  competition: { id: string; titleEn: string; slug: string };
  entry: { ticketId: string | null; type: string; ticketNumber: number | null };
}

interface WinnersTableProps {
  winners: WinnerData[];
  locale: string;
}

export function WinnersTable({ winners, locale }: WinnersTableProps) {
  const router = useRouter();
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [resetConfirmId, setResetConfirmId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleNotify(winnerId: string) {
    setLoadingIds((prev) => new Set(prev).add(winnerId));
    setError("");
    try {
      const result = await toggleWinnerNotified(winnerId);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError("Failed to send notification");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(winnerId);
        return next;
      });
    }
  }

  async function handleClaimToggle(winnerId: string) {
    setLoadingIds((prev) => new Set(prev).add(winnerId));
    setError("");
    try {
      const result = await toggleWinnerClaimed(winnerId);
      if (result.error) setError(result.error);
      else router.refresh();
    } catch {
      setError("Failed to update claim status");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(winnerId);
        return next;
      });
    }
  }

  async function handleReset(winnerId: string) {
    setLoadingIds((prev) => new Set(prev).add(winnerId));
    setError("");
    try {
      const result = await resetWinner(winnerId);
      if (result.error) setError(result.error);
      else {
        setResetConfirmId(null);
        router.refresh();
      }
    } catch {
      setError("Failed to reset winner");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(winnerId);
        return next;
      });
    }
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-xl bg-urgent/10 px-4 py-3">
          <p className="text-sm text-urgent">{error}</p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream-warm">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Competition
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Ticket
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Notified
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Claimed
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {winners.length === 0 ? (
              <EmptyState
                asTableCell
                colSpan={7}
                icon="trophy"
                message="No winners yet"
              />
            ) : (
              winners.map((w) => {
                const isLoading = loadingIds.has(w.id);
                return (
                  <tr
                    key={w.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/${locale}/admin/competitions/${w.competitionId}`}
                        className="font-medium text-ink hover:text-gold-dark"
                      >
                        {w.competition.titleEn}
                      </Link>
                      <div className="text-xs text-ink-muted">
                        {w.entry.type}
                        {w.entry.ticketNumber !== null && (
                          <span className="ml-1 font-mono text-gold-dark">
                            #{w.entry.ticketNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">
                        {w.user.name || "—"}
                      </div>
                      <div className="text-xs text-ink-muted">{w.user.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      {w.entry.ticketNumber !== null ? (
                        <span className="font-mono text-gold-dark">
                          #{w.entry.ticketNumber}
                        </span>
                      ) : (
                        <span className="text-ink-muted">Postal</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {w.notified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          <CheckCircle className="h-3 w-3" />
                          {w.notifiedAt ? formatDate(w.notifiedAt) : "Yes"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-urgent/10 px-2.5 py-0.5 text-xs font-medium text-urgent">
                          <XCircle className="h-3 w-3" />
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {w.claimed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                          <CheckCircle className="h-3 w-3" />
                          {w.claimedAt ? formatDate(w.claimedAt) : "Yes"}
                        </span>
                      ) : (
                        <span className="text-ink-muted text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted">
                      {formatDate(w.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Notify Toggle */}
                        <button
                          onClick={() => handleNotify(w.id)}
                          disabled={isLoading}
                          title={w.notified ? "Re-send notification" : "Send notification"}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            w.notified
                              ? "border-border text-ink-muted hover:border-gold hover:text-gold-dark"
                              : "border-gold-pale bg-gold-pale text-gold-dark hover:bg-gold hover:text-white"
                          }`}
                        >
                          <Mail className="h-3.5 w-3.5" />
                        </button>

                        {/* Claim Toggle */}
                        <button
                          onClick={() => handleClaimToggle(w.id)}
                          disabled={isLoading}
                          title={w.claimed ? "Mark as unclaimed" : "Mark as claimed"}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                            w.claimed
                              ? "border-border text-ink-muted hover:border-gold hover:text-gold-dark"
                              : "border-success/20 bg-success/10 text-success hover:bg-success/20"
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>

                        {/* Redraw / Reset */}
                        {resetConfirmId === w.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleReset(w.id)}
                              disabled={isLoading}
                              className="rounded-lg border border-urgent bg-urgent px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-urgent/90 disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setResetConfirmId(null)}
                              className="rounded-lg border border-border px-2 py-1.5 text-xs font-medium text-ink-muted hover:text-ink"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setResetConfirmId(w.id)}
                            disabled={isLoading}
                            title="Redraw — remove winner and reopen competition"
                            className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:border-urgent hover:text-urgent disabled:opacity-50"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
