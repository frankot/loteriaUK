import { getTranslations } from "next-intl/server";

export default async function CTABanner() {
  const t = await getTranslations("ctaBanner");

  return (
    <section>
      <div className="mx-auto max-w-7xl px-12 lg:mt-20">
        <div className="rounded-[20px] px-16 py-16 text-center border border-gold/15 bg-gradient-to-br from-[#F5EDDA] via-[#FDF7EC] to-[#F8EFDD]">
          <h2 className="font-serif mb-3 text-[36px] leading-tight font-semibold">{t("title")}</h2>
          <p className="mb-8 text-base text-ink-soft">{t("subtitle")}</p>
          <div className="mx-auto flex max-w-[420px] justify-center gap-2.5">
            <input
              type="email"
              placeholder={t("placeholder")}
              disabled
              className="flex-1 rounded-3xl border border-border bg-white px-5 py-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold disabled:cursor-not-allowed disabled:opacity-60"
            />
            <button
              disabled
              className="inline-flex cursor-pointer items-center gap-2 rounded-3xl bg-gold px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("button")}
            </button>
          </div>
          <p className="mt-3 text-xs text-ink-muted">← {t("disabled")}</p>
        </div>
      </div>
    </section>
  );
}
