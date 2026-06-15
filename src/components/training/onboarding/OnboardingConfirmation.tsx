"use client";

import type { TrainingProfileFormData } from "./TrainingProfileForm";
import type { FrequencyOption } from "./FrequencySelector";
import type { GoalType } from "@/lib/firebase/training/program";

interface OnboardingConfirmationProps {
  profile: TrainingProfileFormData;
  frequency: FrequencyOption;
  goalType: GoalType;
  goalLabel: string;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function OnboardingConfirmation({
  profile,
  frequency,
  goalType,
  goalLabel,
  onConfirm,
  isSubmitting,
}: OnboardingConfirmationProps) {
  const programName =
    goalType === "route_power_endurance"
      ? "power-endurance"
      : "bouldering";

  return (
    <div className="training-onboarding-confirmation">
      <h3 className="training-confirmation-title">Summary</h3>
      <dl className="training-confirmation-list">
        <dt>Program</dt>
        <dd>{goalLabel}</dd>
        <dt>Age</dt>
        <dd>{profile.age}</dd>
        <dt>Weight</dt>
        <dd>
          {profile.weight} {profile.weightUnit}
        </dd>
        <dt>Experience</dt>
        <dd className="capitalize">{profile.experienceLevel}</dd>
        {goalType === "route_power_endurance" ? (
          <>
            <dt>Current route</dt>
            <dd>{profile.currentRouteGrade}</dd>
            <dt>Goal route</dt>
            <dd>{profile.goalRouteGrade}</dd>
          </>
        ) : (
          <>
            <dt>Limit grade</dt>
            <dd>{profile.currentLimitGrade}</dd>
          </>
        )}
        <dt>Training days per week</dt>
        <dd>{frequency}</dd>
      </dl>
      <p className="training-confirmation-note">
        You&apos;ll start with a Week 0 assessment, then begin Week 1 of your
        12-week {programName} program.
      </p>
      <button
        type="button"
        className="training-form-submit training-center-cta"
        onClick={onConfirm}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Starting…" : "Start Program"}
      </button>
    </div>
  );
}
