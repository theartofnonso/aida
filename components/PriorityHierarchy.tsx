import type { HierarchyItem } from "@/lib/decision";

interface PriorityHierarchyProps {
  items: HierarchyItem[];
}

export default function PriorityHierarchy({ items }: PriorityHierarchyProps) {
  return (
    <div className="rounded-2xl border border-line bg-canvas p-4 sm:p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-soft mb-3">
        Where this fits
      </div>
      <ul className="space-y-2.5">
        {items.map((item) => {
          const symbol =
            item.state === "done" ? "✓" : item.state === "focus" ? "●" : "○";
          const color =
            item.state === "done"
              ? "text-emerald-600"
              : item.state === "focus"
                ? "text-accent"
                : "text-ink-soft";
          const textColor =
            item.state === "focus"
              ? "text-ink font-medium"
              : item.state === "done"
                ? "text-ink-muted"
                : "text-ink-soft";
          return (
            <li
              key={item.label}
              className="flex items-center gap-3 text-[14.5px]"
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center text-[13px] ${color}`}
                aria-hidden="true"
              >
                {symbol}
              </span>
              <span className={textColor}>{item.label}</span>
              {item.state === "focus" && (
                <span className="ml-auto text-[11px] font-medium uppercase tracking-wider text-accent">
                  Focus
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
