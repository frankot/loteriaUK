import { notFound } from "next/navigation";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { AlertCircle, CheckCircle } from "lucide-react";
import TicketPoller from "@/components/public/ticket-poller";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ payment_id?: string }>;
};

export default async function SuccessPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("success");
  const { payment_id } = await searchParams;

  if (!payment_id) {
    notFound();
  }

  const payment = await prisma.payment.findUnique({
    where: { id: payment_id },
    include: {
      competition: {
        select: { id: true, slug: true, titleEn: true, prizeImageUrl: true },
      },
      entries: {
        select: { ticket: { select: { number: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!payment || payment.provider !== "CASHFLOWS" || payment.competition.slug !== slug) {
    notFound();
  }

  const initialTickets = payment.entries
    .filter((entry) => entry.ticket)
    .map((entry) => entry.ticket!.number);

  if (["FAILED", "CANCELLED", "EXPIRED", "PROCESSING_FAILED"].includes(payment.status)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
        <div className="mx-auto mb-6 md:mb-8 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-urgent/10">
          <AlertCircle className="h-10 w-10 md:h-12 md:w-12 text-urgent" />
        </div>
        <h1 className="font-serif text-2xl md:text-3xl font-semibold">{t("failedTitle")}</h1>
        <p className="mt-4 text-sm md:text-base text-ink-muted">{t("failedDesc")}</p>
        <div className="mt-8 flex justify-center">
          <Link
            href={`/${locale}/competitions/${slug}`}
            className="rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:bg-gold-dark"
          >
            {t("tryAgain")}
          </Link>
        </div>
      </div>
    );
  }

  const isPending = payment.status !== "PAID" || initialTickets.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 md:py-24 text-center">
      <div className="mx-auto mb-6 md:mb-8 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-success/10">
        <CheckCircle className="h-10 w-10 md:h-12 md:w-12 text-success" />
      </div>

      <h1 className="font-serif mb-3 text-[28px] md:text-[36px] leading-tight font-semibold">
        {isPending ? t("pendingTitle") : t("title")}
      </h1>

      <p className="mb-6 md:mb-8 text-base md:text-lg text-ink-muted">
        {isPending
          ? t("pendingDesc")
          : t("subtitle", { title: payment.competition.titleEn })}
      </p>

      <TicketPoller
        paymentId={payment.id}
        initialTickets={initialTickets}
        timeoutSec={30}
      />

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
