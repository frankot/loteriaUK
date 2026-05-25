"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { registerUser } from "@/actions/auth";

export default function RegisterPage() {
  const t = useTranslations("register");
  const commonT = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const email = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Compute 18 years ago for the max date
  const today = new Date();
  const maxDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate()
  )
    .toISOString()
    .split("T")[0];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!ageConfirmed) {
      setError(t("ageConfirm"));
      return;
    }

    setLoading(true);

    try {
      const result = await registerUser({
        name,
        address,
        phone,
        dateOfBirth,
        ageConfirmed,
      });

      if (result.success) {
        router.push(`/${locale}`);
      } else {
        setError(result.error || commonT("error"));
        if (result.fieldErrors) {
          setFieldErrors(result.fieldErrors);
        }
      }
    } catch {
      setError(commonT("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">
            {t("title")}
          </h1>
          <p className="mb-8 text-sm text-ink-muted">
            {t("subtitle")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t("fullName")}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale ${
                  fieldErrors.name ? "border-urgent" : "border-border"
                }`}
                required
              />
              {fieldErrors.name && (
                <p className="mt-1 text-xs text-urgent">{fieldErrors.name}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t("address")}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("addressPlaceholder")}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale ${
                  fieldErrors.address ? "border-urgent" : "border-border"
                }`}
                required
              />
              {fieldErrors.address && (
                <p className="mt-1 text-xs text-urgent">{fieldErrors.address}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t("phone")}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("phonePlaceholder")}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale ${
                  fieldErrors.phone ? "border-urgent" : "border-border"
                }`}
                required
              />
              {fieldErrors.phone && (
                <p className="mt-1 text-xs text-urgent">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">
                {t("dateOfBirth")}
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={maxDate}
                className={`w-full rounded-xl border px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale ${
                  fieldErrors.dateOfBirth ? "border-urgent" : "border-border"
                }`}
                required
              />
              {fieldErrors.dateOfBirth && (
                <p className="mt-1 text-xs text-urgent">
                  {fieldErrors.dateOfBirth}
                </p>
              )}
            </div>

            {/* Age Confirmation Checkbox */}
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border text-gold focus:ring-gold"
              />
              <span className="text-sm text-ink-soft">{t("ageConfirm")}</span>
            </label>
            {fieldErrors.ageConfirmed && (
              <p className="text-xs text-urgent">{fieldErrors.ageConfirmed}</p>
            )}

            {/* Global Error */}
            {error && !Object.keys(fieldErrors).length && (
              <p className="text-sm text-urgent">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-ink px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? commonT("saving") : t("submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
