import { setRequestLocale, getTranslations } from "next-intl/server";
import Hero from "@/components/sections/hero";
import StatsBar from "@/components/sections/stats-bar";
import TrendingPrizes from "@/components/sections/trending-prizes";
import HowItWorks from "@/components/sections/how-it-works";
import Winners from "@/components/sections/winners";
import FAQ from "@/components/sections/faq";
import CTABanner from "@/components/sections/cta-banner";

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
    { q: t("items.6.q"), a: t("items.6.a") },
  ];

  return (
    <>
      <Hero locale={locale} />
      <StatsBar />
      <TrendingPrizes />
      <HowItWorks />
      <Winners />
      <FAQ items={faqItems} title={t("title")} />
      <CTABanner />
    </>
  );
}
