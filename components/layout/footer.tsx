"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

const paymentMethods = ["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"];

export default function Footer() {
  const t = useTranslations("footer");
  const params = useParams();
  const locale = (params.locale as string) || "en";

  const footerLinks: Record<string, Array<{ key: string; href: string }>> = {
    competitions: [
      { key: "allPrizes", href: `/${locale}/competitions` },
      { key: "electronics", href: `/${locale}/competitions?category=electronics` },
      { key: "jewellery", href: `/${locale}/competitions?category=jewellery` },
      { key: "fashion", href: `/${locale}/competitions?category=fashion` },
      { key: "cashAwards", href: `/${locale}/competitions?category=cash` },
    ],
    company: [
      { key: "aboutUs", href: `/${locale}/` },
      { key: "ourWinners", href: `/${locale}/#winners` },
      { key: "liveDraws", href: `/${locale}/#how-it-works` },
    ],
    support: [
      { key: "faq", href: `/${locale}/#faq` },
      { key: "freePostalEntry", href: `/${locale}/free-postal-entry` },
      { key: "terms", href: `/${locale}/terms` },
      { key: "privacy", href: `/${locale}/privacy` },
    ],
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

            {/* Cashflows secure badge — below payment options */}
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-[10px] md:text-[11px] font-semibold text-ink-muted">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              <span>{t("securePayments")}</span>
            </div>

            {/* Social links */}
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.facebook.com/share/1PoCwARpRn/?mibextid=wwXIfr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-white text-ink-muted transition-all hover:border-gold hover:text-gold-dark hover:shadow-sm"
                aria-label="Facebook"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://www.instagram.com/goldendreamdraw?igsh=ZGRzejZsMXlnN3lx&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border-light bg-white text-ink-muted transition-all hover:border-gold hover:text-gold-dark hover:shadow-sm"
                aria-label="Instagram"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            </div>


          </div>

          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="mb-4 md:mb-5 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                {t(heading)}
              </h4>
              <ul className="flex flex-col gap-2.5 md:gap-3">
                {links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-soft transition-colors hover:text-gold-dark"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 md:pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
      </div>
    </footer>
  );
}
