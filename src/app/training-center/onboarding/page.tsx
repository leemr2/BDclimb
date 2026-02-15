"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { saveTrainingProfile } from "@/lib/firebase/training/profile";
import { startProgram } from "@/lib/firebase/training/program";
import { TrainingProfileForm } from "@/components/training/onboarding/TrainingProfileForm";
import type { TrainingProfileFormData } from "@/components/training/onboarding/TrainingProfileForm";
import { FrequencySelector } from "@/components/training/onboarding/FrequencySelector";
import type { FrequencyOption } from "@/components/training/onboarding/FrequencySelector";
import { OnboardingConfirmation } from "@/components/training/onboarding/OnboardingConfirmation";

const STEP_PROFILE = 0;
const STEP_FREQUENCY = 1;
const STEP_CONFIRM = 2;

const defaultProfile: TrainingProfileFormData = {
  age: 0,
  weight: 0,
  weightUnit: "lbs",
  experienceLevel: "intermediate",
  currentLimitGrade: "V4",
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(STEP_PROFILE);
  const [profile, setProfile] = useState<TrainingProfileFormData>(defaultProfile);
  const [frequency, setFrequency] = useState<FrequencyOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goal = searchParams.get("goal");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && goal !== "bouldering") {
      router.replace("/training-center");
    }
  }, [authLoading, goal, router]);

  const handleConfirm = async () => {
    if (!user || frequency === null) return;
    setIsSubmitting(true);
    try {
      await saveTrainingProfile(user.uid, {
        age: profile.age,
        weight: profile.weight,
        weightUnit: profile.weightUnit,
        experienceLevel: profile.experienceLevel,
        currentLimitGrade: profile.currentLimitGrade,
      });
      await startProgram(user.uid, "bouldering", frequency);
      router.replace("/training-center/dashboard");
    } catch (err) {
      console.error("Onboarding error:", err);
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (goal !== "bouldering") {
    return null;
  }

  return (
    <div className="training-onboarding">
      <Link href="/training-center" className="training-onboarding-back">
        ← Back to goals
      </Link>
      <div className="training-onboarding-steps">
        {step === STEP_PROFILE && (
          <>
            <h2 className="training-onboarding-step-title">
              Your training profile
            </h2>
            <TrainingProfileForm
              data={profile}
              onChange={setProfile}
              onSubmit={() => setStep(STEP_FREQUENCY)}
            />
          </>
        )}
        {step === STEP_FREQUENCY && (
          <>
            <h2 className="training-onboarding-step-title">
              How often will you train?
            </h2>
            <FrequencySelector
              value={frequency}
              onChange={setFrequency}
              onSubmit={() => setStep(STEP_CONFIRM)}
            />
          </>
        )}
        {step === STEP_CONFIRM && (
          <>
            <h2 className="training-onboarding-step-title">
              Ready to start
            </h2>
            <OnboardingConfirmation
              profile={profile}
              frequency={frequency!}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>
    </div>
  );
}
