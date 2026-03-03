"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  getCompletedWorkouts,
  getWorkoutsForWeek,
} from "@/lib/firebase/training/bouldering-workouts";
import { getWeeklySRPE } from "@/lib/calculations/srpe";
import {
  runSafetyChecks,
  type SafetyFlagResult,
  type CheckinForSafety,
} from "@/lib/calculations/safety";

function getProgramId(program: { startDate: unknown }): string {
  const start = program.startDate as { toMillis?: () => number };
  return (typeof start?.toMillis === "function"
    ? start.toMillis()
    : Number(start)
  ).toString();
}

/**
 * Loads workout and check-in data, runs safety rules, and returns any flags.
 * Check-ins are optional (empty until daily check-in flow exists).
 */
export function useSafety(
  recentCheckins?: CheckinForSafety[]
): { flags: SafetyFlagResult[]; loading: boolean } {
  const { user } = useAuth();
  const { program } = useActiveProgram();
  const [flags, setFlags] = useState<SafetyFlagResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !program || program.goalType !== "bouldering") {
      setFlags([]);
      setLoading(false);
      return;
    }

    const programId = getProgramId(program);
    const currentWeek = program.currentWeek;

    setLoading(true);
    Promise.all([
      getCompletedWorkouts(user.uid, programId, 1),
      currentWeek >= 1
        ? getWorkoutsForWeek(user.uid, programId, currentWeek)
        : [],
      currentWeek >= 2
        ? getWorkoutsForWeek(user.uid, programId, currentWeek - 1)
        : [],
    ])
      .then(([latestList, thisWeekWorkouts, lastWeekWorkouts]) => {
        const latestWorkout = latestList[0] ?? null;
        const thisWeekSRPE = getWeeklySRPE(thisWeekWorkouts);
        const lastWeekSRPE = getWeeklySRPE(lastWeekWorkouts);
        const checkins = recentCheckins ?? [];

        const userData = {
          latestWorkout: latestWorkout
            ? { fingerPainDuring: latestWorkout.fingerPainDuring }
            : null,
          thisWeekSRPE,
          lastWeekSRPE,
          checkins,
        };
        setFlags(runSafetyChecks(userData));
      })
      .catch(() => setFlags([]))
      .finally(() => setLoading(false));
  }, [
    user?.uid,
    program?.currentWeek,
    program?.goalType,
    program?.startDate,
    recentCheckins,
  ]);

  return { flags, loading };
}
