"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, IntervalsData } from "@/lib/plans/power-endurance/types";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface IntervalsLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: IntervalsData) => void;
}

type IntervalDraft = IntervalsData["sets"][number]["intervals"][number];

export function IntervalsLogger({ drill, onComplete }: IntervalsLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const intervalCount = typeof drill.reps === "number" ? drill.reps : 4;
  const workSeconds = 60;
  const restSeconds = drill.restSeconds ?? 90;

  const [intervals, setIntervals] = useState<IntervalDraft[]>(
    Array.from({ length: intervalCount }, () => ({
      workTimeSeconds: workSeconds,
      terrainRoute: "",
      intensityRPE: 8,
      pumpLevel: 6,
      completed: true,
      restAfterSeconds: restSeconds,
      notes: "",
    }))
  );
  const [pacingAssessment, setPacingAssessment] =
    useState<IntervalsData["pacingAssessment"]>("good_pacing");
  const [recoveryBetweenIntervals, setRecoveryBetweenIntervals] =
    useState<IntervalsData["recoveryBetweenIntervals"]>("adequate");
  const [powerMaintenance, setPowerMaintenance] =
    useState<IntervalsData["powerMaintenance"]>("good_early_slight_decline");
  const [progressionDecision, setProgressionDecision] =
    useState<IntervalsData["progressionDecision"]>("maintain");

  const handleSubmit = () => {
    const attempted = intervals.length;
    const completed = intervals.filter((i) => i.completed).length;
    const data: IntervalsData = {
      sets: [
        {
          intervals,
          restBetweenSetsMinutes: 5,
        },
      ],
      totalIntervalsAttempted: attempted,
      totalIntervalsCompleted: completed,
      completionRate: attempted > 0 ? Math.round((completed / attempted) * 100) : 0,
      pacingAssessment,
      recoveryBetweenIntervals,
      powerMaintenance,
      progressionDecision,
    };
    dispatch({
      type: "COMPLETE_DRILL",
      payload: { drillIndex: currentDrillIndex, data: data as unknown as Record<string, unknown> },
    });
    const nextDrills = [...drills];
    nextDrills[currentDrillIndex] = {
      ...nextDrills[currentDrillIndex],
      completed: true,
      data: data as unknown as Record<string, unknown>,
      completedAt: Timestamp.now(),
    };
    persistDrills(nextDrills);
    onComplete(data);
  };

  return (
    <div className="training-intervals-log">
      <h4 className="training-intervals-log-title">{drill.name}</h4>
      <p className="training-intervals-log-hint">
        {intervalCount} intervals · {workSeconds}s work / {restSeconds}s rest
      </p>

      {intervals.map((interval, i) => (
        <div key={i} className="training-intervals-log-item">
          <h5>Interval {i + 1}</h5>
          <label>
            Route / terrain
            <input
              type="text"
              value={interval.terrainRoute}
              onChange={(e) => {
                const next = [...intervals];
                next[i] = { ...next[i], terrainRoute: e.target.value };
                setIntervals(next);
              }}
              className="training-form-group input"
            />
          </label>
          <NumberSlider
            label="Intensity RPE"
            value={interval.intensityRPE}
            onChange={(v) => {
              const next = [...intervals];
              next[i] = { ...next[i], intensityRPE: v };
              setIntervals(next);
            }}
            min={6}
            max={10}
          />
          <NumberSlider
            label="Pump level"
            value={interval.pumpLevel}
            onChange={(v) => {
              const next = [...intervals];
              next[i] = { ...next[i], pumpLevel: v };
              setIntervals(next);
            }}
            min={1}
            max={10}
          />
          <label>
            <input
              type="checkbox"
              checked={interval.completed}
              onChange={(e) => {
                const next = [...intervals];
                next[i] = { ...next[i], completed: e.target.checked };
                setIntervals(next);
              }}
            />
            {" "}Completed
          </label>
        </div>
      ))}

      <div className="training-form-group">
        <label>
          Pacing assessment
          <select
            value={pacingAssessment}
            onChange={(e) =>
              setPacingAssessment(e.target.value as IntervalsData["pacingAssessment"])
            }
            className="training-form-group input"
          >
            <option value="started_too_hard">Started too hard</option>
            <option value="good_pacing">Good pacing</option>
            <option value="started_conservative_finished_strong">
              Started conservative, finished strong
            </option>
            <option value="other">Other</option>
          </select>
        </label>
        <label>
          Recovery between intervals
          <select
            value={recoveryBetweenIntervals}
            onChange={(e) =>
              setRecoveryBetweenIntervals(
                e.target.value as IntervalsData["recoveryBetweenIntervals"]
              )
            }
            className="training-form-group input"
          >
            <option value="adequate">Adequate</option>
            <option value="borderline">Borderline</option>
            <option value="insufficient">Insufficient</option>
            <option value="too_much">Too much</option>
          </select>
        </label>
        <label>
          Power maintenance
          <select
            value={powerMaintenance}
            onChange={(e) =>
              setPowerMaintenance(e.target.value as IntervalsData["powerMaintenance"])
            }
            className="training-form-group input"
          >
            <option value="explosive_throughout">Explosive throughout</option>
            <option value="good_early_slight_decline">Good early, slight decline</option>
            <option value="moderate_decline">Moderate decline</option>
            <option value="significant_dropoff">Significant dropoff</option>
          </select>
        </label>
      </div>

      <button type="button" className="training-timer-btn" onClick={handleSubmit}>
        Complete drill
      </button>
    </div>
  );
}
