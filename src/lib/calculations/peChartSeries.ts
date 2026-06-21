/**
 * Power-endurance chart data series builders for progress visualization.
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Section 9.
 *
 * Parallel to chartSeries.ts (bouldering) but typed to PE assessments/workouts.
 * Workout documents carry `week`, so series are aggregated per program week;
 * assessment benchmarks take precedence at test weeks (0, 4, 8, 12).
 */

import type {
  PowerEnduranceAssessment,
  CruxAfterFatigueData,
  ARCClimbingData,
  IntermittentHangData,
} from "@/lib/plans/power-endurance/types";
import type { PowerEnduranceWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import {
  getWeekDefinition,
  type PEFrequency,
} from "@/lib/plans/power-endurance/planEngine";
import { cafScoreOf } from "@/lib/plans/power-endurance/calculations";

const TEST_WEEKS = [0, 4, 8, 12] as const;

export interface CruxSuccessPoint {
  week: number;
  label: string;
  /** Session CAF score (total / rounds) — primary KPI. */
  cafScore: number | null;
  successRate: number | null;
  avgMovesCompleted: number | null;
  source: "workout" | "assessment";
}

export interface FluencyStopPoint {
  week: number;
  label: string;
  stopsPerSet: number;
  slipsPerSession: number;
}

export interface IHERepsPoint {
  week: number;
  label: string;
  totalReps: number | null;
  source: "workout" | "assessment";
}

export interface ShoulderSymptomPoint {
  index: number;
  label: string;
  week: number;
  score: number;
}

function weekLabel(week: number): string {
  return `W${week}`;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function completedAtMillis(workout: PowerEnduranceWorkout): number {
  const ts = workout.completedAt as { toMillis?: () => number } | null;
  return typeof ts?.toMillis === "function" ? ts.toMillis() : 0;
}

function sortChronological(
  workouts: PowerEnduranceWorkout[]
): PowerEnduranceWorkout[] {
  return [...workouts].sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return completedAtMillis(a) - completedAtMillis(b);
  });
}

function extractDrillData<T>(
  workout: PowerEnduranceWorkout,
  drillType: string
): T | null {
  const drill = (workout.drills ?? []).find((d) => d.drillType === drillType);
  return drill ? (drill.data as T) : null;
}

function completedWorkouts(
  workouts: PowerEnduranceWorkout[]
): PowerEnduranceWorkout[] {
  return workouts.filter((w) => w.status === "completed");
}

/**
 * Group completed workouts by program week (weeks 1–12) along with the typed
 * drill data blob extracted from each.
 */
function groupDrillByWeek<T>(
  workouts: PowerEnduranceWorkout[],
  drillType: string
): Map<number, T[]> {
  const byWeek = new Map<number, T[]>();
  for (const w of completedWorkouts(workouts)) {
    if (w.week < 1 || w.week > 12) continue;
    const data = extractDrillData<T>(w, drillType);
    if (data == null) continue;
    const list = byWeek.get(w.week) ?? [];
    list.push(data);
    byWeek.set(w.week, list);
  }
  return byWeek;
}

/**
 * Crux-after-fatigue success rate — the PRIMARY KPI.
 * Workout CAF sessions averaged per week; assessment benchmarks at test weeks
 * take precedence over workout points for the same week.
 */
export function buildCruxSuccessRateSeries(
  assessments: PowerEnduranceAssessment[],
  workouts: PowerEnduranceWorkout[]
): CruxSuccessPoint[] {
  const points: CruxSuccessPoint[] = [];
  const assessmentByWeek = new Map(assessments.map((a) => [a.week, a]));

  for (const week of TEST_WEEKS) {
    const caf = assessmentByWeek.get(week)?.cruxAfterFatigue;
    if (!caf) continue;
    points.push({
      week,
      label: weekLabel(week),
      cafScore: cafScoreOf(caf),
      successRate: caf.successRate ?? null,
      avgMovesCompleted: caf.avgMovesCompleted ?? null,
      source: "assessment",
    });
  }

  const byWeek = groupDrillByWeek<CruxAfterFatigueData>(
    workouts,
    "crux_after_fatigue"
  );
  for (let week = 1; week <= 12; week++) {
    if (assessmentByWeek.has(week)) continue; // assessment point takes precedence
    const sessions = byWeek.get(week);
    if (!sessions || sessions.length === 0) continue;
    const cafScores = sessions
      .map((s) => cafScoreOf(s))
      .filter((v): v is number => v != null);
    points.push({
      week,
      label: weekLabel(week),
      cafScore:
        cafScores.length > 0 ? Math.round(average(cafScores) * 10) / 10 : null,
      successRate: Math.round(average(sessions.map((s) => s.successRate))),
      avgMovesCompleted:
        Math.round(average(sessions.map((s) => s.avgMovesCompleted)) * 10) / 10,
      source: "workout",
    });
  }

  points.sort((a, b) => a.week - b.week);
  return points;
}

/**
 * Fluency stops per set and silent-foot slips per session from ARC workouts,
 * averaged per week. Lower is better (improving movement economy).
 */
export function buildFluencyStopSeries(
  workouts: PowerEnduranceWorkout[]
): FluencyStopPoint[] {
  const byWeek = groupDrillByWeek<ARCClimbingData>(workouts, "arc_climbing");
  const points: FluencyStopPoint[] = [];

  for (let week = 1; week <= 12; week++) {
    const sessions = byWeek.get(week);
    if (!sessions || sessions.length === 0) continue;
    const stopsPerSet = sessions.map((s) =>
      s.sets.length > 0 ? s.sessionFluencyStopsTotal / s.sets.length : 0
    );
    const slips = sessions.map((s) => s.sessionSilentFootSlipsTotal);
    points.push({
      week,
      label: weekLabel(week),
      stopsPerSet: Math.round(average(stopsPerSet) * 10) / 10,
      slipsPerSession: Math.round(average(slips) * 10) / 10,
    });
  }

  return points;
}

/**
 * Intermittent-endurance capacity (total reps). Assessment totals at test weeks
 * plus IHE drill totals from Meso 2 workouts, averaged per week.
 */
export function buildIHERepsSeries(
  assessments: PowerEnduranceAssessment[],
  workouts: PowerEnduranceWorkout[]
): IHERepsPoint[] {
  const points: IHERepsPoint[] = [];
  const assessmentByWeek = new Map(assessments.map((a) => [a.week, a]));

  for (const week of TEST_WEEKS) {
    const ihe = assessmentByWeek.get(week)?.intermittentEndurance;
    if (!ihe || ihe.totalReps == null) continue;
    points.push({
      week,
      label: weekLabel(week),
      totalReps: ihe.totalReps,
      source: "assessment",
    });
  }

  const byWeek = groupDrillByWeek<IntermittentHangData>(
    workouts,
    "intermittent_hang"
  );
  for (let week = 1; week <= 12; week++) {
    if (assessmentByWeek.has(week)) continue;
    const sessions = byWeek.get(week);
    if (!sessions || sessions.length === 0) continue;
    points.push({
      week,
      label: weekLabel(week),
      totalReps: Math.round(average(sessions.map((s) => s.totalReps))),
      source: "workout",
    });
  }

  points.sort((a, b) => a.week - b.week);
  return points;
}

/**
 * Per-session shoulder symptom score over the program (chronological).
 * Early-warning signal for shoulder overuse (design §9 chart 6).
 */
export function buildShoulderSymptomSeries(
  workouts: PowerEnduranceWorkout[]
): ShoulderSymptomPoint[] {
  const points: ShoulderSymptomPoint[] = [];
  let index = 0;
  for (const w of sortChronological(completedWorkouts(workouts))) {
    if (typeof w.shoulderSymptomScore !== "number") continue;
    const sessionLabel = w.sessionLabel ? ` ${w.sessionLabel}` : "";
    points.push({
      index: index++,
      label: `${weekLabel(w.week)}${sessionLabel}`,
      week: w.week,
      score: w.shoulderSymptomScore,
    });
  }
  return points;
}

/** Mesocycle boundary weeks for chart reference lines. */
export function getPEMesocycleBoundaries(): number[] {
  return [1, 5, 9];
}

/** Whether a given week is a deload week for the active plan frequency. */
export function isDeloadWeek(
  frequency: PEFrequency,
  week: number
): boolean {
  return getWeekDefinition(frequency, week)?.isDeload ?? false;
}
