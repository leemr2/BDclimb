"use client";

import { useTimer, type TimerPhase } from "@/lib/hooks/training/useTimer";

export interface TimerProps {
  /** Duration in seconds for the main countdown. */
  durationSeconds: number;
  /** Pre-countdown (3-2-1). Default 3. Set 0 to skip. */
  preCountdownSeconds?: number;
  useAudio?: boolean;
  onComplete?: () => void;
  onStart?: () => void;
  /** Optional label above the digits (e.g. "Set 1"). */
  label?: string;
}

export function Timer({
  durationSeconds,
  preCountdownSeconds = 3,
  useAudio = true,
  onComplete,
  onStart,
  label,
}: TimerProps) {
  const {
    phase,
    countdownValue,
    secondsRemaining,
    start,
    pause,
    resume,
    reset,
  } = useTimer({
    durationSeconds,
    preCountdownSeconds,
    useAudio,
    onStart,
    onComplete,
  });

  const displayValue =
    phase === "countdown" && countdownValue !== null
      ? countdownValue
      : phase === "active" || phase === "paused"
        ? secondsRemaining
        : phase === "complete"
          ? 0
          : durationSeconds;

  const stateClass = getStateClass(phase, countdownValue);

  return (
    <div className={`training-timer training-timer--${stateClass}`}>
      {label && <div className="training-timer-label">{label}</div>}
      <div className="training-timer-display" data-phase={phase}>
        {phase === "idle" && (
          <span className="training-timer-value">{durationSeconds}</span>
        )}
        {(phase === "countdown" || phase === "active" || phase === "paused") && (
          <span className="training-timer-value training-timer-value--pulse">
            {displayValue}
          </span>
        )}
        {phase === "complete" && (
          <span className="training-timer-value">0</span>
        )}
      </div>
      <div className="training-timer-actions">
        {phase === "idle" && (
          <button type="button" className="training-timer-btn" onClick={start}>
            Start
          </button>
        )}
        {phase === "countdown" && (
          <span className="training-timer-status">Get ready…</span>
        )}
        {phase === "active" && (
          <button type="button" className="training-timer-btn" onClick={pause}>
            Pause
          </button>
        )}
        {phase === "paused" && (
          <>
            <button type="button" className="training-timer-btn" onClick={resume}>
              Resume
            </button>
            <button type="button" className="training-timer-btn" onClick={reset}>
              Reset
            </button>
          </>
        )}
        {phase === "complete" && (
          <button type="button" className="training-timer-btn" onClick={reset}>
            Again
          </button>
        )}
      </div>
    </div>
  );
}

function getStateClass(
  phase: TimerPhase,
  countdownValue: number | null
): string {
  if (phase === "countdown") return "countdown";
  if (phase === "active" || phase === "paused") return "active";
  if (phase === "complete") return "complete";
  return "ready";
}
