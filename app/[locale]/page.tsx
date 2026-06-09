import { Suspense } from "react";
import { setRequestLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/hero";
import StatsBar from "@/components/sections/stats-bar";
import TrendingPrizes from "@/components/sections/trending-prizes";
import HowItWorks from "@/components/sections/how-it-works";
import Winners from "@/components/sections/winners";
import FAQ from "@/components/sections/faq";
import CTABanner from "@/components/sections/cta-banner";
import {
  HeroSkeleton,
  StatsGridSkeleton,
  CardGridSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("faq");

  // Extract FAQ items from i18n messages
  const faqItems = [
    { q: t("items.0.q"), a: t("items.0.a") },
    { q: t("items.1.q"), a: t("items.1.a") },
    { q: t("items.2.q"), a: t("items.2.a") },
    { q: t("items.3.q"), a: t("items.3.a") },
    { q: t("items.4.q"), a: t("items.4.a") },
    { q: t("items.5.q"), a: t("items.5.a") },
  ];

  return (
    <>
      <Suspense fallback={<HeroSkeleton />}>
        <Hero locale={locale} />
      </Suspense>

      <Suspense
        fallback={
          <div className="bg-cream-warm border-y border-border">
            <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10">
              <StatsGridSkeleton />
            </div>
          </div>
        }
      >
        <StatsBar />
      </Suspense>

      <Suspense
        fallback={
          <section>
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
              <div className="mb-8 md:mb-12 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-72" />
              </div>
              <CardGridSkeleton count={6} />
            </div>
          </section>
        }
      >
        <TrendingPrizes />
      </Suspense>

      <HowItWorks />

      <Suspense
        fallback={
          <section>
            <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
              <div className="mb-8 md:mb-12 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-72" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
                {Array.from({ length: 6 }, (_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white px-4 py-5 text-center shadow-card space-y-2"
                  >
                    <Skeleton className="mx-auto h-14 w-14 md:h-[72px] md:w-[72px] rounded-full" />
                    <Skeleton className="mx-auto h-4 w-20" />
                    <Skeleton className="mx-auto h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        }
      >
        <Winners />
      </Suspense>

      <FAQ items={faqItems} title={t("title")} />
      <CTABanner />
    </>
  );
}
