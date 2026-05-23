import AidaWordmark from "./AidaWordmark";

interface ChatBubbleProps {
  from: "aida" | "user";
  children: React.ReactNode;
}

export default function ChatBubble({ from, children }: ChatBubbleProps) {
  if (from === "aida") {
    return (
      <div className="flex items-end gap-2 animate-fade-in-up">
        <span className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent shadow-soft">
          <AidaWordmark width={52} className="text-white" />
        </span>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-surface border border-line px-4 py-3 shadow-soft text-[15px] leading-relaxed text-ink">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end animate-fade-in-up">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-accent text-white px-4 py-2.5 text-[15px] leading-relaxed">
        {children}
      </div>
    </div>
  );
}
