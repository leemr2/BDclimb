"use client";

import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

export interface GymEvent {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "HH:MM"
  durationMinutes: number;
  createdBy: string;
  createdByName: string;
  createdAt: Timestamp;
}

export const createEvent = async (
  name: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  userId: string,
  displayName: string
): Promise<void> => {
  await addDoc(collection(db, "events"), {
    name,
    date,
    startTime,
    durationMinutes,
    createdBy: userId,
    createdByName: displayName,
    createdAt: Timestamp.now(),
  });
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  await deleteDoc(doc(db, "events", eventId));
};

/**
 * Subscribe to upcoming events (today and future), ordered by date then startTime.
 * Sorting by startTime is done client-side to avoid needing a composite Firestore index.
 */
export const subscribeToUpcomingEvents = (
  callback: (events: GymEvent[]) => void
): Unsubscribe => {
  const todayStr = new Date().toISOString().split("T")[0];
  const eventsRef = collection(db, "events");
  const q = query(
    eventsRef,
    where("date", ">=", todayStr),
    orderBy("date", "asc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events: GymEvent[] = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() }) as GymEvent)
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.startTime.localeCompare(b.startTime);
        });
      callback(events);
    },
    (error) => {
      console.error("Error subscribing to events:", error);
    }
  );
};
