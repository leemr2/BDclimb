"use client";

import { useContext } from "react";
import { WorkoutContext, type WorkoutContextValue } from "@/components/training/workout/WorkoutProvider";

/**
 * Access workout state and dispatch from WorkoutProvider.
 * Must be used within a WorkoutProvider.
 */
export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return ctx;
}
