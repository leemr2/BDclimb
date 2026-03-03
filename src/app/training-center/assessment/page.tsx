"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { useTrainingProfile } from "@/lib/hooks/training/useTrainingProfile";
import { AssessmentFlow } from "@/components/training/assessment/AssessmentFlow";
import { AssessmentResultsView } from "@/components/training/assessment/AssessmentResultsView";
import {
  createAssessment,
  getAssessmentsForProgram,
} from "@/lib/firebase/training/bouldering-assessments";
import { updateActiveProgram } from "@/lib/firebase/training/program";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";

export default function AssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { profile: trainingProfile, loading: profileLoading } = useTrainingProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<BoulderingAssessment[]>([]);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);

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

  // Load existing assessments when the program is past Week 0
  useEffect(() => {
    if (!user || !program || program.currentWeek === 0) return;
    const programId = (program.startDate as { toMillis?: () => number })?.toMillis
      ? (program.startDate as { toMillis: () => number }).toMillis().toString()
      : String(program.startDate);
    setAssessmentsLoading(true);
    getAssessmentsForProgram(user.uid, programId)
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setAssessmentsLoading(false));
  }, [user?.uid, program?.currentWeek, program?.startDate]);

  const handleAssessmentComplete = async (
    assessmentData: Omit<BoulderingAssessment, "id" | "date">
  ) => {
    if (!user || !program) return;

    setSaving(true);
    setError(null);

    try {
      await createAssessment(user.uid, assessmentData);

      // Advance to Week 1
      await updateActiveProgram(user.uid, {
        currentWeek: 1,
        status: "active",
      });

      // Redirect to dashboard
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

  if (program.goalType !== "bouldering") {
    return (
      <div className="training-center-page">
        <div className="training-center-content">
          <p>Assessment is only available for bouldering programs.</p>
          <Link href="/training-center" className="training-center-cta">
            Back to Training Center
          </Link>
        </div>
      </div>
    );
  }

  // Past Week 0 — show results view instead of the assessment flow
  if (program.currentWeek > 0) {
    if (assessmentsLoading) {
      return (
        <div className="loading-container">
          <div>Loading results…</div>
        </div>
      );
    }

    const weightUnit = trainingProfile?.weightUnit ?? "lbs";

    return (
      <div className="training-assessment-screen">
        <Link href="/training-center" className="training-assessment-back-link">
          ← Training Home
        </Link>

        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Assessment Results</h2>
          <p className="training-assessment-subtitle">
            Week {program.currentWeek} of 12 · {assessments.length > 1 ? `${assessments.length} assessments` : "Baseline"}
          </p>
        </div>

        <div className="training-assessment-content">
          {assessments.length === 0 ? (
            <p style={{ color: "rgba(255,255,255,0.55)", textAlign: "center" }}>
              No assessment data found for this program.
            </p>
          ) : (
            <AssessmentResultsView
              assessments={assessments}
              weightUnit={weightUnit}
            />
          )}
        </div>

        <div className="training-assessment-actions">
          <Link href="/training-center" className="training-center-cta">
            Go to Training Center
          </Link>
        </div>
      </div>
    );
  }

  const bodyweight = trainingProfile?.weight || 150;
  const weightUnit = trainingProfile?.weightUnit || "lbs";

  const programId = (program.startDate as { toMillis?: () => number })?.toMillis?.() 
    ? (program.startDate as { toMillis: () => number }).toMillis().toString()
    : Number(program.startDate).toString();

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
      <AssessmentFlow
        programId={programId}
        bodyweight={bodyweight}
        weightUnit={weightUnit}
        onComplete={handleAssessmentComplete}
      />
    </div>
  );
}
