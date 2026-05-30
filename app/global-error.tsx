"use client";

import { AlertCircle, RefreshCw } from "lucide-react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Global error boundary — catches errors in root layout.
 * Must render <html> and <body> tags since the root layout itself failed.
 */
export default function GlobalError({ error, reset }: Props) {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col font-sans bg-cream antialiased">
        <div className="flex min-h-screen items-center justify-center px-4 py-20">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-urgent/10">
              <AlertCircle className="h-8 w-8 text-urgent" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold text-ink">
              Something went wrong
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              A critical error occurred. Please try refreshing the page.
            </p>

            <button
              onClick={reset}
              className="mt-8 inline-flex items-center gap-2 rounded-3xl bg-gold px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh page
            </button>

            {process.env.NODE_ENV === "development" && (
              <details className="mt-8 text-left">
                <summary className="cursor-pointer text-xs font-medium text-ink-muted">
                  Error details
                </summary>
                <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-white p-3 font-mono text-[11px] text-ink-soft">
                  {error.stack || error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
