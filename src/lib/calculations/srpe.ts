/**
 * sRPE (session RPE) calculations for load monitoring.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 8.
 */

/** Workout-like object with srpe and optional week for filtering. */
export interface WorkoutWithSRPE {
  srpe: number;
  week?: number;
}

/**
 * Sum sRPE for a set of workouts (e.g. one week's completed sessions).
 */
export function getWeeklySRPE(workouts: WorkoutWithSRPE[]): number {
  return workouts.reduce((sum, w) => sum + (w.srpe ?? 0), 0);
}

/**
 * Week-over-week load change as a percentage.
 * Returns null if last week had zero load (avoid division by zero).
 */
export function weekOverWeekChange(
  thisWeekSRPE: number,
  lastWeekSRPE: number
): number | null {
  if (lastWeekSRPE <= 0) return null;
  return Math.round(((thisWeekSRPE - lastWeekSRPE) / lastWeekSRPE) * 100);
}
