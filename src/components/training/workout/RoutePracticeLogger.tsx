"use client";

import { useState, useCallback } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, RoutePracticeData } from "@/lib/plans/power-endurance/types";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface RoutePracticeLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: RoutePracticeData) => void;
}

type RouteDraft = RoutePracticeData["routes"][number];

const SESSION_FOCUS: RoutePracticeData["sessionFocus"][] = [
  "learning_beta",
  "linking_sections",
  "redpoint_attempts",
  "fluency_rehearsal",
];

const YDS_GRADES = [
  "5.9",
  "5.10a",
  "5.10b",
  "5.10c",
  "5.10d",
  "5.11a",
  "5.11b",
  "5.11c",
  "5.11d",
  "5.12a",
  "5.12b",
  "5.12c",
  "5.12d",
  "5.13a",
];

export function RoutePracticeLogger({ drill, onComplete }: RoutePracticeLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const [sessionFocus, setSessionFocus] =
    useState<RoutePracticeData["sessionFocus"]>("redpoint_attempts");
  const [fluencyConstraintActive, setFluencyConstraintActive] = useState(true);
  const [routes, setRoutes] = useState<RouteDraft[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [draft, setDraft] = useState<RouteDraft>({
    routeName: "",
    grade: "5.11a",
    lengthMinutes: 8,
    style: "power_endurance",
    result: "fall",
    attempts: 1,
    highPoint: "",
    falls: 1,
    pumpAtCrux: 6,
    fluencyStopCount: 0,
    energyAtCrux: 5,
    keyObservations: "",
    betaChanges: "",
  });

  const addRoute = () => {
    setRoutes((prev) => [...prev, { ...draft }]);
    setDraft({
      routeName: "",
      grade: "5.11a",
      lengthMinutes: 8,
      style: "power_endurance",
      result: "fall",
      attempts: 1,
      highPoint: "",
      falls: 1,
      pumpAtCrux: 6,
      fluencyStopCount: 0,
      energyAtCrux: 5,
      keyObservations: "",
      betaChanges: "",
    });
    setEditingIndex(null);
  };

  const handleDone = useCallback(() => {
    const data: RoutePracticeData = {
      sessionFocus,
      fluencyConstraintActive,
      routes,
      projectTracking: null,
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
  }, [
    sessionFocus,
    fluencyConstraintActive,
    routes,
    currentDrillIndex,
    dispatch,
    drills,
    persistDrills,
    onComplete,
  ]);

  return (
    <div className="training-route-practice-log">
      <h4 className="training-route-practice-log-title">{drill.name}</h4>

      <div className="training-form-group">
        <label>
          Session focus
          <select
            value={sessionFocus}
            onChange={(e) =>
              setSessionFocus(e.target.value as RoutePracticeData["sessionFocus"])
            }
            className="training-form-group input"
          >
            {SESSION_FOCUS.map((f) => (
              <option key={f} value={f}>
                {f.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            checked={fluencyConstraintActive}
            onChange={(e) => setFluencyConstraintActive(e.target.checked)}
          />
          {" "}Fluency constraint active
        </label>
      </div>

      <ul className="training-boulder-log-list">
        {routes.map((r, i) => (
          <li key={i} className="training-boulder-log-item">
            <div
              className="training-boulder-log-summary"
              onClick={() => {
                setDraft(r);
                setEditingIndex(i);
              }}
              onKeyDown={() => {}}
              role="button"
              tabIndex={0}
            >
              <span className="training-boulder-log-summary-desc">
                {r.routeName || "Unnamed"} — {r.grade}
              </span>
              <span className="training-boulder-log-summary-meta">
                <span>{r.result}</span>
                <span>{r.attempts} attempts</span>
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className="training-boulder-log-add-form">
        <label>
          Route name
          <input
            type="text"
            value={draft.routeName}
            onChange={(e) => setDraft((d) => ({ ...d, routeName: e.target.value }))}
            className="training-form-group input"
          />
        </label>
        <label>
          Grade
          <select
            value={draft.grade}
            onChange={(e) => setDraft((d) => ({ ...d, grade: e.target.value }))}
            className="training-form-group input"
          >
            {YDS_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label>
          Result
          <select
            value={draft.result}
            onChange={(e) =>
              setDraft((d) => ({ ...d, result: e.target.value as RouteDraft["result"] }))
            }
            className="training-form-group input"
          >
            <option value="send">Send</option>
            <option value="fall">Fall</option>
            <option value="hang">Hang</option>
          </select>
        </label>
        <NumberSlider
          label="Fluency stops"
          value={draft.fluencyStopCount}
          onChange={(v) => setDraft((d) => ({ ...d, fluencyStopCount: v }))}
          min={0}
          max={20}
        />
        <NumberSlider
          label="Attempts"
          value={draft.attempts}
          onChange={(v) => setDraft((d) => ({ ...d, attempts: v }))}
          min={1}
          max={10}
        />
        <label>
          Notes
          <input
            type="text"
            value={draft.keyObservations}
            onChange={(e) => setDraft((d) => ({ ...d, keyObservations: e.target.value }))}
            className="training-form-group input"
          />
        </label>
        <button type="button" className="training-timer-btn" onClick={addRoute}>
          {editingIndex != null ? "Update burn" : "Add burn"}
        </button>
      </div>

      <button
        type="button"
        className="training-timer-btn"
        onClick={handleDone}
        disabled={routes.length === 0}
      >
        Complete drill
      </button>
    </div>
  );
}
