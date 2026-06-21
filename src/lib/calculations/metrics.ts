/**
 * Key metrics aggregation: target load, send rate, dashboard metrics.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 8.
 */

import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import type { LimitBoulderData } from "@/lib/plans/bouldering/types";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";
import type { PowerEnduranceWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import { getRecentCAFSessions, getRecentARCSessions, cafScoreOf } from "@/lib/plans/power-endurance/calculations";

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

/**
 * Weekly training streak: the number of consecutive program weeks (each with at
 * least one completed session) counting back from the current week.
 *
 * An in-progress current week with no logged session yet does not break the
 * streak — the run is anchored at `currentWeek` when it has a session, otherwise
 * at `currentWeek - 1`. Returns 0 when there is no qualifying run.
 */
export function getWeeklyStreak(
  workouts: Array<{ week: number }>,
  currentWeek: number
): number {
  const weeksWithSessions = new Set<number>();
  for (const w of workouts) {
    if (typeof w.week === "number") weeksWithSessions.add(w.week);
  }
  if (weeksWithSessions.size === 0) return 0;

  let anchor = weeksWithSessions.has(currentWeek)
    ? currentWeek
    : currentWeek - 1;

  let streak = 0;
  while (anchor >= 1 && weeksWithSessions.has(anchor)) {
    streak += 1;
    anchor -= 1;
  }
  return streak;
}

// --- Power-endurance key metrics (Phase 3) ---

/** PE dashboard headline metrics with previous values for trend display. */
export interface PEKeyMetricsResult {
  /** Session CAF score (total / rounds) — primary KPI (latest CAF session, else latest assessment). */
  cafScore: number | null;
  /** Previous session CAF score for trend. */
  previousCafScore: number | null;
  /** Crux-after-fatigue success rate 0–100 (latest CAF session, else latest assessment) — secondary. */
  cruxSuccessRate: number | null;
  /** Previous crux success rate for trend. */
  previousCruxSuccessRate: number | null;
  /** Intermittent-endurance total reps (latest assessment). */
  iheTotalReps: number | null;
  /** Previous IHE total reps for trend. */
  previousIheTotalReps: number | null;
  /** Best max hang load in lbs (latest assessment). */
  maxHangLbs: number | null;
  /** Max hang as % bodyweight (latest assessment). */
  maxHangPercentBW: number | null;
  /** Fluency stops per set from the most recent ARC session (lower is better). */
  fluencyStopsPerSet: number | null;
  /** Silent-foot slips from the most recent ARC session (lower is better). */
  silentFootSlipsPerSession: number | null;
}

/**
 * Build PE key metrics. Assessments are expected sorted by week ascending.
 * Crux success rate prefers logged CAF workout sessions and falls back to
 * the latest assessment's crux-after-fatigue result.
 */
export function getPEKeyMetrics(
  assessments: PowerEnduranceAssessment[],
  workouts: PowerEnduranceWorkout[]
): PEKeyMetricsResult {
  const latest = assessments.length > 0 ? assessments[assessments.length - 1] : null;
  const previous = assessments.length >= 2 ? assessments[assessments.length - 2] : null;

  // CAF score (total / rounds) and crux success rate: prefer the last two CAF
  // workout sessions; fall back to assessments.
  const cafSessions = getRecentCAFSessions(workouts, 2);
  let cafScore: number | null = null;
  let previousCafScore: number | null = null;
  let cruxSuccessRate: number | null = null;
  let previousCruxSuccessRate: number | null = null;
  if (cafSessions.length > 0) {
    cafScore = cafScoreOf(cafSessions[cafSessions.length - 1]);
    previousCafScore =
      cafSessions.length >= 2 ? cafScoreOf(cafSessions[cafSessions.length - 2]) : null;
    cruxSuccessRate = cafSessions[cafSessions.length - 1].successRate;
    previousCruxSuccessRate =
      cafSessions.length >= 2 ? cafSessions[cafSessions.length - 2].successRate : null;
  } else {
    cafScore = cafScoreOf(latest?.cruxAfterFatigue);
    previousCafScore = cafScoreOf(previous?.cruxAfterFatigue);
    cruxSuccessRate = latest?.cruxAfterFatigue?.successRate ?? null;
    previousCruxSuccessRate = previous?.cruxAfterFatigue?.successRate ?? null;
  }

  const iheTotalReps = latest?.intermittentEndurance?.totalReps ?? null;
  const previousIheTotalReps = previous?.intermittentEndurance?.totalReps ?? null;

  const maxHangLbs = latest?.fingerMaxStrength?.bestLoad ?? null;
  const maxHangPercentBW = latest?.fingerMaxStrength?.percentBodyweight ?? null;

  const latestARC = getRecentARCSessions(workouts, 1)[0] ?? null;
  const fluencyStopsPerSet =
    latestARC && latestARC.sets.length > 0
      ? Math.round((latestARC.sessionFluencyStopsTotal / latestARC.sets.length) * 10) / 10
      : null;
  const silentFootSlipsPerSession = latestARC
    ? latestARC.sessionSilentFootSlipsTotal
    : null;

  return {
    cafScore,
    previousCafScore,
    cruxSuccessRate,
    previousCruxSuccessRate,
    iheTotalReps,
    previousIheTotalReps,
    maxHangLbs,
    maxHangPercentBW,
    fluencyStopsPerSet,
    silentFootSlipsPerSession,
  };
}
