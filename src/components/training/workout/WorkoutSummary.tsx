"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import { completeWorkout, type CompleteWorkoutInput, type SkinCondition } from "@/lib/firebase/training/bouldering-workouts";

export interface WorkoutSummaryProps {
  /** Duration in minutes (from workout start to now). */
  durationMinutes: number;
  onSaved?: () => void;
}

export function WorkoutSummary({ durationMinutes, onSaved }: WorkoutSummaryProps) {
  const router = useRouter();
  const { workoutId, userId } = useWorkout();
  const [rpe, setRpe] = useState(6);
  const [sessionQuality, setSessionQuality] = useState(3);
  const [fingerPainDuring, setFingerPainDuring] = useState(0);
  const [skinCondition, setSkinCondition] = useState<SkinCondition>("good");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const srpe = durationMinutes * rpe;

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
      };
      await completeWorkout(userId, workoutId, summary);
      onSaved?.();
      router.push("/training-center/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save workout");
    } finally {
      setSaving(false);
    }
  }, [userId, workoutId, rpe, sessionQuality, fingerPainDuring, skinCondition, notes, router, onSaved]);

  return (
    <div className="training-workout-summary">
      <h3 className="training-workout-summary-title">Workout complete</h3>
      <p className="training-workout-summary-duration">
        Duration: {durationMinutes} min · sRPE: {srpe} (duration × RPE)
      </p>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="training-workout-summary-form">
        <label className="training-form-group">
          Session RPE (0–10)
          <input
            type="range"
            min={0}
            max={10}
            value={rpe}
            onChange={(e) => setRpe(Number(e.target.value))}
            className="training-form-group range"
          />
          <span className="training-workout-summary-value">{rpe}</span>
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
          <input
            type="range"
            min={0}
            max={10}
            value={fingerPainDuring}
            onChange={(e) => setFingerPainDuring(Number(e.target.value))}
            className="training-form-group range"
          />
          <span className="training-workout-summary-value">{fingerPainDuring}</span>
        </label>

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
