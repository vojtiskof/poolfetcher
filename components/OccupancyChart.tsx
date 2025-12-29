"use client";

import * as React from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";

export interface ComparisonSeries {
  id: string; // date string yyyy-MM-dd
  label: string;
  color: string;
}

interface OccupancyChartProps {
  data: any[]; // Merged data with 'time' property and dynamic keys
  comparisons?: ComparisonSeries[];
}

export function OccupancyChart({
  data,
  comparisons = [],
}: OccupancyChartProps) {
  const [showPool, setShowPool] = React.useState(true);
  const [showWellness, setShowWellness] = React.useState(true);

  // Note: 'data' is already formatted with 'time' before passing here in page logic for comparisons.
  // We assume 'data' has 'time', 'poolCount', 'wellnessCount' etc.

  return (
    <div className="h-[350px] sm:h-[450px] w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
        <h3 className="text-lg font-medium text-slate-800">
          Dnešní návštěvnost{" "}
          {comparisons.length > 0 &&
            `(vs ${comparisons.map((c) => c.label).join(", ")})`}
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPool}
              onChange={(e) => setShowPool(e.target.checked)}
              className="rounded text-sky-500 focus:ring-sky-500"
            />
            <span className="text-slate-600">Vodní zóna</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showWellness}
              onChange={(e) => setShowWellness(e.target.checked)}
              className="rounded text-pink-500 focus:ring-pink-500"
            />
            <span className="text-slate-600">Wellness</span>
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e2e8f0"
            />
            <XAxis
              dataKey="time"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              itemStyle={{ fontSize: "14px" }}
              labelStyle={{
                color: "#64748b",
                fontSize: "12px",
                marginBottom: "4px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "10px" }} />

            {/* Main Lines */}
            {showPool && (
              <Line
                type="monotone"
                dataKey="poolCount"
                name="Vodní zóna (Dnes)"
                stroke="#0ea5e9" // Sky 500
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                zIndex={10}
              />
            )}
            {showWellness && (
              <Line
                type="monotone"
                dataKey="wellnessCount"
                name="Wellness (Dnes)"
                stroke="#ec4899" // Pink 500
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6 }}
                zIndex={10}
              />
            )}

            {/* Comparison Lines (Dotted/Dashed) */}
            {comparisons.map((series) => (
              <React.Fragment key={series.id}>
                {showPool && (
                  <Line
                    type="monotone"
                    dataKey={`pool_${series.id}`}
                    name={`Bazén ${series.label}`}
                    stroke={series.color || "#94a3b8"}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 4 }}
                    opacity={0.7}
                  />
                )}
                {showWellness && (
                  <Line
                    type="monotone"
                    dataKey={`wellness_${series.id}`}
                    name={`Wellness ${series.label}`}
                    stroke={series.color || "#cbd5e1"}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    activeDot={{ r: 4 }}
                    opacity={0.5}
                  />
                )}
              </React.Fragment>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
