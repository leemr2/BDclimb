"use client";

import { useState } from "react";
import type {
  BoulderingAssessment,
  LimitBoulderProblem,
} from "@/lib/plans/bouldering/types";

interface Props {
  assessments: BoulderingAssessment[];
  weightUnit: "lbs" | "kg";
}

function formatDate(date: BoulderingAssessment["date"]): string {
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

function gripLabel(g: string): string {
  if (g === "half_crimp") return "half crimp";
  if (g === "open_hand") return "open hand";
  return g;
}

function sendRateFromProblems(problems: LimitBoulderProblem[]): {
  sent: number;
  total: number;
  rate: number;
} {
  const sent = problems.filter((p) => p.sent).length;
  const total = problems.length;
  return { sent, total, rate: total ? Math.round((sent / total) * 100) : 0 };
}

function maxPainFromBaseline(
  baseline: BoulderingAssessment["injuryBaseline"]
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
    baseline.shoulderPain.right
  );
}

function painColorClass(pain: number): string {
  if (pain === 0) return "ar-pain--none";
  if (pain < 3) return "ar-pain--low";
  if (pain < 6) return "ar-pain--mid";
  return "ar-pain--high";
}

export function AssessmentResultsView({ assessments, weightUnit }: Props) {
  const latest = assessments[assessments.length - 1];
  const [selectedWeek, setSelectedWeek] = useState(latest?.week ?? 0);
  const a = assessments.find((x) => x.week === selectedWeek) ?? latest;

  if (!a) return null;

  const target = Math.round(a.maxHang.bestLoad * 0.87);
  const sr = sendRateFromProblems(a.limitBoulders);
  const maxPain = maxPainFromBaseline(a.injuryBaseline);
  const painLabel =
    maxPain === 0
      ? "None"
      : maxPain < 3
        ? "Minimal"
        : maxPain < 6
          ? "Moderate"
          : "High";

  return (
    <div className="ar-view">
      {/* Week selector — only shown when multiple assessments exist */}
      {assessments.length > 1 && (
        <div className="ar-week-tabs">
          {assessments.map((x) => (
            <button
              key={x.week}
              type="button"
              onClick={() => setSelectedWeek(x.week)}
              className={`ar-week-tab${x.week === selectedWeek ? " ar-week-tab--active" : ""}`}
            >
              Week {x.week}
            </button>
          ))}
        </div>
      )}

      <p className="ar-date-note">Completed {formatDate(a.date)}</p>

      {/* ── Max Hang ─────────────────────────────────── */}
      <div className="ar-section">
        <h4 className="ar-section-title">Max Hang</h4>
        <div className="training-assessment-summary">
          <div className="training-assessment-summary-card">
            <h3 className="training-assessment-summary-label">Best Load</h3>
            <p className="training-assessment-summary-value">
              {a.maxHang.bestLoad} {weightUnit}
            </p>
            <p className="training-assessment-summary-sub">
              {a.maxHang.percentBodyweight.toFixed(1)}% bodyweight
            </p>
            <p className="training-assessment-summary-detail">
              {a.maxHang.edgeSize}mm · {gripLabel(a.maxHang.gripType)} ·{" "}
              {a.maxHang.attempts.length} attempt
              {a.maxHang.attempts.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="training-assessment-summary-card ar-target-card">
            <h3 className="training-assessment-summary-label">Training Target</h3>
            <p className="training-assessment-summary-value ar-target-value">
              {target} {weightUnit}
            </p>
            <p className="training-assessment-summary-sub">87% of max hang</p>
            <p className="training-assessment-summary-detail">
              Used for all max hang sets
            </p>
          </div>
        </div>
      </div>

      {/* ── Limit Bouldering ─────────────────────────── */}
      <div className="ar-section">
        <h4 className="ar-section-title">Limit Bouldering</h4>
        <div className="training-assessment-summary">
          <div className="training-assessment-summary-card">
            <h3 className="training-assessment-summary-label">Send Rate</h3>
            <p className="training-assessment-summary-value">{sr.rate}%</p>
            <p className="training-assessment-summary-sub">
              {sr.sent} of {sr.total} problem{sr.total !== 1 ? "s" : ""} sent
            </p>
          </div>
        </div>

        {a.limitBoulders.length > 0 && (
          <div className="ar-boulder-list">
            {a.limitBoulders.map((p, i) => (
              <div
                key={i}
                className={`ar-boulder-row ${p.sent ? "ar-boulder-row--sent" : "ar-boulder-row--unsent"}`}
              >
                <span className="ar-boulder-grade">{p.grade}</span>
                <span className="ar-boulder-desc">
                  {p.problemDescription || p.style}
                </span>
                <span className="ar-boulder-result">
                  {p.sent ? `Sent · ${p.attemptsToSend} att.` : "Working"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Campus Board (optional) ───────────────────── */}
      {a.campusBoard && (
        <div className="ar-section">
          <h4 className="ar-section-title">Campus Board</h4>
          <div className="training-assessment-summary">
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Max Reach</h3>
              <p className="training-assessment-summary-value">
                Rung {a.campusBoard.maxReach.bestRung}
              </p>
            </div>
            {a.campusBoard.movesToFailure.totalMoves > 0 && (
              <div className="training-assessment-summary-card">
                <h3 className="training-assessment-summary-label">
                  Moves to Failure
                </h3>
                <p className="training-assessment-summary-value">
                  {a.campusBoard.movesToFailure.totalMoves}
                </p>
                <p className="training-assessment-summary-sub">
                  {a.campusBoard.movesToFailure.stoppingReason.replace(
                    "_",
                    " "
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pulling Strength (optional) ──────────────── */}
      {a.pullingStrength && (
        <div className="ar-section">
          <h4 className="ar-section-title">Pulling Strength</h4>
          <div className="training-assessment-summary">
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Best Set</h3>
              <p className="training-assessment-summary-value ar-pulling-value">
                {a.pullingStrength.bestWeightXReps}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Injury Baseline ──────────────────────────── */}
      <div className="ar-section">
        <h4 className="ar-section-title">Injury Baseline</h4>
        <div className="training-assessment-summary">
          <div className="training-assessment-summary-card">
            <h3 className="training-assessment-summary-label">Max Pain</h3>
            <p className={`training-assessment-summary-value ar-pain ${painColorClass(maxPain)}`}>
              {painLabel}
            </p>
            <p className="training-assessment-summary-sub">{maxPain}/10 peak score</p>
          </div>
          <div className="training-assessment-summary-card">
            <h3 className="training-assessment-summary-label">
              Morning Stiffness
            </h3>
            <p className="training-assessment-summary-value">
              {a.injuryBaseline.morningStiffness}/10
            </p>
          </div>
        </div>
        {a.injuryBaseline.concerns && (
          <p className="ar-injury-notes">
            Notes: {a.injuryBaseline.concerns}
          </p>
        )}
      </div>
    </div>
  );
}
