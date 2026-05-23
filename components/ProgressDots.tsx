interface ProgressDotsProps {
  total: number;
  current: number; // index of current question (0-based)
}

export default function ProgressDots({ total, current }: ProgressDotsProps) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Question ${Math.min(current + 1, total)} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <span
            key={i}
            className={
              "block h-1.5 rounded-full transition-all duration-500 " +
              (active
                ? "w-6 bg-accent"
                : done
                  ? "w-1.5 bg-accent/70"
                  : "w-1.5 bg-ink-soft/30")
            }
          />
        );
      })}
    </div>
  );
}
