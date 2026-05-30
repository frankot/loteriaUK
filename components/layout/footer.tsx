"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

const paymentMethods = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"];

export default function Footer() {
  const t = useTranslations("footer");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const footerLinks: Record<string, string[]> = {
    competitions: ["allPrizes", "electronics", "jewellery", "fashion", "cashAwards"],
    company: ["aboutUs", "ourWinners", "liveDraws", "contact", "careers"],
    support: ["faq", "freePostalEntry", "terms", "privacy", "responsiblePlay"],
  };

  return (
    <footer className="bg-cream-warm px-4 md:px-8 lg:px-12 pt-14 md:pt-16 lg:pt-20 pb-8 md:pb-10 text-ink-soft">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 md:mb-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr] gap-10 md:gap-12 lg:gap-16">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4 flex items-center gap-2.5 font-serif text-lg md:text-xl">
              Golden Dream Draw
            </div>
            <p className="mb-5 md:mb-6 text-sm leading-relaxed text-ink-muted">
              {t("tagline")}
            </p>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-border-light bg-white px-3 py-1 md:px-3.5 md:py-1.5 text-[11px] md:text-xs font-semibold text-ink-muted"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 md:mb-5 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                {t(heading)}
              </h4>
              <ul className="flex flex-col gap-2.5 md:gap-3">
                {links.map((key) => (
                  <li key={key}>
                    <Link
                      href={`/${locale}/${key === "faq" ? "faq" : key === "freePostalEntry" ? "free-postal-entry" : key === "terms" ? "terms" : key === "privacy" ? "privacy" : "#"}`}
                      className="text-sm text-ink-soft transition-colors hover:text-gold-dark"
                    >
                      {t(key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 md:pt-8">
          <p className="text-[12px] md:text-[13px] text-ink-muted text-center sm:text-left">{t("copyright")}</p>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            {["18+ Only", t("sslEncrypted"), t("skillCompetition")].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded border border-border px-2.5 py-1 md:px-3.5 md:py-1.5 text-[10px] md:text-[11px] font-semibold text-ink-muted"
                >
                  {badge}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
