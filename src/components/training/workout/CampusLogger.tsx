"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { CampusDrillData } from "@/lib/plans/bouldering/types";
import { RestTimer } from "./RestTimer";

const QUALITIES = ["clean", "ok", "struggle"] as const;
const POWER_FEEL = ["explosive", "good", "sluggish", "grinding"] as const;
const FORM_QUALITY = ["maintained", "slight_decline", "significant_decline"] as const;

export interface CampusLoggerProps {
  drill: DrillDefinition;
  onComplete: (data: CampusDrillData) => void;
}

export function CampusLogger({ drill, onComplete }: CampusLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const setsCount = drill.sets ?? 4;
  const restSeconds = 180;

  const [currentSet, setCurrentSet] = useState(0);
  const [phase, setPhase] = useState<"log" | "rest">("log");
  const [sets, setSets] = useState<
    Array<{ result: string; quality: typeof QUALITIES[number]; restMinutes: number; notes: string }>
  >(Array.from({ length: setsCount }, () => ({ result: "", quality: "clean", restMinutes: 3, notes: "" })));
  const [overallPowerFeel, setOverallPowerFeel] = useState<typeof POWER_FEEL[number]>("good");
  const [formQuality, setFormQuality] = useState<typeof FORM_QUALITY[number]>("maintained");

  const handleSetSubmit = useCallback(
    (result: string, quality: typeof QUALITIES[number], notes: string) => {
      setSets((prev) => {
        const next = [...prev];
        next[currentSet] = { ...next[currentSet], result, quality, restMinutes: 3, notes };
        return next;
      });
      if (currentSet >= setsCount - 1) {
        const finalSets = [...sets];
        finalSets[currentSet] = { result, quality, restMinutes: 3, notes };
        const data: CampusDrillData = {
          exercise: drill.name,
          sets: finalSets,
          overallPowerFeel,
          formQuality,
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
        return;
      }
      setPhase("rest");
    },
    [currentSet, sets, setsCount, overallPowerFeel, formQuality, currentDrillIndex, dispatch, drills, persistDrills, onComplete, drill.name]
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
    <div className="training-campus-log">
      <h4>Set {currentSet + 1} of {setsCount}</h4>
      <form
        className="training-campus-log-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const result = (form.querySelector('[name="result"]') as HTMLInputElement)?.value ?? "";
          const quality = (form.querySelector('[name="quality"]') as HTMLSelectElement)?.value as typeof QUALITIES[number];
          const notes = (form.querySelector('[name="notes"]') as HTMLInputElement)?.value ?? "";
          handleSetSubmit(result, quality, notes);
        }}
      >
        <label>
          Result (rung or moves)
          <input type="text" name="result" className="training-form-group input" required />
        </label>
        <label>
          Quality
          <select name="quality" className="training-form-group input">
            {QUALITIES.map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>
        </label>
        <label>
          Notes
          <input type="text" name="notes" className="training-form-group input" />
        </label>
        {currentSet === setsCount - 1 && (
          <>
            <label>
              Overall power feel
              <select
                value={overallPowerFeel}
                onChange={(e) => setOverallPowerFeel(e.target.value as typeof POWER_FEEL[number])}
                className="training-form-group input"
              >
                {POWER_FEEL.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
            <label>
              Form quality
              <select
                value={formQuality}
                onChange={(e) => setFormQuality(e.target.value as typeof FORM_QUALITY[number])}
                className="training-form-group input"
              >
                {FORM_QUALITY.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </label>
          </>
        )}
        <button type="submit" className="training-timer-btn">
          {currentSet >= setsCount - 1 ? "Complete drill" : "Next set"}
        </button>
      </form>
    </div>
  );
}
