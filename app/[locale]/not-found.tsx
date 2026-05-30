import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NotFound({ params }: Props) {
  const { locale } = await (params ?? Promise.resolve({ locale: "en" }));
  setRequestLocale(locale);
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-20">
      <div className="w-full max-w-lg text-center">
        <p className="font-serif text-[120px] sm:text-[160px] md:text-[200px] leading-none font-bold text-gold/20 select-none">
          404
        </p>

        <div className="-mt-8 md:-mt-12">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-semibold text-ink">
            {t("title")}
          </h1>

          <p className="mt-3 text-sm md:text-[15px] leading-relaxed text-ink-muted max-w-sm mx-auto">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center justify-center gap-2 rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)]"
            >
              {t("goHome")}
            </Link>
            <Link
              href={`/${locale}/competitions`}
              className="inline-flex items-center justify-center gap-2 rounded-3xl border border-border bg-transparent px-6 md:px-8 py-3 md:py-3.5 text-sm md:text-[15px] font-medium text-ink transition-all hover:border-gold hover:text-gold-dark"
            >
              {t("browseCompetitions")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
