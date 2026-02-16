"use client";

import { useTimer } from "@/lib/hooks/training/useTimer";

export interface HangTimerProps {
  /** Hang duration in seconds (e.g. 7 or 10). */
  durationSeconds: number;
  /** Optional pre-countdown (3-2-1-GO). Default 3. */
  preCountdownSeconds?: number;
  useAudio?: boolean;
  /** e.g. "Set 1 of 6" */
  setLabel?: string;
  /** e.g. "Target: 162 lbs" */
  targetLabel?: string;
  onComplete: () => void;
}

export function HangTimer({
  durationSeconds,
  preCountdownSeconds = 3,
  useAudio = true,
  setLabel,
  targetLabel,
  onComplete,
}: HangTimerProps) {
  const {
    phase,
    countdownValue,
    secondsRemaining,
    start,
  } = useTimer({
    durationSeconds,
    preCountdownSeconds,
    useAudio,
    onComplete,
  });

  const rawValue =
    phase === "countdown" && countdownValue !== null
      ? countdownValue
      : phase === "active"
        ? secondsRemaining
        : phase === "complete"
          ? 0
          : durationSeconds;
  const displayValue = Number.isFinite(rawValue) ? rawValue : 0;

  const stateClass =
    phase === "countdown"
      ? "countdown"
      : phase === "active"
        ? "active"
        : phase === "complete"
          ? "complete"
          : "ready";

  return (
    <div className={`training-hang-timer training-hang-timer--${stateClass}`}>
      {(setLabel || targetLabel) && (
        <div className="training-hang-timer-meta">
          {setLabel && <span className="training-hang-timer-set">{setLabel}</span>}
          {targetLabel && (
            <span className="training-hang-timer-target">{targetLabel}</span>
          )}
        </div>
      )}
      <div className="training-hang-timer-display">
        {phase === "idle" && (
          <button
            type="button"
            className="training-hang-timer-start"
            onClick={start}
          >
            Start hang
          </button>
        )}
        {(phase === "countdown" || phase === "active") && (
          <span className="training-hang-timer-value">{displayValue}</span>
        )}
        {phase === "countdown" && (
          <span className="training-hang-timer-hint">Get on the edge</span>
        )}
        {phase === "active" && (
          <span className="training-hang-timer-hint">Hold</span>
        )}
        {phase === "complete" && (
          <span className="training-hang-timer-done">Done</span>
        )}
      </div>
    </div>
  );
}
