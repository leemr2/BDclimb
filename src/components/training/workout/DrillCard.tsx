"use client";

import type { DrillDefinition } from "@/lib/plans/bouldering/types";
import type { PEDrillDefinition } from "@/lib/plans/power-endurance/types";

export interface DrillCardProps {
  drill: DrillDefinition | PEDrillDefinition;
  onBegin: () => void;
}

export function DrillCard({ drill, onBegin }: DrillCardProps) {
  const peDrill = drill as PEDrillDefinition;
  const cafResolved = peDrill.cafResolved;

  return (
    <div className="training-drill-card">
      <h3 className="training-drill-card-title">{drill.name}</h3>
      <p className="training-drill-card-description">{drill.description}</p>
      {cafResolved && (
        <p className="training-drill-card-meta">
          CAF targets: {cafResolved.entryGrade} × {cafResolved.entryMoves} moves (ELS{" "}
          {cafResolved.targetELS}) · {cafResolved.rounds} rounds · Crux {cafResolved.cruxGrade}
        </p>
      )}
      {drill.sets != null && !cafResolved && (
        <p className="training-drill-card-meta">
          {drill.sets} sets
          {drill.reps != null && ` · ${drill.reps}`}
          {drill.intensity != null && ` · ${drill.intensity}`}
          {drill.restSeconds != null && ` · ${drill.restSeconds}s rest`}
        </p>
      )}
      <ol className="training-drill-card-instructions">
        {drill.instructions.map((step, i) => (
          <li key={i} className="training-drill-card-step">
            {step}
          </li>
        ))}
      </ol>
      {drill.safetyWarnings.length > 0 && (
        <div className="training-drill-card-warnings">
          <strong className="training-drill-card-warnings-title">Safety</strong>
          <ul className="training-drill-card-warnings-list">
            {drill.safetyWarnings.map((w, i) => (
              <li key={i} className="training-drill-card-warning">{w}</li>
            ))}
          </ul>
        </div>
      )}
      {drill.progressionRules.length > 0 && (
        <div className="training-drill-card-progression">
          <strong className="training-drill-card-progression-title">Progression</strong>
          <ul className="training-drill-card-progression-list">
            {drill.progressionRules.map((r, i) => (
              <li key={i} className="training-drill-card-progression-rule">{r}</li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        className="training-drill-card-begin training-timer-btn"
        onClick={onBegin}
      >
        Begin drill
      </button>
    </div>
  );
}
