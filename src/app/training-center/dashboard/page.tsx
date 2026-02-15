"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { usePlan } from "@/lib/hooks/training/usePlan";
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

  return (
    <div className="training-dashboard">
      <DashboardHeader program={program} />
      {isWeekZero && (
        <div className="training-week-zero-cta">
          <p>
            <strong>Week 0:</strong> Complete your baseline assessment to unlock
            Week 1. Assessment flow coming in Phase 3.
          </p>
        </div>
      )}
      <TodayWorkoutCard session={nextSession} />
      <WeekSchedule schedule={schedule} />
      <KeyMetrics />
    </div>
  );
}
