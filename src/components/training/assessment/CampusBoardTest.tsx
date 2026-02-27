"use client";

import { useState } from "react";
import type { CampusBoardAssessment, CampusReachAttempt } from "@/lib/plans/bouldering/types";

interface CampusBoardTestProps {
  onComplete: (data: CampusBoardAssessment) => void;
  onSkip: () => void;
  onBack?: () => void;
}

type StoppingReason = "grip_fail" | "power" | "exhaustion";

const STOPPING_REASONS: Array<{ id: StoppingReason; label: string }> = [
  { id: "grip_fail", label: "Grip failure (fingers gave out)" },
  { id: "power", label: "Power / couldn't make the move" },
  { id: "exhaustion", label: "Exhaustion / general fatigue" },
];

const DEFAULT_ATTEMPT: CampusReachAttempt = { rung: 0, controlled: false };

export function CampusBoardTest({ onComplete, onSkip, onBack }: CampusBoardTestProps) {
  const [step, setStep] = useState<"intro" | "form">("intro");

  const [rungSpacing, setRungSpacing] = useState(220); // mm, typical campus board

  // Max Reach: up to 3 attempts
  const [reachAttempts, setReachAttempts] = useState<CampusReachAttempt[]>([
    { ...DEFAULT_ATTEMPT },
    { ...DEFAULT_ATTEMPT },
    { ...DEFAULT_ATTEMPT },
  ]);

  // Moves to Failure
  const [totalMoves, setTotalMoves] = useState<number>(0);
  const [stoppingReason, setStoppingReason] = useState<StoppingReason>("grip_fail");
  const [skipMovesToFailure, setSkipMovesToFailure] = useState(false);

  const updateReachAttempt = (
    index: number,
    field: keyof CampusReachAttempt,
    value: number | boolean
  ) => {
    setReachAttempts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const bestRung = Math.max(
    ...reachAttempts
      .filter((a) => a.rung > 0 && a.controlled)
      .map((a) => a.rung),
    0
  );

  const hasAnyReachData = reachAttempts.some((a) => a.rung > 0);

  const handleComplete = () => {
    if (!hasAnyReachData) {
      alert("Please record at least one max reach attempt.");
      return;
    }

    const assessment: CampusBoardAssessment = {
      rungSpacing,
      maxReach: {
        attempts: reachAttempts.filter((a) => a.rung > 0),
        bestRung: bestRung > 0 ? bestRung : reachAttempts.filter((a) => a.rung > 0).reduce((m, a) => Math.max(m, a.rung), 0),
      },
      movesToFailure: skipMovesToFailure
        ? { totalMoves: 0, stoppingReason: "exhaustion" }
        : { totalMoves, stoppingReason },
    };

    onComplete(assessment);
  };

  if (step === "intro") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Campus Board Assessment</h2>
          <p className="training-assessment-subtitle">
            Optional — only do this if you have access to a campus board and no finger or shoulder pain.
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-instructions">
            <h3>⚠️ Safety first</h3>
            <ul>
              <li>Skip entirely if you have <strong>any finger or shoulder pain &gt; 1/10</strong></li>
              <li>Only use campus boards after a thorough warm-up</li>
              <li>Stop immediately if you feel sharp pain</li>
              <li>This assessment is recommended only in Mesocycle 2 (Weeks 5-7) for training</li>
            </ul>

            <h3>What you'll do:</h3>
            <ol>
              <li><strong>Max Reach Test</strong> — 3 attempts to reach the highest rung you can catch controlled</li>
              <li><strong>Moves to Failure</strong> (optional) — continuous ladder until you can't continue</li>
            </ol>

            <p className="training-assessment-welcome-estimate">
              <strong>Total time:</strong> ~15 min with rest
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
            Skip — no campus board
          </button>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="training-center-cta"
          >
            Begin assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Campus Board Assessment</h2>
        <p className="training-assessment-subtitle">Record your max reach and ladder results</p>
      </div>

      <div className="training-assessment-content">
        {/* Rung spacing */}
        <div className="training-assessment-section">
          <label className="training-assessment-label">
            Rung spacing / depth (mm)
            <select
              value={rungSpacing}
              onChange={(e) => setRungSpacing(parseInt(e.target.value))}
              className="training-assessment-input"
            >
              {[100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300, 320, 340, 360, 380, 400].map((mm) => (
                <option key={mm} value={mm}>{mm} mm</option>
              ))}
            </select>
          </label>
          <p className="training-assessment-hint">Typical campus boards are 200-220mm. Note what your board uses.</p>
        </div>

        {/* Max Reach Test */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Max Reach Test</h3>
          <p className="training-assessment-section-hint">
            For each attempt, reach for the highest rung you can catch in a controlled manner.
          </p>

          <div className="training-campus-attempts">
            {reachAttempts.map((attempt, i) => (
              <div key={i} className="training-campus-attempt-row">
                <span className="training-campus-attempt-label">Attempt {i + 1}</span>

                <label className="training-campus-attempt-field">
                  <span>Rung #</span>
                  <select
                    value={attempt.rung}
                    onChange={(e) => updateReachAttempt(i, "rung", parseInt(e.target.value))}
                    className="training-assessment-input training-campus-rung-input"
                  >
                    <option value={0}>—</option>
                    {Array.from({ length: 20 }, (_, n) => n + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>

                <label className="training-campus-attempt-controlled">
                  <input
                    type="checkbox"
                    checked={attempt.controlled}
                    onChange={(e) => updateReachAttempt(i, "controlled", e.target.checked)}
                    className="training-campus-checkbox"
                  />
                  <span>Controlled catch</span>
                </label>
              </div>
            ))}
          </div>

          {bestRung > 0 && (
            <div className="training-campus-best">
              Best controlled rung: <strong>#{bestRung}</strong>
            </div>
          )}
        </div>

        {/* Moves to Failure */}
        <div className="training-assessment-section">
          <div className="training-campus-optional-header">
            <h3 className="training-assessment-section-title">Moves to Failure</h3>
            <label className="training-campus-skip-label">
              <input
                type="checkbox"
                checked={skipMovesToFailure}
                onChange={(e) => setSkipMovesToFailure(e.target.checked)}
                className="training-campus-checkbox"
              />
              Skip this test
            </label>
          </div>
          <p className="training-assessment-section-hint">
            Continuous ladder until you can't complete the next move.
          </p>

          {!skipMovesToFailure && (
            <>
              <label className="training-assessment-label">
                Total moves completed
                <select
                  value={totalMoves}
                  onChange={(e) => setTotalMoves(parseInt(e.target.value))}
                  className="training-assessment-input"
                >
                  {Array.from({ length: 51 }, (_, n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              <div className="training-assessment-section" style={{ marginTop: "0.75rem" }}>
                <p className="training-assessment-section-hint">Reason for stopping:</p>
                <div className="training-campus-reason-options">
                  {STOPPING_REASONS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setStoppingReason(r.id)}
                      className={`training-assessment-style-btn${stoppingReason === r.id ? " active" : ""}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
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
          onClick={handleComplete}
          className="training-center-cta"
        >
          Save results
        </button>
      </div>
    </div>
  );
}
