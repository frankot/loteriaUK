import Link from "next/link";
import { getTrendingCompetitions } from "@/lib/queries";
import CompetitionCard from "@/components/public/competition-card";

export default async function TrendingPrizes() {
  const competitions = await getTrendingCompetitions(6);

  return (
    <section id="trending">
      <div className="mx-auto max-w-7xl px-12 lg:my-20">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              Trending Now
            </div>
            <h2 className="font-serif text-[36px] leading-[1.15] font-semibold">Pick your prize</h2>
          </div>
          <Link
            href="/en/competitions"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            View all competitions →
          </Link>
        </div>

        {competitions.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
            <p className="text-lg">No active competitions right now — check back soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
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
