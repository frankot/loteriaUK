"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPostalEntry } from "@/actions/admin";
import { X } from "lucide-react";

interface AddPostalEntryButtonProps {
  competitionId: string;
  locale: string;
}

export function AddPostalEntryButton({
  competitionId,
  locale,
}: AddPostalEntryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [answer, setAnswer] = useState("A");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const fd = new FormData();
      fd.set("name", name);
      fd.set("email", email);
      fd.set("address", address);
      fd.set("dateOfBirth", dateOfBirth);
      fd.set("answer", answer);

      const result = await createPostalEntry(competitionId, fd);

      if (result.success) {
        setSuccess(true);
        setName("");
        setEmail("");
        setAddress("");
        setDateOfBirth("");
        setAnswer("A");
        router.refresh();
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || "Failed to add entry");
      }
    } catch {
      setError("Failed to add entry");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
      >
        + Postal Entry
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-featured">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold text-ink">
                Add Postal Entry
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-ink-muted hover:bg-cream-warm hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Address *
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Answer *
                </label>
                <select
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale"
                >
                  {["A", "B", "C", "D"].map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {success && (
                <div className="rounded-xl bg-success/10 px-4 py-3">
                  <p className="text-sm font-medium text-success">
                    Postal entry added successfully!
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-xl bg-urgent/10 px-4 py-3">
                  <p className="text-sm text-urgent">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Postal Entry"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
