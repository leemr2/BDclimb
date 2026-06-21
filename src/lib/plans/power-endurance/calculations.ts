/**
 * Power-endurance assessment, CAF scoring, and load calculations.
 * See docs/PowerEndurance_Trainer/crux-after-fatigue.md and Power_endurance_trainer_design.md §4.
 */

import type { TrainingProfile } from "@/lib/firebase/training/profile";
import type { PowerEnduranceWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import type {
  MaxHangAssessment,
  IntermittentEnduranceAssessment,
  CruxAfterFatigueAssessment,
  CAFRoundBase,
  CAFBenchmark,
  CruxAfterFatigueData,
  CAFLimitingFactor,
  PowerEnduranceAssessment,
  ARCClimbingData,
  IntermittentHangData,
  FourByFourData,
  CriticalForceData,
} from "./types";
import type { IHEStoppingReason } from "./types";

const IHE_ON_SECONDS = 7;
const IHE_WORKING_LOAD_RATIO = 0.6;

export const YDS_ENTRY_GRADES = [
  "5.8",
  "5.9",
  "5.10a",
  "5.10b",
  "5.10c",
  "5.10d",
  "5.11a",
  "5.11b",
  "5.11c",
  "5.11d",
  "5.12a",
  "5.12b",
  "5.12c",
  "5.12d",
  "5.13a",
  "5.13b",
  "5.13c",
  "5.13d",
  "5.14a",
] as const;

export const CAF_CRUX_GRADES = [
  "V0",
  "V1",
  "V2",
  "V3",
  "V4",
  "V5",
  "V6",
  "V7",
  "V8",
  "V9",
  "V10",
  "V11",
  "V12",
] as const;

/** Map legacy catch-all grade to the expanded ladder. */
export function normalizeCAFCruxGrade(grade: string): string {
  return grade === "V6+" ? "V7" : grade;
}

/** Entry grade multipliers: linear +0.1 per sub-grade from 5.9 = 1.0 */
export const ENTRY_GRADE_MULTIPLIERS: Record<string, number> = {
  "5.6": 0.7,
  "5.7": 0.8,
  "5.8": 0.9,
  "5.9": 1.0,
  "5.10a": 1.1,
  "5.10b": 1.2,
  "5.10c": 1.3,
  "5.10d": 1.4,
  "5.11a": 1.5,
  "5.11b": 1.6,
  "5.11c": 1.7,
  "5.11d": 1.8,
  "5.12a": 1.9,
  "5.12b": 2.0,
  "5.12c": 2.1,
  "5.12d": 2.2,
  "5.13a": 2.3,
  "5.13b": 2.4,
  "5.13c": 2.5,
  "5.13d": 2.6,
  "5.14a": 2.7,
};

/** IHE working load at 60% of max hang best load. */
export function getIHEWorkingLoad(bestLoad: number): number {
  return Math.round(bestLoad * IHE_WORKING_LOAD_RATIO);
}

export function toFingerMaxStrength(maxHang: MaxHangAssessment): MaxHangAssessment {
  return { ...maxHang };
}

export function computeIHETotalReps(
  sets: IntermittentEnduranceAssessment["sets"]
): number {
  return sets.reduce((sum, s) => sum + s.repsCompleted, 0);
}

export function computeIHETotalTimeSeconds(
  sets: IntermittentEnduranceAssessment["sets"],
  protocol: IntermittentEnduranceAssessment["protocol"]
): number {
  const totalReps = computeIHETotalReps(sets);
  const onSeconds = protocol === "7on_2off" ? 7 : IHE_ON_SECONDS;
  return totalReps * onSeconds;
}

export function buildIntermittentEnduranceAssessment(
  workingLoad: number,
  protocol: IntermittentEnduranceAssessment["protocol"],
  sets: Array<{
    repsCompleted: number;
    stoppingReason: IHEStoppingReason;
    forceQuality: number;
  }>
): IntermittentEnduranceAssessment {
  const totalReps = computeIHETotalReps(sets);
  return {
    workingLoad,
    protocol,
    sets,
    totalReps,
    totalTimeSeconds: computeIHETotalTimeSeconds(sets, protocol),
  };
}

export function getEntryGradeMultiplier(grade: string): number {
  return ENTRY_GRADE_MULTIPLIERS[grade] ?? 1.0;
}

/** Crux grade multipliers: V_grade + 1 */
export function getCruxGradeMultiplier(vGrade: string): number {
  const match = normalizeCAFCruxGrade(vGrade).match(/V(\d+)/i);
  if (!match) return 1;
  return parseInt(match[1], 10) + 1;
}

export function offsetYDSGrade(grade: string, steps: number): string {
  const idx = YDS_ENTRY_GRADES.indexOf(grade as (typeof YDS_ENTRY_GRADES)[number]);
  if (idx === -1) return grade;
  const next = Math.max(0, Math.min(YDS_ENTRY_GRADES.length - 1, idx + steps));
  return YDS_ENTRY_GRADES[next];
}

export function offsetVGrade(grade: string, steps: number): string {
  const normalized = normalizeCAFCruxGrade(grade);
  const idx = CAF_CRUX_GRADES.indexOf(normalized as (typeof CAF_CRUX_GRADES)[number]);
  if (idx === -1) return grade;
  const next = Math.max(0, Math.min(CAF_CRUX_GRADES.length - 1, idx + steps));
  return CAF_CRUX_GRADES[next];
}

export interface CAFRoundInputs {
  entryMoves: number;
  entryGrade: string;
  cruxGrade: string;
  cruxTotalMoves: number;
  movesCompleted: number;
  cruxDescription?: string;
  leadInCompleted?: boolean;
  pumpBeforeCrux?: number;
  executionQuality?: number;
  mentalState?: CAFRoundBase["mentalState"];
  notes?: string;
}

export function calcCAFRoundScore(inputs: CAFRoundInputs): CAFRoundBase {
  const entryGradeMultiplier = getEntryGradeMultiplier(inputs.entryGrade);
  const els = Math.round(inputs.entryMoves * entryGradeMultiplier * 10) / 10;
  const cruxGradeMultiplier = getCruxGradeMultiplier(inputs.cruxGrade);
  const cds = Math.round(inputs.movesCompleted * cruxGradeMultiplier * 10) / 10;
  const success = inputs.movesCompleted >= inputs.cruxTotalMoves;
  const roundScore = Math.round((els + cds) * 10) / 10;

  return {
    entryMoves: inputs.entryMoves,
    entryGrade: inputs.entryGrade,
    entryGradeMultiplier,
    els,
    cruxDescription: inputs.cruxDescription ?? "",
    cruxGrade: inputs.cruxGrade,
    cruxTotalMoves: inputs.cruxTotalMoves,
    cruxGradeMultiplier,
    movesCompleted: inputs.movesCompleted,
    cds,
    success,
    roundScore,
    leadInCompleted: inputs.leadInCompleted ?? true,
    pumpBeforeCrux: inputs.pumpBeforeCrux ?? 5,
    executionQuality: inputs.executionQuality ?? 3,
    // Firestore rejects undefined; mentalState is optional and often unset in assessment UI.
    ...(inputs.mentalState !== undefined ? { mentalState: inputs.mentalState } : {}),
    notes: inputs.notes ?? "",
  };
}

export function buildCAFBenchmark(setup: {
  entryGrade: string;
  entryMoves: number;
  cruxDescription: string;
  cruxGrade: string;
  cruxTotalMoves: number;
}): CAFBenchmark {
  const baselineELS =
    Math.round(setup.entryMoves * getEntryGradeMultiplier(setup.entryGrade) * 10) / 10;
  return {
    entryGrade: setup.entryGrade,
    entryMoves: setup.entryMoves,
    baselineELS,
    cruxDescription: setup.cruxDescription,
    cruxGrade: setup.cruxGrade,
    cruxTotalMoves: setup.cruxTotalMoves,
  };
}

export function computeCruxSuccessRate(attempts: CAFRoundBase[]): number {
  if (attempts.length === 0) return 0;
  const successes = attempts.filter((a) => a.success).length;
  return Math.round((successes / attempts.length) * 100);
}

export function computeCruxAvgMoves(attempts: CAFRoundBase[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + a.movesCompleted, 0);
  return Math.round((total / attempts.length) * 10) / 10;
}

export function computeCruxAvgPump(attempts: CAFRoundBase[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + a.pumpBeforeCrux, 0);
  return Math.round((total / attempts.length) * 10) / 10;
}

export function computeSessionCAFScore(rounds: Array<{ roundScore: number }>): number {
  return Math.round(rounds.reduce((sum, r) => sum + r.roundScore, 0) * 10) / 10;
}

/**
 * Session CAF score = total round score / number of rounds (the tracked KPI).
 * This is the average round score; the raw sum is `sessionCAFScore`.
 */
export function computeAvgRoundScore(rounds: Array<{ roundScore: number }>): number {
  if (rounds.length === 0) return 0;
  return Math.round((computeSessionCAFScore(rounds) / rounds.length) * 10) / 10;
}

/**
 * Resolve the session CAF score (total / rounds) from a stored CAF data or
 * assessment object. Prefers `avgRoundScore`; falls back to `sessionCAFScore`
 * divided by the round count for older documents that predate the field.
 */
export function cafScoreOf(
  caf:
    | {
        avgRoundScore?: number | null;
        sessionCAFScore?: number | null;
        totalRounds?: number | null;
        attempts?: unknown[];
      }
    | null
    | undefined
): number | null {
  if (!caf) return null;
  if (typeof caf.avgRoundScore === "number") return caf.avgRoundScore;
  const nRounds =
    typeof caf.totalRounds === "number"
      ? caf.totalRounds
      : Array.isArray(caf.attempts)
        ? caf.attempts.length
        : 0;
  if (typeof caf.sessionCAFScore === "number" && nRounds > 0) {
    return Math.round((caf.sessionCAFScore / nRounds) * 10) / 10;
  }
  return null;
}

export function buildCruxAfterFatigueAssessment(
  benchmark: CAFBenchmark,
  attempts: CAFRoundBase[],
  limitingFactor?: CAFLimitingFactor
): CruxAfterFatigueAssessment {
  const sessionCAFScore = computeSessionCAFScore(attempts);
  const avgRoundScore =
    attempts.length > 0
      ? Math.round((sessionCAFScore / attempts.length) * 10) / 10
      : 0;
  const avgELS =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((s, a) => s + a.els, 0) / attempts.length) * 10
        ) / 10
      : 0;
  const avgCDS =
    attempts.length > 0
      ? Math.round(
          (attempts.reduce((s, a) => s + a.cds, 0) / attempts.length) * 10
        ) / 10
      : 0;

  return {
    benchmark,
    attempts,
    sessionCAFScore,
    avgRoundScore,
    avgELS,
    avgCDS,
    successRate: computeCruxSuccessRate(attempts),
    avgMovesCompleted: computeCruxAvgMoves(attempts),
    avgPumpBeforeCrux: computeCruxAvgPump(attempts),
    ...(limitingFactor !== undefined ? { limitingFactor } : {}),
  };
}

/** Soft pre-fill for Week 0 CAF setup — profile only, not workout targets. */
export function getCAFAssessmentSuggestions(profile: TrainingProfile): {
  entryGrade: string;
  entryMoves: number;
  cruxGrade: string;
  cruxTotalMoves: number;
} {
  const current = profile.currentRouteGrade ?? "5.10a";
  const entryGrade = offsetYDSGrade(current, -2);
  return {
    entryGrade: YDS_ENTRY_GRADES.includes(entryGrade as (typeof YDS_ENTRY_GRADES)[number])
      ? entryGrade
      : "5.9",
    entryMoves: 20,
    cruxGrade: "V2",
    cruxTotalMoves: 8,
  };
}

export function getCAFWorkoutBaseline(
  week0Assessment: PowerEnduranceAssessment | null | undefined
): CAFBenchmark | null {
  if (!week0Assessment?.cruxAfterFatigue?.benchmark) return null;
  if (week0Assessment.cruxAfterFatigue.isLegacy) return null;
  return week0Assessment.cruxAfterFatigue.benchmark;
}

export type CAFProgressionSuggestion = {
  type:
    | "increase_entry_moves"
    | "increase_entry_grade"
    | "increase_crux_grade"
    | "maintain"
    | "maintain_or_reduce";
  message: string;
};

export function evaluateCAFProgression(
  recentSessions: Array<Pick<CruxAfterFatigueData, "successRate" | "sessionCAFScore">>
): CAFProgressionSuggestion {
  if (recentSessions.length === 0) {
    return { type: "maintain", message: "Complete more CAF sessions before progressing." };
  }
  const latest = recentSessions[recentSessions.length - 1];
  if (latest.successRate < 30) {
    return {
      type: "maintain_or_reduce",
      message: "Success rate below 30%. Do not increase difficulty. Check recovery.",
    };
  }
  if (latest.successRate > 60) {
    return {
      type: "increase_entry_moves",
      message: `Success rate ${latest.successRate}% — add entry moves or raise entry grade next session.`,
    };
  }
  return {
    type: "maintain",
    message: "Good progress. Maintain current protocol until success rate exceeds 60%.",
  };
}

/** Detect and normalize legacy pre-ELS assessment documents. */
export function normalizeCruxAfterFatigueAssessment(
  raw: Record<string, unknown>
): CruxAfterFatigueAssessment {
  if (
    raw.benchmark &&
    typeof raw.sessionCAFScore === "number" &&
    Array.isArray(raw.attempts)
  ) {
    return raw as unknown as CruxAfterFatigueAssessment;
  }

  const legacyAttempts = (raw.attempts as Array<Record<string, unknown>>) ?? [];
  const cruxTotalMoves = (raw.cruxTotalMoves as number) ?? 8;
  const cruxDescription = (raw.cruxDescription as string) ?? "";
  const leadInDuration = (raw.leadInDuration as number) ?? 2;

  const benchmark = buildCAFBenchmark({
    entryGrade: "5.9",
    entryMoves: 20,
    cruxDescription,
    cruxGrade: "V2",
    cruxTotalMoves,
  });

  const attempts: CAFRoundBase[] = legacyAttempts.map((a) =>
    calcCAFRoundScore({
      entryMoves: 20,
      entryGrade: "5.9",
      cruxGrade: "V2",
      cruxTotalMoves,
      movesCompleted: (a.movesCompleted as number) ?? 0,
      cruxDescription,
      leadInCompleted: (a.leadInCompleted as boolean) ?? true,
      pumpBeforeCrux: (a.pumpBeforeCrux as number) ?? 5,
      executionQuality: (a.executionQuality as number) ?? 3,
      notes: (a.notes as string) ?? "",
    })
  );

  const result = buildCruxAfterFatigueAssessment(
    benchmark,
    attempts,
    raw.limitingFactor as CAFLimitingFactor | undefined
  );
  result.isLegacy = true;
  void leadInDuration;
  return result;
}

export function buildCruxAfterFatigueData(
  benchmark: CAFBenchmark,
  rounds: Array<
    CAFRoundBase & { leadInRPE?: number; restAfterMinutes?: number }
  >,
  meta: {
    leadInPacing?: CruxAfterFatigueData["leadInPacing"];
    shakeRestManagement?: CruxAfterFatigueData["shakeRestManagement"];
    limitingFactor?: CAFLimitingFactor;
    trendVsLastSession?: CruxAfterFatigueData["trendVsLastSession"];
  } = {}
): CruxAfterFatigueData {
  const sessionCAFScore = computeSessionCAFScore(rounds);
  const avgRoundScore =
    rounds.length > 0
      ? Math.round((sessionCAFScore / rounds.length) * 10) / 10
      : 0;
  const avgExecutionQuality =
    rounds.length > 0
      ? Math.round(
          (rounds.reduce((s, r) => s + r.executionQuality, 0) / rounds.length) * 10
        ) / 10
      : 0;

  return {
    benchmark,
    rounds: rounds.map((r) => ({
      ...r,
      leadInRPE: r.leadInRPE ?? 5,
      restAfterMinutes: r.restAfterMinutes ?? 10,
    })),
    totalRounds: rounds.length,
    sessionCAFScore,
    avgRoundScore,
    successRate: computeCruxSuccessRate(rounds),
    avgMovesCompleted: computeCruxAvgMoves(rounds),
    avgPumpBeforeCrux: computeCruxAvgPump(rounds),
    avgExecutionQuality,
    trendVsLastSession: meta.trendVsLastSession ?? null,
    leadInPacing: meta.leadInPacing ?? "good",
    shakeRestManagement: meta.shakeRestManagement ?? "good",
    limitingFactor: meta.limitingFactor ?? "forearm_pump",
  };
}

export function buildARCClimbingData(
  sets: ARCClimbingData["sets"],
  constraintsActive: ARCClimbingData["constraintsActive"],
  movementQuality: ARCClimbingData["movementQuality"]
): ARCClimbingData {
  const totalClimbingMinutes = sets.reduce((s, set) => s + set.durationMinutes, 0);
  const sessionSilentFootSlipsTotal = sets.reduce(
    (s, set) => s + set.silentFootSlips,
    0
  );
  const sessionFluencyStopsTotal = sets.reduce(
    (s, set) => s + set.fluencyStops,
    0
  );
  const targetIntensityMet = sets.every(
    (set) => set.actualRPE >= 4 && set.actualRPE <= 6
  );

  return {
    sets,
    constraintsActive,
    totalClimbingMinutes,
    sessionSilentFootSlipsTotal,
    sessionFluencyStopsTotal,
    movementQuality,
    targetIntensityMet,
  };
}

export function buildIntermittentHangData(
  maxHangReference: number,
  protocol: IntermittentHangData["protocol"],
  sets: IntermittentHangData["sets"],
  trendVsLastSession: IntermittentHangData["trendVsLastSession"] = null
): IntermittentHangData {
  const workingLoad = getIHEWorkingLoad(maxHangReference);
  const totalReps = sets.reduce((s, set) => s + set.repsCompleted, 0);
  const totalTimeUnderTensionSeconds = totalReps * 7;
  const avgRepsPerSet =
    sets.length > 0 ? Math.round((totalReps / sets.length) * 10) / 10 : 0;

  return {
    maxHangReference,
    workingLoad,
    protocol,
    sets,
    totalReps,
    totalTimeUnderTensionSeconds,
    avgRepsPerSet,
    forceConsistency: "maintained",
    trendVsLastSession,
  };
}

export type FluencyTrendSuggestion = {
  type: "improving" | "stable" | "worsening";
  message: string;
};

export function evaluateFluencyTrend(
  recentSessions: Array<Pick<ARCClimbingData, "sessionFluencyStopsTotal" | "sets">>
): FluencyTrendSuggestion {
  if (recentSessions.length < 2) {
    return { type: "stable", message: "Log more ARC sessions to track fluency trends." };
  }
  const stopsPerSet = (session: (typeof recentSessions)[number]) => {
    const setCount = session.sets.length || 1;
    return session.sessionFluencyStopsTotal / setCount;
  };
  const prev = stopsPerSet(recentSessions[recentSessions.length - 2]);
  const latest = stopsPerSet(recentSessions[recentSessions.length - 1]);
  if (latest < prev * 0.85) {
    return {
      type: "improving",
      message: `Fluency stops down from ${prev.toFixed(1)} to ${latest.toFixed(1)} per set.`,
    };
  }
  if (latest > prev * 1.15) {
    return {
      type: "worsening",
      message: `Fluency stops up from ${prev.toFixed(1)} to ${latest.toFixed(1)} per set — focus on continuous movement.`,
    };
  }
  return { type: "stable", message: "Fluency stops holding steady." };
}

// --- Dashboard helpers: drill extraction, trends, safety inputs (Phase 3) ---

function completedAtMillis(workout: PowerEnduranceWorkout): number {
  const ts = workout.completedAt as { toMillis?: () => number } | null;
  return typeof ts?.toMillis === "function" ? ts.toMillis() : 0;
}

/** Workouts sorted oldest-first by completedAt (input order is not guaranteed). */
function sortWorkoutsChronological(
  workouts: PowerEnduranceWorkout[]
): PowerEnduranceWorkout[] {
  return [...workouts].sort((a, b) => completedAtMillis(a) - completedAtMillis(b));
}

/** Read a typed drill's data blob from a workout by drill type (first match). */
function extractDrillData<T>(
  workout: PowerEnduranceWorkout,
  drillType: string
): T | null {
  const drill = (workout.drills ?? []).find((d) => d.drillType === drillType);
  return drill ? (drill.data as T) : null;
}

/** Chronological CAF session data across the given workouts (oldest-first). */
export function getRecentCAFSessions(
  workouts: PowerEnduranceWorkout[],
  lastN?: number
): CruxAfterFatigueData[] {
  const sessions = sortWorkoutsChronological(workouts)
    .map((w) => extractDrillData<CruxAfterFatigueData>(w, "crux_after_fatigue"))
    .filter((d): d is CruxAfterFatigueData => d != null);
  return lastN != null ? sessions.slice(-lastN) : sessions;
}

/** Chronological ARC session data across the given workouts (oldest-first). */
export function getRecentARCSessions(
  workouts: PowerEnduranceWorkout[],
  lastN?: number
): ARCClimbingData[] {
  const sessions = sortWorkoutsChronological(workouts)
    .map((w) => extractDrillData<ARCClimbingData>(w, "arc_climbing"))
    .filter((d): d is ARCClimbingData => d != null);
  return lastN != null ? sessions.slice(-lastN) : sessions;
}

export interface CruxSessionTrend {
  /** Success rate (0–100) per CAF session, oldest-first (secondary metric). */
  rates: number[];
  /** Session CAF score (total / rounds) per CAF session, oldest-first (primary metric). */
  scores: number[];
  trend: "improving" | "stable" | "declining";
  /** Most recent success rate, or null when no CAF sessions logged. */
  latest: number | null;
  /** Most recent session CAF score, or null when no CAF sessions logged. */
  latestScore: number | null;
}

/**
 * Crux-after-fatigue trend for the dashboard mini-chart. The primary series is
 * the session CAF score (total / rounds); success rate is kept alongside.
 * Direction compares the most recent session to the first in the window.
 */
export function getCruxSessionScoreTrend(
  workouts: PowerEnduranceWorkout[],
  lastN = 5
): CruxSessionTrend {
  const sessions = getRecentCAFSessions(workouts, lastN);
  const rates = sessions.map((s) => s.successRate);
  const scores = sessions.map((s) => cafScoreOf(s) ?? 0);
  const latest = rates.length > 0 ? rates[rates.length - 1] : null;
  const latestScore = scores.length > 0 ? scores[scores.length - 1] : null;

  let trend: CruxSessionTrend["trend"] = "stable";
  if (scores.length >= 2) {
    const first = scores[0];
    const last = scores[scores.length - 1];
    if (last > first) trend = "improving";
    else if (last < first) trend = "declining";
  }

  return { rates, scores, trend, latest, latestScore };
}

export interface PESafetyInput {
  /** Shoulder symptom score of the most recent completed session. */
  latestShoulderSymptomScore: number | null;
  /** Shoulder symptom scores over recent sessions (oldest-first) for trend rules. */
  recentShoulderScores: number[];
  /** Max ARC pump level from the most recent ARC session (inline rule). */
  latestARCPumpLevel?: number;
  /** Round-1 total falls from the most recent 4×4 session (inline rule). */
  fourByFourRound1Falls?: number;
  /** Intensity calibration from the most recent CFB session. */
  cfbIntensityCalibration?: CriticalForceData["intensityCalibration"];
}

/**
 * Extract PE-specific safety inputs from completed workouts for runSafetyChecks.
 */
export function buildPESafetyInput(
  workouts: PowerEnduranceWorkout[]
): PESafetyInput {
  const chronological = sortWorkoutsChronological(workouts);

  const recentShoulderScores = chronological
    .map((w) => w.shoulderSymptomScore)
    .filter((s): s is number => typeof s === "number")
    .slice(-6);
  const latestShoulderSymptomScore =
    recentShoulderScores.length > 0
      ? recentShoulderScores[recentShoulderScores.length - 1]
      : null;

  const latestARC = getRecentARCSessions(workouts, 1)[0] ?? null;
  const latestARCPumpLevel = latestARC
    ? Math.max(...latestARC.sets.map((s) => s.pumpLevel), 0)
    : undefined;

  const latest4x4 = sortWorkoutsChronological(workouts)
    .map((w) => extractDrillData<FourByFourData>(w, "four_by_four"))
    .filter((d): d is FourByFourData => d != null)
    .slice(-1)[0];
  const fourByFourRound1Falls = latest4x4?.rounds?.[0]?.totalFalls;

  const latestCFB = sortWorkoutsChronological(workouts)
    .map((w) => extractDrillData<CriticalForceData>(w, "critical_force"))
    .filter((d): d is CriticalForceData => d != null)
    .slice(-1)[0];
  const cfbIntensityCalibration = latestCFB?.intensityCalibration;

  return {
    latestShoulderSymptomScore,
    recentShoulderScores,
    ...(latestARCPumpLevel !== undefined ? { latestARCPumpLevel } : {}),
    ...(fourByFourRound1Falls !== undefined ? { fourByFourRound1Falls } : {}),
    ...(cfbIntensityCalibration !== undefined ? { cfbIntensityCalibration } : {}),
  };
}
