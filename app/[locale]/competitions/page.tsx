import { setRequestLocale } from "next-intl/server";
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

  return (
    <div className="mx-auto max-w-7xl px-12 py-16">
      {/* Header */}
      <div className="mb-12">
        <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
          All Competitions
        </div>
        <h1 className="font-serif text-[42px] leading-[1.15] font-semibold">Browse Prizes</h1>

        {/* Category Filter */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { value: "", label: "All" },
            { value: "electronics", label: "Electronics" },
            { value: "jewellery", label: "Jewellery" },
            { value: "fashion", label: "Fashion" },
            { value: "cash", label: "Cash" },
          ].map(({ value, label }) => {
            const isActive = (category || "") === value;
            return (
              <a
                key={value}
                href={value ? `/${locale}/competitions?category=${value}` : `/${locale}/competitions`}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-gold bg-gold-pale text-gold-dark"
                    : "border-border text-ink-muted hover:border-gold/50 hover:text-ink"
                }`}
              >
                {label}
              </a>
            );
          })}
        </div>
      </div>

      {competitions.length === 0 ? (
        <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
          <p className="text-lg">No competitions found{category ? " in this category" : ""}</p>
          <p className="mt-1 text-sm">Check back soon for new prizes</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-6">
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
            <div className="mt-12 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                const isCurrent = p === page;
                const href = `/${locale}/competitions?page=${p}${category ? `&category=${category}` : ""}`;
                return (
                  <a
                    key={p}
                    href={href}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
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
