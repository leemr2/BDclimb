"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { MobilityData } from "@/lib/plans/bouldering/types";

const AREAS = ["shoulders", "hips", "fingers", "thoracic", "wrists"];

export interface MobilityLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: MobilityData) => void;
}

export function MobilityLogger({ drill, onComplete }: MobilityLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [duration, setDuration] = useState(15);
  const [areasAddressed, setAreasAddressed] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const toggleArea = (area: string) => {
    setAreasAddressed((prev) => (prev.includes(area) ? prev.filter((x) => x !== area) : [...prev, area]));
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: MobilityData = { duration, areasAddressed, notes };
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
    [duration, areasAddressed, notes, currentDrillIndex, dispatch, drills, persistDrills, onComplete]
  );

  return (
    <div className="training-mobility-log">
      <h4>{drill.name}</h4>
      <form onSubmit={handleSubmit} className="training-form">
        <label>
          Duration (minutes)
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
            className="training-form-group input"
          />
        </label>
        <div className="training-form-group">
          <span>Areas addressed</span>
          {AREAS.map((a) => (
            <label key={a}>
              <input type="checkbox" checked={areasAddressed.includes(a)} onChange={() => toggleArea(a)} />
              {a}
            </label>
          ))}
        </div>
        <label>
          Notes
          <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} className="training-form-group input" />
        </label>
        <button type="submit" className="training-timer-btn">
          Complete drill
        </button>
      </form>
    </div>
  );
}
