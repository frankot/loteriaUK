import { setRequestLocale } from "next-intl/server";
import { AssignWinnerClient } from "./assign-winner-client";

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export default async function AssignWinnerPage({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <AssignWinnerClient locale={locale} competitionId={id} />;
}
