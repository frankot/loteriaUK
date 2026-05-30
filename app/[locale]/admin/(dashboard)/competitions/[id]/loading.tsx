import { Skeleton } from "@/components/ui/skeleton";

export default function CompetitionDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-1">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-8 w-20" />
        ))}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-card space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
