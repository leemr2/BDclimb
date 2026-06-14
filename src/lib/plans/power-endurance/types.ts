/**
 * Power-endurance plan type definitions.
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Sections 3-4.
 */

import type {
  PlanDefinition,
  WeekDefinition,
  SessionDefinition,
  DrillRef,
  WeekSchedule,
  WeekScheduleDay,
  SessionWithDrills,
  GripType,
  MaxHangAssessment,
  MaxHangAttempt,
  CampusBoardAssessment,
  PullingStrengthAssessment,
  InjuryBaseline,
  FingerStatus,
  DrillDefinition as BoulderingDrillDefinition,
} from "@/lib/plans/bouldering/types";

export type {
  PlanDefinition,
  WeekDefinition,
  SessionDefinition,
  DrillRef,
  WeekSchedule,
  WeekScheduleDay,
  SessionWithDrills,
  GripType,
  MaxHangAssessment,
  MaxHangAttempt,
  CampusBoardAssessment,
  PullingStrengthAssessment,
  FingerStatus,
};

/** PE extends injury baseline with composite shoulder tracking. */
export interface PEInjuryBaseline extends InjuryBaseline {
  shoulderSymptomScore?: number;
}

export type PEDrillType =
  | "warmup"
  | "max_hang"
  | "max_hang_retest"
  | "pull_up"
  | "campus"
  | "antagonist"
  | "core"
  | "mobility"
  | "arc_climbing"
  | "four_by_four"
  | "intervals"
  | "intermittent_hang"
  | "critical_force"
  | "crux_after_fatigue"
  | "route_practice"
  | "threshold_intervals"
  | "easy_climbing";

export interface PEDrillDefinition extends Omit<BoulderingDrillDefinition, "type"> {
  type: PEDrillType;
}

/** Session with PE drills expanded from catalog. */
export interface PESessionWithDrills extends Omit<SessionDefinition, "drills"> {
  drills: PEDrillDefinition[];
}

// --- PE drill data shapes (workout logs; Phase 2+) ---

export type ARCClimbingData = {
  sets: Array<{
    durationMinutes: number;
    terrainStyle: string;
    targetRPE: number;
    actualRPE: number;
    pumpLevel: number;
    breathing: "easy" | "moderate" | "hard";
    silentFootSlips: number;
    fluencyStops: number;
    fluencyStopLocations: string;
    restAfterMinutes: number;
  }>;
  constraintsActive: { silentFeet: boolean; fluency: boolean };
  totalClimbingMinutes: number;
  sessionSilentFootSlipsTotal: number;
  sessionFluencyStopsTotal: number;
  movementQuality: "smooth_relaxed" | "good" | "ok" | "tense_inefficient";
  targetIntensityMet: boolean;
};

export type FourByFourData = {
  problems: Array<{
    description: string;
    grade: string;
    gradesbelowLimit: number;
  }>;
  rounds: Array<{
    problemFalls: [number, number, number, number];
    totalFalls: number;
    recoveryFeel: number;
    restAfterMinutes: number;
  }>;
  roundsCompleted: number;
  totalFalls: number;
  lateRoundQuality:
    | "maintained_form"
    | "slight_degradation"
    | "significant_degradation"
    | "broke_down";
  problemSelectionFeedback: "too_easy" | "good" | "too_hard";
  pumpByRound: number[];
  progressionDecision:
    | "increase_rounds"
    | "increase_difficulty"
    | "maintain"
    | "reduce";
};

export type IntervalsData = {
  sets: Array<{
    intervals: Array<{
      workTimeSeconds: number;
      terrainRoute: string;
      intensityRPE: number;
      pumpLevel: number;
      completed: boolean;
      restAfterSeconds: number;
      notes: string;
    }>;
    restBetweenSetsMinutes: number;
  }>;
  totalIntervalsAttempted: number;
  totalIntervalsCompleted: number;
  completionRate: number;
  pacingAssessment:
    | "started_too_hard"
    | "good_pacing"
    | "started_conservative_finished_strong"
    | "other";
  recoveryBetweenIntervals: "adequate" | "borderline" | "insufficient" | "too_much";
  powerMaintenance:
    | "explosive_throughout"
    | "good_early_slight_decline"
    | "moderate_decline"
    | "significant_dropoff";
  progressionDecision:
    | "add_interval"
    | "increase_duration"
    | "reduce_rest"
    | "increase_difficulty"
    | "maintain"
    | "reduce";
};

export type IntermittentHangData = {
  maxHangReference: number;
  workingLoad: number;
  protocol: "7on_3off" | "7on_2off";
  sets: Array<{
    targetLoad: number;
    actualLoad: number;
    repsCompleted: number;
    stoppingReason: "target_reached" | "force_drop" | "form_fail" | "pain";
    forceQuality: number;
    restAfterMinutes: number;
  }>;
  totalReps: number;
  totalTimeUnderTensionSeconds: number;
  avgRepsPerSet: number;
  forceConsistency: "maintained" | "slight_drop" | "moderate_drop" | "significant_drop";
  trendVsLastSession: { lastTotal: number; change: number } | null;
};

export type CriticalForceData = {
  maxHangReference: number;
  edgeSize: number;
  gripType: "half_crimp" | "open_hand";
  targetIntensityDescription: string;
  rhythm: string;
  blocks: Array<{
    targetLoad: number;
    actualLoad: number;
    repsCompleted: number;
    finalFormMaintained: boolean;
    forceStableLate: boolean;
    rpeDuringBlock: number;
    restAfterMinutes: number;
    notes: string;
  }>;
  totalBlocksCompleted: number;
  totalReps: number;
  totalTimeUnderTensionSeconds: number;
  intensityCalibration: "correct" | "too_easy" | "too_hard" | "inconsistent";
  forceConsistencyBlockToBlock:
    | "very_consistent"
    | "slight_decline"
    | "significant_decline"
    | "major_drop";
  comparedToIHE: "harder" | "similar" | "easier" | "different";
  progressionDecision:
    | "increase_load"
    | "maintain"
    | "reduce_load"
    | "reduce_to_2_blocks";
};

export type CruxAfterFatigueData = {
  leadInDuration: number;
  leadInTerrain: string;
  cruxDescription: string;
  cruxGrade: string;
  cruxTotalMoves: number;
  rounds: Array<{
    leadInCompleted: boolean;
    leadInRPE: number;
    pumpBeforeCrux: number;
    movesCompleted: number;
    success: boolean;
    executionQuality: number;
    restAfterMinutes: number;
    mentalState: "focused" | "distracted" | "anxious" | "confident";
    notes: string;
  }>;
  totalRounds: number;
  successRate: number;
  avgMovesCompleted: number;
  avgPumpBeforeCrux: number;
  avgExecutionQuality: number;
  trendVsLastSession: {
    lastSuccessRate: number;
    trend: "improving" | "stable" | "declining";
  } | null;
  leadInPacing: "too_fast" | "good" | "too_slow" | "inconsistent";
  shakeRestManagement: "excellent" | "good" | "fair" | "poor";
  limitingFactor:
    | "forearm_pump"
    | "finger_strength"
    | "power_explosiveness"
    | "technical_execution"
    | "mental_focus"
    | "pacing_errors";
};

export type RoutePracticeData = {
  sessionFocus:
    | "learning_beta"
    | "linking_sections"
    | "redpoint_attempts"
    | "fluency_rehearsal";
  fluencyConstraintActive: boolean;
  routes: Array<{
    routeName: string;
    grade: string;
    lengthMinutes: number;
    style: "power_endurance" | "endurance" | "technical";
    result: "send" | "fall" | "hang";
    attempts: number;
    highPoint: string;
    falls: number;
    pumpAtCrux: number;
    fluencyStopCount: number;
    energyAtCrux: number;
    keyObservations: string;
    betaChanges: string;
  }>;
  projectTracking: {
    projectName: string;
    totalAttemptsToDate: number;
    whereFailingConsistently:
      | "early_section"
      | "middle"
      | "late_crux"
      | "after_crux"
      | "inconsistent";
    currentBottleneck:
      | "finger_strength"
      | "power_endurance"
      | "pacing"
      | "rest_position_inefficiency"
      | "technical"
      | "mental_tactical"
      | "beta_not_dialed";
  } | null;
};

export type ThresholdIntervalsData = {
  sets: Array<{
    workTimeMinutes: number;
    terrainRoute: string;
    intensityRPE: number;
    pumpLevel: number;
    completed: boolean;
    restAfterMinutes: number;
    notes: string;
  }>;
  totalSetsCompleted: number;
  pacingConsistency: "excellent" | "good" | "inconsistent" | "poor";
};

// --- Assessment types (Week 0, 4, 8, 12) ---

export type IHEStoppingReason =
  | "force_drop"
  | "form_fail"
  | "pain"
  | "time_limit";

export interface IntermittentEnduranceAssessment {
  workingLoad: number;
  protocol: "7on_3off" | "7on_2off" | "other";
  sets: Array<{
    repsCompleted: number;
    stoppingReason: IHEStoppingReason;
    forceQuality: number;
  }>;
  totalReps: number;
  totalTimeSeconds: number;
}

export interface CruxAfterFatigueAttempt {
  leadInCompleted: boolean;
  pumpBeforeCrux: number;
  movesCompleted: number;
  success: boolean;
  executionQuality: number;
  notes: string;
}

export interface CruxAfterFatigueAssessment {
  leadInDuration: number;
  cruxDescription: string;
  cruxTotalMoves: number;
  attempts: CruxAfterFatigueAttempt[];
  successRate: number;
  avgMovesCompleted: number;
  avgPumpBeforeCrux: number;
  limitingFactor?:
    | "forearm_pump"
    | "finger_strength"
    | "technique"
    | "mental"
    | "power";
}

export interface RoutePowerEnduranceTest {
  routeDescription: string;
  timeToCompletion: number;
  fallsHangs: number;
  pumpAtFinish: number;
}

export interface PEOptionalTests {
  weightedPullup: { maxLoad: number; reps: number } | null;
  campusMaxReach: { highestRung: number; movesIn10RM: number } | null;
  routePowerEnduranceTest: RoutePowerEnduranceTest | null;
}

export interface PowerEnduranceAssessment {
  id?: string;
  programId: string;
  week: number;
  date: Date | { toDate?: () => Date };
  fingerMaxStrength: MaxHangAssessment;
  intermittentEndurance: IntermittentEnduranceAssessment;
  cruxAfterFatigue: CruxAfterFatigueAssessment;
  optionalTests: PEOptionalTests;
  injuryBaseline: PEInjuryBaseline;
}
