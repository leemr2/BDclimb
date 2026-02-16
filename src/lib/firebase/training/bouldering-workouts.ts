"use client";

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
  type UpdateData,
} from "firebase/firestore";
import { db } from "../client";

export type WorkoutStatus = "in_progress" | "completed" | "skipped";

export type SkinCondition = "good" | "fair" | "poor";

/** Completed drill result stored in a workout document. */
export interface CompletedDrill {
  drillId: string;
  drillType: string;
  order: number;
  completed: boolean;
  data: Record<string, unknown>;
  completedAt: Timestamp;
}

export interface BoulderingWorkout {
  programId: string;
  date: Timestamp;
  week: number;
  mesocycle: 1 | 2 | 3;
  sessionLabel: string;
  sessionType: string;
  status: WorkoutStatus;
  duration: number;
  startedAt: Timestamp;
  completedAt: Timestamp | null;
  rpe: number;
  srpe: number;
  sessionQuality: number;
  drills: CompletedDrill[];
  notes: string;
  fingerPainDuring: number;
  skinCondition: SkinCondition;
}

export interface CreateWorkoutInput {
  programId: string;
  week: number;
  mesocycle: 1 | 2 | 3;
  sessionLabel: string;
  sessionType: string;
  drills: CompletedDrill[];
}

export interface CompleteWorkoutInput {
  rpe: number;
  sessionQuality: number;
  fingerPainDuring: number;
  skinCondition: SkinCondition;
  notes?: string;
}

/**
 * Create a new workout document when user starts a workout.
 */
export async function createWorkout(
  userId: string,
  input: CreateWorkoutInput
): Promise<string> {
  const ref = collection(db, "users", userId, "boulderingWorkouts");
  const now = Timestamp.now();
  const docData = {
    programId: input.programId,
    date: now,
    week: input.week,
    mesocycle: input.mesocycle,
    sessionLabel: input.sessionLabel,
    sessionType: input.sessionType,
    status: "in_progress" as WorkoutStatus,
    duration: 0,
    startedAt: now,
    completedAt: null,
    rpe: 0,
    srpe: 0,
    sessionQuality: 0,
    drills: input.drills,
    notes: "",
    fingerPainDuring: 0,
    skinCondition: "good" as SkinCondition,
  };
  const snap = await addDoc(ref, docData);
  return snap.id;
}

/**
 * Update workout document (e.g. after completing a drill or mid-session).
 */
export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Omit<BoulderingWorkout, "programId" | "startedAt">>
): Promise<void> {
  const ref = doc(db, "users", userId, "boulderingWorkouts", workoutId);
  await updateDoc(ref, updates as UpdateData<BoulderingWorkout>);
}

/**
 * Mark workout as completed and set summary fields.
 */
export async function completeWorkout(
  userId: string,
  workoutId: string,
  summary: CompleteWorkoutInput
): Promise<void> {
  const ref = doc(db, "users", userId, "boulderingWorkouts", workoutId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const startedAt = data.startedAt as Timestamp;
  const now = Timestamp.now();
  const durationMinutes = Math.round(
    (now.toMillis() - startedAt.toMillis()) / 60000
  );
  const srpe = durationMinutes * summary.rpe;
  await updateDoc(ref, {
    status: "completed",
    completedAt: now,
    duration: durationMinutes,
    rpe: summary.rpe,
    srpe,
    sessionQuality: summary.sessionQuality,
    fingerPainDuring: summary.fingerPainDuring,
    skinCondition: summary.skinCondition,
    notes: summary.notes ?? "",
  });
}

/**
 * Get a single workout by id.
 */
export async function getWorkout(
  userId: string,
  workoutId: string
): Promise<BoulderingWorkout | null> {
  const ref = doc(db, "users", userId, "boulderingWorkouts", workoutId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as BoulderingWorkout;
}

/**
 * Get completed workouts for a given week (for dashboard completion status).
 */
export async function getWorkoutsForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<BoulderingWorkout[]> {
  const ref = collection(db, "users", userId, "boulderingWorkouts");
  const q = query(
    ref,
    where("programId", "==", programId),
    where("week", "==", week),
    where("status", "==", "completed")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as BoulderingWorkout);
}

/**
 * Get completed session labels for a week (for dashboard checkmarks).
 */
export async function getCompletedSessionLabelsForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<string[]> {
  const workouts = await getWorkoutsForWeek(userId, programId, week);
  return [...new Set(workouts.map((w) => w.sessionLabel))];
}

/**
 * Get completed workouts for history list, ordered by date desc.
 */
export async function getCompletedWorkouts(
  userId: string,
  programId: string,
  limitCount: number = 50
): Promise<Array<BoulderingWorkout & { id: string }>> {
  const ref = collection(db, "users", userId, "boulderingWorkouts");
  const q = query(
    ref,
    where("programId", "==", programId),
    where("status", "==", "completed"),
    orderBy("completedAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Array<BoulderingWorkout & { id: string }>;
}

/**
 * Get all completed workouts for the user (any program), for history list.
 */
export async function getCompletedWorkoutsAll(
  userId: string,
  limitCount: number = 50
): Promise<Array<BoulderingWorkout & { id: string }>> {
  const ref = collection(db, "users", userId, "boulderingWorkouts");
  const q = query(
    ref,
    where("status", "==", "completed"),
    orderBy("completedAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Array<BoulderingWorkout & { id: string }>;
}

/**
 * Subscribe to a single workout (real-time).
 */
export function subscribeToWorkout(
  userId: string,
  workoutId: string,
  callback: (workout: BoulderingWorkout | null) => void
): Unsubscribe {
  const ref = doc(db, "users", userId, "boulderingWorkouts", workoutId);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback(snap.data() as BoulderingWorkout);
  });
}
