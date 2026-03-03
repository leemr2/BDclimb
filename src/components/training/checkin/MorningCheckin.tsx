"use client";

import { useState } from "react";
import Link from "next/link";
import { createOrUpdateCheckin } from "@/lib/firebase/training/daily-checkins";
import type { DailyCheckinInput } from "@/lib/firebase/training/daily-checkins";

const SORENESS_OPTIONS = [
  "fingers",
  "elbows",
  "shoulders",
  "back",
  "legs",
] as const;

export interface MorningCheckinProps {
  userId: string;
  onSuccess?: () => void;
  /** Pre-fill from existing check-in (e.g. when editing today's). */
  initial?: Partial<DailyCheckinInput>;
}

export function MorningCheckin({
  userId,
  onSuccess,
  initial,
}: MorningCheckinProps) {
  const [fingerStiffness, setFingerStiffness] = useState(
    initial?.fingerStiffness ?? 0
  );
  const [fingerPain, setFingerPain] = useState(initial?.fingerPain ?? 0);
  const [energyLevel, setEnergyLevel] = useState(
    initial?.energyLevel ?? 3
  );
  const [sleepQuality, setSleepQuality] = useState(
    initial?.sleepQuality ?? 3
  );
  const [sleepHours, setSleepHours] = useState(initial?.sleepHours ?? 7);
  const [motivation, setMotivation] = useState(
    initial?.motivation ?? 3
  );
  const [sorenessLocations, setSorenessLocations] = useState<string[]>(
    initial?.sorenessLocations ?? []
  );
  const [readinessForTraining, setReadinessForTraining] = useState(
    initial?.readinessForTraining ?? 3
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSoreness = (loc: string) => {
    setSorenessLocations((prev) =>
      prev.includes(loc) ? prev.filter((x) => x !== loc) : [...prev, loc]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createOrUpdateCheckin(userId, {
        fingerStiffness,
        fingerPain,
        energyLevel,
        sleepQuality,
        sleepHours,
        motivation,
        sorenessLocations,
        readinessForTraining,
        notes,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="training-checkin-form-wrap">
      <p className="training-checkin-intro">
        Quick daily check: fingers, energy, and sleep. This helps the program
        flag recovery issues and adjust load.
      </p>
      <form onSubmit={handleSubmit} className="training-checkin-form">
        <div className="training-form-group">
          <label>
            Finger stiffness (0–10) — {fingerStiffness}
            <input
              type="range"
              min={0}
              max={10}
              value={fingerStiffness}
              onChange={(e) => setFingerStiffness(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Finger pain (0–10) — {fingerPain}
            <input
              type="range"
              min={0}
              max={10}
              value={fingerPain}
              onChange={(e) => setFingerPain(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Energy level (1–5) — {energyLevel}
            <input
              type="range"
              min={1}
              max={5}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Sleep quality (1–5) — {sleepQuality}
            <input
              type="range"
              min={1}
              max={5}
              value={sleepQuality}
              onChange={(e) => setSleepQuality(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Sleep hours
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="training-form-group input"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Motivation (1–5) — {motivation}
            <input
              type="range"
              min={1}
              max={5}
              value={motivation}
              onChange={(e) => setMotivation(Number(e.target.value))}
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <span className="training-form-label">Soreness (select any)</span>
          <div className="training-checkin-checkboxes">
            {SORENESS_OPTIONS.map((loc) => (
              <label key={loc} className="training-checkin-check">
                <input
                  type="checkbox"
                  checked={sorenessLocations.includes(loc)}
                  onChange={() => toggleSoreness(loc)}
                />
                {loc}
              </label>
            ))}
          </div>
        </div>
        <div className="training-form-group">
          <label>
            Readiness for training (1–5) — {readinessForTraining}
            <input
              type="range"
              min={1}
              max={5}
              value={readinessForTraining}
              onChange={(e) =>
                setReadinessForTraining(Number(e.target.value))
              }
              className="training-form-group range"
            />
          </label>
        </div>
        <div className="training-form-group">
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="training-form-group input"
              rows={2}
              placeholder="Optional"
            />
          </label>
        </div>
        {error && (
          <p className="training-checkin-error" role="alert">
            {error}
          </p>
        )}
        <div className="training-checkin-actions">
          <Link
            href="/training-center"
            className="training-center-cta training-btn-secondary"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="training-center-cta"
          >
            {submitting ? "Saving…" : "Save check-in"}
          </button>
        </div>
      </form>
    </div>
  );
}
