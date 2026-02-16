"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { usePlan } from "@/lib/hooks/training/usePlan";
import { getWeekDefinition } from "@/lib/plans/bouldering/planEngine";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";
import { DashboardHeader } from "@/components/training/dashboard/DashboardHeader";
import { TodayWorkoutCard } from "@/components/training/dashboard/TodayWorkoutCard";
import { WeekSchedule } from "@/components/training/dashboard/WeekSchedule";
import { KeyMetrics } from "@/components/training/dashboard/KeyMetrics";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { schedule } = usePlan(program);

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
      <div className="training-dashboard">
        <p>This program type is not supported yet. Go back to Training Center.</p>
      </div>
    );
  }

  const nextSession = schedule?.nextSession ?? null;
  const isWeekZero = program.currentWeek === 0;
  const weekOneFirstSession = isWeekZero
    ? getWeekDefinition(
        program.frequency as BoulderingFrequency,
        1
      )?.sessions[0] ?? null
    : null;

  return (
    <div className="training-dashboard">
      <DashboardHeader program={program} />
      {isWeekZero && (
        <div className="training-week-zero-cta">
          <h3 className="training-week-zero-title">Week 0: Baseline Assessment</h3>
          <p className="training-week-zero-text">
            Before starting Week 1, you'll complete a baseline assessment to establish your:
          </p>
          <ul className="training-week-zero-list">
            <li>Injury baseline (current pain/stiffness levels)</li>
            <li>Max finger strength (determines training loads)</li>
            <li>Limit boulder performance (send rate baseline)</li>
          </ul>
          <p className="training-week-zero-estimate">
            <strong>Time required:</strong> ~60 minutes
          </p>
          <Link
            href="/training-center/assessment"
            className="training-center-cta training-week-zero-start"
          >
            Start Baseline Assessment
          </Link>
          {weekOneFirstSession && (
            <p className="training-week-zero-try">
              Or preview the workout flow with a sample session:{" "}
              <Link
                href={`/training-center/workout/week-1-session-${weekOneFirstSession.label}`}
                className="training-week-zero-try-link"
              >
                Week 1 · Session {weekOneFirstSession.label}
              </Link>
            </p>
          )}
        </div>
      )}
      <TodayWorkoutCard 
        session={nextSession} 
        weekNumber={program.currentWeek}
      />
      <WeekSchedule schedule={schedule} />
      <KeyMetrics />
    </div>
  );
}
