/**
 * Key metrics aggregation: target load, send rate, dashboard metrics.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 8.
 */

import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import type { LimitBoulderData } from "@/lib/plans/bouldering/types";

/** Latest assessment plus optional previous for trend (e.g. % change). */
export interface KeyMetricsResult {
  /** Best max hang load in lbs (from latest assessment). */
  maxHangLbs: number | null;
  /** Max hang as % bodyweight (from latest assessment). */
  maxHangPercentBW: number | null;
  /** Previous max hang for trend display. */
  previousMaxHangLbs: number | null;
  /** Send rate 0–100 (aggregated from limit boulder drills). */
  sendRate: number | null;
  /** Total sent / total attempted for display. */
  sendRateDetail: { sent: number; attempted: number } | null;
  /** Campus board best rung (from latest assessment). */
  campusReachRung: number | null;
  /** Previous campus rung for trend. */
  previousCampusReachRung: number | null;
}

/**
 * Compute target load from latest assessment: bestLoad × percentage (e.g. 0.87 for 87%).
 */
export function getTargetLoad(
  latestAssessment: BoulderingAssessment | null,
  percent: number
): number | null {
  if (!latestAssessment?.maxHang?.bestLoad) return null;
  return Math.round(latestAssessment.maxHang.bestLoad * percent);
}

/**
 * Aggregate send rate across all limit boulder drills in the given workouts.
 * Returns null if no limit boulder data.
 */
export function getAggregatedSendRate(
  workouts: BoulderingWorkout[]
): { rate: number; sent: number; attempted: number } | null {
  let totalSent = 0;
  let totalAttempted = 0;

  for (const w of workouts) {
    for (const d of w.drills ?? []) {
      if (d.drillType !== "limit_boulder") continue;
      const data = d.data as LimitBoulderData | undefined;
      if (!data?.totalAttempted) continue;
      totalSent += data.totalSent ?? 0;
      totalAttempted += data.totalAttempted;
    }
  }

  if (totalAttempted === 0) return null;
  const rate = Math.round((totalSent / totalAttempted) * 100);
  return { rate, sent: totalSent, attempted: totalAttempted };
}

/**
 * Build key metrics for the dashboard from assessments and workouts.
 * Uses latest assessment for max hang and campus; aggregates send rate from completed workouts.
 */
export function getKeyMetrics(
  assessments: BoulderingAssessment[],
  workouts: BoulderingWorkout[]
): KeyMetricsResult {
  const latest =
    assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const previous =
    assessments.length >= 2 ? assessments[assessments.length - 2] : null;

  const maxHangLbs = latest?.maxHang?.bestLoad ?? null;
  const maxHangPercentBW = latest?.maxHang?.percentBodyweight ?? null;
  const previousMaxHangLbs = previous?.maxHang?.bestLoad ?? null;

  const campusReachRung =
    latest?.campusBoard?.maxReach?.bestRung ?? null;
  const previousCampusReachRung =
    previous?.campusBoard?.maxReach?.bestRung ?? null;

  const sendAgg = getAggregatedSendRate(workouts);

  return {
    maxHangLbs,
    maxHangPercentBW,
    previousMaxHangLbs,
    sendRate: sendAgg?.rate ?? null,
    sendRateDetail: sendAgg
      ? { sent: sendAgg.sent, attempted: sendAgg.attempted }
      : null,
    campusReachRung,
    previousCampusReachRung,
  };
}
