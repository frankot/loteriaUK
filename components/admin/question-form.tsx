"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createQuestion, updateQuestion } from "@/actions/admin";

interface QuestionFormData {
  questionEn: string;
  questionPl: string;
  questionRo: string;
  questionBg: string;
  optionAEn: string;
  optionAPl: string;
  optionARo: string;
  optionABg: string;
  optionBEn: string;
  optionBPl: string;
  optionBRo: string;
  optionBBg: string;
  optionCEn: string;
  optionCPl: string;
  optionCRo: string;
  optionCBg: string;
  optionDEn: string;
  optionDPl: string;
  optionDRo: string;
  optionDBg: string;
  correctOption: string;
}

interface QuestionFormProps {
  locale: string;
  defaultValues?: QuestionFormData;
  questionId?: string;
}

const defaultForm: QuestionFormData = {
  questionEn: "",
  questionPl: "",
  questionRo: "",
  questionBg: "",
  optionAEn: "",
  optionAPl: "",
  optionARo: "",
  optionABg: "",
  optionBEn: "",
  optionBPl: "",
  optionBRo: "",
  optionBBg: "",
  optionCEn: "",
  optionCPl: "",
  optionCRo: "",
  optionCBg: "",
  optionDEn: "",
  optionDPl: "",
  optionDRo: "",
  optionDBg: "",
  correctOption: "A",
};

export function QuestionForm({
  locale,
  defaultValues,
  questionId,
}: QuestionFormProps) {
  const router = useRouter();
  const isEdit = !!questionId;

  const [form, setForm] = useState<QuestionFormData>(
    defaultValues || defaultForm
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update(field: keyof QuestionFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(form)) {
        fd.append(key, value);
      }

      const result = isEdit
        ? await updateQuestion(questionId!, fd)
        : await createQuestion(fd);

      if (result.success) {
        router.push(`/${locale}/admin/questions`);
      } else {
        setError(result.error || "Failed to save");
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      }
    } catch {
      setError("Failed to save");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-gold-pale ${
      fieldErrors[field] ? "border-urgent" : "border-border"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Question Text */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Question Text
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(["En", "Pl", "Ro", "Bg"] as const).map((lang) => (
            <div key={lang}>
              <label className="mb-1 block text-xs font-medium text-ink-muted">
                Question ({lang}){lang === "En" ? " *" : ""}
              </label>
              <input
                type="text"
                value={form[`question${lang}`]}
                onChange={(e) =>
                  update(`question${lang}` as keyof QuestionFormData, e.target.value)
                }
                className={inputClass(`question${lang}`)}
                required={lang === "En"}
              />
              {fieldErrors[`question${lang}`] && (
                <p className="mt-1 text-xs text-urgent">
                  {fieldErrors[`question${lang}`]}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Options */}
      {(["A", "B", "C", "D"] as const).map((option) => (
        <section key={option} className="rounded-xl border border-border bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
            Option {option}{" "}
            <span className="font-normal text-ink-muted">
              {option === "C" || option === "D" ? "(optional)" : "*"}
            </span>
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(["En", "Pl", "Ro", "Bg"] as const).map((lang) => (
              <div key={lang}>
                <label className="mb-1 block text-xs font-medium text-ink-muted">
                  Option {option} ({lang})
                </label>
                <input
                  type="text"
                  value={form[`option${option}${lang}` as keyof QuestionFormData]}
                  onChange={(e) =>
                    update(
                      `option${option}${lang}` as keyof QuestionFormData,
                      e.target.value
                    )
                  }
                  className={inputClass(`option${option}${lang}`)}
                  required={
                    lang === "En" && (option === "A" || option === "B")
                  }
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Correct Answer */}
      <section className="rounded-xl border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold tracking-wide text-gold-dark uppercase">
          Correct Answer
        </h3>
        <div className="flex gap-4">
          {["A", "B", "C", "D"].map((opt) => (
            <label
              key={opt}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border px-5 py-3 transition-colors ${
                form.correctOption === opt
                  ? "border-success bg-success/10 text-success"
                  : "border-border text-ink-muted hover:border-gold"
              }`}
            >
              <input
                type="radio"
                name="correctOption"
                value={opt}
                checked={form.correctOption === opt}
                onChange={() => update("correctOption", opt)}
                className="sr-only"
              />
              <span className="text-sm font-semibold">{opt}</span>
            </label>
          ))}
        </div>
      </section>

      {error && !Object.keys(fieldErrors).length && (
        <div className="rounded-xl bg-urgent/10 px-4 py-3">
          <p className="text-sm text-urgent">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-ink px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink/90 disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Question"
            : "Create Question"}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/${locale}/admin/questions`)}
          className="rounded-xl border border-border px-8 py-3 text-sm font-medium text-ink-muted transition-colors hover:border-gold hover:text-gold-dark"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
