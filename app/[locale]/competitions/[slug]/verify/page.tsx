import { notFound } from "next/navigation";
import { MAX_TICKETS_PER_TRANSACTION } from "@/lib/constants";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { VerifyClient } from "./verify-client";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ quantity?: string }>;
};

export default async function VerifyPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("verify");
  const { quantity: qtyStr } = await searchParams;
  const quantity = Math.min(Math.max(parseInt(qtyStr || "1", 10) || 1, 1), MAX_TICKETS_PER_TRANSACTION);

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
      <div className="bg-cream px-4 md:px-8 lg:px-12 py-16 md:py-24">
        <div className="mx-auto max-w-lg text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-urgent/10">
            <span className="text-2xl">😢</span>
          </div>
          <h1 className="font-serif mb-3 text-2xl md:text-3xl font-semibold">{t("notEnoughTitle")}</h1>
          <p className="mb-6 text-sm md:text-base text-ink-muted">
            {t("notEnoughDesc", { left, quantity })}
          </p>
          <Link
            href={`/${locale}/competitions/${slug}`}
            className="inline-block rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-[14px] md:text-[15px] font-semibold text-white transition-all hover:bg-gold-dark"
          >
            {t("backToComp")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-16">
      <div className="mx-auto max-w-2xl">
        {/* Breadcrumb */}
        <nav className="mb-6 md:mb-8 text-sm text-ink-muted">
          <Link href={`/${locale}/competitions`} className="transition-colors hover:text-gold-dark">
            {t("competitions")}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/${locale}/competitions/${slug}`} className="transition-colors hover:text-gold-dark">
            {competition.titleEn}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ink">{t("breadcrumb")}</span>
        </nav>

        {/* Order summary */}
        <div className="mb-6 md:mb-8 rounded-2xl border border-border bg-white p-5 md:p-6 shadow-card">
          <div className="mb-1 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            {t("badge")}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg md:text-xl font-semibold">{competition.titleEn}</h2>
              <p className="text-sm text-ink-muted mt-1">
                {t("ticketCount", { quantity })} × £{price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-serif text-2xl md:text-3xl font-bold text-gold-dark">£{total.toFixed(2)}</div>
              <p className="text-xs text-ink-muted">{t("dueOnSuccess")}</p>
            </div>
          </div>
        </div>

        {/* Section label */}
        <div className="mb-5 md:mb-6 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[11px] md:text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            {t("skillLabel")}
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
