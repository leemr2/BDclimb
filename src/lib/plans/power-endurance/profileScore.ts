/**
 * CruxTracker Profile Score System (Power-Endurance).
 * Implements Parts 1-3 of docs/CruxTracker_Profile_Score_System.md.
 *
 * Two independent axes:
 *  - Profile Score (PS) -> tier (1-5) -> fixed progressionParams (how fast to progress).
 *  - Performance Axis -> startingState (where training begins), bounded by the tier range.
 *
 * Foundation layer only: this module computes and stores parameters. The runtime
 * autoregulation engine (Section 5.4) and mid-program downgrade (Section 5.2) are deferred.
 */

// --- Tiers ---

export type Tier = 1 | 2 | 3 | 4 | 5;

export const TIER_LABELS: Record<Tier, string> = {
  1: "Developing",
  2: "Building",
  3: "Established",
  4: "Experienced",
  5: "Seasoned",
};

// --- Onboarding input bands (Section 1.1) ---

export type ClimbingAgeBand =
  | "lt1"
  | "1to2"
  | "2to5"
  | "5to10"
  | "10to20"
  | "20plus";

export type TrainingHistoryBand =
  | "none"
  | "occasional"
  | "consistent1yr"
  | "multiYear";

export type InjuryHistory =
  | "none"
  | "grade1_healed"
  | "grade2_healed"
  | "grade3plus"
  | "active";

/** Component 1: climbing age — max 45 points. */
export const C1_POINTS: Record<ClimbingAgeBand, number> = {
  lt1: 0,
  "1to2": 8,
  "2to5": 18,
  "5to10": 30,
  "10to20": 38,
  "20plus": 45,
};

/** Component 3: structured training history — max 30 points. */
export const C3_POINTS: Record<TrainingHistoryBand, number> = {
  none: 5,
  occasional: 12,
  consistent1yr: 22,
  multiYear: 30,
};

/** Injury ceiling — hard cap on the final score (Section 1.3). */
export const INJURY_CEILING: Record<InjuryHistory, number> = {
  none: 100,
  grade1_healed: 85,
  grade2_healed: 70,
  grade3plus: 55,
  active: 35,
};

export const CLIMBING_AGE_LABELS: Record<ClimbingAgeBand, string> = {
  lt1: "Less than 1 year",
  "1to2": "1-2 years",
  "2to5": "2-5 years",
  "5to10": "5-10 years",
  "10to20": "10-20 years",
  "20plus": "20+ years",
};

export const TRAINING_HISTORY_LABELS: Record<TrainingHistoryBand, string> = {
  none: "No structured training (just climbing)",
  occasional: "Occasional structured work",
  consistent1yr: "Consistent structured training, 1+ year",
  multiYear: "Multi-year systematic program",
};

export const INJURY_HISTORY_LABELS: Record<InjuryHistory, string> = {
  none: "No significant finger injuries",
  grade1_healed: "Grade 1 pulley, fully healed",
  grade2_healed: "Grade 2 pulley, fully healed",
  grade3plus: "Grade 3+ tear or surgery",
  active: "Current active finger issue",
};

/**
 * Component 2: chronological age / recovery capacity — max 25 points (Section 1.1).
 * Derived from the age already collected on the training profile.
 */
export function c2FromAge(age: number): number {
  if (age < 22) return 15; // connective tissue still developing until ~25
  if (age <= 30) return 25;
  if (age <= 40) return 20;
  if (age <= 50) return 13;
  return 8;
}

/** FPS range -> tier (Section 1.5). */
export function tierFromFinalScore(finalScore: number): Tier {
  if (finalScore <= 20) return 1;
  if (finalScore <= 40) return 2;
  if (finalScore <= 60) return 3;
  if (finalScore <= 80) return 4;
  return 5;
}

// --- Progression parameters by tier (Section 2 + Appendix A) ---

export type DeloadIntensityHandling = "maintain" | "reduce";

export interface ProgressionParams {
  /** Load increment per step, fraction of current working load (2.1). */
  loadIncrementPct: number;
  /** Consecutive confirmation sessions before a load increment (2.1). */
  sessionsToConfirm: number;
  /** Minimum calendar weeks between load increments (2.1). */
  minWeeksPerStep: number;
  /** RPE at/above which an advance is blocked and the counter resets (2.1). */
  holdThresholdRPE: number;
  /** RPE above which, for regressionSessionCount sessions, the athlete rolls back (2.1). */
  regressionThresholdRPE: number;
  regressionSessionCount: number;
  /** Volume increment per step, fraction (2.2). */
  volumeIncrementPct: number;
  /** Rest reduction per step, seconds (2.2). */
  restReductionSec: number;
  restConfirmSessions: number;
  /** Scheduled deload cadence, weeks (2.3). */
  deloadFrequencyWeeks: number;
  /** Volume reduction during deload, fraction (2.3). */
  deloadVolumeReductionPct: number;
  /** Working-load reduction during deload, fraction (0 = maintain) (2.3). */
  deloadIntensityReductionPct: number;
  deloadIntensityHandling: DeloadIntensityHandling;
  /** Symptom-based early deload trigger description (2.3). */
  symptomDeloadTrigger: string;
  /** Minimum days between high-intensity finger sessions (2.4). */
  minRestDaysBetweenFingerSessions: number;
  /** Weekly sRPE ceiling (2.4). */
  weeklySRPECeiling: number;
  /** Starting-intensity range floor (fraction of MVC) (2.1). */
  startingIntensityFloorPct: number;
  /** Starting-intensity range ceiling (fraction of MVC) (2.1). */
  startingIntensityCeilingPct: number;
}

/**
 * Full per-tier parameter set. Where the spec gives a range, a single
 * representative value is stored (lower bound for "minimum" gates / more
 * frequent deloads). The exact spec ranges are shown verbatim in the UI
 * tier-reference card.
 */
export const TIER_PARAMS: Record<Tier, ProgressionParams> = {
  1: {
    loadIncrementPct: 0.015,
    sessionsToConfirm: 3,
    minWeeksPerStep: 3,
    holdThresholdRPE: 7.5,
    regressionThresholdRPE: 8.0,
    regressionSessionCount: 2,
    volumeIncrementPct: 0.1,
    restReductionSec: 15,
    restConfirmSessions: 3,
    deloadFrequencyWeeks: 3,
    deloadVolumeReductionPct: 0.55,
    deloadIntensityReductionPct: 0.15,
    deloadIntensityHandling: "reduce",
    symptomDeloadTrigger: "Any A2 or pulley-region pain during or after climbing",
    minRestDaysBetweenFingerSessions: 3,
    weeklySRPECeiling: 800,
    startingIntensityFloorPct: 0.78,
    startingIntensityCeilingPct: 0.82,
  },
  2: {
    loadIncrementPct: 0.025,
    sessionsToConfirm: 3,
    minWeeksPerStep: 2,
    holdThresholdRPE: 8.0,
    regressionThresholdRPE: 8.5,
    regressionSessionCount: 2,
    volumeIncrementPct: 0.12,
    restReductionSec: 20,
    restConfirmSessions: 3,
    deloadFrequencyWeeks: 3,
    deloadVolumeReductionPct: 0.5,
    deloadIntensityReductionPct: 0.1,
    deloadIntensityHandling: "reduce",
    symptomDeloadTrigger:
      "Morning stiffness in finger joints on 2 or more consecutive days",
    minRestDaysBetweenFingerSessions: 3,
    weeklySRPECeiling: 950,
    startingIntensityFloorPct: 0.8,
    startingIntensityCeilingPct: 0.84,
  },
  3: {
    loadIncrementPct: 0.035,
    sessionsToConfirm: 2,
    minWeeksPerStep: 2,
    holdThresholdRPE: 8.0,
    regressionThresholdRPE: 9.0,
    regressionSessionCount: 2,
    volumeIncrementPct: 0.15,
    restReductionSec: 25,
    restConfirmSessions: 2,
    deloadFrequencyWeeks: 4,
    deloadVolumeReductionPct: 0.45,
    deloadIntensityReductionPct: 0.0,
    deloadIntensityHandling: "maintain",
    symptomDeloadTrigger:
      "Morning stiffness in finger joints on 3 or more consecutive days",
    minRestDaysBetweenFingerSessions: 2,
    weeklySRPECeiling: 1100,
    startingIntensityFloorPct: 0.82,
    startingIntensityCeilingPct: 0.87,
  },
  4: {
    loadIncrementPct: 0.045,
    sessionsToConfirm: 2,
    minWeeksPerStep: 2,
    holdThresholdRPE: 8.5,
    regressionThresholdRPE: 9.0,
    regressionSessionCount: 2,
    volumeIncrementPct: 0.17,
    restReductionSec: 30,
    restConfirmSessions: 2,
    deloadFrequencyWeeks: 4,
    deloadVolumeReductionPct: 0.4,
    deloadIntensityReductionPct: 0.0,
    deloadIntensityHandling: "maintain",
    symptomDeloadTrigger: "Standard red flags only (sharp pain, pop, significant swelling)",
    minRestDaysBetweenFingerSessions: 2,
    weeklySRPECeiling: 1300,
    startingIntensityFloorPct: 0.85,
    startingIntensityCeilingPct: 0.9,
  },
  5: {
    loadIncrementPct: 0.05,
    sessionsToConfirm: 2,
    minWeeksPerStep: 1,
    holdThresholdRPE: 8.5,
    regressionThresholdRPE: 9.5,
    regressionSessionCount: 2,
    volumeIncrementPct: 0.2,
    restReductionSec: 30,
    restConfirmSessions: 2,
    deloadFrequencyWeeks: 4,
    deloadVolumeReductionPct: 0.35,
    deloadIntensityReductionPct: 0.0,
    deloadIntensityHandling: "maintain",
    symptomDeloadTrigger: "Standard red flags only (sharp pain, pop, significant swelling)",
    minRestDaysBetweenFingerSessions: 2,
    weeklySRPECeiling: 1500,
    startingIntensityFloorPct: 0.87,
    startingIntensityCeilingPct: 0.92,
  },
};

export function getProgressionParams(tier: Tier): ProgressionParams {
  return TIER_PARAMS[tier];
}

// --- Profile Score (Part 1) ---

export interface ProfileScoreInputs {
  climbingAgeBand: ClimbingAgeBand;
  age: number;
  trainingHistoryBand: TrainingHistoryBand;
  injuryHistory: InjuryHistory;
}

export interface ProfileScore {
  c1ClimbingAge: number;
  c2AgeRecovery: number;
  c3TrainingStructure: number;
  rawScore: number;
  injuryCeiling: number;
  finalScore: number;
  tier: Tier;
  tierLabel: string;
  // Audit copy of the inputs used.
  climbingAgeBand: ClimbingAgeBand;
  trainingHistoryBand: TrainingHistoryBand;
  injuryHistory: InjuryHistory;
  ageAtCalc: number;
}

/** Compute the Profile Score and resulting tier (Sections 1.2-1.5). */
export function calcProfileScore(inputs: ProfileScoreInputs): ProfileScore {
  const c1 = C1_POINTS[inputs.climbingAgeBand];
  const c2 = c2FromAge(inputs.age);
  const c3 = C3_POINTS[inputs.trainingHistoryBand];
  const rawScore = c1 + c2 + c3;
  const injuryCeiling = INJURY_CEILING[inputs.injuryHistory];
  const finalScore = Math.min(rawScore, injuryCeiling);
  const tier = tierFromFinalScore(finalScore);

  return {
    c1ClimbingAge: c1,
    c2AgeRecovery: c2,
    c3TrainingStructure: c3,
    rawScore,
    injuryCeiling,
    finalScore,
    tier,
    tierLabel: TIER_LABELS[tier],
    climbingAgeBand: inputs.climbingAgeBand,
    trainingHistoryBand: inputs.trainingHistoryBand,
    injuryHistory: inputs.injuryHistory,
    ageAtCalc: inputs.age,
  };
}

// --- Performance Axis (Part 3) ---

export type FSSBand = "very_low" | "low" | "moderate" | "high" | "very_high";
export type ESBand = "very_low" | "low" | "moderate" | "high" | "very_high";
export type CAFSBand = "very_low" | "low" | "mid" | "high" | "very_high";

const FSS_PERCENTILE: Record<FSSBand, number> = {
  very_low: 0,
  low: 0.25,
  moderate: 0.5,
  high: 0.75,
  very_high: 1,
};

const ES_START_SETS: Record<ESBand, number> = {
  very_low: 3,
  low: 4,
  moderate: 5,
  high: 6,
  very_high: 7,
};

/** Max hang % bodyweight -> FSS band (3.2). Input is a percent (e.g. 110 = 110% BW). */
export function fssBandFromMaxHangBW(pctBodyweight: number): FSSBand {
  if (pctBodyweight < 50) return "very_low";
  if (pctBodyweight < 75) return "low";
  if (pctBodyweight < 100) return "moderate";
  if (pctBodyweight <= 125) return "high";
  return "very_high";
}

/** Intermittent endurance reps -> ES band (3.3). */
export function esBandFromReps(reps: number): ESBand {
  if (reps < 10) return "very_low";
  if (reps <= 20) return "low";
  if (reps <= 35) return "moderate";
  if (reps <= 50) return "high";
  return "very_high";
}

/** CAFS baseline score -> band (3.4). */
export function cafsBandFromBaseline(cafBaseline: number): CAFSBand {
  if (cafBaseline < 30) return "very_low";
  if (cafBaseline < 50) return "low";
  if (cafBaseline < 70) return "mid";
  if (cafBaseline <= 90) return "high";
  return "very_high";
}

/** CAFS band -> initial entry-move count + grades-above-on-sight (3.4). */
const CAFS_INITIAL: Record<CAFSBand, { initialELS: number; gradeOffset: number }> = {
  very_low: { initialELS: 15, gradeOffset: 0 },
  low: { initialELS: 20, gradeOffset: 0 },
  mid: { initialELS: 25, gradeOffset: 1 },
  high: { initialELS: 30, gradeOffset: 1 },
  very_high: { initialELS: 35, gradeOffset: 2 },
};

export interface PerformanceAxisInputs {
  /** Max hang as percent of bodyweight (e.g. 110 for 110% BW). */
  maxHangPctBW: number;
  /** Total intermittent endurance reps from the Week 0 test. */
  enduranceReps: number;
  /** Baseline session CAF score from the Week 0 crux-after-fatigue test. */
  cafBaseline: number;
  /** Crux grade achieved in the baseline test (athlete-confirmed). */
  baselineCruxGrade: string;
}

export interface PerformanceAxis {
  maxHangPctBW: number;
  fssBand: FSSBand;
  fssPercentile: number;
  enduranceReps: number;
  esBand: ESBand;
  repeaterStartSets: number;
  cafBaseline: number;
  cafsBand: CAFSBand;
  initialELS: number;
  initialELSGradeOffset: number;
  initialCruxGrade: string;
}

export function derivePerformanceAxis(
  inputs: PerformanceAxisInputs
): PerformanceAxis {
  const fssBand = fssBandFromMaxHangBW(inputs.maxHangPctBW);
  const esBand = esBandFromReps(inputs.enduranceReps);
  const cafsBand = cafsBandFromBaseline(inputs.cafBaseline);
  const cafsInitial = CAFS_INITIAL[cafsBand];

  return {
    maxHangPctBW: inputs.maxHangPctBW,
    fssBand,
    fssPercentile: FSS_PERCENTILE[fssBand],
    enduranceReps: inputs.enduranceReps,
    esBand,
    repeaterStartSets: ES_START_SETS[esBand],
    cafBaseline: inputs.cafBaseline,
    cafsBand,
    initialELS: cafsInitial.initialELS,
    initialELSGradeOffset: cafsInitial.gradeOffset,
    initialCruxGrade: inputs.baselineCruxGrade,
  };
}

// --- Starting State (Part 4) ---

export interface StartingState {
  /** Starting working intensity as a fraction of MVC, bounded by the tier range. */
  startingIntensityPct: number;
  repeaterStartSets: number;
  initialELS: number;
  initialCruxGrade: string;
}

/**
 * Resolve the tier intensity range + FSS percentile into a starting intensity.
 * The tier ceiling is a hard upper bound regardless of assessment result (4.x).
 */
export function deriveStartingState(
  tier: Tier,
  axis: PerformanceAxis
): StartingState {
  const params = TIER_PARAMS[tier];
  const range =
    params.startingIntensityCeilingPct - params.startingIntensityFloorPct;
  const raw = params.startingIntensityFloorPct + range * axis.fssPercentile;
  const startingIntensityPct = Math.round(raw * 100) / 100;

  return {
    startingIntensityPct,
    repeaterStartSets: axis.repeaterStartSets,
    initialELS: axis.initialELS,
    initialCruxGrade: axis.initialCruxGrade,
  };
}

/** Convenience: derive both the Performance Axis and Starting State together. */
export function deriveProfilePerformance(
  profileScore: Pick<ProfileScore, "tier">,
  inputs: PerformanceAxisInputs
): { performanceAxis: PerformanceAxis; startingState: StartingState } {
  const performanceAxis = derivePerformanceAxis(inputs);
  const startingState = deriveStartingState(profileScore.tier, performanceAxis);
  return { performanceAxis, startingState };
}
