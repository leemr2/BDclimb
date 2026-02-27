"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { CoreData } from "@/lib/plans/bouldering/types";

const QUALITIES = ["clean", "ok", "struggle"] as const;
const DEFAULT_EXERCISES: CoreData["exercises"] = [
  { name: "Front lever progressions", sets: 3, reps: "3-6", quality: "clean" },
  { name: "Hanging knee raises", sets: 3, reps: "10-15", quality: "clean" },
  { name: "Copenhagen planks", sets: 3, reps: "30s", quality: "clean" },
];

export interface CoreLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: CoreData) => void;
}

export function CoreLogger({ drill, onComplete }: CoreLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [exercises, setExercises] = useState<CoreData["exercises"]>(DEFAULT_EXERCISES);

  const updateExercise = (index: number, updates: Partial<CoreData["exercises"][number]>) => {
    setExercises((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: CoreData = { exercises };
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

  return (
    <div className="training-core-log">
      <h4>{drill.name}</h4>
      <form onSubmit={handleSubmit} className="training-core-log-form">
        {exercises.map((ex, i) => (
          <div key={i} className="training-core-exercise">
            <input
              type="text"
              value={ex.name}
              onChange={(e) => updateExercise(i, { name: e.target.value })}
              className="training-form-group input"
            />
            <label>
              Sets
              <select
                value={ex.sets}
                onChange={(e) => updateExercise(i, { sets: parseInt(e.target.value, 10) })}
                className="training-form-group input"
              >
                {Array.from({ length: 11 }, (_, n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
            <label>
              Reps
              <input
                type="text"
                value={ex.reps}
                onChange={(e) => updateExercise(i, { reps: e.target.value })}
                className="training-form-group input"
              />
            </label>
            <select
              value={ex.quality}
              onChange={(e) => updateExercise(i, { quality: e.target.value as CoreData["exercises"][number]["quality"] })}
              className="training-form-group input"
            >
              {QUALITIES.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </div>
        ))}
        <button type="submit" className="training-timer-btn">
          Complete drill
        </button>
      </form>
    </div>
  );
}
