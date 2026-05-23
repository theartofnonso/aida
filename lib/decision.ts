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
  // 1. High-interest debt takes priority over everything.
  if (answers.hasHighInterestDebt === "yes") return "debt";

  // 2. Emergency buffer — missing/incomplete OR cash coverage below six weeks.
  const emergencyMissing =
    answers.emergencySavingsStatus === "no" ||
    answers.emergencySavingsStatus === "some" ||
    answers.emergencySavingsStatus === "not_sure";
  const lowCoverage =
    derived.cashCoverageWeeks !== undefined && derived.cashCoverageWeeks < 6;
  if (emergencyMissing || lowCoverage) return "buffer";

  // 3. Short-term accessibility — money likely needed within 12 months.
  // "not_sure" routes conservatively to accessibility.
  if (
    answers.needsMoneyWithin12Months === "yes" ||
    answers.needsMoneyWithin12Months === "not_sure"
  ) {
    return "accessibility";
  }

  // 4. Longer-term readiness.
  return "longterm";
}

export interface TransferAction {
  kind: "transfer";
  amount: number;
  source: string;
  destination: string;
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
  /** Default view. Loss aversion lands harder than gain framing. */
  loss: ProjectionView;
  gain: ProjectionView;
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
  /** Inputs that drove the calculations, surfaced near "Your numbers". */
  basis?: ResultBasis[];
  numbers?: string[];
  nextStep: string;
  optionalAction?: OptionalAction;
  educational?: string;
  compliance: string;
  continuity: string;
  projection: Projection;
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
    "Aida offers educational guidance based on what you've shared, not regulated financial advice. We don't recommend specific products, providers, or investments.";
  const lead = emotionalLead(answers.emotionalPriority);

  if (path === "debt") {
    return {
      path,
      label: "Understand your debt first",
      headline: "Let's check what your debt is actually costing you.",
      why:
        (lead ? lead + " " : "") +
        "Before saving or investing, it's worth understanding whether any debt is costing you more than your savings could earn. Even a small amount of expensive debt can quietly outpace the gains from a savings pot.",
      nextStep:
        "Write down each debt you have with three things: the balance, the interest rate, and the minimum monthly payment. Then circle the one with the highest interest rate. That's the one to focus on first.",
      educational:
        "Even small overpayments on your most expensive debt can reduce the total interest you pay over time. Clearing it usually beats the return you'd get from saving the same amount.",
      compliance,
      continuity:
        "Once you've mapped your debts, Aida can help you think about how to sequence repayments alongside saving.",
      projection: {
        loss: {
          headline: "What each £1,000 of expensive debt quietly costs you",
          items: [
            {
              amount: "£18",
              period: "a month",
              detail:
                "Interest that leaves your account every month, while the balance stays exactly the same.",
            },
            {
              amount: "£220",
              period: "a year",
              detail:
                "Add up twelve months of that and it's what each £1,000 of debt costs you to do nothing.",
            },
          ],
        },
        gain: {
          headline: "What each £1,000 paid off gives back",
          items: [
            {
              amount: "£18",
              period: "a month",
              detail:
                "Stops leaving your account the moment that £1,000 is gone.",
            },
            {
              amount: "22%",
              period: "return",
              detail:
                "Every £1 off your most expensive debt is the same as earning 22% on savings, risk-free.",
            },
          ],
        },
        disclaimer:
          "Based on a typical UK credit card APR of around 22%. Your actual interest depends on your terms.",
      },
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
        "Before thinking longer term, the priority is making sure you've got enough accessible money for unexpected costs. A small buffer turns a stressful surprise into a manageable one.",
      basis,
      numbers,
      nextStep:
        "Move a small starter amount, somewhere between £50 and £100, into a separate easy-access savings space, and name it something like 'Emergency Buffer'. The amount matters less than starting.",
      optionalAction: {
        kind: "transfer",
        amount: 100,
        source: `Current account · ${gbp(AVAILABLE_CASH)}`,
        destination: "Emergency Buffer",
      },
      educational:
        "Most financial planning starts with a buffer of around 3 to 6 months of essentials. You don't need to get there in one go. Getting started is the part that matters.",
      compliance,
      continuity:
        "Once your buffer is in place, Aida can help you decide what the rest of this money should do.",
      projection: {
        loss: {
          headline: "What your £3,200 is quietly losing right now",
          items: [
            {
              amount: "£11",
              period: "a month",
              detail:
                "Your current account pays around 0%. Inflation is around 4%. That gap is your money losing real value.",
            },
            {
              amount: "£128",
              period: "a year",
              detail:
                "Twelve months of that drag, without you ever moving the money.",
            },
          ],
        },
        gain: {
          headline: "What the same £3,200 could be earning instead",
          items: [
            {
              amount: "£11",
              period: "a month",
              detail:
                "An easy-access savings account around 4% turns the drag into a small but real return.",
            },
            {
              amount: "£128",
              period: "a year",
              detail:
                "Same money, same year, opposite direction. That's the swing from doing nothing.",
            },
          ],
        },
        disclaimer:
          "Based on UK inflation around 4% and easy-access savings around 4%. Your numbers will vary.",
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
        "Because you may need this money within the next year, the priority is keeping it separate, visible, and easy to reach. Locking it away or putting it at risk would create more stress than it would solve.",
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
      projection: {
        loss: {
          headline: "What your £3,200 is quietly losing right now",
          items: [
            {
              amount: "£11",
              period: "a month",
              detail:
                "Your current account pays around 0%. Inflation is around 4%. That gap is your money losing real value.",
            },
            {
              amount: "£128",
              period: "a year",
              detail:
                "Twelve months of that drag. Plus the slow leak into unplanned spending while it's still in your everyday account.",
            },
          ],
        },
        gain: {
          headline: "What the same £3,200 could be earning instead",
          items: [
            {
              amount: "£11",
              period: "a month",
              detail:
                "An easy-access savings space around 4% turns the drag into a small but real return.",
            },
            {
              amount: "£128",
              period: "a year",
              detail:
                "Same money, same year, opposite direction. The swing from doing nothing.",
            },
          ],
        },
        disclaimer:
          "Based on UK inflation around 4% and easy-access savings around 4%. Your numbers will vary.",
      },
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
      "Your foundations look more stable, so the next step isn't where to put this money. It's deciding what job you want it to do. Different goals usually call for different levels of risk, flexibility, and time.",
    nextStep:
      "Pick one purpose for this money before deciding anything else: security, flexibility, a home, your future self, or long-term growth. Just one.",
    educational:
      "There's no one 'right' answer here. The clarity you get from naming the goal usually does more work than picking the perfect option ever could.",
    compliance,
    continuity:
      "Once you know the goal, Aida can walk you through the trade-offs to consider, without recommending any specific product or provider.",
    projection: {
      loss: {
        headline: "What your £3,200 is quietly losing right now",
        items: [
          {
            amount: "£11",
            period: "a month",
            detail:
              "Your current account pays around 0%. Inflation is around 4%. The gap is your money losing real value.",
          },
          {
            amount: "£128",
            period: "a year",
            detail:
              "Twelve months of that drag, while the decision waits.",
          },
        ],
      },
      gain: {
        headline: "What naming this money's purpose unlocks",
        items: [
          {
            amount: "Direction",
            detail:
              "Once you know what it's for, picking a place that at least keeps up with inflation gets much easier.",
          },
          {
            amount: "Action",
            detail:
              "Specific goals get done. Vague ones get put off. The first step usually picks itself.",
          },
        ],
      },
      disclaimer:
        "Based on UK inflation around 4%. Aida doesn't recommend specific products or providers.",
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
