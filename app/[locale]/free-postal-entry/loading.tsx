import { Skeleton } from "@/components/ui/skeleton";

export default function FreePostalEntryLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12 md:py-16 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="prose space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="rounded-xl border border-border bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}
