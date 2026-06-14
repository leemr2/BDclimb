"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { useTrainingProfile } from "@/lib/hooks/training/useTrainingProfile";
import { getAssessmentsForProgram } from "@/lib/firebase/training/bouldering-assessments";
import { getCompletedWorkouts } from "@/lib/firebase/training/bouldering-workouts";
import { getProgramId } from "@/lib/firebase/training/program";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import {
  buildMaxHangSeries,
  buildWeeklyLoadSeries,
  buildSendRateSeries,
} from "@/lib/calculations/chartSeries";
import { MaxHangChart } from "@/components/training/progress/MaxHangChart";
import { LoadChart } from "@/components/training/progress/LoadChart";
import { SendRateChart } from "@/components/training/progress/SendRateChart";
import { AssessmentComparisonSection } from "@/components/training/progress/AssessmentComparisonSection";

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { profile: trainingProfile, loading: profileLoading } =
    useTrainingProfile();
  const [assessments, setAssessments] = useState<BoulderingAssessment[]>([]);
  const [workouts, setWorkouts] = useState<
    Array<BoulderingWorkout & { id: string }>
  >([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !programLoading && user && program === null) {
      router.replace("/training-center");
    }
  }, [authLoading, programLoading, user, program, router]);

  useEffect(() => {
    if (!user?.uid || !program || program.goalType !== "bouldering") {
      setAssessments([]);
      setWorkouts([]);
      return;
    }
    const programId = getProgramId(program);
    setDataLoading(true);
    Promise.all([
      getAssessmentsForProgram(user.uid, programId),
      getCompletedWorkouts(user.uid, programId, 100),
    ])
      .then(([a, w]) => {
        setAssessments(a);
        setWorkouts(w);
      })
      .catch(() => {
        setAssessments([]);
        setWorkouts([]);
      })
      .finally(() => setDataLoading(false));
  }, [user?.uid, program]);

  const frequency = (program?.frequency ?? 3) as BoulderingFrequency;
  const weightUnit = trainingProfile?.weightUnit ?? "lbs";

  const maxHangData = useMemo(
    () => buildMaxHangSeries(assessments, frequency),
    [assessments, frequency]
  );
  const loadData = useMemo(
    () => buildWeeklyLoadSeries(workouts, frequency),
    [workouts, frequency]
  );
  const sendRateData = useMemo(
    () => buildSendRateSeries(assessments, workouts),
    [assessments, workouts]
  );

  if (authLoading || programLoading || profileLoading) {
    return (
      <div className="loading-container">
        <div>Loading…</div>
      </div>
    );
  }

  if (!user || !program) return null;

  if (program.goalType !== "bouldering") {
    return (
      <div className="progress-page">
        <p>Progress charts are only available for bouldering programs.</p>
        <Link href="/training-center" className="training-center-cta">
          Back to Training Center
        </Link>
      </div>
    );
  }

  const isWeekZero = program.currentWeek === 0;

  return (
    <div className="progress-page">
      <Link href="/training-center" className="training-dashboard-back-link">
        ← Training Home
      </Link>

      <header className="progress-page-header">
        <h2 className="progress-page-title">Progress</h2>
        <p className="progress-page-subtitle">
          Week {program.currentWeek} of 12 · Max hang, training load, and send
          rate trends across your program.
        </p>
      </header>

      {isWeekZero && (
        <div className="progress-week-zero-notice">
          Complete your{" "}
          <Link href="/training-center/assessment">baseline assessment</Link> to
          unlock progress tracking.
        </div>
      )}

      <div className="progress-charts-grid">
        <MaxHangChart
          data={maxHangData}
          loading={dataLoading}
          weightUnit={weightUnit}
        />
        <LoadChart data={loadData} loading={dataLoading} />
        <SendRateChart data={sendRateData} loading={dataLoading} />
      </div>

      <AssessmentComparisonSection
        assessments={assessments}
        weightUnit={weightUnit}
      />
    </div>
  );
}
