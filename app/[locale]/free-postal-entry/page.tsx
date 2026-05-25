import { setRequestLocale, getTranslations } from "next-intl/server";
import Link from "next/link";

type Props = {
  params: Promise<{ locale: string }>;
};

const requiredFields = ["fullName", "address", "email", "dob", "competition", "answer"] as const;

export default async function FreePostalEntryPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("freePostalEntry");

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="font-serif text-4xl font-semibold text-ink">
          {t("title")}
        </h1>
        <p className="mt-3 text-ink-muted">{t("subtitle")}</p>
      </div>

      {/* Intro */}
      <div className="mb-10 rounded-2xl border border-border bg-white p-8 shadow-card">
        <p className="text-[15px] leading-relaxed text-ink-soft">{t("intro")}</p>
      </div>

      {/* Steps */}
      <section className="mb-10">
        <h2 className="mb-6 font-serif text-2xl font-semibold text-ink">
          {t("howTo")}
        </h2>

        <div className="space-y-5">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="flex gap-5 rounded-xl border border-border bg-white p-6 shadow-card"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-pale text-lg font-bold text-gold-dark">
                {step}
              </div>
              <div>
                <h3 className="font-semibold text-ink">
                  {t(`step${step}.title`)}
                </h3>
                <p className="mt-1 text-sm text-ink-soft">
                  {t(`step${step}.desc`)}
                </p>
                {step === 2 && (
                  <ul className="mt-3 space-y-1.5">
                    {requiredFields.map((field) => (
                      <li
                        key={field}
                        className="flex items-center gap-2 text-sm text-ink-soft"
                      >
                        <span className="text-gold-dark">•</span>
                        {t(`fields.${field}`)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mailing Address */}
      <section className="mb-10">
        <h2 className="mb-4 font-serif text-2xl font-semibold text-ink">
          {t("mailingAddress")}
        </h2>
        <div className="rounded-xl border border-dashed border-gold bg-gold-pale/30 p-6">
          <address className="not-italic space-y-0.5 text-[15px] leading-relaxed text-ink">
            <p className="font-semibold">{t("addressLine1")}</p>
            <p>{t("addressLine2")}</p>
            <p>{t("addressLine3")}</p>
            <p>{t("addressLine4")}</p>
          </address>
        </div>
      </section>

      {/* Rules */}
      <div className="space-y-6">
        <section>
          <h3 className="mb-2 font-serif text-lg font-semibold text-ink">
            {t("deadline")}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">
            {t("deadlineText")}
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-semibold text-ink">
            {t("equalChance")}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">
            {t("equalChanceText")}
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-semibold text-ink">
            {t("limits")}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">
            {t("limitsText")}
          </p>
        </section>

        <section>
          <h3 className="mb-2 font-serif text-lg font-semibold text-ink">
            {t("questions")}
          </h3>
          <p className="text-sm leading-relaxed text-ink-soft">
            {t("questionsText")}
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href={`/${locale}/competitions`}
          className="inline-block rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] hover:translate-y-[-1px]"
        >
          Browse Competitions
        </Link>
      </div>
    </div>
  );
}
