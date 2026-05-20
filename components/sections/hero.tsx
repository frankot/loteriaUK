import Image from "next/image";
import Link from "next/link";

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

export default function Hero() {
  return (
    <section className="bg-cream px-12 pt-20 pb-[120px]">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 items-center gap-20">
          {/* Left column */}
          <div className="animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gold-pale px-4 py-1.5 text-[13px] font-semibold tracking-wide text-gold-dark uppercase">
              <span className="inline-block h-[7px] w-[7px] rounded-full bg-gold" />
              Trusted by 48,000+ players across the UK
            </div>

            <h1 className="font-serif text-[56px] leading-[1.1] font-semibold tracking-tight">
              Your dream prize is
              <br />
              <em className="italic text-gold not-italic">one ticket away</em>
            </h1>

            <p className="mt-5 mb-9 max-w-[440px] text-[17px] leading-relaxed text-ink-soft">
              Answer a skill-based question, buy your ticket from just £1.99,
              and watch the live draw. Premium prizes. Real winners. Every week.
            </p>

            <div className="mb-12 flex gap-3">
              <Link
                href="#trending"
                className="inline-flex items-center gap-2 rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
              >
                Browse Prizes →
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-3xl border border-border bg-transparent px-8 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
              >
                How It Works
              </Link>
            </div>

            <div className="flex gap-8 border-t border-border pt-8">
              {[
                ["£2.4M+", "in prizes awarded"],
                ["48,000+", "happy winners"],
                ["4.9 ★", "on Trustpilot"],
              ].map(([num, label]) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="font-serif text-[28px] leading-none font-semibold text-gold-dark">{num}</span>
                  <span className="text-[13px] text-ink-muted">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column — Featured Prize Card */}
          <div className="animate-fade-in-up overflow-hidden rounded-[20px] bg-white shadow-featured [animation-delay:200ms]">
            <div className="relative flex h-[280px] items-center justify-center overflow-hidden">
              <span className="absolute top-5 left-5 rounded-full bg-gold px-3.5 py-1.5 text-xs font-semibold tracking-wide text-white">
                🔥 Trending
              </span>
              <Image
                src="/plan/images/tiffany.jpg"
                alt="Tiffany & Co. Diamond Pendant Necklace"
                width={600}
                height={280}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="p-7">
              <div className="mb-2 text-xs font-semibold tracking-[1.5px] text-ink-muted uppercase">
                Jewellery
              </div>
              <h3 className="font-serif mb-5 text-2xl leading-tight font-semibold">
                Tiffany &amp; Co. Diamond
                <br />
                Pendant Necklace
              </h3>

              {/* Progress */}
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-[13px]">
                  <span className="font-semibold text-gold-dark">450 / 500 tickets sold</span>
                  <span className="text-ink-muted">Only 50 left</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-border-light">
                  <div
                    className="h-full rounded-[3px] bg-gold transition-[width] duration-800 ease-out"
                    style={{ width: "90%" }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-[22px] font-bold text-ink">
                  £1.99 <span className="text-[13px] font-normal text-ink-muted">/ ticket</span>
                </div>
                <div className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                  <CalendarIcon />
                  Draw: 31 May 2026
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
