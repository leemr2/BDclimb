/**
 * Safety flag detection: run rules over user data and return red/yellow flags.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 8.
 */

import { weekOverWeekChange } from "./srpe";

/** Minimal check-in shape for safety rules (from dailyCheckins). */
export interface CheckinForSafety {
  fingerStiffness: number;
  readinessForTraining: number;
  energyLevel: number;
}

/** Input for runSafetyChecks: latest workout, weekly sRPE, recent check-ins. */
export interface SafetyUserData {
  /** Most recent completed workout (for finger pain). */
  latestWorkout: { fingerPainDuring: number } | null;
  /** This week's total sRPE. */
  thisWeekSRPE: number;
  /** Last week's total sRPE (for spike detection). */
  lastWeekSRPE: number;
  /** Recent check-ins, oldest first (for trend and averages). */
  checkins: CheckinForSafety[];
}

export interface SafetyFlagResult {
  id: string;
  severity: "red" | "yellow";
  message: string;
  action: string;
}

function weekOverWeekChangePct(
  thisWeek: number,
  lastWeek: number
): number | null {
  return weekOverWeekChange(thisWeek, lastWeek);
}

/** True if the given metric has an increasing trend over the last N entries. */
function isIncreasingTrend(
  checkins: CheckinForSafety[],
  metric: keyof CheckinForSafety,
  consecutiveDays: number
): boolean {
  if (checkins.length < consecutiveDays) return false;
  const recent = checkins.slice(-consecutiveDays);
  for (let i = 1; i < recent.length; i++) {
    const a = recent[i - 1][metric] ?? 0;
    const b = recent[i][metric] ?? 0;
    if (b <= a) return false;
  }
  return true;
}

/** Average readinessForTraining over the last N check-ins. */
function avgRecovery(checkins: CheckinForSafety[], lastN: number): number {
  if (checkins.length === 0) return 0;
  const slice = checkins.slice(-lastN);
  const sum = slice.reduce((s, c) => s + c.readinessForTraining, 0);
  return sum / slice.length;
}

/** Average energyLevel over the last N check-ins. */
function avgEnergy(checkins: CheckinForSafety[], lastN: number): number {
  if (checkins.length === 0) return 0;
  const slice = checkins.slice(-lastN);
  const sum = slice.reduce((s, c) => s + c.energyLevel, 0);
  return sum / slice.length;
}

const safetyRules: Array<{
  id: string;
  severity: "red" | "yellow";
  condition: (d: SafetyUserData) => boolean;
  message: (d: SafetyUserData) => string;
  action: string;
}> = [
  {
    id: "finger_pain_acute",
    severity: "red",
    condition: (d) => (d.latestWorkout?.fingerPainDuring ?? 0) >= 4,
    message: () =>
      "Finger pain ≥4/10 during your last session",
    action:
      "Stop finger loading. If sharp/sudden, seek evaluation.",
  },
  {
    id: "srpe_spike",
    severity: "yellow",
    condition: (d) => {
      const pct = weekOverWeekChangePct(d.thisWeekSRPE, d.lastWeekSRPE);
      return pct !== null && pct > 20;
    },
    message: (d) => {
      const pct = weekOverWeekChangePct(d.thisWeekSRPE, d.lastWeekSRPE);
      return `Weekly load increased ${pct}% — exceeds 15–20% guideline`;
    },
    action: "Consider reducing volume next week",
  },
  {
    id: "stiffness_trend",
    severity: "yellow",
    condition: (d) =>
      isIncreasingTrend(d.checkins, "fingerStiffness", 3),
    message: () =>
      "Finger stiffness rising for 3+ consecutive days",
    action: "Insert extra rest day or reduce intensity",
  },
  {
    id: "recovery_poor",
    severity: "yellow",
    condition: (d) => avgRecovery(d.checkins, 2) < 3,
    message: () =>
      "Recovery below 3/5 for two consecutive training days",
    action: "Insert extra rest day",
  },
  {
    id: "energy_sustained_low",
    severity: "yellow",
    condition: (d) => avgEnergy(d.checkins, 14) < 3,
    message: () =>
      "Average energy below 3/5 for 2 consecutive weeks",
    action: "Reduce volume 20–30%",
  },
];

/**
 * Run all safety rules and return any flags that fire.
 */
export function runSafetyChecks(userData: SafetyUserData): SafetyFlagResult[] {
  const flags: SafetyFlagResult[] = [];
  for (const rule of safetyRules) {
    if (rule.condition(userData)) {
      flags.push({
        id: rule.id,
        severity: rule.severity,
        message: rule.message(userData),
        action: rule.action,
      });
    }
  }
  return flags;
}
