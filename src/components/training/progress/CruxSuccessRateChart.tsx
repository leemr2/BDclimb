"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { CruxSuccessPoint } from "@/lib/calculations/peChartSeries";
import { getPEMesocycleBoundaries } from "@/lib/calculations/peChartSeries";
import { ChartCard } from "./ChartCard";

interface CruxSuccessRateChartProps {
  data: CruxSuccessPoint[];
  loading?: boolean;
}

export function CruxSuccessRateChart({
  data,
  loading,
}: CruxSuccessRateChartProps) {
  // Split the CAF-score series into workout vs assessment lines so each source
  // renders with its own marker style; success rate is shown on the right axis.
  const chartData = data.map((p) => ({
    ...p,
    workoutCaf: p.source === "workout" ? p.cafScore : null,
    assessmentCaf: p.source === "assessment" ? p.cafScore : null,
  }));

  return (
    <ChartCard
      title="Session CAF Score"
      description="Primary KPI — session CAF score (total round score ÷ rounds) across CAF sessions; crux success rate shown alongside. Assessment benchmarks at test weeks."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Log crux-after-fatigue sessions to track your primary metric."
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="caf"
            tick={{ fontSize: 12 }}
            label={{
              value: "CAF score",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="rate"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{
              value: "% success",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11 },
            }}
          />
          {getPEMesocycleBoundaries().map((w) => (
            <ReferenceLine
              key={w}
              yAxisId="caf"
              x={`W${w}`}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
            />
          ))}
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,30,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
            formatter={(value, name) => {
              if (value == null || value === "") return ["—", String(name)];
              const v = typeof value === "number" ? value : Number(value);
              if (name === "successRate") return [`${v}%`, "Crux success rate"];
              return [v, name === "workoutCaf" ? "Workout CAF score" : "Assessment CAF score"];
            }}
          />
          <Legend />
          <Line
            yAxisId="caf"
            type="monotone"
            dataKey="workoutCaf"
            name="Workout CAF score"
            stroke="rgb(96, 165, 250)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4 }}
          />
          <Line
            yAxisId="caf"
            type="monotone"
            dataKey="assessmentCaf"
            name="Assessment CAF score"
            stroke="rgb(244, 114, 182)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 6 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="successRate"
            name="Crux success rate"
            stroke="rgb(52, 211, 153)"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            connectNulls
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
