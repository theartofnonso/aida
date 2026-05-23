"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AidaWordmark from "@/components/AidaWordmark";
import ChatBubble from "@/components/ChatBubble";
import IntroScreen from "@/components/IntroScreen";
import ProgressDots from "@/components/ProgressDots";
import QuestionDeck, { DeckOption } from "@/components/QuestionDeck";
import ResultsScreen from "@/components/ResultsScreen";
import TypingIndicator from "@/components/TypingIndicator";
import {
  buildResult,
  deriveValues,
  selectPath,
  isAnswersComplete,
  USER_PROMPT,
} from "@/lib/decision";
import type { DiagnosticAnswers, QuestionId } from "@/lib/types";

type Stage = "intro" | "chat" | "thinking" | "results";

type Bubble = { id: string; from: "aida" | "user"; text: string };

interface QuestionConfig {
  id: QuestionId;
  field: keyof DiagnosticAnswers;
  prompt: string;
  helper?: string;
  options: DeckOption[];
  layout?: "stack" | "grid";
  transition: string;
}

const QUESTIONS: QuestionConfig[] = [
  {
    id: "debt",
    field: "hasHighInterestDebt",
    prompt: "Do you currently have any high-interest debt?",
    helper:
      "Things like credit cards, overdrafts, buy-now-pay-later balances, or personal loans.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "I’m not sure" },
    ],
    transition:
      "Thanks. I just want to check whether anything urgent needs attention before thinking longer term.",
  },
  {
    id: "essentials",
    field: "monthlyEssentials",
    prompt: "Roughly how much do your essentials cost each month?",
    helper:
      "Rent, bills, groceries, transport, and minimum debt payments. A ballpark is fine.",
    options: [
      { value: "under_1000", label: "Under £1,000" },
      { value: "1000_1500", label: "£1,000 to £1,500" },
      { value: "1500_2000", label: "£1,500 to £2,000" },
      { value: "2000_plus", label: "£2,000+" },
    ],
    transition:
      "That helps me get a sense of how much flexibility and safety you already have.",
  },
  {
    id: "emergency",
    field: "emergencySavingsStatus",
    prompt: "Do you already have emergency savings, separate from this £3,200?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "some", label: "Some, but probably not enough" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "Not sure" },
    ],
    transition:
      "Okay. I’m checking whether this money needs to protect you first, before doing anything else.",
  },
  {
    id: "horizon",
    field: "needsMoneyWithin12Months",
    prompt: "Do you think you’ll need this money within the next 12 months?",
    helper: "Moving, travel, emergency costs, or a large purchase, for example.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "not_sure", label: "I’m not sure" },
    ],
    transition:
      "Last one. I just want to understand what feels most important to you right now.",
  },
  {
    id: "priority",
    field: "emotionalPriority",
    prompt: "What feels most important to improve right now?",
    options: [
      { value: "security", label: "Feeling more financially secure" },
      { value: "stop_idle", label: "Stopping money from sitting idle" },
      { value: "organised", label: "Getting better organised with money" },
      { value: "wealth", label: "Starting to build long-term wealth" },
      { value: "not_sure", label: "I’m not sure" },
    ],
    transition:
      "Thanks for sharing that. Give me a moment to put this together.",
  },
];

const QUESTION_BY_ID = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
) as Record<QuestionId, QuestionConfig>;

function uid() {
  return Math.random().toString(36).slice(2, 11);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function Page() {
  const [stage, setStage] = useState<Stage>("intro");
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionId | null>(
    null,
  );
  const [answers, setAnswers] = useState<DiagnosticAnswers>({});

  // Cancellation token so an in-flight async flow stops if the user restarts.
  const sessionRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Always scroll the chat to the latest content as it grows.
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, typing, currentQuestion, stage]);

  const currentIdx = useMemo(
    () =>
      currentQuestion ? QUESTIONS.findIndex((q) => q.id === currentQuestion) : -1,
    [currentQuestion],
  );

  const aidaSays = useCallback(
    async (text: string, typingMs = 750) => {
      const token = sessionRef.current;
      setTyping(true);
      await sleep(typingMs);
      if (sessionRef.current !== token) return;
      setTyping(false);
      setMessages((m) => [...m, { id: uid(), from: "aida", text }]);
      // Tiny breath after a message lands before continuing the script.
      await sleep(180);
    },
    [],
  );

  const startChat = useCallback(async () => {
    sessionRef.current += 1;
    const token = sessionRef.current;
    setStage("chat");
    setAnswers({});
    setCurrentQuestion(null);

    // Replay what the user typed on the intro as their first chat message,
    // so the conversation feels continuous instead of starting cold.
    setMessages([{ id: uid(), from: "user", text: USER_PROMPT }]);

    await sleep(400);
    if (sessionRef.current !== token) return;
    await aidaSays(
      "Okay, got it. Before I suggest anything with that £3,200, I want to understand a bit about where you stand today.",
      900,
    );
    if (sessionRef.current !== token) return;
    await aidaSays(
      "I’ll ask five quick questions. There are no wrong answers. Just enough for me to find the one thing worth doing first.",
      1000,
    );
    if (sessionRef.current !== token) return;
    setCurrentQuestion("debt");
  }, [aidaSays]);

  const finishConversation = useCallback(
    async (wasSkipped: boolean) => {
      setCurrentQuestion(null);
      setStage("thinking");
      await aidaSays(
        wasSkipped
          ? "Got it. I’ll work with what you’ve shared so far."
          : "Thanks. Let me put this together.",
        700,
      );
      await sleep(900);
      setStage("results");
    },
    [aidaSays],
  );

  const handleAnswer = useCallback(
    async (value: string, label: string) => {
      const q = currentQuestion;
      if (!q) return;
      const config = QUESTION_BY_ID[q];

      // Pause input + record user bubble + persist answer.
      setCurrentQuestion(null);
      setMessages((m) => [...m, { id: uid(), from: "user", text: label }]);
      const updated: DiagnosticAnswers = {
        ...answers,
        [config.field]: value as never,
      };
      setAnswers(updated);

      const token = sessionRef.current;
      await sleep(280);
      if (sessionRef.current !== token) return;

      const idx = QUESTIONS.findIndex((x) => x.id === q);
      const next = QUESTIONS[idx + 1];

      // Always give the transition message, it's part of the conversational pacing.
      await aidaSays(config.transition, 900);
      if (sessionRef.current !== token) return;

      if (next) {
        setCurrentQuestion(next.id);
      } else {
        await finishConversation(false);
      }
    },
    [aidaSays, answers, currentQuestion, finishConversation],
  );

  const handleSkipQuestion = useCallback(async () => {
    const q = currentQuestion;
    if (!q) return;

    // Acknowledge the skip in the chat without forcing an answer.
    setCurrentQuestion(null);
    setMessages((m) => [
      ...m,
      { id: uid(), from: "user", text: "I’d rather skip this one." },
    ]);

    const token = sessionRef.current;
    await sleep(280);
    if (sessionRef.current !== token) return;

    await aidaSays("No problem. I’ll work with what we have.", 700);
    if (sessionRef.current !== token) return;

    const idx = QUESTIONS.findIndex((x) => x.id === q);
    const next = QUESTIONS[idx + 1];
    if (next) {
      setCurrentQuestion(next.id);
    } else {
      await finishConversation(true);
    }
  }, [aidaSays, currentQuestion, finishConversation]);

  const handleRestart = useCallback(() => {
    sessionRef.current += 1;
    setStage("intro");
    setMessages([]);
    setAnswers({});
    setCurrentQuestion(null);
    setTyping(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (stage === "intro") {
    return <IntroScreen onStart={startChat} />;
  }

  if (stage === "results") {
    const derived = deriveValues(answers);
    const path = selectPath(answers, derived);
    const result = buildResult(answers, derived, path);
    const isPartial = !isAnswersComplete(answers);
    return (
      <ResultsScreen
        result={result}
        isPartial={isPartial}
        onRestart={handleRestart}
      />
    );
  }

  // chat + thinking share a layout
  const active = currentQuestion ? QUESTION_BY_ID[currentQuestion] : null;

  return (
    <div className="min-h-screen flex flex-col bg-canvas">
      <header className="safe-top px-5 pt-4 pb-3 border-b border-line/70 bg-canvas/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-xl mx-auto w-full flex items-center gap-3">
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Start over"
            className="flex items-center group hover:opacity-80 transition-opacity"
          >
            <AidaWordmark width={68} />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <ProgressDots
              total={QUESTIONS.length}
              current={
                stage === "thinking"
                  ? QUESTIONS.length
                  : Math.max(0, currentIdx)
              }
            />
          </div>
        </div>
      </header>

      <main
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-xl mx-auto w-full px-4 sm:px-5 pt-5 pb-8 space-y-3">
          {messages.map((m) => (
            <ChatBubble key={m.id} from={m.from}>
              {m.text}
            </ChatBubble>
          ))}

          {typing && <TypingIndicator />}

          {active && !typing && (
            <div className="pt-2">
              <QuestionDeck
                question={active.id}
                prompt={active.prompt}
                helper={active.helper}
                options={active.options}
                layout={active.layout}
                onAnswer={handleAnswer}
                onSkip={handleSkipQuestion}
              />
            </div>
          )}

          {stage === "thinking" && !typing && (
            <div className="flex items-center gap-2 text-[13.5px] text-ink-muted pl-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Putting your priority together.
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
