"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  playCountdownBeep,
  playStartBeep,
  playStopBeep,
  playRestWarningBeep,
} from "@/lib/audio/beep";

const HANG_SECONDS = 7;
const REST_OPTIONS = [2, 3] as const;

export type RepeaterPhase =
  | "idle"
  | "countdown"
  | "hang"
  | "rest"
  | "complete";

export interface RepeaterTimerProps {
  restSeconds?: 2 | 3;
  useAudio?: boolean;
  onStop?: (totalReps: number, totalHangSeconds: number, restSeconds: number) => void;
}

export function RepeaterTimer({
  restSeconds: initialRest = 2,
  useAudio = true,
  onStop,
}: RepeaterTimerProps) {
  const [restChoice, setRestChoice] = useState<2 | 3>(initialRest);
  const [phase, setPhase] = useState<RepeaterPhase>("idle");
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [finalReps, setFinalReps] = useState(0);
  const [finalHangSeconds, setFinalHangSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const preCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (preCountdownRef.current) {
      clearInterval(preCountdownRef.current);
      preCountdownRef.current = null;
    }
  }, []);

  const runRestPhase = useCallback(() => {
    setPhase("rest");
    setPhaseSecondsLeft(restChoice);
    intervalRef.current = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev === 1 && useAudio) playRestWarningBeep();
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setPhase("hang");
          setPhaseSecondsLeft(HANG_SECONDS);
          setTotalReps((r) => r + 1);
          if (useAudio) playStartBeep();
          intervalRef.current = setInterval(runHangPhase, 1000);
          return HANG_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
  }, [restChoice, useAudio]);

  const runHangPhase = useCallback(() => {
    setPhaseSecondsLeft((prev) => {
      if (prev <= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (useAudio) playStopBeep();
        runRestPhase();
        return restChoice;
      }
      return prev - 1;
    });
  }, [restChoice, useAudio, runRestPhase]);

  const startCycle = useCallback(() => {
    setPhase("hang");
    setPhaseSecondsLeft(HANG_SECONDS);
    setTotalReps(1);
    if (useAudio) playStartBeep();
    intervalRef.current = setInterval(runHangPhase, 1000);
  }, [useAudio, runHangPhase]);

  const handleStart = useCallback(() => {
    if (phase !== "idle") return;
    setTotalReps(0);
    setPhase("countdown");
    setCountdownValue(3);
    let c = 3;
    preCountdownRef.current = setInterval(() => {
      c -= 1;
      setCountdownValue(c);
      if (useAudio) playCountdownBeep();
      if (c <= 0) {
        if (preCountdownRef.current) {
          clearInterval(preCountdownRef.current);
          preCountdownRef.current = null;
        }
        setCountdownValue(null);
        startCycle();
      }
    }, 1000);
  }, [phase, useAudio, startCycle]);

  const handleStop = useCallback(() => {
    clearAll();
    const reps = phase === "hang" ? totalReps + 1 : totalReps;
    const hangTotal = reps * HANG_SECONDS;
    setFinalReps(reps);
    setFinalHangSeconds(hangTotal);
    setPhase("complete");
    setShowSummary(true);
    onStop?.(reps, hangTotal, restChoice);
  }, [totalReps, phase, clearAll, onStop, restChoice]);

  useEffect(() => () => clearAll(), [clearAll]);

  if (showSummary) {
    return (
      <div className="training-repeater-summary">
        <h4 className="training-repeater-summary-title">Repeater complete</h4>
        <p className="training-repeater-summary-stats">
          {finalReps} reps · {finalHangSeconds}s total hang · {restChoice}s rest
        </p>
      </div>
    );
  }

  return (
    <div
      className={`training-repeater-timer training-repeater-timer--${
        phase === "hang" ? "hang" : phase === "rest" ? "rest" : phase === "countdown" ? "countdown" : "idle"
      }`}
    >
      {(phase === "hang" || phase === "rest") && (
        <div className="training-repeater-reps">Reps: {totalReps}</div>
      )}
      <div className="training-repeater-display">
        {phase === "idle" && (
          <>
            <label className="training-repeater-rest-label">
              Rest between hangs:
              <select
                className="training-repeater-rest-select"
                value={restChoice}
                onChange={(e) => setRestChoice(Number(e.target.value) as 2 | 3)}
                disabled={phase !== "idle"}
              >
                {REST_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} seconds
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="training-repeater-start"
              onClick={handleStart}
            >
              Start repeater
            </button>
          </>
        )}
        {phase === "countdown" && (
          <>
            <span className="training-repeater-value">{countdownValue}</span>
            <span className="training-repeater-hint">Get on the edge</span>
          </>
        )}
        {(phase === "hang" || phase === "rest") && (
          <>
            <span className="training-repeater-phase">
              {phase === "hang" ? "HANG" : "REST"}
            </span>
            <span className="training-repeater-value">{phaseSecondsLeft}</span>
            <button
              type="button"
              className="training-repeater-stop"
              onClick={handleStop}
            >
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
}
