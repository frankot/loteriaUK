"use client";

import { use } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  params: Promise<{ locale: string }>;
};

export default function AdminLoginError({ error, reset, params }: Props) {
  const { locale } = use(params);
  return <ErrorFallback error={error} reset={reset} variant="public" locale={locale} />;
}
