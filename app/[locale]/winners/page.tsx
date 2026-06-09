import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getWinnersPaginated } from "@/lib/queries";
import { EmptyState } from "@/components/ui/empty-state";
import WinnerCard from "@/components/public/winner-card";

const WINNERS_PER_PAGE = 20;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
};

export default async function WinnersPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("winners");
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const { winners, totalCount } = await getWinnersPaginated(page, WINNERS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(totalCount / WINNERS_PER_PAGE));

  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-10 md:py-14 lg:py-18">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            {t("badge")}
          </div>
          <h1 className="font-serif text-[32px] sm:text-[40px] md:text-[48px] leading-[1.15] font-semibold">
            {t("allWinnersTitle")}
          </h1>
          <p className="mt-3 text-sm md:text-base text-ink-muted">
            {t("allWinnersSubtitle", { count: totalCount })}
          </p>
        </div>

        {winners.length === 0 ? (
          <EmptyState icon="trophy" message={t("noWinners")} />
        ) : (
          <>
            {/* Winners grid — 5 cols on large, 3 on tablet, 2 on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
              {winners.map((w) => (
                <WinnerCard
                  key={w.id}
                  winner={w}
                  unknownName={t("unknownName")}
                  locale={locale}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10 md:mt-14 flex items-center justify-center gap-4">
                {page > 1 ? (
                  <Link
                    href={`/${locale}/winners${page > 2 ? `?page=${page - 1}` : ""}`}
                    className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
                  >
                    ← {t("previous")}
                  </Link>
                ) : (
                  <span className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink-muted/40 cursor-not-allowed select-none">
                    ← {t("previous")}
                  </span>
                )}

                <span className="text-sm text-ink-muted">
                  {t("pageOf", { page, total: totalPages })}
                </span>

                {page < totalPages ? (
                  <Link
                    href={`/${locale}/winners?page=${page + 1}`}
                    className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
                  >
                    {t("next")} →
                  </Link>
                ) : (
                  <span className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink-muted/40 cursor-not-allowed select-none">
                    {t("next")} →
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
