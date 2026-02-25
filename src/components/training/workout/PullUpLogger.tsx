"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { PullUpData } from "@/lib/plans/bouldering/types";
import { NumberSlider } from "@/components/training/ui/NumberSlider";
import { RestTimer } from "./RestTimer";

const QUALITIES = ["clean", "ok", "struggle"] as const;

export type PullUpPartialSetData = {
  addedWeight: number;
  reps: number;
  quality: typeof QUALITIES[number];
  restMinutes: number;
};

export interface PullUpLoggerProps {
  drill: DrillDefinition;
  /** Set index to resume from (0-based) when resuming a partial drill. */
  initialSet?: number;
  /** Previously logged set data when resuming a partial drill. */
  initialSetData?: PullUpPartialSetData[];
  onComplete: (data: PullUpData) => void;
}

export function PullUpLogger({ drill, initialSet = 0, initialSetData, onComplete }: PullUpLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const setsCount = drill.sets ?? 5;
  const restSeconds = 180;

  const [currentSet, setCurrentSet] = useState(initialSet);
  const [phase, setPhase] = useState<"log" | "rest">("log");
  const [sets, setSets] = useState<
    Array<{ addedWeight: number; reps: number; quality: typeof QUALITIES[number]; restMinutes: number }>
  >(() =>
    Array.from({ length: setsCount }, (_, i) => ({
      addedWeight: initialSetData?.[i]?.addedWeight ?? 0,
      reps: initialSetData?.[i]?.reps ?? 0,
      quality: initialSetData?.[i]?.quality ?? "clean",
      restMinutes: initialSetData?.[i]?.restMinutes ?? 3,
    }))
  );

  // Controlled form state for the current set
  const [logWeight, setLogWeight] = useState(0);
  const [logReps, setLogReps] = useState(0);
  const [logQuality, setLogQuality] = useState<typeof QUALITIES[number]>("clean");

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
    setLogWeight(0);
    setLogReps(0);
    setLogQuality("clean");
    setPhase("log");
  }, []);

  // Records the current set with current form values, then quits to drill list.
  const handleQuit = useCallback(() => {
    const finalSets = [...sets];
    finalSets[currentSet] = { addedWeight: logWeight, reps: logReps, quality: logQuality, restMinutes: 3 };
    const completedCount = currentSet + 1;
    const partialData = {
      partialSets: finalSets.slice(0, completedCount),
      setsCompleted: completedCount,
    };
    dispatch({
      type: "QUIT_DRILL",
      payload: { drillIndex: currentDrillIndex, data: partialData as unknown as Record<string, unknown>, setsCompleted: completedCount },
    });
    const nextDrills = [...drills];
    nextDrills[currentDrillIndex] = {
      ...nextDrills[currentDrillIndex],
      partial: true,
      setsCompleted: completedCount,
      data: partialData as unknown as Record<string, unknown>,
    };
    persistDrills(nextDrills);
  }, [logWeight, logReps, logQuality, currentSet, sets, currentDrillIndex, dispatch, drills, persistDrills]);

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
      <div className="training-pullup-log-form">
        <NumberSlider
          label="Added weight (lbs)"
          value={logWeight}
          onChange={setLogWeight}
          min={0}
          max={150}
          step={2.5}
          unit="lbs"
        />
        <NumberSlider
          label="Reps completed"
          value={logReps}
          onChange={setLogReps}
          min={0}
          max={20}
          step={1}
          unit="reps"
        />
        <div style={{ marginBottom: "1rem" }}>
          <span className="training-form-group" style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", color: "rgba(255,255,255,0.7)" }}>Quality</span>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {QUALITIES.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setLogQuality(q)}
                className={`training-pullup-quality-btn${logQuality === q ? " active" : ""}`}
                style={{ flex: 1 }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="training-drill-btn-row">
          <button
            type="button"
            onClick={() => handleSetSubmit(logWeight, logReps, logQuality)}
            className="training-timer-btn"
          >
            {currentSet >= setsCount - 1 ? "Complete drill" : "Next set"}
          </button>
          {currentSet < setsCount - 1 && (
            <button
              type="button"
              onClick={handleQuit}
              className="training-timer-btn training-timer-btn--quit"
            >
              Quit drill
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
