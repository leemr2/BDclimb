"use client";

import { useState } from "react";
import type {
  IntermittentEnduranceAssessment,
  IHEStoppingReason,
} from "@/lib/plans/power-endurance/types";
import { buildIntermittentEnduranceAssessment } from "@/lib/plans/power-endurance/calculations";

interface IntermittentEnduranceTestProps {
  workingLoad: number;
  weightUnit: "lbs" | "kg";
  onComplete: (data: IntermittentEnduranceAssessment) => void;
  onBack?: () => void;
}

const STOPPING_REASONS: { value: IHEStoppingReason; label: string }[] = [
  { value: "force_drop", label: "Force drop (>10%)" },
  { value: "form_fail", label: "Form failure" },
  { value: "pain", label: "Pain" },
  { value: "time_limit", label: "Time limit" },
];

export function IntermittentEnduranceTest({
  workingLoad,
  weightUnit,
  onComplete,
  onBack,
}: IntermittentEnduranceTestProps) {
  const [step, setStep] = useState<"intro" | "sets">("intro");
  const [protocol, setProtocol] = useState<"7on_3off" | "7on_2off">("7on_3off");
  const [sets, setSets] = useState<
    Array<{
      repsCompleted: number;
      stoppingReason: IHEStoppingReason;
      forceQuality: number;
    }>
  >([{ repsCompleted: 0, stoppingReason: "force_drop", forceQuality: 7 }]);

  const addSet = () => {
    setSets((prev) => [
      ...prev,
      { repsCompleted: 0, stoppingReason: "force_drop", forceQuality: 7 },
    ]);
  };

  const updateSet = (
    index: number,
    field: "repsCompleted" | "stoppingReason" | "forceQuality",
    value: number | IHEStoppingReason
  ) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleComplete = () => {
    const validSets = sets.filter((s) => s.repsCompleted > 0);
    if (validSets.length === 0) return;
    onComplete(buildIntermittentEnduranceAssessment(workingLoad, protocol, validSets));
  };

  if (step === "intro") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Intermittent Endurance Test</h2>
          <p className="training-assessment-subtitle">
            Hang at 60% of your max hang load until form breaks or force drops.
          </p>
        </div>
        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <p>
              <strong>Working load:</strong> {workingLoad} {weightUnit} (60% of max hang)
            </p>
            <ol>
              <li>7 seconds on / 3 seconds off (or 2 seconds off)</li>
              <li>Continue until force drops or form fails</li>
              <li>Log reps completed and stopping reason for each set</li>
              <li>Rest 3 minutes between sets if doing multiple sets</li>
            </ol>
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
            onClick={() => setStep("sets")}
            className="training-center-cta"
          >
            Start test
          </button>
        </div>
      </div>
    );
  }

  const totalReps = sets.reduce((sum, s) => sum + s.repsCompleted, 0);

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Log IHE Sets</h2>
        <p className="training-assessment-subtitle">
          Target load: {workingLoad} {weightUnit}
        </p>
      </div>

      <div className="training-assessment-content">
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Protocol:</span>
          <select
            value={protocol}
            onChange={(e) =>
              setProtocol(e.target.value as "7on_3off" | "7on_2off")
            }
            className="training-injury-input"
          >
            <option value="7on_3off">7s on / 3s off</option>
            <option value="7on_2off">7s on / 2s off</option>
          </select>
        </label>

        {sets.map((set, index) => (
          <div key={index} className="training-assessment-section">
            <h3 className="training-assessment-section-title">Set {index + 1}</h3>
            <div className="training-injury-simple-grid">
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Reps completed:</span>
                <input
                  type="number"
                  min="0"
                  value={set.repsCompleted}
                  onChange={(e) =>
                    updateSet(index, "repsCompleted", parseInt(e.target.value) || 0)
                  }
                  className="training-injury-input"
                />
              </label>
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Stopping reason:</span>
                <select
                  value={set.stoppingReason}
                  onChange={(e) =>
                    updateSet(
                      index,
                      "stoppingReason",
                      e.target.value as IHEStoppingReason
                    )
                  }
                  className="training-injury-input"
                >
                  {STOPPING_REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="training-injury-input-group">
                <span className="training-injury-input-label">Force quality (1-10):</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={set.forceQuality}
                  onChange={(e) =>
                    updateSet(index, "forceQuality", parseInt(e.target.value) || 1)
                  }
                  className="training-injury-input"
                />
              </label>
            </div>
          </div>
        ))}

        <button type="button" onClick={addSet} className="training-center-cta training-btn-secondary">
          + Add another set
        </button>

        {totalReps > 0 && (
          <p className="training-assessment-section-hint" style={{ marginTop: "1rem" }}>
            Total reps: {totalReps}
          </p>
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
          disabled={totalReps === 0}
          className="training-center-cta"
        >
          Complete test
        </button>
      </div>
    </div>
  );
}
