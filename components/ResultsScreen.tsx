"use client";

import { useState } from "react";
import AidaMark from "./AidaMark";
import ExecutionPanel from "./ExecutionPanel";
import ProjectionCard from "./ProjectionCard";
import type { ResultContent } from "@/lib/decision";

interface ResultsScreenProps {
  result: ResultContent;
  isPartial: boolean;
  onRestart: () => void;
}

function gbp(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

export default function ResultsScreen({
  result,
  isPartial,
  onRestart,
}: ResultsScreenProps) {
  const [executionOpen, setExecutionOpen] = useState(false);
  const [done, setDone] = useState(false);
  const transfer =
    result.optionalAction?.kind === "transfer" ? result.optionalAction : null;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="safe-top px-5 pt-5 max-w-xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <AidaMark size={28} />
          <span className="font-serif text-[17px] tracking-tight text-ink">
            Aida
          </span>
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
            <div className="rounded-2xl border border-line bg-surface shadow-soft p-4 sm:p-5">
              {result.basis && result.basis.length > 0 && (
                <div className="mb-4 -mx-1 flex flex-wrap gap-1.5">
                  {result.basis.map((b) => (
                    <span
                      key={b.label}
                      className="inline-flex items-baseline gap-1.5 rounded-full bg-accent/[0.06] border border-accent/15 px-3 py-1"
                    >
                      <span className="text-[11px] uppercase tracking-wider text-accent-soft">
                        {b.label}
                      </span>
                      <span className="text-[13px] font-medium text-accent">
                        {b.value}
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-2.5">
                {result.numbers.map((line, i) => (
                  <p
                    key={i}
                    className="text-[14.5px] leading-relaxed text-ink-muted"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          </section>
        )}

        <section
          className="mt-6 animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        >
          <h2 className="text-[12px] font-medium uppercase tracking-wider text-ink-soft mb-2">
            One action this week
          </h2>
          <div className="rounded-2xl bg-accent text-white shadow-card p-5">
            <p className="text-[16px] leading-relaxed">{result.nextStep}</p>
          </div>
        </section>

        {transfer && (
          <section
            className="mt-4 animate-fade-in-up"
            style={{ animationDelay: "210ms" }}
          >
            {!done ? (
              <div className="rounded-2xl border border-line bg-surface shadow-soft p-5">
                <p className="text-[14.5px] leading-relaxed text-ink">
                  Open your bank app, move{" "}
                  <span className="text-accent font-medium">
                    {gbp(transfer.amount)}
                  </span>{" "}
                  to your{" "}
                  <span className="text-ink">{transfer.destination}</span>,
                  then come back here to mark it done.
                </p>

                <button
                  type="button"
                  onClick={() => setDone(true)}
                  className="mt-4 w-full flex items-center gap-3 rounded-2xl bg-canvas hover:bg-accent/[0.04] active:bg-accent/[0.08] p-4 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 rounded border-2 border-accent/50 shrink-0"
                  />
                  <span className="text-[15px] font-medium text-ink">
                    I&rsquo;ve moved the {gbp(transfer.amount)}
                  </span>
                </button>

                <div
                  className="my-5 flex items-center gap-3"
                  aria-hidden="true"
                >
                  <span className="flex-1 h-px bg-line" />
                  <span className="text-[11px] uppercase tracking-wider text-ink-soft">
                    or
                  </span>
                  <span className="flex-1 h-px bg-line" />
                </div>

                <p className="text-[13.5px] leading-relaxed text-ink-muted">
                  You&rsquo;ve already done the hardest part. Five questions,
                  a real decision. You&rsquo;re at the finish line. The
                  simplest way to cross it is right here, while the
                  answer&rsquo;s still in front of you.
                </p>
                <button
                  type="button"
                  onClick={() => setExecutionOpen(true)}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-accent/30 bg-canvas hover:bg-accent/[0.04] hover:border-accent/50 py-2.5 px-4 text-[14px] font-medium text-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <span>Move {gbp(transfer.amount)} now</span>
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white text-[13px]"
                >
                  ✓
                </span>
                <div>
                  <p className="text-[14.5px] font-medium text-emerald-900">
                    Done. {gbp(transfer.amount)} moved to{" "}
                    {transfer.destination}.
                  </p>
                  <p className="mt-1 text-[13px] text-emerald-800/80 leading-relaxed">
                    Nice work. That&rsquo;s the part of this decision that
                    actually matters.
                  </p>
                </div>
              </div>
            )}
          </section>
        )}

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
          <ProjectionCard projection={result.projection} />
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

      {transfer && executionOpen && (
        <ExecutionPanel
          action={transfer}
          onClose={() => setExecutionOpen(false)}
          onComplete={() => {
            setExecutionOpen(false);
            setDone(true);
          }}
        />
      )}
    </div>
  );
}
