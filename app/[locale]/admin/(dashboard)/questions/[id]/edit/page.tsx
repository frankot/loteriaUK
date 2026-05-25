import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { QuestionForm } from "@/components/admin/question-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditQuestionPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const question = await prisma.skillQuestion.findUnique({
    where: { id },
  });

  if (!question) notFound();

  const defaultValues = {
    questionEn: question.questionEn,
    questionPl: question.questionPl || "",
    questionRo: question.questionRo || "",
    questionBg: question.questionBg || "",
    optionAEn: question.optionAEn,
    optionAPl: question.optionAPl || "",
    optionARo: question.optionARo || "",
    optionABg: question.optionABg || "",
    optionBEn: question.optionBEn,
    optionBPl: question.optionBPl || "",
    optionBRo: question.optionBRo || "",
    optionBBg: question.optionBBg || "",
    optionCEn: question.optionCEn || "",
    optionCPl: question.optionCPl || "",
    optionCRo: question.optionCRo || "",
    optionCBg: question.optionCBg || "",
    optionDEn: question.optionDEn || "",
    optionDPl: question.optionDPl || "",
    optionDRo: question.optionDRo || "",
    optionDBg: question.optionDBg || "",
    correctOption: question.correctOption,
  };

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        Edit Question
      </h1>
      <QuestionForm
        locale={locale}
        defaultValues={defaultValues}
        questionId={id}
      />
    </div>
  );
}
