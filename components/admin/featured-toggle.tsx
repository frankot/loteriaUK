"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleFeatured } from "@/actions/admin";
import { Star } from "lucide-react";

interface FeaturedToggleProps {
  competitionId: string;
  currentlyFeatured: boolean;
  otherFeatured?: { id: string; titleEn: string } | null;
  locale: string;
}

export default function FeaturedToggle({
  competitionId,
  currentlyFeatured,
  otherFeatured,
  locale,
}: FeaturedToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFeatured, setIsFeatured] = useState(currentlyFeatured);

  async function handleToggle() {
    setLoading(true);
    try {
      const result = await toggleFeatured(competitionId);
      if (result.success) {
        setIsFeatured(!isFeatured);
        router.refresh();
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border p-5 shadow-card transition-colors ${
        isFeatured
          ? "border-gold bg-gold-pale/20"
          : "border-border bg-white"
      }`}
    >
      {/* Icon */}
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
          isFeatured ? "bg-gold" : "bg-cream-warm"
        }`}
      >
        <Star
          className={`h-5 w-5 ${
            isFeatured ? "text-white" : "text-ink-muted"
          }`}
        />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-ink">Featured</span>
          {otherFeatured && !isFeatured && (
            <span className="text-xs text-ink-muted">
              Currently:{" "}
              <Link
                href={`/${locale}/admin/competitions/${otherFeatured.id}`}
                className="font-medium text-gold-dark underline underline-offset-2 hover:text-gold"
              >
                {otherFeatured.titleEn}
              </Link>
            </span>
          )}
        </div>
        <div className="text-xs text-ink-muted">
          {isFeatured
            ? "Shown in homepage hero section"
            : "Show on homepage as featured prize"}
        </div>
      </div>

      {/* Toggle button */}
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          isFeatured
            ? "border border-border bg-white text-ink-muted hover:border-urgent/50 hover:text-urgent"
            : "bg-gold text-white hover:bg-gold-dark"
        }`}
      >
        {loading ? "..." : isFeatured ? "Unfeature" : "Feature"}
      </button>
    </div>
  );
}
