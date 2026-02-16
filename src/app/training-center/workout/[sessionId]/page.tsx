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
      <div className="training-workout-start">
        <h2 className="training-workout-start-title">
          Session {sessionWithDrills.label}: {sessionWithDrills.title}
        </h2>
        <p className="training-workout-start-meta">
          ~{sessionWithDrills.estimatedDuration} min · {sessionWithDrills.drills.length} drills
        </p>
        {error && <p className="error-message">{error}</p>}
        <button
          type="button"
          className="training-timer-btn"
          onClick={handleStartWorkout}
          disabled={starting}
        >
          {starting ? "Starting…" : "Start workout"}
        </button>
        <Link href="/training-center/dashboard" className="training-center-cta">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="training-workout-page">
      <div className="training-workout-page-header">
        <Link href="/training-center/dashboard" className="training-center-cta">
          Back to dashboard
        </Link>
        <span className="training-workout-page-session">
          Session {sessionWithDrills.label} · {sessionWithDrills.drills.length} drills
        </span>
      </div>
      <WorkoutProvider
        session={sessionWithDrills}
        workoutId={workoutId}
        userId={user.uid}
      >
        <WorkoutFlow />
      </WorkoutProvider>
    </div>
  );
}
