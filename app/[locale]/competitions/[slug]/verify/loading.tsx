import { Skeleton } from "@/components/ui/skeleton";

export default function VerifyLoading() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 md:py-24 space-y-6">
      <div className="text-center space-y-3">
        <Skeleton className="mx-auto h-8 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
      </div>
      <div className="rounded-xl border border-border bg-white p-6 shadow-card space-y-4">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2 justify-center">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-12 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
