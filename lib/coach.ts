/**
 * Boundary types between the deterministic decision layer (lib/decision.ts)
 * and the LLM presentation layer (app/api/coach, app/api/transition).
 *
 * The LLM never decides priority, calculates numbers, or recommends products.
 * It only translates a structured decision into Aida's voice.
 */

import { ESSENTIALS_LABEL, type Derived } from "@/lib/decision";
import type {
  DiagnosticAnswers,
  EmergencyStatus,
  EmotionalPriority,
  PathId,
  YesNoNotSure,
} from "@/lib/types";

// ── Brief: what the LLM sees ────────────────────────────────────────────────

export interface CoachBrief {
  /** The priority path already chosen by selectPath() — never overrideable. */
  path: PathId;
  /** Human label for the path. */
  pathLabel: string;
  /** Why this path was chosen, in deterministic terms (audit trail). */
  pathReason: string;
  /** The user's emotional priority answer, or null if skipped. */
  emotionalPriority: EmotionalPriority | null;
  /** Whether the user skipped one or more diagnostic questions. */
  isPartial: boolean;
  /** Inputs the user gave, presented as facts. Nulls = skipped. */
  inputs: {
    hasHighInterestDebt: YesNoNotSure | null;
    monthlyEssentialsRange: string | null;
    monthlyEssentialsMidpointGbp: number | null;
    emergencySavingsStatus: EmergencyStatus | null;
    needsMoneyWithin12Months: YesNoNotSure | null;
  };
  /** The user's available cash and derived numbers. */
  numbers: {
    availableCashGbp: number;
    sixWeekBufferTargetGbp: number | null;
    bufferGapGbp: number | null;
    bufferMet: boolean | null;
  };
}

// ── CoachCopy: what the LLM returns for the results screen ─────────────────

export interface CoachCopy {
  /** 1 sentence (max 14 words) framing the priority in human terms. */
  headline: string;
  /** 2–3 sentences explaining why this matters, tied to emotional priority. */
  why: string;
  /** 1 short sentence with a soft educational note. Can be empty string. */
  educational: string;
  /** 1 sentence about what comes next after they act. */
  continuity: string;
  /**
   * Short summary written for the in-chat Aida bubble that wraps the
   * diagnostic. 2–3 sentences, ~60 words. Includes the priority in plain
   * English, one sentence why, and the recommended next action.
   */
  chatSummary: string;
}

// ── TransitionBrief: what the LLM sees for chat transitions ────────────────

export interface TransitionBrief {
  /** Which question the user just answered. */
  questionId: "debt" | "essentials" | "emergency" | "horizon" | "priority";
  /** The literal question prompt the user saw. */
  questionPrompt: string;
  /** The literal answer label the user picked, or null if they skipped. */
  userAnswer: string | null;
  /** How many questions remain after this one. */
  questionsRemaining: number;
}

export interface TransitionCopy {
  /** 10–25 word acknowledgement of the answer. */
  transition: string;
}

// ── JSON schemas for structured output ─────────────────────────────────────

export const COACH_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    headline: {
      type: "string",
      description:
        "1 sentence (max 14 words) framing the priority in plain English. No products. No invented numbers.",
    },
    why: {
      type: "string",
      description:
        "1 or 2 short sentences (max 35 words total) explaining why this matters. Lead with the user's emotional priority if present. Tight, not flowery. No products. No invented numbers.",
    },
    educational: {
      type: "string",
      description:
        "1 short sentence with a soft educational note. Empty string if nothing useful to add.",
    },
    continuity: {
      type: "string",
      description:
        "1 sentence about what Aida can help with after they act on this.",
    },
    chatSummary: {
      type: "string",
      description:
        "Short summary written for an in-chat Aida bubble that closes out the diagnostic. 2 to 3 sentences (max 60 words). Lead with the priority in plain English, then one sentence why, then one sentence on the recommended next action. Conversational, no preamble, no markdown.",
    },
  },
  required: ["headline", "why", "educational", "continuity", "chatSummary"],
  additionalProperties: false,
} as const;

export const TRANSITION_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    transition: {
      type: "string",
      description:
        "A single sentence (10 to 25 words) acknowledging the user's answer and orienting them to the next question. No questions, no jargon, no em-dashes.",
    },
  },
  required: ["transition"],
  additionalProperties: false,
} as const;

// ── Brief builder ──────────────────────────────────────────────────────────

const PATH_LABEL: Record<PathId, string> = {
  debt: "Understand your debt first",
  buffer: "Build your first financial buffer",
  accessibility: "Keep this money accessible",
  longterm: "You may be ready to think longer term",
};

const PATH_REASON: Record<PathId, string> = {
  debt: "User reported having high-interest debt. Debt repayment takes priority before saving or investing.",
  buffer:
    "User has no or partial emergency buffer, or cash coverage is below six weeks of essentials. A buffer comes before longer-term moves.",
  accessibility:
    "User has a buffer in place but may need this money within the next year, so keeping it separate and accessible matters more than long-term growth.",
  longterm:
    "User's foundations look stable. The next step is deciding what this money is for, not where to put it.",
};

export function buildCoachBrief(
  answers: DiagnosticAnswers,
  derived: Derived,
  path: PathId,
  isPartial: boolean,
  availableCash: number,
): CoachBrief {
  return {
    path,
    pathLabel: PATH_LABEL[path],
    pathReason: PATH_REASON[path],
    emotionalPriority: answers.emotionalPriority ?? null,
    isPartial,
    inputs: {
      hasHighInterestDebt: answers.hasHighInterestDebt ?? null,
      monthlyEssentialsRange: answers.monthlyEssentials
        ? ESSENTIALS_LABEL[answers.monthlyEssentials]
        : null,
      monthlyEssentialsMidpointGbp: derived.monthlyEssentials ?? null,
      emergencySavingsStatus: answers.emergencySavingsStatus ?? null,
      needsMoneyWithin12Months: answers.needsMoneyWithin12Months ?? null,
    },
    numbers: {
      availableCashGbp: availableCash,
      sixWeekBufferTargetGbp: derived.sixWeekBuffer ?? null,
      bufferGapGbp: derived.bufferGap ?? null,
      bufferMet: derived.bufferMet ?? null,
    },
  };
}
