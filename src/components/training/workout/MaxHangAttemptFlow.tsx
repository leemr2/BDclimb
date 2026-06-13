"use client";

import { useState } from "react";
import { HangTimer } from "@/components/training/workout/HangTimer";
import { NumberSlider } from "@/components/training/ui/NumberSlider";
import type { MaxHangAssessment, MaxHangAttempt, GripType } from "@/lib/plans/bouldering/types";

export interface MaxHangAttemptFlowProps {
  bodyweight: number;
  weightUnit: "lbs" | "kg";
  title?: string;
  /** Skip the edge/grip setup screen and go straight to attempts. */
  skipSetup?: boolean;
  defaultEdgeSize?: number;
  defaultGripType?: GripType;
  onComplete: (data: MaxHangAssessment) => void;
}

function buildAssessment(
  attempts: MaxHangAttempt[],
  bodyweight: number,
  edgeSize: number,
  gripType: GripType
): MaxHangAssessment {
  const successfulAttempts = attempts.filter((a) => a.heldFull7s);
  const bestLoad =
    successfulAttempts.length > 0
      ? Math.max(...successfulAttempts.map((a) => a.load))
      : attempts[attempts.length - 1].load;
  const percentBodyweight = (bestLoad / bodyweight) * 100;

  return {
    attempts,
    bestLoad,
    percentBodyweight: Math.round(percentBodyweight * 10) / 10,
    edgeSize,
    gripType,
  };
}

/**
 * Progressive 7-second max hang test flow (setup + attempts).
 * Shared by baseline assessment and deload-week retest drills.
 */
export function MaxHangAttemptFlow({
  bodyweight,
  weightUnit,
  title = "Max Hang Test",
  skipSetup = false,
  defaultEdgeSize = 20,
  defaultGripType = "half_crimp",
  onComplete,
}: MaxHangAttemptFlowProps) {
  const [step, setStep] = useState<"setup" | "testing">(skipSetup ? "testing" : "setup");
  const [edgeSize, setEdgeSize] = useState(defaultEdgeSize);
  const [gripType, setGripType] = useState<GripType>(defaultGripType);
  const [attempts, setAttempts] = useState<MaxHangAttempt[]>([]);
  const [currentAddedWeight, setCurrentAddedWeight] = useState(0);
  const [currentNotes, setCurrentNotes] = useState("");
  const [timerState, setTimerState] = useState<"ready" | "done">("ready");

  const handleLogAttempt = (heldFull: boolean) => {
    const attempt: MaxHangAttempt = {
      load: bodyweight + currentAddedWeight,
      addedWeight: currentAddedWeight,
      heldFull7s: heldFull,
      notes: currentNotes,
    };
    setAttempts((prev) => [...prev, attempt]);
    setCurrentAddedWeight(0);
    setCurrentNotes("");
    setTimerState("ready");
  };

  const handleFinish = () => {
    if (attempts.length === 0) {
      alert("Please complete at least one attempt.");
      return;
    }
    onComplete(buildAssessment(attempts, bodyweight, edgeSize, gripType));
  };

  if (step === "setup") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">{title}</h2>
          <p className="training-assessment-subtitle">Configure your test parameters</p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-section">
            <NumberSlider
              label="Edge size"
              value={edgeSize}
              onChange={setEdgeSize}
              min={10}
              max={30}
              step={1}
              unit="mm"
              hint="Standard is 20mm. Use the same edge for all attempts."
            />
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">Grip type</label>
            <div className="training-assessment-grip-options">
              {(["half_crimp", "open_hand", "other"] as const).map((grip) => (
                <button
                  key={grip}
                  type="button"
                  onClick={() => setGripType(grip)}
                  className={`training-assessment-grip-btn ${gripType === grip ? "active" : ""}`}
                >
                  {grip === "half_crimp" ? "Half Crimp" : grip === "open_hand" ? "Open Hand" : "Other"}
                </button>
              ))}
            </div>
            <p className="training-assessment-hint">Half crimp is standard for max strength testing.</p>
          </div>

          <div className="training-assessment-section">
            <p className="training-assessment-info">
              <strong>Your bodyweight:</strong> {bodyweight} {weightUnit}
            </p>
            <p className="training-assessment-hint">
              Work up to your best 7-second hang. Rest 3-5 minutes between attempts.
            </p>
          </div>
        </div>

        <div className="training-assessment-actions">
          <button
            type="button"
            onClick={() => setStep("testing")}
            className="training-center-cta"
          >
            Begin testing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">{title}</h2>
        <p className="training-assessment-subtitle">
          Attempt #{attempts.length + 1} · {edgeSize}mm {gripType.replace("_", " ")}
        </p>
      </div>

      <div className="training-assessment-content">
        {timerState === "ready" && (
          <>
            <div className="training-assessment-section">
              <NumberSlider
                label="Added weight"
                value={currentAddedWeight}
                onChange={setCurrentAddedWeight}
                min={-30}
                max={100}
                step={weightUnit === "lbs" ? 2.5 : 1}
                unit={weightUnit}
                hint={`Total load: ${bodyweight + currentAddedWeight} ${weightUnit} · use negative for assisted hangs`}
              />
            </div>

            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Notes (optional)
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="e.g., felt strong, slight finger pain..."
                  className="training-assessment-input"
                />
              </label>
            </div>

            <div className="training-hang-timer-container">
              <HangTimer
                durationSeconds={7}
                setLabel={`Attempt ${attempts.length + 1}`}
                targetLabel={`Target: ${bodyweight + currentAddedWeight} ${weightUnit}`}
                onComplete={() => setTimerState("done")}
              />
            </div>
          </>
        )}

        {timerState === "done" && (
          <div className="training-assessment-result">
            <h3 className="training-assessment-result-title">Attempt complete!</h3>
            <p className="training-assessment-result-question">
              Did you hold for the full 7 seconds cleanly?
            </p>
            <div className="training-assessment-result-actions">
              <button
                type="button"
                onClick={() => handleLogAttempt(true)}
                className="training-center-cta training-btn-success"
              >
                Yes, held full 7s
              </button>
              <button
                type="button"
                onClick={() => handleLogAttempt(false)}
                className="training-center-cta training-btn-secondary"
              >
                No, fell off early
              </button>
            </div>
          </div>
        )}

        {attempts.length > 0 && timerState === "ready" && (
          <div className="training-assessment-attempts">
            <h4 className="training-assessment-attempts-title">Previous attempts:</h4>
            <ul className="training-assessment-attempts-list">
              {attempts.map((attempt, i) => (
                <li
                  key={i}
                  className={`training-assessment-attempt ${attempt.heldFull7s ? "success" : "failed"}`}
                >
                  Attempt {i + 1}: {attempt.load} {weightUnit}
                  ({attempt.addedWeight > 0 ? `+${attempt.addedWeight}` : "bodyweight"})
                  {attempt.heldFull7s ? " ✓" : " ✗"}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        {attempts.length > 0 && (
          <button type="button" onClick={handleFinish} className="training-center-cta">
            Finish test ({attempts.length} attempt{attempts.length !== 1 ? "s" : ""})
          </button>
        )}
      </div>
    </div>
  );
}
