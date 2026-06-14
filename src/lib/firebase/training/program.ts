"use client";

import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../client";
import {
  getWeekDefinition as getBoulderingWeekDefinition,
  isWeekFullyComplete as isBoulderingWeekFullyComplete,
  resolveProgramWeek as resolveBoulderingProgramWeek,
  type BoulderingFrequency,
  type WorkoutWeekProgress,
} from "@/lib/plans/bouldering/planEngine";
import {
  getWeekDefinition as getPEWeekDefinition,
  isWeekFullyComplete as isPEWeekFullyComplete,
  resolveProgramWeek as resolvePEProgramWeek,
  type PEFrequency,
} from "@/lib/plans/power-endurance/planEngine";

export type GoalType =
  | "bouldering"
  | "route_endurance"
  | "route_power"
  | "route_power_endurance";

export type ProgramStatus = "assessment" | "active" | "deload" | "complete";

export interface ActiveProgram {
  goalType: GoalType;
  frequency: 2 | 3 | 4;
  startDate: Timestamp;
  currentWeek: number;
  currentMesocycle: 1 | 2 | 3;
  status: ProgramStatus;
  programVersion: string;
  /** Education slugs the user has read or dismissed for this program. */
  seenEducationSlugs?: string[];
}

const PROGRAM_VERSIONS: Record<GoalType, string> = {
  bouldering: "bouldering-v1",
  route_endurance: "route-endurance-v1",
  route_power: "route-power-v1",
  route_power_endurance: "power-endurance-v1",
};

function getWeekDefinitionForGoal(goalType: GoalType, frequency: 2 | 3 | 4, week: number) {
  if (goalType === "route_power_endurance") {
    return getPEWeekDefinition(frequency as PEFrequency, week);
  }
  return getBoulderingWeekDefinition(frequency as BoulderingFrequency, week);
}

/** Stable program id derived from startDate (used across workout/assessment queries). */
export function getProgramId(program: Pick<ActiveProgram, "startDate">): string {
  const start = program.startDate as { toMillis?: () => number };
  return (
    typeof start?.toMillis === "function"
      ? start.toMillis()
      : Number(start)
  ).toString();
}

/**
 * Start a new training program (sets activeProgram on user doc).
 */
export async function startProgram(
  userId: string,
  goalType: GoalType,
  frequency: 2 | 3 | 4
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const program: ActiveProgram = {
    goalType,
    frequency,
    startDate: Timestamp.now(),
    currentWeek: 0,
    currentMesocycle: 1,
    status: "assessment",
    programVersion: PROGRAM_VERSIONS[goalType],
  };
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, { activeProgram: program });
  } else {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(userRef, { activeProgram: program });
  }
}

/**
 * Get the user's active program (if any).
 */
export async function getActiveProgram(
  userId: string
): Promise<ActiveProgram | null> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const program = data.activeProgram as ActiveProgram | undefined;
  return program ?? null;
}

/**
 * Update active program fields (e.g. currentWeek, status).
 */
export async function updateActiveProgram(
  userId: string,
  updates: Partial<Omit<ActiveProgram, "goalType" | "frequency" | "startDate" | "programVersion">>
): Promise<void> {
  const current = await getActiveProgram(userId);
  if (!current) return;
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    activeProgram: { ...current, ...updates },
  });
}

/**
 * After a workout is saved, advance currentWeek when the completed week is fully done.
 */
export async function advanceProgramWeekIfComplete(
  userId: string,
  program: ActiveProgram,
  completedWeek: number,
  completedSessionLabels: string[]
): Promise<void> {
  if (
    (program.goalType !== "bouldering" &&
      program.goalType !== "route_power_endurance") ||
    completedWeek < program.currentWeek
  ) {
    return;
  }

  const frequency = program.frequency;
  const weekComplete =
    program.goalType === "route_power_endurance"
      ? isPEWeekFullyComplete(
          frequency as PEFrequency,
          completedWeek,
          completedSessionLabels
        )
      : isBoulderingWeekFullyComplete(
          frequency as BoulderingFrequency,
          completedWeek,
          completedSessionLabels
        );

  if (!weekComplete) return;

  const nextWeek = Math.min(completedWeek + 1, 12);
  if (nextWeek <= program.currentWeek) return;

  const nextWeekDef = getWeekDefinitionForGoal(program.goalType, frequency, nextWeek);
  await updateActiveProgram(userId, {
    currentWeek: nextWeek,
    currentMesocycle: nextWeekDef?.mesocycle ?? program.currentMesocycle,
    status: "active",
  });
}

/**
 * Reconcile stored currentWeek with completed workout history (fixes drift from
 * manual week navigation or URL/session mismatches during testing).
 */
export async function syncProgramWeekFromWorkouts(
  userId: string,
  program: ActiveProgram,
  workouts: WorkoutWeekProgress[]
): Promise<void> {
  if (
    (program.goalType !== "bouldering" &&
      program.goalType !== "route_power_endurance") ||
    program.currentWeek === 0
  ) {
    return;
  }

  const frequency = program.frequency;
  const resolvedWeek =
    program.goalType === "route_power_endurance"
      ? resolvePEProgramWeek(
          frequency as PEFrequency,
          workouts,
          program.currentWeek
        )
      : resolveBoulderingProgramWeek(
          frequency as BoulderingFrequency,
          workouts,
          program.currentWeek
        );

  if (resolvedWeek === program.currentWeek) return;

  const weekDef = getWeekDefinitionForGoal(program.goalType, frequency, resolvedWeek);
  await updateActiveProgram(userId, {
    currentWeek: resolvedWeek,
    currentMesocycle: weekDef?.mesocycle ?? program.currentMesocycle,
    status: "active",
  });
}

/**
 * Subscribe to the user's active program (real-time).
 */
export function subscribeToActiveProgram(
  userId: string,
  onUpdate: (program: ActiveProgram | null) => void
): Unsubscribe {
  const userRef = doc(db, "users", userId);
  return onSnapshot(userRef, (snap) => {
    if (!snap.exists()) {
      onUpdate(null);
      return;
    }
    const data = snap.data();
    const program = data.activeProgram as ActiveProgram | undefined;
    onUpdate(program ?? null);
  });
}

/**
 * Mark an education slug as seen for the active program (deduped).
 */
export async function markEducationSlugSeen(
  userId: string,
  slug: string
): Promise<void> {
  const current = await getActiveProgram(userId);
  if (!current) return;
  const seen = current.seenEducationSlugs ?? [];
  if (seen.includes(slug)) return;
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    activeProgram: {
      ...current,
      seenEducationSlugs: [...seen, slug],
    },
  });
}

/**
 * Cancel the current program: write to programHistory with a cancelled status
 * and clear activeProgram. The program history entry records how far the user got.
 */
export async function cancelProgram(userId: string): Promise<void> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const program = snap.data()?.activeProgram as ActiveProgram | undefined;
  if (!program) return;

  const historyRef = collection(db, "users", userId, "programHistory");
  await addDoc(historyRef, {
    goalType: program.goalType,
    frequency: program.frequency,
    startDate: program.startDate,
    cancelledDate: Timestamp.now(),
    weeksCompleted: program.currentWeek,
    outcome: "cancelled",
  });

  await updateDoc(userRef, { activeProgram: null });
}

/**
 * Complete the current program: write to programHistory and clear activeProgram.
 */
export async function completeProgram(
  userId: string,
  finalMetrics?: Record<string, unknown>
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  const program = snap.data()?.activeProgram as ActiveProgram | undefined;
  if (!program) return;

  const historyRef = collection(db, "users", userId, "programHistory");
  await addDoc(historyRef, {
    goalType: program.goalType,
    frequency: program.frequency,
    startDate: program.startDate,
    completedDate: Timestamp.now(),
    finalMetrics: finalMetrics ?? {},
  });

  await updateDoc(userRef, { activeProgram: null });
}
