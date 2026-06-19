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
import type { FluencyStopPoint } from "@/lib/calculations/peChartSeries";
import { ChartCard } from "./ChartCard";

interface FluencyStopChartProps {
  data: FluencyStopPoint[];
  loading?: boolean;
}

export function FluencyStopChart({ data, loading }: FluencyStopChartProps) {
  return (
    <ChartCard
      title="Fluency + Silent Feet Trend"
      description="Fluency stops per set and silent-foot slips per session from ARC sessions. Lower is better — a downward trend means improving movement economy."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Log ARC sessions to track fluency stops and silent-foot slips."
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            allowDecimals
            tick={{ fontSize: 12 }}
            label={{
              value: "count (lower = better)",
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
              const v = typeof value === "number" ? value : Number(value ?? 0);
              if (name === "stopsPerSet") return [v, "Fluency stops/set"];
              return [v, "Silent-foot slips/session"];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="stopsPerSet"
            name="Fluency stops/set"
            stroke="rgb(251, 191, 36)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="slipsPerSession"
            name="Silent-foot slips/session"
            stroke="rgb(167, 139, 250)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
