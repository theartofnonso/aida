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
  AVAILABLE_CASH,
  buildResult,
  deriveValues,
  selectPath,
  isAnswersComplete,
  USER_PROMPT,
} from "@/lib/decision";
import { buildCoachBrief, type CoachCopy } from "@/lib/coach";
import { fetchCoachCopy, fetchTransition } from "@/lib/llm-client";
import type { DiagnosticAnswers, QuestionId } from "@/lib/types";

type Stage = "intro" | "chat";

type Bubble = {
  id: string;
  from: "aida" | "user";
  text: string;
  /** When set to "summary", the bubble renders an embedded "View full
   *  breakdown" CTA inside it (only valid for Aida bubbles). */
  kind?: "summary";
};

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
  // LLM-generated copy for the results screen. Null = fall back to the
  // deterministic copy in lib/decision.ts.
  const [aiCopy, setAiCopy] = useState<CoachCopy | null>(null);
  // Diagnostic finished — UI shows the summary bubble + "View full breakdown"
  // CTA. The user stays inside the chat.
  const [conversationComplete, setConversationComplete] = useState(false);
  // Whether the detail overlay is currently visible.
  const [showResults, setShowResults] = useState(false);
  // Persistent "I've moved the money" flag. Lifted out of ResultsScreen so it
  // survives the user closing and reopening the overlay.
  const [executionDone, setExecutionDone] = useState(false);

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

  /**
   * Append an Aida bubble without the typing indicator. Used inline after a
   * typing block we already managed (e.g. transition handlers). Pass
   * kind="summary" to embed the "View full breakdown" CTA in the bubble.
   */
  const pushAidaBubble = useCallback(
    (text: string, kind?: "summary") => {
      setMessages((m) => [...m, { id: uid(), from: "aida", text, kind }]);
    },
    [],
  );

  /**
   * Push the question prompt as an Aida bubble before the options deck
   * appears. Keeps the chat transcript auditable — every Q + A is in the
   * history, not just the answer. Brief typing pause for natural pacing.
   */
  const askQuestion = useCallback(
    async (questionId: QuestionId): Promise<boolean> => {
      const token = sessionRef.current;
      const cfg = QUESTION_BY_ID[questionId];
      setTyping(true);
      await sleep(450);
      if (sessionRef.current !== token) return false;
      setTyping(false);
      pushAidaBubble(cfg.prompt);
      await sleep(180);
      if (sessionRef.current !== token) return false;
      setCurrentQuestion(questionId);
      return true;
    },
    [pushAidaBubble],
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
      "Okay, got it. Before we think about what to do with the £3,200, I want to understand a little about where things stand today.",
      900,
    );
    if (sessionRef.current !== token) return;
    await aidaSays(
      "I’ll ask five quick questions. There are no wrong answers. Just enough for me to find the one thing worth doing first.",
      1000,
    );
    if (sessionRef.current !== token) return;
    await askQuestion("debt");
  }, [aidaSays, askQuestion]);

  const finishConversation = useCallback(
    async (finalAnswers: DiagnosticAnswers, wasSkipped: boolean) => {
      const token = sessionRef.current;
      setCurrentQuestion(null);

      // Fire the LLM call immediately so it runs in parallel with the closing
      // chat message. By the time the user finishes reading "Let me put this
      // together", the response is usually back.
      const derived = deriveValues(finalAnswers);
      const path = selectPath(finalAnswers, derived);
      const isPartial = !isAnswersComplete(finalAnswers);
      const result = buildResult(finalAnswers, derived, path);
      const brief = buildCoachBrief(
        finalAnswers,
        derived,
        path,
        isPartial,
        AVAILABLE_CASH,
      );
      const copyPromise = fetchCoachCopy(brief);

      // The Q5 transition already closes the conversation with "let me put
      // your priorities together". No need for a second filler bubble —
      // just show typing while the summary LLM call runs, then land it.
      setTyping(true);
      const minPause = sleep(900);
      const copy = await Promise.race([
        copyPromise,
        sleep(7000).then(() => null),
      ]);
      await minPause;
      if (sessionRef.current !== token) return;

      setAiCopy(copy);
      setTyping(false);

      // Silence the "skip-only" graceful copy too — the summary itself
      // softens its language when isPartial is true.
      void wasSkipped;

      // Push the priority summary as a single Aida chat bubble. The bubble
      // itself carries the "View full breakdown" CTA inline — see render.
      const summaryText = copy?.chatSummary?.trim() || result.chatSummary;
      pushAidaBubble(summaryText, "summary");
      await sleep(180);
      if (sessionRef.current !== token) return;

      setConversationComplete(true);
    },
    [pushAidaBubble],
  );

  const handleAnswer = useCallback(
    async (value: string, label: string) => {
      const q = currentQuestion;
      if (!q) return;
      const config = QUESTION_BY_ID[q];
      const token = sessionRef.current;

      // Pause input + record user bubble + persist answer.
      setCurrentQuestion(null);
      setMessages((m) => [...m, { id: uid(), from: "user", text: label }]);
      const updated: DiagnosticAnswers = {
        ...answers,
        [config.field]: value as never,
      };
      setAnswers(updated);

      const idx = QUESTIONS.findIndex((x) => x.id === q);
      const next = QUESTIONS[idx + 1];

      // Kick the LLM transition off the moment the user answers — it runs
      // alongside the natural reading pause.
      const transitionPromise = fetchTransition({
        questionId: q,
        questionPrompt: config.prompt,
        userAnswer: label,
        questionsRemaining: QUESTIONS.length - 1 - idx,
      });

      setTyping(true);
      await sleep(280);
      if (sessionRef.current !== token) return;

      // Wait for the LLM up to a short budget. If it lands in time, use it;
      // otherwise the deterministic transition steps in.
      const llmTransition = await Promise.race([
        transitionPromise.then((r) => r?.transition ?? null),
        sleep(2000).then(() => null),
      ]);
      if (sessionRef.current !== token) return;

      const transitionText = llmTransition?.trim() || config.transition;
      // Tiny extra typing breath so the bubble doesn't pop in the moment the
      // LLM resolves.
      await sleep(280);
      if (sessionRef.current !== token) return;
      setTyping(false);
      pushAidaBubble(transitionText);
      await sleep(180);
      if (sessionRef.current !== token) return;

      if (next) {
        await askQuestion(next.id);
      } else {
        await finishConversation(updated, false);
      }
    },
    [answers, askQuestion, currentQuestion, finishConversation, pushAidaBubble],
  );

  const handleSkipQuestion = useCallback(async () => {
    const q = currentQuestion;
    if (!q) return;
    const config = QUESTION_BY_ID[q];
    const token = sessionRef.current;

    // Acknowledge the skip in the chat without forcing an answer.
    setCurrentQuestion(null);
    setMessages((m) => [
      ...m,
      { id: uid(), from: "user", text: "I’d rather skip this one." },
    ]);

    const idx = QUESTIONS.findIndex((x) => x.id === q);
    const next = QUESTIONS[idx + 1];

    // LLM transition for the skip too — null userAnswer signals the skip.
    const transitionPromise = fetchTransition({
      questionId: q,
      questionPrompt: config.prompt,
      userAnswer: null,
      questionsRemaining: QUESTIONS.length - 1 - idx,
    });

    setTyping(true);
    await sleep(280);
    if (sessionRef.current !== token) return;

    const llmTransition = await Promise.race([
      transitionPromise.then((r) => r?.transition ?? null),
      sleep(1500).then(() => null),
    ]);
    if (sessionRef.current !== token) return;

    const transitionText =
      llmTransition?.trim() || "No problem. I’ll work with what we have.";

    await sleep(220);
    if (sessionRef.current !== token) return;
    setTyping(false);
    pushAidaBubble(transitionText);
    await sleep(180);
    if (sessionRef.current !== token) return;

    if (next) {
      await askQuestion(next.id);
    } else {
      await finishConversation(answers, true);
    }
  }, [answers, askQuestion, currentQuestion, finishConversation, pushAidaBubble]);

  const handleRestart = useCallback(() => {
    sessionRef.current += 1;
    setStage("intro");
    setMessages([]);
    setAnswers({});
    setCurrentQuestion(null);
    setTyping(false);
    setAiCopy(null);
    setConversationComplete(false);
    setShowResults(false);
    setExecutionDone(false);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  if (stage === "intro") {
    return <IntroScreen onStart={startChat} />;
  }

  const active = currentQuestion ? QUESTION_BY_ID[currentQuestion] : null;

  // Build the result deterministically every render so we always have something
  // to hand the overlay, even before the LLM responds.
  const derived = deriveValues(answers);
  const path = selectPath(answers, derived);
  const result = buildResult(answers, derived, path);
  const isPartial = !isAnswersComplete(answers);
  const dotsCurrent = conversationComplete
    ? QUESTIONS.length
    : Math.max(0, currentIdx);

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
            <ProgressDots total={QUESTIONS.length} current={dotsCurrent} />
          </div>
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto w-full px-4 sm:px-5 pt-5 pb-8 space-y-3">
          {messages.map((m) => {
            if (m.kind === "summary") {
              return (
                <ChatBubble key={m.id} from="aida">
                  <span className="block">{m.text}</span>
                  <button
                    type="button"
                    onClick={() => setShowResults(true)}
                    className="mt-2 inline-flex items-center gap-1 text-[14px] font-medium text-accent hover:text-accent-soft underline underline-offset-4 decoration-accent/30 hover:decoration-accent/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <span>View full breakdown</span>
                    <span aria-hidden="true">→</span>
                  </button>
                  {executionDone && (
                    <span className="mt-2 block text-[12.5px] text-emerald-700">
                      ✓ Action marked done.
                    </span>
                  )}
                </ChatBubble>
              );
            }
            return (
              <ChatBubble key={m.id} from={m.from}>
                {m.text}
              </ChatBubble>
            );
          })}

          {typing && <TypingIndicator />}

          {active && !typing && (
            <div className="pt-2">
              <QuestionDeck
                question={active.id}
                helper={active.helper}
                options={active.options}
                layout={active.layout}
                onAnswer={handleAnswer}
                onSkip={handleSkipQuestion}
              />
            </div>
          )}
        </div>
      </main>

      {showResults && (
        <ResultsScreen
          result={result}
          isPartial={isPartial}
          aiCopy={aiCopy}
          done={executionDone}
          onMarkDone={() => setExecutionDone(true)}
          onRestart={handleRestart}
          onClose={() => setShowResults(false)}
        />
      )}
    </div>
  );
}
