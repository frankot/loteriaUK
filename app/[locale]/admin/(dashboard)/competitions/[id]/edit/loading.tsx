import { FormSkeleton } from "@/components/ui/skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditCompetitionLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48 font-serif" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
      <FormSkeleton fields={10} />
    </div>
  );
}
