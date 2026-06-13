"use client";

import { useState } from "react";
import { MaxHangAttemptFlow } from "@/components/training/workout/MaxHangAttemptFlow";
import type { MaxHangAssessment } from "@/lib/plans/bouldering/types";

interface MaxHangTestProps {
  bodyweight: number;
  weightUnit: "lbs" | "kg";
  onComplete: (data: MaxHangAssessment) => void;
  onBack?: () => void;
}

export function MaxHangTest({ bodyweight, weightUnit, onComplete, onBack }: MaxHangTestProps) {
  const [step, setStep] = useState<"intro" | "flow">("intro");

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
            <h3>What you&apos;ll do:</h3>
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
              <li><strong>Hang dead</strong> — don&apos;t pull up, just hang with engaged shoulders</li>
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
            onClick={() => setStep("flow")}
            className="training-center-cta"
          >
            Start test
          </button>
        </div>
      </div>
    );
  }

  return (
    <MaxHangAttemptFlow
      bodyweight={bodyweight}
      weightUnit={weightUnit}
      onComplete={onComplete}
    />
  );
}
