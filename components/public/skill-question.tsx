"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface Question {
  id: string;
  questionEn: string;
  optionAEn: string;
  optionBEn: string;
  optionCEn: string | null;
  optionDEn: string | null;
  correctOption: string;
}

interface SkillQuestionProps {
  competitionId: string;
  initialQuestion: Question | null;
  onPass: (questionId: string, answer: string) => void;
}

export default function SkillQuestion({
  competitionId,
  initialQuestion,
  onPass,
}: SkillQuestionProps) {
  const [question, setQuestion] = useState<Question | null>(initialQuestion);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [attemptedIds, setAttemptedIds] = useState<Set<string>>(
    new Set(initialQuestion ? [initialQuestion.id] : [])
  );
  const [loading, setLoading] = useState(false);
  const [passed, setPassed] = useState(false);
  const fetchingRef = useRef(false);

  // Auto-fetch first question on mount if none assigned
  useEffect(() => {
    if (initialQuestion) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const ids = Array.from(attemptedIds);
        const url = `/api/questions/random?competitionId=${competitionId}&exclude=${ids.join(",")}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API returned " + res.status);
        const q: Question = await res.json();
        setQuestion(q);
        setAttemptedIds((prev) => new Set([...prev, q.id]));
      } catch (e) {
        console.error("Failed to fetch question:", e);
        setQuestion(null);
      } finally {
        setLoading(false);
      }
    };

    load();
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const retry = async () => {
    try {
      const ids = Array.from(attemptedIds);
      const url = `/api/questions/random?competitionId=${competitionId}&exclude=${ids.join(",")}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("API returned " + res.status);
      const q: Question = await res.json();
      setQuestion(q);
      setAttemptedIds((prev) => new Set([...prev, q.id]));
      setSelected(null);
      setResult(null);
    } catch (e) {
      console.error("Failed to fetch question:", e);
      setQuestion(null);
    }
  };

  const handleSubmit = () => {
    if (!selected || !question) return;

    if (selected === question.correctOption) {
      setResult("correct");
      setPassed(true);
      onPass(question.id, selected);
    } else {
      setResult("incorrect");
      setTimeout(() => {
        retry();
      }, 1500);
    }
  };

  const options = question
    ? [
        { key: "A", text: question.optionAEn },
        { key: "B", text: question.optionBEn },
        ...(question.optionCEn ? [{ key: "C", text: question.optionCEn }] : []),
        ...(question.optionDEn ? [{ key: "D", text: question.optionDEn }] : []),
      ]
    : [];

  if (passed) {
    return (
      <div className="rounded-xl border border-success/20 bg-success/5 px-5 py-5 shadow-card">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-6 w-6 text-success" />
          <div>
            <div className="text-sm font-semibold text-success">Correct!</div>
            <div className="text-xs text-ink-muted">You can now purchase your tickets.</div>
          </div>
        </div>
      </div>
    );
  }

  if (!question && !loading) {
    return (
      <div className="rounded-xl border border-border bg-white px-5 py-6 text-center shadow-card">
        <p className="text-sm text-ink-muted">No questions available. Try again later.</p>
        <button
          onClick={retry}
          className="mt-3 rounded-xl border border-gold px-4 py-2 text-xs font-semibold text-gold-dark transition-colors hover:bg-gold-pale"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white px-5 py-6 text-center shadow-card">
        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        <p className="mt-2 text-sm text-ink-muted">Loading question...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white px-5 py-5 shadow-card">
      <div className="mb-1 text-xs font-semibold tracking-wide text-gold-dark uppercase">
        Skill Question
      </div>
      <p className="mb-4 text-[15px] font-medium leading-relaxed text-ink">
        {question?.questionEn}
      </p>

      <div className="mb-4 space-y-2.5">
        {options.map(({ key, text }) => (
          <button
            key={key}
            onClick={() => { if (result !== "incorrect") setSelected(key); }}
            disabled={result === "incorrect"}
            className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm transition-all ${
              selected === key
                ? "border-gold bg-gold-pale font-medium text-gold-dark"
                : "border-border text-ink-soft hover:border-gold/50 hover:bg-gold-pale/30"
            } ${result === "incorrect" ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span
              className="mr-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold"
              style={{
                borderColor: selected === key ? "var(--color-gold)" : "var(--color-border)",
                background: selected === key ? "var(--color-gold)" : "transparent",
                color: selected === key ? "white" : "var(--color-ink-muted)",
              }}
            >
              {key}
            </span>
            {text}
          </button>
        ))}
      </div>

      {result === "incorrect" && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl bg-urgent/10 px-4 py-3">
          <XCircle className="h-5 w-5 flex-shrink-0 text-urgent" />
          <p className="text-sm font-medium text-urgent">
            Incorrect. Loading a different question...
          </p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selected || result === "incorrect"}
        className="w-full rounded-3xl bg-gold px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(184,148,58,0.25)] transition-all hover:translate-y-[-1px] hover:bg-gold-dark hover:shadow-[0_4px_16px_rgba(184,148,58,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Submit Answer
      </button>
    </div>
  );
}
