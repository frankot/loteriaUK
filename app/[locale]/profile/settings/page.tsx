import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ProfileSettingsForm } from "./form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ProfileSettingsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (!session.userId) {
    redirect(`/${locale}/login`);
  }

  const t = await getTranslations("profile");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, address: true, phone: true, email: true },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-12">
      <h1 className="mb-2 font-serif text-3xl font-semibold text-ink">
        {t("settingsTitle")}
      </h1>
      <p className="mb-8 text-sm text-ink-muted">{t("settingsDesc")}</p>

      <div className="rounded-2xl border border-border bg-white p-8 shadow-card">
        <ProfileSettingsForm
          locale={locale}
          defaultValues={{
            name: user?.name || "",
            address: user?.address || "",
            phone: user?.phone || "",
            email: user?.email || "",
          }}
        />
      </div>
    </div>
  );
}
