export type YesNoNotSure = "yes" | "no" | "not_sure";

export type EmergencyStatus = "yes" | "no" | "some" | "not_sure";

export type EssentialsRange =
  | "under_1000"
  | "1000_1500"
  | "1500_2000"
  | "2000_plus";

export type EmotionalPriority =
  | "security"
  | "stop_idle"
  | "organised"
  | "wealth"
  | "not_sure";

export type PathId = "debt" | "buffer" | "accessibility" | "longterm";

export interface DiagnosticAnswers {
  hasHighInterestDebt?: YesNoNotSure;
  monthlyEssentials?: EssentialsRange;
  emergencySavingsStatus?: EmergencyStatus;
  needsMoneyWithin12Months?: YesNoNotSure;
  emotionalPriority?: EmotionalPriority;
}

export type QuestionId =
  | "debt"
  | "essentials"
  | "emergency"
  | "horizon"
  | "priority";
