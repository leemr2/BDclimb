"use client";

import type { ProgressionSuggestion } from "@/lib/calculations/progression";

export function ProgressionCard({
  suggestion,
  loading,
}: {
  suggestion: ProgressionSuggestion | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="training-key-metrics">
        <h3 className="training-metrics-title">Load progression</h3>
        <p className="tc-placeholder-text">Loading…</p>
      </div>
    );
  }
  if (!suggestion) return null;

  return (
    <div className="training-key-metrics">
      <h3 className="training-metrics-title">Load progression</h3>
      <div
        className={`training-progression-tip training-progression-tip--${suggestion.type}`}
      >
        <p className="training-progression-message">{suggestion.message}</p>
        {suggestion.type === "increase" && suggestion.suggestedLoad != null && (
          <p className="training-progression-load">
            Suggested next load: <strong>{suggestion.suggestedLoad} lbs</strong>
          </p>
        )}
      </div>
    </div>
  );
}
