"use client";

import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "../client";

export type WeightUnit = "lbs" | "kg";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export interface TrainingProfile {
  age: number;
  weight: number;
  weightUnit: WeightUnit;
  experienceLevel: ExperienceLevel;
  currentLimitGrade: string;
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
