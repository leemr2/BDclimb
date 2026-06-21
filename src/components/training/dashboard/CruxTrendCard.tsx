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
  const scores = trend?.scores ?? [];
  const rates = trend?.rates ?? [];
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;

  return (
    <div className="training-crux-trend">
      <h3 className="training-metrics-title">Crux CAF score trend</h3>
      {loading ? (
        <p className="tc-placeholder-text">Loading…</p>
      ) : scores.length === 0 ? (
        <p className="tc-placeholder-text">
          Complete crux-after-fatigue sessions to see your CAF score trend.
        </p>
      ) : (
        <>
          <div className="training-crux-trend-bars" aria-hidden>
            {scores.map((score, i) => (
              <div
                key={i}
                className="training-crux-trend-bar"
                style={{
                  height: `${maxScore > 0 ? Math.max((score / maxScore) * 100, 2) : 2}%`,
                }}
                title={`CAF ${score}`}
              />
            ))}
          </div>
          <p className="training-crux-trend-sequence">
            Last {scores.length} CAF session{scores.length === 1 ? "" : "s"}:{" "}
            {scores.map((s) => `${s}`).join(" → ")}
          </p>
          {rates.length > 0 && (
            <p className="training-crux-trend-secondary">
              Success rate: {rates.map((r) => `${r}%`).join(" → ")}
            </p>
          )}
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
