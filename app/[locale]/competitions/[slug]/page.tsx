import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { getCompetitionBySlug } from "@/lib/queries";
import ProgressBar from "@/components/public/progress-bar";
import PurchaseSection from "./purchase-section";
import PixelViewContent from "@/components/public/pixel-view-content";
import { MAX_TICKETS_PER_TRANSACTION } from "@/lib/constants";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/** Pick the locale-specific field from a competition record */
function localeField<T extends string | null>(
  en: T,
  pl: T | null,
  ro: T | null,
  bg: T | null,
  locale: string
): T {
  switch (locale) {
    case "pl":
      return (pl ?? en) as T;
    case "ro":
      return (ro ?? en) as T;
    case "bg":
      return (bg ?? en) as T;
    default:
      return en;
  }
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("competition");

  const competition = await getCompetitionBySlug(slug);

  if (!competition || (competition.status !== "ACTIVE" && competition.status !== "DRAWN")) {
    notFound();
  }

  const isDrawn = competition.status === "DRAWN";
  const winner = competition.winners?.[0] ?? null;
  const price = Number(competition.pricePounds);
  const left = competition.maxTickets - competition.ticketsSold;
  const soldOut = left <= 0;
  const drawPast = competition.drawDate < new Date();

  // Locale-aware fields
  const title = localeField(competition.titleEn, competition.titlePl, competition.titleRo, competition.titleBg, locale);
  const desc = localeField(competition.descEn, competition.descPl, competition.descRo, competition.descBg, locale);

  const drawDateFormatted = competition.drawDate.toLocaleDateString(locale === "pl" ? "pl-PL" : locale === "bg" ? "bg-BG" : locale === "ro" ? "ro-RO" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const categoryLabelMap: Record<string, string> = {
    electronics: t("catElectronics"),
    jewellery: t("catJewellery"),
    fashion: t("catFashion"),
    cash: t("catCash"),
  };
  const category = categoryLabelMap[competition.prizeCategory || ""] || competition.prizeCategory || t("prizeValue");

  const categoryBadgeColors: Record<string, string> = {
    electronics: "bg-badge-electronics",
    jewellery: "bg-badge-jewellery",
    fashion: "bg-badge-fashion",
    cash: "bg-badge-cash",
  };
  const badgeBg = categoryBadgeColors[competition.prizeCategory || ""] || "bg-badge-electronics";

  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-8  md:py-12 lg:my-16 lg:py-0">
      <PixelViewContent contentName={title} value={price} />
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 md:mb-8 lg:mb-10 text-sm text-ink-muted">
          <a href={`/${locale}/competitions`} className="transition-colors hover:text-gold-dark">
            {t("competitions")}
          </a>
          <span className="mx-2">/</span>
          <span className="text-ink">{title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-14">
          {/* ── Left — Prize Image ── */}
          <div>
            <div className="relative flex h-[280px] sm:h-[340px] md:h-[400px] lg:h-[480px] lg:sticky lg:top-24 items-center justify-center overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-featured">
              {/* Status badge */}
              {isDrawn && (
                <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-success px-3 md:px-3.5 py-1.5 text-[11px] md:text-xs font-semibold tracking-wide text-white">
                  🏆 {t("winnerDrawn")}
                </span>
              )}
              {!isDrawn && soldOut && (
                <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-urgent px-2 md:px-2.5 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-white">
                  {t("soldOut")}
                </span>
              )}
              {!isDrawn && !soldOut && left < 20 && (
                <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-gold px-2 md:px-2.5 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(184,148,58,0.3)]">
                  🔥 {t("onlyLeft", { left })}
                </span>
              )}

              {competition.prizeImageUrl ? (
                <Image
                  src={competition.prizeImageUrl}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 50vw"
                  className="object-contain p-6 md:p-8 lg:p-10"
                  priority
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-gold/25">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                    <path d="M3 6h18"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                  <span className="text-xs font-medium uppercase tracking-wider">{category}</span>
                </div>
              )}

              {/* Category badge */}
              <span className={`absolute top-3 right-3 rounded-xl px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-semibold z-10 tracking-wider text-white uppercase ${badgeBg}`}>
                {category}
              </span>
            </div>
          </div>

          {/* ── Right — Details + Purchase ── */}
          <div>
            {isDrawn ? (
              <>
                {/* Winner announcement */}
                <div className="mb-4 md:mb-6 rounded-2xl bg-gradient-to-br from-success/10 via-success/5 to-white border border-success/20 px-5 md:px-7 py-5 md:py-7">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-3xl md:text-4xl">🏆</span>
                    <div>
                      <p className="text-xs font-bold tracking-[2px] text-success uppercase">{t("winnerDrawn")}</p>
                      <p className="text-sm text-ink-muted">{t("weHaveWinner")}</p>
                    </div>
                  </div>
                  <p className="text-2xl md:text-3xl font-bold text-ink">
                    {winner?.user?.name || "Winner Announced"}
                  </p>
                  {winner?.claimed ? (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {t("prizeClaimed")}
                    </span>
                  ) : (
                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ink-soft/10 px-3 py-1 text-xs font-semibold text-ink-muted">
                      {t("pendingClaim")}
                    </span>
                  )}
                </div>

                {/* Prize value badge */}
                <div className="mb-3 md:mb-4 flex items-center gap-3">
                  {competition.prizeValue && (
                    <span className="inline-flex items-center rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-gold-dark">
                      {t("rrp")} £{Number(competition.prizeValue).toLocaleString()}
                    </span>
                  )}
                </div>

                <h1 className="font-serif mb-3 md:mb-4 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] leading-[1.1] font-semibold tracking-tight">
                  {title}
                </h1>

                {/* Quick info chips */}
                <div className="mb-5 md:mb-7 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("price")}</div>
                    <div className="text-base md:text-lg font-bold text-ink">£{price.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("ticketsTotal")}</div>
                    <div className="text-base md:text-lg font-bold text-ink">{competition.maxTickets.toLocaleString()}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5 col-span-2 sm:col-span-1">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("drawnLabel")}</div>
                    <div className="text-sm md:text-base font-bold text-ink whitespace-nowrap">
                      {drawDateFormatted}
                    </div>
                  </div>
                </div>

                <a
                  href={`/${locale}/competitions`}
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
                >
                  {t("competitions")} →
                </a>
              </>
            ) : (
              <>
                {/* Prize value badge */}
                <div className="mb-3 md:mb-4 flex items-center gap-3">
                  {competition.prizeValue && (
                    <span className="inline-flex items-center rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-gold-dark">
                      {t("rrp")} £{Number(competition.prizeValue).toLocaleString()}
                    </span>
                  )}
                </div>

                <h1 className="font-serif mb-3 md:mb-4 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] leading-[1.1] font-semibold tracking-tight">
                  {title}
                </h1>

                <p className="mb-5 md:mb-7 max-w-full text-[14px] md:text-[15px] leading-relaxed text-ink-soft break-words">
                  {desc}
                </p>

                {/* Quick info chips */}
                <div className="mb-5 md:mb-7 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("price")}</div>
                    <div className="text-base md:text-lg font-bold text-ink">£{price.toFixed(2)}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("maxPerPerson")}</div>
                    <div className="text-base md:text-lg font-bold text-ink">{MAX_TICKETS_PER_TRANSACTION}</div>
                  </div>
                  <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5 col-span-2 sm:col-span-1">
                    <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("draw")}</div>
                    <div className="text-sm md:text-base font-bold text-ink whitespace-nowrap">
                      {drawDateFormatted}
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-5 md:mb-6">
                  <ProgressBar sold={competition.ticketsSold} max={competition.maxTickets} />
                </div>

                {/* Free Postal Entry Callout */}
                <div className="mb-5 md:mb-6 rounded-xl border border-border bg-white px-4 py-3 shadow-card">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-ink">
                        {t("freeEntryTitle")}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {t("freeEntryDesc")}
                      </p>
                    </div>
                    <a
                      href={`/${locale}/free-postal-entry`}
                      className="flex-shrink-0 text-xs font-semibold text-gold-dark hover:text-gold transition-colors"
                    >
                      {t("freeEntryLink")} →
                    </a>
                  </div>
                </div>

                {/* Purchase Section */}
                {!soldOut && !drawPast ? (
                  <PurchaseSection
                    slug={slug}
                    price={price}
                    maxAvailable={left}
                    locale={locale}
                  />
                ) : (
                  <div className="rounded-2xl border border-border bg-white p-6 md:p-8 text-center shadow-card">
                    <div className="mx-auto mb-4 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-urgent/10">
                      <span className="text-xl md:text-2xl">{soldOut ? "😢" : "⏰"}</span>
                    </div>
                    <p className="text-lg md:text-xl font-semibold text-ink">
                      {soldOut ? t("allSoldOut") : t("drawPassed")}
                    </p>
                    <p className="mt-2 text-sm text-ink-muted">
                      {soldOut ? t("soldOutDesc") : t("drawPassedDesc")}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
