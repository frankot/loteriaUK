"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCompetition } from "@/actions/admin";

interface DeleteButtonProps {
  competitionId: string;
  title: string;
  locale: string;
}

export function DeleteButton({
  competitionId,
  title,
  locale,
}: DeleteButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const result = await deleteCompetition(competitionId);
    if (result.success) {
      router.refresh();
    }
    setLoading(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-urgent">Delete &quot;{title.slice(0, 20)}...&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="rounded bg-urgent px-2 py-0.5 text-xs font-medium text-white hover:bg-urgent/80 disabled:opacity-50"
        >
          Yes
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded border border-border px-2 py-0.5 text-xs text-ink-muted hover:border-gold"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-lg border border-urgent/30 px-2.5 py-1 text-xs font-medium text-urgent transition-colors hover:bg-urgent/10"
    >
      Delete
    </button>
  );
}
