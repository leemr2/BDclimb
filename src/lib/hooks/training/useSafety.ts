"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  getCompletedWorkouts,
  getWorkoutsForWeek,
} from "@/lib/firebase/training/bouldering-workouts";
import {
  getCompletedWorkouts as getCompletedPEWorkouts,
  getWorkoutsForWeek as getPEWorkoutsForWeek,
} from "@/lib/firebase/training/power-endurance-workouts";
import { getWeeklySRPE } from "@/lib/calculations/srpe";
import { buildPESafetyInput } from "@/lib/plans/power-endurance/calculations";
import {
  runSafetyChecks,
  type SafetyFlagResult,
  type SafetyUserData,
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
    const goalType = program?.goalType;
    const isPE = goalType === "route_power_endurance";
    const isBouldering = goalType === "bouldering";
    if (!user?.uid || !program || (!isBouldering && !isPE)) {
      setFlags([]);
      setLoading(false);
      return;
    }

    const uid = user.uid;
    const programId = getProgramId(program);
    const currentWeek = program.currentWeek;
    const checkins = recentCheckins ?? [];

    setLoading(true);

    if (isPE) {
      Promise.all([
        getCompletedPEWorkouts(uid, programId, 20),
        currentWeek >= 1 ? getPEWorkoutsForWeek(uid, programId, currentWeek) : [],
        currentWeek >= 2
          ? getPEWorkoutsForWeek(uid, programId, currentWeek - 1)
          : [],
      ])
        .then(([recentWorkouts, thisWeekWorkouts, lastWeekWorkouts]) => {
          const latestWorkout = recentWorkouts[0] ?? null;
          const peInput = buildPESafetyInput(recentWorkouts);
          const userData: SafetyUserData = {
            latestWorkout: latestWorkout
              ? {
                  fingerPainDuring: latestWorkout.fingerPainDuring,
                  shoulderSymptomScore:
                    peInput.latestShoulderSymptomScore ?? undefined,
                }
              : null,
            thisWeekSRPE: getWeeklySRPE(thisWeekWorkouts),
            lastWeekSRPE: getWeeklySRPE(lastWeekWorkouts),
            checkins,
            recentShoulderScores: peInput.recentShoulderScores,
            latestARCPumpLevel: peInput.latestARCPumpLevel,
            fourByFourRound1Falls: peInput.fourByFourRound1Falls,
            cfbIntensityCalibration: peInput.cfbIntensityCalibration,
          };
          setFlags(runSafetyChecks(userData));
        })
        .catch(() => setFlags([]))
        .finally(() => setLoading(false));
      return;
    }

    Promise.all([
      getCompletedWorkouts(uid, programId, 1),
      currentWeek >= 1 ? getWorkoutsForWeek(uid, programId, currentWeek) : [],
      currentWeek >= 2
        ? getWorkoutsForWeek(uid, programId, currentWeek - 1)
        : [],
    ])
      .then(([latestList, thisWeekWorkouts, lastWeekWorkouts]) => {
        const latestWorkout = latestList[0] ?? null;
        const userData: SafetyUserData = {
          latestWorkout: latestWorkout
            ? { fingerPainDuring: latestWorkout.fingerPainDuring }
            : null,
          thisWeekSRPE: getWeeklySRPE(thisWeekWorkouts),
          lastWeekSRPE: getWeeklySRPE(lastWeekWorkouts),
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
