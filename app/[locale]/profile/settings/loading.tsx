import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileSettingsLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-12 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="rounded-xl border border-border bg-white shadow-card">
        <div className="p-6 space-y-5">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-10 w-32 rounded-3xl" />
            <Skeleton className="h-10 w-20 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
