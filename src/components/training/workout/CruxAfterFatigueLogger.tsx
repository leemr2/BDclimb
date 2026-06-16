"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, CruxAfterFatigueData, CAFLimitingFactor } from "@/lib/plans/power-endurance/types";
import {
  buildCruxAfterFatigueData,
  buildCAFBenchmark,
  computeSessionCAFScore,
  evaluateCAFProgression,
} from "@/lib/plans/power-endurance/calculations";
import {
  CAFRoundForm,
  carryCAFSetupForward,
  createEmptyCAFRoundDraft,
  draftToCAFRound,
  type CAFRoundDraft,
} from "./CAFRoundForm";
import { RestTimer } from "./RestTimer";

export interface CruxAfterFatigueLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: CruxAfterFatigueData) => void;
}

type Phase = "logging" | "rest";

const LIMITING_FACTORS: { value: CAFLimitingFactor; label: string }[] = [
  { value: "forearm_pump", label: "Forearm pump" },
  { value: "finger_strength", label: "Finger strength" },
  { value: "power_explosiveness", label: "Power / explosiveness" },
  { value: "technical_execution", label: "Technical execution" },
  { value: "mental_focus", label: "Mental focus" },
  { value: "pacing_errors", label: "Pacing errors" },
];

export function CruxAfterFatigueLogger({ drill, onComplete }: CruxAfterFatigueLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills, cafBenchmark } = useWorkout();
  const resolved = drill.cafResolved;
  const roundCount = Math.max(1, resolved?.rounds ?? drill.sets ?? 5);
  const restMinutes = resolved?.restBetweenRoundsMinutes ?? 10;
  const restSeconds = restMinutes * 60;

  const assessmentBenchmark = useMemo(
    () =>
      cafBenchmark ??
      buildCAFBenchmark({
        entryGrade: resolved?.entryGrade ?? "5.9",
        entryMoves: resolved?.entryMoves ?? 20,
        cruxDescription: resolved?.cruxDescription ?? "",
        cruxGrade: resolved?.cruxGrade ?? "V2",
        cruxTotalMoves: resolved?.cruxTotalMoves ?? 8,
      }),
    [cafBenchmark, resolved]
  );

  // Week plan targets pre-fill each round; athlete can adjust for gym constraints.
  const sessionDefaults = useMemo(
    () =>
      buildCAFBenchmark({
        entryGrade: resolved?.entryGrade ?? assessmentBenchmark.entryGrade,
        entryMoves: resolved?.entryMoves ?? assessmentBenchmark.entryMoves,
        cruxDescription: assessmentBenchmark.cruxDescription,
        cruxGrade: resolved?.cruxGrade ?? assessmentBenchmark.cruxGrade,
        cruxTotalMoves: resolved?.cruxTotalMoves ?? assessmentBenchmark.cruxTotalMoves,
      }),
    [assessmentBenchmark, resolved]
  );

  const [phase, setPhase] = useState<Phase>("logging");
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [savedRoundCount, setSavedRoundCount] = useState(0);
  const [rounds, setRounds] = useState<CAFRoundDraft[]>(() =>
    Array.from({ length: roundCount }, () => createEmptyCAFRoundDraft(sessionDefaults))
  );

  // Keep round drafts aligned if resolved targets load after mount or round count changes.
  useEffect(() => {
    setRounds((prev) => {
      if (prev.length === roundCount) return prev;
      const next = [...prev];
      while (next.length < roundCount) {
        next.push(createEmptyCAFRoundDraft(sessionDefaults));
      }
      return next.slice(0, roundCount);
    });
  }, [roundCount, sessionDefaults]);

  const safeRoundIndex = Math.min(Math.max(0, activeRoundIndex), roundCount - 1);
  const currentRoundDraft = rounds[safeRoundIndex] ?? createEmptyCAFRoundDraft(sessionDefaults);
  const [limitingFactor, setLimitingFactor] =
    useState<CAFLimitingFactor>("forearm_pump");
  const [leadInPacing, setLeadInPacing] =
    useState<CruxAfterFatigueData["leadInPacing"]>("good");
  const [shakeRestManagement, setShakeRestManagement] =
    useState<CruxAfterFatigueData["shakeRestManagement"]>("good");

  const scoredRounds = rounds
    .slice(0, savedRoundCount)
    .filter((draft): draft is CAFRoundDraft => draft != null)
    .map(draftToCAFRound);
  const sessionScore = computeSessionCAFScore(scoredRounds);
  const progression = evaluateCAFProgression(
    savedRoundCount > 0
      ? [
          {
            successRate: Math.round(
              (scoredRounds.filter((r) => r.success).length / scoredRounds.length) * 100
            ),
            sessionCAFScore: sessionScore,
          },
        ]
      : []
  );

  const updateRound = (index: number, draft: CAFRoundDraft) => {
    setRounds((prev) => prev.map((r, i) => (i === index ? draft : r)));
  };

  const finishDrill = useCallback(
    (finalRounds: CAFRoundDraft[]) => {
      const scored = finalRounds.map(draftToCAFRound);
      const data = buildCruxAfterFatigueData(assessmentBenchmark, scored, {
        limitingFactor,
        leadInPacing,
        shakeRestManagement,
      });
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
    },
    [
      assessmentBenchmark,
      limitingFactor,
      leadInPacing,
      shakeRestManagement,
      currentDrillIndex,
      dispatch,
      drills,
      persistDrills,
      onComplete,
    ]
  );

  const handleSaveRound = () => {
    const roundJustSaved = safeRoundIndex;
    const nextSaved = savedRoundCount + 1;
    setSavedRoundCount(nextSaved);

    if (nextSaved < roundCount) {
      const completedRound = rounds[roundJustSaved];
      if (completedRound) {
        setRounds((prev) =>
          prev.map((round, i) =>
            i === nextSaved ? carryCAFSetupForward(completedRound, sessionDefaults) : round
          )
        );
      }
    }

    if (nextSaved >= roundCount) {
      finishDrill(rounds);
      return;
    }
    setPhase("rest");
  };

  const advanceAfterRest = () => {
    setActiveRoundIndex(savedRoundCount);
    setPhase("logging");
  };

  if (phase === "rest") {
    return (
      <div className="training-caf-log">
        <h4 className="training-caf-log-title">
          Rest — Round {activeRoundIndex + 1} complete
        </h4>
        <p className="training-caf-log-hint">
          Rest {restMinutes} min before round {activeRoundIndex + 2}
        </p>
        <RestTimer
          durationSeconds={restSeconds}
          nextUpLabel={`Round ${activeRoundIndex + 2}`}
          onComplete={advanceAfterRest}
          onSkip={advanceAfterRest}
        />
      </div>
    );
  }

  return (
    <div className="training-caf-log">
      <h4 className="training-caf-log-title">
        {drill.name} — Round {safeRoundIndex + 1} of {roundCount}
      </h4>
      {(cafBenchmark || resolved) && (
        <div className="training-caf-log-targets">
          {cafBenchmark && (
            <p className="training-caf-log-hint">
              Assessment baseline: {cafBenchmark.entryGrade} × {cafBenchmark.entryMoves} moves (ELS{" "}
              {cafBenchmark.baselineELS}) · Crux {cafBenchmark.cruxGrade} (
              {cafBenchmark.cruxTotalMoves} moves)
            </p>
          )}
          {resolved && (
            <p className="training-caf-log-hint">
              This week&apos;s target: {resolved.entryGrade} × {resolved.entryMoves} moves (ELS{" "}
              {resolved.targetELS}) · Crux {resolved.cruxGrade} ({resolved.cruxTotalMoves} moves)
            </p>
          )}
          <p className="training-caf-log-hint training-caf-log-targets-note">
            Adjust entry and crux below if gym routes differ from the prescription.
          </p>
        </div>
      )}

      {savedRoundCount > 0 && (
        <p className="training-caf-log-stats">
          Session score: {sessionScore}
          {scoredRounds.map((r, i) => (
            <span key={i}> · R{i + 1}: {r.roundScore}</span>
          ))}
        </p>
      )}

      {progression.message && (
        <p className="training-progression-inline">
          <span className="training-progression-inline-label">Progression: </span>
          {progression.message}
        </p>
      )}

      <CAFRoundForm
        roundIndex={safeRoundIndex}
        benchmark={sessionDefaults}
        value={currentRoundDraft}
        onChange={(draft) => updateRound(safeRoundIndex, draft)}
        footer={
          safeRoundIndex === roundCount - 1 ? (
            <div className="training-form-group">
              <label>
                Limiting factor
                <select
                  value={limitingFactor}
                  onChange={(e) => setLimitingFactor(e.target.value as CAFLimitingFactor)}
                  className="training-form-group input"
                >
                  {LIMITING_FACTORS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lead-in pacing
                <select
                  value={leadInPacing}
                  onChange={(e) =>
                    setLeadInPacing(e.target.value as CruxAfterFatigueData["leadInPacing"])
                  }
                  className="training-form-group input"
                >
                  <option value="too_fast">Too fast</option>
                  <option value="good">Good</option>
                  <option value="too_slow">Too slow</option>
                  <option value="inconsistent">Inconsistent</option>
                </select>
              </label>
              <label>
                Shake / rest management
                <select
                  value={shakeRestManagement}
                  onChange={(e) =>
                    setShakeRestManagement(
                      e.target.value as CruxAfterFatigueData["shakeRestManagement"]
                    )
                  }
                  className="training-form-group input"
                >
                  <option value="excellent">Excellent</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </label>
            </div>
          ) : null
        }
      />

      <button type="button" className="training-timer-btn" onClick={handleSaveRound}>
        {safeRoundIndex >= roundCount - 1 ? "Complete drill" : "Save round & rest"}
      </button>
    </div>
  );
}
