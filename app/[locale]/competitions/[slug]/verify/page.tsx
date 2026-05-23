import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { VerifyClient } from "./verify-client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ quantity?: string }>;
};

export default async function VerifyPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const { quantity: qtyStr } = await searchParams;
  const quantity = Math.min(Math.max(parseInt(qtyStr || "1", 10) || 1, 1), 10);

  const competition = await prisma.competition.findUnique({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      slug: true,
      titleEn: true,
      pricePounds: true,
      maxTickets: true,
      ticketsSold: true,
      prizeImageUrl: true,
      prizeCategory: true,
      prizeValue: true,
      drawDate: true,
    },
  });

  if (!competition) notFound();

  const price = Number(competition.pricePounds);
  const total = price * quantity;
  const left = competition.maxTickets - competition.ticketsSold;

  if (left < quantity) {
    return (
      <div className="bg-cream px-12 py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-urgent/10">
            <span className="text-2xl">😢</span>
          </div>
          <h1 className="font-serif mb-3 text-3xl font-semibold">Not enough tickets</h1>
          <p className="mb-6 text-ink-muted">
            Only {left} ticket{left !== 1 ? "s" : ""} remaining — fewer than the {quantity} you selected.
          </p>
          <Link
            href={`/${locale}/competitions/${slug}`}
            className="rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-gold-dark"
          >
            ← Back to competition
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream px-12 py-16">
      <div className="mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-ink-muted">
          <Link href={`/${locale}/competitions`} className="transition-colors hover:text-gold-dark">Competitions</Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/competitions/${slug}`} className="transition-colors hover:text-gold-dark">{competition.titleEn}</Link>
          <span className="mx-2">/</span>
          <span className="text-ink">Verify</span>
        </nav>

        {/* Order summary */}
        <div className="mb-8 rounded-2xl border border-border bg-white p-6 shadow-card">
          <div className="mb-1 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            Order Summary
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold">{competition.titleEn}</h2>
              <p className="text-sm text-ink-muted mt-1">
                {quantity} ticket{quantity > 1 ? "s" : ""} × £{price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-serif text-3xl font-bold text-gold-dark">£{total.toFixed(2)}</div>
              <p className="text-xs text-ink-muted">due on success</p>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            Answer the skill question to continue
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* Skill question + auto-checkout on pass */}
        <VerifyClient
          competitionId={competition.id}
          slug={slug}
          quantity={quantity}
          locale={locale}
        />
      </div>
    </div>
  );
}
