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
    <footer className="bg-cream-warm px-12 lg:mt-20 pt-20 pb-10 text-ink-soft">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 grid grid-cols-[2fr_1fr_1fr_1fr] gap-16">
          <div>
            <div className="mb-4 flex items-center gap-2.5 font-serif text-xl">
              Golden Dream Draw
            </div>
            <p className="mb-6 text-sm leading-relaxed text-ink-muted">
              {t("tagline")}
            </p>
            <div className="flex flex-wrap gap-2.5">
              {paymentMethods.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-border-light bg-white px-3.5 py-1.5 text-xs font-semibold text-ink-muted"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-5 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                {t(heading)}
              </h4>
              <ul className="flex flex-col gap-3">
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

        <div className="flex items-center justify-between border-t border-border pt-8">
          <p className="text-[13px] text-ink-muted">{t("copyright")}</p>
          <div className="flex items-center gap-4">
            {["18+ Only", t("sslEncrypted"), t("skillCompetition")].map(
              (badge) => (
                <span
                  key={badge}
                  className="rounded border border-border px-3.5 py-1.5 text-[11px] font-semibold text-ink-muted"
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
