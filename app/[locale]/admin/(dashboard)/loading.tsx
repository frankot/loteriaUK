import { StatsGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboardLoading() {
  return (
    <div>
      <Skeleton className="mb-8 h-9 w-48 font-serif" />

      {/* Stats Grid */}
      <div className="mb-10">
        <StatsGridSkeleton />
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
        <Skeleton className="h-6 w-36 font-serif" />
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-10 w-36 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
