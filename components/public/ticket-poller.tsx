"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";

interface TicketData {
  number: number;
}

interface TicketPollerProps {
  stripeSessionId: string;
  initialTickets: number[];
  /** Max seconds to poll before giving up (default 30) */
  timeoutSec?: number;
}

export default function TicketPoller({
  stripeSessionId,
  initialTickets,
  timeoutSec = 30,
}: TicketPollerProps) {
  const t = useTranslations("success");
  const [tickets, setTickets] = useState<number[]>(initialTickets);
  const [polling, setPolling] = useState(!initialTickets.length);
  const [timedOut, setTimedOut] = useState(false);
  const attempts = useRef(0);
  const maxAttempts = Math.max(1, Math.floor(timeoutSec / 2));

  useEffect(() => {
    // Already have tickets — no polling needed
    if (initialTickets.length > 0) return;

    const interval = setInterval(async () => {
      attempts.current += 1;

      try {
        const res = await fetch(
          `/api/stripe/session-tickets?session_id=${encodeURIComponent(stripeSessionId)}`
        );
        const data = await res.json();

        if (data.tickets && data.tickets.length > 0) {
          setTickets(data.tickets.map((t: TicketData) => t.number));
          setPolling(false);
          clearInterval(interval);
          return;
        }
      } catch {
        // Swallow fetch errors — retry next interval
      }

      if (attempts.current >= maxAttempts) {
        clearInterval(interval);
        setPolling(false);
        setTimedOut(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [stripeSessionId, initialTickets, maxAttempts]);

  if (!tickets.length && polling) {
    return (
      <div className="mb-8 md:mb-10 rounded-2xl border border-border bg-white p-5 md:p-6 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="mt-3 text-sm text-ink-muted">{t("loading")}</p>
      </div>
    );
  }

  if (timedOut) {
    return (
      <div className="mb-8 md:mb-10 rounded-2xl border border-border bg-white p-5 md:p-6 text-center">
        <p className="text-sm text-ink-muted">{t("webhookTimeout")}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs font-semibold text-gold-dark underline"
        >
          {t("refresh")}
        </button>
      </div>
    );
  }

  if (!tickets.length) return null;

  return (
    <div className="mb-8 md:mb-10 rounded-2xl border border-border bg-white p-5 md:p-6">
      <h2 className="mb-3 md:mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
        {t("ticketNumbers")}
      </h2>
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        {tickets.map((num) => (
          <span
            key={num}
            className="rounded-xl bg-gold-pale px-3 md:px-4 py-1.5 md:py-2 font-mono text-base md:text-lg font-bold text-gold-dark"
          >
            #{num}
          </span>
        ))}
      </div>
      <p className="mt-3 md:mt-4 text-xs text-ink-muted">{t("emailSent")}</p>
    </div>
  );
}
