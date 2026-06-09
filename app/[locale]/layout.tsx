import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/session";
import { LayoutShell } from "@/components/layout/layout-shell";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <Suspense
      fallback={
        <NextIntlClientProvider messages={{}}>
          <LayoutShell isLoggedIn={false} />
        </NextIntlClientProvider>
      }
    >
      <AsyncShell>{children}</AsyncShell>
    </Suspense>
  );
}

async function AsyncShell({ children }: { children: React.ReactNode }) {
  const [messages, session] = await Promise.all([
    getMessages(),
    getSession(),
  ]);

  return (
    <NextIntlClientProvider messages={messages}>
      <LayoutShell
        isLoggedIn={!!session.userId}
        userEmail={session.email}
      >
        {children}
      </LayoutShell>
    </NextIntlClientProvider>
  );
}
