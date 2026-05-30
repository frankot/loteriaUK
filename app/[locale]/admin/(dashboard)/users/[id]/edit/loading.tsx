import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEditUserLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-48 font-serif" />
      </div>

      <div className="rounded-xl border border-border bg-white shadow-card">
        <div className="border-b border-border bg-cream-warm px-6 py-5">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="p-6 space-y-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
