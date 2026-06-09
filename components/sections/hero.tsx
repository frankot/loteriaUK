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

/** Shown when no competitions exist at all — not just un-featured, but zero ACTIVE */
function NoCompetitionsCard({
  t,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}) {
  return (
    <div className="overflow-hidden rounded-[16px]  md:rounded-[20px] bg-white shadow-featured">
      <div className="relative flex h-[200px] sm:h-[240px] md:h-[280px] items-center justify-center overflow-hidden bg-cream-warm">
        <div className="flex flex-col items-center gap-2 text-gold/20">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17l4 4 4-4v-2.3c1.8-1.3 3-3.4 3-5.7a7 7 0 0 0-7-7Z"/>
            <path d="M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>
          </svg>
          <span className="text-[11px] font-medium uppercase tracking-wider">{t("comingSoonBadge")}</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-pale px-4 py-1.5 text-xs font-semibold tracking-wide text-gold-dark uppercase">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-gold" />
              {t("comingSoonBadge")}
            </span>
            <h3 className="mt-4 font-serif text-xl md:text-2xl font-semibold text-ink">
              {t("comingSoonTitle")}
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              {t("comingSoonSubtitle")}
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 md:p-7">
        <div className="flex items-center justify-between">
          <div className="text-lg md:text-[22px] font-bold text-ink">
            £1.99{" "}
            <span className="text-[12px] md:text-[13px] font-normal text-ink-muted">
              {t("perTicket")}
            </span>
          </div>
          <span className="text-[12px] md:text-[13px] text-ink-muted">
            {t("comingSoonCheckBack")}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Hero card that adapts to competition status: ACTIVE / CLOSED / DRAWN */
async function FeaturedCard({
  featured,
  t,
  locale,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featured: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
  locale: string;
}) {
  const isActive = featured.status === "ACTIVE";
  const isClosed = featured.status === "CLOSED";
  const isDrawn = featured.status === "DRAWN";
  const winner = featured.winners?.[0] ?? null;

  const sharedClasses = "animate-fade-in-up order-0 lg:order-1 overflow-hidden rounded-[16px] md:rounded-[20px] bg-white shadow-featured [animation-delay:200ms]";

  const isLink = isActive || isDrawn;

  return isLink ? (
    <Link
      href={`/${locale}/competitions/${featured.slug}`}
      className={`${sharedClasses} transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover`}
    >
      <div className="relative flex h-[200px] sm:h-[240px] md:h-[280px] items-center justify-center overflow-hidden">
        {/* Status badge — varies by status */}
        {isActive && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-gold px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            🔥 {t("trendingBadge")}
          </span>
        )}
        {isClosed && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-ink-soft px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            📋 {t("closedBadge")}
          </span>
        )}
        {isDrawn && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-success px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            🏆 {t("winnerDrawnBadge")}
          </span>
        )}
        {featured.prizeImageUrl ? (
          <Image
            src={featured.prizeImageUrl}
            alt={featured.titleEn || "Featured Prize"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
            className={`object-contain p-4 ${!isActive ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gold/25">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wider">{featured.prizeCategory || t("trendingBadge")}</span>
          </div>
        )}
      </div>
      <div className="p-5 md:p-7">
        <div className="mb-2 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
          {featured.prizeCategory || t("trendingBadge")}
        </div>
        <h3 className="font-serif mb-4 md:mb-5 text-xl md:text-2xl leading-tight font-semibold">
          {featured.titleEn || "Featured Prize"}
        </h3>

        {isActive && (
          <>
            {/* Progress bar */}
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-[12px] md:text-[13px]">
                <span className="font-semibold text-gold-dark">
                  {featured.ticketsSold.toLocaleString()} / {featured.maxTickets.toLocaleString()} {t("ticketsSold")}
                </span>
                <span className="text-ink-muted">
                  {t("ticketsLeft", { left: featured.maxTickets - featured.ticketsSold })}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-border-light">
                <div
                  className="h-full rounded-[3px] bg-gold transition-[width] duration-800 ease-out"
                  style={{ width: `${Math.round((featured.ticketsSold / featured.maxTickets) * 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg md:text-[22px] font-bold text-ink">
                £{Number(featured.pricePounds).toFixed(2)}{" "}
                <span className="text-[12px] md:text-[13px] font-normal text-ink-muted">{t("perTicket")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] md:text-[13px] text-ink-muted">
                <CalendarIcon />
                {t("draw")} {formatDrawDate(featured.drawDate)}
              </div>
            </div>
          </>
        )}

        {isClosed && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon />
                <div className="text-sm text-ink-muted">
                  {t("closedLabel")} {formatDrawDate(featured.drawDate)}
                </div>
              </div>
            </div>
            <div className="text-xs text-ink-muted">
              {t("closedDesc")}
            </div>
          </div>
        )}

        {isDrawn && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon />
                <div className="text-sm text-ink-muted">
                  {t("drawnOnLabel")} {formatDrawDate(featured.drawDate)}
                </div>
              </div>
            </div>
            {winner && (
              <div className="flex items-center gap-2 text-sm text-ink">
                <span className="font-medium text-success">Winner:</span>
                <span>{winner.user?.name || "Announced"}</span>
                {winner.claimed && <span className="text-xs text-success">• Claimed</span>}
              </div>
            )}
            <div className="text-xs text-ink-muted">
              {t("drawnDesc")}
            </div>
          </div>
        )}
      </div>
    </Link>
  ) : (
    <div className={sharedClasses}>
      <div className="relative flex h-[200px] sm:h-[240px] md:h-[280px] items-center justify-center overflow-hidden">
        {isActive && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-gold px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            🔥 {t("trendingBadge")}
          </span>
        )}
        {isClosed && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-ink-soft px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            📋 {t("closedBadge")}
          </span>
        )}
        {isDrawn && (
          <span className="absolute top-4 left-4 md:top-5 md:left-5 z-10 rounded-full bg-success px-3 md:px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
            🏆 {t("winnerDrawnBadge")}
          </span>
        )}
        {featured.prizeImageUrl ? (
          <Image
            src={featured.prizeImageUrl}
            alt={featured.titleEn || "Featured Prize"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
            className={`object-contain p-4 ${!isActive ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gold/25">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
              <path d="M3 6h18"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span className="text-[11px] font-medium uppercase tracking-wider">{featured.prizeCategory || t("trendingBadge")}</span>
          </div>
        )}
      </div>
      <div className="p-5 md:p-7">
        <div className="mb-2 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
          {featured.prizeCategory || t("trendingBadge")}
        </div>
        <h3 className="font-serif mb-4 md:mb-5 text-xl md:text-2xl leading-tight font-semibold">
          {featured.titleEn || "Featured Prize"}
        </h3>

        {isActive && (
          <>
            <div className="mb-4">
              <div className="mb-2 flex justify-between text-[12px] md:text-[13px]">
                <span className="font-semibold text-gold-dark">
                  {featured.ticketsSold.toLocaleString()} / {featured.maxTickets.toLocaleString()}
                </span>
                <span className="text-ink-muted">
                  {t("ticketsLeft", { left: featured.maxTickets - featured.ticketsSold })}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-[3px] bg-border-light">
                <div className="h-full rounded-[3px] bg-gold" style={{ width: `${Math.round((featured.ticketsSold / featured.maxTickets) * 100)}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-ink">
                £{Number(featured.pricePounds).toFixed(2)}{t("perTicket")}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                <CalendarIcon />{t("draw")} {formatDrawDate(featured.drawDate)}
              </div>
            </div>
          </>
        )}

        {isClosed && (
          <div className="text-sm text-ink-muted space-y-2">
            <span><CalendarIcon /> {t("closedLabel")}: {formatDrawDate(featured.drawDate)}</span>
            <div className="text-xs">{t("closedDesc")}</div>
          </div>
        )}

        {isDrawn && (
          <div className="space-y-2 text-sm text-ink-muted">
            <span><CalendarIcon /> {t("drawnOnLabel")}: {formatDrawDate(featured.drawDate)}</span>
            {winner && (
              <div className="text-ink">
                <span className="font-medium text-success">Winner:</span>
                <span className="ml-1">{winner.user?.name || "Announced"}</span>
                {winner.claimed && <span className="ml-1 text-xs text-success">• Claimed</span>}
              </div>
            )}
            <div className="text-xs">{t("drawnDesc")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function Hero({ locale }: { locale: string }) {
  const t = await getTranslations("hero");
  const featured = await getHeroCompetition();

  return (
    <section className="bg-cream px-4  md:px-8 lg:px-12 pt-10 md:pt-16 lg:mt-6 pb-16 md:pb-24 lg:pb-[120px]">
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

            {/* Benefits row */}
            <div className="flex gap-6 sm:gap-8 border-t border-border pt-6 md:pt-8">
              {[
                { label: t("premiumPrizes"), sub: t("premiumPrizesSub") },
                { label: t("secureEntries"), sub: t("secureEntriesSub") },
                { label: t("fairDraws"), sub: t("fairDrawsSub") },
              ].map(({ label, sub }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="font-serif text-[18px] sm:text-[20px] md:text-[22px] leading-none font-semibold text-gold-dark">{label}</span>
                  <span className="text-[11px] md:text-[13px] text-ink-muted">{sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Featured Prize Card — appears above text on mobile */}
          {featured ? (
            <FeaturedCard featured={featured} t={t} locale={locale} />
          ) : (
            <div className="animate-fade-in-up order-0 lg:order-1 [animation-delay:200ms]">
              <NoCompetitionsCard t={t} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
