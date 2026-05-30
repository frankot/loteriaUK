import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getHeroCompetition } from "@/lib/queries";

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function formatDrawDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations("hero");
  const featured = await getHeroCompetition();

  const fallbackImage = "/images/cartier.webp";

  return (
    <section className="bg-cream px-4 md:px-8 lg:px-12 pt-10 md:pt-16 lg:pt-20 pb-16 md:pb-24 lg:pb-[120px]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-center gap-10 lg:gap-20">
          {/* Left column */}
          <div className="animate-fade-in-up order-1">
            <div className="mb-5 md:mb-6 inline-flex items-center gap-2 rounded-full bg-gold-pale px-3 md:px-4 py-1.5 text-[12px] md:text-[13px] font-semibold tracking-wide text-gold-dark uppercase">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-gold" />
              {t("trustedBadge")}
            </div>

            <h1 className="font-serif text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] leading-[1.1] font-semibold tracking-tight">
              {t("titleLine1")}<br />
              <em className="text-gold font-bold">{t("titleLine2")}</em>
            </h1>

            <p className="mt-4 md:mt-5 mb-7 md:mb-9 max-w-[440px] text-[15px] md:text-[17px] leading-relaxed text-ink-soft">
              {t("subtitle")}
            </p>

            <div className="mb-8 md:mb-12 flex flex-col sm:flex-row gap-3">
              <Link
                href="#trending"
                className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-[14px] md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
              >
                {t("cta")} →
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-3xl border border-border bg-transparent px-6 md:px-8 py-3 md:py-3.5 text-[14px] md:text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
              >
                {t("howItWorks")}
              </Link>
            </div>

            {/* Stats row */}
            <div className="flex gap-6 sm:gap-8 border-t border-border pt-6 md:pt-8">
              {[
                ["£2.4M+", t("prizesAwarded")],
                ["48,000+", t("happyWinners")],
                ["4.9 ★", t("trustpilot")],
              ].map(([num, label]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="font-serif text-[22px] sm:text-[24px] md:text-[28px] leading-none font-semibold text-gold-dark">{num}</span>
                  <span className="text-[11px] md:text-[13px] text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Featured Prize Card — appears above text on mobile */}
          {featured ? (
            <Link
              href={`/${locale}/competitions/${featured.slug}`}
              className="block animate-fade-in-up order-0 lg:order-1 overflow-hidden rounded-[16px] md:rounded-[20px] bg-white shadow-featured transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover [animation-delay:200ms]"
            >
            <div className="relative flex h-[200px] sm:h-[240px] md:h-[280px] items-center justify-center overflow-hidden">
              <span className="absolute top-4 left-4 md:top-5 md:left-5 rounded-full bg-gold px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
                🔥 {t("trendingBadge")}
              </span>
              <Image
                src={featured?.prizeImageUrl || fallbackImage}
                alt={featured?.titleEn || "Featured Prize"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                className="object-contain p-4"
              />
            </div>
            <div className="p-5 md:p-7">
              <div className="mb-2 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                {featured?.prizeCategory || t("trendingBadge")}
              </div>
              <h3 className="font-serif mb-4 md:mb-5 text-xl md:text-2xl leading-tight font-semibold">
                {featured?.titleEn || "Featured Prize"}
              </h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-[12px] md:text-[13px]">
                  <span className="font-semibold text-gold-dark">
                    {featured ? `${featured.ticketsSold.toLocaleString()} / ${featured.maxTickets.toLocaleString()} ${t("ticketsSold")}` : "—"}
                  </span>
                  <span className="text-ink-muted">
                    {featured ? t("ticketsLeft", { left: featured.maxTickets - featured.ticketsSold }) : ""}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-border-light">
                  <div
                    className="h-full rounded-[3px] bg-gold transition-[width] duration-800 ease-out"
                    style={{ width: featured ? `${Math.round((featured.ticketsSold / featured.maxTickets) * 100)}%` : "0%" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-lg md:text-[22px] font-bold text-ink">
                  £{featured ? Number(featured.pricePounds).toFixed(2) : "1.99"}{" "}
                  <span className="text-[12px] md:text-[13px] font-normal text-ink-muted">{t("perTicket")}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-ink-muted">
                  <CalendarIcon />
                  {t("draw")} {featured ? formatDrawDate(featured.drawDate) : "—"}
                </div>
              </div>
            </div>
          </Link>
          ) : (
            <div className="animate-fade-in-up order-0 lg:order-1 [animation-delay:200ms]">
              <NoCompetitionsCard t={t} fallbackImage={fallbackImage} locale={locale} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
