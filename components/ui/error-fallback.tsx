"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared error UI used by all route-group error.tsx boundaries.
 *
 * Variants:
 * - "public"   — consumer-facing, matches site branding
 * - "admin"    — inside admin dashboard, includes sidebar context
 * - "embedded" — minimal, used inside card/table boundaries
 */

type ErrorVariant = "public" | "admin" | "embedded";

export interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
  variant?: ErrorVariant;
  locale?: string; // for admin back-link
}

const SUPPORT_EMAIL = "support@goldendreandraw.com";

export function ErrorFallback({
  error,
  reset,
  variant = "public",
  locale = "en",
}: ErrorBoundaryProps) {
  useEffect(() => {
    // Log to console in dev; production should go to Sentry / Vercel Observability
    console.error("[ErrorBoundary]", error);
  }, [error]);

  if (variant === "admin") {
    return <AdminErrorFallback error={error} reset={reset} locale={locale} />;
  }

  if (variant === "embedded") {
    return <EmbeddedErrorFallback error={error} reset={reset} />;
  }

  return <PublicErrorFallback error={error} reset={reset} locale={locale} />;
}

/* ── Public ── */

function PublicErrorFallback({
  error,
  reset,
  locale,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  locale: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-cream px-4 py-20">
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-urgent/10">
          <AlertCircle className="h-8 w-8 text-urgent" />
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-ink">
          Something went wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          We encountered an unexpected error. Please try again, and if the
          problem persists, contact us.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-3xl bg-gold px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>

          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-gold-dark"
          >
            <Home className="h-4 w-4" />
            Go to homepage
          </Link>
        </div>

        {/* Support hint */}
        <p className="mt-8 text-xs text-ink-muted">
          Still having issues?{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="font-medium text-gold-dark underline underline-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </p>

        {/* Digested error ID (hidden unless dev) */}
        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="mt-6 font-mono text-[10px] text-ink-muted">
            Digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Admin ── */

function AdminErrorFallback({
  error,
  reset,
  locale,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  locale: string;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center py-16">
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-8 shadow-card text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-urgent/10">
          <AlertCircle className="h-7 w-7 text-urgent" />
        </div>

        <h2 className="text-xl font-semibold text-ink">
          Error loading this page
        </h2>

        <p className="mt-2 text-sm text-ink-muted">
          {error.message || "An unexpected error occurred."}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>

          <Link
            href={`/${locale}/admin`}
            className="rounded-xl border border-border bg-white px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold hover:text-gold-dark"
          >
            <Home className="mr-1.5 inline h-4 w-4" />
            Dashboard
          </Link>
        </div>

        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs font-medium text-ink-muted">
              Error details
            </summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-cream-warm p-3 font-mono text-[11px] text-ink-soft">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

/* ── Embedded (inside cards/tables) ── */

function EmbeddedErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-xl border border-urgent/20 bg-urgent/5 px-5 py-4 text-center">
      <p className="text-sm font-medium text-ink">
        {error.message || "Failed to load."}
      </p>
      <button
        onClick={reset}
        className="mt-2 text-xs font-semibold text-gold-dark underline underline-offset-2 hover:text-gold"
      >
        Retry
      </button>
    </div>
  );
}
