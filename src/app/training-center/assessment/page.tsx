"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { AssessmentFlow } from "@/components/training/assessment/AssessmentFlow";
import { createAssessment } from "@/lib/firebase/training/bouldering-assessments";
import { updateActiveProgram } from "@/lib/firebase/training/program";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";

export default function AssessmentPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleAssessmentComplete = async (
    assessmentData: Omit<BoulderingAssessment, "id" | "date">
  ) => {
    if (!user || !program) return;

    setSaving(true);
    setError(null);

    try {
      // Save assessment
      const programId = (program.startDate as { toMillis?: () => number })?.toMillis?.() 
        ? (program.startDate as { toMillis: () => number }).toMillis().toString()
        : Number(program.startDate).toString();

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

  if (authLoading || programLoading) {
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

  if (program.currentWeek > 0) {
    return (
      <div className="training-center-page">
        <div className="training-center-content">
          <h2>Assessment Already Complete</h2>
          <p>You've already completed your Week 0 baseline assessment and started Week 1.</p>
          <Link href="/training-center/dashboard" className="training-center-cta">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get training profile data
  const trainingProfile = (program as unknown as { trainingProfile?: { weight: number; weightUnit: "lbs" | "kg" } }).trainingProfile;
  const bodyweight = trainingProfile?.weight || 150; // fallback
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
