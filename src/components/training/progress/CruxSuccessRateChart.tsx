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
  // Split the success-rate series into workout vs assessment lines so each
  // source renders with its own marker style (mirrors SendRateChart).
  const chartData = data.map((p) => ({
    ...p,
    workoutRate: p.source === "workout" ? p.successRate : null,
    assessmentRate: p.source === "assessment" ? p.successRate : null,
  }));

  return (
    <ChartCard
      title="Crux Success Rate"
      description="Primary KPI — crux-after-fatigue success rate across CAF sessions; assessment benchmarks at test weeks."
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
            yAxisId="rate"
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{
              value: "% success",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="moves"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: "avg moves",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11 },
            }}
          />
          {getPEMesocycleBoundaries().map((w) => (
            <ReferenceLine
              key={w}
              yAxisId="rate"
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
              if (name === "avgMovesCompleted") return [v, "Avg moves"];
              return [`${v}%`, name === "workoutRate" ? "Workout" : "Assessment"];
            }}
          />
          <Legend />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="workoutRate"
            name="Workout success rate"
            stroke="rgb(96, 165, 250)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4 }}
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="assessmentRate"
            name="Assessment benchmark"
            stroke="rgb(244, 114, 182)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 6 }}
          />
          <Line
            yAxisId="moves"
            type="monotone"
            dataKey="avgMovesCompleted"
            name="Avg moves completed"
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
