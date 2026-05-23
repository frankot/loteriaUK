import { getHomepageStats } from "@/lib/queries";

export default async function StatsBar() {
  const stats = await getHomepageStats();

  const items = [
    { value: stats.activeCompetitions.toLocaleString(), label: "Active Competitions", sub: "this week" },
    { value: stats.totalWinners.toLocaleString(), label: "Total Winners", sub: "since 2023" },
    { value: stats.prizesGiven.toLocaleString(), label: "Prizes Given", sub: "" },
    { value: stats.totalEntries.toLocaleString(), label: "Total Entries", sub: "" },
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
