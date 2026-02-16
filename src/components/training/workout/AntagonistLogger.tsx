"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { AntagonistData } from "@/lib/plans/bouldering/types";

const DEFAULT_EXERCISES = [
  "Push-ups / Dips",
  "Reverse wrist curls",
  "Face pulls",
  "Wrist pronation/supination",
];

export interface AntagonistLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: AntagonistData) => void;
}

export function AntagonistLogger({ drill, onComplete }: AntagonistLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [exercises, setExercises] = useState<
    Array<{ name: string; setsCompleted: number; reps: number; notes: string }>
  >(DEFAULT_EXERCISES.map((name) => ({ name, setsCompleted: 3, reps: 0, notes: "" })));

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: AntagonistData = { exercises };
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
      persistDrills(nextDrills);
      onComplete(data);
    },
    [exercises, currentDrillIndex, dispatch, drills, persistDrills, onComplete]
  );

  const updateExercise = (index: number, updates: Partial<AntagonistData["exercises"][number]>) => {
    setExercises((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  return (
    <div className="training-antagonist-log">
      <h4>{drill.name}</h4>
      <form onSubmit={handleSubmit} className="training-antagonist-log-form">
        {exercises.map((ex, i) => (
          <div key={i} className="training-antagonist-exercise">
            <span className="training-antagonist-name">{ex.name}</span>
            <label>
              Sets
              <input
                type="number"
                min={0}
                value={ex.setsCompleted}
                onChange={(e) => updateExercise(i, { setsCompleted: parseInt(e.target.value, 10) || 0 })}
                className="training-form-group input"
              />
            </label>
            <label>
              Reps
              <input
                type="number"
                min={0}
                value={ex.reps || ""}
                onChange={(e) => updateExercise(i, { reps: parseInt(e.target.value, 10) || 0 })}
                className="training-form-group input"
              />
            </label>
            <input
              type="text"
              placeholder="Notes"
              value={ex.notes}
              onChange={(e) => updateExercise(i, { notes: e.target.value })}
              className="training-form-group input"
            />
          </div>
        ))}
        <button type="submit" className="training-timer-btn">
          Complete drill
        </button>
      </form>
    </div>
  );
}
