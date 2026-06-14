/**
 * Chart data series builders for progress visualization.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 9.
 */

import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { LimitBoulderData } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import {
  getWeekDefinition,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";
import { getWeeklySRPE } from "@/lib/calculations/srpe";

export interface MaxHangChartPoint {
  week: number;
  label: string;
  bestLoad: number;
  percentBodyweight: number;
  mesocycle: 1 | 2 | 3;
}

export interface WeeklyLoadPoint {
  week: number;
  label: string;
  totalSrpe: number;
  mesocycle: 1 | 2 | 3;
  isDeload: boolean;
}

export interface SendRatePoint {
  week: number;
  label: string;
  sendRate: number | null;
  source: "workout" | "assessment";
  sent?: number;
  attempted?: number;
}

const TEST_WEEKS = [0, 4, 8, 12] as const;

function sendRateFromAssessment(a: BoulderingAssessment): {
  rate: number;
  sent: number;
  attempted: number;
} | null {
  const problems = a.limitBoulders ?? [];
  if (problems.length === 0) return null;
  const sent = problems.filter((p) => p.sent).length;
  const attempted = problems.length;
  return {
    rate: Math.round((sent / attempted) * 100),
    sent,
    attempted,
  };
}

function sendRateFromWorkouts(workouts: BoulderingWorkout[]): {
  rate: number;
  sent: number;
  attempted: number;
} | null {
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
  return {
    rate: Math.round((totalSent / totalAttempted) * 100),
    sent: totalSent,
    attempted: totalAttempted,
  };
}

/**
 * Max hang progression at assessment weeks (0, 4, 8, 12).
 */
export function buildMaxHangSeries(
  assessments: BoulderingAssessment[],
  frequency: BoulderingFrequency
): MaxHangChartPoint[] {
  const byWeek = new Map(assessments.map((a) => [a.week, a]));
  const points: MaxHangChartPoint[] = [];

  for (const week of TEST_WEEKS) {
    const a = byWeek.get(week);
    if (!a?.maxHang?.bestLoad) continue;
    const weekDef =
      week === 0
        ? { mesocycle: 1 as const }
        : getWeekDefinition(frequency, week);
    points.push({
      week,
      label: week === 0 ? "W0" : `W${week}`,
      bestLoad: a.maxHang.bestLoad,
      percentBodyweight: a.maxHang.percentBodyweight,
      mesocycle: weekDef?.mesocycle ?? 1,
    });
  }

  return points;
}

/**
 * Weekly sRPE totals for weeks 1–12.
 */
export function buildWeeklyLoadSeries(
  workouts: BoulderingWorkout[],
  frequency: BoulderingFrequency
): WeeklyLoadPoint[] {
  const completed = workouts.filter((w) => w.status === "completed");
  const byWeek = new Map<number, BoulderingWorkout[]>();

  for (const w of completed) {
    if (w.week < 1 || w.week > 12) continue;
    const list = byWeek.get(w.week) ?? [];
    list.push(w);
    byWeek.set(w.week, list);
  }

  const points: WeeklyLoadPoint[] = [];
  for (let week = 1; week <= 12; week++) {
    const weekWorkouts = byWeek.get(week) ?? [];
    if (weekWorkouts.length === 0) continue;
    const weekDef = getWeekDefinition(frequency, week);
    points.push({
      week,
      label: `W${week}`,
      totalSrpe: getWeeklySRPE(weekWorkouts),
      mesocycle: weekDef?.mesocycle ?? weekWorkouts[0].mesocycle,
      isDeload: weekDef?.isDeload ?? false,
    });
  }

  return points;
}

/**
 * Send rate per week from workouts; assessment benchmarks at test weeks.
 */
export function buildSendRateSeries(
  assessments: BoulderingAssessment[],
  workouts: BoulderingWorkout[]
): SendRatePoint[] {
  const points: SendRatePoint[] = [];
  const assessmentByWeek = new Map(assessments.map((a) => [a.week, a]));

  // Assessment markers at test weeks
  for (const week of TEST_WEEKS) {
    const a = assessmentByWeek.get(week);
    if (!a) continue;
    const sr = sendRateFromAssessment(a);
    if (!sr) continue;
    points.push({
      week,
      label: week === 0 ? "W0" : `W${week}`,
      sendRate: sr.rate,
      source: "assessment",
      sent: sr.sent,
      attempted: sr.attempted,
    });
  }

  // Per-week workout send rates (weeks 1–12)
  const completed = workouts.filter((w) => w.status === "completed");
  const byWeek = new Map<number, BoulderingWorkout[]>();
  for (const w of completed) {
    if (w.week < 1 || w.week > 12) continue;
    const list = byWeek.get(w.week) ?? [];
    list.push(w);
    byWeek.set(w.week, list);
  }

  for (let week = 1; week <= 12; week++) {
    if (assessmentByWeek.has(week)) continue; // assessment point takes precedence
    const weekWorkouts = byWeek.get(week) ?? [];
    const sr = sendRateFromWorkouts(weekWorkouts);
    if (!sr) continue;
    points.push({
      week,
      label: `W${week}`,
      sendRate: sr.rate,
      source: "workout",
      sent: sr.sent,
      attempted: sr.attempted,
    });
  }

  points.sort((a, b) => a.week - b.week);
  return points;
}

/** Mesocycle boundary weeks for chart reference lines. */
export function getMesocycleBoundaries(): number[] {
  return [1, 5, 9];
}
