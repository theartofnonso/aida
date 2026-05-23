"use client";

import { useState } from "react";
import type { Projection } from "@/lib/decision";

interface ProjectionCardProps {
  projection: Projection;
}

type Mode = "loss" | "gain";

export default function ProjectionCard({ projection }: ProjectionCardProps) {
  // Loss is the default — losses tend to land harder than equivalent gains.
  const [mode, setMode] = useState<Mode>("loss");
  const view = projection[mode];

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-wider text-ink-soft">
          12 months from now
        </p>
        <div
          role="tablist"
          aria-label="Projection framing"
          className="inline-flex rounded-full bg-canvas border border-line p-0.5"
        >
          <button
            role="tab"
            aria-selected={mode === "loss"}
            type="button"
            onClick={() => setMode("loss")}
            className={
              "px-3 py-1 text-[12.5px] rounded-full transition-colors " +
              (mode === "loss"
                ? "bg-accent text-white"
                : "text-ink-muted hover:text-ink")
            }
          >
            If you wait
          </button>
          <button
            role="tab"
            aria-selected={mode === "gain"}
            type="button"
            onClick={() => setMode("gain")}
            className={
              "px-3 py-1 text-[12.5px] rounded-full transition-colors " +
              (mode === "gain"
                ? "bg-accent text-white"
                : "text-ink-muted hover:text-ink")
            }
          >
            If you act
          </button>
        </div>
      </div>

      <div className="px-5 pb-5">
        <h3 className="font-serif text-[20px] leading-snug text-ink">
          {view.headline}
        </h3>
        <ul className="mt-4 space-y-4" key={mode}>
          {view.items.map((item, i) => (
            <li
              key={mode + i}
              className="flex items-baseline gap-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span
                className={
                  "shrink-0 font-serif text-[22px] leading-none tabular-nums " +
                  (mode === "loss" ? "text-[#9B1C1C]" : "text-emerald-700")
                }
              >
                {item.amount}
              </span>
              <span className="text-[14.5px] text-ink-muted leading-relaxed">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 pt-4 border-t border-line text-[11.5px] text-ink-soft leading-relaxed">
          {projection.disclaimer}
        </p>
      </div>
    </div>
  );
}
