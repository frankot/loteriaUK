"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const navT = useTranslations("nav");
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkedOut, setCheckedOut] = useState(false);
  const [error, setError] = useState("");

  // Check auth on mount — gate the question behind login
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  const handlePass = async (questionId: string, answer: string) => {
    if (checkedOut) return;
    setCheckedOut(true);

    const result = await createCheckoutSession(competitionId, slug, quantity, locale, questionId, answer);

    if (result.error) {
      // 401 should not happen since we check auth before showing the question
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

  // Show a centered spinner while checking auth
  if (!authChecked) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  // Not authenticated → prompt to sign in first
  if (!authenticated) {
    return (
      <div className="rounded-xl border border-border bg-white px-6 py-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold-pale">
          <svg viewBox="0 0 20 20" fill="none" className="h-6 w-6 text-gold-dark">
            <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h3 className="mb-2 font-serif text-lg font-semibold text-ink">Sign in to continue</h3>
        <p className="mb-6 text-sm text-ink-muted">
          You need to be signed in to purchase tickets for this competition.
        </p>
        <Link
          href={`/${locale}/login?redirect=/${locale}/competitions/${encodeURIComponent(slug)}/verify?quantity=${quantity}`}
          className="inline-block rounded-3xl bg-ink px-8 py-3 text-sm font-semibold text-white transition-all hover:bg-ink/90"
        >
          {navT("signIn")}
        </Link>
      </div>
    );
  }

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
