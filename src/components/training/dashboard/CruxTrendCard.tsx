"use client";

import type { CruxSessionTrend } from "@/lib/plans/power-endurance/calculations";

export interface CruxTrendCardProps {
  /** From getCruxSessionScoreTrend(workouts). Null when loading. */
  trend: CruxSessionTrend | null;
  loading?: boolean;
}

const TREND_LABEL: Record<CruxSessionTrend["trend"], string> = {
  improving: "↑ Improving",
  stable: "→ Stable",
  declining: "↓ Declining",
};

export function CruxTrendCard({ trend, loading }: CruxTrendCardProps) {
  const rates = trend?.rates ?? [];

  return (
    <div className="training-crux-trend">
      <h3 className="training-metrics-title">Crux success trend</h3>
      {loading ? (
        <p className="tc-placeholder-text">Loading…</p>
      ) : rates.length === 0 ? (
        <p className="tc-placeholder-text">
          Complete crux-after-fatigue sessions to see your success-rate trend.
        </p>
      ) : (
        <>
          <div className="training-crux-trend-bars" aria-hidden>
            {rates.map((rate, i) => (
              <div
                key={i}
                className="training-crux-trend-bar"
                style={{ height: `${Math.max(rate, 2)}%` }}
                title={`${rate}%`}
              />
            ))}
          </div>
          <p className="training-crux-trend-sequence">
            Last {rates.length} CAF session{rates.length === 1 ? "" : "s"}:{" "}
            {rates.map((r) => `${r}%`).join(" → ")}
          </p>
          {trend && (
            <p
              className={`training-crux-trend-label training-crux-trend-label--${trend.trend}`}
            >
              {TREND_LABEL[trend.trend]}
            </p>
          )}
        </>
      )}
    </div>
  );
}
