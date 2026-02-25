"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { getWeekDefinition, getSessionWithDrills } from "@/lib/plans/bouldering/planEngine";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import { createWorkout } from "@/lib/firebase/training/bouldering-workouts";
import { getTrainingProfile, type TrainingProfile } from "@/lib/firebase/training/profile";
import { WorkoutProvider } from "@/components/training/workout/WorkoutProvider";
import { WorkoutFlow } from "@/components/training/workout/WorkoutFlow";

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

  const parsedSession = useMemo(() => {
    if (!sessionId) return null;
    // Parse format: week-{number}-session-{label} or legacy session-{label}
    const weekMatch = sessionId.match(/^week-(\d+)-session-(.+)$/);
    if (weekMatch) {
      return { weekNumber: parseInt(weekMatch[1], 10), sessionLabel: weekMatch[2] };
    }
    // Legacy format: assume current week
    const legacyMatch = sessionId.match(/^session-(.+)$/);
    if (legacyMatch) {
      return { weekNumber: program?.currentWeek ?? 1, sessionLabel: legacyMatch[1] };
    }
    return null;
  }, [sessionId, program]);

  const sessionWithDrills = useMemo(() => {
    if (!program || program.goalType !== "bouldering" || !parsedSession) return null;
    const weekDef = getWeekDefinition(program.frequency, parsedSession.weekNumber);
    if (!weekDef) return null;
    const session = weekDef.sessions.find((s) => s.label === parsedSession.sessionLabel);
    if (!session) return null;
    return getSessionWithDrills(session);
  }, [program, parsedSession]);

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
      const id = await createWorkout(user.uid, {
        programId,
        week: parsedSession.weekNumber,
        mesocycle: program.currentMesocycle,
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

  if (program.goalType !== "bouldering") {
    return (
      <div className="training-workout-placeholder">
        <p>This program type is not supported.</p>
        <Link href="/training-center/dashboard" className="training-center-cta">
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

        {/* Drill preview list */}
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
        session={sessionWithDrills}
        workoutId={workoutId}
        userId={user.uid}
        bodyweight={trainingProfile?.weight ?? 150}
        weightUnit={trainingProfile?.weightUnit ?? "lbs"}
      >
        <WorkoutFlow />
      </WorkoutProvider>
    </div>
  );
}
