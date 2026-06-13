"use client";

import { useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import { MaxHangAttemptFlow } from "./MaxHangAttemptFlow";
import { upsertAssessmentMaxHang } from "@/lib/firebase/training/bouldering-assessments";
import type { DrillDefinition, MaxHangAssessment } from "@/lib/plans/bouldering/types";

const RETEST_WEEKS = new Set([4, 8, 12]);

export interface MaxHangRetestLoggerProps {
  drill: DrillDefinition;
  onComplete: () => void;
}

export function MaxHangRetestLogger({ drill, onComplete }: MaxHangRetestLoggerProps) {
  const {
    dispatch,
    currentDrillIndex,
    persistDrills,
    drills,
    bodyweight,
    weightUnit,
    programId,
    workoutWeek,
    userId,
    baselineMaxHang,
  } = useWorkout();

  const handleComplete = useCallback(
    async (data: MaxHangAssessment) => {
      dispatch({
        type: "COMPLETE_DRILL",
        payload: { drillIndex: currentDrillIndex, data: data as unknown as Record<string, unknown> },
      });

      const nextDrills = [...drills];
      nextDrills[currentDrillIndex] = {
        ...nextDrills[currentDrillIndex],
        completed: true,
        data: data as unknown as Record<string, unknown>,
        completedAt: Timestamp.now(),
      };
      await persistDrills(nextDrills);

      if (
        programId &&
        workoutWeek != null &&
        RETEST_WEEKS.has(workoutWeek)
      ) {
        try {
          await upsertAssessmentMaxHang(userId, programId, workoutWeek, data);
        } catch (e) {
          console.error("Failed to save retest to assessment:", e);
        }
      }

      onComplete();
    },
    [
      currentDrillIndex,
      dispatch,
      drills,
      onComplete,
      persistDrills,
      programId,
      userId,
      workoutWeek,
    ]
  );

  return (
    <MaxHangAttemptFlow
      bodyweight={bodyweight}
      weightUnit={weightUnit}
      title={drill.name}
      defaultEdgeSize={baselineMaxHang?.edgeSize ?? 20}
      defaultGripType={baselineMaxHang?.gripType ?? "half_crimp"}
      onComplete={handleComplete}
    />
  );
}
