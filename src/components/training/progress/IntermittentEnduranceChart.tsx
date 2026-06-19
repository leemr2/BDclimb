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
import type { IHERepsPoint } from "@/lib/calculations/peChartSeries";
import { ChartCard } from "./ChartCard";

interface IntermittentEnduranceChartProps {
  data: IHERepsPoint[];
  loading?: boolean;
}

const SOURCE_COLORS: Record<IHERepsPoint["source"], string> = {
  assessment: "rgb(244, 114, 182)",
  workout: "rgb(96, 165, 250)",
};

export function IntermittentEnduranceChart({
  data,
  loading,
}: IntermittentEnduranceChartProps) {
  return (
    <ChartCard
      title="Intermittent Endurance"
      description="Total reps at 60% MVC — assessment benchmarks plus Meso 2 IHE sessions. Higher reps mean greater finger-flexor endurance capacity."
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Complete an intermittent-endurance test to track capacity."
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "total reps",
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
              return [v, "Total reps"];
            }}
            labelFormatter={(label) => `Week ${String(label).replace("W", "")}`}
          />
          <Bar dataKey="totalReps" name="Total reps" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.week} fill={SOURCE_COLORS[entry.source]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
