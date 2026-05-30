import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { CompetitionForm } from "@/components/admin/competition-form";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function EditCompetitionPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const [competition, questions] = await Promise.all([
    prisma.competition.findUnique({ where: { id } }),
    prisma.skillQuestion.findMany({
      select: { id: true, questionEn: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  if (!competition) notFound();

  const defaultValues = {
    titleEn: competition.titleEn,
    titlePl: competition.titlePl || "",
    titleRo: competition.titleRo || "",
    titleBg: competition.titleBg || "",
    slug: competition.slug,
    descEn: competition.descEn || "",
    descPl: competition.descPl || "",
    descRo: competition.descRo || "",
    descBg: competition.descBg || "",
    pricePounds: competition.pricePounds.toString(),
    maxTickets: competition.maxTickets.toString(),
    drawDate: competition.drawDate.toISOString().slice(0, 16),
    prizeImageUrl: competition.prizeImageUrl || "",
    prizeCategory: competition.prizeCategory || "",
    prizeValue: competition.prizeValue?.toString() || "",
    questionId: competition.questionId || "",
    featured: competition.featured,
    status: competition.status,
  };

  return (
    <div>
      <h1 className="mb-8 font-serif text-3xl font-semibold text-ink">
        Edit Competition
      </h1>
      <CompetitionForm
        locale={locale}
        questions={questions}
        defaultValues={defaultValues}
        competitionId={id}
      />
    </div>
  );
}
