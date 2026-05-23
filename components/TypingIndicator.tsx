import AidaWordmark from "./AidaWordmark";

export default function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <span className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent shadow-soft">
        <AidaWordmark width={52} className="text-white" />
      </span>
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
