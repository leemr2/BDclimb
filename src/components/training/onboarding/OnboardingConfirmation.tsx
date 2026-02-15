"use client";

import type { TrainingProfileFormData } from "./TrainingProfileForm";
import type { FrequencyOption } from "./FrequencySelector";

interface OnboardingConfirmationProps {
  profile: TrainingProfileFormData;
  frequency: FrequencyOption;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export function OnboardingConfirmation({
  profile,
  frequency,
  onConfirm,
  isSubmitting,
}: OnboardingConfirmationProps) {
  return (
    <div className="training-onboarding-confirmation">
      <h3 className="training-confirmation-title">Summary</h3>
      <dl className="training-confirmation-list">
        <dt>Age</dt>
        <dd>{profile.age}</dd>
        <dt>Weight</dt>
        <dd>
          {profile.weight} {profile.weightUnit}
        </dd>
        <dt>Experience</dt>
        <dd className="capitalize">{profile.experienceLevel}</dd>
        <dt>Limit grade</dt>
        <dd>{profile.currentLimitGrade}</dd>
        <dt>Training days per week</dt>
        <dd>{frequency}</dd>
      </dl>
      <p className="training-confirmation-note">
        You&apos;ll start with a Week 0 assessment, then begin Week 1 of your
        12-week bouldering program.
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
