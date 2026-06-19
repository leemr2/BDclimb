"use client";

import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../client";
import type {
  ProfileScore,
  ProgressionParams,
  PerformanceAxis,
  StartingState,
} from "@/lib/plans/power-endurance/profileScore";

export type WeightUnit = "lbs" | "kg";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface TrainingProfile {
  age: number;
  weight: number;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  /** Bouldering limit grade (V-scale). */
  currentLimitGrade?: string;
  /** PE: current sustainable/redpoint route grade (YDS). */
  currentRouteGrade?: string;
  /** PE: 12-week target route grade (YDS). */
  goalRouteGrade?: string;
  /**
   * PE Profile Score System (CruxTracker). Computed at onboarding; governs
   * how fast the program progresses. See docs/CruxTracker_Profile_Score_System.md.
   */
  profileScore?: ProfileScore;
  progressionParams?: ProgressionParams;
  /** PE Performance Axis — derived from the Week 0 assessment. */
  performanceAxis?: PerformanceAxis;
  /** PE starting state — where training begins (bounded by the tier range). */
  startingState?: StartingState;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Get training profile from the user document.
 */
export async function getTrainingProfile(
  userId: string
): Promise<TrainingProfile | null> {
  const userRef = doc(db, "users", userId);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  const profile = data.trainingProfile as TrainingProfile | undefined;
  return profile ?? null;
}

/**
 * Save training profile (creates or overwrites the trainingProfile field).
 */
export async function saveTrainingProfile(
  userId: string,
  data: Omit<TrainingProfile, "createdAt" | "updatedAt">
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const now = Timestamp.now();
  const profile: TrainingProfile = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    await updateDoc(userRef, {
      trainingProfile: profile,
    });
  } else {
    await setDoc(userRef, { trainingProfile: profile });
  }
}

/**
 * Partially update training profile (merge into existing).
 */
export async function updateTrainingProfile(
  userId: string,
  partial: Partial<Omit<TrainingProfile, "createdAt" | "updatedAt">>
): Promise<void> {
  const userRef = doc(db, "users", userId);
  const existing = await getTrainingProfile(userId);
  const now = Timestamp.now();
  const updated: TrainingProfile = existing
    ? { ...existing, ...partial, updatedAt: now }
    : {
        age: 0,
        weight: 0,
        weightUnit: "lbs",
        experienceLevel: "intermediate",
        currentLimitGrade: "V0",
        createdAt: now,
        updatedAt: now,
        ...partial,
      };
  await updateDoc(userRef, { trainingProfile: updated });
}

/**
 * Persist the computed Profile Score and its progression parameters
 * (set once at onboarding).
 */
export async function saveProfileScore(
  userId: string,
  data: { profileScore: ProfileScore; progressionParams: ProgressionParams }
): Promise<void> {
  await updateTrainingProfile(userId, {
    profileScore: data.profileScore,
    progressionParams: data.progressionParams,
  });
}

/**
 * Persist the Performance Axis and derived starting state
 * (set/refreshed at the Week 0 assessment).
 */
export async function saveStartingState(
  userId: string,
  data: { performanceAxis: PerformanceAxis; startingState: StartingState }
): Promise<void> {
  await updateTrainingProfile(userId, {
    performanceAxis: data.performanceAxis,
    startingState: data.startingState,
  });
}
