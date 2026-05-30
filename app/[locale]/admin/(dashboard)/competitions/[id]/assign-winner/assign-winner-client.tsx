"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { lookupTicket, assignWinner } from "@/actions/admin";
import { ArrowLeft, Search, CheckCircle, XCircle, Trophy, AlertTriangle } from "lucide-react";
import type { TicketLookupResult } from "@/actions/admin";

interface AssignWinnerClientProps {
  locale: string;
  competitionId: string;
}

export function AssignWinnerClient({ locale, competitionId }: AssignWinnerClientProps) {
  const router = useRouter();

  const [ticketNumber, setTicketNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [lookupResult, setLookupResult] = useState<TicketLookupResult | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [assigned, setAssigned] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const num = parseInt(ticketNumber);
    if (!num || num < 1) return;

    setSearching(true);
    setLookupResult(null);

    try {
      const result = await lookupTicket(competitionId, num);
      setLookupResult(result);
    } catch {
      setLookupResult({ error: "Failed to look up ticket" });
    } finally {
      setSearching(false);
    }
  }

  async function handleAssign() {
    if (!lookupResult?.ticket) return;
    setConfirming(true);
    try {
      const result = await assignWinner(
        competitionId,
        lookupResult.ticket.id,
        lookupResult.ticket.entry.id,
        lookupResult.ticket.user.id
      );

      if (result.success) {
        setAssigned(true);
        setTimeout(() => {
          router.push(`/${locale}/admin/competitions/${competitionId}`);
        }, 3000);
      } else {
        setLookupResult({ ...lookupResult, error: result.error || "Assignment failed" });
      }
    } catch {
      setLookupResult({ ...lookupResult, error: "Failed to assign winner" });
    } finally {
      setConfirming(false);
    }
  }

  if (assigned) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <Trophy className="h-10 w-10 text-success" />
          </div>
        </div>
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Winner Assigned!
        </h1>
        <p className="mt-3 text-ink-muted">
          {lookupResult?.ticket?.user.name || lookupResult?.ticket?.user.email} has been
          assigned as the winner. The competition is now marked as DRAWN.
        </p>
        <p className="mt-1 text-sm text-ink-muted">Redirecting to competition details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      {/* Breadcrumb */}
      <nav className="mb-6 text-xs text-ink-muted">
        <Link href={`/${locale}/admin/competitions`} className="hover:text-gold-dark">
          Competitions
        </Link>
        <span className="mx-1.5">/</span>
        <Link
          href={`/${locale}/admin/competitions/${competitionId}`}
          className="hover:text-gold-dark"
        >
          Details
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink">Assign Winner</span>
      </nav>

      <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">
        Assign Winner
      </h1>
      <p className="mb-8 text-ink-muted">
        Enter the winning ticket number from the live draw to confirm the winner.
      </p>

      {/* Search Form */}
      <form onSubmit={handleLookup} className="mb-8">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              type="number"
              min="1"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
              placeholder="Enter winning ticket number..."
              className="w-full rounded-xl border border-border py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={searching || !ticketNumber}
            className="rounded-xl bg-gold px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? "Searching..." : "Look Up"}
          </button>
        </div>
      </form>

      {/* Lookup Result */}
      {lookupResult && (
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          {lookupResult.error && !lookupResult.ticket ? (
            <div className="p-6">
              <div className="mb-4 flex items-start gap-3 rounded-xl bg-urgent/10 p-4">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-urgent" />
                <div>
                  <p className="text-sm font-medium text-urgent">
                    Cannot assign this ticket
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    {lookupResult.error}
                  </p>
                </div>
              </div>

              {lookupResult.competition && (
                <div className="rounded-lg bg-cream-warm p-4">
                  <p className="text-xs text-ink-muted">
                    Competition: {lookupResult.competition.titleEn}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Status: {lookupResult.competition.status}
                  </p>
                </div>
              )}
            </div>
          ) : lookupResult.ticket ? (
            <div>
              {/* Success preview */}
              <div className="border-b border-border bg-gold-pale/30 p-6">
                <div className="mb-3 flex items-center gap-2.5">
                  <CheckCircle className="h-5 w-5 text-success" />
                  <span className="text-sm font-semibold text-success">
                    Valid Ticket — Ready to Assign
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Ticket Info */}
                <div className="mb-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-cream-warm p-4">
                    <span className="block text-xs font-medium text-ink-muted">
                      Ticket Number
                    </span>
                    <span className="mt-1 font-mono text-2xl font-bold text-gold-dark">
                      #{lookupResult.ticket.number}
                    </span>
                  </div>
                  <div className="rounded-lg bg-cream-warm p-4">
                    <span className="block text-xs font-medium text-ink-muted">
                      Entry Type
                    </span>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        lookupResult.ticket.entry.type === "PAID"
                          ? "bg-gold-pale text-gold-dark"
                          : "bg-cream-warm text-ink-muted"
                      }`}
                    >
                      {lookupResult.ticket.entry.type}
                    </span>
                  </div>
                  <div className="col-span-2 rounded-lg bg-cream-warm p-4">
                    <span className="block text-xs font-medium text-ink-muted">
                      User
                    </span>
                    <span className="mt-1 block font-medium text-ink">
                      {lookupResult.ticket.user.name || "—"}
                    </span>
                    <span className="block text-sm text-ink-soft">
                      {lookupResult.ticket.user.email}
                    </span>
                  </div>
                  <div className="col-span-2 rounded-lg bg-cream-warm p-4">
                    <span className="block text-xs font-medium text-ink-muted">
                      Answer
                    </span>
                    <span
                      className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium ${
                        lookupResult.ticket.entry.answerCorrect
                          ? "bg-success/10 text-success"
                          : "bg-urgent/10 text-urgent"
                      }`}
                    >
                      {lookupResult.ticket.entry.answerCorrect ? (
                        <CheckCircle className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {lookupResult.ticket.entry.answerCorrect === true
                        ? "Correct"
                        : lookupResult.ticket.entry.answerCorrect === false
                          ? "Incorrect"
                          : "Not evaluated"}
                    </span>
                  </div>
                </div>

                {/* Warning */}
                <div className="mb-6 flex items-start gap-3 rounded-xl bg-urgent/10 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-urgent" />
                  <div>
                    <p className="text-sm font-medium text-urgent">
                      This action cannot be undone
                    </p>
                    <p className="mt-1 text-sm text-ink-soft">
                      Assigning this winner will mark the competition as DRAWN and
                      send a notification email to the winner.
                    </p>
                  </div>
                </div>

                {/* Error after confirm attempt */}
                {lookupResult.error && (
                  <div className="mb-6 rounded-xl bg-urgent/10 p-4">
                    <p className="text-sm text-urgent">{lookupResult.error}</p>
                  </div>
                )}

                {/* Confirm Button */}
                <button
                  onClick={handleAssign}
                  disabled={confirming}
                  className="w-full rounded-xl bg-ink px-6 py-4 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {confirming ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Assigning...
                    </span>
                  ) : (
                    <>
                      <Trophy className="-mt-0.5 mr-2 inline-block h-4 w-4" />
                      Confirm Winner —{" "}
                      {lookupResult.ticket.user.name || lookupResult.ticket.user.email}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Back Link */}
      <div className="mt-6">
        <Link
          href={`/${locale}/admin/competitions/${competitionId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Competition
        </Link>
      </div>
    </div>
  );
}
