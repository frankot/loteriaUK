import { Suspense } from "react";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getSession } from "@/lib/session";
import { LoginForm } from "./form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default function LoginPage({ params }: Props) {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginPageInner params={params} />
    </Suspense>
  );
}

async function LoginPageInner({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSession();
  if (session.userId) {
    redirect(`/${locale}`);
  }

  return <LoginForm />;
}
