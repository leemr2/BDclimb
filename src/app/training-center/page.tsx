"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import {
  getCompletedWorkoutsAll,
  type BoulderingWorkout,
} from "@/lib/firebase/training/bouldering-workouts";
import { ProfileCard } from "@/components/training/dashboard/ProfileCard";
import type { Timestamp } from "firebase/firestore";

const GOALS = [
  {
    id: "bouldering" as const,
    title: "Bouldering",
    description:
      "12-week periodized program: max strength, power/RFD, and peak performance. Guided workouts, assessments, and progress tracking.",
    href: "/training-center/onboarding?goal=bouldering",
    available: true,
  },
  {
    id: "route_endurance" as const,
    title: "Route Endurance",
    description:
      "Build endurance for longer routes. ARC training, 4x4s, and aerobic capacity work.",
    href: "#",
    available: false,
  },
  {
    id: "route_power" as const,
    title: "Route Power",
    description:
      "Power and anaerobic capacity for short, hard route efforts.",
    href: "#",
    available: false,
  },
  {
    id: "route_power_endurance" as const,
    title: "Route Power/Endurance",
    description:
      "Hybrid program for routes that demand both power and sustained effort.",
    href: "#",
    available: false,
  },
];

const MESOCYCLE_NAMES: Record<number, string> = {
  1: "Max Strength",
  2: "Power / RFD",
  3: "Performance",
};

const GOAL_LABELS: Record<string, string> = {
  bouldering: "Bouldering",
  route_endurance: "Route Endurance",
  route_power: "Route Power",
  route_power_endurance: "Route Power/Endurance",
};

function formatDate(ts: Timestamp | null): string {
  if (!ts) return "—";
  const date = new Date(ts.toMillis());
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function StatusMessage({ status }: { status: string }) {
  switch (status) {
    case "assessment":
      return <>Complete your baseline assessment to unlock Week 1.</>;
    case "active":
      return <>Program active — keep up the momentum.</>;
    case "deload":
      return <>Deload week — recovery is training too.</>;
    case "complete":
      return <>Program complete — time to pick a new goal!</>;
    default:
      return null;
  }
}

export default function TrainingCenterPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const [recentWorkouts, setRecentWorkouts] = useState<
    Array<BoulderingWorkout & { id: string }>
  >([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || programLoading) return;
    setWorkoutsLoading(true);
    getCompletedWorkoutsAll(user.uid, 5)
      .then(setRecentWorkouts)
      .catch(() => setRecentWorkouts([]))
      .finally(() => setWorkoutsLoading(false));
  }, [user, programLoading]);

  if (authLoading || programLoading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  // No active program → goal selection
  if (!program) {
    return (
      <div className="training-center-hub">
        <h2 className="training-center-hub-title">Choose your goal</h2>
        <p className="training-center-hub-subtitle">
          Select a 12-week program to get started. Complete the cycle, then pick
          a new goal.
        </p>
        <div className="training-center-goal-cards">
          {GOALS.map((goal) => (
            <div
              key={goal.id}
              className={`training-center-goal-card ${goal.available ? "available" : "coming-soon"}`}
            >
              {!goal.available && (
                <span className="training-center-goal-badge">Coming soon</span>
              )}
              <h3 className="training-center-goal-title">{goal.title}</h3>
              <p className="training-center-goal-description">
                {goal.description}
              </p>
              {goal.available ? (
                <Link
                  href={goal.href}
                  className="training-center-goal-cta training-center-cta"
                >
                  Start Bouldering Program
                </Link>
              ) : (
                <span className="training-center-goal-cta disabled">
                  Not available yet
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active program → training hub
  const isWeekZero = program.currentWeek === 0;
  const mesocycleName =
    MESOCYCLE_NAMES[program.currentMesocycle] ??
    `Mesocycle ${program.currentMesocycle}`;
  const goalLabel = GOAL_LABELS[program.goalType] ?? program.goalType;
  const progressPct = Math.min(
    100,
    Math.round((program.currentWeek / 12) * 100)
  );

  return (
    <div className="tc-home">
      {/* ── Program Status Card ─────────────────────────────── */}
      <section className="tc-program-card">
        <div className="tc-program-meta">
          <span className="tc-program-badge">{goalLabel}</span>
          {!isWeekZero && (
            <span className="tc-program-phase">{mesocycleName}</span>
          )}
        </div>

        <div className="tc-program-heading">
          <h2 className="tc-program-title">
            {isWeekZero
              ? "Week 0 — Baseline Assessment"
              : `Week ${program.currentWeek} of 12`}
          </h2>
          <p className="tc-program-status-text">
            <StatusMessage status={program.status} />
          </p>
        </div>

        {!isWeekZero && (
          <div className="tc-program-progress-wrap">
            <div
              className="tc-program-progress-bar"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}

        <Link
          href={
            isWeekZero
              ? "/training-center/assessment"
              : "/training-center/dashboard"
          }
          className="tc-program-cta training-center-cta"
        >
          {isWeekZero
            ? "Continue Assessment →"
            : "Start Next Workout →"}
        </Link>
      </section>

      {/* ── Quick Stats ──────────────────────────────────────── */}
      {!isWeekZero && (
        <section className="tc-stats-row">
          <div className="tc-stat-card">
            <span className="tc-stat-value">{program.currentWeek}</span>
            <span className="tc-stat-label">Current Week</span>
          </div>
          <div className="tc-stat-card">
            <span className="tc-stat-value">{program.currentMesocycle}</span>
            <span className="tc-stat-label">Mesocycle</span>
          </div>
          <div className="tc-stat-card">
            <span className="tc-stat-value">{recentWorkouts.length}</span>
            <span className="tc-stat-label">Sessions Logged</span>
          </div>
          <div className="tc-stat-card tc-stat-placeholder">
            <span className="tc-stat-value">—</span>
            <span className="tc-stat-label">Streak</span>
          </div>
        </section>
      )}

      {/* ── Content Grid ─────────────────────────────────────── */}
      <div className="tc-home-grid">

        {/* Recent Workouts */}
        <section className="tc-section tc-section--recent">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Recent Workouts</h3>
            <Link href="/training-center/history" className="tc-section-link">
              View all →
            </Link>
          </div>

          {workoutsLoading ? (
            <p className="tc-section-empty">Loading…</p>
          ) : recentWorkouts.length === 0 ? (
            <p className="tc-section-empty">
              No workouts logged yet.{" "}
              <Link
                href="/training-center/dashboard"
                className="tc-section-link"
              >
                Start your first session →
              </Link>
            </p>
          ) : (
            <div className="tc-workout-list">
              {recentWorkouts.slice(0, 3).map((w) => (
                <div key={w.id} className="tc-workout-item">
                  <div className="tc-workout-item-top">
                    <span className="tc-workout-item-label">
                      Week {w.week} · Session {w.sessionLabel}
                    </span>
                    <span className="tc-workout-item-date">
                      {formatDate(w.completedAt)}
                    </span>
                  </div>
                  <div className="tc-workout-item-meta">
                    {w.sessionType && <span>{w.sessionType}</span>}
                    {w.duration > 0 && (
                      <span>{formatDuration(w.duration)}</span>
                    )}
                    {w.rpe > 0 && <span>RPE {w.rpe}</span>}
                    {w.srpe > 0 && <span>sRPE {w.srpe}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Morning Check-in — Phase 3 */}
        <section className="tc-section tc-section--checkin">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Morning Check-in</h3>
            <span className="tc-phase-badge">Phase 3</span>
          </div>
          <div className="tc-placeholder">
            <div className="tc-placeholder-icon">📋</div>
            <p className="tc-placeholder-text">
              Daily check-ins will track sleep, soreness, and readiness so the
              program can flag recovery issues and auto-adjust load before it
              becomes an injury.
            </p>
          </div>
        </section>

        {/* Progress Charts — Phase 4 */}
        <section className="tc-section tc-section--progress">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Progress Charts</h3>
            <span className="tc-phase-badge">Phase 4</span>
          </div>
          <div className="tc-placeholder">
            <div className="tc-placeholder-bars" aria-hidden="true">
              <div className="tc-placeholder-bar" style={{ height: "40%" }} />
              <div className="tc-placeholder-bar" style={{ height: "60%" }} />
              <div className="tc-placeholder-bar" style={{ height: "50%" }} />
              <div className="tc-placeholder-bar" style={{ height: "75%" }} />
              <div className="tc-placeholder-bar" style={{ height: "65%" }} />
              <div className="tc-placeholder-bar" style={{ height: "85%" }} />
            </div>
            <p className="tc-placeholder-text">
              Visual progress: max hang strength, load progression, and boulder
              send rates charted across all 12 weeks.
            </p>
          </div>
        </section>

        {/* Assessment Results — Phase 3 */}
        <section className="tc-section tc-section--assessment">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Assessment Results</h3>
            <span className="tc-phase-badge">Phase 3</span>
          </div>
          <div className="tc-placeholder">
            <div className="tc-placeholder-icon">📊</div>
            <p className="tc-placeholder-text">
              Baseline and retest results: max finger strength (lbs), limit
              boulder send rate, and injury baseline. Retested at Week 4 and
              Week 12.
            </p>
            {!isWeekZero && (
              <Link
                href="/training-center/assessment"
                className="tc-placeholder-link"
              >
                View Assessment →
              </Link>
            )}
          </div>
        </section>

        {/* Safety Flags — Phase 3 */}
        <section className="tc-section tc-section--safety">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Safety &amp; Load Flags</h3>
            <span className="tc-phase-badge">Phase 3</span>
          </div>
          <div className="tc-placeholder">
            <div className="tc-placeholder-icon">🚦</div>
            <p className="tc-placeholder-text">
              Auto-calculated sRPE load trends, weekly load spikes, and finger
              pain flags surface here so you can catch overtraining before it
              causes injury.
            </p>
          </div>
        </section>

        {/* Training Profile */}
        <ProfileCard frequency={program.frequency} />

        {/* Education — Phase 4 */}
        <section className="tc-section tc-section--education">
          <div className="tc-section-header">
            <h3 className="tc-section-title">Education</h3>
            <span className="tc-phase-badge">Phase 4</span>
          </div>
          <div className="tc-placeholder">
            <div className="tc-placeholder-icon">📚</div>
            <p className="tc-placeholder-text">
              Training science articles unlocked at key milestones: why max
              strength comes first, the deload week explained, power/RFD phase
              overview, and more.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
