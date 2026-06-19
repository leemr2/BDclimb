"use client";

import { useMemo } from "react";
import {
  calcProfileScore,
  CLIMBING_AGE_LABELS,
  TRAINING_HISTORY_LABELS,
  INJURY_HISTORY_LABELS,
  type ClimbingAgeBand,
  type TrainingHistoryBand,
  type InjuryHistory,
} from "@/lib/plans/power-endurance/profileScore";

export interface ProfileScoreStepData {
  climbingAgeBand: ClimbingAgeBand;
  trainingHistoryBand: TrainingHistoryBand;
  injuryHistory: InjuryHistory;
}

interface ProfileScoreStepProps {
  /** Age already collected in the profile step — feeds Component 2 (recovery). */
  age: number;
  data: ProfileScoreStepData;
  onChange: (data: ProfileScoreStepData) => void;
  onSubmit: () => void;
  onBack: () => void;
}

const CLIMBING_AGE_ORDER: ClimbingAgeBand[] = [
  "lt1",
  "1to2",
  "2to5",
  "5to10",
  "10to20",
  "20plus",
];

const TRAINING_HISTORY_ORDER: TrainingHistoryBand[] = [
  "none",
  "occasional",
  "consistent1yr",
  "multiYear",
];

const INJURY_ORDER: InjuryHistory[] = [
  "none",
  "grade1_healed",
  "grade2_healed",
  "grade3plus",
  "active",
];

export function ProfileScoreStep({
  age,
  data,
  onChange,
  onSubmit,
  onBack,
}: ProfileScoreStepProps) {
  const score = useMemo(
    () =>
      calcProfileScore({
        climbingAgeBand: data.climbingAgeBand,
        age,
        trainingHistoryBand: data.trainingHistoryBand,
        injuryHistory: data.injuryHistory,
      }),
    [data, age]
  );

  const ceilingApplied = score.finalScore < score.rawScore;
  const isOlder = age >= 40;
  const isLowerTier = score.tier <= 2;

  return (
    <form
      className="training-onboarding-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <p className="training-frequency-intro">
        These questions set your structural readiness profile. It governs how
        fast your program progresses load and volume — independent of how strong
        you are today.
      </p>

      <div className="training-form-group">
        <label htmlFor="ps-climbing-age">
          How long have you climbed consistently?
        </label>
        <select
          id="ps-climbing-age"
          value={data.climbingAgeBand}
          onChange={(e) =>
            onChange({
              ...data,
              climbingAgeBand: e.target.value as ClimbingAgeBand,
            })
          }
          required
        >
          {CLIMBING_AGE_ORDER.map((band) => (
            <option key={band} value={band}>
              {CLIMBING_AGE_LABELS[band]}
            </option>
          ))}
        </select>
        <span className="training-tasklist-section-note">
          Consistent = 2+ sessions/week for at least 8 months a year.
        </span>
      </div>

      <div className="training-form-group">
        <label htmlFor="ps-training-history">
          Structured finger-training history
        </label>
        <select
          id="ps-training-history"
          value={data.trainingHistoryBand}
          onChange={(e) =>
            onChange({
              ...data,
              trainingHistoryBand: e.target.value as TrainingHistoryBand,
            })
          }
          required
        >
          {TRAINING_HISTORY_ORDER.map((band) => (
            <option key={band} value={band}>
              {TRAINING_HISTORY_LABELS[band]}
            </option>
          ))}
        </select>
        <span className="training-tasklist-section-note">
          Hangboard programs, campus board, structured interval blocks.
        </span>
      </div>

      <div className="training-form-group">
        <label htmlFor="ps-injury">Finger injury history</label>
        <select
          id="ps-injury"
          value={data.injuryHistory}
          onChange={(e) =>
            onChange({
              ...data,
              injuryHistory: e.target.value as InjuryHistory,
            })
          }
          required
        >
          {INJURY_ORDER.map((band) => (
            <option key={band} value={band}>
              {INJURY_HISTORY_LABELS[band]}
            </option>
          ))}
        </select>
        <span className="training-tasklist-section-note">
          A healed pulley injury permanently caps your readiness score — it
          reflects tissue reality, not current fitness.
        </span>
      </div>

      <div className="training-assessment-summary-card" style={{ marginTop: "0.5rem" }}>
        <h3 className="training-assessment-summary-label">Your readiness tier</h3>
        <p className="training-assessment-summary-value">
          Tier {score.tier} — {score.tierLabel}
        </p>
        <p className="training-assessment-summary-sub">
          Profile score {score.finalScore}/100
          {ceilingApplied
            ? ` (raw ${score.rawScore}, capped at ${score.injuryCeiling} by injury history)`
            : ""}
        </p>
      </div>

      {isOlder && (
        <p className="training-confirmation-note">
          At 40+, the 3-day plan is recommended as a default for recovery, even
          with high experience.
        </p>
      )}
      {isLowerTier && (
        <p className="training-confirmation-note">
          As a Tier {score.tier} athlete, finger sessions need a longer gap
          (3 days). On the 4-day plan, a Tuesday/Saturday layout is recommended.
        </p>
      )}

      <div className="training-assessment-actions" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          onClick={onBack}
          className="training-center-cta training-btn-secondary"
        >
          Back
        </button>
        <button type="submit" className="training-form-submit training-center-cta">
          Continue
        </button>
      </div>
    </form>
  );
}
