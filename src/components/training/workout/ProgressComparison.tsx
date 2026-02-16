"use client";

/**
 * Shows "Last time vs now" for the current drill (e.g. last session load vs today's target).
 * Can be extended to fetch from workout history.
 */
export interface ProgressComparisonProps {
  label?: string;
  lastValue?: string;
  currentValue?: string;
}

export function ProgressComparison({
  label = "Last time",
  lastValue,
  currentValue,
}: ProgressComparisonProps) {
  if (!lastValue && !currentValue) return null;
  return (
    <div className="training-progress-comparison">
      {lastValue && <span className="training-progress-last">{label}: {lastValue}</span>}
      {currentValue && <span className="training-progress-now">Today: {currentValue}</span>}
    </div>
  );
}
