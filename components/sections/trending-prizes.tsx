import Image from "next/image";
import Link from "next/link";
import { getTrendingCompetitions } from "@/lib/queries";

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

const categoryBadgeColors: Record<string, string> = {
  electronics: "bg-badge-electronics",
  jewellery: "bg-badge-jewellery",
  fashion: "bg-badge-fashion",
  cash: "bg-badge-cash",
};

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
            {competitions.map((comp) => {
              const pct = Math.round((comp.ticketsSold / comp.maxTickets) * 100);
              const urgent = comp.maxTickets - comp.ticketsSold < 20;
              const badgeColor = categoryBadgeColors[comp.prizeCategory || ""] || "bg-badge-electronics";

              return (
                <Link
                  key={comp.slug}
                  href={`/en/competitions/${comp.slug}`}
                  className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover block"
                >
                  {/* Image */}
                  <div className="relative flex h-[200px] items-center justify-center overflow-hidden">
                    <span className={`absolute top-3 right-3 rounded-xl px-2.5 py-1 text-[11px] font-semibold z-10 tracking-wider text-white uppercase ${badgeColor}`}>
                      {comp.prizeCategory}
                    </span>
                    <Image
                      src={comp.prizeImageUrl || "/images/rolex.png"}
                      alt={comp.titleEn}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain p-4"
                    />
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <h3 className="font-serif mb-1.5 text-lg leading-tight font-semibold">{comp.titleEn}</h3>
                    <p className="mb-3.5 text-[13px] text-ink-muted line-clamp-2">
                      {comp.descEn || comp.titleEn}
                    </p>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-semibold text-gold-dark">
                          {comp.ticketsSold.toLocaleString()} / {comp.maxTickets.toLocaleString()} sold
                        </span>
                        <span className={urgent ? "font-semibold text-urgent" : "text-ink-muted"}>
                          {comp.maxTickets - comp.ticketsSold} left
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-[2px] bg-border-light">
                        <div
                          className="h-full rounded-[2px] bg-gold transition-[width] duration-800 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <CalendarIcon /> {formatDrawDate(comp.drawDate)}
                      </span>
                      <span className="text-base font-bold text-ink">
                        £{Number(comp.pricePounds).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
