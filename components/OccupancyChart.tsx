"use client";

import * as React from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { BarChart3 } from "lucide-react";

export interface ComparisonSeries {
  id: string;
  label: string;
  color: string;
}

export interface ChartDataPoint {
  time: string;
  minutes: number;
  poolCount?: number;
  [key: string]: string | number | undefined;
}

interface OccupancyChartProps {
  data: ChartDataPoint[];
  comparisons?: ComparisonSeries[];
  title: string;
  mainSeriesLabel: string;
  capacity?: number | null;
}

interface TooltipPayloadEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5 tabular-nums">
        {label}
      </p>
      <div className="space-y-1">
        {payload.map((entry) => (
          <div
            key={String(entry.dataKey ?? entry.name)}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-slate-600">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: entry.color || "#0ea5e9" }}
              />
              {entry.name}
            </span>
            <span className="font-semibold text-slate-900 tabular-nums">
              {entry.value ?? "—"} osob
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function OccupancyChart({
  data,
  comparisons = [],
  title,
  mainSeriesLabel,
  capacity,
}: OccupancyChartProps) {
  const hasData = data.length > 0;

  return (
    <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            {title}
          </h3>
          {comparisons.length > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              Porovnání s: {comparisons.map((c) => c.label).join(", ")}
            </p>
          )}
        </div>
        {capacity && (
          <span className="text-xs text-slate-400 font-medium self-start sm:self-center">
            Max. kapacita: {capacity} osob
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="h-[260px] sm:h-[340px] flex flex-col items-center justify-center text-center px-4 rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
          <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <BarChart3 size={20} />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Pro vybraný den nejsou k dispozici žádná data
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Zkuste zvolit jiný den v historii nebo zkontrolujte stav automatického
            stahování dat.
          </p>
        </div>
      ) : (
        <div className="h-[280px] sm:h-[380px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
            >
              <defs>
                <linearGradient id="poolAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.26} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={42}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: "12px", fontSize: "12px" }}
                iconType="circle"
              />

              {capacity && (
                <ReferenceLine
                  y={capacity}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}

              <Area
                type="monotone"
                dataKey="poolCount"
                name={mainSeriesLabel}
                stroke="#0284c7"
                strokeWidth={2.5}
                fill="url(#poolAreaGradient)"
                connectNulls
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "#0284c7" }}
              />

              {comparisons.map((series) => (
                <Line
                  key={series.id}
                  type="monotone"
                  dataKey={`pool_${series.id}`}
                  name={series.label}
                  stroke={series.color || "#94a3b8"}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  connectNulls
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
