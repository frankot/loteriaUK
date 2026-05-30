import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { EditUserForm } from "./form";
import { EmptyState } from "@/components/ui/empty-state";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditUserPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) notFound();

  // Fetch user's entries for context
  const entries = await prisma.entry.findMany({
    where: { userId: id },
    orderBy: { createdAt: "desc" },
    include: {
      competition: { select: { titleEn: true, slug: true } },
      ticket: { select: { number: true } },
    },
    take: 20,
  });

  return (
    <div>
      <nav className="mb-2 text-xs text-ink-muted">
        <a
          href={`/${locale}/admin/users`}
          className="hover:text-gold-dark"
        >
          Users
        </a>
        <span className="mx-1.5">/</span>
        <span className="text-ink">{user.email}</span>
      </nav>

      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        Edit User
      </h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border bg-white p-6 shadow-card">
            <EditUserForm
              locale={locale}
              userId={id}
              defaultValues={{
                name: user.name || "",
                address: user.address || "",
                phone: user.phone || "",
                dateOfBirth: user.dateOfBirth
                  ? user.dateOfBirth.toISOString().split("T")[0]
                  : "",
                email: user.email,
              }}
            />
          </div>
        </div>

        {/* Entry History Panel */}
        <div>
          <div className="rounded-xl border border-border bg-white p-6 shadow-card">
            <h3 className="mb-4 text-sm font-semibold text-ink">
              Entry History
              <span className="ml-2 font-normal text-ink-muted">
                ({entries.length} recent)
              </span>
            </h3>

            {entries.length === 0 ? (
              <EmptyState icon="inbox" message="No entries" className="py-8" />
            ) : (
              <ul className="space-y-3">
                {entries.map((entry: typeof entries[number]) => (
                  <li
                    key={entry.id}
                    className="rounded-lg border border-border-light p-3 text-xs"
                  >
                    <div className="font-medium text-ink">
                      {entry.competition.titleEn}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-ink-muted">
                      {entry.ticket && (
                        <span className="font-mono text-gold-dark">
                          #{entry.ticket.number}
                        </span>
                      )}
                      <span
                        className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          entry.type === "PAID"
                            ? "bg-gold-pale text-gold-dark"
                            : "bg-cream-warm text-ink-muted"
                        }`}
                      >
                        {entry.type}
                      </span>
                      <span>
                        {entry.createdAt.toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
