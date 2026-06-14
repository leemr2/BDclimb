"use client";

import type { KeyMetricsResult } from "@/lib/calculations/metrics";

export interface KeyMetricsProps {
  /** From getKeyMetrics(assessments, workouts). Null when loading or no data. */
  metrics: KeyMetricsResult | null;
  loading?: boolean;
}

function trendLabel(
  current: number | null,
  previous: number | null,
  suffix = ""
): string | null {
  if (current == null || previous == null || previous === 0) return null;
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return `0%${suffix}`;
  return `${pct > 0 ? "+" : ""}${pct}%${suffix}`;
}

export function KeyMetrics({ metrics, loading }: KeyMetricsProps) {
  const maxHangTrend = trendLabel(
    metrics?.maxHangLbs ?? null,
    metrics?.previousMaxHangLbs ?? null
  );
  const campusTrend = trendLabel(
    metrics?.campusReachRung ?? null,
    metrics?.previousCampusReachRung ?? null
  );

  const maxHangDisplay =
    metrics?.maxHangLbs != null
      ? `${metrics.maxHangLbs} lbs${metrics.maxHangPercentBW != null ? ` (${Math.round(metrics.maxHangPercentBW)}% BW)` : ""}${maxHangTrend ? ` (${maxHangTrend})` : ""}`
      : "—";
  const sendRateDisplay =
    metrics?.sendRate != null
      ? `${metrics.sendRate}%${metrics.sendRateDetail ? ` (${metrics.sendRateDetail.sent}/${metrics.sendRateDetail.attempted})` : ""}`
      : "—";
  const campusDisplay =
    metrics?.campusReachRung != null
      ? `Rung ${metrics.campusReachRung}${campusTrend ? ` (${campusTrend})` : ""}`
      : "—";

  return (
    <div className="training-key-metrics">
      <h3 className="training-metrics-title">Key metrics</h3>
      {loading ? (
        <p className="tc-placeholder-text">Loading…</p>
      ) : (
        <div className="training-metrics-grid">
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
            <span className="training-metric-label">Send rate</span>
            <span className="training-metric-value">{sendRateDisplay}</span>
            <span className="training-metric-note">
              {metrics?.sendRate != null
                ? "From limit bouldering logs"
                : "From limit bouldering logs"}
            </span>
          </div>
          <div className="training-metric-card">
            <span className="training-metric-label">Campus reach</span>
            <span className="training-metric-value">{campusDisplay}</span>
            <span className="training-metric-note">
              {metrics?.campusReachRung != null
                ? "From assessment"
                : "After Week 5+ assessment"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
