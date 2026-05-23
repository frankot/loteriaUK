"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import TicketSelector from "@/components/public/ticket-selector";
import SkillQuestion from "@/components/public/skill-question";
import { createCheckoutSession } from "@/actions/purchases";

interface Question {
  id: string;
  questionEn: string;
  optionAEn: string;
  optionBEn: string;
  optionCEn: string | null;
  optionDEn: string | null;
  correctOption: string;
}

interface PurchaseSectionProps {
  competitionId: string;
  slug: string;
  price: number;
  maxAvailable: number;
  locale: string;
  question: Question | null;
}

export default function PurchaseSection({
  competitionId,
  slug,
  price,
  maxAvailable,
  locale,
  question,
}: PurchaseSectionProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [questionPassed, setQuestionPassed] = useState(false);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState("");

  const handleBuy = useCallback(async () => {
    setError("");
    setBuying(true);

    try {
      const result = await createCheckoutSession(competitionId, slug, quantity);

      if (result.error) {
        if (result.status === 401) {
          router.push(`/${locale}/login?redirect=/${locale}/competitions/${slug}`);
          return;
        }
        setError(result.error);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBuying(false);
    }
  }, [competitionId, slug, quantity, locale, router]);

  return (
    <div className="space-y-6">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
          1 · Select Tickets
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Ticket Selector */}
      <TicketSelector
        price={price}
        maxAvailable={maxAvailable}
        quantity={quantity}
        onChange={setQuantity}
        disabled={!questionPassed}
      />

      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
          2 · Answer Skill Question
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Skill Question */}
      <SkillQuestion
        competitionId={competitionId}
        initialQuestion={question}
        onPass={() => setQuestionPassed(true)}
      />

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={!questionPassed || buying}
        className={`w-full rounded-3xl px-6 py-4 text-[15px] font-semibold transition-all ${
          questionPassed
            ? "bg-gold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
            : "cursor-not-allowed bg-border-light text-ink-muted"
        }`}
      >
        {buying ? (
          <span className="flex items-center justify-center gap-2">
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </span>
        ) : !questionPassed ? (
          "Answer the question to unlock"
        ) : (
          `Buy ${quantity} Ticket${quantity > 1 ? "s" : ""} — £${(price * quantity).toFixed(2)}`
        )}
      </button>

      {error && (
        <div className="rounded-xl border border-urgent/20 bg-urgent/5 px-5 py-4 text-sm text-urgent">
          {error}
        </div>
      )}
    </div>
  );
}
