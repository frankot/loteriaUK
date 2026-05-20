export default function StatsBar() {
  const stats = [
    { value: "48,270", label: "Winners since 2023" },
    { value: "£2.4M", label: "Total prizes awarded" },
    { value: "99.8%", label: "Payout completion rate" },
    { value: "★★★★★", label: "Trustpilot · 2,340 reviews", isStars: true },
  ];

  return (
    <section className="px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-4 overflow-hidden rounded-2xl bg-white shadow-card">
          {stats.map(({ value, label, isStars }) => (
            <div key={label} className="stat-divider px-10 py-8 text-center">
              <div
                className={`mb-2 text-[36px] leading-none font-semibold ${
                  isStars ? "text-lg text-gold" : "font-serif text-gold-dark"
                }`}
              >
                {value}
              </div>
              <div className="text-sm text-ink-muted">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
