/**
 * Plan engine for power-endurance programs.
 * See docs/PowerEndurance_Trainer/Power_endurance_trainer_design.md Section 4.
 */

import type {
  PlanDefinition,
  WeekDefinition,
  SessionDefinition,
  WeekSchedule,
  WeekScheduleDay,
  PESessionWithDrills,
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

export type PEFrequency = 2 | 3 | 4;

export interface ActiveProgram {
  goalType: string;
  frequency: PEFrequency;
  startDate: { toDate?: () => Date } | Date;
  currentWeek: number;
  currentMesocycle: 1 | 2 | 3;
  status: string;
  programVersion?: string;
}

export function getPlanDefinition(frequency: PEFrequency): PlanDefinition {
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

export function getWeekDefinition(
  frequency: PEFrequency,
  weekNumber: number
): WeekDefinition | undefined {
  const plan = getPlanDefinition(frequency);
  return plan.weeks.find((w) => w.weekNumber === weekNumber);
}

export function getNextSession(
  activeProgram: ActiveProgram,
  completedSessionLabels?: string[]
): SessionDefinition | null {
  const weekDef = getWeekDefinition(
    activeProgram.frequency as PEFrequency,
    activeProgram.currentWeek
  );
  if (!weekDef || weekDef.sessions.length === 0) return null;

  const completed = new Set(completedSessionLabels ?? []);
  const next = weekDef.sessions.find((s) => !completed.has(s.label));
  return next ?? null;
}

export function getCurrentWeekSchedule(
  activeProgram: ActiveProgram,
  completedSessionLabels?: string[]
): WeekSchedule | null {
  const weekDef = getWeekDefinition(
    activeProgram.frequency as PEFrequency,
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

export function getSessionWithDrills(
  session: SessionDefinition
): PESessionWithDrills {
  const drillIds = session.drills.map((d) => d.id);
  const drills = resolveDrills(drillIds);
  return {
    ...session,
    drills,
  };
}

export const MESOCYCLE_NAMES: Record<1 | 2 | 3, string> = {
  1: "Aerobic Base + Max Force",
  2: "Power-Endurance Build",
  3: "Specific Linking + Redpoint",
};

export interface WorkoutWeekProgress {
  week: number;
  sessionLabel: string;
}

export function isWeekFullyComplete(
  frequency: PEFrequency,
  week: number,
  completedSessionLabels: string[]
): boolean {
  const weekDef = getWeekDefinition(frequency, week);
  if (!weekDef) return false;
  const completed = new Set(completedSessionLabels);
  return weekDef.sessions.every((s) => completed.has(s.label));
}

export function resolveProgramWeek(
  frequency: PEFrequency,
  workouts: WorkoutWeekProgress[],
  storedWeek: number
): number {
  if (workouts.length === 0) return storedWeek;

  const byWeek = new Map<number, Set<string>>();
  for (const w of workouts) {
    if (!byWeek.has(w.week)) byWeek.set(w.week, new Set());
    byWeek.get(w.week)!.add(w.sessionLabel);
  }

  let firstIncomplete = 12;
  for (let week = 1; week <= 12; week++) {
    const weekDef = getWeekDefinition(frequency, week);
    if (!weekDef) continue;
    const done = byWeek.get(week) ?? new Set();
    if (!weekDef.sessions.every((s) => done.has(s.label))) {
      firstIncomplete = week;
      break;
    }
  }

  const maxLoggedWeek = Math.max(...workouts.map((w) => w.week));
  if (maxLoggedWeek <= firstIncomplete) return firstIncomplete;

  for (let week = maxLoggedWeek; week >= 1; week--) {
    if (!byWeek.has(week)) continue;
    const weekDef = getWeekDefinition(frequency, week);
    if (!weekDef) continue;
    const done = byWeek.get(week)!;
    const allComplete = weekDef.sessions.every((s) => done.has(s.label));
    return allComplete ? Math.min(week + 1, 12) : week;
  }

  return firstIncomplete;
}
