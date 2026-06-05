"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { MAX_TICKETS_PER_TRANSACTION } from "@/lib/constants";

interface TicketSelectorProps {
  price: number;
  maxAvailable: number;
  quantity: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
}

export default function TicketSelector({
  price,
  maxAvailable,
  quantity,
  onChange,
  disabled = false,
}: TicketSelectorProps) {
  const t = useTranslations("competition");
  const maxSelectable = Math.min(maxAvailable, MAX_TICKETS_PER_TRANSACTION);

  const presets = [5, 10, 20, 50];

  const decrement = () => {
    if (quantity > 1) onChange(quantity - 1);
  };

  const increment = () => {
    if (quantity < maxSelectable) onChange(quantity + 1);
  };

  const total = price * quantity;

  return (
    <div className="rounded-xl border border-border bg-white p-4 md:p-5 shadow-card">
      <div className="mb-4 md:mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink">{t("chooseTickets")}</div>
          <div className="text-xs text-ink-muted">£{price.toFixed(2)} {t("each")}</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-xl md:text-2xl font-bold text-gold-dark">£{total.toFixed(2)}</div>
          <div className="text-xs text-ink-muted">{quantity} {quantity > 1 ? t("tickets") : t("ticket")}</div>
        </div>
      </div>

      {/* Quick-add presets */}
      <div className="mb-5">
        <div className="grid grid-cols-4 gap-2">
          {presets.map((n) => {
            const presetTotal = price * n;
            const isActive = quantity === n;
            const isDisabled = disabled || n > maxSelectable;
            return (
              <button
                key={n}
                onClick={() => onChange(n)}
                disabled={isDisabled}
                className={
                  isActive
                    ? "relative flex flex-col items-center rounded-xl bg-gold px-2 py-3 transition-all ring-2 ring-gold/30 disabled:cursor-not-allowed disabled:opacity-40"
                    : "relative flex flex-col items-center rounded-xl border border-border bg-white px-2 py-3 transition-all hover:border-gold/50 hover:bg-gold-pale/40 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-30"
                }
              >
                <span className={
                  isActive
                    ? "font-serif text-xl font-bold leading-none text-white"
                    : "font-serif text-xl font-bold leading-none text-ink"
                }>{n}</span>
                <span className={
                  isActive
                    ? "mt-0.5 text-[10px] font-medium text-white/70"
                    : "mt-0.5 text-[10px] font-medium text-ink-muted"
                }>{n > 1 ? t("tickets") : t("ticket")}</span>
                <span className={
                  isActive
                    ? "mt-1 text-[11px] font-semibold text-white/90"
                    : "mt-1 text-[11px] font-semibold text-gold-dark/80"
                }>£{presetTotal.toFixed(2)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 md:gap-5">
        <button
          onClick={decrement}
          disabled={disabled || quantity <= 1}
          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition-all hover:border-gold hover:bg-gold-pale hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-white disabled:hover:text-ink"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex min-w-[72px] md:min-w-[80px] items-center justify-center gap-1">
          <span className="font-serif text-3xl md:text-4xl font-bold text-ink tabular-nums">{quantity}</span>
          <span className="text-[11px] md:text-xs text-ink-muted pt-2">
            {quantity > 1 ? t("tickets") : t("ticket")}
          </span>
        </div>

        <button
          onClick={increment}
          disabled={disabled || quantity >= maxSelectable}
          className="flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition-all hover:border-gold hover:bg-gold-pale hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-white disabled:hover:text-ink"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {maxAvailable < MAX_TICKETS_PER_TRANSACTION && (
        <p className="mt-3 md:mt-4 text-center text-[11px] md:text-xs text-ink-muted">
          {t("remaining", { count: maxAvailable })}
        </p>
      )}
    </div>
  );
}
