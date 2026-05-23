import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
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
    <div className="bg-cream px-12 py-16">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <nav className="mb-10 text-sm text-ink-muted">
          <a href={`/${locale}/competitions`} className="transition-colors hover:text-gold-dark">
            Competitions
          </a>
          <span className="mx-2">/</span>
          <span className="text-ink">{competition.titleEn}</span>
        </nav>

        <div className="grid grid-cols-2 gap-14">
          {/* ── Left — Prize Image (sticky on desktop) ── */}
          <div className="sticky top-24 self-start">
            <div className="relative flex h-[480px] items-center justify-center overflow-hidden rounded-2xl bg-white shadow-featured">
              {/* Status badge */}
              {soldOut && (
                <span className="absolute top-5 left-5 z-10 rounded-full bg-urgent px-4 py-1.5 text-xs font-semibold tracking-wide text-white">
                  Sold Out
                </span>
              )}
              {!soldOut && left < 20 && (
                <span className="absolute top-5 left-5 z-10 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(184,148,58,0.3)]">
                  🔥 Only {left} left
                </span>
              )}

              <Image
                src={competition.prizeImageUrl || "/images/rolex.png"}
                alt={competition.titleEn}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-contain p-10"
                priority
              />

              {/* Category badge — top-right, same style as trending grid */}
              <span className={`absolute top-3 right-3 rounded-xl px-2.5 py-1 text-[11px] font-semibold z-10 tracking-wider text-white uppercase ${badgeBg}`}>
                {category}
              </span>
            </div>
          </div>

          {/* ── Right — Details + Purchase ── */}
          <div>
            {/* Prize value badge */}
            <div className="mb-4 flex items-center gap-3">
              {competition.prizeValue && (
                <span className="inline-flex items-center rounded-full bg-gold-pale px-3 py-1 text-xs font-semibold text-gold-dark">
                  RRP £{Number(competition.prizeValue).toLocaleString()}
                </span>
              )}
            </div>

            <h1 className="font-serif mb-4 text-[40px] leading-[1.1] font-semibold tracking-tight">
              {competition.titleEn}
            </h1>

            <p className="mb-7 text-[15px] leading-relaxed text-ink-soft">
              {competition.descEn}
            </p>

            {/* Quick info chips */}
            <div className="mb-7 flex gap-3">
              <div className="rounded-xl border border-border bg-white px-4 py-2.5">
                <div className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Price</div>
                <div className="text-lg font-bold text-ink">£{price.toFixed(2)}</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-4 py-2.5">
                <div className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Max per person</div>
                <div className="text-lg font-bold text-ink">10</div>
              </div>
              <div className="rounded-xl border border-border bg-white px-4 py-2.5">
                <div className="text-[11px] font-semibold tracking-wide text-ink-muted uppercase">Draw</div>
                <div className="text-sm font-bold text-ink whitespace-nowrap">
                  {competition.drawDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
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
              <SoldOutBanner soldOut={soldOut} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SoldOutBanner({ soldOut }: { soldOut: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-card">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-urgent/10">
        <span className="text-2xl">{soldOut ? "😢" : "⏰"}</span>
      </div>
      <p className="text-xl font-semibold text-ink">
        {soldOut ? "All tickets sold out" : "Draw has passed"}
      </p>
      <p className="mt-2 text-sm text-ink-muted">
        {soldOut
          ? "This competition has ended. Check back for new prizes."
          : "This competition is no longer accepting entries."}
      </p>
    </div>
  );
}
