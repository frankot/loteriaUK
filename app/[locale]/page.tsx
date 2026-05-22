import { setRequestLocale } from "next-intl/server";
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

  return (
    <>
      <Hero />
      <StatsBar />
      <TrendingPrizes />
      <HowItWorks />
      <Winners />
      <FAQ />
      <CTABanner />
    </>
  );
}
