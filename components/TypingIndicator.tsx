import AidaMark from "./AidaMark";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <AidaMark size={28} />
      <div className="rounded-2xl rounded-bl-md bg-surface border border-line px-4 py-3 shadow-soft">
        <div className="flex items-center gap-1.5">
          <span className="dot-1 inline-block h-1.5 w-1.5 rounded-full bg-ink-soft animate-dot-bounce" />
          <span className="dot-2 inline-block h-1.5 w-1.5 rounded-full bg-ink-soft animate-dot-bounce" />
          <span className="dot-3 inline-block h-1.5 w-1.5 rounded-full bg-ink-soft animate-dot-bounce" />
        </div>
      </div>
    </div>
  );
}
