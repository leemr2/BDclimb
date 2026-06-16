"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  getWeekDefinition as getBoulderingWeekDefinition,
  getSessionWithDrills as getBoulderingSessionWithDrills,
} from "@/lib/plans/bouldering/planEngine";
import {
  getWeekDefinition as getPEWeekDefinition,
  getSessionWithDrills as getPESessionWithDrills,
  type PEFrequency,
} from "@/lib/plans/power-endurance/planEngine";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import { createWorkout as createBoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import { createWorkout as createPEWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import { getLatestAssessment } from "@/lib/firebase/training/bouldering-assessments";
import { getAssessmentForWeek } from "@/lib/firebase/training/power-endurance-assessments";
import { getTrainingProfile, type TrainingProfile } from "@/lib/firebase/training/profile";
import { getTargetLoad } from "@/lib/calculations/metrics";
import {
  getCAFWorkoutBaseline,
  getIHEWorkingLoad,
} from "@/lib/plans/power-endurance/calculations";
import { WorkoutProvider } from "@/components/training/workout/WorkoutProvider";
import { WorkoutFlow } from "@/components/training/workout/WorkoutFlow";
import type { MaxHangAssessment } from "@/lib/plans/bouldering/types";
import type { CAFBenchmark } from "@/lib/plans/power-endurance/types";
import type { WorkoutSession } from "@/components/training/workout/WorkoutProvider";

function getProgramId(program: ActiveProgram): string {
  const start = program.startDate as { toMillis?: () => number };
  return (typeof start?.toMillis === "function" ? start.toMillis() : Number(start)).toString();
}

export default function WorkoutPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);
  const [targetLoadForMaxHang, setTargetLoadForMaxHang] = useState<number>(0);
  const [baselineMaxHang, setBaselineMaxHang] = useState<MaxHangAssessment | null>(null);
  const [cafBenchmark, setCafBenchmark] = useState<CAFBenchmark | null>(null);
  const [iheWorkingLoad, setIheWorkingLoad] = useState(0);
  const [maxHangReference, setMaxHangReference] = useState(0);

  const isPE = program?.goalType === "route_power_endurance";

  useEffect(() => {
    params.then((p) => setSessionId(p.sessionId));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !programLoading && user && !program) {
      router.replace("/training-center");
    }
  }, [authLoading, programLoading, user, program, router]);

  useEffect(() => {
    if (user) {
      getTrainingProfile(user.uid).then(setTrainingProfile);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !program) return;
    const programId = getProgramId(program);

    if (program.goalType === "bouldering") {
      getLatestAssessment(user.uid, programId)
        .then((assessment) => {
          const load = getTargetLoad(assessment, 0.87);
          setTargetLoadForMaxHang(load ?? 0);
          setBaselineMaxHang(assessment?.maxHang ?? null);
        })
        .catch(() => {
          setTargetLoadForMaxHang(0);
          setBaselineMaxHang(null);
        });
      return;
    }

    if (program.goalType === "route_power_endurance") {
      getAssessmentForWeek(user.uid, programId, 0)
        .then((week0) => {
          const benchmark = getCAFWorkoutBaseline(week0);
          setCafBenchmark(benchmark);
          const maxHang = week0?.fingerMaxStrength?.bestLoad ?? 0;
          setMaxHangReference(maxHang);
          setIheWorkingLoad(getIHEWorkingLoad(maxHang));
          setTargetLoadForMaxHang(maxHang > 0 ? Math.round(maxHang * 0.87) : 0);
          setBaselineMaxHang(week0?.fingerMaxStrength ?? null);
        })
        .catch(() => {
          setCafBenchmark(null);
          setMaxHangReference(0);
          setIheWorkingLoad(0);
          setTargetLoadForMaxHang(0);
          setBaselineMaxHang(null);
        });
    }
  }, [user?.uid, program?.startDate, program?.goalType]);

  const parsedSession = useMemo(() => {
    if (!sessionId) return null;
    const weekMatch = sessionId.match(/^week-(\d+)-session-(.+)$/);
    if (weekMatch) {
      return { weekNumber: parseInt(weekMatch[1], 10), sessionLabel: weekMatch[2] };
    }
    const legacyMatch = sessionId.match(/^session-(.+)$/);
    if (legacyMatch) {
      return { weekNumber: program?.currentWeek ?? 1, sessionLabel: legacyMatch[1] };
    }
    return null;
  }, [sessionId, program]);

  useEffect(() => {
    if (!program || !parsedSession || program.currentWeek === 0) return;
    if (parsedSession.weekNumber !== program.currentWeek) {
      router.replace(
        `/training-center/workout/week-${program.currentWeek}-session-${parsedSession.sessionLabel}`
      );
    }
  }, [program, parsedSession, router]);

  const sessionWithDrills = useMemo((): WorkoutSession | null => {
    if (!program || !parsedSession) return null;

    if (program.goalType === "bouldering") {
      const weekDef = getBoulderingWeekDefinition(program.frequency, parsedSession.weekNumber);
      if (!weekDef) return null;
      const session = weekDef.sessions.find((s) => s.label === parsedSession.sessionLabel);
      if (!session) return null;
      return getBoulderingSessionWithDrills(session);
    }

    if (program.goalType === "route_power_endurance") {
      const weekDef = getPEWeekDefinition(
        program.frequency as PEFrequency,
        parsedSession.weekNumber
      );
      if (!weekDef) return null;
      const session = weekDef.sessions.find((s) => s.label === parsedSession.sessionLabel);
      if (!session) return null;
      return getPESessionWithDrills(
        session,
        cafBenchmark,
        program.frequency as PEFrequency
      );
    }

    return null;
  }, [program, parsedSession, cafBenchmark]);

  const handleStartWorkout = async () => {
    if (!user || !program || !sessionWithDrills || !parsedSession) return;
    setStarting(true);
    setError(null);
    try {
      const programId = getProgramId(program);
      const initialDrills = sessionWithDrills.drills.map((d, i) => ({
        drillId: d.id,
        drillType: d.type,
        order: i,
        completed: false,
        data: {} as Record<string, unknown>,
        completedAt: Timestamp.now(),
      }));

      let weekDef;
      if (program.goalType === "route_power_endurance") {
        weekDef = getPEWeekDefinition(program.frequency as PEFrequency, program.currentWeek);
      } else {
        weekDef = getBoulderingWeekDefinition(program.frequency, program.currentWeek);
      }

      const createWorkout =
        program.goalType === "route_power_endurance" ? createPEWorkout : createBoulderingWorkout;

      const id = await createWorkout(user.uid, {
        programId,
        week: program.currentWeek,
        mesocycle: weekDef?.mesocycle ?? program.currentMesocycle,
        sessionLabel: sessionWithDrills.label,
        sessionType: sessionWithDrills.title,
        drills: initialDrills,
      });
      setWorkoutId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setStarting(false);
    }
  };

  if (authLoading || programLoading || !sessionId) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user || !program) return null;

  if (isPE && !cafBenchmark) {
    return (
      <div className="training-workout-placeholder">
        <p>Complete your Week 0 assessment before starting workouts.</p>
        <Link href="/training-center/assessment" className="training-center-cta">
          Go to assessment
        </Link>
        <Link href="/training-center/dashboard" className="training-center-cta training-btn-secondary">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!sessionWithDrills) {
    return (
      <div className="training-workout-placeholder">
        <p>Session not found for this week.</p>
        <Link href="/training-center/dashboard" className="training-center-cta">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (!workoutId) {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">
            Session {sessionWithDrills.label}: {sessionWithDrills.title}
          </h2>
          <p className="training-assessment-subtitle">
            ~{sessionWithDrills.estimatedDuration} min · {sessionWithDrills.intent}
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-tasklist-section-label">Today&apos;s drills</div>
          <div className="training-tasklist">
            {sessionWithDrills.drills.map((drill, i) => (
              <div key={drill.id} className="training-tasklist-item">
                <div className="training-tasklist-status">
                  <span className="training-tasklist-dot" aria-hidden="true" />
                </div>
                <div className="training-tasklist-info">
                  <div className="training-tasklist-title">{drill.name}</div>
                  <p className="training-tasklist-desc">{drill.description}</p>
                  {drill.isOptional && (
                    <span className="training-tasklist-optional-badge">Optional</span>
                  )}
                </div>
                <div className="training-tasklist-action">
                  <span className="training-tasklist-equipment" style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
                    #{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="training-assessment-actions">
          <Link href="/training-center/dashboard" className="training-center-cta training-btn-secondary">
            Back
          </Link>
          <button
            type="button"
            className="training-center-cta"
            onClick={handleStartWorkout}
            disabled={starting}
          >
            {starting ? "Starting…" : "Begin session"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-workout-page">
      <WorkoutProvider
        goalType={isPE ? "route_power_endurance" : "bouldering"}
        session={sessionWithDrills}
        workoutId={workoutId}
        userId={user.uid}
        bodyweight={trainingProfile?.weight ?? 150}
        weightUnit={trainingProfile?.weightUnit ?? "lbs"}
        targetLoadForMaxHang={targetLoadForMaxHang}
        programId={getProgramId(program)}
        workoutWeek={program.currentWeek}
        baselineMaxHang={baselineMaxHang}
        cafBenchmark={cafBenchmark}
        iheWorkingLoad={iheWorkingLoad}
        maxHangReference={maxHangReference}
      >
        <WorkoutFlow />
      </WorkoutProvider>
    </div>
  );
}
