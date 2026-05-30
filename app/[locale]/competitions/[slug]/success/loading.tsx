import { Skeleton } from "@/components/ui/skeleton";

export default function SuccessLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 md:py-24 text-center space-y-4">
      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
      <Skeleton className="mx-auto h-8 w-48" />
      <Skeleton className="mx-auto h-5 w-72" />
      <Skeleton className="mx-auto h-4 w-56" />
    </div>
  );
}
