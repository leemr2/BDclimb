"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  playCountdownBeep,
  playStartBeep,
  playStopBeep,
} from "@/lib/audio/beep";

export type TimerPhase =
  | "idle"
  | "countdown"
  | "active"
  | "paused"
  | "complete";

export interface UseTimerOptions {
  /** Total seconds for main timer (countdown from this to 0). */
  durationSeconds: number;
  /** Pre-countdown seconds (3 = 3-2-1-GO). Set to 0 to skip. */
  preCountdownSeconds?: number;
  /** Whether to play audio cues. */
  useAudio?: boolean;
  /** Called on each pre-countdown tick (3, 2, 1). */
  onCountdownTick?: (value: number) => void;
  /** Called when main timer actually starts (after GO). */
  onStart?: () => void;
  /** Called when main timer reaches 0 (or is stopped). */
  onComplete?: () => void;
}

export interface UseTimerReturn {
  phase: TimerPhase;
  /** Pre-countdown value (3, 2, 1) when phase is "countdown". */
  countdownValue: number | null;
  /** Seconds remaining (countdown) or 0 when complete. */
  secondsRemaining: number;
  /** Start from idle (runs pre-countdown then main timer). */
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Stop early and mark complete (e.g. user stopped repeater). */
  stop: () => void;
}

export function useTimer(options: UseTimerOptions): UseTimerReturn {
  const {
    durationSeconds,
    preCountdownSeconds = 3,
    useAudio = true,
    onCountdownTick,
    onStart,
    onComplete,
  } = options;

  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [countdownValue, setCountdownValue] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearIntervalSafe = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearIntervalSafe();
    setPhase("complete");
    setSecondsRemaining(0);
    if (useAudio) playStopBeep();
    onCompleteRef.current?.();
  }, [clearIntervalSafe, useAudio]);

  const reset = useCallback(() => {
    clearIntervalSafe();
    setPhase("idle");
    setCountdownValue(null);
    setSecondsRemaining(durationSeconds);
  }, [clearIntervalSafe, durationSeconds]);

  const start = useCallback(() => {
    if (phase !== "idle" && phase !== "complete") return;
    reset();
    setPhase("countdown");
    setCountdownValue(preCountdownSeconds);

    if (preCountdownSeconds <= 0) {
      setPhase("active");
      if (useAudio) playStartBeep();
      onStart?.();
      let remaining = durationSeconds;
      setSecondsRemaining(remaining);
      intervalRef.current = setInterval(() => {
        remaining -= 1;
        setSecondsRemaining(remaining);
        if (remaining <= 0) {
          clearIntervalSafe();
          setPhase("complete");
          if (useAudio) playStopBeep();
          onCompleteRef.current?.();
        }
      }, 1000);
      return;
    }

    let count = preCountdownSeconds;
    const countdownInterval = setInterval(() => {
      count -= 1;
      setCountdownValue(count);
      if (useAudio) playCountdownBeep();
      onCountdownTick?.(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setPhase("active");
        setCountdownValue(null);
        if (useAudio) playStartBeep();
        onStart?.();
        let remaining = durationSeconds;
        setSecondsRemaining(remaining);
        intervalRef.current = setInterval(() => {
          remaining -= 1;
          setSecondsRemaining(remaining);
          if (remaining <= 0) {
            clearIntervalSafe();
            setPhase("complete");
            if (useAudio) playStopBeep();
            onCompleteRef.current?.();
          }
        }, 1000);
      }
    }, 1000);
  }, [
    phase,
    preCountdownSeconds,
    durationSeconds,
    useAudio,
    onCountdownTick,
    onStart,
    reset,
    clearIntervalSafe,
  ]);

  const pause = useCallback(() => {
    if (phase !== "active") return;
    clearIntervalSafe();
    setPhase("paused");
  }, [phase, clearIntervalSafe]);

  const resume = useCallback(() => {
    if (phase !== "paused") return;
    setPhase("active");
    const current = secondsRemaining;
    if (current <= 0) {
      setPhase("complete");
      onCompleteRef.current?.();
      return;
    }
    let remaining = current;
    intervalRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        clearIntervalSafe();
        setPhase("complete");
        if (useAudio) playStopBeep();
        onCompleteRef.current?.();
      }
    }, 1000);
  }, [phase, secondsRemaining, useAudio, clearIntervalSafe]);

  useEffect(() => () => clearIntervalSafe(), [clearIntervalSafe]);

  return {
    phase,
    countdownValue,
    secondsRemaining,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
