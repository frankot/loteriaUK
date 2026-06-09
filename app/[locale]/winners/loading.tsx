export default function WinnersLoading() {
  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-10 md:py-14 lg:py-18">
      <div className="mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="mb-8 md:mb-12">
          <div className="mb-3 h-4 w-40 animate-pulse rounded-lg bg-border-light" />
          <div className="h-10 md:h-12 w-80 animate-pulse rounded-lg bg-border-light" />
          <div className="mt-3 h-5 w-64 animate-pulse rounded-lg bg-border-light" />
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-5">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl bg-white px-4 py-5 md:px-5 md:pt-7 md:pb-7 shadow-card"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="h-[56px] w-[56px] md:h-[72px] md:w-[72px] animate-pulse rounded-full bg-border-light" />
                <div className="h-4 w-24 animate-pulse rounded-lg bg-border-light" />
                <div className="h-3 w-32 animate-pulse rounded-lg bg-border-light" />
                <div className="h-3 w-16 animate-pulse rounded-lg bg-border-light" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
