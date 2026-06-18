"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  completeWorkout as completeBoulderingWorkout,
  getCompletedSessionLabelsForWeek as getBoulderingCompletedLabels,
  type CompleteWorkoutInput,
  type SkinCondition,
} from "@/lib/firebase/training/bouldering-workouts";
import {
  completeWorkout as completePEWorkout,
  getCompletedSessionLabelsForWeek as getPECompletedLabels,
} from "@/lib/firebase/training/power-endurance-workouts";
import { advanceProgramWeekIfComplete } from "@/lib/firebase/training/program";

export interface WorkoutSummaryProps {
  durationMinutes: number;
  onSaved?: () => void;
}

export function WorkoutSummary({ durationMinutes, onSaved }: WorkoutSummaryProps) {
  const router = useRouter();
  const { workoutId, userId, programId, workoutWeek, goalType } = useWorkout();
  const { program } = useActiveProgram();
  const [duration, setDuration] = useState(durationMinutes);
  const [rpe, setRpe] = useState(6);
  const [sessionQuality, setSessionQuality] = useState(3);
  const [fingerPainDuring, setFingerPainDuring] = useState(0);
  const [shoulderSymptomScore, setShoulderSymptomScore] = useState(0);
  const [skinCondition, setSkinCondition] = useState<SkinCondition>("good");
  const [notes, setNotes] = useState("");

  const isPE = goalType === "route_power_endurance";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const srpe = duration * rpe;

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const summary: CompleteWorkoutInput = {
        rpe,
        sessionQuality,
        fingerPainDuring,
        skinCondition,
        notes: notes || undefined,
        durationMinutes: Number.isNaN(duration) ? 0 : duration,
        ...(isPE ? { shoulderSymptomScore } : {}),
      };
      const completeWorkout = isPE ? completePEWorkout : completeBoulderingWorkout;
      const getCompletedLabels = isPE ? getPECompletedLabels : getBoulderingCompletedLabels;

      await completeWorkout(userId, workoutId, summary);

      if (program && programId && workoutWeek > 0) {
        const completedLabels = await getCompletedLabels(userId, programId, workoutWeek);
        await advanceProgramWeekIfComplete(userId, program, workoutWeek, completedLabels);
      }

      onSaved?.();
      router.push("/training-center");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }, [
    userId,
    workoutId,
    programId,
    workoutWeek,
    program,
    goalType,
    isPE,
    duration,
    rpe,
    sessionQuality,
    fingerPainDuring,
    shoulderSymptomScore,
    skinCondition,
    notes,
    router,
    onSaved,
  ]);

  return (
    <div className="training-workout-summary">
      <h3 className="training-workout-summary-title">Workout complete</h3>
      <p className="training-workout-summary-duration">
        sRPE: {srpe} (duration × RPE)
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="training-workout-summary-form">
        <label className="training-form-group">
          Duration (minutes)
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={Number.isNaN(duration) ? "" : duration}
            onChange={(e) => {
              const next = e.target.value === "" ? NaN : Number(e.target.value);
              setDuration(Number.isNaN(next) ? NaN : Math.max(0, Math.round(next)));
            }}
            onBlur={() => {
              if (Number.isNaN(duration)) setDuration(0);
            }}
            className="training-form-group input"
          />
          <span className="training-form-hint">
            Auto-filled from your session timer. Adjust if you split the session,
            forgot to start the timer, or the app reloaded mid-workout.
          </span>
        </label>

        <label className="training-form-group">
          Session RPE – Rate of Perceived Exertion (0–10)
          <span className="training-workout-summary-value">{rpe}</span>
          <input
            type="range"
            min={0}
            max={10}
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            className="training-form-group range"
          />
        </label>

        <label className="training-form-group">
          Session quality (1–5)
          <div className="training-workout-summary-quality">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`training-workout-summary-quality-btn ${sessionQuality === n ? "active" : ""}`}
                onClick={() => setSessionQuality(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </label>

        <label className="training-form-group">
          Finger pain during session (0–10)
          <span className="training-workout-summary-value">{fingerPainDuring}</span>
          <input
            type="range"
            min={0}
            max={10}
            value={fingerPainDuring}
            onChange={(e) => setFingerPainDuring(Number(e.target.value))}
            className="training-form-group range"
          />
        </label>

        {isPE && (
          <label className="training-form-group">
            Shoulder symptom score (0–10)
            <span className="training-workout-summary-value">
              {shoulderSymptomScore}
            </span>
            <input
              type="range"
              min={0}
              max={10}
              value={shoulderSymptomScore}
              onChange={(e) => setShoulderSymptomScore(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        )}

        <label className="training-form-group">
          Skin condition
          <select
            value={skinCondition}
            onChange={(e) => setSkinCondition(e.target.value as SkinCondition)}
            className="training-form-group input"
          >
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </label>

        <label className="training-form-group">
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="training-form-group input"
            rows={3}
          />
        </label>

        {error && <p className="error-message">{error}</p>}

        <button
          type="submit"
          className="training-timer-btn training-workout-summary-save"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save workout"}
        </button>
      </form>
    </div>
  );
}
