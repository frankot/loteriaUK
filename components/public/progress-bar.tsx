"use client";

interface ProgressBarProps {
  sold: number;
  max: number;
}

export default function ProgressBar({ sold, max }: ProgressBarProps) {
  const pct = Math.min(Math.round((sold / max) * 100), 100);
  const left = max - sold;
  const urgent = left < 20;
  const soldOut = left <= 0;

  return (
    <div>
      <div className="mb-2 flex justify-between text-[13px]">
        <span className="font-semibold text-gold-dark">
          {sold.toLocaleString()} / {max.toLocaleString()} tickets sold
        </span>
        <span className={urgent || soldOut ? "font-semibold text-urgent" : "text-ink-muted"}>
          {soldOut ? "Sold Out" : `Only ${left} left`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-[3px] bg-border-light">
        <div
          className="h-full rounded-[3px] bg-gold transition-[width] duration-800 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
