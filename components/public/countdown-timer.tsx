"use client";

import { useEffect, useState } from "react";

interface CountdownTimerProps {
  drawDate: Date;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(drawDate: Date): TimeLeft | null {
  const diff = drawDate.getTime() - Date.now();
  if (diff <= 0) return null;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export default function CountdownTimer({ drawDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calcTimeLeft(drawDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calcTimeLeft(drawDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [drawDate]);

  if (!timeLeft) {
    return (
      <div className="rounded-xl border border-border bg-white px-5 py-4 text-center shadow-card">
        <div className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          Time Remaining
        </div>
        <p className="mt-1 text-sm font-semibold text-ink-muted">Draw in progress or completed</p>
      </div>
    );
  }

  const segments = [
    { value: timeLeft.days, label: "days" },
    { value: timeLeft.hours, label: "hours" },
    { value: timeLeft.minutes, label: "minutes" },
    { value: timeLeft.seconds, label: "seconds" },
  ];

  const urgent = timeLeft.days === 0 && timeLeft.hours < 24;

  return (
    <div className="rounded-xl border border-border bg-white px-5 py-4 shadow-card">
      <div className="mb-3 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        Time Remaining
      </div>
      <div className="flex gap-2">
        {segments.map(({ value, label }) => (
          <div key={label} className="flex-1 text-center">
            <div
              className={`rounded-lg px-2 py-2.5 font-mono text-2xl font-bold tabular-nums ${
                urgent ? "bg-urgent/10 text-urgent" : "bg-gold-pale text-gold-dark"
              }`}
            >
              {String(value).padStart(2, "0")}
            </div>
            <div className="mt-1.5 text-[11px] font-medium tracking-wide text-ink-muted uppercase">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
