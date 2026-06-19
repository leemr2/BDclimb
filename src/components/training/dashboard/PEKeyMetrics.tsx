"use client";

import type { PEKeyMetricsResult } from "@/lib/calculations/metrics";

export interface PEKeyMetricsProps {
  /** From getPEKeyMetrics(assessments, workouts). Null when loading or no data. */
  metrics: PEKeyMetricsResult | null;
  loading?: boolean;
}

function pointTrend(
  current: number | null,
  previous: number | null,
  suffix = ""
): string | null {
  if (current == null || previous == null) return null;
  const delta = Math.round(current - previous);
  if (delta === 0) return null;
  return `${delta > 0 ? "+" : ""}${delta}${suffix}`;
}

export function PEKeyMetrics({ metrics, loading }: PEKeyMetricsProps) {
  const cruxTrend = pointTrend(
    metrics?.cruxSuccessRate ?? null,
    metrics?.previousCruxSuccessRate ?? null,
    "%"
  );
  const iheTrend = pointTrend(
    metrics?.iheTotalReps ?? null,
    metrics?.previousIheTotalReps ?? null
  );

  const cruxDisplay =
    metrics?.cruxSuccessRate != null
      ? `${metrics.cruxSuccessRate}%${cruxTrend ? ` (${cruxTrend})` : ""}`
      : "—";
  const iheDisplay =
    metrics?.iheTotalReps != null
      ? `${metrics.iheTotalReps}${iheTrend ? ` (${iheTrend})` : ""}`
      : "—";
  const maxHangDisplay =
    metrics?.maxHangLbs != null
      ? `${metrics.maxHangLbs} lbs${metrics.maxHangPercentBW != null ? ` (${Math.round(metrics.maxHangPercentBW)}% BW)` : ""}`
      : "—";
  const fluencyDisplay =
    metrics?.fluencyStopsPerSet != null
      ? `${metrics.fluencyStopsPerSet}/set`
      : "—";
  const slipsDisplay =
    metrics?.silentFootSlipsPerSession != null
      ? `${metrics.silentFootSlipsPerSession}/session`
      : "—";

  return (
    <div className="training-key-metrics">
      <h3 className="training-metrics-title">Key metrics</h3>
      {loading ? (
        <p className="tc-placeholder-text">Loading…</p>
      ) : (
        <div className="training-metrics-grid">
          <div className="training-metric-card">
            <span className="training-metric-label">Crux success rate</span>
            <span className="training-metric-value">{cruxDisplay}</span>
            <span className="training-metric-note">
              {metrics?.cruxSuccessRate != null
                ? "Latest crux-after-fatigue session"
                : "After your first CAF session"}
            </span>
          </div>
          <div className="training-metric-card">
            <span className="training-metric-label">IHE reps</span>
            <span className="training-metric-value">{iheDisplay}</span>
            <span className="training-metric-note">
              {metrics?.iheTotalReps != null
                ? "From latest assessment"
                : "After Week 0 assessment"}
            </span>
          </div>
          <div className="training-metric-card">
            <span className="training-metric-label">Max hang</span>
            <span className="training-metric-value">{maxHangDisplay}</span>
            <span className="training-metric-note">
              {metrics?.maxHangLbs != null
                ? "From latest assessment"
                : "After Week 0 assessment"}
            </span>
          </div>
          <div className="training-metric-card">
            <span className="training-metric-label">Fluency stops</span>
            <span className="training-metric-value">{fluencyDisplay}</span>
            <span className="training-metric-note">
              Lower is better · latest ARC session
            </span>
          </div>
          <div className="training-metric-card">
            <span className="training-metric-label">Silent foot slips</span>
            <span className="training-metric-value">{slipsDisplay}</span>
            <span className="training-metric-note">
              Lower is better · latest ARC session
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
