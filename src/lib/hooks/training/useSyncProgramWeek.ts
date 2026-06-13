"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { getCompletedWorkouts } from "@/lib/firebase/training/bouldering-workouts";
import {
  getProgramId,
  syncProgramWeekFromWorkouts,
} from "@/lib/firebase/training/program";

/**
 * On load, reconcile activeProgram.currentWeek with completed workout history.
 */
export function useSyncProgramWeek(): void {
  const { user } = useAuth();
  const { program } = useActiveProgram();
  const syncedProgramIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.uid || !program || program.goalType !== "bouldering") {
      syncedProgramIdRef.current = null;
      return;
    }
    if (program.currentWeek === 0) return;

    const programId = getProgramId(program);
    if (syncedProgramIdRef.current === programId) return;

    let cancelled = false;
    getCompletedWorkouts(user.uid, programId, 100)
      .then((workouts) => {
        if (cancelled) return;
        syncedProgramIdRef.current = programId;
        return syncProgramWeekFromWorkouts(
          user.uid,
          program,
          workouts.map((w) => ({ week: w.week, sessionLabel: w.sessionLabel }))
        );
      })
      .catch((e) => {
        console.error("Failed to sync program week from workouts", e);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.uid, program]);
}
