import Link from "next/link";

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-full flex flex-col font-sans bg-cream antialiased">
        <div className="flex min-h-screen items-center justify-center px-4 py-20">
          <div className="w-full max-w-lg text-center">
            <p className="font-serif text-[120px] sm:text-[160px] md:text-[200px] leading-none font-bold text-gold/20 select-none">
              404
            </p>

            <div className="-mt-8 md:-mt-12">
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-ink">
                Page not found
              </h1>

              <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-ink-muted max-w-sm mx-auto">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/en"
                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
                >
                  Back to Home
                </Link>
                <Link
                  href="/en/competitions"
                  className="inline-flex items-center justify-center gap-2 rounded-3xl border border-border bg-transparent px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
                >
                  Browse Competitions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
