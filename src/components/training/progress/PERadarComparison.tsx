"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  buildPERadarSeries,
  PE_RADAR_AXIS_LABELS,
  type PERadarAxis,
} from "@/lib/calculations/peAssessmentComparison";
import type { PowerEnduranceAssessment } from "@/lib/plans/power-endurance/types";

const WEEK_COLORS = [
  "rgb(96, 165, 250)",
  "rgb(52, 211, 153)",
  "rgb(167, 139, 250)",
  "rgb(251, 191, 36)",
];

const AXES: PERadarAxis[] = [
  "maxHang",
  "iheReps",
  "cruxRate",
  "pullup",
  "recovery",
];

interface PERadarComparisonProps {
  assessments: PowerEnduranceAssessment[];
}

export function PERadarComparison({ assessments }: PERadarComparisonProps) {
  const series = buildPERadarSeries(assessments);

  if (series.length === 0) {
    return (
      <p className="progress-chart-empty">
        Complete your Week 0 assessment to see comparison charts.
      </p>
    );
  }

  // Recharts radar expects one row per axis with week values as keys.
  const chartData = AXES.map((axis) => {
    const row: Record<string, string | number> = {
      axis: PE_RADAR_AXIS_LABELS[axis],
    };
    for (const s of series) {
      const v = s.values[axis];
      if (v != null) row[s.label] = v;
    }
    return row;
  });

  const hasMultipleWeeks = series.length >= 2;

  return (
    <div className="radar-comparison">
      {!hasMultipleWeeks && (
        <p className="radar-comparison-hint">
          Complete a retest (Week 4+) to overlay progress against your baseline.
        </p>
      )}
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid className="progress-chart-grid" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 150]}
            tick={{ fontSize: 10 }}
            label={{ value: "Index (W0=100)", position: "outside", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,30,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
          />
          <Legend />
          {series.map((s, i) => (
            <Radar
              key={s.week}
              name={s.label}
              dataKey={s.label}
              stroke={WEEK_COLORS[i % WEEK_COLORS.length]}
              fill={WEEK_COLORS[i % WEEK_COLORS.length]}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
