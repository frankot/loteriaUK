import { getTranslations } from "next-intl/server";
import { getHomepageStats } from "@/lib/queries";

export default async function StatsBar() {
  const t = await getTranslations("stats");
  const stats = await getHomepageStats();

  const items = [
    { value: stats.activeCompetitions.toLocaleString(), label: t("activeCompetitions"), sub: t("thisWeek") },
    { value: stats.totalWinners.toLocaleString(), label: t("totalWinners"), sub: t("since2023") },
    { value: stats.prizesGiven.toLocaleString(), label: t("prizesGiven"), sub: "" },
    { value: stats.totalEntries.toLocaleString(), label: t("totalEntries"), sub: "" },
  ];

  return (
    <section className="px-4 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-card divide-x-0 divide-y lg:divide-y-0 lg:divide-x divide-border-light">
          {items.map(({ value, label, sub }, i) => (
            <div
              key={label}
              className={`px-5 py-6 md:px-10 md:py-8 text-center ${
                i < 2 ? "border-b border-border-light lg:border-b-0" : ""
              } ${i % 2 === 0 ? "border-r border-border-light lg:border-r" : "lg:border-r-0"} ${
                i === 2 ? "border-r border-border-light lg:border-r" : ""
              } ${i === 3 ? "border-r-0" : ""}`}
            >
              <div className="mb-2 font-serif text-[28px] md:text-[36px] leading-none font-semibold text-gold-dark">
                {value}
              </div>
              <div className="text-sm text-ink-muted">
                {label}
                {sub && <span className="block text-xs text-ink-muted/70">{sub}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
