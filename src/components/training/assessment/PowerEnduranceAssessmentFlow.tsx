"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MaxHangTest } from "./MaxHangTest";
import { IntermittentEnduranceTest } from "./IntermittentEnduranceTest";
import { CruxAfterFatigueTest } from "./CruxAfterFatigueTest";
import { CampusBoardTest } from "./CampusBoardTest";
import { PullingStrengthTest } from "./PullingStrengthTest";
import { InjuryScreen } from "./InjuryScreen";
import type {
  PowerEnduranceAssessment,
  PEInjuryBaseline,
  PEOptionalTests,
  CAFBenchmark,
} from "@/lib/plans/power-endurance/types";
import type {
  MaxHangAssessment,
  CampusBoardAssessment,
  PullingStrengthAssessment,
} from "@/lib/plans/bouldering/types";
import type { TrainingProfile } from "@/lib/firebase/training/profile";
import { getIHEWorkingLoad } from "@/lib/plans/power-endurance/calculations";

type TaskId =
  | "warmup"
  | "max-hang"
  | "ihe"
  | "caf"
  | "campus-board"
  | "pulling-strength"
  | "injury";

interface TaskMeta {
  id: TaskId;
  title: string;
  description: string;
  time: string;
  optional: boolean;
}

const ASSESSMENT_TASKS: TaskMeta[] = [
  {
    id: "warmup",
    title: "Warm-Up Acknowledgment",
    description: "Confirm 10+ min easy climbing and progressive hangs completed.",
    time: "10 min",
    optional: false,
  },
  {
    id: "max-hang",
    title: "Max Hang",
    description: "7s max hang on 20-22mm edge — sets IHE working load at 60%.",
    time: "15–20 min",
    optional: false,
  },
  {
    id: "ihe",
    title: "Intermittent Endurance Test",
    description: "7s on / 3s off at 60% max hang until failure.",
    time: "15 min",
    optional: false,
  },
  {
    id: "caf",
    title: "Crux-After-Fatigue Simulation",
    description:
      "Move-count entry + crux rounds — establishes your workout baseline and session CAF score.",
    time: "30–45 min",
    optional: false,
  },
  {
    id: "pulling-strength",
    title: "Weighted Pull-up Test",
    description: "3-5 rep max weighted pull-ups (optional).",
    time: "10–15 min",
    optional: true,
  },
  {
    id: "campus-board",
    title: "Campus Board Assessment",
    description: "Max reach test (optional; skip if unavailable or painful).",
    time: "15 min",
    optional: true,
  },
  {
    id: "injury",
    title: "Injury Baseline",
    description: "Finger, elbow, shoulder symptoms + PE shoulder symptom score.",
    time: "5 min",
    optional: false,
  },
];

interface PowerEnduranceAssessmentFlowProps {
  programId: string;
  week: number;
  bodyweight: number;
  weightUnit: "lbs" | "kg";
  profile?: TrainingProfile | null;
  week0Benchmark?: CAFBenchmark | null;
  onComplete: (assessment: Omit<PowerEnduranceAssessment, "id" | "date">) => void;
  onQuit?: () => void;
}

export function PowerEnduranceAssessmentFlow({
  programId,
  week,
  bodyweight,
  weightUnit,
  profile,
  week0Benchmark,
  onComplete,
  onQuit,
}: PowerEnduranceAssessmentFlowProps) {
  const [activeTask, setActiveTask] = useState<TaskId | null>(null);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const [maxHangData, setMaxHangData] = useState<MaxHangAssessment | null>(null);
  const [iheData, setIheData] = useState<
    PowerEnduranceAssessment["intermittentEndurance"] | null
  >(null);
  const [cafData, setCafData] = useState<
    PowerEnduranceAssessment["cruxAfterFatigue"] | null
  >(null);
  const [campusData, setCampusData] = useState<CampusBoardAssessment | null | "skipped">(
    null
  );
  const [pullingData, setPullingData] = useState<
    PullingStrengthAssessment | null | "skipped"
  >(null);
  const [injuryData, setInjuryData] = useState<PEInjuryBaseline | null>(null);

  const completedMap: Record<TaskId, boolean> = {
    warmup: warmupDone,
    "max-hang": maxHangData !== null,
    ihe: iheData !== null,
    caf: cafData !== null,
    "campus-board": campusData !== null,
    "pulling-strength": pullingData !== null,
    injury: injuryData !== null,
  };

  const requiredDone =
    warmupDone &&
    maxHangData !== null &&
    iheData !== null &&
    cafData !== null &&
    injuryData !== null;

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const iheWorkingLoad = maxHangData ? getIHEWorkingLoad(maxHangData.bestLoad) : 0;
  const hasProgress = completedCount > 0;

  const resetAssessment = () => {
    setActiveTask(null);
    setWarmupDone(false);
    setMaxHangData(null);
    setIheData(null);
    setCafData(null);
    setCampusData(null);
    setPullingData(null);
    setInjuryData(null);
  };

  const handleQuitRequest = () => {
    if (hasProgress) {
      setShowQuitConfirm(true);
      return;
    }
    resetAssessment();
    onQuit?.();
  };

  const handleQuitConfirm = () => {
    setShowQuitConfirm(false);
    resetAssessment();
    onQuit?.();
  };

  const handleFinish = () => {
    if (!requiredDone || !maxHangData || !iheData || !cafData || !injuryData) return;

    const optionalTests: PEOptionalTests = {
      weightedPullup:
        pullingData && pullingData !== "skipped"
          ? {
              maxLoad: parseFloat(pullingData.bestWeightXReps) || 0,
              reps: 0,
            }
          : null,
      campusMaxReach:
        campusData && campusData !== "skipped"
          ? {
              highestRung: campusData.maxReach.bestRung,
              movesIn10RM: campusData.movesToFailure.totalMoves,
            }
          : null,
      routePowerEnduranceTest: null,
    };

    onComplete({
      programId,
      week,
      fingerMaxStrength: maxHangData,
      intermittentEndurance: iheData,
      cruxAfterFatigue: cafData,
      optionalTests,
      injuryBaseline: injuryData,
    });
  };

  if (activeTask === "warmup") {
    return (
      <div className="training-assessment-screen">
        <div className="training-assessment-header">
          <h2 className="training-assessment-title">Warm-Up</h2>
          <p className="training-assessment-subtitle">
            Complete before max hang and endurance tests.
          </p>
        </div>
        <div className="training-assessment-content">
          <ul className="training-assessment-instructions">
            <li>10+ minutes easy climbing</li>
            <li>Progressive hangs: bodyweight → 50% → 70% of target</li>
            <li>Arm circles and scapular activation</li>
          </ul>
        </div>
        <div className="training-assessment-actions">
          <button
            type="button"
            onClick={() => setActiveTask(null)}
            className="training-center-cta training-btn-secondary"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => {
              setWarmupDone(true);
              setActiveTask(null);
            }}
            className="training-center-cta"
          >
            Warm-up complete
          </button>
        </div>
      </div>
    );
  }

  if (activeTask === "max-hang") {
    return (
      <MaxHangTest
        bodyweight={bodyweight}
        weightUnit={weightUnit}
        onComplete={(data) => {
          setMaxHangData(data);
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "ihe" && maxHangData) {
    return (
      <IntermittentEnduranceTest
        workingLoad={iheWorkingLoad}
        weightUnit={weightUnit}
        onComplete={(data) => {
          setIheData(data);
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "caf") {
    return (
      <CruxAfterFatigueTest
        profile={profile}
        week={week}
        lockedBenchmark={week > 0 ? week0Benchmark : null}
        onComplete={(data) => {
          setCafData(data);
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "campus-board") {
    return (
      <CampusBoardTest
        onComplete={(data) => {
          setCampusData(data);
          setActiveTask(null);
        }}
        onSkip={() => {
          setCampusData("skipped");
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "pulling-strength") {
    return (
      <PullingStrengthTest
        weightUnit={weightUnit}
        onComplete={(data) => {
          setPullingData(data);
          setActiveTask(null);
        }}
        onSkip={() => {
          setPullingData("skipped");
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  if (activeTask === "injury") {
    return (
      <InjuryScreen
        showShoulderSymptomScore
        onComplete={(data) => {
          setInjuryData(data as PEInjuryBaseline);
          setActiveTask(null);
        }}
        onBack={() => setActiveTask(null)}
      />
    );
  }

  return (
    <div className="training-assessment-screen">
      <Link href="/training-center" className="training-assessment-back-link">
        ← Training Home
      </Link>

      <div className="training-assessment-header">
        <h2 className="training-assessment-title">
          {week === 0 ? "Week 0 Baseline Assessment" : `Week ${week} Retest`}
        </h2>
        <p className="training-assessment-subtitle">
          Complete the required assessments in any order. Optional assessments improve training precision.
        </p>
      </div>

      <div className="training-assessment-content">
        <div className="training-tasklist-progress">
          <div className="training-tasklist-progress-label">
            {completedCount} of {ASSESSMENT_TASKS.length} complete
          </div>
          <div className="training-tasklist-progress-bar">
            <div
              className="training-tasklist-progress-fill"
              style={{
                width: `${(completedCount / ASSESSMENT_TASKS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="training-tasklist-section-label">Required</div>
        <div className="training-tasklist">
          {ASSESSMENT_TASKS.filter((t) => !t.optional).map((task) => {
            const done = completedMap[task.id];
            const iheLocked = task.id === "ihe" && !maxHangData;
            return (
              <TaskRow
                key={task.id}
                task={task}
                done={done}
                disabled={iheLocked}
                disabledNote={iheLocked ? "Complete max hang first" : undefined}
                onStart={() => {
                  if (iheLocked) return;
                  setActiveTask(task.id);
                }}
              />
            );
          })}
        </div>

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

        {requiredDone && maxHangData && iheData && cafData && (
          <div className="training-assessment-summary" style={{ marginTop: "1.5rem" }}>
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Max Hang</h3>
              <p className="training-assessment-summary-value">
                {maxHangData.bestLoad} {weightUnit}
              </p>
              <p className="training-assessment-summary-sub">
                IHE load: {iheWorkingLoad} {weightUnit}
              </p>
            </div>
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">IHE Total Reps</h3>
              <p className="training-assessment-summary-value">{iheData.totalReps}</p>
            </div>
            <div className="training-assessment-summary-card">
              <h3 className="training-assessment-summary-label">Session CAF Score</h3>
              <p className="training-assessment-summary-value">{cafData.sessionCAFScore}</p>
              <p className="training-assessment-summary-sub">
                Success rate: {cafData.successRate}% · Benchmark ELS {cafData.benchmark.baselineELS}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        {onQuit && (
          <button
            type="button"
            onClick={handleQuitRequest}
            className="training-center-cta training-btn-secondary"
          >
            Quit assessment
          </button>
        )}
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
            ? week === 0
              ? "Save & Start Week 1"
              : "Save Retest"
            : `Complete required assessments (${Math.min(completedCount, 5)}/5)`}
        </button>
      </div>

      {showQuitConfirm &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            className="training-cancel-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-assessment-dialog-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowQuitConfirm(false);
            }}
          >
            <div className="training-cancel-dialog">
              <h3 id="quit-assessment-dialog-title" className="training-cancel-dialog-title">
                {week === 0 ? "Quit assessment?" : "Quit retest?"}
              </h3>
              <p className="training-cancel-dialog-body">
                Your in-progress {week === 0 ? "baseline" : "retest"} data will be
                discarded. You can start fresh when you return.
              </p>
              <div className="training-cancel-dialog-actions">
                <button
                  type="button"
                  onClick={() => setShowQuitConfirm(false)}
                  className="training-cancel-dialog-keep"
                >
                  Keep going
                </button>
                <button
                  type="button"
                  onClick={handleQuitConfirm}
                  className="training-cancel-dialog-confirm"
                >
                  Quit & start over
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function TaskRow({
  task,
  done,
  skipped = false,
  disabled = false,
  disabledNote,
  onStart,
}: {
  task: TaskMeta;
  done: boolean;
  skipped?: boolean;
  disabled?: boolean;
  disabledNote?: string;
  onStart: () => void;
}) {
  const isActedOn = done;

  return (
    <div
      className={`training-tasklist-item${
        isActedOn && !skipped ? " training-tasklist-item--done" : ""
      }${skipped ? " training-tasklist-item--skipped" : ""}`}
    >
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
          {disabledNote && (
            <span className="training-tasklist-equipment">{disabledNote}</span>
          )}
        </div>
      </div>

      <div className="training-tasklist-action">
        <button
          type="button"
          onClick={onStart}
          disabled={disabled}
          className={`training-tasklist-btn${
            isActedOn ? " training-tasklist-btn--redo" : ""
          }`}
          style={{
            opacity: disabled ? 0.45 : 1,
            cursor: disabled ? "not-allowed" : "pointer",
          }}
        >
          {skipped ? "Do it" : isActedOn ? "Edit" : "Start"}
        </button>
      </div>
    </div>
  );
}
