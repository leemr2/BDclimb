"use client";

import {
  collection,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

export type CalendarStatus = "thinking" | "confirmed";

export interface CalendarEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  timeBlock: string; // "06:00", "06:30", etc.
  userId: string;
  displayName: string;
  status: CalendarStatus;
  createdAt: Timestamp;
}

/**
 * Generate time blocks from 6:00 AM to 10:00 PM (30-minute intervals)
 */
export const generateTimeBlocks = (): string[] => {
  const blocks: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    blocks.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 22) {
      blocks.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }
  return blocks;
};

/**
 * Format time block for display (12-hour format)
 */
export const formatTimeBlock = (timeBlock: string): string => {
  const [hours, minutes] = timeBlock.split(":");
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

/**
 * Add or update a calendar entry
 */
export const upsertCalendarEntry = async (
  date: string,
  timeBlock: string,
  userId: string,
  displayName: string,
  status: CalendarStatus
): Promise<void> => {
  // Check if entry already exists for this user, date, and time block
  const entriesRef = collection(db, "calendar");
  const q = query(
    entriesRef,
    where("date", "==", date),
    where("timeBlock", "==", timeBlock),
    where("userId", "==", userId)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    // Create new entry
    await addDoc(entriesRef, {
      date,
      timeBlock,
      userId,
      displayName,
      status,
      createdAt: Timestamp.now(),
    });
  } else {
    // Update existing entry
    const existingDoc = querySnapshot.docs[0];
    await updateDoc(existingDoc.ref, {
      status,
      displayName,
    });
  }
};

/**
 * Remove a calendar entry
 */
export const removeCalendarEntry = async (
  date: string,
  timeBlock: string,
  userId: string
): Promise<void> => {
  const entriesRef = collection(db, "calendar");
  const q = query(
    entriesRef,
    where("date", "==", date),
    where("timeBlock", "==", timeBlock),
    where("userId", "==", userId)
  );

  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const docToDelete = querySnapshot.docs[0];
    await deleteDoc(docToDelete.ref);
  }
};

/**
 * Toggle calendar entry status
 * Cycle: empty -> thinking -> confirmed -> empty
 */
export const toggleCalendarEntry = async (
  date: string,
  timeBlock: string,
  userId: string,
  displayName: string,
  currentStatus?: CalendarStatus
): Promise<void> => {
  if (!currentStatus) {
    // No entry exists, create "thinking" entry
    await upsertCalendarEntry(date, timeBlock, userId, displayName, "thinking");
  } else if (currentStatus === "thinking") {
    // Upgrade to "confirmed"
    await upsertCalendarEntry(date, timeBlock, userId, displayName, "confirmed");
  } else {
    // Remove entry (confirmed -> empty)
    await removeCalendarEntry(date, timeBlock, userId);
  }
};

/**
 * Subscribe to calendar entries for a specific date
 */
export const subscribeToCalendarEntries = (
  date: string,
  callback: (entries: CalendarEntry[]) => void
): Unsubscribe => {
  const entriesRef = collection(db, "calendar");
  const q = query(entriesRef, where("date", "==", date));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: CalendarEntry[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as CalendarEntry[];
      callback(entries);
    },
    (error) => {
      console.error("Error subscribing to calendar entries:", error);
    }
  );
};

/**
 * Get calendar entries for a specific date (one-time fetch)
 */
export const getCalendarEntries = async (
  date: string
): Promise<CalendarEntry[]> => {
  const entriesRef = collection(db, "calendar");
  const q = query(entriesRef, where("date", "==", date));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as CalendarEntry[];
};
