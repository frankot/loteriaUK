import Header from "@/components/layout/header";
import Hero from "@/components/sections/hero";
import StatsBar from "@/components/sections/stats-bar";
import TrendingPrizes from "@/components/sections/trending-prizes";
import HowItWorks from "@/components/sections/how-it-works";
import Winners from "@/components/sections/winners";
import FAQ from "@/components/sections/faq";
import CTABanner from "@/components/sections/cta-banner";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <>
      <Header />
      <Hero />
      <StatsBar />
      <TrendingPrizes />
      <HowItWorks />
      <Winners />
      <FAQ />
      <CTABanner />
      <Footer />
    </>
  );
}
