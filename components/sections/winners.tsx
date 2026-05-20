import Image from "next/image";
import Link from "next/link";
import { winners } from "@/lib/data";

export default function Winners() {
  return (
    <section id="winners">
      <div className="mx-auto max-w-7xl px-12 lg:my-20">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              Real People, Real Prizes
            </div>
            <h2 className="font-serif text-[36px] leading-[1.15] font-semibold">Our Recent Winners</h2>
          </div>
          <Link
            href="#"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            View all winners →
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-5 gap-5">
          {winners.map((w) => (
            <div
              key={w.name}
              className="rounded-xl bg-white px-5 pt-7 pb-7 text-center shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover"
            >
              {/* Avatar with green dot */}
              <div className="relative mx-auto mb-4 inline-block">
                <Image
                  src={w.img}
                  alt={w.name}
                  width={72}
                  height={72}
                  className="rounded-full object-cover"
                />
                <span className="absolute right-0.5 bottom-0.5 block h-3.5 w-3.5 rounded-full border-2 border-white bg-success" />
              </div>

              <div className="mb-1 text-[15px] font-semibold">{w.name}</div>
              <div className="mb-1 text-[13px] font-medium text-gold-dark">{w.prize}</div>
              <div className="text-xs text-ink-muted">{w.date}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
