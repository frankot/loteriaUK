import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { CheckCircle } from "lucide-react";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function SuccessPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
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

  if (session.payment_status !== "paid") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-3xl font-semibold">Payment Pending</h1>
        <p className="mt-4 text-ink-muted">
          Your payment is still being processed. You&apos;ll receive a confirmation email shortly.
        </p>
      </div>
    );
  }

  // Fetch the competition for display
  const competition = await prisma.competition.findUnique({
    where: { slug },
    select: { id: true, titleEn: true, prizeImageUrl: true },
  });

  // Fetch tickets for this user + competition
  const { competitionId, userId } = session.metadata || {};
  let tickets: { number: number }[] = [];
  if (competitionId && userId) {
    tickets = await prisma.ticket.findMany({
      where: { competitionId, userId },
      orderBy: { number: "asc" },
      select: { number: true },
      take: 20,
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      {/* Success animation */}
      <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle className="h-12 w-12 text-success" />
      </div>

      <h1 className="font-serif mb-3 text-[36px] leading-tight font-semibold">
        Payment Successful!
      </h1>

      <p className="mb-8 text-lg text-ink-muted">
        {competition
          ? `You've entered the ${competition.titleEn} competition.`
          : "Your entry has been confirmed."}
      </p>

      {/* Ticket Numbers */}
      {tickets.length > 0 && (
        <div className="mb-10 rounded-2xl border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
            Your Ticket Numbers
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {tickets.map((t: typeof tickets[number]) => (
              <span
                key={t.number}
                className="rounded-xl bg-gold-pale px-4 py-2 font-mono text-lg font-bold text-gold-dark"
              >
                #{t.number}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink-muted">
            A confirmation email has been sent with these details.
          </p>
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex justify-center gap-4">
        <Link
          href={`/${locale}/profile`}
          className="rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] hover:translate-y-[-1px]"
        >
          View My Tickets
        </Link>
        <Link
          href={`/${locale}/competitions`}
          className="rounded-3xl border border-border bg-transparent px-8 py-3.5 text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
        >
          Browse More
        </Link>
      </div>
    </div>
  );
}
