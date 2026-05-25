"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateProfile } from "@/actions/auth";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface ProfileSettingsFormProps {
  locale: string;
  defaultValues: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
}

export function ProfileSettingsForm({
  locale,
  defaultValues,
}: ProfileSettingsFormProps) {
  const t = useTranslations("profile");
  const commonT = useTranslations("common");
  const router = useRouter();

  const [name, setName] = useState(defaultValues.name);
  const [address, setAddress] = useState(defaultValues.address);
  const [phone, setPhone] = useState(defaultValues.phone);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("address", address);
      formData.set("phone", phone);

      const result = await updateProfile(formData);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => router.push(`/${locale}/profile`), 1200);
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email (read-only) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {t("email")}
        </label>
        <input
          type="email"
          value={defaultValues.email}
          readOnly
          className="w-full rounded-xl border border-border bg-cream-warm px-4 py-3 text-sm text-ink-muted cursor-not-allowed"
        />
      </div>

      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {t("name")}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          className={`w-full rounded-xl border px-4 py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-gold-pale ${
            fieldErrors.phone ? "border-urgent" : "border-border"
          }`}
          required
        />
        {fieldErrors.phone && (
          <p className="mt-1 text-xs text-urgent">{fieldErrors.phone}</p>
        )}
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2.5 rounded-xl bg-success/10 px-4 py-3">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-success" />
          <p className="text-sm font-medium text-success">
            {t("updatedSuccess")}
          </p>
        </div>
      )}

      {error && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-urgent">{error}</p>
      )}

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <Link
          href={`/${locale}/profile`}
          className="flex items-center gap-1.5 rounded-xl border border-border px-5 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          {commonT("back")}
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-ink px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? commonT("saving") : commonT("save")}
        </button>
      </div>
    </form>
  );
}
