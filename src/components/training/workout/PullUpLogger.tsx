"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { PullUpData } from "@/lib/plans/bouldering/types";
import { RestTimer } from "./RestTimer";

const QUALITIES = ["clean", "ok", "struggle"] as const;

export interface PullUpLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: PullUpData) => void;
}

export function PullUpLogger({ drill, onComplete }: PullUpLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const setsCount = drill.sets ?? 5;
  const restSeconds = 180;

  const [currentSet, setCurrentSet] = useState(0);
  const [phase, setPhase] = useState<"log" | "rest">("log");
  const [sets, setSets] = useState<
    Array<{ addedWeight: number; reps: number; quality: typeof QUALITIES[number]; restMinutes: number }>
  >(Array.from({ length: setsCount }, () => ({ addedWeight: 0, reps: 0, quality: "clean", restMinutes: 3 })));

  const handleSetSubmit = useCallback(
    (addedWeight: number, reps: number, quality: typeof QUALITIES[number]) => {
      const finalSets = [...sets];
      finalSets[currentSet] = { addedWeight, reps, quality, restMinutes: 3 };
      setSets(finalSets);
      if (currentSet >= setsCount - 1) {
        const best = finalSets.reduce((best, s) => {
          return !best || s.addedWeight * s.reps > (best.addedWeight * best.reps) ? s : best;
        }, finalSets[0]);
        const bestSet = best ? `${best.addedWeight} lbs × ${best.reps} reps` : "";
        const data: PullUpData = {
          sets: finalSets,
          bestSet,
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
      } else {
        setPhase("rest");
      }
    },
    [currentSet, sets, setsCount, currentDrillIndex, dispatch, drills, persistDrills, onComplete]
  );

  const handleRestComplete = useCallback(() => {
    setCurrentSet((s) => s + 1);
    setPhase("log");
  }, []);

  if (phase === "rest") {
    return (
      <RestTimer
        durationSeconds={restSeconds}
        onComplete={handleRestComplete}
        nextUpLabel={`Next: Set ${currentSet + 2} of ${setsCount}`}
      />
    );
  }

  return (
    <div className="training-pullup-log">
      <h4>Set {currentSet + 1} of {setsCount}</h4>
      <form
        className="training-pullup-log-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const addedWeight = Number((form.querySelector('[name="addedWeight"]') as HTMLInputElement)?.value) || 0;
          const reps = Number((form.querySelector('[name="reps"]') as HTMLInputElement)?.value) || 0;
          const quality = (form.querySelector('[name="quality"]') as HTMLSelectElement)?.value as typeof QUALITIES[number];
          handleSetSubmit(addedWeight, reps, quality);
        }}
      >
        <label>
          Added weight (lbs)
          <input type="number" name="addedWeight" min={0} className="training-form-group input" />
        </label>
        <label>
          Reps
          <input type="number" name="reps" min={0} className="training-form-group input" />
        </label>
        <label>
          Quality
          <select name="quality" className="training-form-group input">
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="training-timer-btn">
          {currentSet >= setsCount - 1 ? "Complete drill" : "Next set"}
        </button>
      </form>
    </div>
  );
}
