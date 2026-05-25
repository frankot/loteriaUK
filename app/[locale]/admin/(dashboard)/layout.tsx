import { redirect } from "next/navigation";
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
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
