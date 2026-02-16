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
import type { DrillType } from "@/lib/plans/bouldering/types";

export function WorkoutFlow() {
  const {
    phase,
    currentDrill,
    currentDrillIndex,
    session,
    startTime,
    dispatch,
  } = useWorkout();

  const durationMinutes = useMemo(() => {
    if (!startTime) return 0;
    return Math.round((Date.now() - startTime.getTime()) / 60000);
  }, [startTime]);

  if (phase === "workout-summary") {
    return (
      <WorkoutSummary
        durationMinutes={durationMinutes || 1}
      />
    );
  }

  if (phase === "drill-summary") {
    return (
      <div className="training-drill-summary">
        <p className="training-drill-summary-done">Drill complete.</p>
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => dispatch({ type: "NEXT_DRILL" })}
        >
          Next drill
        </button>
      </div>
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
      <DrillCard
        drill={currentDrill}
        onBegin={() => dispatch({ type: "BEGIN_DRILL" })}
      />
    );
  }

  if (phase === "logging") {
    const onComplete = () => {
      dispatch({ type: "SHOW_DRILL_SUMMARY" });
    };

    switch (currentDrill.type as DrillType) {
      case "warmup":
        return (
          <WarmupLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "max_hang":
        return (
          <MaxHangLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "limit_boulder":
        return (
          <BoulderLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "campus":
        return (
          <CampusLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "pull_up":
        return (
          <PullUpLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "antagonist":
        return (
          <AntagonistLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "easy_climbing":
        return (
          <EasyClimbingLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "core":
        return (
          <CoreLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      case "mobility":
        return (
          <MobilityLogger
            drill={currentDrill}
            onComplete={() => onComplete()}
          />
        );
      default:
        return (
          <div className="training-workout-flow">
            <p>Unknown drill type: {currentDrill.type}</p>
            <button
              type="button"
              className="training-timer-btn"
              onClick={() => dispatch({ type: "COMPLETE_DRILL", payload: { drillIndex: currentDrillIndex, data: {} } })}
            >
              Skip drill
            </button>
          </div>
        );
    }
  }

  return (
    <div className="training-workout-flow">
      <p>Phase: {phase}</p>
    </div>
  );
}
