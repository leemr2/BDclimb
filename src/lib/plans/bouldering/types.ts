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
