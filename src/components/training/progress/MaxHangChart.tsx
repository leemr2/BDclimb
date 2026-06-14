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
import type { MaxHangChartPoint } from "@/lib/calculations/chartSeries";
import { getMesocycleBoundaries } from "@/lib/calculations/chartSeries";
import { ChartCard } from "./ChartCard";

interface MaxHangChartProps {
  data: MaxHangChartPoint[];
  loading?: boolean;
  weightUnit?: string;
}

export function MaxHangChart({
  data,
  loading,
  weightUnit = "lbs",
}: MaxHangChartProps) {
  return (
    <ChartCard
      title="Max Hang Progression"
      description={`Assessment retests at Weeks 0, 4, 8, and 12 (${weightUnit} and % bodyweight).`}
      loading={loading}
      empty={data.length === 0}
      emptyMessage="Complete your Week 0 assessment to see max hang trends."
    >
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" className="progress-chart-grid" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            yAxisId="load"
            tick={{ fontSize: 12 }}
            label={{
              value: weightUnit,
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11 },
            }}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            tick={{ fontSize: 12 }}
            label={{
              value: "% BW",
              angle: 90,
              position: "insideRight",
              style: { fontSize: 11 },
            }}
          />
          {getMesocycleBoundaries().map((w) => (
            <ReferenceLine
              key={w}
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
              const v = typeof value === "number" ? value : Number(value);
              if (name === "bestLoad") return [`${v} ${weightUnit}`, "Best load"];
              if (name === "percentBodyweight") return [`${v.toFixed(1)}%`, "% bodyweight"];
              return [String(value ?? ""), String(name)];
            }}
          />
          <Legend />
          <Line
            yAxisId="load"
            type="monotone"
            dataKey="bestLoad"
            name="Best load"
            stroke="rgb(96, 165, 250)"
            strokeWidth={2}
            dot={{ r: 5 }}
            activeDot={{ r: 7 }}
          />
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="percentBodyweight"
            name="% bodyweight"
            stroke="rgb(52, 211, 153)"
            strokeWidth={2}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}
