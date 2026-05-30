import { getTranslations } from "next-intl/server";

export default async function HowItWorks() {
  const t = await getTranslations("howItWorks");

  const steps = [
    {
      num: "01",
      title: t("step1.title"),
      desc: t("step1.desc"),
      badges: null,
    },
    {
      num: "02",
      title: t("step2.title"),
      desc: t("step2.desc"),
      badges: null,
    },
    {
      num: "03",
      title: t("step3.title"),
      desc: t("step3.desc"),
      badges: [`▶ ${t("youtubeLive")}`, `📘 ${t("facebookLive")}`],
    },
  ];

  return (
    <section id="how-it-works" className="bg-cream-warm">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-16 md:py-20 lg:py-20">
        {/* Section header */}
        <div className="mb-10 md:mb-16 text-center">
          <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            {t("badge")}
          </div>
          <h2 className="font-serif mb-4 text-[28px] sm:text-[32px] md:text-[42px] leading-[1.15] font-semibold">{t("title")}</h2>
          <p className="mx-auto max-w-[480px] text-sm md:text-base text-ink-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="steps-line relative flex flex-col md:grid md:grid-cols-3 gap-10 md:gap-12">
          {steps.map((step) => (
            <div key={step.num} className="relative z-10 text-center">
              <div className="mx-auto mb-5 md:mb-7 flex h-[80px] w-[80px] md:h-[104px] md:w-[104px] items-center justify-center rounded-full border-2 border-gold-light bg-white shadow-[0_0_0_8px_var(--color-cream-warm)]">
                <span className="font-serif text-[36px] md:text-[42px] leading-none font-semibold text-gold-dark">
                  {step.num}
                </span>
              </div>
              <h3 className="font-serif mb-2 md:mb-3 text-[20px] md:text-[22px] leading-tight font-semibold">{step.title}</h3>
              <p className="text-[14px] md:text-[15px] leading-relaxed text-ink-soft">{step.desc}</p>
              {step.badges && (
                <div className="mt-4 flex justify-center gap-2.5 flex-wrap">
                  {step.badges.map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 rounded-2xl bg-border-light px-3 py-1 text-xs font-semibold text-ink-soft"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
