import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getTrendingCompetitions } from "@/lib/queries";
import CompetitionCard from "@/components/public/competition-card";

export default async function TrendingPrizes() {
  const t = await getTranslations("trending");
  const competitions = await getTrendingCompetitions(6);

  return (
    <section id="trending">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:my-20">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              {t("badge")}
            </div>
            <h2 className="font-serif text-[28px] sm:text-[32px] md:text-[36px] leading-[1.15] font-semibold">{t("title")}</h2>
          </div>
          <Link
            href="/en/competitions"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            {t("viewAll")}
          </Link>
        </div>

        {competitions.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
            <p className="text-lg">{t("empty")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {competitions.map((comp: typeof competitions[number]) => (
              <CompetitionCard
                key={comp.slug}
                slug={comp.slug}
                title={comp.titleEn}
                description={comp.descEn}
                category={comp.prizeCategory}
                imageUrl={comp.prizeImageUrl}
                ticketsSold={comp.ticketsSold}
                maxTickets={comp.maxTickets}
                drawDate={comp.drawDate}
                pricePounds={Number(comp.pricePounds)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
