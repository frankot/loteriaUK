import { FormSkeleton } from "@/components/ui/skeleton";

export default function NewCompetitionLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          New Competition
        </h1>
      </div>
      <FormSkeleton fields={10} />
    </div>
  );
}
