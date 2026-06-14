"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { WeeklyLoadPoint } from "@/lib/calculations/chartSeries";
import { ChartCard } from "./ChartCard";

const MESOCYCLE_COLORS: Record<1 | 2 | 3, string> = {
  1: "rgb(96, 165, 250)",
  2: "rgb(167, 139, 250)",
  3: "rgb(52, 211, 153)",
};

function barColor(point: WeeklyLoadPoint): string {
  const base = MESOCYCLE_COLORS[point.mesocycle];
  return point.isDeload ? `${base}88` : base;
}

interface LoadChartProps {
  data: WeeklyLoadPoint[];
  loading?: boolean;
}

export function LoadChart({ data, loading }: LoadChartProps) {
  return (
    <ChartCard
      title="Weekly Training Load"
      description="Total session RPE (sRPE) per week. Deload weeks appear lighter."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Complete workouts to see weekly load trends."
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "sRPE",
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
            formatter={(value) => {
              const v = typeof value === "number" ? value : Number(value ?? 0);
              return [v, "Weekly sRPE"];
            }}
            labelFormatter={(label) => `Week ${String(label).replace("W", "")}`}
          />
          <Bar dataKey="totalSrpe" name="Weekly sRPE" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.week} fill={barColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
