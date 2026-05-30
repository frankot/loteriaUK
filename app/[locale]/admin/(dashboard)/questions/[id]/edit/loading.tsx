import { FormSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function EditQuestionLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-48 font-serif" />
      </div>
      <FormSkeleton fields={8} />
    </div>
  );
}
