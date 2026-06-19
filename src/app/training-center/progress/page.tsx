"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { useTrainingProfile } from "@/lib/hooks/training/useTrainingProfile";
import { getAssessmentsForProgram } from "@/lib/firebase/training/bouldering-assessments";
import { getCompletedWorkouts } from "@/lib/firebase/training/bouldering-workouts";
import { getAssessmentsForProgram as getPEAssessmentsForProgram } from "@/lib/firebase/training/power-endurance-assessments";
import { getCompletedWorkouts as getCompletedPEWorkouts } from "@/lib/firebase/training/power-endurance-workouts";
import { getProgramId } from "@/lib/firebase/training/program";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";
import type { BoulderingAssessment } from "@/lib/plans/bouldering/types";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";
import type { PowerEnduranceWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import {
  buildMaxHangSeries,
  buildWeeklyLoadSeries,
  buildSendRateSeries,
} from "@/lib/calculations/chartSeries";
import {
  buildCruxSuccessRateSeries,
  buildFluencyStopSeries,
  buildIHERepsSeries,
  buildShoulderSymptomSeries,
} from "@/lib/calculations/peChartSeries";
import { MaxHangChart } from "@/components/training/progress/MaxHangChart";
import { LoadChart } from "@/components/training/progress/LoadChart";
import { SendRateChart } from "@/components/training/progress/SendRateChart";
import { AssessmentComparisonSection } from "@/components/training/progress/AssessmentComparisonSection";
import { CruxSuccessRateChart } from "@/components/training/progress/CruxSuccessRateChart";
import { FluencyStopChart } from "@/components/training/progress/FluencyStopChart";
import { IntermittentEnduranceChart } from "@/components/training/progress/IntermittentEnduranceChart";
import { ShoulderSymptomChart } from "@/components/training/progress/ShoulderSymptomChart";
import { PEAssessmentComparisonSection } from "@/components/training/progress/PEAssessmentComparisonSection";

export default function ProgressPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { profile: trainingProfile, loading: profileLoading } =
    useTrainingProfile();

  const isPE = program?.goalType === "route_power_endurance";
  const isBouldering = program?.goalType === "bouldering";

  const [assessments, setAssessments] = useState<BoulderingAssessment[]>([]);
  const [workouts, setWorkouts] = useState<
    Array<BoulderingWorkout & { id: string }>
  >([]);
  const [peAssessments, setPeAssessments] = useState<PowerEnduranceAssessment[]>(
    []
  );
  const [peWorkouts, setPeWorkouts] = useState<
    Array<PowerEnduranceWorkout & { id: string }>
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
    if (!user?.uid || !program) {
      setAssessments([]);
      setWorkouts([]);
      setPeAssessments([]);
      setPeWorkouts([]);
      return;
    }
    const programId = getProgramId(program);

    if (program.goalType === "bouldering") {
      setDataLoading(true);
      Promise.all([
        getAssessmentsForProgram(user.uid, programId),
        getCompletedWorkouts(user.uid, programId, 100),
      ])
        .then(([a, w]) => {
          setAssessments(a);
          setWorkouts(w);
        })
        .catch((e) => {
          console.error("Failed to load bouldering progress data", e);
          setAssessments([]);
          setWorkouts([]);
        })
        .finally(() => setDataLoading(false));
      return;
    }

    if (program.goalType === "route_power_endurance") {
      setDataLoading(true);
      Promise.all([
        getPEAssessmentsForProgram(user.uid, programId),
        getCompletedPEWorkouts(user.uid, programId, 100),
      ])
        .then(([a, w]) => {
          setPeAssessments(a);
          setPeWorkouts(w);
        })
        .catch((e) => {
          console.error("Failed to load power-endurance progress data", e);
          setPeAssessments([]);
          setPeWorkouts([]);
        })
        .finally(() => setDataLoading(false));
      return;
    }

    setAssessments([]);
    setWorkouts([]);
    setPeAssessments([]);
    setPeWorkouts([]);
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

  const cruxData = useMemo(
    () => buildCruxSuccessRateSeries(peAssessments, peWorkouts),
    [peAssessments, peWorkouts]
  );
  const fluencyData = useMemo(
    () => buildFluencyStopSeries(peWorkouts),
    [peWorkouts]
  );
  const iheData = useMemo(
    () => buildIHERepsSeries(peAssessments, peWorkouts),
    [peAssessments, peWorkouts]
  );
  const shoulderData = useMemo(
    () => buildShoulderSymptomSeries(peWorkouts),
    [peWorkouts]
  );

  if (authLoading || programLoading || profileLoading) {
    return (
      <div className="loading-container">
        <div>Loading…</div>
      </div>
    );
  }

  if (!user || !program) return null;

  if (!isBouldering && !isPE) {
    return (
      <div className="progress-page">
        <p>Progress charts are not available for this program yet.</p>
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
          {isPE
            ? `Week ${program.currentWeek} of 12 · Crux success rate, fluency, endurance, and shoulder-symptom trends across your program.`
            : `Week ${program.currentWeek} of 12 · Max hang, training load, and send rate trends across your program.`}
        </p>
      </header>

      {isWeekZero && (
        <div className="progress-week-zero-notice">
          Complete your{" "}
          <Link href="/training-center/assessment">baseline assessment</Link> to
          unlock progress tracking.
        </div>
      )}

      {isPE ? (
        <>
          <div className="progress-charts-grid">
            <CruxSuccessRateChart data={cruxData} loading={dataLoading} />
            <IntermittentEnduranceChart data={iheData} loading={dataLoading} />
            <FluencyStopChart data={fluencyData} loading={dataLoading} />
            <ShoulderSymptomChart data={shoulderData} loading={dataLoading} />
          </div>

          <PEAssessmentComparisonSection
            assessments={peAssessments}
            weightUnit={weightUnit}
          />
        </>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
