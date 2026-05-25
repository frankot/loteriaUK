import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { Trophy, Users, PoundSterling, Clock } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminDashboard({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeComps, entriesThisMonth, pendingDraws, totalRevenue] =
    await Promise.all([
      prisma.competition.count({ where: { status: "ACTIVE" } }),
      prisma.entry.count({
        where: { createdAt: { gte: monthStart } },
      }),
      prisma.competition.count({
        where: {
          status: "CLOSED",
          drawDate: { lt: now },
        },
      }),
      // Revenue: sum of ticket prices for PAID entries this month
      prisma.entry.aggregate({
        _count: { id: true },
        where: {
          type: "PAID",
          createdAt: { gte: monthStart },
        },
      }),
    ]);

  // Count total paid entries this month for revenue calc
  const paidEntries = await prisma.entry.count({
    where: { type: "PAID", createdAt: { gte: monthStart } },
  });

  // Rough revenue estimate: entries × average ticket price
  const avgPrice = await prisma.competition.aggregate({
    _avg: { pricePounds: true },
    where: { status: { not: "CANCELLED" } },
  });

  const estimatedRevenue =
    paidEntries * Number(avgPrice._avg.pricePounds || 1.99);

  const stats = [
    {
      label: "Active Competitions",
      value: activeComps,
      icon: Trophy,
      color: "text-gold-dark",
      bg: "bg-gold-pale",
    },
    {
      label: "Entries This Month",
      value: entriesThisMonth,
      icon: Users,
      color: "text-success",
      bg: "bg-success/10",
    },
    {
      label: "Revenue (est.)",
      value: `£${estimatedRevenue.toFixed(0)}`,
      icon: PoundSterling,
      color: "text-ink",
      bg: "bg-cream-warm",
    },
    {
      label: "Pending Draws",
      value: pendingDraws,
      icon: Clock,
      color: "text-urgent",
      bg: "bg-urgent/10",
    },
  ];

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        Dashboard
      </h1>

      {/* Stats Grid */}
      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-border bg-white p-5 shadow-card"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-xs font-medium text-ink-muted">
                {stat.label}
              </span>
            </div>
            <div className="font-serif text-3xl font-bold text-ink">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card">
        <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/${locale}/admin/competitions/new`}
            className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
          >
            + New Competition
          </a>
          <a
            href={`/${locale}/admin/questions/new`}
            className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            + New Question
          </a>
          <a
            href={`/${locale}/admin/competitions`}
            className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            View Competitions
          </a>
          <a
            href={`/${locale}/admin/users`}
            className="rounded-xl border border-border bg-white px-5 py-3 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            View Users
          </a>
        </div>
      </div>
    </div>
  );
}
