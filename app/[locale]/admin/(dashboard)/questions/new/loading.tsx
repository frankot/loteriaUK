import { FormSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function NewQuestionLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40 font-serif" />
      </div>
      <FormSkeleton fields={8} />
    </div>
  );
}
