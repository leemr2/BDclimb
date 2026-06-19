"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { ShoulderSymptomPoint } from "@/lib/calculations/peChartSeries";
import { ChartCard } from "./ChartCard";

interface ShoulderSymptomChartProps {
  data: ShoulderSymptomPoint[];
  loading?: boolean;
}

export function ShoulderSymptomChart({
  data,
  loading,
}: ShoulderSymptomChartProps) {
  return (
    <ChartCard
      title="Shoulder Symptom Score"
      description="Per-session shoulder symptom score (0–10). Early-warning signal for shoulder overuse — 4–5 is a caution band, 6+ warrants reducing power volume."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Complete PE sessions to track shoulder symptoms over time."
    >
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="shoulderFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(96, 165, 250)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="rgb(96, 165, 250)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
          <YAxis
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tick={{ fontSize: 12 }}
            label={{
              value: "score /10",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <ReferenceLine
            y={4}
            stroke="rgb(251, 191, 36)"
            strokeDasharray="4 4"
            label={{ value: "caution", fontSize: 10, fill: "rgb(251, 191, 36)" }}
          />
          <ReferenceLine
            y={6}
            stroke="rgb(248, 113, 113)"
            strokeDasharray="4 4"
            label={{ value: "reduce volume", fontSize: 10, fill: "rgb(248, 113, 113)" }}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(20,20,30,0.95)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
            }}
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              return [`${v}/10`, "Shoulder score"];
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            name="Shoulder score"
            stroke="rgb(96, 165, 250)"
            strokeWidth={2}
            fill="url(#shoulderFill)"
            dot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
