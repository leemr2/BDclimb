"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";

export interface WarmupLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: Record<string, unknown>) => void;
}

export function WarmupLogger({ drill, onComplete }: WarmupLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [notes, setNotes] = useState("");

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data = { notes };
      dispatch({
        type: "COMPLETE_DRILL",
        payload: { drillIndex: currentDrillIndex, data },
      });
      const nextDrills = [...drills];
      nextDrills[currentDrillIndex] = {
        ...nextDrills[currentDrillIndex],
        completed: true,
        data,
        completedAt: Timestamp.now(),
      };
      persistDrills(nextDrills);
      onComplete(data);
    },
    [notes, currentDrillIndex, dispatch, drills, persistDrills, onComplete]
  );

  return (
    <div className="training-warmup-log">
      <h4>{drill.name}</h4>
      <p className="training-warmup-desc">{drill.description}</p>
      <form onSubmit={handleSubmit} className="training-form">
        <label>
          Notes (optional)
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="training-form-group input" />
        </label>
        <button type="submit" className="training-timer-btn">
          Warm-up complete
        </button>
      </form>
    </div>
  );
}
