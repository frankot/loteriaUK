import { Skeleton } from "@/components/ui/skeleton";

export default function AssignWinnerLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-64 font-serif" />
      </div>

      {/* Search input */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-72" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>

      {/* Result preview placeholder */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    </div>
  );
}
