import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";
import TicketPoller from "@/components/public/ticket-poller";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("success");
  const { session_id } = await searchParams;

  if (!session_id || !process.env.STRIPE_SECRET_KEY) {
    notFound();
  }

  // Verify the Stripe session
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    notFound();
  }

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
        <h1 className="font-serif text-2xl md:text-3xl font-semibold">{t("pendingTitle")}</h1>
        <p className="mt-4 text-sm md:text-base text-ink-muted">
          {t("pendingDesc")}
        </p>
      </div>
    );
  }

  // Fetch the competition for display
  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: { id: true, titleEn: true, prizeImageUrl: true },
  });

  // ── Fetch tickets specifically for this Stripe session ──────
  // Uses the Entry→Ticket relation: entries created by the webhook
  // for this session have the stripeSessionId set.
  let ticketNumbers: number[] = [];

  const entries = await prisma.entry.findMany({
    where: { stripeSessionId: session_id },
    select: {
      ticket: { select: { number: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  ticketNumbers = entries
    .filter((e) => e.ticket)
    .map((e) => e.ticket!.number);

  // Fallback: if webhook hasn't fired yet, try by userId+competitionId
  // (catches cases where user is re-visiting a previously processed success page)
  if (ticketNumbers.length === 0) {
    const { userId, competitionId } = session.metadata || {};
    if (userId && competitionId) {
      const fallbackTickets = await prisma.ticket.findMany({
        where: { userId, competitionId, status: "SOLD" },
        orderBy: { createdAt: "desc" },
        select: { number: true },
        take: 100,
      });
      ticketNumbers = fallbackTickets.map((t) => t.number);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
      {/* Success animation */}
      <div className="mx-auto mb-6 md:mb-8 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-success" />
      </div>

      <h1 className="font-serif mb-3 text-[28px] md:text-[36px] leading-tight font-semibold">
        {t("title")}
      </h1>

      <p className="mb-6 md:mb-8 text-base md:text-lg text-ink-muted">
        {competition
          ? t("subtitle", { title: competition.titleEn })
          : t("fallbackSubtitle")}
      </p>

      {/* Ticket Numbers — polls if webhook hasn't created them yet */}
      <TicketPoller
        stripeSessionId={session_id}
        initialTickets={ticketNumbers}
        timeoutSec={30}
      />

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
        <Link
          href={`/${locale}/profile`}
          className="rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] hover:translate-y-[-1px]"
        >
          {t("viewTickets")}
        </Link>
        <Link
          href={`/${locale}/competitions`}
          className="rounded-3xl border border-border bg-transparent px-8 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
        >
          {t("browseMore")}
        </Link>
      </div>
    </div>
  );
}
