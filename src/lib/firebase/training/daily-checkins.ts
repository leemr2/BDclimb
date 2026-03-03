/**
 * Firestore operations for daily check-ins (morning wellness log).
 * See docs/Bouldering_Trainer/Bouldering_trainer_design.md Section 3.
 * Stored at users/{uid}/dailyCheckins/{dateString} (e.g. "2026-03-02").
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../client";

export interface DailyCheckin {
  date: Timestamp;
  fingerStiffness: number;
  fingerPain: number;
  energyLevel: number;
  sleepQuality: number;
  sleepHours: number;
  motivation: number;
  sorenessLocations: string[];
  readinessForTraining: number;
  notes: string;
}

export interface DailyCheckinInput {
  fingerStiffness: number;
  fingerPain: number;
  energyLevel: number;
  sleepQuality: number;
  sleepHours: number;
  motivation: number;
  sorenessLocations: string[];
  readinessForTraining: number;
  notes?: string;
}

/** Format a Date as YYYY-MM-DD for use as document ID. */
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Create or update today's check-in. Uses local date for the document ID.
 */
export async function createOrUpdateCheckin(
  userId: string,
  input: DailyCheckinInput
): Promise<void> {
  const date = new Date();
  const dateStr = toDateString(date);
  const ref = doc(db, "users", userId, "dailyCheckins", dateStr);
  const data: DailyCheckin = {
    date: Timestamp.fromDate(date),
    fingerStiffness: input.fingerStiffness,
    fingerPain: input.fingerPain,
    energyLevel: input.energyLevel,
    sleepQuality: input.sleepQuality,
    sleepHours: input.sleepHours,
    motivation: input.motivation,
    sorenessLocations: input.sorenessLocations ?? [],
    readinessForTraining: input.readinessForTraining,
    notes: input.notes ?? "",
  };
  await setDoc(ref, data);
}

/**
 * Get check-in for a specific date (by date string).
 */
export async function getCheckin(
  userId: string,
  dateStr: string
): Promise<DailyCheckin | null> {
  const ref = doc(db, "users", userId, "dailyCheckins", dateStr);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as DailyCheckin;
}

/**
 * Get today's check-in (if any).
 */
export async function getTodaysCheckin(
  userId: string
): Promise<DailyCheckin | null> {
  return getCheckin(userId, toDateString(new Date()));
}

/**
 * Get recent check-ins for the last N days (for safety/trends).
 * Returns newest first. Requires a Firestore index on (date desc).
 */
export async function getRecentCheckins(
  userId: string,
  days: number = 14
): Promise<Array<DailyCheckin & { dateStr: string }>> {
  const ref = collection(db, "users", userId, "dailyCheckins");
  const q = query(ref, orderBy("date", "desc"), limit(days));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    ...(d.data() as DailyCheckin),
    dateStr: d.id,
  }));
}

/**
 * Subscribe to today's check-in (real-time) for dashboard "done / not done" state.
 */
export function subscribeToTodaysCheckin(
  userId: string,
  callback: (checkin: DailyCheckin | null) => void
): Unsubscribe {
  const dateStr = toDateString(new Date());
  const ref = doc(db, "users", userId, "dailyCheckins", dateStr);
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as DailyCheckin) : null);
  });
}
