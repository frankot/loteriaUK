import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import ProgressBar from "@/components/public/progress-bar";
import CountdownTimer from "@/components/public/countdown-timer";
import PurchaseSection from "./purchase-section";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

const categoryLabels: Record<string, string> = {
  electronics: "Electronics",
  jewellery: "Jewellery",
  fashion: "Fashion",
  cash: "Cash",
};

export default async function CompetitionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("competition");

  const competition = await prisma.competition.findUnique({
    where: { slug },
    include: {
      question: {
        select: {
          id: true,
          questionEn: true,
          optionAEn: true,
          optionBEn: true,
          optionCEn: true,
          optionDEn: true,
          correctOption: true,
        },
      },
    },
  });

  if (!competition || competition.status !== "ACTIVE") {
    notFound();
  }

  const price = Number(competition.pricePounds);
  const left = competition.maxTickets - competition.ticketsSold;
  const soldOut = left <= 0;
  const drawPast = competition.drawDate < new Date();
  const category = categoryLabels[competition.prizeCategory || ""] || competition.prizeCategory || "Prize";

  const categoryBadgeColors: Record<string, string> = {
    electronics: "bg-badge-electronics",
    jewellery: "bg-badge-jewellery",
    fashion: "bg-badge-fashion",
    cash: "bg-badge-cash",
  };
  const badgeBg = categoryBadgeColors[competition.prizeCategory || ""] || "bg-badge-electronics";

  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-6 md:mb-8 lg:mb-10 text-sm text-ink-muted">
          <a href={`/${locale}/competitions`} className="transition-colors hover:text-gold-dark">
            {t("competitions")}
          </a>
          <span className="mx-2">/</span>
          <span className="text-ink">{competition.titleEn}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-14">
          {/* ── Left — Prize Image ── */}
          <div>
            <div className="relative flex h-[280px] sm:h-[340px] md:h-[400px] lg:h-[480px] lg:sticky lg:top-24 items-center justify-center overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-featured">
              {/* Status badge */}
              {soldOut && (
                <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-urgent px-2 md:px-2.5 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-white">
                  {t("soldOut")}
                </span>
              )}
              {!soldOut && left < 20 && (
                <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-gold px-2 md:px-2.5 py-1 text-[11px] md:text-xs font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(184,148,58,0.3)]">
                  🔥 {t("onlyLeft", { left })}
                </span>
              )}

              <Image
                src={competition.prizeImageUrl || "/images/rolex.png"}
                alt={competition.titleEn}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, 50vw"
                className="object-contain p-6 md:p-8 lg:p-10"
                priority
              />

              {/* Category badge */}
              <span className={`absolute top-3 right-3 rounded-xl px-2 md:px-2.5 py-1 text-[10px] md:text-[11px] font-semibold z-10 tracking-wider text-white uppercase ${badgeBg}`}>
                {category}
              </span>
            </div>
          </div>

          {/* ── Right — Details + Purchase ── */}
          <div>
            {/* Prize value badge */}
            <div className="mb-3 md:mb-4 flex items-center gap-3">
              {competition.prizeValue && (
                <span className="inline-flex items-center rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-gold-dark">
                  RRP £{Number(competition.prizeValue).toLocaleString()}
                </span>
              )}
            </div>

            <h1 className="font-serif mb-3 md:mb-4 text-[28px] sm:text-[32px] md:text-[36px] lg:text-[40px] leading-[1.1] font-semibold tracking-tight">
              {competition.titleEn}
            </h1>

            <p className="mb-5 md:mb-7 text-[14px] md:text-[15px] leading-relaxed text-ink-soft">
              {competition.descEn}
            </p>

            {/* Quick info chips */}
            <div className="mb-5 md:mb-7 grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
              <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("price")}</div>
                <div className="text-base md:text-lg font-bold text-ink">£{price.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5">
                <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("maxPerPerson")}</div>
                <div className="text-base md:text-lg font-bold text-ink">10</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-3 md:px-4 py-2 md:py-2.5 col-span-2 sm:col-span-1">
                <div className="text-[10px] md:text-[11px] font-semibold tracking-wide text-ink-muted uppercase">{t("draw")}</div>
                <div className="text-sm md:text-base font-bold text-ink whitespace-nowrap">
                  {competition.drawDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-5 md:mb-6">
              <ProgressBar sold={competition.ticketsSold} max={competition.maxTickets} />
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
              <SoldOutBanner soldOut={soldOut} allSoldOut={t("allSoldOut")} drawPassed={t("drawPassed")} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SoldOutBanner({
  soldOut,
  allSoldOut,
  drawPassed,
}: {
  soldOut: boolean;
  allSoldOut: string;
  drawPassed: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-6 md:p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full bg-urgent/10">
        <span className="text-xl md:text-2xl">{soldOut ? "😢" : "⏰"}</span>
      </div>
      <p className="text-lg md:text-xl font-semibold text-ink">
        {soldOut ? allSoldOut : drawPassed}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {soldOut
          ? "This competition has ended. Check back for new prizes."
          : "This competition is no longer accepting entries."}
      </p>
    </div>
  );
}
