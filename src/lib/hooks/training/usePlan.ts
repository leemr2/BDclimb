"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import type { PlanDefinition, WeekSchedule } from "@/lib/plans/bouldering/types";
import type { CAFBenchmark } from "@/lib/plans/power-endurance/types";
import {
  getPlanDefinition as getBoulderingPlanDefinition,
  getCurrentWeekSchedule as getBoulderingWeekSchedule,
  type BoulderingFrequency,
} from "@/lib/plans/bouldering/planEngine";
import {
  getPlanDefinition as getPEPlanDefinition,
  getCurrentWeekSchedule as getPEWeekSchedule,
  getSessionWithDrills,
  type PEFrequency,
} from "@/lib/plans/power-endurance/planEngine";
import { getCAFWorkoutBaseline } from "@/lib/plans/power-endurance/calculations";
import {
  getTrainingProfile,
  type TrainingProfile,
} from "@/lib/firebase/training/profile";
import { getCompletedSessionLabelsForWeek as getBoulderingCompletedLabels } from "@/lib/firebase/training/bouldering-workouts";
import { getCompletedSessionLabelsForWeek as getPECompletedLabels } from "@/lib/firebase/training/power-endurance-workouts";
import {
  getAssessmentForWeek,
  getAssessmentsForProgram,
} from "@/lib/firebase/training/power-endurance-assessments";
import { getProgramId } from "@/lib/firebase/training/program";

/**
 * Resolves plan definition and current week schedule from active program state.
 */
export function usePlan(activeProgram: ActiveProgram | null): {
  plan: PlanDefinition | null;
  schedule: WeekSchedule | null;
  workoutsAvailable: boolean;
  cafBenchmark: CAFBenchmark | null;
} {
  const { user } = useAuth();
  const [completedLabels, setCompletedLabels] = useState<string[]>([]);
  const [cafBenchmark, setCafBenchmark] = useState<CAFBenchmark | null>(null);
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(
    null
  );

  useEffect(() => {
    if (!user?.uid) {
      setTrainingProfile(null);
      return;
    }
    getTrainingProfile(user.uid)
      .then(setTrainingProfile)
      .catch(() => setTrainingProfile(null));
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !activeProgram) {
      setCompletedLabels([]);
      return;
    }
    const programId = getProgramId(activeProgram);
    const loader =
      activeProgram.goalType === "route_power_endurance"
        ? getPECompletedLabels
        : getBoulderingCompletedLabels;

    loader(user.uid, programId, activeProgram.currentWeek)
      .then(setCompletedLabels)
      .catch(() => setCompletedLabels([]));
  }, [user?.uid, activeProgram?.currentWeek, activeProgram?.goalType, activeProgram?.startDate]);

  useEffect(() => {
    if (!user?.uid || !activeProgram || activeProgram.goalType !== "route_power_endurance") {
      setCafBenchmark(null);
      return;
    }
    const programId = getProgramId(activeProgram);
    getAssessmentForWeek(user.uid, programId, 0)
      .then((week0) => setCafBenchmark(getCAFWorkoutBaseline(week0)))
      .catch(() => setCafBenchmark(null));
  }, [user?.uid, activeProgram?.goalType, activeProgram?.startDate]);

  if (!activeProgram) {
    return { plan: null, schedule: null, workoutsAvailable: false, cafBenchmark: null };
  }

  if (activeProgram.goalType === "route_power_endurance") {
    const frequency = activeProgram.frequency as PEFrequency;
    const plan = getPEPlanDefinition(frequency);
    const schedule = getPEWeekSchedule(
      activeProgram as Parameters<typeof getPEWeekSchedule>[0],
      completedLabels
    );
    const workoutsAvailable = cafBenchmark != null;

    if (schedule?.nextSession && cafBenchmark) {
      const expanded = getSessionWithDrills(
        schedule.nextSession,
        cafBenchmark,
        frequency,
        {
          tier: trainingProfile?.profileScore?.tier ?? null,
          progressionParams: trainingProfile?.progressionParams ?? null,
          startingState: trainingProfile?.startingState ?? null,
        }
      );
      return {
        plan,
        schedule: { ...schedule, nextSession: expanded },
        workoutsAvailable,
        cafBenchmark,
      };
    }

    return { plan, schedule, workoutsAvailable, cafBenchmark };
  }

  if (activeProgram.goalType !== "bouldering") {
    return { plan: null, schedule: null, workoutsAvailable: false, cafBenchmark: null };
  }

  const frequency = activeProgram.frequency as BoulderingFrequency;
  const plan = getBoulderingPlanDefinition(frequency);
  const schedule = getBoulderingWeekSchedule(
    activeProgram as Parameters<typeof getBoulderingWeekSchedule>[0],
    completedLabels
  );

  return { plan, schedule, workoutsAvailable: true, cafBenchmark: null };
}

/** Load all PE assessments for progress/comparison views. */
export function usePEAssessments(program: ActiveProgram | null) {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<
    Awaited<ReturnType<typeof getAssessmentsForProgram>>
  >([]);

  useEffect(() => {
    if (!user?.uid || !program || program.goalType !== "route_power_endurance") {
      setAssessments([]);
      return;
    }
    getAssessmentsForProgram(user.uid, getProgramId(program))
      .then(setAssessments)
      .catch(() => setAssessments([]));
  }, [user?.uid, program?.goalType, program?.startDate]);

  return assessments;
}
