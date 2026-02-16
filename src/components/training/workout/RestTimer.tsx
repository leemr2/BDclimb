"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { playRestCompleteChime } from "@/lib/audio/beep";

export interface RestTimerProps {
  /** Rest duration in seconds. */
  durationSeconds: number;
  useAudio?: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  /** Optional text e.g. "Next: Set 2" */
  nextUpLabel?: string;
}

export function RestTimer({
  durationSeconds,
  useAudio = true,
  onComplete,
  onSkip,
  nextUpLabel,
}: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!isRunning) return;
    setSecondsLeft(durationSeconds);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          if (useAudio) playRestCompleteChime();
          onCompleteRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [durationSeconds, useAudio, isRunning]);

  const handleSkip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    onSkip?.();
    onCompleteRef.current?.();
  }, [onSkip]);

  return (
    <div className="training-rest-timer">
      <div className="training-rest-timer-display">
        <span className="training-rest-timer-value">{secondsLeft}</span>
        <span className="training-rest-timer-label">Rest</span>
      </div>
      {nextUpLabel && (
        <p className="training-rest-timer-next">{nextUpLabel}</p>
      )}
      <button
        type="button"
        className="training-rest-timer-skip"
        onClick={handleSkip}
      >
        Skip rest
      </button>
    </div>
  );
}
