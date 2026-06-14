"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { usePlan } from "@/lib/hooks/training/usePlan";
import { getWeekDefinition } from "@/lib/plans/bouldering/planEngine";
import type { BoulderingFrequency } from "@/lib/plans/bouldering/planEngine";
import { cancelProgram, getProgramId } from "@/lib/firebase/training/program";
import { getCompletedWorkouts } from "@/lib/firebase/training/bouldering-workouts";
import { getAssessmentsForProgram } from "@/lib/firebase/training/bouldering-assessments";
import { getKeyMetrics } from "@/lib/calculations/metrics";
import {
  getRecentMaxHangSessions,
  evaluateMaxHangProgression,
  type ProgressionSuggestion,
} from "@/lib/calculations/progression";
import { useMilestoneEducation } from "@/lib/hooks/training/useMilestoneEducation";
import { DashboardHeader } from "@/components/training/dashboard/DashboardHeader";
import { TodayWorkoutCard } from "@/components/training/dashboard/TodayWorkoutCard";
import { WeekSchedule } from "@/components/training/dashboard/WeekSchedule";
import { KeyMetrics } from "@/components/training/dashboard/KeyMetrics";
import { ProgressionCard } from "@/components/training/dashboard/ProgressionCard";
import { MilestoneModal } from "@/components/training/education/MilestoneModal";

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const { schedule } = usePlan(program);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [progressionSuggestion, setProgressionSuggestion] =
    useState<ProgressionSuggestion | null>(null);
  const [progressionLoading, setProgressionLoading] = useState(false);
  const [keyMetrics, setKeyMetrics] = useState<ReturnType<typeof getKeyMetrics> | null>(null);
  const [keyMetricsLoading, setKeyMetricsLoading] = useState(false);
  const [week12SessionLabels, setWeek12SessionLabels] = useState<string[]>([]);

  const milestone = useMilestoneEducation({
    program,
    userId: user?.uid,
    completedSessionLabelsForWeek12: week12SessionLabels,
  });

  async function handleCancelProgram() {
    if (!user || isCancelling) return;
    setIsCancelling(true);
    try {
      await cancelProgram(user.uid);
      router.replace("/training-center");
    } finally {
      setIsCancelling(false);
      setShowCancelConfirm(false);
    }
  }

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
    if (!user?.uid || !program || program.goalType !== "bouldering") {
      setProgressionSuggestion(null);
      return;
    }
    const programId = (program.startDate as { toMillis?: () => number })?.toMillis
      ? (program.startDate as { toMillis: () => number }).toMillis().toString()
      : String(program.startDate);
    setProgressionLoading(true);
    getCompletedWorkouts(user.uid, programId, 20)
      .then((workouts) => {
        const sessions = getRecentMaxHangSessions(workouts, 2);
        const chronological = [...sessions].reverse();
        setProgressionSuggestion(evaluateMaxHangProgression(chronological));
      })
      .catch(() => setProgressionSuggestion(null))
      .finally(() => setProgressionLoading(false));
  }, [user?.uid, program?.startDate, program?.goalType]);

  useEffect(() => {
    if (!user?.uid || !program || program.goalType !== "bouldering") {
      setKeyMetrics(null);
      return;
    }
    const programId = (program.startDate as { toMillis?: () => number })?.toMillis
      ? (program.startDate as { toMillis: () => number }).toMillis().toString()
      : String(program.startDate);
    setKeyMetricsLoading(true);
    Promise.all([
      getAssessmentsForProgram(user.uid, programId),
      getCompletedWorkouts(user.uid, programId, 100),
    ])
      .then(([assessments, workouts]) => {
        setKeyMetrics(getKeyMetrics(assessments, workouts));
      })
      .catch(() => setKeyMetrics(null))
      .finally(() => setKeyMetricsLoading(false));
  }, [user?.uid, program?.startDate, program?.goalType]);

  useEffect(() => {
    if (!user?.uid || !program || program.currentWeek < 12) {
      setWeek12SessionLabels([]);
      return;
    }
    const programId = getProgramId(program);
    getCompletedWorkouts(user.uid, programId, 100)
      .then((workouts) => {
        const labels = [
          ...new Set(
            workouts.filter((w) => w.week === 12).map((w) => w.sessionLabel)
          ),
        ];
        setWeek12SessionLabels(labels);
      })
      .catch(() => setWeek12SessionLabels([]));
  }, [user?.uid, program?.startDate, program?.currentWeek, program?.goalType]);

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
      <Link
        href="/training-center"
        className="training-dashboard-back-link"
      >
        ← Training Home
      </Link>
      <div className="training-dashboard-top-links">
        <Link href="/training-center/progress" className="training-dashboard-education-link">
          View progress
        </Link>
        <Link href="/training-center/education" className="training-dashboard-education-link">
          Education library
        </Link>
      </div>
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
      <KeyMetrics metrics={keyMetrics} loading={keyMetricsLoading} />
      {!isWeekZero && (
        <ProgressionCard
          suggestion={progressionSuggestion}
          loading={progressionLoading}
        />
      )}

      <div className="training-stop-cycle-wrap">
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="training-stop-cycle-btn"
        >
          Stop Training Cycle
        </button>
      </div>

      {showCancelConfirm && typeof window !== "undefined" && createPortal(
        <div
          className="training-cancel-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-dialog-title"
          onClick={(e) => { if (e.target === e.currentTarget && !isCancelling) setShowCancelConfirm(false); }}
        >
          <div className="training-cancel-dialog">
            <h3 id="cancel-dialog-title" className="training-cancel-dialog-title">
              Stop Training Cycle?
            </h3>
            <p className="training-cancel-dialog-body">
              Your progress through Week {program.currentWeek} will be saved to your history, but your active program will end. You can start a new cycle anytime.
            </p>
            <div className="training-cancel-dialog-actions">
              <button
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancelling}
                className="training-cancel-dialog-keep"
              >
                No, Keep Going
              </button>
              <button
                onClick={handleCancelProgram}
                disabled={isCancelling}
                className="training-cancel-dialog-confirm"
              >
                {isCancelling ? "Stopping…" : "Yes, Stop"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {milestone.meta && (
        <MilestoneModal
          meta={milestone.meta}
          open={milestone.isVisible}
          onDismiss={milestone.dismissForLater}
          onMarkRead={milestone.markRead}
        />
      )}
    </div>
  );
}
