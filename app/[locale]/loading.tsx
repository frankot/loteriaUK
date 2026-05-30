import {
  HeroSkeleton,
  StatsGridSkeleton,
  CardGridSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function HomepageLoading() {
  return (
    <>
      {/* Hero */}
      <HeroSkeleton />

      {/* Stats Bar */}
      <div className="bg-cream-warm border-y border-border">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-8 md:py-10">
          <StatsGridSkeleton />
        </div>
      </div>

      {/* Trending Competitions */}
      <section>
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:my-20">
          <div className="mb-8 md:mb-12 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-72" />
          </div>
          <CardGridSkeleton count={6} />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-cream-warm border-y border-border py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12">
          <div className="text-center mb-10 space-y-3">
            <Skeleton className="mx-auto h-3 w-16" />
            <Skeleton className="mx-auto h-10 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="rounded-xl bg-white p-6 md:p-8 text-center shadow-card space-y-3">
                <Skeleton className="mx-auto h-12 w-12 rounded-full" />
                <Skeleton className="mx-auto h-5 w-32" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Winners */}
      <section>
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
          <div className="mb-8 md:mb-12 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-72" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="rounded-xl bg-white px-4 py-5 text-center shadow-card space-y-2">
                <Skeleton className="mx-auto h-14 w-14 md:h-[72px] md:w-[72px] rounded-full" />
                <Skeleton className="mx-auto h-4 w-20" />
                <Skeleton className="mx-auto h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-cream-warm border-t border-border">
        <div className="mx-auto max-w-3xl px-4 md:px-8 py-14 md:py-16">
          <div className="text-center mb-8 space-y-3">
            <Skeleton className="mx-auto h-3 w-16" />
            <Skeleton className="mx-auto h-10 w-48" />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="border-b border-border-light last:border-b-0 py-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <div className="bg-cream py-12 md:py-16">
        <div className="mx-auto max-w-2xl px-4 text-center space-y-4">
          <Skeleton className="mx-auto h-8 w-64" />
          <Skeleton className="mx-auto h-5 w-80" />
          <Skeleton className="mx-auto h-12 w-40 rounded-3xl" />
        </div>
      </div>
    </>
  );
}
