"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { getWorkout } from "@/lib/firebase/training/bouldering-workouts";
import { getWorkout as getPEWorkout } from "@/lib/firebase/training/power-endurance-workouts";
import type { BoulderingWorkout } from "@/lib/firebase/training/bouldering-workouts";
import type { PowerEnduranceWorkout } from "@/lib/firebase/training/power-endurance-workouts";

type DisplayWorkout = BoulderingWorkout | PowerEnduranceWorkout;

export default function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [workout, setWorkout] = useState<DisplayWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setWorkoutId(p.workoutId));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !workoutId) return;
    let cancelled = false;
    setLoading(true);
    const type =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("type")
        : null;
    const resolve = async (): Promise<DisplayWorkout | null> => {
      if (type === "pe") return getPEWorkout(user.uid, workoutId);
      const boulder = await getWorkout(user.uid, workoutId);
      if (boulder) return boulder;
      // Fallback for links without a type param (e.g. older history links).
      return getPEWorkout(user.uid, workoutId);
    };
    resolve()
      .then((w) => {
        if (!cancelled) setWorkout(w);
      })
      .catch(() => {
        if (!cancelled) setWorkout(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid, workoutId]);

  if (authLoading || !user) return null;

  if (!workoutId || loading) {
    return (
      <div className="loading-container">
        <div>Loading…</div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="training-workout-placeholder">
        <p>Workout not found.</p>
        <Link href="/training-center/history" className="training-center-cta">
          Back to history
        </Link>
      </div>
    );
  }

  const completedAt = (workout.completedAt as { toDate?: () => Date } | null)?.toDate?.() ?? new Date();
  const dateStr = completedAt.toLocaleDateString(undefined, { dateStyle: "long" });

  return (
    <div className="training-workout-detail">
      <div className="training-workout-detail-header">
        <Link href="/training-center/history" className="training-center-cta">
          Back to history
        </Link>
        <h2 className="training-workout-detail-title">
          Session {workout.sessionLabel}: {workout.sessionType}
        </h2>
        <p className="training-workout-detail-date">{dateStr}</p>
        <p className="training-workout-detail-meta">
          {workout.duration} min · RPE {workout.rpe} · sRPE {workout.srpe} · Quality {workout.sessionQuality}/5
        </p>
      </div>
      <div className="training-workout-detail-drills">
        <h3>Drills</h3>
        {workout.drills.map((d, i) => (
          <div key={i} className="training-workout-detail-drill">
            <h4>{d.drillType} (order {d.order})</h4>
            {d.completed && (
              <pre className="training-workout-detail-data">
                {JSON.stringify(d.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
      {workout.notes && (
        <p className="training-workout-detail-notes">
          <strong>Notes:</strong> {workout.notes}
        </p>
      )}
    </div>
  );
}
