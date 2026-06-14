"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  description?: string;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: ReactNode;
}

export function ChartCard({
  title,
  description,
  loading,
  empty,
  emptyMessage = "Not enough data yet.",
  children,
}: ChartCardProps) {
  return (
    <div className="progress-chart-card">
      <div className="progress-chart-card-header">
        <h3 className="progress-chart-title">{title}</h3>
        {description && (
          <p className="progress-chart-description">{description}</p>
        )}
      </div>
      <div className="progress-chart-body">
        {loading ? (
          <p className="progress-chart-empty">Loading…</p>
        ) : empty ? (
          <p className="progress-chart-empty">{emptyMessage}</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
