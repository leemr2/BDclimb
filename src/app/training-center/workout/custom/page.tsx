"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { useAuth } from "@/lib/firebase/auth";
import { useActiveProgram } from "@/lib/hooks/training/useActiveProgram";
import { drillCatalog, resolveDrills } from "@/lib/plans/bouldering/drills";
import { createWorkout } from "@/lib/firebase/training/bouldering-workouts";
import { getTrainingProfile, type TrainingProfile } from "@/lib/firebase/training/profile";
import { WorkoutProvider } from "@/components/training/workout/WorkoutProvider";
import { WorkoutFlow } from "@/components/training/workout/WorkoutFlow";
import type { ActiveProgram } from "@/lib/firebase/training/program";
import type { DrillType } from "@/lib/plans/bouldering/types";

// ─── Constants ──────────────────────────────────────────────────────────────

const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  warmup: "Warm-Up",
  max_hang: "Max Hangs",
  limit_boulder: "Limit Bouldering",
  campus: "Campus Board",
  pull_up: "Pull-Ups",
  antagonist: "Antagonist / Injury Prevention",
  easy_climbing: "Easy Climbing",
  core: "Core",
  mobility: "Mobility",
};

const DRILL_TYPE_ORDER: DrillType[] = [
  "warmup",
  "max_hang",
  "limit_boulder",
  "campus",
  "pull_up",
  "antagonist",
  "easy_climbing",
  "core",
  "mobility",
];

const DRILLS_BY_TYPE = DRILL_TYPE_ORDER.reduce<
  Record<DrillType, Array<{ id: string; name: string; description: string }>>
>(
  (acc, type) => {
    acc[type] = Object.values(drillCatalog)
      .filter((d) => d.type === type)
      .map((d) => ({ id: d.id, name: d.name, description: d.description }));
    return acc;
  },
  {} as Record<DrillType, Array<{ id: string; name: string; description: string }>>
);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProgramId(program: ActiveProgram): string {
  const start = program.startDate as { toMillis?: () => number };
  return (
    typeof start?.toMillis === "function" ? start.toMillis() : Number(start)
  ).toString();
}

function estimateDuration(drills: ReturnType<typeof resolveDrills>): number {
  return drills.reduce((sum, d) => {
    const mins: Record<DrillType, number> = {
      warmup: 20,
      max_hang: 20,
      limit_boulder: 30,
      campus: 20,
      pull_up: 15,
      antagonist: 10,
      easy_climbing: 40,
      core: 10,
      mobility: 15,
    };
    return sum + (mins[d.type] ?? 15);
  }, 0);
}

// ─── Phase 1: Drill picker ───────────────────────────────────────────────────

function DrillPickerPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleDrill = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleStart = () => {
    if (selected.size === 0) return;
    // Preserve category order when building the URL
    const orderedIds = DRILL_TYPE_ORDER.flatMap((type) =>
      (DRILLS_BY_TYPE[type] ?? [])
        .filter((d) => selected.has(d.id))
        .map((d) => d.id)
    );
    router.push(`/training-center/workout/custom?drills=${orderedIds.join(",")}`);
  };

  return (
    <div className="tc-custom-select-page">
      <Link href="/training-center" className="training-assessment-back-link">
        ← Training Home
      </Link>

      <header className="tc-custom-select-header">
        <h2 className="tc-custom-select-title">Build a Custom Workout</h2>
        <p className="tc-custom-select-subtitle">
          Choose the exercises you want for today&apos;s session, then tap{" "}
          <strong>Start Workout</strong>.
        </p>
      </header>

      <div className="tc-custom-select-groups">
        {DRILL_TYPE_ORDER.map((type) => {
          const drills = DRILLS_BY_TYPE[type];
          if (!drills || drills.length === 0) return null;
          return (
            <section key={type} className="tc-custom-select-group">
              <h3 className="tc-custom-select-group-label">
                {DRILL_TYPE_LABELS[type]}
              </h3>
              <div className="tc-custom-select-drill-grid">
                {drills.map((drill) => {
                  const checked = selected.has(drill.id);
                  return (
                    <label
                      key={drill.id}
                      className={`tc-custom-select-drill${checked ? " checked" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="tc-custom-select-checkbox"
                        checked={checked}
                        onChange={() => toggleDrill(drill.id)}
                      />
                      {checked && (
                        <span className="tc-custom-select-check-mark" aria-hidden="true">
                          ✓
                        </span>
                      )}
                      <div className="tc-custom-select-drill-info">
                        <span className="tc-custom-select-drill-name">
                          {drill.name}
                        </span>
                        <span className="tc-custom-select-drill-desc">
                          {drill.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Sticky footer */}
      <div className="tc-custom-select-footer">
        <span className="tc-custom-select-count">
          {selected.size > 0
            ? `${selected.size} exercise${selected.size !== 1 ? "s" : ""} selected`
            : "Select at least one exercise"}
        </span>
        <button
          type="button"
          onClick={handleStart}
          disabled={selected.size === 0}
          className="training-center-cta tc-custom-select-start"
        >
          Start Workout →
        </button>
      </div>
    </div>
  );
}

// ─── Phase 2: Workout preview + start ────────────────────────────────────────

function WorkoutStartPage({ drillIds }: { drillIds: string[] }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { program, loading: programLoading } = useActiveProgram();
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trainingProfile, setTrainingProfile] = useState<TrainingProfile | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !programLoading && user && !program) {
      router.replace("/training-center");
    }
  }, [authLoading, programLoading, user, program, router]);

  useEffect(() => {
    if (user) getTrainingProfile(user.uid).then(setTrainingProfile);
  }, [user?.uid]);

  const sessionWithDrills = useMemo(() => {
    const drills = resolveDrills(drillIds);
    if (!drills.length) return null;
    return {
      label: "custom",
      suggestedDay: "",
      title: "Custom Workout",
      intent: "User-selected exercises for today",
      estimatedDuration: estimateDuration(drills),
      drills,
    };
  }, [drillIds]);

  const handleStartWorkout = async () => {
    if (!user || !program || !sessionWithDrills) return;
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
        week: program.currentWeek,
        mesocycle: program.currentMesocycle,
        sessionLabel: "custom",
        sessionType: "Custom Workout",
        drills: initialDrills,
      });
      setWorkoutId(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start workout");
    } finally {
      setStarting(false);
    }
  };

  if (authLoading || programLoading) {
    return <div className="loading-container"><div>Loading…</div></div>;
  }

  if (!user || !program) return null;

  if (!sessionWithDrills) {
    return (
      <div className="training-assessment-screen">
        <p style={{ color: "rgba(255,255,255,0.6)" }}>
          None of those exercise IDs could be found.
        </p>
        <Link href="/training-center/workout/custom" className="training-center-cta">
          ← Back to picker
        </Link>
      </div>
    );
  }

  if (!workoutId) {
    return (
      <div className="training-assessment-screen">
        <Link
          href="/training-center/workout/custom"
          className="training-assessment-back-link"
        >
          ← Edit selection
        </Link>

        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Custom Workout</h2>
          <p className="training-assessment-subtitle">
            ~{sessionWithDrills.estimatedDuration} min ·{" "}
            {sessionWithDrills.drills.length} exercise
            {sessionWithDrills.drills.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="training-assessment-content">
          <div className="training-tasklist-section-label">
            Today&apos;s exercises
          </div>
          <div className="training-tasklist">
            {sessionWithDrills.drills.map((drill, i) => (
              <div key={drill.id} className="training-tasklist-item">
                <div className="training-tasklist-status">
                  <span className="training-tasklist-dot" aria-hidden="true" />
                </div>
                <div className="training-tasklist-info">
                  <div className="training-tasklist-title">{drill.name}</div>
                  <p className="training-tasklist-desc">{drill.description}</p>
                </div>
                <div className="training-tasklist-action">
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
                    #{i + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="training-assessment-actions">
          <Link
            href="/training-center/workout/custom"
            className="training-center-cta training-btn-secondary"
          >
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

// ─── Root: dispatch between phases ───────────────────────────────────────────

function CustomWorkoutContent() {
  const searchParams = useSearchParams();
  const rawDrills = searchParams.get("drills") ?? "";
  const drillIds = useMemo(
    () => rawDrills.split(",").filter(Boolean),
    [rawDrills]
  );

  if (drillIds.length === 0) {
    return <DrillPickerPage />;
  }

  return <WorkoutStartPage drillIds={drillIds} />;
}

export default function CustomWorkoutPage() {
  return (
    <Suspense fallback={<div className="loading-container"><div>Loading…</div></div>}>
      <CustomWorkoutContent />
    </Suspense>
  );
}
