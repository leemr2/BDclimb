"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, ThresholdIntervalsData } from "@/lib/plans/power-endurance/types";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface ThresholdIntervalsLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: ThresholdIntervalsData) => void;
}

type SetDraft = ThresholdIntervalsData["sets"][number];

export function ThresholdIntervalsLogger({ drill, onComplete }: ThresholdIntervalsLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const setCount = drill.sets ?? 3;
  const workMinutes = 4;

  const [setIndex, setSetIndex] = useState(0);
  const [sets, setSets] = useState<SetDraft[]>([]);
  const [draft, setDraft] = useState<SetDraft>({
    workTimeMinutes: workMinutes,
    terrainRoute: "",
    intensityRPE: 8,
    pumpLevel: 7,
    completed: true,
    restAfterMinutes: 5,
    notes: "",
  });
  const [pacingConsistency, setPacingConsistency] =
    useState<ThresholdIntervalsData["pacingConsistency"]>("good");

  const handleLogSet = () => {
    const nextSets = [...sets, draft];
    if (setIndex + 1 >= setCount) {
      const data: ThresholdIntervalsData = {
        sets: nextSets,
        totalSetsCompleted: nextSets.filter((s) => s.completed).length,
        pacingConsistency,
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
    setSets(nextSets);
    setSetIndex((i) => i + 1);
    setDraft({
      workTimeMinutes: workMinutes,
      terrainRoute: "",
      intensityRPE: 8,
      pumpLevel: 7,
      completed: true,
      restAfterMinutes: 5,
      notes: "",
    });
  };

  return (
    <div className="training-threshold-log">
      <h4 className="training-threshold-log-title">
        {drill.name} — Effort {setIndex + 1} of {setCount}
      </h4>
      <p className="training-threshold-log-hint">
        Sustained hard climbing · ~{workMinutes} min per effort
      </p>

      <label>
        Route / terrain
        <input
          type="text"
          value={draft.terrainRoute}
          onChange={(e) => setDraft((d) => ({ ...d, terrainRoute: e.target.value }))}
          className="training-form-group input"
        />
      </label>
      <NumberSlider
        label="Work time (minutes)"
        value={draft.workTimeMinutes}
        onChange={(v) => setDraft((d) => ({ ...d, workTimeMinutes: v }))}
        min={2}
        max={15}
      />
      <NumberSlider
        label="Intensity RPE"
        value={draft.intensityRPE}
        onChange={(v) => setDraft((d) => ({ ...d, intensityRPE: v }))}
        min={6}
        max={10}
      />
      <NumberSlider
        label="Pump level"
        value={draft.pumpLevel}
        onChange={(v) => setDraft((d) => ({ ...d, pumpLevel: v }))}
        min={1}
        max={10}
      />
      <label>
        <input
          type="checkbox"
          checked={draft.completed}
          onChange={(e) => setDraft((d) => ({ ...d, completed: e.target.checked }))}
        />
        {" "}Completed effort
      </label>
      <label>
        Notes
        <input
          type="text"
          value={draft.notes}
          onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
          className="training-form-group input"
        />
      </label>

      {setIndex + 1 >= setCount && (
        <label>
          Pacing consistency
          <select
            value={pacingConsistency}
            onChange={(e) =>
              setPacingConsistency(e.target.value as ThresholdIntervalsData["pacingConsistency"])
            }
            className="training-form-group input"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="inconsistent">Inconsistent</option>
            <option value="poor">Poor</option>
          </select>
        </label>
      )}

      <button type="button" className="training-timer-btn" onClick={handleLogSet}>
        {setIndex + 1 >= setCount ? "Complete drill" : "Log effort & rest"}
      </button>
    </div>
  );
}
