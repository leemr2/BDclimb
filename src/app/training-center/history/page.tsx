"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { getCompletedWorkoutsAll } from "@/lib/firebase/training/bouldering-workouts";

type WorkoutRow = {
  id: string;
  sessionLabel: string;
  sessionType: string;
  completedAt: { toDate?: () => Date };
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
    getCompletedWorkoutsAll(user.uid)
      .then((list) => {
        if (!cancelled) setWorkouts(list as WorkoutRow[]);
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
        <Link href="/training-center/dashboard" className="training-center-cta">
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
              <Link href={`/training-center/history/${w.id}`} className="training-history-link">
                <span className="training-history-date">{formatDate(w.completedAt)}</span>
                <span className="training-history-session">
                  Session {w.sessionLabel}: {w.sessionType}
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
