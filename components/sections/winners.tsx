import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRecentWinners } from "@/lib/queries";
import { EmptyState } from "@/components/ui/empty-state";
import WinnerCard from "@/components/public/winner-card";

export default async function Winners() {
  const t = await getTranslations("winners");
  const winners = await getRecentWinners(6);

  return (
    <section id="winners">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              {t("badge")}
            </div>
            <h2 className="font-serif text-[28px] sm:text-[32px] md:text-[36px] leading-[1.15] font-semibold">{t("title")}</h2>
          </div>
          <Link
            href="/en/winners"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            {t("viewAll")}
          </Link>
        </div>

        {winners.length === 0 ? (
          <EmptyState icon="trophy" message={t("noWinners")} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {winners.slice(0, 6).map((w) => (
              <WinnerCard
                key={w.id}
                winner={w}
                unknownName={t("unknownName")}
                locale="en"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
