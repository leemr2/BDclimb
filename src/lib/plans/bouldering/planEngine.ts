/**
 * Plan engine: resolves user state to current week, schedule, and next session.
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 4.
 */

import type {
  PlanDefinition,
  WeekDefinition,
  SessionDefinition,
  WeekSchedule,
  WeekScheduleDay,
  SessionWithDrills,
} from "./types";
import { plan2Day } from "./2day";
import { plan3Day } from "./3day";
import { plan4Day } from "./4day";
import { resolveDrills } from "./drills";

const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type BoulderingFrequency = 2 | 3 | 4;

export interface ActiveProgram {
  goalType: string;
  frequency: BoulderingFrequency;
  startDate: { toDate?: () => Date } | Date;
  currentWeek: number;
  currentMesocycle: 1 | 2 | 3;
  status: string;
  programVersion?: string;
}

/** Returns the plan definition for the given frequency. */
export function getPlanDefinition(
  frequency: BoulderingFrequency
): PlanDefinition {
  switch (frequency) {
    case 2:
      return plan2Day;
    case 3:
      return plan3Day;
    case 4:
      return plan4Day;
    default:
      return plan4Day;
  }
}

/** Returns the week definition for the given week number (1-12). */
export function getWeekDefinition(
  frequency: BoulderingFrequency,
  weekNumber: number
): WeekDefinition | undefined {
  const plan = getPlanDefinition(frequency);
  return plan.weeks.find((w) => w.weekNumber === weekNumber);
}

/**
 * Returns the next session for the user's current week.
 * If completedSessionLabels is provided (e.g. from workout logs), returns the first session not in that set.
 */
export function getNextSession(
  activeProgram: ActiveProgram,
  completedSessionLabels?: string[]
): SessionDefinition | null {
  const weekDef = getWeekDefinition(
    activeProgram.frequency as BoulderingFrequency,
    activeProgram.currentWeek
  );
  if (!weekDef || weekDef.sessions.length === 0) return null;

  const completed = new Set(completedSessionLabels ?? []);
  const next = weekDef.sessions.find((s) => !completed.has(s.label));
  return next ?? null;
}

/**
 * Builds the full week schedule for the dashboard: 7 days with session or rest.
 * nextSession is the session to show in "Today's Workout" (first uncompleted, or first of week in Phase 1).
 */
export function getCurrentWeekSchedule(
  activeProgram: ActiveProgram,
  completedSessionLabels?: string[]
): WeekSchedule | null {
  const weekDef = getWeekDefinition(
    activeProgram.frequency as BoulderingFrequency,
    activeProgram.currentWeek
  );
  if (!weekDef) return null;

  const completed = new Set(completedSessionLabels ?? []);
  const sessionByDay = new Map<string, SessionDefinition>();
  for (const s of weekDef.sessions) {
    sessionByDay.set(s.suggestedDay, s);
  }

  const days: WeekScheduleDay[] = DAY_ORDER.map((dayName) => {
    const session = sessionByDay.get(dayName) ?? null;
    return {
      dayName,
      session,
      isRest: session === null,
      status: session
        ? completed.has(session.label)
          ? "completed"
          : "upcoming"
        : "rest",
    };
  });

  const nextSession = getNextSession(activeProgram, completedSessionLabels);

  return {
    weekNumber: weekDef.weekNumber,
    mesocycle: weekDef.mesocycle,
    isDeload: weekDef.isDeload,
    days,
    nextSession,
  };
}

/**
 * Expands a session's drill refs to full drill definitions (for workout flow UI).
 */
export function getSessionWithDrills(
  session: SessionDefinition
): SessionWithDrills {
  const drillIds = session.drills.map((d) => d.id);
  const drills = resolveDrills(drillIds);
  return {
    ...session,
    drills,
  };
}

/** Mesocycle display names. */
export const MESOCYCLE_NAMES: Record<1 | 2 | 3, string> = {
  1: "Max Strength Foundation",
  2: "Power / RFD Development",
  3: "Peak Performance",
};
