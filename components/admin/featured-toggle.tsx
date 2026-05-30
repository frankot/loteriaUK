"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleFeatured } from "@/actions/admin";
import { Star } from "lucide-react";

interface FeaturedToggleProps {
  competitionId: string;
  currentlyFeatured: boolean;
  /** Name and id of the currently featured competition (if it's not this one) */
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
      className={`rounded-xl border p-5 shadow-card transition-colors ${
        isFeatured
          ? "border-gold bg-gold-pale/20"
          : "border-border bg-white"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Star
              className={`h-5 w-5 ${
                isFeatured ? "fill-gold text-gold" : "text-ink-muted"
              }`}
            />
            <span className="font-medium text-ink">Featured Competition</span>
          </div>

          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
            {isFeatured
              ? "This competition is currently featured on the homepage hero section."
              : "Feature this competition to show it in the homepage hero section."}
          </p>

          <p className="mt-1 text-xs text-ink-muted">
            <strong>Note:</strong> Only one competition can be featured at a
            time. Featuring this one will unfeature any other featured
            competition.
          </p>

          {otherFeatured && !isFeatured && (
            <div className="mt-3 rounded-lg border border-border-light bg-cream-warm/50 px-3 py-2">
              <p className="text-xs text-ink-muted">
                Currently featured:
              </p>
              <Link
                href={`/${locale}/admin/competitions/${otherFeatured.id}`}
                className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-gold-dark underline underline-offset-2 hover:text-gold"
              >
                <Star className="h-3 w-3 fill-gold text-gold" />
                {otherFeatured.titleEn}
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={handleToggle}
          disabled={loading}
          className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isFeatured
              ? "border border-border bg-white text-ink-muted hover:border-urgent/50 hover:text-urgent"
              : "bg-gold text-white hover:bg-gold-dark"
          }`}
        >
          {loading
            ? "..."
            : isFeatured
              ? "Unfeature"
              : "Feature"}
        </button>
      </div>
    </div>
  );
}
