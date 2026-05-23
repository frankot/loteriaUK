import Image from "next/image";
import Link from "next/link";
import { competitions } from "@/lib/data";

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

export default function TrendingPrizes() {
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
            href="#"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            View all competitions →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-6">
          {competitions.map((comp) => {
            const pct = Math.round((comp.sold / comp.max) * 100);
            const showProgress = pct >= 60;
            const urgent = comp.left < 20;

            return (
              <div
                key={comp.title}
                className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover"
              >
                {/* Image */}
                <div className="relative flex h-[200px] items-center justify-center overflow-hidden">
                  <span
                    className={`absolute top-3 right-3 rounded-xl px-2.5 py-1 text-[11px] font-semibold tracking-wider text-white uppercase ${comp.badgeColor}`}
                  >
                    {comp.category}
                  </span>
                  <Image
                    src={comp.img}
                    alt={comp.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-contain p-4"
                  />
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3 className="font-serif mb-1.5 text-lg leading-tight font-semibold">{comp.title}</h3>
                  <p className="mb-3.5 text-[13px] text-ink-muted">{comp.subtitle}</p>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="mb-1.5 flex justify-between text-xs">
                      <span className="font-semibold text-gold-dark">
                        {comp.sold.toLocaleString()} / {comp.max.toLocaleString()} sold
                      </span>
                      <span className={urgent ? "font-semibold text-urgent" : "text-ink-muted"}>
                        {comp.left} left
                      </span>
                    </div>
                    {showProgress && (
                      <div className="h-1 overflow-hidden rounded-[2px] bg-border-light">
                        <div
                          className="h-full rounded-[2px] bg-gold transition-[width] duration-800 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-ink-muted">
                      <CalendarIcon /> {comp.drawDate}
                    </span>
                    <span className="text-base font-bold text-ink">{comp.price}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
