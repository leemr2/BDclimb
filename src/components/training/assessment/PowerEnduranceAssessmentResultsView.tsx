"use client";

import { useState } from "react";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";
import { getIHEWorkingLoad } from "@/lib/plans/power-endurance/calculations";

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

  if (!a) return null;

  const iheLoad = getIHEWorkingLoad(a.fingerMaxStrength.bestLoad);
  const maxPain = maxPainFromBaseline(a.injuryBaseline);

  return (
    <div className="training-assessment-results">
      <div className="training-assessment-results-header">
        <h2 className="training-assessment-results-title">Assessment Results</h2>
        {assessments.length > 1 && (
          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
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
          <h3 className="training-assessment-summary-label">Crux Success Rate</h3>
          <p className="training-assessment-summary-value">{a.cruxAfterFatigue.successRate}%</p>
          <p className="training-assessment-summary-sub">
            Avg moves: {a.cruxAfterFatigue.avgMovesCompleted}
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
    </div>
  );
}
