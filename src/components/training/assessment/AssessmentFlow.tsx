"use client";

import { useState } from "react";
import Link from "next/link";
import { InjuryScreen } from "./InjuryScreen";
import { MaxHangTest } from "./MaxHangTest";
import { BoulderBenchmark } from "./BoulderBenchmark";
import { CampusBoardTest } from "./CampusBoardTest";
import { PullingStrengthTest } from "./PullingStrengthTest";
import type {
  BoulderingAssessment,
  InjuryBaseline,
  MaxHangAssessment,
  LimitBoulderProblem,
  CampusBoardAssessment,
  PullingStrengthAssessment,
} from "@/lib/plans/bouldering/types";

type TaskId = "injury" | "max-hang" | "bouldering" | "campus-board" | "pulling-strength";

interface TaskMeta {
  id: TaskId;
  title: string;
  description: string;
  time: string;
  equipment?: string;
  optional: boolean;
}

const ASSESSMENT_TASKS: TaskMeta[] = [
  {
    id: "injury",
    title: "Injury Baseline",
    description:
      "Rate your current pain and stiffness levels. This gives us a health baseline to track throughout the program.",
    time: "5 min",
    optional: false,
  },
  {
    id: "max-hang",
    title: "Max Hang Test",
    description:
      "Find your max finger strength on a 20mm edge. This sets your training loads for all 12 weeks.",
    time: "15–20 min",
    equipment: "Hangboard",
    optional: false,
  },
  {
    id: "bouldering",
    title: "Limit Boulder Benchmark",
    description:
      "Log your limit boulder attempts to establish your send rate and efficiency baseline.",
    time: "30–40 min",
    equipment: "Boulder wall",
    optional: false,
  },
  {
    id: "campus-board",
    title: "Campus Board Assessment",
    description:
      "Max reach test and moves-to-failure ladder. Establishes your power and RFD baseline. Skip if no board available or if you have any finger/shoulder pain.",
    time: "15 min",
    equipment: "Campus board",
    optional: true,
  },
  {
    id: "pulling-strength",
    title: "Weighted Pull-up Test",
    description:
      "3-5 rep max weighted pull-ups. Tracks pulling strength and antagonist balance over the program.",
    time: "10–15 min",
    equipment: "Pull-up bar + weight",
    optional: true,
  },
];

interface AssessmentFlowProps {
  programId: string;
  bodyweight: number;
  weightUnit: "lbs" | "kg";
  onComplete: (assessment: Omit<BoulderingAssessment, "id" | "date">) => void;
}

export function AssessmentFlow({
  programId,
  bodyweight,
  weightUnit,
  onComplete,
}: AssessmentFlowProps) {
  // null = show task list; task id = show that task's form
  const [activeTask, setActiveTask] = useState<TaskId | null>(null);

  const [injuryData, setInjuryData] = useState<InjuryBaseline | null>(null);
  const [maxHangData, setMaxHangData] = useState<MaxHangAssessment | null>(null);
  const [boulderingData, setBoulderingData] = useState<LimitBoulderProblem[] | null>(null);
  // Optional — null = not done, explicit data or "skipped" sentinel
  const [campusData, setCampusData] = useState<CampusBoardAssessment | null | "skipped">(null);
  const [pullingData, setPullingData] = useState<PullingStrengthAssessment | null | "skipped">(null);

  // Required tasks must all be complete to enable Save
  const requiredDone =
    injuryData !== null && maxHangData !== null && boulderingData !== null;

  // Progress counter includes optional tasks once they are acted on (done or skipped)
  const completedMap: Record<TaskId, boolean> = {
    injury: injuryData !== null,
    "max-hang": maxHangData !== null,
    bouldering: boulderingData !== null,
    "campus-board": campusData !== null,
    "pulling-strength": pullingData !== null,
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;

  const handleInjuryComplete = (data: InjuryBaseline) => {
    setInjuryData(data);
    setActiveTask(null);
  };

  const handleMaxHangComplete = (data: MaxHangAssessment) => {
    setMaxHangData(data);
    setActiveTask(null);
  };

  const handleBoulderingComplete = (problems: LimitBoulderProblem[]) => {
    setBoulderingData(problems);
    setActiveTask(null);
  };

  const handleCampusComplete = (data: CampusBoardAssessment) => {
    setCampusData(data);
    setActiveTask(null);
  };

  const handleCampusSkip = () => {
    setCampusData("skipped");
    setActiveTask(null);
  };

  const handlePullingComplete = (data: PullingStrengthAssessment) => {
    setPullingData(data);
    setActiveTask(null);
  };

  const handlePullingSkip = () => {
    setPullingData("skipped");
    setActiveTask(null);
  };

  const handleFinish = () => {
    if (!injuryData || !maxHangData || !boulderingData) return;

    const assessment: Omit<BoulderingAssessment, "id" | "date"> = {
      programId,
      week: 0,
      maxHang: maxHangData,
      campusBoard: campusData === "skipped" || campusData === null ? null : campusData,
      limitBoulders: boulderingData,
      pullingStrength: pullingData === "skipped" || pullingData === null ? null : pullingData,
      injuryBaseline: injuryData,
    };

    onComplete(assessment);
  };

  // — Active task views —
  if (activeTask === "injury") {
    return (
      <InjuryScreen
        onComplete={handleInjuryComplete}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "max-hang") {
    return (
      <MaxHangTest
        bodyweight={bodyweight}
        weightUnit={weightUnit}
        onComplete={handleMaxHangComplete}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "bouldering") {
    return (
      <BoulderBenchmark
        onComplete={handleBoulderingComplete}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "campus-board") {
    return (
      <CampusBoardTest
        onComplete={handleCampusComplete}
        onSkip={handleCampusSkip}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "pulling-strength") {
    return (
      <PullingStrengthTest
        weightUnit={weightUnit}
        onComplete={handlePullingComplete}
        onSkip={handlePullingSkip}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  // — Task list view —
  return (
    <div className="training-assessment-screen">
      <Link href="/training-center" className="training-assessment-back-link">
        ← Training Home
      </Link>

      <div className="training-assessment-header">
        <h2 className="training-assessment-title">Week 0 Baseline Assessment</h2>
        <p className="training-assessment-subtitle">
          Complete the required assessments in any order. Optional assessments improve training precision.
        </p>
      </div>

      <div className="training-assessment-content">
        {/* Progress bar */}
        <div className="training-tasklist-progress">
          <div className="training-tasklist-progress-label">
            {completedCount} of {ASSESSMENT_TASKS.length} complete
          </div>
          <div className="training-tasklist-progress-bar">
            <div
              className="training-tasklist-progress-fill"
              style={{ width: `${(completedCount / ASSESSMENT_TASKS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Required tasks */}
        <div className="training-tasklist-section-label">Required</div>
        <div className="training-tasklist">
          {ASSESSMENT_TASKS.filter((t) => !t.optional).map((task) => {
            const done = completedMap[task.id];
            return (
              <TaskRow
                key={task.id}
                task={task}
                done={done}
                onStart={() => setActiveTask(task.id)}
              />
            );
          })}
        </div>

        {/* Optional tasks */}
        <div className="training-tasklist-section-label" style={{ marginTop: "1.25rem" }}>
          Optional <span className="training-tasklist-section-note">— improves training precision</span>
        </div>
        <div className="training-tasklist">
          {ASSESSMENT_TASKS.filter((t) => t.optional).map((task) => {
            const done = completedMap[task.id];
            const skipped =
              (task.id === "campus-board" && campusData === "skipped") ||
              (task.id === "pulling-strength" && pullingData === "skipped");
            return (
              <TaskRow
                key={task.id}
                task={task}
                done={done}
                skipped={skipped}
                onStart={() => setActiveTask(task.id)}
              />
            );
          })}
        </div>

        {/* Summary cards once required tasks are done */}
        {requiredDone && injuryData && maxHangData && boulderingData && (
          <div className="training-assessment-summary" style={{ marginTop: "1.5rem" }}>
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Max Hang</h3>
              <p className="training-assessment-summary-value">
                {maxHangData.bestLoad} {weightUnit}
              </p>
              <p className="training-assessment-summary-sub">
                {maxHangData.percentBodyweight.toFixed(1)}% bodyweight
              </p>
              <p className="training-assessment-summary-detail">
                {maxHangData.edgeSize}mm {maxHangData.gripType}
              </p>
            </div>

            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Boulder Performance</h3>
              <p className="training-assessment-summary-value">
                {Math.round(
                  (boulderingData.filter((p) => p.sent).length / boulderingData.length) * 100
                )}% send rate
              </p>
              <p className="training-assessment-summary-sub">
                {boulderingData.filter((p) => p.sent).length} / {boulderingData.length} sent
              </p>
            </div>

            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Injury Status</h3>
              <p className="training-assessment-summary-value">
                {(() => {
                  const maxFingerPain = Math.max(
                    ...Object.values(injuryData.fingers).flatMap((f) => [
                      f.painAtRest,
                      f.painWithPressure,
                    ])
                  );
                  const maxPain = Math.max(
                    maxFingerPain,
                    injuryData.elbowPain.left,
                    injuryData.elbowPain.right,
                    injuryData.shoulderPain.left,
                    injuryData.shoulderPain.right
                  );
                  if (maxPain === 0) return "No pain reported";
                  if (maxPain < 3) return "Minimal pain";
                  if (maxPain < 5) return "Moderate pain";
                  return "High pain — monitor closely";
                })()}
              </p>
              <p className="training-assessment-summary-sub">
                Morning stiffness: {injuryData.morningStiffness}/10
              </p>
            </div>

            {campusData && campusData !== "skipped" && (
              <div className="training-assessment-summary-card">
                <h3 className="training-assessment-summary-label">Campus Board</h3>
                <p className="training-assessment-summary-value">
                  Max rung #{campusData.maxReach.bestRung}
                </p>
                {campusData.movesToFailure.totalMoves > 0 && (
                  <p className="training-assessment-summary-sub">
                    {campusData.movesToFailure.totalMoves} moves to failure
                  </p>
                )}
              </div>
            )}

            {pullingData && pullingData !== "skipped" && (
              <div className="training-assessment-summary-card">
                <h3 className="training-assessment-summary-label">Pull-up Strength</h3>
                <p className="training-assessment-summary-value">{pullingData.bestWeightXReps}</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        <button
          type="button"
          onClick={handleFinish}
          disabled={!requiredDone}
          className="training-center-cta"
          style={{
            opacity: requiredDone ? 1 : 0.45,
            cursor: requiredDone ? "pointer" : "not-allowed",
          }}
        >
          {requiredDone
            ? "Save & Start Week 1"
            : `Complete required assessments (${Math.min(completedCount, 3)}/3)`}
        </button>
      </div>
    </div>
  );
}

// — Extracted row component for cleanliness —
function TaskRow({
  task,
  done,
  skipped = false,
  onStart,
}: {
  task: TaskMeta;
  done: boolean;
  skipped?: boolean;
  onStart: () => void;
}) {
  const isActedOn = done; // done covers both data-saved and skipped since completedMap tracks campusData !== null

  return (
    <div
      className={`training-tasklist-item${
        isActedOn && !skipped ? " training-tasklist-item--done" : ""
      }${skipped ? " training-tasklist-item--skipped" : ""}`}
    >
      {/* Status icon */}
      <div className="training-tasklist-status">
        {isActedOn && !skipped ? (
          <span className="training-tasklist-check" aria-label="Complete">
            ✓
          </span>
        ) : skipped ? (
          <span className="training-tasklist-skip-icon" aria-label="Skipped">
            —
          </span>
        ) : (
          <span className="training-tasklist-dot" aria-hidden="true" />
        )}
      </div>

      {/* Info */}
      <div className="training-tasklist-info">
        <div className="training-tasklist-title">
          {task.title}
          {task.optional && (
            <span className="training-tasklist-optional-badge">Optional</span>
          )}
        </div>
        <p className="training-tasklist-desc">{task.description}</p>
        <div className="training-tasklist-meta">
          <span className="training-tasklist-time">⏱ {task.time}</span>
          {task.equipment && (
            <span className="training-tasklist-equipment">📌 {task.equipment}</span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="training-tasklist-action">
        <button
          type="button"
          onClick={onStart}
          className={`training-tasklist-btn${
            isActedOn ? " training-tasklist-btn--redo" : ""
          }`}
        >
          {skipped ? "Do it" : isActedOn ? "Edit" : "Start"}
        </button>
      </div>
    </div>
  );
}
