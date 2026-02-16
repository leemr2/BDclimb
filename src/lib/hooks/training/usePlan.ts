"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import type { PlanDefinition, WeekSchedule } from "@/lib/plans/bouldering/types";
import {
  getPlanDefinition,
  getCurrentWeekSchedule,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";
import { getCompletedSessionLabelsForWeek } from "@/lib/firebase/training/bouldering-workouts";

function getProgramId(program: ActiveProgram): string {
  const start = program.startDate as { toMillis?: () => number };
  return (typeof start?.toMillis === "function" ? start.toMillis() : Number(start)).toString();
}

/**
 * Resolves plan definition and current week schedule from active program state.
 * Fetches completed session labels for the current week so the schedule shows checkmarks.
 */
export function usePlan(activeProgram: ActiveProgram | null): {
  plan: PlanDefinition | null;
  schedule: WeekSchedule | null;
} {
  const { user } = useAuth();
  const [completedLabels, setCompletedLabels] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid || !activeProgram || activeProgram.goalType !== "bouldering") {
      setCompletedLabels([]);
      return;
    }
    const programId = getProgramId(activeProgram);
    getCompletedSessionLabelsForWeek(
      user.uid,
      programId,
      activeProgram.currentWeek
    ).then(setCompletedLabels).catch(() => setCompletedLabels([]));
  }, [user?.uid, activeProgram?.currentWeek, activeProgram?.goalType, activeProgram?.startDate]);

  if (!activeProgram || activeProgram.goalType !== "bouldering") {
    return { plan: null, schedule: null };
  }

  const frequency = activeProgram.frequency as BoulderingFrequency;
  const plan = getPlanDefinition(frequency);
  const schedule = getCurrentWeekSchedule(
    activeProgram as Parameters<typeof getCurrentWeekSchedule>[0],
    completedLabels
  );

  return { plan, schedule };
}
