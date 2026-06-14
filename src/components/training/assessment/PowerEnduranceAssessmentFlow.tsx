"use client";

import { useState } from "react";
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
} from "@/lib/plans/power-endurance/types";
import type {
  MaxHangAssessment,
  CampusBoardAssessment,
  PullingStrengthAssessment,
} from "@/lib/plans/bouldering/types";
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
    title: "Finger Max Strength Test",
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
    description: "Lead-in climbing then crux attempts — your primary KPI baseline.",
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
  onComplete: (assessment: Omit<PowerEnduranceAssessment, "id" | "date">) => void;
}

export function PowerEnduranceAssessmentFlow({
  programId,
  week,
  bodyweight,
  weightUnit,
  onComplete,
}: PowerEnduranceAssessmentFlowProps) {
  const [activeTask, setActiveTask] = useState<TaskId | null>(null);
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

  if (activeTask === "max-hang" && maxHangData === null) {
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
          Power-endurance assessment: max hang, intermittent endurance, and crux-after-fatigue.
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
          {ASSESSMENT_TASKS.filter((t) => !t.optional).map((task) => (
            <button
              key={task.id}
              type="button"
              className={`training-tasklist-item ${completedMap[task.id] ? "done" : ""}`}
              onClick={() => {
                if (task.id === "ihe" && !maxHangData) return;
                setActiveTask(task.id);
              }}
              disabled={task.id === "ihe" && !maxHangData}
            >
              <span className="training-tasklist-item-title">{task.title}</span>
              <span className="training-tasklist-item-meta">{task.time}</span>
              {task.id === "ihe" && !maxHangData && (
                <span className="training-tasklist-item-note">Complete max hang first</span>
              )}
            </button>
          ))}
        </div>

        <div className="training-tasklist-section-label" style={{ marginTop: "1.25rem" }}>
          Optional
        </div>
        <div className="training-tasklist">
          {ASSESSMENT_TASKS.filter((t) => t.optional).map((task) => (
            <button
              key={task.id}
              type="button"
              className={`training-tasklist-item ${completedMap[task.id] ? "done" : ""}`}
              onClick={() => setActiveTask(task.id)}
            >
              <span className="training-tasklist-item-title">{task.title}</span>
              <span className="training-tasklist-item-meta">{task.time}</span>
            </button>
          ))}
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
              <h3 className="training-assessment-summary-label">Crux Success Rate</h3>
              <p className="training-assessment-summary-value">{cafData.successRate}%</p>
            </div>
          </div>
        )}
      </div>

      <div className="training-assessment-actions">
        <button
          type="button"
          onClick={handleFinish}
          disabled={!requiredDone}
          className="training-center-cta"
        >
          Confirm &amp; {week === 0 ? "Start Program" : "Save Retest"}
        </button>
      </div>
    </div>
  );
}
