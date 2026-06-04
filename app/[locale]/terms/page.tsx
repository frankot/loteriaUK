import { setRequestLocale, getTranslations, getMessages } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

interface Section {
  number: string;
  title: string;
  body: string;
}



export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("terms");

  const messages = await getMessages();
  const sections = (messages.terms?.sections ?? []) as Section[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
      {/* Header */}
      <div className="mb-12 text-center">
        <p className="mb-2 text-sm font-semibold tracking-[2px] text-gold-dark uppercase">
          {t("subtitle")}
        </p>
        <h1 className="font-serif text-4xl font-semibold text-ink">
          {t("title")}
        </h1>
        <p className="mt-3 text-sm text-ink-muted">{t("description")}</p>
      </div>

      {/* Sections */}
      <div className="space-y-10">
        {sections.map((section, idx) => (
          <section
            key={idx}
            className="rounded-2xl border border-border bg-white p-6 shadow-card sm:p-8"
          >
            <h2 className="mb-4 font-serif text-xl font-semibold text-ink">
              <span className="text-gold-dark">{section.number}</span>{" "}
              {section.title}
            </h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-ink-soft">
              {section.body.split("\n\n").map((paragraph, pIdx) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                // Detect if this paragraph is a list (starts with letters/numbers followed by parentheses)
                if (
                  /^[a-zA-Z0-9]+\.\s/.test(trimmed) ||
                  /^[a-zA-Z0-9]+\)\s/.test(trimmed)
                ) {
                  return (
                    <p key={pIdx} className="pl-4">
                      {trimmed}
                    </p>
                  );
                }

                return <p key={pIdx}>{trimmed}</p>;
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 rounded-2xl border border-dashed border-gold bg-gold-pale/30 p-6 text-center sm:p-8">
        <p className="text-sm leading-relaxed text-ink-soft">{t("footer")}</p>
      </div>
    </div>
  );
}
