"use client";

import { useState, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, ARCClimbingData } from "@/lib/plans/power-endurance/types";
import { buildARCClimbingData } from "@/lib/plans/power-endurance/calculations";
import { NumberSlider } from "@/components/training/ui/NumberSlider";
import { useTimer } from "@/lib/hooks/training/useTimer";

export interface ARCClimbingLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: ARCClimbingData) => void;
}

type SetDraft = ARCClimbingData["sets"][number];

/** Derive per-set duration (minutes) from a drill's `reps` field (e.g. "8 min"). */
function parseDurationMinutes(reps: number | string | undefined, fallback = 15): number {
  if (typeof reps === "number") return reps;
  if (typeof reps === "string") {
    const match = reps.match(/\d+(\.\d+)?/);
    if (match) {
      const value = Number(match[0]);
      if (Number.isFinite(value) && value > 0) return value;
    }
  }
  return fallback;
}

/** Parse a prescribed RPE range from a drill's `intensity` field (e.g. "RPE 6-7"). */
function parseRPERange(
  intensity: string | undefined,
  fallback: { min: number; max: number } = { min: 4, max: 6 }
): { min: number; max: number } {
  if (typeof intensity === "string") {
    const range = intensity.match(/RPE\s*(\d+)\s*[-–]\s*(\d+)/i);
    if (range) {
      const min = Number(range[1]);
      const max = Number(range[2]);
      if (Number.isFinite(min) && Number.isFinite(max) && min <= max) return { min, max };
    }
    const single = intensity.match(/RPE\s*(\d+)/i);
    if (single) {
      const value = Number(single[1]);
      if (Number.isFinite(value)) return { min: value, max: value };
    }
  }
  return fallback;
}

const TERRAIN_STYLES = ["traversing", "circuits", "up-down"] as const;
const BREATHING = ["easy", "moderate", "hard"] as const;
const MOVEMENT_QUALITY = ["smooth_relaxed", "good", "ok", "tense_inefficient"] as const;

export function ARCClimbingLogger({ drill, onComplete }: ARCClimbingLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const setCount = drill.sets ?? 2;
  const durationMinutes = parseDurationMinutes(drill.reps);

  // Prescribed intensity drives the RPE label/options and pump guidance so the
  // same logger adapts to both ARC (RPE 4-6) and long-interval (RPE 6-7) drills.
  const rpe = parseRPERange(drill.intensity);
  const rpeOptions = Array.from({ length: rpe.max - rpe.min + 1 }, (_, i) => rpe.min + i);
  const pumpLow = Math.max(1, rpe.min - 1);
  const pumpHigh = Math.max(pumpLow, rpe.max - 1);
  const pumpWarningThreshold = Math.min(10, rpe.max + 1);

  const [setIndex, setSetIndex] = useState(0);
  const [sets, setSets] = useState<SetDraft[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [movementQuality, setMovementQuality] =
    useState<ARCClimbingData["movementQuality"]>("good");

  const [draft, setDraft] = useState<SetDraft>({
    durationMinutes,
    terrainStyle: "circuits",
    targetRPE: rpe.min,
    actualRPE: rpe.min,
    pumpLevel: pumpLow,
    breathing: "easy",
    silentFootSlips: 0,
    fluencyStops: 0,
    fluencyStopLocations: "",
    restAfterMinutes: 5,
  });

  const { secondsRemaining, start, pause, reset } = useTimer({
    durationSeconds: durationMinutes * 60,
    preCountdownSeconds: 0,
  });

  useEffect(() => {
    if (timerRunning && secondsRemaining === 0) {
      setTimerRunning(false);
      pause();
    }
  }, [secondsRemaining, timerRunning, pause]);

  const pumpWarning = draft.pumpLevel >= pumpWarningThreshold;

  const handleStartTimer = () => {
    reset();
    start();
    setTimerRunning(true);
  };

  const handleLogSet = () => {
    const nextSets = [...sets, draft];
    if (setIndex + 1 >= setCount) {
      const data = buildARCClimbingData(
        nextSets,
        { silentFeet: true, fluency: true },
        movementQuality
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
    setSets(nextSets);
    setSetIndex((i) => i + 1);
    setDraft({
      durationMinutes,
      terrainStyle: "circuits",
      targetRPE: rpe.min,
      actualRPE: rpe.min,
      pumpLevel: pumpLow,
      breathing: "easy",
      silentFootSlips: 0,
      fluencyStops: 0,
      fluencyStopLocations: "",
      restAfterMinutes: 5,
    });
    setTimerRunning(false);
    reset();
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="training-arc-log">
      <h4 className="training-arc-log-title">
        {drill.name} — Set {setIndex + 1} of {setCount}
      </h4>
      <p className="training-arc-log-hint">
        Target: {durationMinutes} min · RPE {rpe.min}–{rpe.max} · Silent feet + Fluency
      </p>

      <div className="training-arc-log-timer">
        <span>{formatTime(secondsRemaining)}</span> / {formatTime(durationMinutes * 60)}
        {!timerRunning && (
          <button type="button" className="training-timer-btn" onClick={handleStartTimer}>
            Start set timer
          </button>
        )}
      </div>

      <div className="training-arc-log-constraints">
        <p className="training-arc-log-hint">Constraints active</p>
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => setDraft((d) => ({ ...d, silentFootSlips: d.silentFootSlips + 1 }))}
        >
          + Slip ({draft.silentFootSlips})
        </button>
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => setDraft((d) => ({ ...d, fluencyStops: d.fluencyStops + 1 }))}
        >
          + Stop &gt;2s ({draft.fluencyStops})
        </button>
        <label>
          Where did stops occur?
          <input
            type="text"
            value={draft.fluencyStopLocations}
            onChange={(e) => setDraft((d) => ({ ...d, fluencyStopLocations: e.target.value }))}
            className="training-form-group input"
          />
        </label>
      </div>

      <NumberSlider
        label="Current pump"
        value={draft.pumpLevel}
        onChange={(v) => setDraft((d) => ({ ...d, pumpLevel: v }))}
        min={1}
        max={10}
        hint={`Should stay ${pumpLow}–${pumpHigh} at RPE ${rpe.min}–${rpe.max}`}
      />

      {pumpWarning && (
        <p className="training-arc-log-warning">
          Pump {pumpWarningThreshold}+/10 is too high for this drill. Back off — stay at RPE{" "}
          {rpe.min}–{rpe.max}.
        </p>
      )}

      <div className="training-form-group">
        <label>
          Actual RPE
          <select
            value={draft.actualRPE}
            onChange={(e) => setDraft((d) => ({ ...d, actualRPE: Number(e.target.value) }))}
            className="training-form-group input"
          >
            {rpeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Terrain
          <select
            value={draft.terrainStyle}
            onChange={(e) => setDraft((d) => ({ ...d, terrainStyle: e.target.value }))}
            className="training-form-group input"
          >
            {TERRAIN_STYLES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label>
          Breathing
          <select
            value={draft.breathing}
            onChange={(e) =>
              setDraft((d) => ({ ...d, breathing: e.target.value as SetDraft["breathing"] }))
            }
            className="training-form-group input"
          >
            {BREATHING.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>
      </div>

      {setIndex + 1 >= setCount && (
        <div className="training-form-group">
          <label>
            Movement quality
            <select
              value={movementQuality}
              onChange={(e) =>
                setMovementQuality(e.target.value as ARCClimbingData["movementQuality"])
              }
              className="training-form-group input"
            >
              {MOVEMENT_QUALITY.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <button type="button" className="training-timer-btn" onClick={handleLogSet}>
        {setIndex + 1 >= setCount ? "Complete drill" : `Done with set ${setIndex + 1}`}
      </button>
    </div>
  );
}
