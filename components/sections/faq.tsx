"use client";

import { useState } from "react";
import { faqs } from "@/lib/data";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="bg-white">
      <div className="mx-auto max-w-7xl px-12 lg:py-20">
        {/* Header */}
        <div className="mb-16 text-center">
          <div className="mb-3 text-xs font-semibold tracking-[2px] text-gold-dark uppercase">
            Common Questions
          </div>
          <h2 className="font-serif mb-4 text-[42px] leading-[1.15] font-semibold">Frequently Asked</h2>
        </div>

        {/* FAQ list */}
        <div className="mx-auto max-w-[720px]">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`border-b border-border-light ${idx === 0 ? "border-t border-border-light" : ""}`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent py-6 text-left font-serif text-lg font-medium text-ink transition-colors hover:text-gold-dark"
                >
                  {faq.q}
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-base transition-all duration-300 ${
                      isOpen
                        ? "rotate-45 border-gold bg-gold text-white"
                        : "border-border text-ink-muted"
                    }`}
                  >
                    +
                  </span>
                </button>
                <div
                  className={`text-[15px] leading-relaxed text-ink-soft ${
                    isOpen ? "faq-answer-open pb-6" : "faq-answer-closed"
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
