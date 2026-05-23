"use client";

import { Minus, Plus } from "lucide-react";

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
  const maxSelectable = Math.min(maxAvailable, 10);

  const decrement = () => {
    if (quantity > 1) onChange(quantity - 1);
  };

  const increment = () => {
    if (quantity < maxSelectable) onChange(quantity + 1);
  };

  const total = price * quantity;

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-ink">Choose your tickets</div>
          <div className="text-xs text-ink-muted">£{price.toFixed(2)} each</div>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl font-bold text-gold-dark">£{total.toFixed(2)}</div>
          <div className="text-xs text-ink-muted">{quantity} ticket{quantity > 1 ? "s" : ""}</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-5">
        <button
          onClick={decrement}
          disabled={disabled || quantity <= 1}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition-all hover:border-gold hover:bg-gold-pale hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-white disabled:hover:text-ink"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="flex min-w-[80px] items-center justify-center gap-1">
          <span className="font-serif text-4xl font-bold text-ink tabular-nums">{quantity}</span>
          <span className="text-xs text-ink-muted pt-2">
            ticket{quantity > 1 ? "s" : ""}
          </span>
        </div>

        <button
          onClick={increment}
          disabled={disabled || quantity >= maxSelectable}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-ink transition-all hover:border-gold hover:bg-gold-pale hover:text-gold-dark disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-white disabled:hover:text-ink"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {maxAvailable < 10 && (
        <p className="mt-4 text-center text-xs text-ink-muted">
          Only {maxAvailable} ticket{maxAvailable !== 1 ? "s" : ""} remaining
        </p>
      )}
    </div>
  );
}
