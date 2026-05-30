"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

const locales = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "pl", label: "PL", flag: "🇵🇱" },
  { code: "ro", label: "RO", flag: "🇷🇴" },
  { code: "bg", label: "BG", flag: "🇧🇬" },
];

interface LanguageSwitcherProps {
  dropUp?: boolean;
}

export default function LanguageSwitcher({ dropUp = false }: LanguageSwitcherProps) {
  const t = useTranslations("nav");
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params.locale as string) || "en";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Strip the current locale prefix to rebuild paths
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [open]);

  const current = locales.find((l) => l.code === currentLocale);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-gold"
        title={t("language")}
      >
        <span>{current?.flag}</span>{" "}
        {current?.label}{" "}
        <span className="ml-0.5 text-[10px] transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      <div
        className={`absolute right-0 z-50 min-w-[140px] rounded-lg border border-border bg-white py-1 shadow-card transition-all duration-150 ${
          dropUp
            ? "bottom-full mb-1"
            : "top-full mt-1"
        } ${
          open ? "visible opacity-100 translate-y-0" : "invisible opacity-0 translate-y-1"
        }`}
      >
        {locales.map((locale) => (
          <Link
            key={locale.code}
            href={`/${locale.code}${pathWithoutLocale}`}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-4 py-3 text-base transition-colors hover:bg-gold-pale ${
              locale.code === currentLocale
                ? "font-semibold text-ink bg-gold-pale/50"
                : "text-ink-soft"
            }`}
          >
            <span className="text-lg">{locale.flag}</span> {locale.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
