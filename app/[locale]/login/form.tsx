"use client";

import { useState, FormEvent } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

export function LoginForm() {
  const t = useTranslations("login");
  const tc = useTranslations("common");
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params.locale as string) || "en";
  const redirect = searchParams.get("redirect") || "";

  const [email, setEmail] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!ageConfirmed) {
      setError(t("ageConfirmRequired"));
      return;
    }

    if (!email.trim()) {
      setError(t("emailPlaceholder"));
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || tc("error"));
        return;
      }

      const dest = redirect
        ? `/${locale}/login/verify?email=${encodeURIComponent(email.trim())}&redirect=${encodeURIComponent(redirect)}`
        : `/${locale}/login/verify?email=${encodeURIComponent(email.trim())}`;
      router.push(dest);
    } catch {
      setError(tc("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">
            {t("title")}
          </h1>
          <p className="mb-8 text-sm text-ink-muted">{t("sendCode")}</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-pale"
                autoFocus
                required
              />
            </div>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
              />
              <span className="text-sm text-ink-soft">{t("ageConfirm")}</span>
            </label>

            {error && (
              <p className="text-sm text-urgent">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? tc("loading") : t("sendCode")}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            <Link href={`/${locale}`} className="underline hover:text-ink">
              {tc("back")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
