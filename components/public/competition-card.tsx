"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

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

const categoryBadgeColors: Record<string, string> = {
  electronics: "bg-badge-electronics",
  jewellery: "bg-badge-jewellery",
  fashion: "bg-badge-fashion",
  cash: "bg-badge-cash",
};

interface CompetitionCardProps {
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  imageUrl: string | null;
  ticketsSold: number;
  maxTickets: number;
  drawDate: Date;
  pricePounds: number;
  locale?: string;
}

export function formatDrawDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CompetitionCard({
  slug,
  title,
  description,
  category,
  imageUrl,
  ticketsSold,
  maxTickets,
  drawDate,
  pricePounds,
  locale = "en",
}: CompetitionCardProps) {
  const t = useTranslations("trending");
  const pct = Math.round((ticketsSold / maxTickets) * 100);
  const left = maxTickets - ticketsSold;
  const urgent = left < 20;
  const catLabel = category ? t(`category.${category}` as Parameters<typeof t>[0]) : t("category.prize");
  const badgeColor = categoryBadgeColors[category || ""] || "bg-badge-electronics";

  return (
    <Link
      href={`/${locale}/competitions/${slug}`}
      className="relative cursor-pointer overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover block"
    >
      {/* Image */}
      <div className="relative flex h-[180px] sm:h-[200px] md:h-[220px] items-center justify-center overflow-hidden">
        <span
          className={`absolute top-3 right-3 rounded-xl px-2.5 py-1 text-[11px] font-semibold z-10 tracking-wider text-white uppercase ${badgeColor}`}
        >
          {catLabel}
        </span>
        {urgent && (
          <span className="absolute top-3 left-3 md:left-5 z-10 rounded-full bg-gold px-2 md:px-2.5 py-1 text-[10px] md:text-xs font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(184,148,58,0.3)]">
            🔥 {t("onlyLeft", { left })}
          </span>
        )}
        <Image
          src={imageUrl || "/images/rolex.png"}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-contain p-4"
        />
      </div>

      {/* Body */}
      <div className="p-4 md:p-5">
        <h3 className="font-serif mb-1.5 text-base md:text-lg leading-tight font-semibold">{title}</h3>
        <p className="mb-3 md:mb-3.5 text-[12px] md:text-[13px] text-ink-muted line-clamp-2">
          {description || title}
        </p>

        {/* Progress (hidden when under 60%) */}
        <div className="mb-3">
          <div className="mb-1.5 flex justify-between text-[11px] md:text-xs">
            <span className="font-semibold text-gold-dark">
              {ticketsSold.toLocaleString()} / {maxTickets.toLocaleString()} {t("sold")}
            </span>
            <span className={urgent ? "font-semibold text-urgent" : "text-ink-muted"}>
              {left} {t("left")}
            </span>
          </div>
          {pct >= 60 && (
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
          <span className="flex items-center gap-1 text-[11px] md:text-xs text-ink-muted">
            <CalendarIcon /> {formatDrawDate(drawDate)}
          </span>
          <span className="text-sm md:text-base font-bold text-ink">
            £{pricePounds.toFixed(2)}
          </span>
        </div>
      </div>
    </Link>
  );
}
