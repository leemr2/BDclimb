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
  suffix = "",
  decimals = 0
): string | null {
  if (current == null || previous == null) return null;
  const factor = 10 ** decimals;
  const delta = Math.round((current - previous) * factor) / factor;
  if (delta === 0) return null;
  return `${delta > 0 ? "+" : ""}${delta}${suffix}`;
}

export function PEKeyMetrics({ metrics, loading }: PEKeyMetricsProps) {
  const cafTrend = pointTrend(
    metrics?.cafScore ?? null,
    metrics?.previousCafScore ?? null,
    "",
    1
  );
  const iheTrend = pointTrend(
    metrics?.iheTotalReps ?? null,
    metrics?.previousIheTotalReps ?? null
  );

  const cafDisplay =
    metrics?.cafScore != null
      ? `${metrics.cafScore}${cafTrend ? ` (${cafTrend})` : ""}`
      : "—";
  const cafNote =
    metrics?.cruxSuccessRate != null
      ? `${metrics.cruxSuccessRate}% crux success · latest CAF session`
      : "Total round score ÷ rounds";
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
            <span className="training-metric-label">Session CAF score</span>
            <span className="training-metric-value">{cafDisplay}</span>
            <span className="training-metric-note">
              {metrics?.cafScore != null
                ? cafNote
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
