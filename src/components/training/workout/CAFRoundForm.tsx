"use client";

import type { ReactNode } from "react";
import type { CAFBenchmark, CAFRoundBase } from "@/lib/plans/power-endurance/types";
import {
  CAF_CRUX_GRADES,
  YDS_ENTRY_GRADES,
  normalizeCAFCruxGrade,
  calcCAFRoundScore,
} from "@/lib/plans/power-endurance/calculations";
import { NumberSlider } from "@/components/training/ui/NumberSlider";

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

interface CAFRoundFormProps {
  roundIndex: number;
  benchmark: CAFBenchmark;
  value: CAFRoundDraft;
  onChange: (value: CAFRoundDraft) => void;
  lockEntry?: boolean;
  readOnly?: boolean;
  footer?: ReactNode;
}

export function createEmptyCAFRoundDraft(benchmark: CAFBenchmark): CAFRoundDraft {
  return {
    entryMoves: benchmark.entryMoves,
    entryGrade: benchmark.entryGrade,
    cruxDescription: benchmark.cruxDescription,
    cruxGrade: normalizeCAFCruxGrade(benchmark.cruxGrade),
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

export function CAFRoundForm({
  roundIndex,
  value,
  onChange,
  lockEntry = false,
  readOnly = false,
  footer,
}: CAFRoundFormProps) {
  const scored = draftToCAFRound(value);

  const update = <K extends keyof CAFRoundDraft>(field: K, fieldValue: CAFRoundDraft[K]) => {
    if (readOnly) return;
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="training-caf-round-form">
      <h4 className="training-caf-log-title">Round {roundIndex + 1}</h4>

      <p className="training-caf-log-hint">Part A — Entry</p>

      <div className="training-form-group">
        <label>
          Entry grade
          <select
            value={value.entryGrade}
            disabled={lockEntry || readOnly}
            onChange={(e) => update("entryGrade", e.target.value)}
            className="training-form-group input"
          >
            {YDS_ENTRY_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <NumberSlider
        label="Entry moves"
        value={value.entryMoves}
        onChange={(v) => update("entryMoves", v)}
        min={1}
        max={80}
        unit="moves"
        disabled={lockEntry || readOnly}
        hint={`ELS: ${value.entryMoves} × ${scored.entryGradeMultiplier} = ${scored.els}`}
      />

      <div className="training-form-group">
        <label>
          <input
            type="checkbox"
            checked={value.leadInCompleted}
            disabled={readOnly}
            onChange={(e) => update("leadInCompleted", e.target.checked)}
          />
          {" "}Entry completed
        </label>
      </div>

      <p className="training-caf-log-hint">Part B — Crux (immediately after entry)</p>

      <div className="training-form-group">
        <label>
          Crux grade
          <select
            value={value.cruxGrade}
            disabled={lockEntry || readOnly}
            onChange={(e) => update("cruxGrade", e.target.value)}
            className="training-form-group input"
          >
            {CAF_CRUX_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </label>
      </div>

      <NumberSlider
        label="Total crux moves"
        value={value.cruxTotalMoves}
        onChange={(v) =>
          onChange({
            ...value,
            cruxTotalMoves: v,
            movesCompleted: Math.min(value.movesCompleted, v),
          })
        }
        min={1}
        max={20}
        unit="moves"
        disabled={lockEntry || readOnly}
      />

      {!lockEntry && (
        <div className="training-form-group">
          <label>
            Crux description
            <input
              type="text"
              value={value.cruxDescription}
              disabled={readOnly}
              onChange={(e) => update("cruxDescription", e.target.value)}
              className="training-form-group input"
            />
          </label>
        </div>
      )}

      <NumberSlider
        label="Pump before crux"
        value={value.pumpBeforeCrux}
        onChange={(v) => update("pumpBeforeCrux", v)}
        min={1}
        max={10}
        disabled={readOnly}
        hint="Rate forearm pump right before the crux attempt (1 = fresh, 10 = maxed)"
      />

      <NumberSlider
        label="Moves completed"
        value={value.movesCompleted}
        onChange={(v) => update("movesCompleted", v)}
        min={0}
        max={value.cruxTotalMoves}
        unit="moves"
        disabled={readOnly}
        hint={`CDS: ${value.movesCompleted} × ${scored.cruxGradeMultiplier} = ${scored.cds}${
          scored.success ? " ✓ SEND" : ""
        }`}
      />

      <NumberSlider
        label="Execution quality"
        value={value.executionQuality}
        onChange={(v) => update("executionQuality", v)}
        min={1}
        max={5}
        disabled={readOnly}
        hint="How cleanly did you execute the crux? (1 = sloppy, 5 = crisp)"
      />

      <p className="training-caf-log-stats">
        Round score: ELS {scored.els} + CDS {scored.cds} = <strong>{scored.roundScore}</strong>
      </p>

      {footer}
    </div>
  );
}

/** @deprecated Use CAFRoundForm */
export const CAFRoundLogger = CAFRoundForm;
