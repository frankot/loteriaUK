import Link from "next/link";
import { getRecentWinners } from "@/lib/queries";

export default async function Winners() {
  const winners = await getRecentWinners(6);

  // Generate deterministic avatar colors from name
  function avatarColor(name: string): string {
    const colors = ["#B8943A", "#5B7A8C", "#9B7B5B", "#8C6B7A", "#5B8C5A", "#C0392B"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function initials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function formatDate(date: Date): string {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  return (
    <section id="winners">
      <div className="mx-auto max-w-7xl px-12 lg:py-20">
        {/* Header */}
        <div className="mb-12 flex items-end justify-between">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              Real People, Real Prizes
            </div>
            <h2 className="font-serif text-[36px] leading-[1.15] font-semibold">Our Recent Winners</h2>
          </div>
          <Link
            href="/en/winners"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            View all winners →
          </Link>
        </div>

        {winners.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
            <p className="text-lg">No winners yet — be the first!</p>
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-5">
            {winners.map((w) => (
              <div
                key={w.id}
                className="rounded-xl bg-white px-5 pt-7 pb-7 text-center shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover"
              >
                {/* Avatar with green dot */}
                <div className="relative mx-auto mb-4 inline-block">
                  <div
                    className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-xl font-bold text-white"
                    style={{ backgroundColor: avatarColor(w.user.name || "?") }}
                  >
                    {initials(w.user.name || "?")}
                  </div>
                  <span className="absolute right-0.5 bottom-0.5 block h-3.5 w-3.5 rounded-full border-2 border-white bg-success" />
                </div>

                <div className="mb-1 text-[15px] font-semibold">{w.user.name}</div>
                <div className="mb-1 text-[13px] font-medium text-gold-dark">{w.competition.titleEn}</div>
                <div className="text-xs text-ink-muted">{formatDate(w.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
