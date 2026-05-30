import { cn } from "@/lib/utils";

/** Base pulse skeleton — extends with className for sizing */
function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-border-light",
        className,
      )}
      style={style}
    />
  );
}

/** Card skeleton — matches CompetitionCard layout */
export function CardSkeleton() {
  return (
    <div className="rounded-xl bg-white shadow-card overflow-hidden">
      {/* Image area */}
      <Skeleton className="h-[200px] sm:h-[220px] w-full rounded-none" />
      {/* Body */}
      <div className="p-4 md:p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}

/** Grid of card skeletons */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Table skeleton — matches admin DataTable layout */
export function TableSkeleton({
  columns = 5,
  rows = 5,
}: {
  columns?: number;
  rows?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* Header */}
      <div className="border-b border-border bg-cream-warm px-4 py-3">
        <div className="flex gap-6">
          {Array.from({ length: columns }, (_, i) => (
            <Skeleton
              key={i}
              className="h-3 w-16"
              style={{ flex: i === 0 ? 2 : 1 }}
            />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="border-b border-border-light last:border-b-0 px-4 py-3"
        >
          <div className="flex gap-6">
            {Array.from({ length: columns }, (_, j) => (
              <Skeleton
                key={j}
                className="h-4 w-20"
                style={{ flex: j === 0 ? 2 : 1 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Form skeleton — labeled inputs */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-card">
      <div className="border-b border-border bg-cream-warm px-6 py-5">
        <Skeleton className="h-6 w-1/4" />
      </div>
      <div className="p-6 space-y-5">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}

/** Stats card skeleton */
export function StatsCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-card space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

/** Stats grid (4 cards) */
export function StatsGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Hero section skeleton */
export function HeroSkeleton() {
  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-16 md:py-24 lg:py-32">
      <div className="mx-auto max-w-7xl text-center">
        <Skeleton className="mx-auto h-4 w-32 mb-4" />
        <Skeleton className="mx-auto h-12 sm:h-14 md:h-16 w-3/4 max-w-xl mb-4" />
        <Skeleton className="mx-auto h-5 w-2/3 max-w-md mb-6" />
        <Skeleton className="mx-auto h-12 w-40 rounded-3xl" />
      </div>
    </div>
  );
}

/** Profile header skeleton */
export function ProfileHeaderSkeleton() {
  return (
    <div className="mb-10 flex items-start justify-between">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-28 rounded-3xl" />
    </div>
  );
}

/** Competition detail skeleton */
export function CompetitionDetailSkeleton() {
  return (
    <div className="bg-cream px-4 md:px-8 lg:px-12 py-8 md:py-12 lg:py-16">
      <div className="mx-auto max-w-6xl">
        {/* Breadcrumb */}
        <div className="flex gap-2 mb-6 md:mb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 lg:gap-14">
          {/* Prize image */}
          <div>
            <Skeleton className="h-[280px] sm:h-[340px] md:h-[400px] lg:h-[480px] w-full rounded-xl md:rounded-2xl" />
          </div>
          {/* Details */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 rounded-full" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            {/* Info chips */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
            {/* Progress bar */}
            <Skeleton className="h-10 w-full rounded-lg" />
            {/* Buy button */}
            <Skeleton className="h-12 w-full rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Full-page skeleton: heading + content area */
export function PageSkeleton({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-10 md:py-12 lg:py-16", className)}>
      <div className="mb-8 md:mb-10 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 sm:h-12 w-60" />
      </div>
      {children}
    </div>
  );
}

/** Admin page skeleton: heading + actions row + table */
export function AdminPageSkeleton({
  heading = "w-48",
  hasAction = false,
  children,
  columns = 6,
}: {
  heading?: string;
  hasAction?: boolean;
  children?: React.ReactNode;
  columns?: number;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className={cn("h-9 font-serif", heading)} />
        {hasAction && <Skeleton className="h-10 w-40 rounded-xl" />}
      </div>
      {/* Filter tabs */}
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
      </div>
      {children || <TableSkeleton columns={columns} />}
    </div>
  );
}

/** Generic heading + content page skeleton (login, register, verify) */
export function SimpleFormPageSkeleton({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24">
      <div className="space-y-3 mb-8 text-center">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>
      {children || (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-3xl" />
        </div>
      )}
    </div>
  );
}

export { Skeleton };
