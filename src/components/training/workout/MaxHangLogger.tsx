"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { MaxHangData } from "@/lib/plans/bouldering/types";
import { NumberSlider } from "@/components/training/ui/NumberSlider";
import { HangTimer } from "./HangTimer";
import { RestTimer } from "./RestTimer";
import { SafetyInterrupt, type SafetyInterruptChoice } from "./SafetyInterrupt";

export interface MaxHangLoggerProps {
  drill: DrillDefinition;
  /** Target load in lbs/kg (e.g. from assessment). */
  targetLoad?: number;
  /** Hang duration in seconds (parsed from drill.reps). */
  hangSeconds?: number;
  /** User's bodyweight from training profile. */
  bodyweight?: number;
  weightUnit?: "lbs" | "kg";
  onComplete: (data: MaxHangData) => void;
}

function parseDurationSeconds(reps: number | string | undefined): number {
  if (typeof reps === "number") return reps;
  if (typeof reps === "string") {
    const m = reps.match(/(\d+)\s*s/);
    return m ? parseInt(m[1], 10) : 10;
  }
  return 10;
}

export function MaxHangLogger({
  drill,
  targetLoad = 0,
  hangSeconds: propHangSeconds,
  bodyweight = 150,
  weightUnit = "lbs",
  onComplete,
}: MaxHangLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const totalSets = drill.sets ?? 6;
  const durationSeconds = propHangSeconds ?? parseDurationSeconds(drill.reps);
  const restSeconds = drill.restSeconds ?? 120;

  // Added weight for the current set (can be negative for assisted hangs)
  const defaultAddedWeight = Math.max(0, targetLoad - bodyweight);

  const [currentSet, setCurrentSet] = useState(0);
  const [phase, setPhase] = useState<"timer" | "log" | "rest">("timer");
  const [setData, setSetData] = useState<
    Array<{
      actualLoad: number;
      duration: number;
      heldClean: boolean;
      pain: number;
      notes: string;
    }>
  >(Array.from({ length: totalSets }, () => ({ actualLoad: targetLoad, duration: durationSeconds, heldClean: true, pain: 0, notes: "" })));
  const [showSafety, setShowSafety] = useState(false);
  const [pendingPain, setPendingPain] = useState(0);
  const [allowSubmitDespitePain, setAllowSubmitDespitePain] = useState(false);

  // Controlled log-form state (resets each set via handleRestComplete)
  // addedWeight is the belt/vest weight; actual load = bodyweight + addedWeight
  const [logAddedWeight, setLogAddedWeight] = useState(defaultAddedWeight);
  const [logHeldClean, setLogHeldClean] = useState(true);
  const [logPain, setLogPain] = useState(0);
  const [logNotes, setLogNotes] = useState("");

  const targetPercent = 87;

  const handleTimerComplete = useCallback(() => {
    setPhase("log");
  }, []);

  const handleLogSet = useCallback(
    (actualLoad: number, heldClean: boolean, pain: number, notes: string) => {
      if (pain > 2 && !allowSubmitDespitePain) {
        setPendingPain(pain);
        setShowSafety(true);
        return;
      }
      const next = [...setData];
      next[currentSet] = {
        actualLoad,
        duration: durationSeconds,
        heldClean,
        pain,
        notes,
      };
      setSetData(next);
      if (currentSet >= totalSets - 1) {
        finishDrill(next);
        return;
      }
      setPhase("rest");
    },
    [currentSet, setData, totalSets, durationSeconds, allowSubmitDespitePain]
  );

  const finishDrill = useCallback(
    (finalSets: typeof setData) => {
      const totalQualityReps = finalSets.filter((s) => s.heldClean && s.pain <= 2).length;
      const data: MaxHangData = {
        sets: finalSets.map((s) => ({
          targetLoad,
          actualLoad: s.actualLoad,
          targetPercent,
          duration: s.duration,
          heldClean: s.heldClean,
          pain: s.pain,
          restAfter: restSeconds,
          notes: s.notes,
        })),
        totalQualityReps,
        edgeSize: 20,
        gripType: "half_crimp",
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
    [currentDrillIndex, dispatch, drills, persistDrills, onComplete, targetLoad, restSeconds]
  );

  const handleSafetyChoice = useCallback(
    (choice: SafetyInterruptChoice) => {
      setShowSafety(false);
      if (choice === "skip_remaining") {
        const next = [...setData];
        for (let i = currentSet; i < totalSets; i++) {
          next[i] = next[i] ?? {
            actualLoad: targetLoad,
            duration: durationSeconds,
            heldClean: false,
            pain: pendingPain,
            notes: "Skipped (pain)",
          };
        }
        finishDrill(next);
        return;
      }
      if (choice === "reduce_load") {
        // Reduce total load by 10%; adjust the added weight accordingly
        const reducedTotal = Math.round(targetLoad * 0.9);
        setLogAddedWeight(reducedTotal - bodyweight);
      }
      if (choice === "continue") {
        setAllowSubmitDespitePain(true);
      }
    },
    [currentSet, setData, totalSets, targetLoad, durationSeconds, pendingPain, finishDrill]
  );

  const handleRestComplete = useCallback(() => {
    setCurrentSet((s) => s + 1);
    setLogAddedWeight(defaultAddedWeight);
    setLogHeldClean(true);
    setLogPain(0);
    setLogNotes("");
    setPhase("timer");
  }, [defaultAddedWeight]);

  if (phase === "rest") {
    return (
      <RestTimer
        durationSeconds={restSeconds}
        useAudio
        onComplete={handleRestComplete}
        nextUpLabel={`Next: Set ${currentSet + 2} of ${totalSets}`}
      />
    );
  }

  if (phase === "timer") {
    return (
      <>
        <HangTimer
          durationSeconds={durationSeconds}
          preCountdownSeconds={3}
          useAudio
          setLabel={`Set ${currentSet + 1} of ${totalSets}`}
          targetLabel={targetLoad > 0 ? `Target: ${targetLoad} lbs` : undefined}
          onComplete={handleTimerComplete}
        />
      </>
    );
  }

  if (showSafety) {
    return (
      <SafetyInterrupt
        title="Pain detected"
        message={`You reported pain at ${pendingPain}/10. The protocol says to stop finger loading if pain > 2/10.`}
        action="Choose how to proceed:"
        severity="yellow"
        onChoice={handleSafetyChoice}
      />
    );
  }

  const logLoad = bodyweight + logAddedWeight;

  return (
    <div className="training-max-hang-log">
      <h4 className="training-max-hang-log-set">
        Set {currentSet + 1} of {totalSets} — log result
      </h4>
      <div className="training-max-hang-log-form">
        <p className="training-assessment-info">
          <strong>Bodyweight:</strong> {bodyweight} {weightUnit}
        </p>
        <NumberSlider
          label="Added weight"
          value={logAddedWeight}
          onChange={setLogAddedWeight}
          min={-30}
          max={100}
          step={weightUnit === "lbs" ? 2.5 : 1}
          unit={weightUnit}
          hint={`Total load: ${logLoad} ${weightUnit}${targetLoad > 0 ? ` · Target: ${targetLoad} ${weightUnit}` : ""}`}
        />
        <label className="training-max-hang-held">
          <input
            type="checkbox"
            checked={logHeldClean}
            onChange={(e) => setLogHeldClean(e.target.checked)}
          />
          Held full duration clean
        </label>
        <label className="training-form-group">
          Pain (0–10) — current: {logPain}
          <input
            type="range"
            min={0}
            max={10}
            value={logPain}
            onChange={(e) => setLogPain(Number(e.target.value))}
            className="training-form-group range"
          />
        </label>
        <label className="training-form-group">
          Notes
          <input
            type="text"
            value={logNotes}
            onChange={(e) => setLogNotes(e.target.value)}
            className="training-form-group input"
          />
        </label>
        <button
          type="button"
          onClick={() => handleLogSet(logLoad, logHeldClean, logPain, logNotes)}
          className="training-timer-btn"
        >
          {currentSet >= totalSets - 1 ? "Complete drill" : "Next set"}
        </button>
      </div>
    </div>
  );
}
