import type { Projection } from "@/lib/decision";

interface ProjectionCardProps {
  projection: Projection;
}

/**
 * Loss-only projection card.
 *
 * Earlier iterations toggled between "if you wait" and "if you act" framings.
 * We pulled the toggle: loss aversion is the stronger motivator, and a
 * single frame removes a tap, a decision, and a competing thought.
 */
export default function ProjectionCard({ projection }: ProjectionCardProps) {
  const { loss, timeframeLabel, disclaimer } = projection;

  return (
    <div className="rounded-2xl border border-line bg-surface shadow-soft overflow-hidden">
      <div className="px-5 pt-5 pb-3">
        <p className="text-[12px] font-medium uppercase tracking-wider text-ink-soft">
          {timeframeLabel}
        </p>
      </div>

      <div className="px-5 pb-5">
        <h3 className="font-serif text-[20px] leading-snug text-ink">
          {loss.headline}
        </h3>
        <ul className="mt-4 space-y-4">
          {loss.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-4 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="shrink-0 w-[88px] flex flex-col leading-tight">
                <span className="font-serif text-[24px] tabular-nums leading-none text-[#9B1C1C]">
                  {item.amount}
                </span>
                {item.period && (
                  <span className="mt-1 text-[12px] text-ink-soft">
                    {item.period}
                  </span>
                )}
              </span>
              <span className="text-[14.5px] text-ink-muted leading-relaxed">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 pt-4 border-t border-line text-[11.5px] text-ink-soft leading-relaxed">
          {disclaimer}
        </p>
      </div>
    </div>
  );
}
