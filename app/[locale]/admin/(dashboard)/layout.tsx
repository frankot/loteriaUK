import { redirect } from "next/navigation";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { AdminSidebar } from "../sidebar";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function DashboardLayout({ children, params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session.userId || session.role !== "admin") {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="flex min-h-screen bg-cream-warm">
      <AdminSidebar locale={locale} />
      <div className="flex-1 overflow-x-hidden">
        {/* Mobile top bar — visible below lg breakpoint */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-border bg-white px-3 py-2.5 lg:hidden">
          <Link
            href={`/${locale}/admin`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-cream-warm"
          >
            Dashboard
          </Link>
          <Link
            href={`/${locale}/admin/competitions`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-cream-warm"
          >
            Competitions
          </Link>
          <Link
            href={`/${locale}/admin/winners`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-cream-warm"
          >
            Winners
          </Link>
          <Link
            href={`/${locale}/admin/questions`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-cream-warm"
          >
            Questions
          </Link>
          <Link
            href={`/${locale}/admin/users`}
            className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium text-ink-soft hover:bg-cream-warm"
          >
            Users
          </Link>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-10 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
