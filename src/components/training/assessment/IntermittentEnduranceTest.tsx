"use client";

import { useState } from "react";
import { RepeaterTimer } from "@/components/training/workout/RepeaterTimer";
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

type Protocol = IntermittentEnduranceAssessment["protocol"];

interface CompletedSet {
  repsCompleted: number;
  stoppingReason: IHEStoppingReason;
  forceQuality: number;
}

function protocolToRestSeconds(protocol: Protocol): 2 | 3 {
  return protocol === "7on_2off" ? 2 : 3;
}

export function IntermittentEnduranceTest({
  workingLoad,
  weightUnit,
  onComplete,
  onBack,
}: IntermittentEnduranceTestProps) {
  const [step, setStep] = useState<"intro" | "testing">("intro");
  const [timerState, setTimerState] = useState<"ready" | "log">("ready");
  const [protocol, setProtocol] = useState<Protocol>("7on_3off");
  const [completedSets, setCompletedSets] = useState<CompletedSet[]>([]);
  const [pendingReps, setPendingReps] = useState(0);
  const [stoppingReason, setStoppingReason] = useState<IHEStoppingReason>("force_drop");
  const [forceQuality, setForceQuality] = useState(7);
  const [timerKey, setTimerKey] = useState(0);

  const handleTimerStop = (reps: number) => {
    setPendingReps(reps);
    setStoppingReason("force_drop");
    setForceQuality(7);
    setTimerState("log");
  };

  const handleLogSet = () => {
    if (pendingReps <= 0) return;
    setCompletedSets((prev) => [
      ...prev,
      { repsCompleted: pendingReps, stoppingReason, forceQuality },
    ]);
    setTimerState("ready");
    setPendingReps(0);
    setTimerKey((k) => k + 1);
  };

  const handleComplete = () => {
    if (completedSets.length === 0) return;
    onComplete(buildIntermittentEnduranceAssessment(workingLoad, protocol, completedSets));
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
            <h3>What you&apos;ll do:</h3>
            <ol>
              <li>Choose 7 seconds on / 3 seconds off, or 7 on / 2 off</li>
              <li>Start the timer — a countdown leads into repeating hang/rest cycles</li>
              <li>Press Stop when force drops or form fails</li>
              <li>Log why you stopped; rest 3 minutes before another set if desired</li>
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
            onClick={() => setStep("testing")}
            className="training-center-cta"
          >
            Start test
          </button>
        </div>
      </div>
    );
  }

  const totalReps = completedSets.reduce((sum, s) => sum + s.repsCompleted, 0);

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Intermittent Endurance Test</h2>
        <p className="training-assessment-subtitle">
          Set {completedSets.length + 1} · Target: {workingLoad} {weightUnit}
        </p>
      </div>

      <div className="training-assessment-content">
        {timerState === "ready" && (
          <>
            <div className="training-assessment-section">
              <label className="training-assessment-label">Protocol</label>
              <div className="training-assessment-grip-options">
                <button
                  type="button"
                  onClick={() => setProtocol("7on_3off")}
                  className={`training-assessment-grip-btn ${
                    protocol === "7on_3off" ? "active" : ""
                  }`}
                >
                  7s on / 3s off
                </button>
                <button
                  type="button"
                  onClick={() => setProtocol("7on_2off")}
                  className={`training-assessment-grip-btn ${
                    protocol === "7on_2off" ? "active" : ""
                  }`}
                >
                  7s on / 2s off
                </button>
              </div>
              <p className="training-assessment-hint">
                Use the same protocol for all sets in this test.
              </p>
            </div>

            <div className="training-hang-timer-container">
              <RepeaterTimer
                key={`${timerKey}-${protocol}`}
                restSeconds={protocolToRestSeconds(protocol)}
                showRestSelector={false}
                showSummaryOnStop={false}
                startLabel="Start timer"
                onStop={(reps) => handleTimerStop(reps)}
              />
            </div>
          </>
        )}

        {timerState === "log" && (
          <div className="training-assessment-result">
            <h3 className="training-assessment-result-title">Set complete</h3>
            <p className="training-assessment-result-question">
              {pendingReps} rep{pendingReps !== 1 ? "s" : ""} completed — why did you stop?
            </p>

            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Reps completed
                <input
                  type="number"
                  min="0"
                  value={pendingReps}
                  onChange={(e) => setPendingReps(parseInt(e.target.value) || 0)}
                  className="training-assessment-input"
                />
              </label>
            </div>

            <div className="training-assessment-section">
              <label className="training-assessment-label">Stopping reason</label>
              <div className="training-assessment-grip-options">
                {STOPPING_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setStoppingReason(r.value)}
                    className={`training-assessment-grip-btn ${
                      stoppingReason === r.value ? "active" : ""
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Force quality (1–10)
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={forceQuality}
                  onChange={(e) => setForceQuality(parseInt(e.target.value) || 1)}
                  className="training-assessment-input"
                />
              </label>
            </div>

            <div className="training-assessment-result-actions">
              <button
                type="button"
                onClick={() => {
                  setTimerState("ready");
                  setPendingReps(0);
                  setTimerKey((k) => k + 1);
                }}
                className="training-center-cta training-btn-secondary"
              >
                Discard set
              </button>
              <button
                type="button"
                onClick={handleLogSet}
                disabled={pendingReps <= 0}
                className="training-center-cta"
              >
                Save set
              </button>
            </div>
          </div>
        )}

        {completedSets.length > 0 && timerState === "ready" && (
          <div className="training-assessment-attempts">
            <h4 className="training-assessment-attempts-title">Completed sets:</h4>
            <ul className="training-assessment-attempts-list">
              {completedSets.map((set, i) => (
                <li key={i} className="training-assessment-attempt success">
                  Set {i + 1}: {set.repsCompleted} reps —{" "}
                  {STOPPING_REASONS.find((r) => r.value === set.stoppingReason)?.label ??
                    set.stoppingReason}
                </li>
              ))}
            </ul>
            <p className="training-assessment-hint">Total reps: {totalReps}</p>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        {onBack && timerState === "ready" && completedSets.length === 0 && (
          <button
            type="button"
            onClick={onBack}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
        )}
        {completedSets.length > 0 && timerState === "ready" && (
          <button type="button" onClick={handleComplete} className="training-center-cta">
            Finish test ({totalReps} total reps)
          </button>
        )}
      </div>
    </div>
  );
}
