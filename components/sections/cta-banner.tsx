"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/actions/newsletter";
import { CheckCircle } from "lucide-react";

export default function CTABanner() {
  const t = useTranslations("ctaBanner");
  const [state, action, pending] = useActionState(subscribeToNewsletter, {});

  if (state?.success) {
    return (
      <section>
        <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:mt-20">
          <div className="rounded-[16px] md:rounded-[20px] px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 text-center border border-gold/15 bg-gradient-to-br from-[#F5EDDA] via-[#FDF7EC] to-[#F8EFDD]">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <h2 className="font-serif mb-2 text-[24px] sm:text-[28px] md:text-[32px] font-semibold">
              {t("subscribedTitle") || "You're in!"}
            </h2>
            <p className="text-sm md:text-base text-ink-soft">
              {t("subscribedDesc") || "We'll let you know when new prizes drop."}
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:mt-20">
        <div className="rounded-[16px] md:rounded-[20px] px-6 py-10 md:px-12 md:py-14 lg:px-16 lg:py-16 text-center border border-gold/15 bg-gradient-to-br from-[#F5EDDA] via-[#FDF7EC] to-[#F8EFDD]">
          <h2 className="font-serif mb-3 text-[24px] sm:text-[28px] md:text-[32px] lg:text-[36px] leading-tight font-semibold">
            {t("title")}
          </h2>
          <p className="mb-6 md:mb-8 text-sm md:text-base text-ink-soft">
            {t("subtitle")}
          </p>

          <form action={action} className="mx-auto max-w-[420px] space-y-3">
            <div className="flex flex-col sm:flex-row justify-center gap-2.5">
              <input
                type="email"
                name="email"
                required
                placeholder={t("placeholder")}
                className="flex-1 rounded-3xl border border-border bg-white px-5 py-3 md:py-3.5 text-[14px] md:text-[15px] text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-gold"
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-3xl bg-gold px-6 md:px-8 py-3 md:py-3.5 text-[14px] md:text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? t("saving") : t("button")}
              </button>
            </div>
            {state?.error && (
              <p className="text-xs text-urgent">{state.error}</p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
