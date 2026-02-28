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
}

const PROGRAM_VERSION = "bouldering-v1";

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
    programVersion: PROGRAM_VERSION,
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
