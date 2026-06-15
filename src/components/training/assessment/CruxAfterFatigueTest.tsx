"use client";

import { useMemo, useState } from "react";
import type { TrainingProfile } from "@/lib/firebase/training/profile";
import type {
  CAFBenchmark,
  CruxAfterFatigueAssessment,
  CAFLimitingFactor,
} from "@/lib/plans/power-endurance/types";
import {
  buildCAFBenchmark,
  buildCruxAfterFatigueAssessment,
  getCAFAssessmentSuggestions,
  computeSessionCAFScore,
  CAF_CRUX_GRADES,
  YDS_ENTRY_GRADES,
  normalizeCAFCruxGrade,
} from "@/lib/plans/power-endurance/calculations";
import {
  CAFRoundLogger,
  createEmptyCAFRoundDraft,
  draftToCAFRound,
  type CAFRoundDraft,
} from "@/components/training/shared/CAFRoundLogger";
import { RestTimer } from "@/components/training/workout/RestTimer";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

interface CruxAfterFatigueTestProps {
  profile?: TrainingProfile | null;
  week: number;
  lockedBenchmark?: CAFBenchmark | null;
  onComplete: (data: CruxAfterFatigueAssessment) => void;
  onBack?: () => void;
}

const ROUND_COUNT = 3;
const REST_SECONDS = 10 * 60;

type AttemptPhase = "logging" | "rest";

export function CruxAfterFatigueTest({
  profile,
  week,
  lockedBenchmark,
  onComplete,
  onBack,
}: CruxAfterFatigueTestProps) {
  const isRetest = week > 0;
  const suggestions = useMemo(() => {
    if (profile?.currentRouteGrade) {
      return getCAFAssessmentSuggestions(profile);
    }
    return getCAFAssessmentSuggestions({
      age: 0,
      weight: 0,
      weightUnit: "lbs",
      experienceLevel: "intermediate",
      currentRouteGrade: "5.10a",
      goalRouteGrade: "5.11a",
      createdAt: {} as TrainingProfile["createdAt"],
      updatedAt: {} as TrainingProfile["updatedAt"],
    });
  }, [profile]);

  const [step, setStep] = useState<"setup" | "attempts">(isRetest && lockedBenchmark ? "attempts" : "setup");
  const [attemptPhase, setAttemptPhase] = useState<AttemptPhase>("logging");
  const [activeRoundIndex, setActiveRoundIndex] = useState(0);
  const [savedRoundCount, setSavedRoundCount] = useState(0);

  const [entryGrade, setEntryGrade] = useState(
    lockedBenchmark?.entryGrade ?? suggestions.entryGrade
  );
  const [entryMoves, setEntryMoves] = useState(
    lockedBenchmark?.entryMoves ?? suggestions.entryMoves
  );
  const [cruxDescription, setCruxDescription] = useState(
    lockedBenchmark?.cruxDescription ?? ""
  );
  const [cruxGrade, setCruxGrade] = useState(
    normalizeCAFCruxGrade(lockedBenchmark?.cruxGrade ?? suggestions.cruxGrade)
  );
  const [cruxTotalMoves, setCruxTotalMoves] = useState(
    lockedBenchmark?.cruxTotalMoves ?? suggestions.cruxTotalMoves
  );
  const [limitingFactor, setLimitingFactor] = useState<CAFLimitingFactor>("forearm_pump");

  const benchmark = useMemo(
    () =>
      lockedBenchmark ??
      buildCAFBenchmark({
        entryGrade,
        entryMoves,
        cruxDescription: cruxDescription.trim(),
        cruxGrade,
        cruxTotalMoves,
      }),
    [lockedBenchmark, entryGrade, entryMoves, cruxDescription, cruxGrade, cruxTotalMoves]
  );

  const [rounds, setRounds] = useState<CAFRoundDraft[]>(() =>
    Array.from({ length: ROUND_COUNT }, () => createEmptyCAFRoundDraft(benchmark))
  );

  const updateRound = (index: number, draft: CAFRoundDraft) => {
    setRounds((prev) => prev.map((r, i) => (i === index ? draft : r)));
  };

  const sessionScore = computeSessionCAFScore(rounds.map(draftToCAFRound));
  const allRoundsSaved = savedRoundCount >= ROUND_COUNT;

  const handleStartAttempts = () => {
    if (!isRetest && !cruxDescription.trim()) return;
    const nextBenchmark = buildCAFBenchmark({
      entryGrade,
      entryMoves,
      cruxDescription: cruxDescription.trim() || lockedBenchmark?.cruxDescription || "Benchmark crux",
      cruxGrade,
      cruxTotalMoves,
    });
    setRounds(
      Array.from({ length: ROUND_COUNT }, () => createEmptyCAFRoundDraft(nextBenchmark))
    );
    setActiveRoundIndex(0);
    setSavedRoundCount(0);
    setAttemptPhase("logging");
    setStep("attempts");
  };

  const handleSaveRound = () => {
    const nextSaved = savedRoundCount + 1;
    setSavedRoundCount(nextSaved);
    if (nextSaved < ROUND_COUNT) {
      setAttemptPhase("rest");
      return;
    }
  };

  const handleRestComplete = () => {
    setActiveRoundIndex(savedRoundCount);
    setAttemptPhase("logging");
  };

  const handleComplete = () => {
    const attempts = rounds.map(draftToCAFRound);
    onComplete(buildCruxAfterFatigueAssessment(benchmark, attempts, limitingFactor));
  };

  if (step === "setup" && !isRetest) {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Crux-After-Fatigue Simulation</h2>
          <p className="training-assessment-subtitle">
            Establish your workout baseline — session CAF score shows how you perform at this demand.
          </p>
        </div>
        <div className="training-assessment-content">
          {profile?.currentRouteGrade && profile?.goalRouteGrade && (
            <p className="training-assessment-section-hint">
              Current route: {profile.currentRouteGrade} → Goal: {profile.goalRouteGrade}
            </p>
          )}
          <div className="training-assessment-instructions">
            <h3>What you&apos;ll do:</h3>
            <ol>
              <li>Set your benchmark entry (moves + grade) and crux sequence</li>
              <li>Perform 3 rounds: entry → immediate crux attempt</li>
              <li>Rest 10 minutes between rounds</li>
            </ol>
            <p style={{ marginTop: "0.75rem" }}>
              This setup becomes your workout baseline for the 12-week program.
            </p>
          </div>
          <div className="training-assessment-form">
            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Entry grade
                <select
                  value={entryGrade}
                  onChange={(e) => setEntryGrade(e.target.value)}
                  className="training-assessment-input"
                >
                  {YDS_ENTRY_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="training-assessment-section">
              <NumberSlider
                label="Entry moves"
                value={entryMoves}
                onChange={setEntryMoves}
                min={1}
                max={80}
                unit="moves"
              />
            </div>
            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Crux description *
                <textarea
                  value={cruxDescription}
                  onChange={(e) => setCruxDescription(e.target.value)}
                  placeholder="Describe your benchmark crux (grade, moves, style)..."
                  className="training-assessment-textarea"
                  rows={3}
                />
              </label>
            </div>
            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Crux grade
                <select
                  value={cruxGrade}
                  onChange={(e) => setCruxGrade(e.target.value)}
                  className="training-assessment-input"
                >
                  {CAF_CRUX_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="training-assessment-section">
              <NumberSlider
                label="Total crux moves"
                value={cruxTotalMoves}
                onChange={setCruxTotalMoves}
                min={1}
                max={20}
                unit="moves"
              />
            </div>
          </div>
        </div>
        <div className="training-assessment-actions">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="training-center-cta training-btn-secondary"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={handleStartAttempts}
            disabled={!cruxDescription.trim()}
            className="training-center-cta"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">
          {isRetest ? `Week ${week} CAF Retest` : "Crux after Fatigue"}
        </h2>
        <p className="training-assessment-subtitle">
          {attemptPhase === "rest"
            ? `Rest before round ${savedRoundCount + 1}`
            : allRoundsSaved
              ? "All rounds logged"
              : `Round ${activeRoundIndex + 1} of ${ROUND_COUNT}`}
          {" · "}
          {benchmark.entryMoves} moves @ {benchmark.entryGrade} → {benchmark.cruxGrade} (
          {benchmark.cruxTotalMoves} moves)
          {isRetest ? " — locked to Week 0 benchmark" : ""}
        </p>
      </div>

      <div className="training-assessment-content">
        {attemptPhase === "rest" && (
          <div className="training-hang-timer-container">
            <RestTimer
              durationSeconds={REST_SECONDS}
              nextUpLabel={`Next: Round ${savedRoundCount + 1}`}
              onComplete={handleRestComplete}
            />
          </div>
        )}

        {attemptPhase === "logging" && !allRoundsSaved && (
          <CAFRoundLogger
            roundIndex={activeRoundIndex}
            benchmark={benchmark}
            value={rounds[activeRoundIndex]}
            onChange={(draft) => updateRound(activeRoundIndex, draft)}
            lockEntry={isRetest}
            footer={
              <div className="training-assessment-actions">
                <button
                  type="button"
                  onClick={handleSaveRound}
                  className="training-center-cta"
                >
                  {activeRoundIndex === ROUND_COUNT - 1 ? "Save final round" : "Save round"}
                </button>
              </div>
            }
          />
        )}

        {savedRoundCount > 0 && attemptPhase === "logging" && !allRoundsSaved && (
          <div className="training-assessment-attempts">
            <h4 className="training-assessment-attempts-title">
              Completed rounds ({savedRoundCount}):
            </h4>
            <ul className="training-assessment-attempts-list">
              {rounds.slice(0, savedRoundCount).map((round, i) => {
                const scored = draftToCAFRound(round);
                return (
                  <li
                    key={i}
                    className={`training-assessment-attempt ${scored.success ? "success" : ""}`}
                  >
                    Round {i + 1}: score {scored.roundScore}
                    {scored.success ? " — SEND" : ` — ${scored.movesCompleted}/${scored.cruxTotalMoves} moves`}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {allRoundsSaved && (
          <div className="training-assessment-form">
            <h3 className="training-assessment-section-title">Session summary</h3>

            <div className="training-assessment-attempts" style={{ marginTop: 0 }}>
              <h4 className="training-assessment-attempts-title">
                Completed rounds ({ROUND_COUNT})
              </h4>
              <ul className="training-assessment-attempts-list">
                {rounds.map((round, i) => {
                  const scored = draftToCAFRound(round);
                  return (
                    <li
                      key={i}
                      className={`training-assessment-attempt ${scored.success ? "success" : ""}`}
                    >
                      Round {i + 1}: score {scored.roundScore}
                      {scored.success
                        ? " — SEND"
                        : ` — ${scored.movesCompleted}/${scored.cruxTotalMoves} moves`}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="training-assessment-section">
              <label className="training-assessment-label">
                Limiting factor
                <select
                  value={limitingFactor}
                  onChange={(e) => setLimitingFactor(e.target.value as CAFLimitingFactor)}
                  className="training-assessment-input"
                >
                  <option value="forearm_pump">Forearm pump</option>
                  <option value="finger_strength">Finger strength</option>
                  <option value="technical_execution">Technical execution</option>
                  <option value="mental_focus">Mental focus</option>
                  <option value="power_explosiveness">Power / explosiveness</option>
                  <option value="pacing_errors">Pacing errors</option>
                </select>
              </label>
            </div>

            <p className="training-assessment-section-hint">
              Session CAF score: <strong>{sessionScore}</strong> · Success rate:{" "}
              {Math.round(
                (rounds.map(draftToCAFRound).filter((r) => r.success).length / ROUND_COUNT) * 100
              )}
              %
            </p>
            <p className="training-assessment-section-hint">
              {rounds
                .map((_, i) => {
                  const score = draftToCAFRound(rounds[i]).roundScore;
                  return `R${i + 1}: ${score}`;
                })
                .join("  ")}
            </p>

            <div className="training-assessment-actions">
              <button type="button" onClick={handleComplete} className="training-center-cta">
                Complete test
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        {!isRetest && savedRoundCount === 0 && attemptPhase === "logging" && (
          <button
            type="button"
            onClick={() => setStep("setup")}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
        )}
        {onBack && isRetest && savedRoundCount === 0 && attemptPhase === "logging" && (
          <button
            type="button"
            onClick={onBack}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
}
