"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { useTrainingProfile } from "@/lib/hooks/training/useTrainingProfile";
import { AssessmentFlow } from "@/components/training/assessment/AssessmentFlow";
import { AssessmentResultsView } from "@/components/training/assessment/AssessmentResultsView";
import { PowerEnduranceAssessmentFlow } from "@/components/training/assessment/PowerEnduranceAssessmentFlow";
import { PowerEnduranceAssessmentResultsView } from "@/components/training/assessment/PowerEnduranceAssessmentResultsView";
import { AssessmentComparisonSection } from "@/components/training/progress/AssessmentComparisonSection";
import {
  createAssessment as createBoulderingAssessment,
  getAssessmentsForProgram as getBoulderingAssessments,
} from "@/lib/firebase/training/bouldering-assessments";
import {
  createAssessment as createPEAssessment,
  getAssessmentsForProgram as getPEAssessments,
} from "@/lib/firebase/training/power-endurance-assessments";
import { getProgramId, updateActiveProgram } from "@/lib/firebase/training/program";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";

const SUPPORTED_GOALS = ["bouldering", "route_power_endurance"] as const;

export default function AssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { profile: trainingProfile, loading: profileLoading } = useTrainingProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boulderingAssessments, setBoulderingAssessments] = useState<
    BoulderingAssessment[]
  >([]);
  const [peAssessments, setPeAssessments] = useState<PowerEnduranceAssessment[]>(
    []
  );
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

  const isPE = program?.goalType === "route_power_endurance";
  const isBouldering = program?.goalType === "bouldering";
  const isSupported =
    program &&
    SUPPORTED_GOALS.includes(program.goalType as (typeof SUPPORTED_GOALS)[number]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !programLoading && user && !program) {
      router.replace("/training-center");
    }
  }, [authLoading, programLoading, user, program, router]);

  useEffect(() => {
    if (!user || !program || program.currentWeek === 0 || !isSupported) return;
    const programId = getProgramId(program);
    setAssessmentsLoading(true);
    const load = isPE
      ? getPEAssessments(user.uid, programId).then(setPeAssessments)
      : getBoulderingAssessments(user.uid, programId).then(setBoulderingAssessments);

    load
      .catch(() => {
        if (isPE) setPeAssessments([]);
        else setBoulderingAssessments([]);
      })
      .finally(() => setAssessmentsLoading(false));
  }, [user?.uid, program, isPE, isSupported]);

  const handleBoulderingComplete = async (
    assessmentData: Omit<BoulderingAssessment, "id" | "date">
  ) => {
    if (!user || !program) return;
    setSaving(true);
    setError(null);
    try {
      await createBoulderingAssessment(user.uid, assessmentData);
      await updateActiveProgram(user.uid, { currentWeek: 1, status: "active" });
      router.push("/training-center/dashboard");
    } catch (e) {
      console.error("Failed to save assessment:", e);
      setError(e instanceof Error ? e.message : "Failed to save assessment");
      setSaving(false);
    }
  };

  const handlePEComplete = async (
    assessmentData: Omit<PowerEnduranceAssessment, "id" | "date">
  ) => {
    if (!user || !program) return;
    setSaving(true);
    setError(null);
    try {
      await createPEAssessment(user.uid, assessmentData);
      if (program.currentWeek === 0) {
        await updateActiveProgram(user.uid, { currentWeek: 1, status: "active" });
      }
      router.push("/training-center/dashboard");
    } catch (e) {
      console.error("Failed to save assessment:", e);
      setError(e instanceof Error ? e.message : "Failed to save assessment");
      setSaving(false);
    }
  };

  if (authLoading || programLoading || profileLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !program) {
    return null;
  }

  if (!isSupported) {
    return (
      <div className="training-center-page">
        <div className="training-center-content">
          <p>Assessment is not available for this program type yet.</p>
          <Link href="/training-center" className="training-center-cta">
            Back to Training Center
          </Link>
        </div>
      </div>
    );
  }

  const weightUnit = trainingProfile?.weightUnit ?? "lbs";
  const bodyweight = trainingProfile?.weight || 150;
  const programId = getProgramId(program);

  if (program.currentWeek > 0 && program.status !== "assessment") {
    if (assessmentsLoading) {
      return (
        <div className="loading-container">
          <div>Loading results…</div>
        </div>
      );
    }

    return (
      <div className="training-assessment-screen">
        <Link href="/training-center" className="training-assessment-back-link">
          ← Training Home
        </Link>
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Assessment Results</h2>
          <p className="training-assessment-subtitle">
            Week {program.currentWeek} of 12
          </p>
        </div>
        <div className="training-assessment-content">
          {isPE ? (
            peAssessments.length === 0 ? (
              <p style={{ color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
                No assessment data found for this program.
              </p>
            ) : (
              <PowerEnduranceAssessmentResultsView
                assessments={peAssessments}
                weightUnit={weightUnit}
              />
            )
          ) : boulderingAssessments.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
              No assessment data found for this program.
            </p>
          ) : (
            <>
              <AssessmentResultsView
                assessments={boulderingAssessments}
                weightUnit={weightUnit}
              />
              <AssessmentComparisonSection
                assessments={boulderingAssessments}
                weightUnit={weightUnit}
              />
            </>
          )}
        </div>
        <div className="training-assessment-actions">
          <Link href="/training-center/dashboard" className="training-center-cta">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (saving) {
    return (
      <div className="loading-container">
        <div>Saving assessment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="training-center-page">
        <div className="training-center-content">
          <h2>Error</h2>
          <p className="error-message">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="training-center-cta"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-center-page">
      {isPE ? (
        <PowerEnduranceAssessmentFlow
          programId={programId}
          week={program.currentWeek}
          bodyweight={bodyweight}
          weightUnit={weightUnit}
          onComplete={handlePEComplete}
        />
      ) : (
        <AssessmentFlow
          programId={programId}
          bodyweight={bodyweight}
          weightUnit={weightUnit}
          onComplete={handleBoulderingComplete}
        />
      )}
    </div>
  );
}
