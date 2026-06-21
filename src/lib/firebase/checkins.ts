"use client";

import {
  collection,
  query,
  where,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  getDocs,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./client";

/**
 * A check-in is considered active ("climbing now") for this long after it is
 * created. After this window it auto-expires: hidden from the UI and lazily
 * deleted from Firestore. There is no server cron, so expiry is derived
 * client-side. Keep in sync with the `checkins` delete rule in firestore.rules.
 */
export const CHECKIN_DURATION_MS = 4 * 60 * 60 * 1000;

export interface CheckinEntry {
  id: string;
  userId: string;
  displayName: string;
  checkedInAt: Timestamp;
}

/**
 * Whether a check-in is still within its active (climbing) window.
 */
export const isCheckinActive = (
  entry: CheckinEntry,
  now: number = Date.now()
): boolean => {
  const checkedInMs = entry.checkedInAt?.toMillis?.() ?? 0;
  return checkedInMs > now - CHECKIN_DURATION_MS;
};

/**
 * Check the current user in as "climbing now". Removes any prior check-in for
 * the user first so there is only ever one active check-in per user.
 */
export const checkIn = async (
  userId: string,
  displayName: string
): Promise<void> => {
  await checkOut(userId);

  const checkinsRef = collection(db, "checkins");
  await addDoc(checkinsRef, {
    userId,
    displayName,
    checkedInAt: Timestamp.now(),
  });
};

/**
 * Check the user out by removing all of their check-in documents.
 */
export const checkOut = async (userId: string): Promise<void> => {
  const checkinsRef = collection(db, "checkins");
  const q = query(checkinsRef, where("userId", "==", userId));

  const querySnapshot = await getDocs(q);
  await Promise.all(querySnapshot.docs.map((d) => deleteDoc(d.ref)));
};

/**
 * Subscribe to active check-ins ("who is climbing now").
 *
 * Expired check-ins are filtered out of the callback and lazily deleted from
 * Firestore (best-effort) so the collection self-cleans without a backend cron.
 * Active entries are sorted by check-in time ascending (earliest first).
 */
export const subscribeToActiveCheckins = (
  callback: (entries: CheckinEntry[]) => void
): Unsubscribe => {
  const checkinsRef = collection(db, "checkins");

  return onSnapshot(
    checkinsRef,
    (snapshot) => {
      const now = Date.now();
      const all: CheckinEntry[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as CheckinEntry[];

      const active = all.filter((entry) => isCheckinActive(entry, now));
      const expired = all.filter((entry) => !isCheckinActive(entry, now));

      // Best-effort lazy cleanup of stale check-ins; ignore failures since
      // another client may delete the same doc concurrently.
      expired.forEach((entry) => {
        deleteDoc(doc(checkinsRef, entry.id)).catch((error) => {
          console.error("Error deleting expired check-in:", error);
        });
      });

      active.sort(
        (a, b) =>
          (a.checkedInAt?.toMillis?.() ?? 0) - (b.checkedInAt?.toMillis?.() ?? 0)
      );

      callback(active);
    },
    (error) => {
      console.error("Error subscribing to check-ins:", error);
    }
  );
};
