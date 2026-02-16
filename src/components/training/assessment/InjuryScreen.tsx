"use client";

import { useState } from "react";
import type { InjuryBaseline } from "@/lib/plans/bouldering/types";

interface InjuryScreenProps {
  onComplete: (data: InjuryBaseline) => void;
  onBack?: () => void;
}

const FINGERS = [
  { id: "r_index", label: "Right Index" },
  { id: "r_middle", label: "Right Middle" },
  { id: "r_ring", label: "Right Ring" },
  { id: "r_pinky", label: "Right Pinky" },
  { id: "l_index", label: "Left Index" },
  { id: "l_middle", label: "Left Middle" },
  { id: "l_ring", label: "Left Ring" },
  { id: "l_pinky", label: "Left Pinky" },
];

export function InjuryScreen({ onComplete, onBack }: InjuryScreenProps) {
  const [fingerData, setFingerData] = useState<Record<string, { painAtRest: number; painWithPressure: number; stiffness: number }>>(() => {
    const initial: Record<string, { painAtRest: number; painWithPressure: number; stiffness: number }> = {};
    FINGERS.forEach(f => {
      initial[f.id] = { painAtRest: 0, painWithPressure: 0, stiffness: 0 };
    });
    return initial;
  });

  const [elbowPain, setElbowPain] = useState({ left: 0, right: 0 });
  const [shoulderPain, setShoulderPain] = useState({ left: 0, right: 0 });
  const [morningStiffness, setMorningStiffness] = useState(0);
  const [concerns, setConcerns] = useState("");
  const [showWarning, setShowWarning] = useState(false);

  const hasHighPain = () => {
    const anyFingerHighPain = Object.values(fingerData).some(
      f => f.painAtRest >= 4 || f.painWithPressure >= 4
    );
    const anyElbowHighPain = elbowPain.left >= 4 || elbowPain.right >= 4;
    const anyShoulderHighPain = shoulderPain.left >= 4 || shoulderPain.right >= 4;
    return anyFingerHighPain || anyElbowHighPain || anyShoulderHighPain;
  };

  const handleContinue = () => {
    if (hasHighPain()) {
      setShowWarning(true);
      return;
    }

    onComplete({
      fingers: fingerData,
      elbowPain,
      shoulderPain,
      morningStiffness,
      concerns,
    });
  };

  const handleContinueAnyway = () => {
    onComplete({
      fingers: fingerData,
      elbowPain,
      shoulderPain,
      morningStiffness,
      concerns,
    });
  };

  const updateFinger = (fingerId: string, field: "painAtRest" | "painWithPressure" | "stiffness", value: number) => {
    setFingerData(prev => ({
      ...prev,
      [fingerId]: {
        ...prev[fingerId],
        [field]: value,
      },
    }));
  };

  if (showWarning) {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-warning">
          <h3 className="training-assessment-warning-title">⚠️ High Pain Detected</h3>
          <p className="training-assessment-warning-message">
            You reported pain levels of 4/10 or higher. Starting a strength training program with existing pain increases injury risk significantly.
          </p>
          <p className="training-assessment-warning-recommendation">
            <strong>Recommendation:</strong> Address the pain first (rest, physical therapy, medical evaluation) before beginning a structured training program.
          </p>
          <div className="training-assessment-warning-actions">
            <button
              type="button"
              className="training-center-cta training-btn-secondary"
              onClick={() => setShowWarning(false)}
            >
              Go back and revise
            </button>
            <button
              type="button"
              className="training-center-cta"
              onClick={handleContinueAnyway}
            >
              Continue anyway (not recommended)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Injury Baseline</h2>
        <p className="training-assessment-subtitle">
          Rate your current pain and stiffness levels. Be honest — this helps us monitor your health throughout the program.
        </p>
      </div>

      <div className="training-assessment-content">
        {/* Finger Assessment */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Finger Status</h3>
          <p className="training-assessment-section-hint">
            Rate each finger 0-10 (0 = no pain/stiffness, 10 = severe)
          </p>
          <div className="training-injury-finger-grid">
            {FINGERS.map(finger => (
              <div key={finger.id} className="training-injury-finger-card">
                <h4 className="training-injury-finger-label">{finger.label}</h4>
                <div className="training-injury-finger-inputs">
                  <label className="training-injury-input-group">
                    <span className="training-injury-input-label">Rest:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={fingerData[finger.id].painAtRest}
                      onChange={(e) => updateFinger(finger.id, "painAtRest", parseInt(e.target.value) || 0)}
                      className="training-injury-input"
                    />
                  </label>
                  <label className="training-injury-input-group">
                    <span className="training-injury-input-label">Pressure:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={fingerData[finger.id].painWithPressure}
                      onChange={(e) => updateFinger(finger.id, "painWithPressure", parseInt(e.target.value) || 0)}
                      className="training-injury-input"
                    />
                  </label>
                  <label className="training-injury-input-group">
                    <span className="training-injury-input-label">Stiffness:</span>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={fingerData[finger.id].stiffness}
                      onChange={(e) => updateFinger(finger.id, "stiffness", parseInt(e.target.value) || 0)}
                      className="training-injury-input"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Elbow Pain */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Elbow Pain (0-10)</h3>
          <div className="training-injury-simple-grid">
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Left Elbow:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={elbowPain.left}
                onChange={(e) => setElbowPain(prev => ({ ...prev, left: parseInt(e.target.value) || 0 }))}
                className="training-injury-input"
              />
            </label>
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Right Elbow:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={elbowPain.right}
                onChange={(e) => setElbowPain(prev => ({ ...prev, right: parseInt(e.target.value) || 0 }))}
                className="training-injury-input"
              />
            </label>
          </div>
        </div>

        {/* Shoulder Pain */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Shoulder Pain (0-10)</h3>
          <div className="training-injury-simple-grid">
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Left Shoulder:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={shoulderPain.left}
                onChange={(e) => setShoulderPain(prev => ({ ...prev, left: parseInt(e.target.value) || 0 }))}
                className="training-injury-input"
              />
            </label>
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Right Shoulder:</span>
              <input
                type="number"
                min="0"
                max="10"
                value={shoulderPain.right}
                onChange={(e) => setShoulderPain(prev => ({ ...prev, right: parseInt(e.target.value) || 0 }))}
                className="training-injury-input"
              />
            </label>
          </div>
        </div>

        {/* Morning Stiffness */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Morning Stiffness</h3>
          <p className="training-assessment-section-hint">How stiff are your fingers in the morning? (0 = none, 10 = very stiff)</p>
          <input
            type="range"
            min="0"
            max="10"
            value={morningStiffness}
            onChange={(e) => setMorningStiffness(parseInt(e.target.value))}
            className="training-injury-slider"
          />
          <div className="training-injury-slider-value">{morningStiffness} / 10</div>
        </div>

        {/* Additional Concerns */}
        <div className="training-assessment-section">
          <h3 className="training-assessment-section-title">Additional Concerns</h3>
          <p className="training-assessment-section-hint">Any other injuries, pain, or concerns we should know about?</p>
          <textarea
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Optional: describe any other concerns..."
            className="training-injury-textarea"
            rows={4}
          />
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
          onClick={handleContinue}
          className="training-center-cta"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
