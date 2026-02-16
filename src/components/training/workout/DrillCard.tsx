"use client";

import type { DrillDefinition } from "@/lib/plans/bouldering/types";

export interface DrillCardProps {
  drill: DrillDefinition;
  onBegin: () => void;
}

export function DrillCard({ drill, onBegin }: DrillCardProps) {
  return (
    <div className="training-drill-card">
      <h3 className="training-drill-card-title">{drill.name}</h3>
      <p className="training-drill-card-description">{drill.description}</p>
      {drill.sets != null && (
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
