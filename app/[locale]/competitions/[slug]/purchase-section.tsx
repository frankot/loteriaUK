"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import TicketSelector from "@/components/public/ticket-selector";

interface PurchaseSectionProps {
  slug: string;
  price: number;
  maxAvailable: number;
  locale: string;
}

export default function PurchaseSection({
  slug,
  price,
  maxAvailable,
  locale,
}: PurchaseSectionProps) {
  const router = useRouter();
  const t = useTranslations("competition");
  const [quantity, setQuantity] = useState(1);

  const handleBuy = () => {
    router.push(`/${locale}/competitions/${slug}/verify?quantity=${quantity}`);
  };

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] md:text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
          {t("selectTickets")}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      {/* Ticket Selector */}
      <TicketSelector
        price={price}
        maxAvailable={maxAvailable}
        quantity={quantity}
        onChange={setQuantity}
      />

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        className="w-full rounded-3xl bg-gold px-5 md:px-6 py-3.5 md:py-4 text-[14px] md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
      >
        {t("buyTickets")} {quantity} {quantity > 1 ? t("tickets") : t("ticket")} — £{(price * quantity).toFixed(2)}
      </button>
    </div>
  );
}
