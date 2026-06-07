"use client";

import { useState, useRef, FormEvent, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";

export default function VerifyPage() {
  const t = useTranslations("login");
  const commonT = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params.locale as string) || "en";
  const email = searchParams.get("email") || "";
  const redirect = searchParams.get("redirect") || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Auto-submit when all 6 digits filled
  useEffect(() => {
    if (code.every((d) => d !== "") && !loading) {
      handleVerify(code.join(""));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  function handlePaste(e: React.ClipboardEvent) {
    const pastedText = e.clipboardData.getData("text");
    const digits = pastedText.replaceAll(/\D/g, "").slice(0, 6).split("");
    if (digits.length === 0 || digits.some((d) => !d)) return;

    e.preventDefault();

    const newCode = ["", "", "", "", "", ""];
    digits.forEach((d, i) => {
      newCode[i] = d;
    });
    setCode(newCode);

    // Focus the last filled input
    const focusIdx = Math.min(digits.length - 1, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  function handleChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newCode = [...code];
      digits.forEach((d, i) => {
        if (index + i < 6) newCode[index + i] = d;
      });
      setCode(newCode);
      // Focus last filled or next empty
      const nextIdx = Math.min(index + digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(fullCode?: string) {
    const codeToVerify = fullCode || code.join("");
    if (codeToVerify.length !== 6 || loading) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || commonT("error"));
        // Reset code on invalid
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      if (data.needsRegistration) {
        const regParams = new URLSearchParams();
        regParams.set("email", email);
        if (redirect) regParams.set("redirect", redirect);
        router.push(`/${locale}/register?${regParams.toString()}`);
        router.refresh();
      } else if (data.role === "admin") {
        router.push(`/${locale}/admin`);
        router.refresh();
      } else {
        router.push(redirect || `/${locale}`);
        router.refresh();
      }
    } catch {
      setError(commonT("error"));
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    handleVerify();
  }

  if (!email) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-ink-muted">{commonT("error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
          <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">
            {t("title")}
          </h1>
          <p className="mb-8 text-sm text-ink-muted">
            {t("checkEmail")}{" "}
            <span className="font-medium text-ink">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="h-14 w-12 rounded-xl border border-border text-center text-xl font-semibold text-ink focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-pale"
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {error && (
              <p className="text-center text-sm text-urgent">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || code.some((d) => !d)}
              className="w-full rounded-xl bg-ink px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? commonT("loading") : t("verify")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
