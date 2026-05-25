import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { CompetitionForm } from "@/components/admin/competition-form";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NewCompetitionPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const questions = await prisma.skillQuestion.findMany({
    select: { id: true, questionEn: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        New Competition
      </h1>
      <CompetitionForm locale={locale} questions={questions} />
    </div>
  );
}
