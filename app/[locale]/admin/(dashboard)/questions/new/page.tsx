import { setRequestLocale } from "next-intl/server";
import { QuestionForm } from "@/components/admin/question-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewQuestionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        New Question
      </h1>
      <QuestionForm locale={locale} />
    </div>
  );
}
