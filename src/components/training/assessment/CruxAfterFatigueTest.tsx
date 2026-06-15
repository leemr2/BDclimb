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
} from "@/lib/plans/power-endurance/calculations";
import {
  CAFRoundLogger,
  createEmptyCAFRoundDraft,
  draftToCAFRound,
  type CAFRoundDraft,
} from "@/components/training/shared/CAFRoundLogger";

interface CruxAfterFatigueTestProps {
  profile?: TrainingProfile | null;
  week: number;
  lockedBenchmark?: CAFBenchmark | null;
  onComplete: (data: CruxAfterFatigueAssessment) => void;
  onBack?: () => void;
}

const ROUND_COUNT = 3;

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
    lockedBenchmark?.cruxGrade ?? suggestions.cruxGrade
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
    setStep("attempts");
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
            <ol>
              <li>Set your benchmark entry (moves + grade) and crux sequence</li>
              <li>Perform 2-3 rounds: entry → immediate crux attempt</li>
              <li>Rest 10-15 min between rounds</li>
            </ol>
            <p style={{ marginTop: "0.75rem" }}>
              This setup becomes your workout baseline for the 12-week program.
            </p>
          </div>
          <div className="training-assessment-section">
            <label className="training-injury-input-group">
              <span className="training-injury-input-label">Entry grade:</span>
              <select
                value={entryGrade}
                onChange={(e) => setEntryGrade(e.target.value)}
                className="training-injury-input"
              >
                {YDS_ENTRY_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Entry moves:</span>
              <input
                type="number"
                min={1}
                max={80}
                value={entryMoves}
                onChange={(e) => setEntryMoves(parseInt(e.target.value, 10) || 20)}
                className="training-injury-input"
              />
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Crux description:</span>
              <textarea
                value={cruxDescription}
                onChange={(e) => setCruxDescription(e.target.value)}
                placeholder="Describe your benchmark crux (grade, moves, style)..."
                className="training-injury-textarea"
                rows={3}
              />
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Crux grade:</span>
              <select
                value={cruxGrade}
                onChange={(e) => setCruxGrade(e.target.value)}
                className="training-injury-input"
              >
                {CAF_CRUX_GRADES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="training-injury-input-group" style={{ marginTop: "0.75rem" }}>
              <span className="training-injury-input-label">Total crux moves:</span>
              <input
                type="number"
                min={1}
                max={20}
                value={cruxTotalMoves}
                onChange={(e) => setCruxTotalMoves(parseInt(e.target.value, 10) || 8)}
                className="training-injury-input"
              />
            </label>
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
            Log attempts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="training-assessment-screen">
      <div className="training-assessment-header">
        <h2 className="training-assessment-title">
          {isRetest ? `Week ${week} CAF Retest` : "Crux Attempts"}
        </h2>
        <p className="training-assessment-subtitle">
          {benchmark.entryMoves} moves @ {benchmark.entryGrade} → {benchmark.cruxGrade} (
          {benchmark.cruxTotalMoves} moves)
          {isRetest ? " — locked to Week 0 benchmark" : ""}
        </p>
      </div>

      <div className="training-assessment-content">
        {rounds.map((round, index) => (
          <CAFRoundLogger
            key={index}
            roundIndex={index}
            benchmark={benchmark}
            value={round}
            onChange={(draft) => updateRound(index, draft)}
            lockEntry={isRetest}
          />
        ))}

        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Limiting factor:</span>
          <select
            value={limitingFactor}
            onChange={(e) => setLimitingFactor(e.target.value as CAFLimitingFactor)}
            className="training-injury-input"
          >
            <option value="forearm_pump">Forearm pump</option>
            <option value="finger_strength">Finger strength</option>
            <option value="technical_execution">Technical execution</option>
            <option value="mental_focus">Mental focus</option>
            <option value="power_explosiveness">Power / explosiveness</option>
            <option value="pacing_errors">Pacing errors</option>
          </select>
        </label>

        <p className="training-assessment-section-hint" style={{ marginTop: "1rem" }}>
          Session CAF score: <strong>{sessionScore}</strong> · Success rate:{" "}
          {Math.round(
            (rounds.map(draftToCAFRound).filter((r) => r.success).length / ROUND_COUNT) * 100
          )}
          %
        </p>
        <p className="training-assessment-section-hint">
          {rounds.map((_, i) => {
            const score = draftToCAFRound(rounds[i]).roundScore;
            return `R${i + 1}: ${score}`;
          }).join("  ")}
        </p>
      </div>

      <div className="training-assessment-actions">
        {!isRetest && (
          <button
            type="button"
            onClick={() => setStep("setup")}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
        )}
        {onBack && isRetest && (
          <button
            type="button"
            onClick={onBack}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
        )}
        <button type="button" onClick={handleComplete} className="training-center-cta">
          Complete test
        </button>
      </div>
    </div>
  );
}
