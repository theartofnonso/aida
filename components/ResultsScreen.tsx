"use client";

import { useState } from "react";
import AidaMark from "./AidaMark";
import PriorityHierarchy from "./PriorityHierarchy";
import type { ResultContent } from "@/lib/decision";

interface ResultsScreenProps {
  result: ResultContent;
  isPartial: boolean;
  onRestart: () => void;
}

export default function ResultsScreen({
  result,
  isPartial,
  onRestart,
}: ResultsScreenProps) {
  const [done, setDone] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="safe-top px-5 pt-5 max-w-xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AidaMark size={28} />
            <span className="font-serif text-[17px] tracking-tight text-ink">
              Aida
            </span>
          </div>
          <button
            type="button"
            onClick={onRestart}
            className="text-[13px] text-ink-muted hover:text-ink transition-colors"
          >
            Start over
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 pt-6 pb-10 max-w-xl mx-auto w-full">
        <div className="animate-fade-in-up">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent/80 mb-3">
            Your priority
          </p>
          <h1 className="font-serif text-[30px] sm:text-[36px] leading-[1.1] tracking-tight text-ink">
            {result.label}
          </h1>
          <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">
            {result.headline}
          </p>
        </div>

        {isPartial && (
          <div className="mt-5 rounded-xl bg-accent/[0.06] border border-accent/15 px-4 py-3 text-[13.5px] text-accent-soft leading-relaxed animate-fade-in-up">
            Based on what you&rsquo;ve shared so far. You can revisit this any
            time as more comes into focus.
          </div>
        )}

        <section
          className="mt-7 animate-fade-in-up"
          style={{ animationDelay: "60ms" }}
        >
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-ink-soft mb-2">
            Why this matters
          </h2>
          <p className="text-[15.5px] leading-relaxed text-ink">
            {result.why}
          </p>
        </section>

        {result.numbers && result.numbers.length > 0 && (
          <section
            className="mt-6 animate-fade-in-up"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="text-[12px] font-medium uppercase tracking-wider text-ink-soft mb-2">
              Your numbers
            </h2>
            <div className="rounded-2xl border border-line bg-surface shadow-soft p-4 sm:p-5 space-y-2.5">
              {result.numbers.map((line, i) => (
                <p
                  key={i}
                  className="text-[14.5px] leading-relaxed text-ink-muted"
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
        )}

        <section
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-ink-soft mb-2">
            One next step
          </h2>
          <div className="rounded-2xl bg-accent text-white shadow-card p-5">
            <p className="text-[16px] leading-relaxed">
              {result.nextStep}
            </p>
            {result.optionalAction && (
              <div className="mt-4 pt-4 border-t border-white/15">
                {!done ? (
                  <button
                    type="button"
                    onClick={() => setDone(true)}
                    className="text-[13.5px] text-white/85 hover:text-white transition-colors"
                  >
                    {result.optionalAction.label} →
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-[13.5px] text-white/85">
                    <span aria-hidden="true">✓</span>
                    <span>Marked as done. That&rsquo;s the work.</span>
                  </div>
                )}
                <p className="mt-1.5 text-[12px] text-white/55 leading-relaxed">
                  {result.optionalAction.description}
                </p>
              </div>
            )}
          </div>
        </section>

        <section
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: "240ms" }}
        >
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-ink-soft mb-2">
            One action this week
          </h2>
          <div className="rounded-2xl border border-line bg-surface shadow-soft p-4 sm:p-5">
            <p className="text-[15px] leading-relaxed text-ink">
              {result.weeklyAction}
            </p>
          </div>
        </section>

        {result.educational && (
          <section
            className="mt-6 animate-fade-in-up"
            style={{ animationDelay: "300ms" }}
          >
            <div className="rounded-xl bg-accent/[0.05] border border-accent/15 p-4">
              <div className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-accent text-[14px]"
                >
                  ✱
                </span>
                <p className="text-[14px] leading-relaxed text-ink-muted">
                  {result.educational}
                </p>
              </div>
            </div>
          </section>
        )}

        <section
          className="mt-7 animate-fade-in-up"
          style={{ animationDelay: "360ms" }}
        >
          <PriorityHierarchy items={result.hierarchy} />
        </section>

        <section
          className="mt-7 animate-fade-in-up"
          style={{ animationDelay: "420ms" }}
        >
          <p className="text-[14px] leading-relaxed text-ink-muted italic">
            {result.continuity}
          </p>
        </section>

        <div
          className="mt-8 grid gap-3 animate-fade-in-up"
          style={{ animationDelay: "480ms" }}
        >
          <button
            type="button"
            onClick={onRestart}
            className="w-full rounded-2xl bg-surface border border-line text-ink py-3.5 px-5 text-[15px] hover:bg-accent/[0.04] hover:border-accent/30 transition-colors"
          >
            Start a new conversation
          </button>
        </div>

        <footer className="mt-10 pt-6 border-t border-line">
          <p className="text-[11.5px] leading-relaxed text-ink-soft">
            {result.compliance}
          </p>
        </footer>
      </main>
    </div>
  );
}
