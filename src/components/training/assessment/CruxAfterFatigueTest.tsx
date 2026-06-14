"use client";

import { useState } from "react";
import type {
  CruxAfterFatigueAssessment,
  CruxAfterFatigueAttempt,
} from "@/lib/plans/power-endurance/types";
import { buildCruxAfterFatigueAssessment } from "@/lib/plans/power-endurance/calculations";

interface CruxAfterFatigueTestProps {
  onComplete: (data: CruxAfterFatigueAssessment) => void;
  onBack?: () => void;
}

const EMPTY_ATTEMPT: CruxAfterFatigueAttempt = {
  leadInCompleted: true,
  pumpBeforeCrux: 5,
  movesCompleted: 0,
  success: false,
  executionQuality: 3,
  notes: "",
};

export function CruxAfterFatigueTest({ onComplete, onBack }: CruxAfterFatigueTestProps) {
  const [step, setStep] = useState<"setup" | "attempts">("setup");
  const [leadInDuration, setLeadInDuration] = useState(2);
  const [cruxDescription, setCruxDescription] = useState("");
  const [cruxTotalMoves, setCruxTotalMoves] = useState(8);
  const [limitingFactor, setLimitingFactor] = useState<
    CruxAfterFatigueAssessment["limitingFactor"]
  >("forearm_pump");
  const [attempts, setAttempts] = useState<CruxAfterFatigueAttempt[]>([
    { ...EMPTY_ATTEMPT },
    { ...EMPTY_ATTEMPT },
    { ...EMPTY_ATTEMPT },
  ]);

  const updateAttempt = (
    index: number,
    field: keyof CruxAfterFatigueAttempt,
    value: CruxAfterFatigueAttempt[keyof CruxAfterFatigueAttempt]
  ) => {
    setAttempts((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a))
    );
  };

  const handleComplete = () => {
    if (!cruxDescription.trim()) return;
    onComplete(
      buildCruxAfterFatigueAssessment(
        leadInDuration,
        cruxDescription.trim(),
        cruxTotalMoves,
        attempts,
        limitingFactor
      )
    );
  };

  if (step === "setup") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Crux-After-Fatigue Simulation</h2>
          <p className="training-assessment-subtitle">
            Your primary KPI — success rate executing a hard crux when already fatigued.
          </p>
        </div>
        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <ol>
              <li>2-3 min continuous moderate climbing (lead-in)</li>
              <li>Immediately attempt your benchmark crux (6-12 moves)</li>
              <li>Rest 10-15 min between attempts; repeat 2-3 times</li>
            </ol>
          </div>
          <div className="training-assessment-section">
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Lead-in duration (minutes):</span>
              <input
                type="number"
                min="1"
                max="5"
                value={leadInDuration}
                onChange={(e) => setLeadInDuration(parseInt(e.target.value) || 2)}
                className="training-injury-input"
              />
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Crux description:</span>
              <textarea
                value={cruxDescription}
                onChange={(e) => setCruxDescription(e.target.value)}
                placeholder="Describe your benchmark crux (grade, moves, style)..."
                className="training-injury-textarea"
                rows={3}
              />
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Total crux moves:</span>
              <input
                type="number"
                min="1"
                max="20"
                value={cruxTotalMoves}
                onChange={(e) => setCruxTotalMoves(parseInt(e.target.value) || 8)}
                className="training-injury-input"
              />
            </label>
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
            onClick={() => setStep("attempts")}
            disabled={!cruxDescription.trim()}
            className="training-center-cta"
          >
            Log attempts
          </button>
        </div>
      </div>
    );
  }

  const successRate = Math.round(
    (attempts.filter((a) => a.success).length / attempts.length) * 100
  );

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Crux Attempts</h2>
        <p className="training-assessment-subtitle">{cruxDescription}</p>
      </div>

      <div className="training-assessment-content">
        {attempts.map((attempt, index) => (
          <div key={index} className="training-assessment-section">
            <h3 className="training-assessment-section-title">Attempt {index + 1}</h3>
            <div className="training-injury-simple-grid">
              <label className="training-injury-input-group">
                <input
                  type="checkbox"
                  checked={attempt.leadInCompleted}
                  onChange={(e) =>
                    updateAttempt(index, "leadInCompleted", e.target.checked)
                  }
                />
                <span className="training-injury-input-label">Lead-in completed</span>
              </label>
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Pump before crux (1-10):</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={attempt.pumpBeforeCrux}
                  onChange={(e) =>
                    updateAttempt(index, "pumpBeforeCrux", parseInt(e.target.value) || 1)
                  }
                  className="training-injury-input"
                />
              </label>
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Moves completed:</span>
                <input
                  type="number"
                  min="0"
                  max={cruxTotalMoves}
                  value={attempt.movesCompleted}
                  onChange={(e) =>
                    updateAttempt(index, "movesCompleted", parseInt(e.target.value) || 0)
                  }
                  className="training-injury-input"
                />
              </label>
              <label className="training-injury-input-group">
                <input
                  type="checkbox"
                  checked={attempt.success}
                  onChange={(e) => updateAttempt(index, "success", e.target.checked)}
                />
                <span className="training-injury-input-label">Success (sent crux)</span>
              </label>
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Execution quality (1-5):</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={attempt.executionQuality}
                  onChange={(e) =>
                    updateAttempt(index, "executionQuality", parseInt(e.target.value) || 1)
                  }
                  className="training-injury-input"
                />
              </label>
            </div>
          </div>
        ))}

        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Limiting factor:</span>
          <select
            value={limitingFactor ?? "forearm_pump"}
            onChange={(e) =>
              setLimitingFactor(
                e.target.value as CruxAfterFatigueAssessment["limitingFactor"]
              )
            }
            className="training-injury-input"
          >
            <option value="forearm_pump">Forearm pump</option>
            <option value="finger_strength">Finger strength</option>
            <option value="technique">Technique</option>
            <option value="mental">Mental</option>
            <option value="power">Power</option>
          </select>
        </label>

        <p className="training-assessment-section-hint" style={{ marginTop: "1rem" }}>
          Success rate: {successRate}%
        </p>
      </div>

      <div className="training-assessment-actions">
        <button
          type="button"
          onClick={() => setStep("setup")}
          className="training-center-cta training-btn-secondary"
        >
          Back
        </button>
        <button type="button" onClick={handleComplete} className="training-center-cta">
          Complete test
        </button>
      </div>
    </div>
  );
}
