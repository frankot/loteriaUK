"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import SkillQuestion from "@/components/public/skill-question";
import { createCheckoutSession } from "@/actions/purchases";

interface VerifyClientProps {
  competitionId: string;
  slug: string;
  quantity: number;
  locale: string;
}

export function VerifyClient({ competitionId, slug, quantity, locale }: VerifyClientProps) {
  const t = useTranslations("verify");
  const router = useRouter();
  const [checkedOut, setCheckedOut] = useState(false);
  const [error, setError] = useState("");

  const handlePass = async (questionId: string, answer: string) => {
    if (checkedOut) return;
    setCheckedOut(true);

    const result = await createCheckoutSession(competitionId, slug, quantity, locale, questionId, answer);

    if (result.error) {
      if (result.status === 401) {
        router.push(`/${locale}/login?redirect=/${locale}/competitions/${slug}/verify?quantity=${quantity}`);
        return;
      }
      setError(result.error);
      setCheckedOut(false);
      return;
    }

    if (result.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="space-y-5">
      <SkillQuestion
        competitionId={competitionId}
        initialQuestion={null}
        onPass={handlePass}
      />

      {checkedOut && !error && (
        <div className="rounded-xl border border-gold/20 bg-gold-pale/30 px-5 py-4 text-center">
          <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
          <p className="mt-2 text-sm font-medium text-gold-dark">{t("loading")}</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-urgent/20 bg-urgent/5 px-5 py-4">
          <p className="text-sm text-urgent">{error}</p>
          <button
            onClick={() => { setError(""); setCheckedOut(false); }}
            className="mt-2 text-sm font-semibold text-gold-dark underline"
          >
            {t("tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
