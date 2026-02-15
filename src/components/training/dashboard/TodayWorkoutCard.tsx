"use client";

import Link from "next/link";
import type { SessionDefinition } from "@/lib/plans/bouldering/types";

interface TodayWorkoutCardProps {
  session: SessionDefinition | null;
}

export function TodayWorkoutCard({ session }: TodayWorkoutCardProps) {
  if (!session) {
    return (
      <div className="training-today-card">
        <h3 className="training-today-title">Today&apos;s workout</h3>
        <p className="training-today-empty">
          No session scheduled for this week, or all sessions completed. Rest
          day or check your week schedule.
        </p>
      </div>
    );
  }

  return (
    <div className="training-today-card">
      <h3 className="training-today-title">Today&apos;s workout</h3>
      <p className="training-today-session-title">
        Session {session.label}: {session.title}
      </p>
      <p className="training-today-meta">
        ~{session.estimatedDuration} min · {session.intent}
      </p>
      <div className="training-today-actions">
        <Link
          href={`/training-center/workout/session-${session.label}`}
          className="training-today-start training-center-cta"
        >
          Start workout
        </Link>
        <span className="training-today-skip-hint">
          or mark as Rest day / Skip
        </span>
      </div>
    </div>
  );
}
