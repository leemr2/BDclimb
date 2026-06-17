"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import {
  saveTrainingProfile,
  saveProfileScore,
} from "@/lib/firebase/training/profile";
import { startProgram, type GoalType } from "@/lib/firebase/training/program";
import { TrainingProfileForm } from "@/components/training/onboarding/TrainingProfileForm";
import type { TrainingProfileFormData } from "@/components/training/onboarding/TrainingProfileForm";
import { FrequencySelector } from "@/components/training/onboarding/FrequencySelector";
import type { FrequencyOption } from "@/components/training/onboarding/FrequencySelector";
import { OnboardingConfirmation } from "@/components/training/onboarding/OnboardingConfirmation";
import { ProfileScoreStep } from "@/components/training/onboarding/ProfileScoreStep";
import type { ProfileScoreStepData } from "@/components/training/onboarding/ProfileScoreStep";
import {
  calcProfileScore,
  getProgressionParams,
} from "@/lib/plans/power-endurance/profileScore";

const STEP_PROFILE = 0;
const STEP_PROFILE_SCORE = 1;
const STEP_FREQUENCY = 2;
const STEP_CONFIRM = 3;

const defaultProfileScoreData: ProfileScoreStepData = {
  climbingAgeBand: "2to5",
  trainingHistoryBand: "occasional",
  injuryHistory: "none",
};

const SUPPORTED_GOALS: GoalType[] = ["bouldering", "route_power_endurance"];

const GOAL_LABELS: Record<string, string> = {
  bouldering: "Bouldering",
  route_power_endurance: "Route Power/Endurance",
};

const defaultBoulderingProfile: TrainingProfileFormData = {
  age: 0,
  weight: 0,
  weightUnit: "lbs",
  experienceLevel: "intermediate",
  currentLimitGrade: "V4",
};

const defaultPEProfile: TrainingProfileFormData = {
  age: 0,
  weight: 0,
  weightUnit: "lbs",
  experienceLevel: "intermediate",
  currentRouteGrade: "5.10a",
  goalRouteGrade: "5.11a",
};

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const goalParam = searchParams.get("goal");
  const goal = useMemo(
    () =>
      SUPPORTED_GOALS.includes(goalParam as GoalType)
        ? (goalParam as GoalType)
        : null,
    [goalParam]
  );

  const [step, setStep] = useState(STEP_PROFILE);
  const [profile, setProfile] = useState<TrainingProfileFormData>(defaultBoulderingProfile);
  const [profileScoreData, setProfileScoreData] = useState<ProfileScoreStepData>(
    defaultProfileScoreData
  );
  const [frequency, setFrequency] = useState<FrequencyOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPE = goal === "route_power_endurance";

  useEffect(() => {
    if (goal === "route_power_endurance") {
      setProfile(defaultPEProfile);
    } else if (goal === "bouldering") {
      setProfile(defaultBoulderingProfile);
    }
  }, [goal]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !goal) {
      router.replace("/training-center");
    }
  }, [authLoading, goal, router]);

  const handleConfirm = async () => {
    if (!user || frequency === null || !goal) return;
    setIsSubmitting(true);
    try {
      await saveTrainingProfile(user.uid, {
        age: profile.age,
        weight: profile.weight,
        weightUnit: profile.weightUnit,
        experienceLevel: profile.experienceLevel,
        ...(goal === "route_power_endurance"
          ? {
              currentRouteGrade: profile.currentRouteGrade ?? "5.10a",
              goalRouteGrade: profile.goalRouteGrade ?? "5.11a",
            }
          : { currentLimitGrade: profile.currentLimitGrade ?? "V4" }),
      });
      if (goal === "route_power_endurance") {
        const profileScore = calcProfileScore({
          climbingAgeBand: profileScoreData.climbingAgeBand,
          age: profile.age,
          trainingHistoryBand: profileScoreData.trainingHistoryBand,
          injuryHistory: profileScoreData.injuryHistory,
        });
        await saveProfileScore(user.uid, {
          profileScore,
          progressionParams: getProgressionParams(profileScore.tier),
        });
      }
      await startProgram(user.uid, goal, frequency);
      router.replace("/training-center/assessment");
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

  if (!user || !goal) {
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
              goalType={goal}
              data={profile}
              onChange={setProfile}
              onSubmit={() =>
                setStep(isPE ? STEP_PROFILE_SCORE : STEP_FREQUENCY)
              }
            />
          </>
        )}
        {step === STEP_PROFILE_SCORE && isPE && (
          <>
            <h2 className="training-onboarding-step-title">
              Your readiness profile
            </h2>
            <ProfileScoreStep
              age={profile.age}
              data={profileScoreData}
              onChange={setProfileScoreData}
              onSubmit={() => setStep(STEP_FREQUENCY)}
              onBack={() => setStep(STEP_PROFILE)}
            />
          </>
        )}
        {step === STEP_FREQUENCY && (
          <>
            <h2 className="training-onboarding-step-title">
              How many days per week?
            </h2>
            <button
              type="button"
              className="training-onboarding-back-step"
              onClick={() => setStep(isPE ? STEP_PROFILE_SCORE : STEP_PROFILE)}
            >
              ← Back
            </button>
            <FrequencySelector
              value={frequency}
              onChange={setFrequency}
              onSubmit={() => setStep(STEP_CONFIRM)}
            />
          </>
        )}
        {step === STEP_CONFIRM && frequency !== null && (
          <OnboardingConfirmation
            profile={profile}
            frequency={frequency}
            goalType={goal}
            goalLabel={GOAL_LABELS[goal] ?? goal}
            onConfirm={handleConfirm}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
