"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { MaxHangData } from "@/lib/plans/bouldering/types";
import { HangTimer } from "./HangTimer";
import { RestTimer } from "./RestTimer";
import { SafetyInterrupt, type SafetyInterruptChoice } from "./SafetyInterrupt";

export interface MaxHangLoggerProps {
  drill: DrillDefinition;
  /** Target load in lbs/kg (e.g. from assessment). */
  targetLoad?: number;
  /** Hang duration in seconds (parsed from drill.reps). */
  hangSeconds?: number;
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
  onComplete,
}: MaxHangLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const totalSets = drill.sets ?? 6;
  const durationSeconds = propHangSeconds ?? parseDurationSeconds(drill.reps);
  const restSeconds = drill.restSeconds ?? 120;

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
        const reduced = Math.round(targetLoad * 0.9);
        setSetData((prev) => {
          const n = [...prev];
          n[currentSet] = { ...n[currentSet], actualLoad: reduced };
          return n;
        });
      }
      if (choice === "continue") {
        setAllowSubmitDespitePain(true);
      }
    },
    [currentSet, setData, totalSets, targetLoad, durationSeconds, pendingPain, finishDrill]
  );

  const handleRestComplete = useCallback(() => {
    setCurrentSet((s) => s + 1);
    setPhase("timer");
  }, []);

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

  return (
    <div className="training-max-hang-log">
      <h4 className="training-max-hang-log-set">
        Set {currentSet + 1} of {totalSets} — log result
      </h4>
      <form
        className="training-max-hang-log-form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const actualLoad = Number((form.querySelector('[name="actualLoad"]') as HTMLInputElement)?.value) || targetLoad;
          const heldClean = (form.querySelector('[name="heldClean"]') as HTMLInputElement)?.checked ?? true;
          const pain = Number((form.querySelector('[name="pain"]') as HTMLInputElement)?.value) ?? 0;
          const notes = (form.querySelector('[name="notes"]') as HTMLInputElement)?.value ?? "";
          handleLogSet(actualLoad, heldClean, pain, notes);
        }}
      >
        <label className="training-form-group">
          Actual load (lbs)
          <input
            type="number"
            name="actualLoad"
            defaultValue={targetLoad}
            min={0}
            step={1}
            className="training-form-group input"
          />
        </label>
        <label className="training-max-hang-held">
          <input type="checkbox" name="heldClean" defaultChecked />
          Held full duration clean
        </label>
        <label className="training-form-group">
          Pain (0–10)
          <input
            type="range"
            name="pain"
            min={0}
            max={10}
            defaultValue={0}
            className="training-form-group range"
          />
        </label>
        <label className="training-form-group">
          Notes
          <input type="text" name="notes" className="training-form-group input" />
        </label>
        <button type="submit" className="training-timer-btn">
          {currentSet >= totalSets - 1 ? "Complete drill" : "Next set"}
        </button>
      </form>
    </div>
  );
}
