import { CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function CompetitionsPageLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-16">
      {/* Header */}
      <div className="mb-8 md:mb-12">
        <Skeleton className="mb-3 h-3 w-24" />
        <Skeleton className="h-10 sm:h-[42px] w-80" />

        {/* Category filter chips — inside header like real page */}
        <div className="mt-5 md:mt-6 flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
      </div>

      {/* Grid — PAGE_SIZE is 12, but show 9 for skeleton to avoid excess */}
      <CardGridSkeleton count={9} />

      {/* Pagination */}
      <div className="mt-10 md:mt-12 flex items-center justify-center gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-9 w-9 md:h-10 md:w-10 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
