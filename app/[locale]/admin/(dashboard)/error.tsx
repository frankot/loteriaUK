"use client";

import { use } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  params: Promise<{ locale: string }>;
};

export default function AdminError({ error, reset, params }: Props) {
  const { locale } = use(params);
  return <ErrorFallback error={error} reset={reset} variant="admin" locale={locale} />;
}
