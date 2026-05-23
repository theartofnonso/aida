"use client";

import { useEffect, useState } from "react";
import type { TransferAction } from "@/lib/decision";

interface ExecutionPanelProps {
  action: TransferAction;
  onClose: () => void;
  onComplete: () => void;
}

type Step = "confirm" | "processing" | "success";

function gbp(n: number) {
  return `£${n.toLocaleString("en-GB")}`;
}

export default function ExecutionPanel({
  action,
  onClose,
  onComplete,
}: ExecutionPanelProps) {
  const [step, setStep] = useState<Step>("confirm");

  useEffect(() => {
    if (step !== "processing") return;
    const t = setTimeout(() => setStep("success"), 1800);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && step !== "processing") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exec-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink/40 backdrop-blur-sm animate-fade-in"
      onClick={step === "processing" ? undefined : onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl shadow-card overflow-hidden animate-fade-in-up safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 flex items-center justify-end">
          {step !== "processing" && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="text-ink-soft hover:text-ink text-[20px] leading-none h-8 w-8 rounded-full inline-flex items-center justify-center hover:bg-ink/[0.04] transition-colors"
            >
              &times;
            </button>
          )}
        </div>

        {step === "confirm" && (
          <div className="px-5 sm:px-6 py-5">
            <h2
              id="exec-title"
              className="font-serif text-[22px] leading-tight text-ink"
            >
              Let&rsquo;s move {gbp(action.amount)} to your{" "}
              {action.destination}.
            </h2>
            <p className="mt-1.5 text-[14.5px] text-ink-muted leading-relaxed">
              Here&rsquo;s exactly what&rsquo;s about to happen. Nothing
              actually moves until you tap confirm in your bank app.
            </p>

            <div className="mt-5 rounded-2xl border border-line bg-canvas/60">
              <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                <span className="text-[12.5px] uppercase tracking-wider text-ink-soft">
                  From
                </span>
                <span className="text-[14.5px] text-ink">{action.source}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <span className="text-[12.5px] uppercase tracking-wider text-ink-soft">
                  Amount
                </span>
                <span className="font-serif text-[26px] text-accent leading-none">
                  {gbp(action.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-line">
                <span className="text-[12.5px] uppercase tracking-wider text-ink-soft">
                  To
                </span>
                <span className="text-[14.5px] text-ink">
                  {action.destination}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[12.5px] font-medium uppercase tracking-wider text-ink-soft mb-3">
                What you&rsquo;ll see next
              </p>
              <ol className="space-y-2.5">
                {[
                  "Your bank will open in a secure window.",
                  "You log in the same way you usually do.",
                  `The ${gbp(action.amount)} transfer will be ready for you to confirm.`,
                  "You come back here when it’s done.",
                ].map((line, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-[14px] text-ink-muted leading-relaxed"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/[0.08] text-accent text-[11px] font-medium"
                    >
                      {i + 1}
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setStep("processing")}
              className="mt-5 w-full rounded-2xl bg-accent text-white py-3.5 px-5 text-[15.5px] font-medium shadow-soft hover:bg-accent-soft transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Continue to my bank
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-2xl py-2.5 text-[14px] text-ink-muted hover:text-ink transition-colors"
            >
              I&rsquo;ll do it myself
            </button>
          </div>
        )}

        {step === "processing" && (
          <div className="px-5 sm:px-6 py-10 flex flex-col items-center text-center">
            <div
              className="flex items-center gap-1.5 mb-5"
              aria-label="Confirming with your bank"
            >
              <span className="dot-1 inline-block h-2 w-2 rounded-full bg-accent animate-dot-bounce" />
              <span className="dot-2 inline-block h-2 w-2 rounded-full bg-accent animate-dot-bounce" />
              <span className="dot-3 inline-block h-2 w-2 rounded-full bg-accent animate-dot-bounce" />
            </div>
            <p className="text-[16px] text-ink font-medium">
              Talking to your bank.
            </p>
            <p className="mt-2 text-[14px] text-ink-muted leading-relaxed max-w-sm">
              This usually takes a few seconds. You don&rsquo;t need to do
              anything from here.
            </p>
          </div>
        )}

        {step === "success" && (
          <div className="px-5 sm:px-6 py-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-full bg-accent text-white flex items-center justify-center text-[24px] mb-3 shadow-soft">
                ✓
              </div>
              <h2
                id="exec-title"
                className="font-serif text-[24px] leading-tight text-ink"
              >
                Done. {gbp(action.amount)} is in your {action.destination}.
              </h2>
              <p className="mt-3 text-[14.5px] text-ink-muted max-w-sm leading-relaxed">
                It&rsquo;ll show up as a normal transfer in your bank app in a
                minute or two.
              </p>
              <p className="mt-2 text-[13.5px] text-ink-soft max-w-sm leading-relaxed">
                Changed your mind? You can move it back from your bank
                whenever you like. This isn&rsquo;t a one-way decision.
              </p>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="mt-6 w-full rounded-2xl bg-accent text-white py-3.5 px-5 text-[15.5px] font-medium shadow-soft hover:bg-accent-soft transition-colors"
            >
              Back to your priority
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
