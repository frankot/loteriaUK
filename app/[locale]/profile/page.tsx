import { redirect } from "next/navigation";
import Link from "next/link";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session.userId) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("profile");

  // Fetch user info
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, address: true, phone: true },
  });

  // Fetch tickets with competition info
  const tickets = await prisma.ticket.findMany({
    where: { userId: session.userId, status: "SOLD" },
    orderBy: { createdAt: "desc" },
    include: {
      competition: {
        select: {
          titleEn: true,
          slug: true,
          prizeImageUrl: true,
          drawDate: true,
        },
      },
    },
    take: 50,
  });

  // Fetch entry history
  const entries = await prisma.entry.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    include: {
      competition: {
        select: { titleEn: true, slug: true },
      },
      ticket: {
        select: { number: true },
      },
    },
    take: 50,
  });

  // Group tickets by competition
  const ticketsByCompetition: Record<
    string,
    {
      competition: { titleEn: string; slug: string; prizeImageUrl: string | null; drawDate: Date };
      tickets: { number: number; id: string }[];
    }
  > = {};

  for (const ticket of tickets) {
    const compId = ticket.competition.slug;
    if (!ticketsByCompetition[compId]) {
      ticketsByCompetition[compId] = {
        competition: ticket.competition,
        tickets: [],
      };
    }
    ticketsByCompetition[compId].tickets.push({
      number: ticket.number,
      id: ticket.id,
    });
  }

  const hasTickets = Object.keys(ticketsByCompetition).length > 0;
  const hasEntries = entries.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-12">
      {/* Header */}
      <div className="mb-10 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-4xl font-semibold text-ink">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">{user?.email}</p>
        </div>
        <Link
          href={`/${locale}/profile/settings`}
          className="rounded-3xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
        >
          {t("settings")}
        </Link>
      </div>

      {/* User Info Card */}
      <div className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t("name")}
            </div>
            <div className="mt-1 text-sm font-medium text-ink">
              {user?.name || t("notProvided")}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t("email")}
            </div>
            <div className="mt-1 text-sm font-medium text-ink truncate">
              {user?.email}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t("address")}
            </div>
            <div className="mt-1 text-sm font-medium text-ink">
              {user?.address || t("notProvided")}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              {t("phone")}
            </div>
            <div className="mt-1 text-sm font-medium text-ink">
              {user?.phone || t("notProvided")}
            </div>
          </div>
        </div>
      </div>

      {/* Tickets Section */}
      <section className="mb-10">
        <h2 className="mb-5 font-serif text-2xl font-semibold text-ink">
          {t("tickets")}
        </h2>

        {!hasTickets ? (
          <EmptyState
            icon="ticket"
            message={t("noTickets")}
            ctaLabel={t("browseCompetitions")}
            ctaHref={`/${locale}/competitions`}
          />
        ) : (
          <div className="space-y-4">
            {Object.entries(ticketsByCompetition).map(([slug, { competition, tickets }]) => (
              <div
                key={slug}
                className="rounded-xl border border-border bg-white p-5 shadow-card"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-ink">{competition.titleEn}</h3>
                    <p className="text-xs text-ink-muted">
                      Draw:{" "}
                      {competition.drawDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <Link
                    href={`/${locale}/competitions/${slug}`}
                    className="text-xs font-semibold text-gold-dark underline hover:text-gold"
                  >
                    View Competition
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tickets
                    .sort((a, b) => a.number - b.number)
                    .map((ticket) => (
                      <span
                        key={ticket.id}
                        className="inline-flex items-center rounded-lg bg-gold-pale px-3 py-1.5 font-mono text-sm font-bold text-gold-dark"
                      >
                        #{ticket.number}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Entry History Section */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-semibold text-ink">
          {t("entries")}
        </h2>

        {!hasEntries ? (
          <EmptyState icon="inbox" message={t("noEntries")} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-cream-warm">
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t("competition")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t("ticketNumber")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t("type")}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                    {t("date")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry: typeof entries[number]) => (
                  <tr
                    key={entry.id}
                    className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/${locale}/competitions/${entry.competition.slug}`}
                        className="font-medium text-ink hover:text-gold-dark"
                      >
                        {entry.competition.titleEn}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      {entry.ticket ? (
                        <span className="font-mono font-semibold text-gold-dark">
                          #{entry.ticket.number}
                        </span>
                      ) : (
                        <span className="text-ink-muted">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${
                          entry.type === "PAID"
                            ? "border-gold/30 bg-gold-pale/50 text-gold-dark"
                            : "border-border bg-cream-warm text-ink-muted"
                        }`}
                      >
                        {entry.type === "PAID" ? t("paid") : t("postal")}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-muted">
                      {entry.createdAt.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
