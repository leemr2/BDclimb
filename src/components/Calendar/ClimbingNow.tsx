"use client";

import { useState, useEffect } from "react";
import {
  subscribeToActiveCheckins,
  checkIn,
  checkOut,
  isCheckinActive,
  type CheckinEntry,
} from "@/lib/firebase/checkins";

interface ClimbingNowProps {
  userId: string;
  displayName: string | null;
}

/**
 * Format how long ago a check-in happened, e.g. "just now", "25 min", "2h 5m".
 */
const formatElapsed = (checkedInMs: number, now: number): string => {
  const minutes = Math.max(0, Math.floor((now - checkedInMs) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
};

export const ClimbingNow = ({ userId, displayName }: ClimbingNowProps) => {
  const [entries, setEntries] = useState<CheckinEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const unsubscribe = subscribeToActiveCheckins((newEntries) => {
      setEntries(newEntries);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Tick every 60s so elapsed times stay fresh and entries drop off locally
  // when they cross the 4-hour expiry, even without a new Firestore snapshot.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const activeEntries = entries.filter((entry) => isCheckinActive(entry, now));
  const myCheckin = activeEntries.find((entry) => entry.userId === userId);
  const isCheckedIn = !!myCheckin;
  const canAct = !!displayName && !submitting;

  const handleToggle = async () => {
    if (!displayName) {
      alert("Please set your display name first");
      return;
    }

    setSubmitting(true);
    try {
      if (isCheckedIn) {
        await checkOut(userId);
      } else {
        await checkIn(userId, displayName);
      }
    } catch (error) {
      console.error("Error updating check-in:", error);
      alert("Failed to update your check-in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`climbing-now-panel${isCheckedIn ? " checked-in" : ""}`}>
      <div className="climbing-now-header">
        <div className="climbing-now-title">
          <span className="climbing-now-dot" aria-hidden="true" />
          <h2>Climbing now</h2>
        </div>
        <button
          type="button"
          className={`climbing-now-btn${isCheckedIn ? " checkout" : ""}`}
          onClick={handleToggle}
          disabled={!canAct}
        >
          {submitting
            ? "..."
            : isCheckedIn
              ? "Check out"
              : "Check in to climb"}
        </button>
      </div>

      {loading ? (
        <div className="climbing-now-loading">Loading...</div>
      ) : activeEntries.length === 0 ? (
        <p className="climbing-now-empty">No one is climbing right now.</p>
      ) : (
        <ul className="climbing-now-list">
          {activeEntries.map((entry) => {
            const name = entry.displayName?.trim() || "Someone";
            const elapsed = formatElapsed(
              entry.checkedInAt?.toMillis?.() ?? now,
              now
            );
            const isMe = entry.userId === userId;
            return (
              <li
                key={entry.id}
                className={`climbing-now-climber${isMe ? " is-me" : ""}`}
              >
                <span className="climbing-now-name">
                  {name}
                  {isMe && <span className="climbing-now-you"> (you)</span>}
                </span>
                <span className="climbing-now-elapsed">{elapsed}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
