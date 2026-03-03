/**
 * Progression suggestions for max hang (and future drill types).
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 8.
 */

import type { MaxHangData } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";

export interface ProgressionSuggestion {
  type: "increase" | "maintain";
  message: string;
  /** Suggested total load in lbs/kg for next session (only when type === "increase"). */
  suggestedLoad?: number;
}

const PROGRESSION_PERCENT = 0.025; // 2.5%

/**
 * Evaluate max hang progression from the last 2 sessions.
 * Two consecutive clean sessions → suggest +2.5% load; any failed set → maintain.
 */
export function evaluateMaxHangProgression(
  recentSessions: MaxHangData[]
): ProgressionSuggestion {
  const lastTwo = recentSessions.slice(-2);

  if (lastTwo.length === 0) {
    return { type: "maintain", message: "Complete sessions to get load suggestions." };
  }

  const bothClean = lastTwo.every((s) =>
    s.sets.every((set) => set.heldClean && set.pain <= 2)
  );

  if (bothClean && lastTwo.length >= 2) {
    const currentLoad = lastTwo[0].sets[0]?.actualLoad ?? 0;
    if (currentLoad <= 0) {
      return { type: "maintain", message: "Keep building consistency." };
    }
    const increment = Math.round(currentLoad * PROGRESSION_PERCENT);
    const suggestedLoad = currentLoad + increment;
    return {
      type: "increase",
      message: `Two clean sessions in a row! Consider adding ${increment} ${currentLoad > 50 ? "lbs" : "kg"} (2.5%) next session.`,
      suggestedLoad,
    };
  }

  const anyFailed = lastTwo.some((s) => s.sets.some((set) => !set.heldClean));
  if (anyFailed) {
    return {
      type: "maintain",
      message: "Not all sets were clean. Stay at current load.",
    };
  }

  return { type: "maintain", message: "Keep building consistency." };
}

/**
 * Extract max hang drill data from completed workouts (one per session, oldest first).
 * Used to feed evaluateMaxHangProgression.
 */
export function getRecentMaxHangSessions(
  workouts: BoulderingWorkout[],
  maxSessions: number = 2
): MaxHangData[] {
  const sessions: MaxHangData[] = [];
  for (const w of workouts) {
    if (sessions.length >= maxSessions) break;
    for (const d of w.drills ?? []) {
      if (d.drillType !== "max_hang") continue;
      const data = d.data as unknown;
      if (data && typeof data === "object" && "sets" in data) {
        sessions.push(data as MaxHangData);
        break;
      }
    }
  }
  return sessions;
}
