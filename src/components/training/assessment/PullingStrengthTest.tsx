"use client";

import { useState } from "react";
import type { PullingStrengthAssessment, PullingStrengthAttempt } from "@/lib/plans/bouldering/types";

interface PullingStrengthTestProps {
  weightUnit: "lbs" | "kg";
  onComplete: (data: PullingStrengthAssessment) => void;
  onSkip: () => void;
  onBack?: () => void;
}

type Quality = "clean" | "ok" | "struggle";

const QUALITY_OPTIONS: Array<{ id: Quality; label: string }> = [
  { id: "clean", label: "Clean" },
  { id: "ok", label: "OK" },
  { id: "struggle", label: "Struggle" },
];

interface AttemptDraft {
  addedWeight: string;
  repsCompleted: string;
  quality: Quality;
}

const emptyAttempt = (): AttemptDraft => ({ addedWeight: "", repsCompleted: "", quality: "clean" });

export function PullingStrengthTest({ weightUnit, onComplete, onSkip, onBack }: PullingStrengthTestProps) {
  const [step, setStep] = useState<"intro" | "form">("intro");
  const [attempts, setAttempts] = useState<AttemptDraft[]>([emptyAttempt(), emptyAttempt(), emptyAttempt()]);

  const updateAttempt = (index: number, field: keyof AttemptDraft, value: string | Quality) => {
    setAttempts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Derive best set: highest weight among attempts with reps recorded, break ties by reps
  const validAttempts = attempts.filter(
    (a) => a.addedWeight !== "" && a.repsCompleted !== ""
  );

  const bestAttempt = validAttempts.reduce<AttemptDraft | null>((best, curr) => {
    if (!best) return curr;
    const currWeight = parseFloat(curr.addedWeight);
    const bestWeight = parseFloat(best.addedWeight);
    if (currWeight > bestWeight) return curr;
    if (currWeight === bestWeight && parseInt(curr.repsCompleted) > parseInt(best.repsCompleted)) return curr;
    return best;
  }, null);

  const bestLabel = bestAttempt
    ? `${bestAttempt.addedWeight} ${weightUnit} × ${bestAttempt.repsCompleted} reps`
    : null;

  const handleComplete = () => {
    if (validAttempts.length === 0) {
      alert("Please record at least one attempt.");
      return;
    }

    const parsedAttempts: PullingStrengthAttempt[] = validAttempts.map((a) => ({
      addedWeight: parseFloat(a.addedWeight) || 0,
      repsCompleted: parseInt(a.repsCompleted) || 0,
      quality: a.quality,
    }));

    const assessment: PullingStrengthAssessment = {
      attempts: parsedAttempts,
      bestWeightXReps: bestLabel ?? `${parsedAttempts[0].addedWeight} ${weightUnit} × ${parsedAttempts[0].repsCompleted} reps`,
    };

    onComplete(assessment);
  };

  if (step === "intro") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Weighted Pull-up Test</h2>
          <p className="training-assessment-subtitle">
            Optional — establishes your pulling strength baseline for antagonist balance tracking.
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <h3>What you'll do:</h3>
            <ol>
              <li>Warm up thoroughly (5-10 minutes)</li>
              <li>Perform 3-5 weighted pull-ups (aim for 3–5 rep max)</li>
              <li>Rest 3 minutes between sets</li>
              <li>Record added weight, reps, and quality for each set (up to 3 sets)</li>
            </ol>

            <h3>Tips:</h3>
            <ul>
              <li><strong>Full range of motion</strong> — chin over bar, arms fully extended at bottom</li>
              <li><strong>Start conservative</strong> — it's better to do 4 clean reps than 2 ugly ones</li>
              <li><strong>Use bodyweight only</strong> if you can't do 5 BW pull-ups yet — enter 0 for added weight</li>
            </ul>

            <p className="training-assessment-welcome-estimate">
              <strong>Total time:</strong> ~10-15 min
            </p>
          </div>
        </div>

        <div className="training-assessment-actions">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="training-center-cta training-btn-secondary"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onSkip}
            className="training-center-cta training-btn-secondary"
          >
            Skip this test
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="training-center-cta"
          >
            Begin test
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Weighted Pull-up Test</h2>
        <p className="training-assessment-subtitle">Record up to 3 sets</p>
      </div>

      <div className="training-assessment-content">
        <div className="training-assessment-section">
          <p className="training-assessment-section-hint">
            Protocol: 3-5 rep max. Add enough weight that you reach failure around 3-5 reps.
            Enter 0 for added weight if doing bodyweight pull-ups.
          </p>
        </div>

        {/* Set table */}
        <div className="training-assessment-section">
          <div className="training-pullup-table">
            <div className="training-pullup-table-header">
              <span>Set</span>
              <span>Added weight ({weightUnit})</span>
              <span>Reps</span>
              <span>Quality</span>
            </div>

            {attempts.map((attempt, i) => (
              <div key={i} className="training-pullup-table-row">
                <span className="training-pullup-set-num">{i + 1}</span>

                <input
                  type="number"
                  value={attempt.addedWeight}
                  onChange={(e) => updateAttempt(i, "addedWeight", e.target.value)}
                  className="training-assessment-input training-pullup-input"
                  placeholder="0"
                  min="0"
                  step="5"
                />

                <input
                  type="number"
                  value={attempt.repsCompleted}
                  onChange={(e) => updateAttempt(i, "repsCompleted", e.target.value)}
                  className="training-assessment-input training-pullup-input"
                  placeholder="—"
                  min="1"
                />

                <div className="training-pullup-quality-group">
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => updateAttempt(i, "quality", q.id)}
                      className={`training-pullup-quality-btn${attempt.quality === q.id ? " active" : ""}`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best set display */}
        {bestLabel && (
          <div className="training-pullup-best">
            <span className="training-pullup-best-label">Best set:</span>
            <strong className="training-pullup-best-value">{bestLabel}</strong>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        <button
          type="button"
          onClick={() => setStep("intro")}
          className="training-center-cta training-btn-secondary"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleComplete}
          className="training-center-cta"
        >
          Save results
        </button>
      </div>
    </div>
  );
}
