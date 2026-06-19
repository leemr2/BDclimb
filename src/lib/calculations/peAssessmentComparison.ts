/**
 * Power-endurance assessment comparison: radar normalization and before/after
 * tables. Radar axes indexed relative to Week 0 baseline = 100.
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Sections 9 & 11.
 *
 * Parallel to assessmentComparison.ts (bouldering) but typed to PE assessments.
 */

import type {
  PowerEnduranceAssessment,
  PEInjuryBaseline,
} from "@/lib/plans/power-endurance/types";

export type PERadarAxis =
  | "maxHang"
  | "iheReps"
  | "cruxRate"
  | "pullup"
  | "recovery";

export const PE_RADAR_AXIS_LABELS: Record<PERadarAxis, string> = {
  maxHang: "Max Hang",
  iheReps: "IHE Reps",
  cruxRate: "Crux Success",
  pullup: "Pull-up Strength",
  recovery: "Recovery Score",
};

export interface PERadarWeekSeries {
  week: number;
  label: string;
  values: Partial<Record<PERadarAxis, number>>;
}

export interface PEComparisonTableRow {
  metric: string;
  values: Record<number, string>;
  deltaFromBaseline: string | null;
  /** True when a downward change is the improvement (e.g. shoulder symptoms). */
  lowerIsBetter?: boolean;
}

function maxPainFromBaseline(baseline: PEInjuryBaseline): number {
  const fingerValues = Object.values(baseline.fingers ?? {}).flatMap((f) => [
    f.painAtRest,
    f.painWithPressure,
  ]);
  return Math.max(
    0,
    ...fingerValues,
    baseline.elbowPain?.left ?? 0,
    baseline.elbowPain?.right ?? 0,
    baseline.shoulderPain?.left ?? 0,
    baseline.shoulderPain?.right ?? 0
  );
}

function recoveryScore(baseline: PEInjuryBaseline): number {
  const maxPain = maxPainFromBaseline(baseline);
  const stiffness = baseline.morningStiffness ?? 0;
  return Math.max(0, 10 - maxPain - stiffness * 0.5);
}

function pullupScore(a: PowerEnduranceAssessment): number | null {
  const pu = a.optionalTests?.weightedPullup;
  if (!pu || pu.maxLoad <= 0 || pu.reps <= 0) return null;
  return pu.maxLoad * pu.reps;
}

function relativeIndex(value: number, baseline: number): number | null {
  if (baseline <= 0 || value <= 0) return null;
  return Math.round((value / baseline) * 100);
}

function getBaseline(
  assessments: PowerEnduranceAssessment[]
): PowerEnduranceAssessment | null {
  return assessments.find((a) => a.week === 0) ?? assessments[0] ?? null;
}

function rawMetrics(
  a: PowerEnduranceAssessment
): Partial<Record<PERadarAxis, number>> {
  const out: Partial<Record<PERadarAxis, number>> = {};
  if (a.fingerMaxStrength?.bestLoad) out.maxHang = a.fingerMaxStrength.bestLoad;
  if (a.intermittentEndurance?.totalReps) {
    out.iheReps = a.intermittentEndurance.totalReps;
  }
  if (a.cruxAfterFatigue?.successRate != null) {
    out.cruxRate = a.cruxAfterFatigue.successRate;
  }
  const pull = pullupScore(a);
  if (pull != null) out.pullup = pull;
  if (a.injuryBaseline) out.recovery = recoveryScore(a.injuryBaseline);
  return out;
}

/**
 * Build radar series with values indexed to Week 0 = 100.
 */
export function buildPERadarSeries(
  assessments: PowerEnduranceAssessment[]
): PERadarWeekSeries[] {
  const baseline = getBaseline(assessments);
  if (!baseline) return [];

  const baselineRaw = rawMetrics(baseline);
  const sorted = [...assessments].sort((a, b) => a.week - b.week);

  return sorted.map((a) => {
    const raw = rawMetrics(a);
    const values: Partial<Record<PERadarAxis, number>> = {};

    for (const axis of Object.keys(PE_RADAR_AXIS_LABELS) as PERadarAxis[]) {
      const v = raw[axis];
      const b = baselineRaw[axis];
      if (v == null || b == null) continue;
      const indexed = relativeIndex(v, b);
      if (indexed != null) values[axis] = indexed;
    }

    return {
      week: a.week,
      label: a.week === 0 ? "Week 0" : `Week ${a.week}`,
      values,
    };
  });
}

function deltaPct(current: number, baseline: number): string | null {
  if (baseline <= 0) return null;
  const pct = Math.round(((current - baseline) / baseline) * 100);
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

function deltaAbs(current: number, baseline: number): string {
  const diff = Math.round((current - baseline) * 10) / 10;
  if (diff === 0) return "0";
  return diff > 0 ? `+${diff}` : `${diff}`;
}

function fmtMaxHangLoad(a: PowerEnduranceAssessment, unit: string): string {
  const load = a.fingerMaxStrength?.bestLoad;
  return load != null ? `${load} ${unit}` : "—";
}

function fmtMaxHangPct(a: PowerEnduranceAssessment): string {
  const pct = a.fingerMaxStrength?.percentBodyweight;
  return pct != null ? `${pct.toFixed(1)}%` : "—";
}

function fmtIHEReps(a: PowerEnduranceAssessment): string {
  const reps = a.intermittentEndurance?.totalReps;
  return reps != null ? `${reps}` : "—";
}

function fmtCruxRate(a: PowerEnduranceAssessment): string {
  const rate = a.cruxAfterFatigue?.successRate;
  return rate != null ? `${Math.round(rate)}%` : "—";
}

function fmtAvgMoves(a: PowerEnduranceAssessment): string {
  const moves = a.cruxAfterFatigue?.avgMovesCompleted;
  return moves != null ? `${Math.round(moves * 10) / 10}` : "—";
}

function fmtShoulder(a: PowerEnduranceAssessment): string {
  const score = a.injuryBaseline?.shoulderSymptomScore;
  return score != null ? `${score}/10` : "—";
}

/**
 * Before/after comparison table rows with delta from Week 0.
 * Fluency-stop and silent-foot-slip trends are workout-derived (not per
 * assessment) and live in their own progress charts.
 */
export function buildPEComparisonTable(
  assessments: PowerEnduranceAssessment[],
  weightUnit: "lbs" | "kg" = "lbs"
): PEComparisonTableRow[] {
  const baseline = getBaseline(assessments);
  if (!baseline) return [];

  const sorted = [...assessments].sort((a, b) => a.week - b.week);
  const latest = sorted[sorted.length - 1];
  const baseRaw = rawMetrics(baseline);
  const latestRaw = rawMetrics(latest);

  const valuesFor = (fmt: (a: PowerEnduranceAssessment) => string) =>
    Object.fromEntries(sorted.map((a) => [a.week, fmt(a)]));

  const rows: PEComparisonTableRow[] = [
    {
      metric: "Max Hang Load",
      values: valuesFor((a) => fmtMaxHangLoad(a, weightUnit)),
      deltaFromBaseline:
        latestRaw.maxHang != null && baseRaw.maxHang != null
          ? deltaPct(latestRaw.maxHang, baseRaw.maxHang)
          : null,
    },
    {
      metric: "Max Hang % BW",
      values: valuesFor(fmtMaxHangPct),
      deltaFromBaseline:
        latest.fingerMaxStrength?.percentBodyweight != null &&
        baseline.fingerMaxStrength?.percentBodyweight != null
          ? deltaPct(
              latest.fingerMaxStrength.percentBodyweight,
              baseline.fingerMaxStrength.percentBodyweight
            )
          : null,
    },
    {
      metric: "IHE Total Reps",
      values: valuesFor(fmtIHEReps),
      deltaFromBaseline:
        latestRaw.iheReps != null && baseRaw.iheReps != null
          ? deltaPct(latestRaw.iheReps, baseRaw.iheReps)
          : null,
    },
    {
      metric: "Crux Success Rate",
      values: valuesFor(fmtCruxRate),
      deltaFromBaseline:
        latestRaw.cruxRate != null && baseRaw.cruxRate != null
          ? deltaAbs(latestRaw.cruxRate, baseRaw.cruxRate) + " pts"
          : null,
    },
    {
      metric: "Avg Moves Completed",
      values: valuesFor(fmtAvgMoves),
      deltaFromBaseline:
        latest.cruxAfterFatigue?.avgMovesCompleted != null &&
        baseline.cruxAfterFatigue?.avgMovesCompleted != null
          ? deltaAbs(
              latest.cruxAfterFatigue.avgMovesCompleted,
              baseline.cruxAfterFatigue.avgMovesCompleted
            )
          : null,
    },
    {
      metric: "Shoulder Symptom Score",
      values: valuesFor(fmtShoulder),
      lowerIsBetter: true,
      deltaFromBaseline:
        latest.injuryBaseline?.shoulderSymptomScore != null &&
        baseline.injuryBaseline?.shoulderSymptomScore != null
          ? deltaAbs(
              latest.injuryBaseline.shoulderSymptomScore,
              baseline.injuryBaseline.shoulderSymptomScore
            )
          : null,
    },
  ];

  return rows;
}

export function getPEAssessmentWeeks(
  assessments: PowerEnduranceAssessment[]
): number[] {
  return [...assessments].sort((a, b) => a.week - b.week).map((a) => a.week);
}
