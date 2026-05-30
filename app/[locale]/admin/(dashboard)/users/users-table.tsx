"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { X, History, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  entriesCount: number;
  createdAt: string;
}

interface EntryHistory {
  id: string;
  competition: { titleEn: string; slug: string };
  ticket: { number: number } | null;
  type: string;
  answerCorrect: boolean | null;
  createdAt: string;
}

interface UsersTableProps {
  users: UserRow[];
  locale: string;
  totalPages: number;
  currentPage: number;
  searchParam?: string;
}

export function UsersTable({
  users,
  locale,
  totalPages,
  currentPage,
  searchParam,
}: UsersTableProps) {
  const [modalUser, setModalUser] = useState<UserRow | null>(null);
  const [entries, setEntries] = useState<EntryHistory[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const fetchEntries = useCallback(async (userId: string) => {
    setLoadingEntries(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/entries`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
      } else {
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setLoadingEntries(false);
    }
  }, []);

  useEffect(() => {
    if (modalUser) {
      fetchEntries(modalUser.id);
    } else {
      setEntries([]);
    }
  }, [modalUser, fetchEntries]);

  // Close modal on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalUser(null);
    };
    if (modalUser) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [modalUser]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  return (
    <>
      {/* Search */}
      <form className="mb-6">
        <input
          type="search"
          name="search"
          defaultValue={searchParam || ""}
          placeholder="Search by email or name..."
          className="w-full max-w-sm rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale"
        />
      </form>

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
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Entries
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Joined
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <EmptyState
                asTableCell
                colSpan={7}
                icon="search"
                message="No users found"
              />
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {user.email}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {user.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {user.phone || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setModalUser(user)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gold-pale px-2.5 py-0.5 text-xs font-medium text-gold-dark transition-colors hover:bg-gold hover:text-white"
                    >
                      <History className="h-3 w-3" />
                      {user.entriesCount}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-urgent/10 text-urgent"
                          : "bg-cream-warm text-ink-muted"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-muted">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/users/${user.id}/edit`}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
                      >
                        Edit
                      </Link>
                    </div>
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams();
            params.set("page", String(p));
            if (searchParam) params.set("search", searchParam);
            return (
              <a
                key={p}
                href={`?${params.toString()}`}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                  p === currentPage
                    ? "bg-ink text-white"
                    : "border border-border bg-white text-ink-muted hover:border-gold"
                }`}
              >
                {p}
              </a>
            );
          })}
        </div>
      )}

      {/* Entry History Modal */}
      {modalUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalUser(null);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl border border-border bg-white shadow-featured">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink">
                  Entry History
                </h2>
                <p className="text-sm text-ink-muted">
                  {modalUser.name || modalUser.email}
                </p>
              </div>
              <button
                onClick={() => setModalUser(null)}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-cream-warm hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              {loadingEntries ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gold-dark" />
                </div>
              ) : entries.length === 0 ? (
                <div className="py-8 text-center">
                  <History className="mx-auto mb-2 h-8 w-8 text-ink-muted/40" />
                  <p className="text-sm text-ink-muted">No entries yet</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-lg border border-border-light p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-ink truncate">
                            {entry.competition.titleEn}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            {entry.ticket && (
                              <span className="font-mono text-gold-dark">
                                #{entry.ticket.number}
                              </span>
                            )}
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                entry.type === "PAID"
                                  ? "bg-gold-pale text-gold-dark"
                                  : "bg-cream-warm text-ink-muted"
                              }`}
                            >
                              {entry.type}
                            </span>
                            {entry.answerCorrect !== null && (
                              <span
                                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                  entry.answerCorrect
                                    ? "bg-success/10 text-success"
                                    : "bg-urgent/10 text-urgent"
                                }`}
                              >
                                {entry.answerCorrect ? "Correct" : "Incorrect"}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="flex-shrink-0 text-xs text-ink-muted">
                          {formatDate(entry.createdAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
