import type {
  DiagnosticAnswers,
  EmotionalPriority,
  EssentialsRange,
  PathId,
} from "./types";

export const AVAILABLE_CASH = 3200;

export const USER_PROMPT =
  "I’ve got £3,200 sitting in my current account. I know I should do something with it, but every time I look into it, I end up more confused.";

export const ESSENTIALS_MIDPOINT: Record<EssentialsRange, number> = {
  under_1000: 850,
  "1000_1500": 1250,
  "1500_2000": 1750,
  "2000_plus": 2250,
};

export const ESSENTIALS_LABEL: Record<EssentialsRange, string> = {
  under_1000: "Under £1,000",
  "1000_1500": "£1,000 to £1,500",
  "1500_2000": "£1,500 to £2,000",
  "2000_plus": "£2,000+",
};

export interface Derived {
  monthlyEssentials?: number;
  sixWeekBuffer?: number;
  cashCoverageWeeks?: number;
  bufferGap?: number;
  bufferMet?: boolean;
}

const roundTo50 = (n: number) => Math.round(n / 50) * 50;

export function deriveValues(answers: DiagnosticAnswers): Derived {
  const range = answers.monthlyEssentials;
  if (!range) return {};
  const monthly = ESSENTIALS_MIDPOINT[range];
  const sixWeekBuffer = roundTo50(monthly * 1.5);
  const cashCoverageWeeks = (AVAILABLE_CASH / monthly) * (52 / 12);
  return {
    monthlyEssentials: monthly,
    sixWeekBuffer,
    cashCoverageWeeks,
    bufferGap: Math.max(0, sixWeekBuffer - AVAILABLE_CASH),
    bufferMet: AVAILABLE_CASH >= sixWeekBuffer,
  };
}

export function selectPath(
  answers: DiagnosticAnswers,
  derived: Derived,
): PathId {
  // Aida's target user is "stuck and scared" (per the brief). When she
  // skips a question, that is almost never the same signal as a confident
  // "no" — it's "I don't know", "I'd rather not say", or "I'm avoiding
  // it". For every Level 1/2 gate below we therefore treat "anything other
  // than a positive disqualifying answer" as the protective case. The
  // brief's "order matters" principle: never optimise past a foundation
  // gate without positive confirmation that it's in place.

  // 1. Debt. Only an explicit "no" exempts the user from the debt path.
  //    "yes", "not_sure", and skip all route to Debt.
  if (answers.hasHighInterestDebt !== "no") return "debt";

  // 2. Emergency buffer. Only an explicit "yes" proves the foundation is
  //    in place. Everything else (no / some / not_sure / skip) routes to
  //    Buffer. Or cash coverage below six weeks of essentials.
  const emergencyMissing = answers.emergencySavingsStatus !== "yes";
  const lowCoverage =
    derived.cashCoverageWeeks !== undefined && derived.cashCoverageWeeks < 6;
  if (emergencyMissing || lowCoverage) return "buffer";

  // 3. Short-term accessibility. Only an explicit "no" frees the money
  //    for longer-term thinking. "yes", "not_sure", and skip all route to
  //    Accessibility (keep it reachable, just in case).
  if (answers.needsMoneyWithin12Months !== "no") return "accessibility";

  // 4. Longer-term readiness.
  return "longterm";
}

export interface TransferAction {
  kind: "transfer";
  /** Default amount we recommend (also the upper end of the suggested range). */
  amount: number;
  source: string;
  destination: string;
  /**
   * Suggested preset amounts to offer the user. When present, the user can
   * also pick a custom amount. When absent, the amount is treated as fixed.
   */
  suggested?: number[];
  /** Optional hint copy shown next to the picker. */
  suggestionHint?: string;
}

export type OptionalAction = TransferAction;

export interface ProjectionItem {
  /** Headline figure or short tag, e.g. "£18", "22%", "Direction". */
  amount: string;
  /** Optional qualifier rendered next to the amount, e.g. "a month", "a year". */
  period?: string;
  /** Short explanation in plain English. */
  detail: string;
}

export interface ProjectionView {
  headline: string;
  items: ProjectionItem[];
}

export interface Projection {
  /** Headline eyebrow on the card, e.g. "12 months from now" or "5 years from now". */
  timeframeLabel: string;
  /**
   * Loss-only projection. We deliberately don't show a "gain" side — loss
   * aversion is the stronger motivator, and one frame removes a toggle
   * (and the cognitive load that comes with it).
   */
  loss: ProjectionView;
  disclaimer: string;
}

export interface ResultBasis {
  /** Short label, e.g. "Your essentials". */
  label: string;
  /** Value the user supplied, e.g. "£1,500 to £2,000". */
  value: string;
}

export interface ResultContent {
  path: PathId;
  label: string;
  headline: string;
  why: string;
  /**
   * Short summary written for the in-chat Aida bubble that wraps the
   * diagnostic. 2–3 sentences. Deterministic fallback when no LLM copy.
   */
  chatSummary: string;
  /** Inputs that drove the calculations, surfaced near "Your numbers". */
  basis?: ResultBasis[];
  numbers?: string[];
  nextStep: string;
  optionalAction?: OptionalAction;
  educational?: string;
  compliance: string;
  continuity: string;
  /**
   * Optional 12-month / 5-year projection card on the results screen.
   * Omitted on paths where we don't yet have the personal numbers needed
   * to project honestly (e.g. debt — we don't know her balance or APR).
   */
  projection?: Projection;
}

const EMOTIONAL_LEAD: Record<EmotionalPriority, string> = {
  security:
    "You mentioned wanting to feel more secure, and that maps directly onto this step.",
  stop_idle:
    "You said you don't want this money sitting idle. The shortest path to that is making sure it's protected first, so it can do its job without surprises.",
  organised:
    "You mentioned wanting to feel more organised. This step is mostly about giving this money a clearer place to live.",
  wealth:
    "You mentioned wanting to start building long-term wealth. The most reliable groundwork is getting today's stability in place first.",
  not_sure:
    "You weren't sure what felt most important, and that's okay. We'll start with the step that's hardest to regret later.",
};

function emotionalLead(p?: EmotionalPriority): string | null {
  if (!p) return null;
  return EMOTIONAL_LEAD[p];
}

function gbp(n: number): string {
  return `£${n.toLocaleString("en-GB")}`;
}

export function buildResult(
  answers: DiagnosticAnswers,
  derived: Derived,
  path: PathId,
): ResultContent {
  const compliance =
    "Aida offers educational guidance, not regulated financial advice.";
  const lead = emotionalLead(answers.emotionalPriority);

  if (path === "debt") {
    return {
      path,
      label: "Understand your debt first",
      headline: "Let's check what your debt is actually costing you.",
      why:
        (lead ? lead + " " : "") +
        "Before saving or investing, it's worth knowing whether any debt is costing more than your savings could earn. Expensive debt usually grows faster than savings.",
      chatSummary:
        "Your biggest priority right now is understanding what your debt is actually costing you. Until that's mapped, any longer term move is fighting an uphill battle. Your next step is to write down each debt with its balance and interest rate, then circle the most expensive one.",
      nextStep:
        "Write down each debt you have with three things: the balance, the interest rate, and the minimum monthly payment. Then circle the one with the highest interest rate. That's the one to focus on first.",
      educational:
        "Even small overpayments on your most expensive debt can reduce the total interest you pay over time. Clearing it usually beats the return you'd get from saving the same amount.",
      compliance,
      continuity:
        "Once you've mapped your debts, Aida can help you think about how to sequence repayments alongside saving.",
      // Intentionally no projection: we don't know her balance or APR, so any
      // £ figure here would be invented. The next step ("map your debts")
      // is what produces the foundation numbers a future iteration could
      // project from honestly.
    };
  }

  if (path === "buffer") {
    const monthly = derived.monthlyEssentials;
    const buffer = derived.sixWeekBuffer;
    const rangeLabel = answers.monthlyEssentials
      ? ESSENTIALS_LABEL[answers.monthlyEssentials]
      : null;
    const numbers: string[] = [];
    const basis: ResultBasis[] | undefined = rangeLabel
      ? [{ label: "Your monthly essentials", value: rangeLabel }]
      : undefined;
    if (monthly && buffer) {
      numbers.push(
        `Six weeks of essentials would be around ${gbp(buffer)}.`,
      );
      if (derived.bufferMet) {
        numbers.push(
          `Your ${gbp(AVAILABLE_CASH)} already covers that. Nice. The job now is making sure it lives somewhere it can't accidentally be spent.`,
        );
      } else if (derived.bufferGap !== undefined) {
        numbers.push(
          `You're about ${gbp(derived.bufferGap)} short of that target, but a starter amount is more important than the full number right now.`,
        );
      }
    }
    return {
      path,
      label: "Build your first financial buffer",
      headline: "Let's give this money a quiet, protected job to do.",
      why:
        (lead ? lead + " " : "") +
        "Before anything longer term, the priority is having enough accessible money for unexpected costs. A small buffer turns a surprise into something manageable.",
      chatSummary:
        "Your biggest priority right now is building a first financial buffer. Without one, an unexpected cost is the kind of thing that knocks everything else off course. Your next step is to move a small starter amount, between £50 and £100, into a separate easy-access savings space.",
      basis,
      numbers,
      nextStep:
        "Move a small starter amount, somewhere between £50 and £100, into a separate easy-access savings space, and name it something like 'Emergency Buffer'. The amount matters less than starting.",
      optionalAction: {
        kind: "transfer",
        amount: 100,
        source: `Current account · ${gbp(AVAILABLE_CASH)}`,
        destination: "Emergency Buffer",
        suggested: [50, 100],
        suggestionHint: "We suggest £50 to £100 to start. Pick what feels right.",
      },
      educational:
        "Most financial planning starts with a buffer of around 3 to 6 months of essentials. You don't need to get there in one go. Getting started is the part that matters.",
      compliance,
      continuity:
        "Once your buffer is in place, Aida can help you decide what the rest of this money should do.",
      projection: {
        timeframeLabel: "12 months from now",
        loss: {
          headline: "What idle money quietly costs you",
          items: [
            {
              amount: "£11",
              period: "a month",
              detail:
                "Your current account pays close to 0%. Inflation is around 4%. Your £3,200 is quietly shrinking by about £11 every month.",
            },
            {
              amount: "£128",
              period: "a year",
              detail:
                "£3,200 today buys roughly £128 less in twelve months, just from sitting still.",
            },
          ],
        },
        disclaimer:
          "Based on UK inflation around 4% and a current account paying close to 0%. Your numbers will vary.",
      },
    };
  }

  if (path === "accessibility") {
    return {
      path,
      label: "Keep this money accessible",
      headline: "Let's keep this money close, but out of the way.",
      why:
        (lead ? lead + " " : "") +
        "Since you may need this money within the year, the priority is keeping it separate, visible, and easy to reach.",
      chatSummary:
        "Your biggest priority right now is keeping this money accessible but out of the way. Sitting in your everyday account, it tends to quietly blend into spending. Your next step is to move it into a separate savings space with a clear name.",
      numbers: derived.monthlyEssentials
        ? [
            `Your ${gbp(AVAILABLE_CASH)} gives you a clear short-term cushion alongside the buffer you already have.`,
          ]
        : undefined,
      nextStep:
        "Move the money out of your everyday current account into a separate savings space so it stops blending into your daily spending. Give it a clear name that matches what it's for.",
      optionalAction: {
        kind: "transfer",
        amount: AVAILABLE_CASH,
        source: `Current account · ${gbp(AVAILABLE_CASH)}`,
        destination: "Next 12 months",
      },
      educational:
        "Separating money mentally and physically, by giving it its own home and label, makes it noticeably easier to protect from accidental spending.",
      compliance,
      continuity:
        "Once it's separated, Aida can help you think about what to do with anything you decide you won't need this year.",
      // Intentionally no projection: this path is about organisation and
      // protection from accidental spending, not return-seeking growth.
      // A 12-month projection frames the decision as if she's holding the
      // money for the full year, which competes with her own "might need
      // it soon" timeline.
    };
  }

  // longterm
  return {
    path,
    label: "You may be ready to think longer term",
    headline:
      "Your basics look steady. Now the question is what this money is for.",
    why:
      (lead ? lead + " " : "") +
      "Your foundations look stable, so the next step isn't where to put this money. It's deciding what job you want it to do.",
    chatSummary:
      "Your basics look steady, so the question now is what this money is for. The right home for it changes a lot depending on the job. Your next step is to pick one purpose: security, flexibility, a home, your future self, or long-term growth.",
    nextStep:
      "Pick one purpose for this money before deciding anything else: security, flexibility, a home, your future self, or long-term growth. Just one.",
    educational:
      "There's no one 'right' answer here. The clarity you get from naming the goal usually does more work than picking the perfect option ever could.",
    compliance,
    continuity:
      "Once you know the goal, Aida can walk you through the trade-offs to consider, without recommending any specific product or provider.",
    projection: {
      // Long-term decisions deserve a long-term frame. 12 months undersells
      // the case; 5 years matches the actual horizon she's considering.
      timeframeLabel: "5 years from now",
      loss: {
        headline: "What idle money quietly costs you",
        items: [
          {
            amount: "£11",
            period: "a month",
            detail:
              "Your current account pays close to 0%. Inflation is around 4%. Your £3,200 is quietly shrinking by about £11 every month.",
          },
          {
            amount: "£640",
            period: "over 5 years",
            detail:
              "£3,200 today buys roughly £640 less in five years, just from doing nothing. Real purchasing power gone.",
          },
        ],
      },
      disclaimer:
        "Based on UK inflation around 4% and a current account paying close to 0%. Your numbers will vary.",
    },
  };
}

export function isAnswersComplete(a: DiagnosticAnswers): boolean {
  return (
    a.hasHighInterestDebt !== undefined &&
    a.monthlyEssentials !== undefined &&
    a.emergencySavingsStatus !== undefined &&
    a.needsMoneyWithin12Months !== undefined &&
    a.emotionalPriority !== undefined
  );
}

export function hasAnyAnswers(a: DiagnosticAnswers): boolean {
  return Object.values(a).some((v) => v !== undefined);
}
