"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, FourByFourData } from "@/lib/plans/power-endurance/types";
import { RestTimer } from "./RestTimer";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface FourByFourLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: FourByFourData) => void;
}

type ProblemDraft = FourByFourData["problems"][number];

const GRADES = ["VB", "V0", "V1", "V2", "V3", "V4", "V5", "V6"];

export function FourByFourLogger({ drill, onComplete }: FourByFourLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills } = useWorkout();
  const roundCount = drill.sets ?? 2;
  const restMinutes = drill.restSeconds != null ? Math.round(drill.restSeconds / 60) : 10;

  const [step, setStep] = useState<"problems" | "rounds" | "rest" | "summary">("problems");
  const [problems, setProblems] = useState<ProblemDraft[]>(
    Array.from({ length: 4 }, () => ({
      description: "",
      grade: "V3",
      gradesbelowLimit: 3,
    }))
  );
  const [roundIndex, setRoundIndex] = useState(0);
  const [rounds, setRounds] = useState<FourByFourData["rounds"]>([]);
  const [falls, setFalls] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [recoveryFeel, setRecoveryFeel] = useState(3);
  const [lateRoundQuality, setLateRoundQuality] =
    useState<FourByFourData["lateRoundQuality"]>("maintained_form");
  const [problemSelectionFeedback, setProblemSelectionFeedback] =
    useState<FourByFourData["problemSelectionFeedback"]>("good");
  const [progressionDecision, setProgressionDecision] =
    useState<FourByFourData["progressionDecision"]>("maintain");
  const [pumpByRound, setPumpByRound] = useState<number[]>([]);
  const [pumpLevel, setPumpLevel] = useState(5);

  const totalFallsRound = falls.reduce((a, b) => a + b, 0);
  const highFallsWarning = roundIndex === 0 && totalFallsRound >= 4;

  const finishDrill = (allRounds: FourByFourData["rounds"]) => {
    const totalFalls = allRounds.reduce((s, r) => s + r.totalFalls, 0);
    const data: FourByFourData = {
      problems,
      rounds: allRounds,
      roundsCompleted: allRounds.length,
      totalFalls,
      lateRoundQuality,
      problemSelectionFeedback,
      pumpByRound,
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

  const handleSaveRound = () => {
    const round = {
      problemFalls: falls,
      totalFalls: totalFallsRound,
      recoveryFeel,
      restAfterMinutes: restMinutes,
    };
    const nextRounds = [...rounds, round];
    const nextPump = [...pumpByRound, pumpLevel];
    setPumpByRound(nextPump);

    if (roundIndex + 1 >= roundCount) {
      setRounds(nextRounds);
      setStep("summary");
      return;
    }
    setRounds(nextRounds);
    setRoundIndex((i) => i + 1);
    setFalls([0, 0, 0, 0]);
    setRecoveryFeel(3);
    setPumpLevel(5);
    setStep("rest");
  };

  if (step === "rest") {
    return (
      <div className="training-four-by-four-log">
        <h4 className="training-four-by-four-log-title">Rest between rounds</h4>
        <RestTimer
          durationSeconds={restMinutes * 60}
          nextUpLabel={`Round ${roundIndex + 2}`}
          onComplete={() => setStep("rounds")}
          onSkip={() => setStep("rounds")}
        />
      </div>
    );
  }

  if (step === "summary") {
    return (
      <div className="training-four-by-four-log">
        <h4 className="training-four-by-four-log-title">Session summary</h4>
        <div className="training-form-group">
          <label>
            Late-round quality
            <select
              value={lateRoundQuality}
              onChange={(e) =>
                setLateRoundQuality(e.target.value as FourByFourData["lateRoundQuality"])
              }
              className="training-form-group input"
            >
              <option value="maintained_form">Maintained form</option>
              <option value="slight_degradation">Slight degradation</option>
              <option value="significant_degradation">Significant degradation</option>
              <option value="broke_down">Broke down</option>
            </select>
          </label>
          <label>
            Problem selection
            <select
              value={problemSelectionFeedback}
              onChange={(e) =>
                setProblemSelectionFeedback(
                  e.target.value as FourByFourData["problemSelectionFeedback"]
                )
              }
              className="training-form-group input"
            >
              <option value="too_easy">Too easy</option>
              <option value="good">Good</option>
              <option value="too_hard">Too hard</option>
            </select>
          </label>
          <label>
            Progression decision
            <select
              value={progressionDecision}
              onChange={(e) =>
                setProgressionDecision(e.target.value as FourByFourData["progressionDecision"])
              }
              className="training-form-group input"
            >
              <option value="maintain">Maintain</option>
              <option value="increase_rounds">Increase rounds</option>
              <option value="increase_difficulty">Increase difficulty</option>
              <option value="reduce">Reduce</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          className="training-timer-btn"
          onClick={() => finishDrill(rounds)}
        >
          Complete drill
        </button>
      </div>
    );
  }

  if (step === "problems") {
    return (
      <div className="training-four-by-four-log">
        <h4 className="training-four-by-four-log-title">{drill.name} — Set up problems</h4>
        {problems.map((p, i) => (
          <div key={i} className="training-form-group">
            <label>
              Problem {i + 1}
              <input
                type="text"
                value={p.description}
                onChange={(e) => {
                  const next = [...problems];
                  next[i] = { ...next[i], description: e.target.value };
                  setProblems(next);
                }}
                className="training-form-group input"
                placeholder="Description"
              />
            </label>
            <label>
              Grade
              <select
                value={p.grade}
                onChange={(e) => {
                  const next = [...problems];
                  next[i] = { ...next[i], grade: e.target.value };
                  setProblems(next);
                }}
                className="training-form-group input"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
        <button type="button" className="training-timer-btn" onClick={() => setStep("rounds")}>
          Start round 1
        </button>
      </div>
    );
  }

  return (
    <div className="training-four-by-four-log">
      <h4 className="training-four-by-four-log-title">
        Round {roundIndex + 1} of {roundCount}
      </h4>
      <p className="training-four-by-four-log-hint">Falls per problem (0–3+)</p>
      {falls.map((f, i) => (
        <div key={i} className="training-form-group">
          <span>P{i + 1}: {problems[i]?.description || problems[i]?.grade}</span>
          <div className="training-four-by-four-falls-btns" role="group" aria-label={`Falls for problem ${i + 1}`}>
            {[0, 1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={falls[i] === n}
                className={`training-timer-btn${falls[i] === n ? " training-timer-btn--active" : ""}`}
                onClick={() => {
                  const next = [...falls] as [number, number, number, number];
                  next[i] = n;
                  setFalls(next);
                }}
              >
                {n === 3 ? "3+" : n}
              </button>
            ))}
          </div>
        </div>
      ))}
      <p className="training-four-by-four-log-stats">Total falls this round: {totalFallsRound}</p>
      {highFallsWarning && (
        <p className="training-four-by-four-log-warning">
          High falls in round 1 — problems may be too hard. Next session: drop 1 grade.
        </p>
      )}
      <NumberSlider
        label="Recovery feel"
        value={recoveryFeel}
        onChange={setRecoveryFeel}
        min={1}
        max={5}
        hint="1 = desperate, 5 = easy"
      />
      <NumberSlider
        label="Pump at end of round"
        value={pumpLevel}
        onChange={setPumpLevel}
        min={1}
        max={10}
      />
      <button type="button" className="training-timer-btn" onClick={handleSaveRound}>
        {roundIndex + 1 >= roundCount ? "Finish rounds" : "Save round & rest"}
      </button>
    </div>
  );
}
