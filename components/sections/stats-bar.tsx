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
    <section className="px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-4 overflow-hidden rounded-2xl bg-white shadow-card">
          {items.map(({ value, label, sub }) => (
            <div key={label} className="stat-divider px-10 py-8 text-center">
              <div className="mb-2 font-serif text-[36px] leading-none font-semibold text-gold-dark">
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
