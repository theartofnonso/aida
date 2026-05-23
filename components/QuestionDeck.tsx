"use client";

import { useEffect, useRef } from "react";
import type { QuestionId } from "@/lib/types";

export interface DeckOption {
  value: string;
  label: string;
}

interface QuestionDeckProps {
  question: QuestionId;
  prompt: string;
  helper?: string;
  options: DeckOption[];
  onAnswer: (value: string, label: string) => void;
  layout?: "stack" | "grid";
}

export default function QuestionDeck({
  question,
  prompt,
  helper,
  options,
  onAnswer,
  layout = "stack",
}: QuestionDeckProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Bring the question into view when it appears.
    ref.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [question]);

  return (
    <div
      ref={ref}
      className="animate-fade-in-up rounded-2xl border border-line bg-surface shadow-card p-4 sm:p-5"
    >
      <div className="text-xs font-medium uppercase tracking-wider text-ink-soft mb-2">
        Your turn
      </div>
      <p className="text-[16px] sm:text-[17px] font-medium text-ink leading-snug">
        {prompt}
      </p>
      {helper && (
        <p className="mt-1.5 text-[13.5px] text-ink-muted leading-relaxed">
          {helper}
        </p>
      )}
      <div
        className={
          "mt-4 " +
          (layout === "grid"
            ? "grid grid-cols-2 gap-2"
            : "flex flex-col gap-2")
        }
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onAnswer(opt.value, opt.label)}
            className="group w-full text-left rounded-xl border border-line bg-canvas hover:bg-accent/[0.04] hover:border-accent/40 active:bg-accent/[0.08] transition-colors px-4 py-3 text-[15px] text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="flex items-center justify-between gap-3">
              <span>{opt.label}</span>
              <span
                aria-hidden="true"
                className="text-ink-soft group-hover:text-accent transition-colors"
              >
                →
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
