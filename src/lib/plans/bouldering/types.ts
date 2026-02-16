/**
 * Bouldering plan type definitions.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Sections 3-4.
 */

// --- Drill data shapes (stored in workout logs) ---

export type MaxHangData = {
  sets: Array<{
    targetLoad: number;
    actualLoad: number;
    targetPercent: number;
    duration: number;
    heldClean: boolean;
    pain: number;
    restAfter: number;
    notes: string;
  }>;
  totalQualityReps: number;
  edgeSize: number;
  gripType: string;
};

export type LimitBoulderData = {
  problems: Array<{
    description: string;
    grade: string;
    style: "power" | "technical" | "compression" | "mixed";
    attempts: number;
    result: "send" | "highpoint" | "working";
    quality: number;
    restMinutes: number;
    notes: string;
  }>;
  totalAttempted: number;
  totalSent: number;
  sendRate: number;
};

export type CampusDrillData = {
  exercise: string;
  sets: Array<{
    result: string;
    quality: "clean" | "ok" | "struggle";
    restMinutes: number;
    notes: string;
  }>;
  overallPowerFeel: "explosive" | "good" | "sluggish" | "grinding";
  formQuality: "maintained" | "slight_decline" | "significant_decline";
};

export type PullUpData = {
  sets: Array<{
    addedWeight: number;
    reps: number;
    quality: "clean" | "ok" | "struggle";
    restMinutes: number;
  }>;
  bestSet: string;
};

export type AntagonistData = {
  exercises: Array<{
    name: string;
    setsCompleted: number;
    reps: number;
    notes: string;
  }>;
};

export type EasyClimbingData = {
  duration: number;
  intensity: "very_easy" | "easy" | "moderate";
  drillFocus: string[];
  pumpLevel: "none" | "light" | "moderate";
  movementQuality: "excellent" | "good" | "fair" | "struggled";
};

export type CoreData = {
  exercises: Array<{
    name: string;
    sets: number;
    reps: number | string;
    quality: "clean" | "ok" | "struggle";
  }>;
};

export type MobilityData = {
  duration: number;
  areasAddressed: string[];
  notes: string;
};

// --- Plan engine types ---

export type DrillType =
  | "warmup"
  | "max_hang"
  | "limit_boulder"
  | "campus"
  | "pull_up"
  | "antagonist"
  | "easy_climbing"
  | "core"
  | "mobility";

export interface DrillDefinition {
  id: string;
  type: DrillType;
  name: string;
  description: string;
  instructions: string[];
  sets?: number;
  reps?: number | string;
  intensity?: string;
  restSeconds?: number;
  notes: string[];
  isOptional: boolean;
  safetyWarnings: string[];
  progressionRules: string[];
}

/** Reference to a drill in the catalog; session definitions use this. */
export interface DrillRef {
  id: string;
}

export interface SessionDefinition {
  label: string;
  suggestedDay: string;
  title: string;
  intent: string;
  estimatedDuration: number;
  drills: DrillRef[];
}

export interface WeekDefinition {
  weekNumber: number;
  mesocycle: 1 | 2 | 3;
  isDeload: boolean;
  isTestWeek: boolean;
  educationSlug: string | null;
  sessions: SessionDefinition[];
}

export interface PlanDefinition {
  frequency: 2 | 3 | 4;
  weeks: WeekDefinition[];
}

/** Session with drills expanded from catalog (for UI). */
export interface SessionWithDrills extends Omit<SessionDefinition, "drills"> {
  drills: DrillDefinition[];
}

/** Single day in the week schedule: either a session or rest. */
export interface WeekScheduleDay {
  dayName: string;
  session: SessionDefinition | null;
  isRest: boolean;
  status?: "completed" | "upcoming" | "today" | "rest";
}

/** Full week schedule for dashboard. */
export interface WeekSchedule {
  weekNumber: number;
  mesocycle: 1 | 2 | 3;
  isDeload: boolean;
  days: WeekScheduleDay[];
  nextSession: SessionDefinition | null;
}

// --- Assessment types (Week 0, 4, 8, 12) ---

export type GripType = "half_crimp" | "open_hand" | "other";

export interface MaxHangAttempt {
  load: number; // total load (BW + added)
  addedWeight: number;
  heldFull7s: boolean;
  notes: string;
}

export interface MaxHangAssessment {
  attempts: MaxHangAttempt[];
  bestLoad: number; // auto-calculated
  percentBodyweight: number; // auto-calculated
  edgeSize: number; // mm (typically 20mm)
  gripType: GripType;
}

export interface CampusReachAttempt {
  rung: number;
  controlled: boolean;
}

export interface CampusBoardAssessment {
  maxReach: {
    attempts: CampusReachAttempt[];
    bestRung: number;
  };
  movesToFailure: {
    totalMoves: number;
    stoppingReason: "grip_fail" | "power" | "exhaustion";
  };
  rungSpacing: number; // mm
}

export interface LimitBoulderProblem {
  problemDescription: string;
  grade: string;
  attemptsToSend: number;
  sent: boolean;
  highPoint: string | null;
  style: "power" | "technical" | "compression";
  notes: string;
}

export interface PullingStrengthAttempt {
  addedWeight: number;
  repsCompleted: number;
  quality: "clean" | "ok" | "struggle";
}

export interface PullingStrengthAssessment {
  attempts: PullingStrengthAttempt[];
  bestWeightXReps: string; // e.g., "45 lbs × 4 reps"
}

export interface FingerStatus {
  painAtRest: number; // 0-10
  painWithPressure: number; // 0-10
  stiffness: number; // 0-10
}

export interface InjuryBaseline {
  fingers: {
    [key: string]: FingerStatus; // e.g., "r_index", "l_middle", "r_ring", "l_ring"
  };
  elbowPain: { left: number; right: number }; // 0-10 each
  shoulderPain: { left: number; right: number }; // 0-10 each
  morningStiffness: number; // 0-10
  concerns: string; // free text
}

export interface BoulderingAssessment {
  id?: string; // Firestore doc ID
  programId: string;
  week: number; // 0, 4, 8, 12
  date: Date | { toDate?: () => Date };
  maxHang: MaxHangAssessment;
  campusBoard: CampusBoardAssessment | null; // null if skipped
  limitBoulders: LimitBoulderProblem[];
  pullingStrength: PullingStrengthAssessment | null; // null if skipped
  injuryBaseline: InjuryBaseline;
}
