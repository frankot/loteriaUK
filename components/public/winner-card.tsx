import type { Winner, User, Competition } from "@prisma/client";

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

export interface WinnerCardData {
  id: string;
  user: Pick<User, "name" | "email"> & { id?: string };
  competition: Pick<Competition, "titleEn" | "titlePl" | "titleRo" | "titleBg" | "slug">;
  photoUrl: string | null;
  createdAt: Date;
}

interface WinnerCardProps {
  winner: WinnerCardData;
  unknownName: string;
  locale: string;
}

export default function WinnerCard({ winner, unknownName, locale }: WinnerCardProps) {
  const name = winner.user.name || unknownName;

  const title =
    locale === "pl" ? (winner.competition.titlePl || winner.competition.titleEn) :
    locale === "ro" ? (winner.competition.titleRo || winner.competition.titleEn) :
    locale === "bg" ? (winner.competition.titleBg || winner.competition.titleEn) :
    winner.competition.titleEn;

  return (
    <div className="rounded-xl bg-white px-4 py-5 md:px-5 md:pt-7 md:pb-7 text-center shadow-card transition-all duration-300 hover:translate-y-[-2px] hover:shadow-card-hover">
      {/* Avatar with green dot */}
      <div className="relative mx-auto mb-3 md:mb-4 inline-block">
        {winner.photoUrl ? (
          <img
            src={winner.photoUrl}
            alt={name}
            className="h-[56px] w-[56px] md:h-[72px] md:w-[72px] rounded-full object-cover"
          />
        ) : (
          <div
            className="flex h-[56px] w-[56px] md:h-[72px] md:w-[72px] items-center justify-center rounded-full text-lg md:text-xl font-bold text-white"
            style={{ backgroundColor: avatarColor(name) }}
          >
            {initials(name)}
          </div>
        )}
        <span className="absolute right-0.5 bottom-0.5 block h-3 w-3 md:h-3.5 md:w-3.5 rounded-full border-2 border-white bg-success" />
      </div>

      <div className="mb-1 text-[13px] md:text-[15px] font-semibold truncate">{name}</div>
      <div className="mb-1 text-[12px] md:text-[13px] font-medium text-gold-dark truncate">
        {title}
      </div>
      <div className="text-[11px] md:text-xs text-ink-muted">{formatDate(winner.createdAt)}</div>
    </div>
  );
}
