"use client";

import { useMemo } from "react";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import { DrillCard } from "./DrillCard";
import { MaxHangLogger, type PartialSetData } from "./MaxHangLogger";
import { MaxHangRetestLogger } from "./MaxHangRetestLogger";
import { BoulderLogger } from "./BoulderLogger";
import { CampusLogger } from "./CampusLogger";
import { PullUpLogger, type PullUpPartialSetData } from "./PullUpLogger";
import { AntagonistLogger } from "./AntagonistLogger";
import { EasyClimbingLogger } from "./EasyClimbingLogger";
import { CoreLogger } from "./CoreLogger";
import { MobilityLogger } from "./MobilityLogger";
import { WarmupLogger } from "./WarmupLogger";
import { ARCClimbingLogger } from "./ARCClimbingLogger";
import { FourByFourLogger } from "./FourByFourLogger";
import { IntervalsLogger } from "./IntervalsLogger";
import { IntermittentHangLogger } from "./IntermittentHangLogger";
import { CriticalForceLogger } from "./CriticalForceLogger";
import { CruxAfterFatigueLogger } from "./CruxAfterFatigueLogger";
import { RoutePracticeLogger } from "./RoutePracticeLogger";
import { ThresholdIntervalsLogger } from "./ThresholdIntervalsLogger";
import { WorkoutSummary } from "./WorkoutSummary";
import type { DrillDefinition, DrillType } from "@/lib/plans/bouldering/types";
import type { PEDrillDefinition, PEDrillType } from "@/lib/plans/power-endurance/types";

const BOULDERING_DRILL_LABEL: Record<DrillType, string> = {
  warmup: "Warm-up",
  max_hang: "Max Hangs",
  max_hang_retest: "Max Hang Retest",
  limit_boulder: "Limit Bouldering",
  campus: "Campus Board",
  pull_up: "Pull-ups",
  antagonist: "Antagonist Work",
  easy_climbing: "Easy Climbing",
  core: "Core",
  mobility: "Mobility",
};

const PE_DRILL_LABEL: Record<PEDrillType, string> = {
  warmup: "Warm-up",
  max_hang: "Max Hangs",
  max_hang_retest: "Max Hang Retest",
  pull_up: "Pull-ups",
  campus: "Campus Board",
  antagonist: "Antagonist Work",
  core: "Core",
  mobility: "Mobility",
  easy_climbing: "Easy Climbing",
  arc_climbing: "ARC Climbing",
  four_by_four: "Bouldering 4×4",
  intervals: "Route Intervals",
  intermittent_hang: "Intermittent Hang Endurance",
  critical_force: "Critical-Force Blocks",
  crux_after_fatigue: "Crux-After-Fatigue",
  route_practice: "Route Practice",
  threshold_intervals: "Threshold Intervals",
};

function drillMeta(drill: DrillDefinition | PEDrillDefinition): string {
  const parts: string[] = [];
  if (drill.sets != null) {
    parts.push(`${drill.sets} sets`);
  }
  if (drill.reps != null) parts.push(`${drill.reps} reps`);
  if (drill.intensity != null) parts.push(drill.intensity);
  if (drill.restSeconds != null) parts.push(`${drill.restSeconds}s rest`);
  return parts.join(" · ");
}

function drillTypeLabel(type: string, goalType: string): string {
  if (goalType === "route_power_endurance") {
    return PE_DRILL_LABEL[type as PEDrillType] ?? type;
  }
  return BOULDERING_DRILL_LABEL[type as DrillType] ?? type;
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
    bodyweight,
    weightUnit,
    progressionSuggestion,
    targetLoadForMaxHang,
    goalType,
  } = useWorkout();

  const durationMinutes = useMemo(() => {
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime.getTime()) / 60000);
  }, [startTime]);

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

          <div className="training-tasklist">
            {session.drills.map((drill, index) => {
              const done = drills[index]?.completed ?? false;
              const partial = !done && (drills[index]?.partial ?? false);
              const setsCompleted = drills[index]?.setsCompleted;
              const meta = drillMeta(drill);
              const typeLabel = drillTypeLabel(drill.type, goalType);

              return (
                <div
                  key={drill.id}
                  className={`training-tasklist-item${done ? " training-tasklist-item--done" : ""}${partial ? " training-tasklist-item--partial" : ""}`}
                >
                  <div className="training-tasklist-status">
                    {done ? (
                      <span className="training-tasklist-check" aria-label="Complete">✓</span>
                    ) : partial ? (
                      <span className="training-tasklist-partial-icon" aria-label="In progress">⏸</span>
                    ) : (
                      <span className="training-tasklist-dot" aria-hidden="true" />
                    )}
                  </div>

                  <div className="training-tasklist-info">
                    <div className="training-tasklist-title">{drill.name}</div>
                    <p className="training-tasklist-desc">{drill.description}</p>
                    <div className="training-tasklist-meta">
                      <span className="training-tasklist-time">🏋️ {typeLabel}</span>
                      {meta && (
                        <span className="training-tasklist-equipment">{meta}</span>
                      )}
                      {partial && setsCompleted != null && drill.sets != null && (
                        <span className="training-tasklist-partial-badge">
                          {setsCompleted}/{drill.sets} sets done
                        </span>
                      )}
                      {drill.isOptional && (
                        <span className="training-tasklist-optional-badge">Optional</span>
                      )}
                    </div>
                  </div>

                  <div className="training-tasklist-action">
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "JUMP_TO_DRILL", payload: { drillIndex: index } })}
                      className={`training-tasklist-btn${done ? " training-tasklist-btn--redo" : ""}${partial ? " training-tasklist-btn--resume" : ""}`}
                    >
                      {done ? "Redo" : partial ? "Resume" : "Start"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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

  if (phase === "workout-summary") {
    return (
      <WorkoutSummary
        durationMinutes={durationMinutes || 1}
      />
    );
  }

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

  if (phase === "logging") {
    const onComplete = () => {
      dispatch({ type: "SHOW_DRILL_SUMMARY" });
    };

    const currentDrillState = drills[currentDrillIndex];
    const resumeSet = currentDrillState?.setsCompleted ?? 0;
    const drillType = currentDrill.type;

    switch (drillType) {
      case "warmup":
        return <WarmupLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "max_hang": {
        const partialSets = (currentDrillState?.data?.partialSets as PartialSetData[] | undefined);
        return (
          <MaxHangLogger
            drill={currentDrill as DrillDefinition}
            targetLoad={targetLoadForMaxHang}
            bodyweight={bodyweight}
            weightUnit={weightUnit}
            initialSet={resumeSet}
            initialSetData={partialSets}
            progressionSuggestion={progressionSuggestion ?? undefined}
            onComplete={onComplete}
          />
        );
      }
      case "max_hang_retest":
        return (
          <MaxHangRetestLogger
            drill={currentDrill as DrillDefinition}
            onComplete={onComplete}
          />
        );
      case "limit_boulder":
        return <BoulderLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "campus":
        return <CampusLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "pull_up": {
        const partialSets = (currentDrillState?.data?.partialSets as PullUpPartialSetData[] | undefined);
        return (
          <PullUpLogger
            drill={currentDrill as DrillDefinition}
            initialSet={resumeSet}
            initialSetData={partialSets}
            onComplete={onComplete}
          />
        );
      }
      case "antagonist":
        return <AntagonistLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "easy_climbing":
        return <EasyClimbingLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "core":
        return <CoreLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "mobility":
        return <MobilityLogger drill={currentDrill as DrillDefinition} onComplete={onComplete} />;
      case "arc_climbing":
        return (
          <ARCClimbingLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "four_by_four":
        return (
          <FourByFourLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "intervals":
        return (
          <IntervalsLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "intermittent_hang":
        return (
          <IntermittentHangLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "critical_force":
        return (
          <CriticalForceLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "crux_after_fatigue":
        return (
          <CruxAfterFatigueLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "route_practice":
        return (
          <RoutePracticeLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      case "threshold_intervals":
        return (
          <ThresholdIntervalsLogger
            drill={currentDrill as PEDrillDefinition}
            onComplete={onComplete}
          />
        );
      default:
        return (
          <div className="training-workout-flow">
            <p>Unknown drill type: {drillType}</p>
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
