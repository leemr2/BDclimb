"use client";

import { useState } from "react";
import { InjuryScreen } from "./InjuryScreen";
import { MaxHangTest } from "./MaxHangTest";
import { BoulderBenchmark } from "./BoulderBenchmark";
import type {
  BoulderingAssessment,
  InjuryBaseline,
  MaxHangAssessment,
  LimitBoulderProblem,
} from "@/lib/plans/bouldering/types";

type AssessmentStep = "welcome" | "injury" | "max-hang" | "bouldering" | "summary";

interface AssessmentFlowProps {
  programId: string;
  bodyweight: number;
  weightUnit: "lbs" | "kg";
  onComplete: (assessment: Omit<BoulderingAssessment, "id" | "date">) => void;
}

export function AssessmentFlow({ programId, bodyweight, weightUnit, onComplete }: AssessmentFlowProps) {
  const [currentStep, setCurrentStep] = useState<AssessmentStep>("welcome");
  const [injuryData, setInjuryData] = useState<InjuryBaseline | null>(null);
  const [maxHangData, setMaxHangData] = useState<MaxHangAssessment | null>(null);
  const [boulderingData, setBoulderingData] = useState<LimitBoulderProblem[]>([]);

  const handleWelcomeNext = () => {
    setCurrentStep("injury");
  };

  const handleInjuryComplete = (data: InjuryBaseline) => {
    setInjuryData(data);
    setCurrentStep("max-hang");
  };

  const handleMaxHangComplete = (data: MaxHangAssessment) => {
    setMaxHangData(data);
    setCurrentStep("bouldering");
  };

  const handleBoulderingComplete = (problems: LimitBoulderProblem[]) => {
    setBoulderingData(problems);
    setCurrentStep("summary");
  };

  const handleFinish = () => {
    if (!injuryData || !maxHangData || boulderingData.length === 0) {
      alert("Please complete all assessment steps.");
      return;
    }

    const assessment: Omit<BoulderingAssessment, "id" | "date"> = {
      programId,
      week: 0,
      maxHang: maxHangData,
      campusBoard: null, // optional, not implemented yet
      limitBoulders: boulderingData,
      pullingStrength: null, // optional, not implemented yet
      injuryBaseline: injuryData,
    };

    onComplete(assessment);
  };

  // Welcome screen
  if (currentStep === "welcome") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Week 0 Baseline Assessment</h2>
          <p className="training-assessment-subtitle">
            Let's establish your baseline metrics before starting Week 1.
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-welcome">
            <h3 className="training-assessment-welcome-title">Why We Test</h3>
            <p className="training-assessment-welcome-text">
              This assessment gives us three critical data points:
            </p>
            <ul className="training-assessment-welcome-list">
              <li><strong>Injury baseline:</strong> Current pain and stiffness levels to monitor throughout the program</li>
              <li><strong>Max finger strength:</strong> Determines your training loads for the next 12 weeks</li>
              <li><strong>Climbing performance:</strong> Send rate and attempts-to-send efficiency</li>
            </ul>

            <h3 className="training-assessment-welcome-title">What You'll Do</h3>
            <ol className="training-assessment-welcome-list">
              <li>Injury baseline check (5 min)</li>
              <li>Max hang test (15-20 min)</li>
              <li>Limit boulder benchmark (30-40 min)</li>
            </ol>

            <p className="training-assessment-welcome-estimate">
              <strong>Total time:</strong> ~60 minutes
            </p>

            <div className="training-assessment-welcome-tip">
              <strong>Tip:</strong> Warm up thoroughly before the max hang test. Take your time between attempts. Quality data now means better training all 12 weeks.
            </div>
          </div>
        </div>

        <div className="training-assessment-actions">
          <button
            type="button"
            onClick={handleWelcomeNext}
            className="training-center-cta"
          >
            Begin assessment
          </button>
        </div>
      </div>
    );
  }

  // Injury baseline
  if (currentStep === "injury") {
    return (
      <InjuryScreen
        onComplete={handleInjuryComplete}
        onBack={() => setCurrentStep("welcome")}
      />
    );
  }

  // Max hang test
  if (currentStep === "max-hang") {
    return (
      <MaxHangTest
        bodyweight={bodyweight}
        weightUnit={weightUnit}
        onComplete={handleMaxHangComplete}
        onBack={() => setCurrentStep("injury")}
      />
    );
  }

  // Boulder benchmark
  if (currentStep === "bouldering") {
    return (
      <BoulderBenchmark
        onComplete={handleBoulderingComplete}
        onBack={() => setCurrentStep("max-hang")}
      />
    );
  }

  // Summary
  if (currentStep === "summary") {
    const sentCount = boulderingData.filter(p => p.sent).length;
    const sendRate = Math.round((sentCount / boulderingData.length) * 100);

    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Assessment Complete!</h2>
          <p className="training-assessment-subtitle">
            Here's your baseline data:
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-assessment-summary">
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Max Hang</h3>
              <p className="training-assessment-summary-value">
                {maxHangData?.bestLoad} {weightUnit}
              </p>
              <p className="training-assessment-summary-sub">
                {maxHangData?.percentBodyweight.toFixed(1)}% bodyweight
              </p>
              <p className="training-assessment-summary-detail">
                {maxHangData?.edgeSize}mm {maxHangData?.gripType}
              </p>
            </div>

            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Boulder Performance</h3>
              <p className="training-assessment-summary-value">
                {sendRate}% send rate
              </p>
              <p className="training-assessment-summary-sub">
                {sentCount} / {boulderingData.length} problems sent
              </p>
            </div>

            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Injury Status</h3>
              <p className="training-assessment-summary-value">
                {(() => {
                  const maxFingerPain = Math.max(
                    ...Object.values(injuryData?.fingers || {}).flatMap(f => [f.painAtRest, f.painWithPressure])
                  );
                  const maxElbowPain = Math.max(injuryData?.elbowPain.left || 0, injuryData?.elbowPain.right || 0);
                  const maxShoulderPain = Math.max(injuryData?.shoulderPain.left || 0, injuryData?.shoulderPain.right || 0);
                  const maxPain = Math.max(maxFingerPain, maxElbowPain, maxShoulderPain);

                  if (maxPain === 0) return "No pain reported";
                  if (maxPain < 3) return "Minimal pain";
                  if (maxPain < 5) return "Moderate pain";
                  return "High pain (⚠️ monitor closely)";
                })()}
              </p>
              <p className="training-assessment-summary-sub">
                Morning stiffness: {injuryData?.morningStiffness}/10
              </p>
            </div>
          </div>

          <div className="training-assessment-next-steps">
            <h3 className="training-assessment-next-title">Next Steps</h3>
            <p className="training-assessment-next-text">
              Your Week 1 training loads will be calculated from your {maxHangData?.bestLoad} {weightUnit} max hang. 
              We'll track your progress through 3 mesocycles:
            </p>
            <ol className="training-assessment-next-list">
              <li><strong>Weeks 1-4:</strong> Max Strength Foundation</li>
              <li><strong>Weeks 5-8:</strong> Power & RFD Development</li>
              <li><strong>Weeks 9-12:</strong> Peak Performance</li>
            </ol>
            <p className="training-assessment-next-text">
              You'll retest at Week 4, 8, and 12 to track your progress.
            </p>
          </div>
        </div>

        <div className="training-assessment-actions">
          <button
            type="button"
            onClick={handleFinish}
            className="training-center-cta"
          >
            Save & Start Week 1
          </button>
        </div>
      </div>
    );
  }

  return null;
}
