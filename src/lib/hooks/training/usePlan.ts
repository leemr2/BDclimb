"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import type { PlanDefinition, WeekSchedule } from "@/lib/plans/bouldering/types";
import {
  getPlanDefinition as getBoulderingPlanDefinition,
  getCurrentWeekSchedule as getBoulderingWeekSchedule,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";
import {
  getPlanDefinition as getPEPlanDefinition,
  getCurrentWeekSchedule as getPEWeekSchedule,
  type PEFrequency,
} from "@/lib/plans/power-endurance/planEngine";
import { getCompletedSessionLabelsForWeek } from "@/lib/firebase/training/bouldering-workouts";
import { getProgramId } from "@/lib/firebase/training/program";

/**
 * Resolves plan definition and current week schedule from active program state.
 */
export function usePlan(activeProgram: ActiveProgram | null): {
  plan: PlanDefinition | null;
  schedule: WeekSchedule | null;
  workoutsAvailable: boolean;
} {
  const { user } = useAuth();
  const [completedLabels, setCompletedLabels] = useState<string[]>([]);

  useEffect(() => {
    if (!user?.uid || !activeProgram || activeProgram.goalType !== "bouldering") {
      setCompletedLabels([]);
      return;
    }
    getCompletedSessionLabelsForWeek(
      user.uid,
      getProgramId(activeProgram),
      activeProgram.currentWeek
    )
      .then(setCompletedLabels)
      .catch(() => setCompletedLabels([]));
  }, [user?.uid, activeProgram?.currentWeek, activeProgram?.goalType, activeProgram?.startDate]);

  if (!activeProgram) {
    return { plan: null, schedule: null, workoutsAvailable: false };
  }

  if (activeProgram.goalType === "route_power_endurance") {
    const frequency = activeProgram.frequency as PEFrequency;
    const plan = getPEPlanDefinition(frequency);
    const schedule = getPEWeekSchedule(
      activeProgram as Parameters<typeof getPEWeekSchedule>[0],
      completedLabels
    );
    return { plan, schedule, workoutsAvailable: false };
  }

  if (activeProgram.goalType !== "bouldering") {
    return { plan: null, schedule: null, workoutsAvailable: false };
  }

  const frequency = activeProgram.frequency as BoulderingFrequency;
  const plan = getBoulderingPlanDefinition(frequency);
  const schedule = getBoulderingWeekSchedule(
    activeProgram as Parameters<typeof getBoulderingWeekSchedule>[0],
    completedLabels
  );

  return { plan, schedule, workoutsAvailable: true };
}
