"use client";

import type { CAFBenchmark, CAFRoundBase } from "@/lib/plans/power-endurance/types";
import {
  CAF_CRUX_GRADES,
  YDS_ENTRY_GRADES,
  calcCAFRoundScore,
} from "@/lib/plans/power-endurance/calculations";

export interface CAFRoundDraft {
  entryMoves: number;
  entryGrade: string;
  cruxDescription: string;
  cruxGrade: string;
  cruxTotalMoves: number;
  movesCompleted: number;
  leadInCompleted: boolean;
  pumpBeforeCrux: number;
  executionQuality: number;
  mentalState?: CAFRoundBase["mentalState"];
  notes: string;
}

interface CAFRoundLoggerProps {
  roundIndex: number;
  benchmark: CAFBenchmark;
  value: CAFRoundDraft;
  onChange: (value: CAFRoundDraft) => void;
  lockEntry?: boolean;
  readOnly?: boolean;
}

const MENTAL_STATES: NonNullable<CAFRoundBase["mentalState"]>[] = [
  "focused",
  "distracted",
  "anxious",
  "confident",
];

export function createEmptyCAFRoundDraft(benchmark: CAFBenchmark): CAFRoundDraft {
  return {
    entryMoves: benchmark.entryMoves,
    entryGrade: benchmark.entryGrade,
    cruxDescription: benchmark.cruxDescription,
    cruxGrade: benchmark.cruxGrade,
    cruxTotalMoves: benchmark.cruxTotalMoves,
    movesCompleted: 0,
    leadInCompleted: true,
    pumpBeforeCrux: 5,
    executionQuality: 3,
    notes: "",
  };
}

export function draftToCAFRound(draft: CAFRoundDraft): CAFRoundBase {
  return calcCAFRoundScore({
    entryMoves: draft.entryMoves,
    entryGrade: draft.entryGrade,
    cruxGrade: draft.cruxGrade,
    cruxTotalMoves: draft.cruxTotalMoves,
    movesCompleted: draft.movesCompleted,
    cruxDescription: draft.cruxDescription,
    leadInCompleted: draft.leadInCompleted,
    pumpBeforeCrux: draft.pumpBeforeCrux,
    executionQuality: draft.executionQuality,
    mentalState: draft.mentalState,
    notes: draft.notes,
  });
}

export function CAFRoundLogger({
  roundIndex,
  benchmark,
  value,
  onChange,
  lockEntry = false,
  readOnly = false,
}: CAFRoundLoggerProps) {
  const scored = draftToCAFRound(value);

  const update = <K extends keyof CAFRoundDraft>(field: K, fieldValue: CAFRoundDraft[K]) => {
    if (readOnly) return;
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="training-assessment-section">
      <h3 className="training-assessment-section-title">Round {roundIndex + 1}</h3>

      <p className="training-assessment-section-hint" style={{ marginBottom: "0.75rem" }}>
        Part A — Entry
      </p>
      <div className="training-injury-simple-grid">
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Entry grade:</span>
          <select
            value={value.entryGrade}
            disabled={lockEntry || readOnly}
            onChange={(e) => update("entryGrade", e.target.value)}
            className="training-injury-input"
          >
            {YDS_ENTRY_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Entry moves:</span>
          <input
            type="number"
            min={1}
            max={80}
            value={value.entryMoves}
            disabled={lockEntry || readOnly}
            onChange={(e) => update("entryMoves", parseInt(e.target.value, 10) || 0)}
            className="training-injury-input"
          />
        </label>
        <p className="training-assessment-section-hint">
          ELS: {value.entryMoves} × {scored.entryGradeMultiplier} = {scored.els}
        </p>
        <label className="training-injury-input-group">
          <input
            type="checkbox"
            checked={value.leadInCompleted}
            disabled={readOnly}
            onChange={(e) => update("leadInCompleted", e.target.checked)}
          />
          <span className="training-injury-input-label">Entry completed</span>
        </label>
      </div>

      <p className="training-assessment-section-hint" style={{ margin: "1rem 0 0.75rem" }}>
        Part B — Crux (immediately after entry)
      </p>
      <div className="training-injury-simple-grid">
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Crux grade:</span>
          <select
            value={value.cruxGrade}
            disabled={lockEntry || readOnly}
            onChange={(e) => update("cruxGrade", e.target.value)}
            className="training-injury-input"
          >
            {CAF_CRUX_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Total crux moves:</span>
          <input
            type="number"
            min={1}
            max={20}
            value={value.cruxTotalMoves}
            disabled={lockEntry || readOnly}
            onChange={(e) =>
              update("cruxTotalMoves", parseInt(e.target.value, 10) || benchmark.cruxTotalMoves)
            }
            className="training-injury-input"
          />
        </label>
        {!lockEntry && (
          <label className="training-injury-input-group" style={{ gridColumn: "1 / -1" }}>
            <span className="training-injury-input-label">Crux description:</span>
            <input
              type="text"
              value={value.cruxDescription}
              disabled={readOnly}
              onChange={(e) => update("cruxDescription", e.target.value)}
              className="training-injury-input"
            />
          </label>
        )}
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Pump before crux (1-10):</span>
          <input
            type="number"
            min={1}
            max={10}
            value={value.pumpBeforeCrux}
            disabled={readOnly}
            onChange={(e) => update("pumpBeforeCrux", parseInt(e.target.value, 10) || 1)}
            className="training-injury-input"
          />
        </label>
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Moves completed:</span>
          <input
            type="number"
            min={0}
            max={value.cruxTotalMoves}
            value={value.movesCompleted}
            disabled={readOnly}
            onChange={(e) => update("movesCompleted", parseInt(e.target.value, 10) || 0)}
            className="training-injury-input"
          />
        </label>
        <p className="training-assessment-section-hint">
          CDS: {value.movesCompleted} × {scored.cruxGradeMultiplier} = {scored.cds}
          {scored.success ? " ✓ SEND" : ""}
        </p>
        <label className="training-injury-input-group">
          <span className="training-injury-input-label">Execution quality (1-5):</span>
          <input
            type="number"
            min={1}
            max={5}
            value={value.executionQuality}
            disabled={readOnly}
            onChange={(e) => update("executionQuality", parseInt(e.target.value, 10) || 1)}
            className="training-injury-input"
          />
        </label>
        <div className="training-injury-input-group" style={{ gridColumn: "1 / -1" }}>
          <span className="training-injury-input-label">Mental state:</span>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" }}>
            {MENTAL_STATES.map((state) => (
              <button
                key={state}
                type="button"
                disabled={readOnly}
                className={
                  value.mentalState === state
                    ? "training-center-cta"
                    : "training-center-cta training-btn-secondary"
                }
                style={{ fontSize: "0.85rem", padding: "0.35rem 0.65rem" }}
                onClick={() => update("mentalState", state)}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="training-assessment-section-hint" style={{ marginTop: "0.75rem" }}>
        Round score: ELS {scored.els} + CDS {scored.cds} = <strong>{scored.roundScore}</strong>
      </p>
    </div>
  );
}
