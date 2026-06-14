/**
 * Assessment comparison: radar normalization and before/after tables.
 * All radar axes indexed relative to Week 0 baseline = 100.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 9.
 */

import type {
  BoulderingAssessment,
  InjuryBaseline,
} from "@/lib/plans/bouldering/types";

export type RadarAxis =
  | "maxHang"
  | "campusReach"
  | "sendRate"
  | "pullingStrength"
  | "recovery";

export const RADAR_AXIS_LABELS: Record<RadarAxis, string> = {
  maxHang: "Max Hang",
  campusReach: "Campus Reach",
  sendRate: "Send Rate",
  pullingStrength: "Pull-up Strength",
  recovery: "Recovery Score",
};

export interface RadarWeekSeries {
  week: number;
  label: string;
  values: Partial<Record<RadarAxis, number>>;
}

export interface ComparisonTableRow {
  metric: string;
  axis: RadarAxis | null;
  values: Record<number, string>;
  deltaFromBaseline: string | null;
}

function sendRateFromProblems(problems: BoulderingAssessment["limitBoulders"]): number {
  if (problems.length === 0) return 0;
  const sent = problems.filter((p) => p.sent).length;
  return Math.round((sent / problems.length) * 100);
}

function maxPainFromBaseline(baseline: InjuryBaseline): number {
  const fingerValues = Object.values(baseline.fingers).flatMap((f) => [
    f.painAtRest,
    f.painWithPressure,
  ]);
  return Math.max(
    0,
    ...fingerValues,
    baseline.elbowPain.left,
    baseline.elbowPain.right,
    baseline.shoulderPain.left,
    baseline.shoulderPain.right
  );
}

function recoveryScore(baseline: InjuryBaseline): number {
  const maxPain = maxPainFromBaseline(baseline);
  const stiffness = baseline.morningStiffness ?? 0;
  return Math.max(0, 10 - maxPain - stiffness * 0.5);
}

function pullingScore(a: BoulderingAssessment): number | null {
  const ps = a.pullingStrength;
  if (!ps?.attempts?.length) return null;
  let best = 0;
  for (const att of ps.attempts) {
    const score = att.addedWeight * att.repsCompleted;
    if (score > best) best = score;
  }
  return best > 0 ? best : null;
}

function relativeIndex(value: number, baseline: number): number | null {
  if (baseline <= 0 || value <= 0) return null;
  return Math.round((value / baseline) * 100);
}

function getBaseline(assessments: BoulderingAssessment[]): BoulderingAssessment | null {
  return assessments.find((a) => a.week === 0) ?? assessments[0] ?? null;
}

function rawMetrics(a: BoulderingAssessment): Partial<Record<RadarAxis, number>> {
  const out: Partial<Record<RadarAxis, number>> = {};
  if (a.maxHang?.bestLoad) out.maxHang = a.maxHang.bestLoad;
  if (a.campusBoard?.maxReach?.bestRung) {
    out.campusReach = a.campusBoard.maxReach.bestRung;
  }
  out.sendRate = sendRateFromProblems(a.limitBoulders);
  const pull = pullingScore(a);
  if (pull != null) out.pullingStrength = pull;
  out.recovery = recoveryScore(a.injuryBaseline);
  return out;
}

/**
 * Build radar series with values indexed to Week 0 = 100.
 */
export function buildRadarSeries(
  assessments: BoulderingAssessment[]
): RadarWeekSeries[] {
  const baseline = getBaseline(assessments);
  if (!baseline) return [];

  const baselineRaw = rawMetrics(baseline);
  const sorted = [...assessments].sort((a, b) => a.week - b.week);

  return sorted.map((a) => {
    const raw = rawMetrics(a);
    const values: Partial<Record<RadarAxis, number>> = {};

    for (const axis of Object.keys(RADAR_AXIS_LABELS) as RadarAxis[]) {
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

function formatMaxHang(a: BoulderingAssessment, unit: string): string {
  return `${a.maxHang.bestLoad} ${unit} (${a.maxHang.percentBodyweight.toFixed(1)}% BW)`;
}

function formatCampus(a: BoulderingAssessment): string {
  const rung = a.campusBoard?.maxReach?.bestRung;
  return rung != null ? `Rung ${rung}` : "—";
}

function formatSendRate(a: BoulderingAssessment): string {
  const rate = sendRateFromProblems(a.limitBoulders);
  const sent = a.limitBoulders.filter((p) => p.sent).length;
  const total = a.limitBoulders.length;
  return total > 0 ? `${rate}% (${sent}/${total})` : "—";
}

function formatPulling(a: BoulderingAssessment): string {
  return a.pullingStrength?.bestWeightXReps ?? "—";
}

function formatRecovery(a: BoulderingAssessment): string {
  const maxPain = maxPainFromBaseline(a.injuryBaseline);
  const score = recoveryScore(a.injuryBaseline);
  return `${score.toFixed(1)}/10 (pain peak ${maxPain}/10)`;
}

function deltaPct(current: number, baseline: number): string | null {
  if (baseline <= 0) return null;
  const pct = Math.round(((current - baseline) / baseline) * 100);
  if (pct === 0) return "0%";
  return pct > 0 ? `+${pct}%` : `${pct}%`;
}

/**
 * Before/after comparison table rows with delta from Week 0.
 */
export function buildComparisonTable(
  assessments: BoulderingAssessment[],
  weightUnit: "lbs" | "kg" = "lbs"
): ComparisonTableRow[] {
  const baseline = getBaseline(assessments);
  if (!baseline) return [];

  const sorted = [...assessments].sort((a, b) => a.week - b.week);
  const latest = sorted[sorted.length - 1];
  const baselineRaw = rawMetrics(baseline);
  const latestRaw = rawMetrics(latest);

  const rows: ComparisonTableRow[] = [
    {
      metric: "Max Hang",
      axis: "maxHang",
      values: Object.fromEntries(
        sorted.map((a) => [a.week, formatMaxHang(a, weightUnit)])
      ),
      deltaFromBaseline:
        latestRaw.maxHang != null && baselineRaw.maxHang != null
          ? deltaPct(latestRaw.maxHang, baselineRaw.maxHang)
          : null,
    },
    {
      metric: "Campus Reach",
      axis: "campusReach",
      values: Object.fromEntries(
        sorted.map((a) => [a.week, formatCampus(a)])
      ),
      deltaFromBaseline:
        latestRaw.campusReach != null && baselineRaw.campusReach != null
          ? deltaPct(latestRaw.campusReach, baselineRaw.campusReach)
          : null,
    },
    {
      metric: "Send Rate",
      axis: "sendRate",
      values: Object.fromEntries(
        sorted.map((a) => [a.week, formatSendRate(a)])
      ),
      deltaFromBaseline:
        latestRaw.sendRate != null && baselineRaw.sendRate != null
          ? deltaPct(latestRaw.sendRate, baselineRaw.sendRate)
          : null,
    },
    {
      metric: "Pull-up Strength",
      axis: "pullingStrength",
      values: Object.fromEntries(
        sorted.map((a) => [a.week, formatPulling(a)])
      ),
      deltaFromBaseline:
        latestRaw.pullingStrength != null && baselineRaw.pullingStrength != null
          ? deltaPct(latestRaw.pullingStrength, baselineRaw.pullingStrength)
          : null,
    },
    {
      metric: "Recovery Score",
      axis: "recovery",
      values: Object.fromEntries(
        sorted.map((a) => [a.week, formatRecovery(a)])
      ),
      deltaFromBaseline:
        latestRaw.recovery != null && baselineRaw.recovery != null
          ? deltaPct(latestRaw.recovery, baselineRaw.recovery)
          : null,
    },
  ];

  return rows;
}

export function getAssessmentWeeks(assessments: BoulderingAssessment[]): number[] {
  return [...assessments].sort((a, b) => a.week - b.week).map((a) => a.week);
}
