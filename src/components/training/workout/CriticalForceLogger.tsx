"use client";

import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useWorkout } from "@/lib/hooks/training/useWorkout";
import type { PEDrillDefinition, CriticalForceData } from "@/lib/plans/power-endurance/types";
import { RepeaterTimer } from "./RepeaterTimer";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

export interface CriticalForceLoggerProps {
  drill: PEDrillDefinition;
  onComplete: (data: CriticalForceData) => void;
}

type BlockDraft = CriticalForceData["blocks"][number];

export function CriticalForceLogger({ drill, onComplete }: CriticalForceLoggerProps) {
  const { dispatch, currentDrillIndex, persistDrills, drills, iheWorkingLoad, maxHangReference, weightUnit } =
    useWorkout();
  const blockCount = drill.sets ?? 3;
  const workingLoad = iheWorkingLoad || Math.round(maxHangReference * 0.6);

  const [blockIndex, setBlockIndex] = useState(0);
  const [blocks, setBlocks] = useState<BlockDraft[]>([]);
  const [timerKey, setTimerKey] = useState(0);
  const [phase, setPhase] = useState<"timer" | "log">("timer");
  const [pendingReps, setPendingReps] = useState(0);
  const [actualLoad, setActualLoad] = useState(workingLoad);
  const [finalFormMaintained, setFinalFormMaintained] = useState(true);
  const [forceStableLate, setForceStableLate] = useState(true);
  const [rpeDuringBlock, setRpeDuringBlock] = useState(8);
  const [intensityCalibration, setIntensityCalibration] =
    useState<CriticalForceData["intensityCalibration"]>("correct");
  const [forceConsistencyBlockToBlock, setForceConsistencyBlockToBlock] =
    useState<CriticalForceData["forceConsistencyBlockToBlock"]>("very_consistent");
  const [comparedToIHE, setComparedToIHE] =
    useState<CriticalForceData["comparedToIHE"]>("similar");
  const [progressionDecision, setProgressionDecision] =
    useState<CriticalForceData["progressionDecision"]>("maintain");

  const cfbTooHardWarning = intensityCalibration === "too_hard";

  const finishDrill = (allBlocks: BlockDraft[]) => {
    const totalReps = allBlocks.reduce((s, b) => s + b.repsCompleted, 0);
    const data: CriticalForceData = {
      maxHangReference: maxHangReference || workingLoad / 0.6,
      edgeSize: 20,
      gripType: "half_crimp",
      targetIntensityDescription: "RPE 8-9, stable — not maximal",
      rhythm: "7s on / 3s off",
      blocks: allBlocks,
      totalBlocksCompleted: allBlocks.length,
      totalReps,
      totalTimeUnderTensionSeconds: totalReps * 7,
      intensityCalibration,
      forceConsistencyBlockToBlock,
      comparedToIHE,
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

  const handleLogBlock = () => {
    const block: BlockDraft = {
      targetLoad: workingLoad,
      actualLoad,
      repsCompleted: pendingReps,
      finalFormMaintained,
      forceStableLate,
      rpeDuringBlock,
      restAfterMinutes: 7,
      notes: "",
    };
    const nextBlocks = [...blocks, block];
    if (blockIndex + 1 >= blockCount) {
      finishDrill(nextBlocks);
      return;
    }
    setBlocks(nextBlocks);
    setBlockIndex((i) => i + 1);
    setPhase("timer");
    setPendingReps(0);
    setTimerKey((k) => k + 1);
  };

  if (blockIndex + 1 >= blockCount && phase === "log") {
    // show summary fields on last block
  }

  return (
    <div className="training-cfb-log">
      <h4 className="training-cfb-log-title">
        {drill.name} — Block {blockIndex + 1} of {blockCount}
      </h4>
      <p className="training-cfb-log-hint">
        Load: {workingLoad} {weightUnit} · Rhythm: 7s on / 3s off · Target RPE 8–9
      </p>

      {phase === "timer" ? (
        <RepeaterTimer
          key={timerKey}
          restSeconds={3}
          showSummaryOnStop={false}
          showRestSelector={false}
          startLabel="Start block"
          onStop={(reps) => {
            setPendingReps(reps);
            setPhase("log");
          }}
        />
      ) : (
        <div className="training-form-group">
          <p className="training-cfb-log-stats">Reps this block: {pendingReps}</p>
          <label>
            Actual load ({weightUnit})
            <input
              type="number"
              value={actualLoad}
              onChange={(e) => setActualLoad(Number(e.target.value))}
              className="training-form-group input"
            />
          </label>
          <NumberSlider
            label="RPE during block"
            value={rpeDuringBlock}
            onChange={setRpeDuringBlock}
            min={6}
            max={10}
          />
          <label>
            <input
              type="checkbox"
              checked={finalFormMaintained}
              onChange={(e) => setFinalFormMaintained(e.target.checked)}
            />
            {" "}Form maintained
          </label>
          <label>
            <input
              type="checkbox"
              checked={forceStableLate}
              onChange={(e) => setForceStableLate(e.target.checked)}
            />
            {" "}Force stable late in block
          </label>

          {blockIndex + 1 >= blockCount && (
            <>
              <label>
                Intensity calibration
                <select
                  value={intensityCalibration}
                  onChange={(e) =>
                    setIntensityCalibration(
                      e.target.value as CriticalForceData["intensityCalibration"]
                    )
                  }
                  className="training-form-group input"
                >
                  <option value="correct">Correct</option>
                  <option value="too_easy">Too easy</option>
                  <option value="too_hard">Too hard</option>
                  <option value="inconsistent">Inconsistent</option>
                </select>
              </label>
              {cfbTooHardWarning && (
                <p className="training-cfb-log-warning">
                  Reduce load 5–10% for remaining blocks. CFB should feel RPE 8–9 sustainable.
                </p>
              )}
              <label>
                Block-to-block consistency
                <select
                  value={forceConsistencyBlockToBlock}
                  onChange={(e) =>
                    setForceConsistencyBlockToBlock(
                      e.target.value as CriticalForceData["forceConsistencyBlockToBlock"]
                    )
                  }
                  className="training-form-group input"
                >
                  <option value="very_consistent">Very consistent</option>
                  <option value="slight_decline">Slight decline</option>
                  <option value="significant_decline">Significant decline</option>
                  <option value="major_drop">Major drop</option>
                </select>
              </label>
              <label>
                Compared to IHE
                <select
                  value={comparedToIHE}
                  onChange={(e) =>
                    setComparedToIHE(e.target.value as CriticalForceData["comparedToIHE"])
                  }
                  className="training-form-group input"
                >
                  <option value="harder">Harder</option>
                  <option value="similar">Similar</option>
                  <option value="easier">Easier</option>
                  <option value="different">Different</option>
                </select>
              </label>
              <label>
                Progression decision
                <select
                  value={progressionDecision}
                  onChange={(e) =>
                    setProgressionDecision(
                      e.target.value as CriticalForceData["progressionDecision"]
                    )
                  }
                  className="training-form-group input"
                >
                  <option value="maintain">Maintain</option>
                  <option value="increase_load">Increase load</option>
                  <option value="reduce_load">Reduce load</option>
                  <option value="reduce_to_2_blocks">Reduce to 2 blocks</option>
                </select>
              </label>
            </>
          )}

          <button type="button" className="training-timer-btn" onClick={handleLogBlock}>
            {blockIndex + 1 >= blockCount ? "Complete drill" : "End block & rest"}
          </button>
        </div>
      )}
    </div>
  );
}
