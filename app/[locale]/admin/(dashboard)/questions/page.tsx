import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { DeleteQuestionButton } from "./delete-button";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AdminQuestionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const questions = await prisma.skillQuestion.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold text-ink">
          Skill Questions
        </h1>
        <Link
          href={`/${locale}/admin/questions/new`}
          className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-gold-dark"
        >
          + New Question
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-cream-warm">
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Question (EN)
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Options
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Answer
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-ink-muted uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-ink-muted">
                  No questions yet
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-border-light last:border-b-0 hover:bg-cream/50"
                >
                  <td className="max-w-xs truncate px-4 py-3 font-medium text-ink">
                    {q.questionEn}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    A: {q.optionAEn.slice(0, 30)}
                    {q.optionAEn.length > 30 && "..."}
                    <br />
                    B: {q.optionBEn.slice(0, 30)}
                    {q.optionBEn.length > 30 && "..."}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
                      {q.correctOption}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/${locale}/admin/questions/${q.id}/edit`}
                        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
                      >
                        Edit
                      </Link>
                      <DeleteQuestionButton
                        questionId={q.id}
                        locale={locale}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
