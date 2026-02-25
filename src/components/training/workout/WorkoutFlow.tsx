"use client";

import { useMemo } from "react";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import { DrillCard } from "./DrillCard";
import { MaxHangLogger } from "./MaxHangLogger";
import { BoulderLogger } from "./BoulderLogger";
import { CampusLogger } from "./CampusLogger";
import { PullUpLogger } from "./PullUpLogger";
import { AntagonistLogger } from "./AntagonistLogger";
import { EasyClimbingLogger } from "./EasyClimbingLogger";
import { CoreLogger } from "./CoreLogger";
import { MobilityLogger } from "./MobilityLogger";
import { WarmupLogger } from "./WarmupLogger";
import { WorkoutSummary } from "./WorkoutSummary";
import type { DrillDefinition, DrillType } from "@/lib/plans/bouldering/types";

// Friendly label for drill types shown in the list
const DRILL_TYPE_LABEL: Record<DrillType, string> = {
  warmup: "Warm-up",
  max_hang: "Max Hangs",
  limit_boulder: "Limit Bouldering",
  campus: "Campus Board",
  pull_up: "Pull-ups",
  antagonist: "Antagonist Work",
  easy_climbing: "Easy Climbing",
  core: "Core",
  mobility: "Mobility",
};

function drillMeta(drill: DrillDefinition): string {
  const parts: string[] = [];
  if (drill.sets != null) {
    parts.push(`${drill.sets} sets`);
  }
  if (drill.reps != null) parts.push(`${drill.reps} reps`);
  if (drill.intensity != null) parts.push(drill.intensity);
  if (drill.restSeconds != null) parts.push(`${drill.restSeconds}s rest`);
  return parts.join(" · ");
}

export function WorkoutFlow() {
  const {
    phase,
    currentDrill,
    currentDrillIndex,
    session,
    drills,
    startTime,
    dispatch,
  } = useWorkout();

  const durationMinutes = useMemo(() => {
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime.getTime()) / 60000);
  }, [startTime]);

  // ── Drill list view ───────────────────────────────────────────────────────
  if (phase === "drill-list") {
    const completedCount = drills.filter((d) => d.completed).length;
    const totalCount = session.drills.length;
    const allDone = completedCount === totalCount;

    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">
            Session {session.label}: {session.title}
          </h2>
          <p className="training-assessment-subtitle">
            Complete drills in any order based on equipment availability.
          </p>
        </div>

        <div className="training-assessment-content">
          {/* Progress bar */}
          <div className="training-tasklist-progress">
            <div className="training-tasklist-progress-label">
              {completedCount} of {totalCount} drills complete
            </div>
            <div className="training-tasklist-progress-bar">
              <div
                className="training-tasklist-progress-fill"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* Drill list */}
          <div className="training-tasklist">
            {session.drills.map((drill, index) => {
              const done = drills[index]?.completed ?? false;
              const meta = drillMeta(drill);
              const typeLabel = DRILL_TYPE_LABEL[drill.type as DrillType] ?? drill.type;

              return (
                <div
                  key={drill.id}
                  className={`training-tasklist-item${done ? " training-tasklist-item--done" : ""}`}
                >
                  {/* Status icon */}
                  <div className="training-tasklist-status">
                    {done ? (
                      <span className="training-tasklist-check" aria-label="Complete">✓</span>
                    ) : (
                      <span className="training-tasklist-dot" aria-hidden="true" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="training-tasklist-info">
                    <div className="training-tasklist-title">{drill.name}</div>
                    <p className="training-tasklist-desc">{drill.description}</p>
                    <div className="training-tasklist-meta">
                      <span className="training-tasklist-time">🏋️ {typeLabel}</span>
                      {meta && (
                        <span className="training-tasklist-equipment">{meta}</span>
                      )}
                      {drill.isOptional && (
                        <span className="training-tasklist-optional-badge">Optional</span>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="training-tasklist-action">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "JUMP_TO_DRILL", payload: { drillIndex: index } })}
                      className={`training-tasklist-btn${done ? " training-tasklist-btn--redo" : ""}`}
                    >
                      {done ? "Redo" : "Start"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Finish session */}
        <div className="training-assessment-actions">
          <button
            type="button"
            onClick={() => dispatch({ type: "FINISH_WORKOUT" })}
            disabled={completedCount === 0}
            className="training-center-cta"
            style={{
              opacity: completedCount > 0 ? 1 : 0.45,
              cursor: completedCount > 0 ? "pointer" : "not-allowed",
            }}
          >
            {allDone
              ? "Finish session"
              : completedCount > 0
              ? `Finish session (${completedCount}/${totalCount} done)`
              : "Complete at least one drill to finish"}
          </button>
        </div>
      </div>
    );
  }

  // ── Workout summary ───────────────────────────────────────────────────────
  if (phase === "workout-summary") {
    return (
      <WorkoutSummary
        durationMinutes={durationMinutes || 1}
      />
    );
  }

  // ── Drill instructions view ───────────────────────────────────────────────
  if (!currentDrill) {
    return (
      <div className="training-workout-flow">
        <p>No drill selected.</p>
      </div>
    );
  }

  if (phase === "instructions") {
    return (
      <div>
        {/* Back link to drill list */}
        <button
          type="button"
          onClick={() => dispatch({ type: "BACK_TO_DRILL_LIST" })}
          className="training-workout-back-btn"
        >
          ← Back to session
        </button>
        <DrillCard
          drill={currentDrill}
          onBegin={() => dispatch({ type: "BEGIN_DRILL" })}
        />
      </div>
    );
  }

  // ── Logging views ─────────────────────────────────────────────────────────
  if (phase === "logging") {
    const onComplete = () => {
      dispatch({ type: "SHOW_DRILL_SUMMARY" });
    };

    switch (currentDrill.type as DrillType) {
      case "warmup":
        return <WarmupLogger drill={currentDrill} onComplete={onComplete} />;
      case "max_hang":
        return <MaxHangLogger drill={currentDrill} onComplete={onComplete} />;
      case "limit_boulder":
        return <BoulderLogger drill={currentDrill} onComplete={onComplete} />;
      case "campus":
        return <CampusLogger drill={currentDrill} onComplete={onComplete} />;
      case "pull_up":
        return <PullUpLogger drill={currentDrill} onComplete={onComplete} />;
      case "antagonist":
        return <AntagonistLogger drill={currentDrill} onComplete={onComplete} />;
      case "easy_climbing":
        return <EasyClimbingLogger drill={currentDrill} onComplete={onComplete} />;
      case "core":
        return <CoreLogger drill={currentDrill} onComplete={onComplete} />;
      case "mobility":
        return <MobilityLogger drill={currentDrill} onComplete={onComplete} />;
      default:
        return (
          <div className="training-workout-flow">
            <p>Unknown drill type: {currentDrill.type}</p>
            <button
              type="button"
              className="training-timer-btn"
              onClick={() =>
                dispatch({
                  type: "COMPLETE_DRILL",
                  payload: { drillIndex: currentDrillIndex, data: {} },
                })
              }
            >
              Skip drill
            </button>
          </div>
        );
    }
  }

  // Resting phase — show a minimal "back to list" option
  if (phase === "resting") {
    return (
      <div className="training-workout-flow">
        <p className="training-drill-summary-done">Rest period. Ready for your next drill?</p>
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => dispatch({ type: "SKIP_REST" })}
        >
          Continue drill
        </button>
        <button
          type="button"
          className="training-workout-back-btn"
          style={{ marginTop: "0.75rem" }}
          onClick={() => dispatch({ type: "BACK_TO_DRILL_LIST" })}
        >
          ← Back to session
        </button>
      </div>
    );
  }

  return (
    <div className="training-workout-flow">
      <p>Phase: {phase}</p>
    </div>
  );
}
