"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import {
  subscribeToTodaysCheckin,
  getTodaysCheckin,
  getRecentCheckins,
  type DailyCheckin,
  type DailyCheckinInput,
} from "@/lib/firebase/training/daily-checkins";
import type { CheckinForSafety } from "@/lib/calculations/safety";

/**
 * Subscribe to today's check-in (real-time). Use for "done / not done" and link to check-in page.
 */
export function useTodaysCheckin(): {
  checkin: DailyCheckin | null;
  loading: boolean;
} {
  const { user } = useAuth();
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setCheckin(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToTodaysCheckin(user.uid, (next) => {
      setCheckin(next);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  return { checkin, loading };
}

/**
 * Fetch recent check-ins for safety rules. Returns shape expected by useSafety(recentCheckins).
 */
export function useRecentCheckinsForSafety(days: number = 14): CheckinForSafety[] {
  const { user } = useAuth();
  const [list, setList] = useState<CheckinForSafety[]>([]);

  useEffect(() => {
    if (!user?.uid) {
      setList([]);
      return;
    }
    getRecentCheckins(user.uid, days)
      .then((checkins) => {
        const forSafety: CheckinForSafety[] = checkins
          .reverse()
          .map((c) => ({
            fingerStiffness: c.fingerStiffness,
            readinessForTraining: c.readinessForTraining,
            energyLevel: c.energyLevel,
          }));
        setList(forSafety);
      })
      .catch(() => setList([]));
  }, [user?.uid, days]);

  return list;
}

export type { DailyCheckin, DailyCheckinInput };
