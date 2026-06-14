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
} from "recharts";
import type { SendRatePoint } from "@/lib/calculations/chartSeries";
import { ChartCard } from "./ChartCard";

interface SendRateChartProps {
  data: SendRatePoint[];
  loading?: boolean;
}

export function SendRateChart({ data, loading }: SendRateChartProps) {
  const chartData = data.map((p) => ({
    ...p,
    workoutRate: p.source === "workout" ? p.sendRate : null,
    assessmentRate: p.source === "assessment" ? p.sendRate : null,
  }));

  return (
    <ChartCard
      title="Send Rate Trend"
      description="Limit bouldering send rate from workouts; assessment benchmarks at retest weeks."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Log limit bouldering sessions to see send rate trends."
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{
              value: "% sent",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,30,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
            formatter={(value, name) => {
              if (value == null || value === "") return ["—", String(name)];
              return [`${value}%`, name === "workoutRate" ? "Workout" : "Assessment"];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="workoutRate"
            name="Workout send rate"
            stroke="rgb(251, 191, 36)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="assessmentRate"
            name="Assessment benchmark"
            stroke="rgb(244, 114, 182)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
