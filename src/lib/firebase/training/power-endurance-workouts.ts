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
  Timestamp,
  type UpdateData,
} from "firebase/firestore";
import { db } from "../client";
import type {
  CompletedDrill,
  CompleteWorkoutInput,
  CreateWorkoutInput,
  SkinCondition,
  WorkoutStatus,
} from "./bouldering-workouts";

export type { CompletedDrill, CompleteWorkoutInput, CreateWorkoutInput, SkinCondition, WorkoutStatus };

export interface PowerEnduranceWorkout {
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
  /** 0–10 composite shoulder symptom score, tracked every PE session (design §3). */
  shoulderSymptomScore: number;
}

export async function createWorkout(
  userId: string,
  input: CreateWorkoutInput
): Promise<string> {
  const ref = collection(db, "users", userId, "powerEnduranceWorkouts");
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
    shoulderSymptomScore: 0,
  };
  const snap = await addDoc(ref, docData);
  return snap.id;
}

export async function updateWorkout(
  userId: string,
  workoutId: string,
  updates: Partial<Omit<PowerEnduranceWorkout, "programId" | "startedAt">>
): Promise<void> {
  const ref = doc(db, "users", userId, "powerEnduranceWorkouts", workoutId);
  await updateDoc(ref, updates as UpdateData<PowerEnduranceWorkout>);
}

export async function completeWorkout(
  userId: string,
  workoutId: string,
  summary: CompleteWorkoutInput
): Promise<void> {
  const ref = doc(db, "users", userId, "powerEnduranceWorkouts", workoutId);
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
    shoulderSymptomScore: summary.shoulderSymptomScore ?? 0,
  });
}

export async function getWorkout(
  userId: string,
  workoutId: string
): Promise<PowerEnduranceWorkout | null> {
  const ref = doc(db, "users", userId, "powerEnduranceWorkouts", workoutId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as PowerEnduranceWorkout;
}

export async function getWorkoutsForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<PowerEnduranceWorkout[]> {
  const ref = collection(db, "users", userId, "powerEnduranceWorkouts");
  const q = query(
    ref,
    where("programId", "==", programId),
    where("week", "==", week),
    where("status", "==", "completed")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as PowerEnduranceWorkout);
}

export async function getCompletedSessionLabelsForWeek(
  userId: string,
  programId: string,
  week: number
): Promise<string[]> {
  const workouts = await getWorkoutsForWeek(userId, programId, week);
  return [...new Set(workouts.map((w) => w.sessionLabel))];
}

export async function getCompletedWorkouts(
  userId: string,
  programId: string,
  limitCount: number = 50
): Promise<Array<PowerEnduranceWorkout & { id: string }>> {
  const ref = collection(db, "users", userId, "powerEnduranceWorkouts");
  const q = query(
    ref,
    where("programId", "==", programId),
    where("status", "==", "completed")
  );
  const snapshot = await getDocs(q);
  const results = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as Array<PowerEnduranceWorkout & { id: string }>;

  return results
    .sort((a, b) => {
      const aMs = (a.completedAt as Timestamp | null)?.toMillis?.() ?? 0;
      const bMs = (b.completedAt as Timestamp | null)?.toMillis?.() ?? 0;
      return bMs - aMs;
    })
    .slice(0, limitCount);
}
