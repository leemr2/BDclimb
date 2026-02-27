"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { EasyClimbingData } from "@/lib/plans/bouldering/types";

const INTENSITIES: Array<EasyClimbingData["intensity"]> = ["very_easy", "easy", "moderate"];
const PUMP_LEVELS: Array<EasyClimbingData["pumpLevel"]> = ["none", "light", "moderate"];
const MOVEMENT_QUALITY: Array<EasyClimbingData["movementQuality"]> = ["excellent", "good", "fair", "struggled"];
const FOCUS_OPTIONS = ["silent_feet", "straight_arm", "hover_hands", "precise_feet"];

export interface EasyClimbingLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: EasyClimbingData) => void;
}

export function EasyClimbingLogger({ drill, onComplete }: EasyClimbingLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState<EasyClimbingData["intensity"]>("easy");
  const [drillFocus, setDrillFocus] = useState<string[]>([]);
  const [pumpLevel, setPumpLevel] = useState<EasyClimbingData["pumpLevel"]>("none");
  const [movementQuality, setMovementQuality] = useState<EasyClimbingData["movementQuality"]>("good");

  const toggleFocus = (f: string) => {
    setDrillFocus((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const data: EasyClimbingData = {
        duration,
        intensity,
        drillFocus,
        pumpLevel,
        movementQuality,
      };
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
    [duration, intensity, drillFocus, pumpLevel, movementQuality, currentDrillIndex, dispatch, drills, persistDrills, onComplete]
  );

  return (
    <div className="training-easy-climbing-log">
      <h4>{drill.name}</h4>
      <form onSubmit={handleSubmit} className="training-form">
        <label>
          Duration (minutes)
          <select
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value, 10))}
            className="training-form-group input"
          >
            {[15, 20, 30, 45, 60, 75, 90].map((m) => (
              <option key={m} value={m}>{m} min</option>
            ))}
          </select>
        </label>
        <label>
          Intensity
          <select value={intensity} onChange={(e) => setIntensity(e.target.value as EasyClimbingData["intensity"])} className="training-form-group input">
            {INTENSITIES.map((i) => (
              <option key={i} value={i}>{i.replace("_", " ")}</option>
            ))}
          </select>
        </label>
        <div className="training-form-group">
          <span>Drill focus</span>
          {FOCUS_OPTIONS.map((f) => (
            <label key={f}>
              <input type="checkbox" checked={drillFocus.includes(f)} onChange={() => toggleFocus(f)} />
              {f.replace("_", " ")}
            </label>
          ))}
        </div>
        <label>
          Pump level
          <select value={pumpLevel} onChange={(e) => setPumpLevel(e.target.value as EasyClimbingData["pumpLevel"])} className="training-form-group input">
            {PUMP_LEVELS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
        <label>
          Movement quality
          <select value={movementQuality} onChange={(e) => setMovementQuality(e.target.value as EasyClimbingData["movementQuality"])} className="training-form-group input">
            {MOVEMENT_QUALITY.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="training-timer-btn">
          Complete drill
        </button>
      </form>
    </div>
  );
}
