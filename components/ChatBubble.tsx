import AidaMark from "./AidaMark";

interface ChatBubbleProps {
  from: "aida" | "user";
  children: React.ReactNode;
}

export default function ChatBubble({ from, children }: ChatBubbleProps) {
  if (from === "aida") {
    return (
      <div className="flex items-end gap-2 animate-fade-in-up">
        <AidaMark size={28} />
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
