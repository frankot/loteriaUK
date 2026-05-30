import {
  ProfileHeaderSkeleton,
  Skeleton,
} from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-12">
      <ProfileHeaderSkeleton />

      {/* User Info Card */}
      <div className="mb-10 rounded-2xl border border-border bg-white p-6 shadow-card">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* Tickets */}
      <section className="mb-10 space-y-4">
        <Skeleton className="h-8 w-32" />
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-5 shadow-card space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }, (_, j) => (
                <Skeleton key={j} className="h-8 w-16 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Entry History */}
      <section className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-cream-warm px-5 py-3 flex gap-8">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="border-b border-border-light last:border-b-0 px-5 py-3 flex gap-8">
              {Array.from({ length: 4 }, (_, j) => (
                <Skeleton key={j} className="h-4 w-20" />
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
