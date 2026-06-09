"use client";

import { use } from "react";
import { ErrorFallback } from "@/components/ui/error-fallback";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  params: Promise<{ locale: string }>;
};

export default function CompetitionsError({ error, reset, params }: Props) {
  const locale = params ? use(params).locale : "en";
  return <ErrorFallback error={error} reset={reset} variant="public" locale={locale} />;
}
