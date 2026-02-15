"use client";

import type { ActiveProgram } from "@/lib/firebase/training/program";
import type { PlanDefinition, WeekSchedule } from "@/lib/plans/bouldering/types";
import {
  getPlanDefinition,
  getCurrentWeekSchedule,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";

/**
 * Resolves plan definition and current week schedule from active program state.
 */
export function usePlan(activeProgram: ActiveProgram | null): {
  plan: PlanDefinition | null;
  schedule: WeekSchedule | null;
} {
  if (!activeProgram || activeProgram.goalType !== "bouldering") {
    return { plan: null, schedule: null };
  }

  const frequency = activeProgram.frequency as BoulderingFrequency;
  const plan = getPlanDefinition(frequency);
  const schedule = getCurrentWeekSchedule(
    activeProgram as Parameters<typeof getCurrentWeekSchedule>[0],
    undefined
  );

  return { plan, schedule };
}
