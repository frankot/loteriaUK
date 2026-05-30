import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRecentWinners } from "@/lib/queries";

export default async function Winners() {
  const t = await getTranslations("winners");
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
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-8 md:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
              {t("badge")}
            </div>
            <h2 className="font-serif text-[28px] sm:text-[32px] md:text-[36px] leading-[1.15] font-semibold">{t("title")}</h2>
          </div>
          <Link
            href="/en/winners"
            className="flex items-center gap-1.5 text-sm font-semibold text-gold-dark transition-[gap] hover:gap-3"
          >
            {t("viewAll")}
          </Link>
        </div>

        {winners.length === 0 ? (
          <div className="rounded-xl border border-border bg-white py-16 text-center text-ink-muted">
            <p className="text-lg">{t("noWinners")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {winners.slice(0, 6).map((w: typeof winners[number]) => (
              <div
                key={w.id}
                className="rounded-xl bg-white px-4 py-5 md:px-5 md:pt-7 md:pb-7 text-center shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover"
              >
                {/* Avatar with green dot */}
                <div className="relative mx-auto mb-3 md:mb-4 inline-block">
                  <div
                    className="flex h-[56px] w-[56px] md:h-[72px] md:w-[72px] items-center justify-center rounded-full text-lg md:text-xl font-bold text-white"
                    style={{ backgroundColor: avatarColor(w.user.name || "?") }}
                  >
                    {initials(w.user.name || t("unknownName"))}
                  </div>
                  <span className="absolute right-0.5 bottom-0.5 block h-3 w-3 md:h-3.5 md:w-3.5 rounded-full border-2 border-white bg-success" />
                </div>

                <div className="mb-1 text-[13px] md:text-[15px] font-semibold">{w.user.name}</div>
                <div className="mb-1 text-[12px] md:text-[13px] font-medium text-gold-dark">{w.competition.titleEn}</div>
                <div className="text-[11px] md:text-xs text-ink-muted">{formatDate(w.createdAt)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
