"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Clock, Sparkles, TrendingUp, Activity } from "lucide-react";
import { formatPragueTime, getPragueHour } from "@/lib/date";

export interface WeekdayAverage {
  dayIndex: number;
  label: string;
  avgPool: number;
  sampleDays: number;
}

interface OccupancyPoint {
  timestamp: Date | string;
  poolCount: number;
}

interface ComparisonInput {
  id: string;
  label: string;
  color?: string;
  records: OccupancyPoint[];
}

interface StatsSectionProps {
  data: OccupancyPoint[];
  comparisons?: ComparisonInput[];
  weekdayAverages?: WeekdayAverage[];
  selectedWeekday?: number;
  mainLabel: string;
}

interface HourlyDatum {
  hour: string;
  hourNum: number;
  avgPool: number;
  [key: string]: string | number;
}

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

function BarCustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((entry) => (
        <div
          key={String(entry.dataKey ?? entry.name)}
          className="flex items-center justify-between gap-3"
        >
          <span className="flex items-center gap-1.5 text-slate-600">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || "#0ea5e9" }}
            />
            {entry.name}
          </span>
          <span className="font-semibold text-slate-900 tabular-nums">
            ø {entry.value} osob
          </span>
        </div>
      ))}
    </div>
  );
}

export function StatsSection({
  data,
  comparisons = [],
  weekdayAverages = [],
  selectedWeekday,
  mainLabel,
}: StatsSectionProps) {
  const hasMain = data.length > 0;
  const hasAny = hasMain || comparisons.some((c) => c.records.length > 0);

  // Max & Min with timestamps
  let maxRecord: OccupancyPoint | null = null;
  let minRecord: OccupancyPoint | null = null;
  let sum = 0;

  for (const item of data) {
    sum += item.poolCount;
    if (!maxRecord || item.poolCount > maxRecord.poolCount) {
      maxRecord = item;
    }
    if (!minRecord || item.poolCount < minRecord.poolCount) {
      minRecord = item;
    }
  }

  const avgPool = hasMain ? Math.round(sum / data.length) : 0;

  // First comparison average delta
  const firstComp = comparisons.find((c) => c.records.length > 0);
  const firstCompAvg = firstComp
    ? Math.round(
        firstComp.records.reduce((acc, r) => acc + r.poolCount, 0) /
          firstComp.records.length
      )
    : null;
  const avgDiff = firstCompAvg !== null && hasMain ? avgPool - firstCompAvg : null;

  // Hourly averages in Europe/Prague
  const hourlyMap = new Map<
    number,
    {
      mainSum: number;
      mainCount: number;
      comps: Record<string, { sum: number; count: number }>;
    }
  >();

  const getEntry = (hour: number) => {
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { mainSum: 0, mainCount: 0, comps: {} });
    }
    return hourlyMap.get(hour)!;
  };

  data.forEach((item) => {
    const hour = getPragueHour(item.timestamp);
    const entry = getEntry(hour);
    entry.mainSum += item.poolCount;
    entry.mainCount++;
  });

  comparisons.forEach((comp) => {
    comp.records.forEach((item) => {
      const hour = getPragueHour(item.timestamp);
      const entry = getEntry(hour);
      if (!entry.comps[comp.id]) entry.comps[comp.id] = { sum: 0, count: 0 };
      entry.comps[comp.id].sum += item.poolCount;
      entry.comps[comp.id].count++;
    });
  });

  const hourlyData: HourlyDatum[] = Array.from(hourlyMap.entries())
    .map(([hour, stats]) => {
      const obj: HourlyDatum = {
        hour: `${String(hour).padStart(2, "0")}:00`,
        hourNum: hour,
        avgPool:
          stats.mainCount > 0 ? Math.round(stats.mainSum / stats.mainCount) : 0,
      };
      Object.entries(stats.comps).forEach(([compId, compStats]) => {
        obj[`comp_${compId}`] =
          compStats.count > 0 ? Math.round(compStats.sum / compStats.count) : 0;
      });
      return obj;
    })
    .sort((a, b) => a.hourNum - b.hourNum);

  // Quietest & busiest hours from main data
  const mainHours = hourlyData.filter((h) => {
    const entry = hourlyMap.get(h.hourNum);
    return entry && entry.mainCount > 0;
  });

  const quietestHour =
    mainHours.length > 0
      ? mainHours.reduce((best, curr) =>
          curr.avgPool < best.avgPool ? curr : best
        )
      : null;

  if (!hasAny && weekdayAverages.length === 0) return null;

  return (
    <div className="space-y-5">
      {/* 4 KPI cards */}
      {hasMain && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>Maximum dne</span>
              <TrendingUp size={15} className="text-sky-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {maxRecord?.poolCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1 tabular-nums">
              {maxRecord ? `v ${formatPragueTime(maxRecord.timestamp)}` : "—"}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>Denní průměr</span>
              <Activity size={15} className="text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                {avgPool}
              </p>
              {avgDiff !== null && avgDiff !== 0 && (
                <span
                  className={`inline-flex items-center text-xs font-semibold tabular-nums ${
                    avgDiff > 0 ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {avgDiff > 0 ? (
                    <ArrowUpRight size={13} />
                  ) : (
                    <ArrowDownRight size={13} />
                  )}
                  {avgDiff > 0 ? `+${avgDiff}` : avgDiff}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 truncate">
              {firstComp
                ? `vs ${firstComp.label} (ø ${firstCompAvg})`
                : `ze ${data.length} měření`}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>Minimum dne</span>
              <Clock size={15} className="text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {minRecord?.poolCount ?? 0}
            </p>
            <p className="text-xs text-slate-400 mt-1 tabular-nums">
              {minRecord ? `v ${formatPragueTime(minRecord.timestamp)}` : "—"}
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
              <span>Nejklidnější hodina</span>
              <Sparkles size={15} className="text-emerald-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
              {quietestHour ? quietestHour.hour : "—"}
            </p>
            <p className="text-xs text-slate-400 mt-1 tabular-nums">
              {quietestHour ? `průměrně ${quietestHour.avgPool} osob` : "—"}
            </p>
          </div>
        </div>
      )}

      {/* Charts grid: Hourly profile + Typical week */}
      <div
        className={`grid grid-cols-1 ${
          weekdayAverages.length > 0 && hourlyData.length > 0
            ? "lg:grid-cols-3"
            : ""
        } gap-4 sm:gap-5`}
      >
        {hourlyData.length > 0 && (
          <div
            className={`${
              weekdayAverages.length > 0 ? "lg:col-span-2" : ""
            } bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Průměrná obsazenost po hodinách
              </h3>
              <span className="text-xs text-slate-400">počet osob</span>
            </div>
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hourlyData}
                  margin={{ top: 5, right: 6, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="hour"
                    fontSize={11}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={<BarCustomTooltip />}
                  />
                  <Bar
                    dataKey="avgPool"
                    name={mainLabel}
                    fill="#0ea5e9"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  />
                  {comparisons.map((comp) => (
                    <Bar
                      key={comp.id}
                      dataKey={`comp_${comp.id}`}
                      name={comp.label}
                      fill={comp.color || "#94a3b8"}
                      radius={[5, 5, 0, 0]}
                      maxBarSize={22}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {weekdayAverages.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">
                Průměr dle dne v týdnu
              </h3>
              <span className="text-xs text-slate-400">14 dní</span>
            </div>
            <div className="h-[220px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weekdayAverages}
                  margin={{ top: 5, right: 4, left: -22, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="label"
                    fontSize={11}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    fontSize={11}
                    stroke="#64748b"
                    tickLine={false}
                    axisLine={false}
                    width={38}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    content={<BarCustomTooltip />}
                  />
                  <Bar
                    dataKey="avgPool"
                    name="Průměr"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={28}
                  >
                    {weekdayAverages.map((entry) => (
                      <Cell
                        key={entry.dayIndex}
                        fill={
                          entry.dayIndex === selectedWeekday
                            ? "#0284c7"
                            : "#bae6fd"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
