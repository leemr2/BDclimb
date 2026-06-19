"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { getCompletedWorkoutsAll } from "@/lib/firebase/training/bouldering-workouts";
import { getCompletedWorkoutsAll as getPECompletedWorkoutsAll } from "@/lib/firebase/training/power-endurance-workouts";

type WorkoutSource = "bouldering" | "pe";

type WorkoutRow = {
  id: string;
  source: WorkoutSource;
  week: number;
  sessionLabel: string;
  sessionType: string;
  completedAt: { toDate?: () => Date; toMillis?: () => number };
  duration: number;
  rpe: number;
  srpe: number;
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      getCompletedWorkoutsAll(user.uid),
      getPECompletedWorkoutsAll(user.uid),
    ])
      .then(([bouldering, pe]) => {
        if (cancelled) return;
        const rows: WorkoutRow[] = [
          ...bouldering.map((w) => ({ ...w, source: "bouldering" as const })),
          ...pe.map((w) => ({ ...w, source: "pe" as const })),
        ] as unknown as WorkoutRow[];
        rows.sort((a, b) => {
          const aMs = a.completedAt?.toMillis?.() ?? 0;
          const bMs = b.completedAt?.toMillis?.() ?? 0;
          return bMs - aMs;
        });
        setWorkouts(rows);
      })
      .catch(() => {
        if (!cancelled) setWorkouts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user?.uid]);

  if (authLoading || !user) return null;

  function formatDate(completedAt: { toDate?: () => Date }) {
    const date = typeof completedAt?.toDate === "function" ? completedAt.toDate() : new Date();
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  }

  return (
    <div className="training-history">
      <div className="training-history-header">
        <Link href="/training-center" className="training-center-cta">
          Back to dashboard
        </Link>
        <h2 className="training-history-title">Workout history</h2>
      </div>
      {loading ? (
        <p className="training-history-loading">Loading…</p>
      ) : workouts.length === 0 ? (
        <p className="training-history-empty">No completed workouts yet.</p>
      ) : (
        <ul className="training-history-list">
          {workouts.map((w) => (
            <li key={w.id} className="training-history-item">
              <Link href={`/training-center/history/${w.id}?type=${w.source}`} className="training-history-link">
                <span className="training-history-date">{formatDate(w.completedAt)}</span>
                <span className="training-history-session">
                  Week {w.week} · Session {w.sessionLabel}: {w.sessionType}
                </span>
                <span className="training-history-meta">
                  {w.duration} min · RPE {w.rpe} · sRPE {w.srpe}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
