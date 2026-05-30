"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface FaqItem {
  q: string;
  a: string;
}

interface FAQProps {
  items: FaqItem[];
  title: string;
}

export default function FAQ({ items, title }: FAQProps) {
  const t = useTranslations("faq");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8 lg:px-12 py-14 md:py-16 lg:py-20">
        {/* Header */}
        <div className="mb-10 md:mb-16 text-center">
          <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            {t("badge")}
          </div>
          <h2 className="font-serif mb-4 text-[28px] sm:text-[32px] md:text-[42px] leading-[1.15] font-semibold">{title}</h2>
        </div>

        {/* FAQ list */}
        <div className="mx-auto max-w-[720px]">
          {items.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`border-b border-border-light ${idx === 0 ? "border-t border-border-light" : ""}`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent py-5 md:py-6 text-left font-serif text-base md:text-lg font-medium text-ink transition-colors hover:text-gold-dark"
                >
                  <span className="pr-2">{faq.q}</span>
                  <span
                    className={`flex h-6 w-6 md:h-7 md:w-7 flex-shrink-0 items-center justify-center rounded-full border text-sm md:text-base transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 border-gold bg-gold text-white"
                        : "border-border text-ink-muted"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`text-[14px] md:text-[15px] leading-relaxed text-ink-soft ${
                    isOpen ? "faq-answer-open pb-5 md:pb-6" : "faq-answer-closed"
                  }`}
                >
                  {faq.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
