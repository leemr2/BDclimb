"use client";

import { useState } from "react";
import { HangTimer } from "@/components/training/workout/HangTimer";
import type { MaxHangAssessment, MaxHangAttempt, GripType } from "@/lib/plans/bouldering/types";

interface MaxHangTestProps {
  bodyweight: number; // from training profile
  weightUnit: "lbs" | "kg";
  onComplete: (data: MaxHangAssessment) => void;
  onBack?: () => void;
}

export function MaxHangTest({ bodyweight, weightUnit, onComplete, onBack }: MaxHangTestProps) {
  const [step, setStep] = useState<"intro" | "setup" | "testing" | "complete">("intro");
  const [edgeSize, setEdgeSize] = useState(20); // mm
  const [gripType, setGripType] = useState<GripType>("half_crimp");
  const [attempts, setAttempts] = useState<MaxHangAttempt[]>([]);
  const [currentAddedWeight, setCurrentAddedWeight] = useState(0);
  const [currentNotes, setCurrentNotes] = useState("");
  const [currentHeldFull, setCurrentHeldFull] = useState<boolean | null>(null);
  const [timerState, setTimerState] = useState<"ready" | "testing" | "done">("ready");

  const handleStartIntro = () => {
    setStep("setup");
  };

  const handleStartTesting = () => {
    setStep("testing");
  };

  const handleTimerComplete = () => {
    setTimerState("done");
    setCurrentHeldFull(true);
  };

  const handleLogAttempt = (heldFull: boolean) => {
    const attempt: MaxHangAttempt = {
      load: bodyweight + currentAddedWeight,
      addedWeight: currentAddedWeight,
      heldFull7s: heldFull,
      notes: currentNotes,
    };
    setAttempts(prev => [...prev, attempt]);
    setCurrentAddedWeight(0);
    setCurrentNotes("");
    setCurrentHeldFull(null);
    setTimerState("ready");
  };

  const handleFinish = () => {
    if (attempts.length === 0) {
      alert("Please complete at least one attempt.");
      return;
    }

    // Calculate best load from successful attempts
    const successfulAttempts = attempts.filter(a => a.heldFull7s);
    const bestLoad = successfulAttempts.length > 0
      ? Math.max(...successfulAttempts.map(a => a.load))
      : attempts[attempts.length - 1].load; // fallback to last attempt if none successful

    const percentBodyweight = (bestLoad / bodyweight) * 100;

    const assessment: MaxHangAssessment = {
      attempts,
      bestLoad,
      percentBodyweight: Math.round(percentBodyweight * 10) / 10, // round to 1 decimal
      edgeSize,
      gripType,
    };

    onComplete(assessment);
  };

  if (step === "intro") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Max Hang Test</h2>
          <p className="training-assessment-subtitle">
            This test measures your finger strength — the foundation of climbing performance.
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <h3>What you'll do:</h3>
            <ol>
              <li>Warm up your fingers thoroughly (5-10 minutes)</li>
              <li>Hang on a 20mm edge for 7 seconds</li>
              <li>Start with bodyweight, then add weight until you find your max</li>
              <li>Rest 3-5 minutes between attempts</li>
              <li>Record your best successful 7-second hang</li>
            </ol>

            <h3>Tips for success:</h3>
            <ul>
              <li><strong>Half crimp grip</strong> is standard (fingers bent at 90°, thumb optional)</li>
              <li><strong>Hang dead</strong> — don't pull up, just hang with engaged shoulders</li>
              <li><strong>Stop if pain</strong> — sharp pain means stop immediately</li>
              <li><strong>Rest fully</strong> between attempts (3-5 min minimum)</li>
            </ul>
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
            onClick={handleStartIntro}
            className="training-center-cta"
          >
            Start test
          </button>
        </div>
      </div>
    );
  }

  if (step === "setup") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Test Setup</h2>
          <p className="training-assessment-subtitle">Configure your test parameters</p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-section">
            <label className="training-assessment-label">
              Edge size (mm)
              <input
                type="number"
                value={edgeSize}
                onChange={(e) => setEdgeSize(parseInt(e.target.value) || 20)}
                className="training-assessment-input"
                min="10"
                max="30"
              />
            </label>
            <p className="training-assessment-hint">Standard is 20mm. Use the same edge for all attempts.</p>
          </div>

          <div className="training-assessment-section">
            <label className="training-assessment-label">Grip type</label>
            <div className="training-assessment-grip-options">
              <button
                type="button"
                onClick={() => setGripType("half_crimp")}
                className={`training-assessment-grip-btn ${gripType === "half_crimp" ? "active" : ""}`}
              >
                Half Crimp
              </button>
              <button
                type="button"
                onClick={() => setGripType("open_hand")}
                className={`training-assessment-grip-btn ${gripType === "open_hand" ? "active" : ""}`}
              >
                Open Hand
              </button>
              <button
                type="button"
                onClick={() => setGripType("other")}
                className={`training-assessment-grip-btn ${gripType === "other" ? "active" : ""}`}
              >
                Other
              </button>
            </div>
            <p className="training-assessment-hint">Half crimp is standard for max strength testing.</p>
          </div>

          <div className="training-assessment-section">
            <p className="training-assessment-info">
              <strong>Your bodyweight:</strong> {bodyweight} {weightUnit}
            </p>
            <p className="training-assessment-hint">We'll use this to calculate your total load (bodyweight + added weight).</p>
          </div>
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
            onClick={handleStartTesting}
            className="training-center-cta"
          >
            Begin testing
          </button>
        </div>
      </div>
    );
  }

  if (step === "testing") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Max Hang Test</h2>
          <p className="training-assessment-subtitle">
            Attempt #{attempts.length + 1} · {edgeSize}mm {gripType}
          </p>
        </div>

        <div className="training-assessment-content">
          {timerState === "ready" && (
            <>
              <div className="training-assessment-section">
                <label className="training-assessment-label">
                  Added weight ({weightUnit})
                  <input
                    type="number"
                    value={currentAddedWeight}
                    onChange={(e) => setCurrentAddedWeight(parseFloat(e.target.value) || 0)}
                    className="training-assessment-input"
                    step="5"
                  />
                </label>
                <p className="training-assessment-info">
                  <strong>Total load:</strong> {bodyweight + currentAddedWeight} {weightUnit}
                </p>
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
                  onComplete={handleTimerComplete}
                />
              </div>
            </>
          )}

          {timerState === "done" && (
            <div className="training-assessment-result">
              <h3 className="training-assessment-result-title">Attempt complete!</h3>
              <p className="training-assessment-result-question">Did you hold for the full 7 seconds cleanly?</p>
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

          {/* Previous attempts summary */}
          {attempts.length > 0 && timerState === "ready" && (
            <div className="training-assessment-attempts">
              <h4 className="training-assessment-attempts-title">Previous attempts:</h4>
              <ul className="training-assessment-attempts-list">
                {attempts.map((attempt, i) => (
                  <li key={i} className={`training-assessment-attempt ${attempt.heldFull7s ? "success" : "failed"}`}>
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
            <button
              type="button"
              onClick={handleFinish}
              className="training-center-cta"
            >
              Finish test ({attempts.length} attempt{attempts.length !== 1 ? "s" : ""})
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
