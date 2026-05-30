import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import CompetitionCard from "@/components/public/competition-card";


type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string; page?: string }>;
};

const PAGE_SIZE = 12;

export default async function CompetitionsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("competitionsPage");
  const { category, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);

  const where = {
    status: "ACTIVE" as const,
    ...(category && { prizeCategory: category }),
  };

  const [competitions, totalCount] = await Promise.all([
    prisma.competition.findMany({
      where,
      orderBy: { drawDate: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.competition.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filterOptions: { value: string; labelKey: "all" | "electronics" | "jewellery" | "fashion" | "cash" }[] = [
    { value: "", labelKey: "all" },
    { value: "electronics", labelKey: "electronics" },
    { value: "jewellery", labelKey: "jewellery" },
    { value: "fashion", labelKey: "fashion" },
    { value: "cash", labelKey: "cash" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
          {t("badge")}
        </div>
        <h1 className="font-serif text-[28px] sm:text-[32px] md:text-[42px] leading-[1.15] font-semibold">{t("title")}</h1>

        {/* Category Filter */}
        <div className="mt-5 md:mt-6 flex flex-wrap gap-2">
          {filterOptions.map(({ value, labelKey }) => {
            const isActive = (category || "") === value;
            return (
              <a
                key={value}
                href={value ? `/${locale}/competitions?category=${value}` : `/${locale}/competitions`}
                className={`rounded-full border px-3 md:px-4 py-1.5 text-xs md:text-sm font-medium transition-colors ${
                  isActive
                    ? "border-gold bg-gold-pale text-gold-dark"
                    : "border-border text-ink-muted hover:border-gold/50 hover:text-ink"
                }`}
              >
                {t(`filters.${labelKey}`)}
              </a>
            );
          })}
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
          <p className="text-lg">{t("empty.title")}{category ? t("empty.inCategory") : ""}</p>
          <p className="mt-1 text-sm">{t("empty.checkBack")}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {competitions.map((comp: typeof competitions[number]) => (
              <CompetitionCard
                key={comp.id}
                slug={comp.slug}
                title={comp.titleEn}
                description={comp.descEn}
                category={comp.prizeCategory}
                imageUrl={comp.prizeImageUrl}
                ticketsSold={comp.ticketsSold}
                maxTickets={comp.maxTickets}
                drawDate={comp.drawDate}
                pricePounds={Number(comp.pricePounds)}
                locale={locale}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 md:mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === page;
                const href = `/${locale}/competitions?page=${p}${category ? `&category=${category}` : ""}`;
                return (
                  <a
                    key={p}
                    href={href}
                    className={`flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-lg text-xs md:text-sm font-medium transition-colors ${
                      isCurrent
                        ? "bg-gold text-white"
                        : "border border-border text-ink-muted hover:border-gold hover:text-gold-dark"
                    }`}
                  >
                    {p}
                  </a>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
