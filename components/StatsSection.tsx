"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface StatsSectionProps {
  data: {
    timestamp: Date | string;
    poolCount: number;
  }[];
  comparisons?: {
    id: string;
    label: string;
    color?: string;
    records: {
      timestamp: Date | string;
      poolCount: number;
    }[];
  }[];
}

export function StatsSection({ data, comparisons = [] }: StatsSectionProps) {
  // Calculate max occupancy (Main)
  const maxPool = data.length > 0 ? Math.max(...data.map((d) => d.poolCount)) : 0;

  // Calculate average occupancy (Main)
  const avgPool = data.length > 0
    ? Math.round(data.reduce((acc, curr) => acc + curr.poolCount, 0) / data.length)
    : 0;

  // Calculate hourly averages for the chart
  const hourlyMap = new Map<number, {
    mainSum: number;
    mainCount: number;
    comps: Record<string, { sum: number; count: number }>;
  }>();

  // Helper to init map entry
  const getEntry = (hour: number) => {
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { mainSum: 0, mainCount: 0, comps: {} });
    }
    return hourlyMap.get(hour)!;
  };

  // Fill main data
  data.forEach((item) => {
    const hour = new Date(item.timestamp).getHours();
    const entry = getEntry(hour);
    entry.mainSum += item.poolCount;
    entry.mainCount++;
  });

  // Fill comparison data
  comparisons.forEach((comp) => {
    comp.records.forEach((item) => {
      const hour = new Date(item.timestamp).getHours();
      const entry = getEntry(hour);
      if (!entry.comps[comp.id]) entry.comps[comp.id] = { sum: 0, count: 0 };
      entry.comps[comp.id].sum += item.poolCount;
      entry.comps[comp.id].count++;
    });
  });

  const hourlyData = Array.from(hourlyMap.entries())
    .map(([hour, stats]) => {
      const obj: any = {
        hour: `${hour}:00`,
        hourNum: hour,
        avgPool: stats.mainCount > 0 ? Math.round(stats.mainSum / stats.mainCount) : 0,
      };

      Object.entries(stats.comps).forEach(([compId, compStats]) => {
        obj[`comp_${compId}`] = compStats.count > 0 ? Math.round(compStats.sum / compStats.count) : 0;
      });

      return obj;
    })
    .sort((a, b) => a.hourNum - b.hourNum);

  if (data.length === 0 && comparisons.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simple Stats Cards (Main Data Only) */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-medium text-slate-500 mb-2">
            Maximum (Dnes)
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs text-slate-400">Vodní zóna</p>
              <p className="text-2xl font-bold text-sky-600">{maxPool}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-medium text-slate-500 mb-2">
            Průměr (Dnes)
          </h4>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-xs text-slate-400">Vodní zóna</p>
              <p className="text-2xl font-bold text-slate-700">{avgPool}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Average Chart */}
      <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800 mb-4">
          Průměrná obsazenost v hodinách
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData}>
              <XAxis
                dataKey="hour"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Bar
                dataKey="avgPool"
                name="Vodní zóna (Dnes)"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
              {comparisons.map((comp) => (
                <Bar
                  key={comp.id}
                  dataKey={`comp_${comp.id}`}
                  name={comp.label}
                  fill={comp.color || "#94a3b8"}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
