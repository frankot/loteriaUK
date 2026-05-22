"use client";

import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

const locales = [
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "pl", label: "PL", flag: "🇵🇱" },
  { code: "ro", label: "RO", flag: "🇷🇴" },
  { code: "bg", label: "BG", flag: "🇧🇬" },
];

export default function LanguageSwitcher() {
  const t = useTranslations("nav");
  const params = useParams();
  const pathname = usePathname();
  const currentLocale = (params.locale as string) || "en";

  // Strip the current locale prefix to rebuild paths
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, "") || "/";

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-[13px] text-ink-muted transition-colors hover:border-gold"
        title={t("language")}
      >
        <span>
          {locales.find((l) => l.code === currentLocale)?.flag}
        </span>{" "}
        {locales.find((l) => l.code === currentLocale)?.label}{" "}
        <span className="ml-0.5 text-[10px]">▾</span>
      </button>

      <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-border bg-white py-1 opacity-0 shadow-card transition-all group-hover:visible group-hover:opacity-100">
        {locales.map((locale) => (
          <Link
            key={locale.code}
            href={`/${locale.code}${pathWithoutLocale}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-gold-pale ${
              locale.code === currentLocale
                ? "font-semibold text-ink"
                : "text-ink-soft"
            }`}
          >
            <span>{locale.flag}</span> {locale.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
