/**
 * Power-endurance assessment and load calculations (Phase 1 scope).
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Section 4.
 */

import type {
  MaxHangAssessment,
  IntermittentEnduranceAssessment,
  CruxAfterFatigueAssessment,
  CruxAfterFatigueAttempt,
  IHEStoppingReason,
} from "./types";

const IHE_ON_SECONDS = 7;
const IHE_WORKING_LOAD_RATIO = 0.6;

/** IHE working load at 60% of max hang best load. */
export function getIHEWorkingLoad(bestLoad: number): number {
  return Math.round(bestLoad * IHE_WORKING_LOAD_RATIO);
}

/** Copy max hang test result into fingerMaxStrength fields. */
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

export function computeCruxSuccessRate(attempts: CruxAfterFatigueAttempt[]): number {
  if (attempts.length === 0) return 0;
  const successes = attempts.filter((a) => a.success).length;
  return Math.round((successes / attempts.length) * 100);
}

export function computeCruxAvgMoves(attempts: CruxAfterFatigueAttempt[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + a.movesCompleted, 0);
  return Math.round((total / attempts.length) * 10) / 10;
}

export function computeCruxAvgPump(attempts: CruxAfterFatigueAttempt[]): number {
  if (attempts.length === 0) return 0;
  const total = attempts.reduce((sum, a) => sum + a.pumpBeforeCrux, 0);
  return Math.round((total / attempts.length) * 10) / 10;
}

export function buildCruxAfterFatigueAssessment(
  leadInDuration: number,
  cruxDescription: string,
  cruxTotalMoves: number,
  attempts: CruxAfterFatigueAttempt[],
  limitingFactor?: CruxAfterFatigueAssessment["limitingFactor"]
): CruxAfterFatigueAssessment {
  return {
    leadInDuration,
    cruxDescription,
    cruxTotalMoves,
    attempts,
    successRate: computeCruxSuccessRate(attempts),
    avgMovesCompleted: computeCruxAvgMoves(attempts),
    avgPumpBeforeCrux: computeCruxAvgPump(attempts),
    limitingFactor,
  };
}
