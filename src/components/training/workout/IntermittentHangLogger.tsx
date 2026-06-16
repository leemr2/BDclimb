"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type {
  PEDrillDefinition,
  IntermittentHangData,
} from "@/lib/plans/power-endurance/types";
import { buildIntermittentHangData } from "@/lib/plans/power-endurance/calculations";
import { RepeaterTimer } from "./RepeaterTimer";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface IntermittentHangLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: IntermittentHangData) => void;
}

const STOPPING_REASONS: {
  value: IntermittentHangData["sets"][number]["stoppingReason"];
  label: string;
}[] = [
  { value: "target_reached", label: "Target reps reached" },
  { value: "force_drop", label: "Force drop (>10%)" },
  { value: "form_fail", label: "Form failure" },
  { value: "pain", label: "Pain" },
];

type SetDraft = IntermittentHangData["sets"][number];

export function IntermittentHangLogger({ drill, onComplete }: IntermittentHangLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills, iheWorkingLoad, maxHangReference, weightUnit } =
    useWorkout();
  const setCount = drill.sets ?? 3;
  const workingLoad = iheWorkingLoad || Math.round(maxHangReference * 0.6);
  const protocol: IntermittentHangData["protocol"] = "7on_3off";

  const [setIndex, setSetIndex] = useState(0);
  const [completedSets, setCompletedSets] = useState<SetDraft[]>([]);
  const [timerKey, setTimerKey] = useState(0);
  const [timerState, setTimerState] = useState<"ready" | "log">("ready");
  const [pendingReps, setPendingReps] = useState(0);
  const [stoppingReason, setStoppingReason] =
    useState<IntermittentHangData["sets"][number]["stoppingReason"]>("force_drop");
  const [forceQuality, setForceQuality] = useState(7);
  const [actualLoad, setActualLoad] = useState(workingLoad);

  const handleTimerStop = (reps: number) => {
    setPendingReps(reps);
    setStoppingReason("force_drop");
    setForceQuality(7);
    setTimerState("log");
  };

  const handleLogSet = () => {
    if (pendingReps <= 0) return;
    const set: SetDraft = {
      targetLoad: workingLoad,
      actualLoad,
      repsCompleted: pendingReps,
      stoppingReason,
      forceQuality,
      restAfterMinutes: 3,
    };
    const nextSets = [...completedSets, set];
    if (setIndex + 1 >= setCount) {
      const data = buildIntermittentHangData(
        maxHangReference || workingLoad / 0.6,
        protocol,
        nextSets
      );
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
    setCompletedSets(nextSets);
    setSetIndex((i) => i + 1);
    setTimerState("ready");
    setPendingReps(0);
    setTimerKey((k) => k + 1);
  };

  return (
    <div className="training-ihe-log">
      <h4 className="training-ihe-log-title">
        {drill.name} — Set {setIndex + 1} of {setCount}
      </h4>
      <p className="training-ihe-log-hint">
        Working load: {workingLoad} {weightUnit} (60% of max) · 7s on / 3s off
      </p>

      {timerState === "ready" ? (
        <RepeaterTimer
          key={timerKey}
          restSeconds={3}
          showSummaryOnStop={false}
          showRestSelector={false}
          startLabel="Start IHE set"
          onStop={handleTimerStop}
        />
      ) : (
        <div className="training-form-group">
          <p className="training-ihe-log-stats">Reps completed: {pendingReps}</p>
          <label>
            Actual load ({weightUnit})
            <input
              type="number"
              value={actualLoad}
              onChange={(e) => setActualLoad(Number(e.target.value))}
              className="training-form-group input"
            />
          </label>
          <label>
            Stopping reason
            <select
              value={stoppingReason}
              onChange={(e) =>
                setStoppingReason(
                  e.target.value as IntermittentHangData["sets"][number]["stoppingReason"]
                )
              }
              className="training-form-group input"
            >
              {STOPPING_REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <NumberSlider
            label="Force quality"
            value={forceQuality}
            onChange={setForceQuality}
            min={1}
            max={10}
          />
          <button type="button" className="training-timer-btn" onClick={handleLogSet}>
            {setIndex + 1 >= setCount ? "Complete drill" : "Log set & continue"}
          </button>
        </div>
      )}
    </div>
  );
}
