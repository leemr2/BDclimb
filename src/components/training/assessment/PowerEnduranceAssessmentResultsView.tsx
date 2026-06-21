"use client";

import { useState } from "react";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";
import { getIHEWorkingLoad, cafScoreOf } from "@/lib/plans/power-endurance/calculations";

interface Props {
  assessments: PowerEnduranceAssessment[];
  weightUnit: "lbs" | "kg";
}

function formatDate(date: PowerEnduranceAssessment["date"]): string {
  try {
    const d =
      typeof (date as { toDate?: () => Date }).toDate === "function"
        ? (date as { toDate: () => Date }).toDate()
        : new Date(date as Date);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function maxPainFromBaseline(
  baseline: PowerEnduranceAssessment["injuryBaseline"]
): number {
  const fingerValues = Object.values(baseline.fingers).flatMap((f) => [
    f.painAtRest,
    f.painWithPressure,
  ]);
  return Math.max(
    0,
    ...fingerValues,
    baseline.elbowPain.left,
    baseline.elbowPain.right,
    baseline.shoulderPain.left,
    baseline.shoulderPain.right,
    baseline.shoulderSymptomScore ?? 0
  );
}

export function PowerEnduranceAssessmentResultsView({
  assessments,
  weightUnit,
}: Props) {
  const latest = assessments[assessments.length - 1];
  const [selectedWeek, setSelectedWeek] = useState(latest?.week ?? 0);
  const a = assessments.find((x) => x.week === selectedWeek) ?? latest;
  const week0 = assessments.find((x) => x.week === 0);

  if (!a) return null;

  const iheLoad = getIHEWorkingLoad(a.fingerMaxStrength.bestLoad);
  const maxPain = maxPainFromBaseline(a.injuryBaseline);
  const caf = a.cruxAfterFatigue;

  return (
    <div className="training-assessment-results">
      <div className="training-assessment-results-header">
        <h2 className="training-assessment-results-title">Assessment Results</h2>
        {assessments.length > 1 && (
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value, 10))}
            className="training-injury-input"
          >
            {assessments.map((ass) => (
              <option key={ass.week} value={ass.week}>
                Week {ass.week} — {formatDate(ass.date)}
              </option>
            ))}
          </select>
        )}
      </div>

      {caf.isLegacy && (
        <p className="training-assessment-section-hint" style={{ marginBottom: "1rem" }}>
          Legacy assessment format — retest recommended for accurate CAF scoring.
        </p>
      )}

      <div className="training-assessment-summary">
        <div className="training-assessment-summary-card">
          <h3 className="training-assessment-summary-label">Max Hang</h3>
          <p className="training-assessment-summary-value">
            {a.fingerMaxStrength.bestLoad} {weightUnit}
          </p>
          <p className="training-assessment-summary-sub">
            {a.fingerMaxStrength.percentBodyweight.toFixed(1)}% bodyweight
          </p>
        </div>

        <div className="training-assessment-summary-card">
          <h3 className="training-assessment-summary-label">IHE Working Load</h3>
          <p className="training-assessment-summary-value">
            {iheLoad} {weightUnit}
          </p>
          <p className="training-assessment-summary-sub">
            {a.intermittentEndurance.totalReps} total reps
          </p>
        </div>

        <div className="training-assessment-summary-card">
          <h3 className="training-assessment-summary-label">Session CAF Score</h3>
          <p className="training-assessment-summary-value">{cafScoreOf(caf) ?? "—"}</p>
          <p className="training-assessment-summary-sub">
            Success rate: {caf.successRate}% · Avg CDS: {caf.avgCDS}
          </p>
        </div>

        <div className="training-assessment-summary-card">
          <h3 className="training-assessment-summary-label">Injury Status</h3>
          <p className="training-assessment-summary-value">
            {maxPain === 0 ? "Clear" : `Max pain ${maxPain}/10`}
          </p>
          {a.injuryBaseline.shoulderSymptomScore != null && (
            <p className="training-assessment-summary-sub">
              Shoulder score: {a.injuryBaseline.shoulderSymptomScore}/10
            </p>
          )}
        </div>
      </div>

      {caf.benchmark && (
        <div className="training-assessment-section" style={{ marginTop: "1.25rem" }}>
          <h3 className="training-assessment-section-title">CAF Benchmark</h3>
          <p className="training-assessment-section-hint">
            Entry: {caf.benchmark.entryMoves} moves @ {caf.benchmark.entryGrade} (ELS{" "}
            {caf.benchmark.baselineELS}) · Crux: {caf.benchmark.cruxGrade} (
            {caf.benchmark.cruxTotalMoves} moves)
          </p>
          {a.week === 0 && (
            <p className="training-assessment-section-hint" style={{ marginTop: "0.5rem" }}>
              Your Week 1 CAF workouts will start from this entry setup.
            </p>
          )}
        </div>
      )}

      {assessments.length > 1 && week0 && (
        <div className="training-assessment-section" style={{ marginTop: "1.25rem" }}>
          <h3 className="training-assessment-section-title">CAF Progress Across Retests</h3>
          <table className="training-assessment-comparison-table">
            <thead>
              <tr>
                <th>Metric</th>
                {assessments.map((ass) => (
                  <th key={ass.week}>Week {ass.week}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Session CAF Score</td>
                {assessments.map((ass) => (
                  <td key={ass.week}>{cafScoreOf(ass.cruxAfterFatigue) ?? "—"}</td>
                ))}
              </tr>
              <tr>
                <td>Avg ELS / round</td>
                {assessments.map((ass) => (
                  <td key={ass.week}>{ass.cruxAfterFatigue.avgELS}</td>
                ))}
              </tr>
              <tr>
                <td>Avg CDS / round</td>
                {assessments.map((ass) => (
                  <td key={ass.week}>{ass.cruxAfterFatigue.avgCDS}</td>
                ))}
              </tr>
              <tr>
                <td>Success rate</td>
                {assessments.map((ass) => (
                  <td key={ass.week}>{ass.cruxAfterFatigue.successRate}%</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
