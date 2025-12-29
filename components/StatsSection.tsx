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
    wellnessCount: number;
  }[];
}

export function StatsSection({ data }: StatsSectionProps) {
  if (data.length === 0) return null;

  // Calculate max occupancy
  const maxPool = Math.max(...data.map((d) => d.poolCount));
  const maxWellness = Math.max(...data.map((d) => d.wellnessCount));

  // Calculate average occupancy
  const avgPool = Math.round(
    data.reduce((acc, curr) => acc + curr.poolCount, 0) / data.length
  );
  const avgWellness = Math.round(
    data.reduce((acc, curr) => acc + curr.wellnessCount, 0) / data.length
  );

  // Calculate hourly averages for the chart (if enough data)
  // Group by hour
  const hourlyDataMap = new Map<
    number,
    { count: number; poolSum: number; wellnessSum: number }
  >();

  data.forEach((item) => {
    const hour = new Date(item.timestamp).getHours();
    const current = hourlyDataMap.get(hour) || {
      count: 0,
      poolSum: 0,
      wellnessSum: 0,
    };
    hourlyDataMap.set(hour, {
      count: current.count + 1,
      poolSum: current.poolSum + item.poolCount,
      wellnessSum: current.wellnessSum + item.wellnessCount,
    });
  });

  const hourlyData = Array.from(hourlyDataMap.entries())
    .map(([hour, stats]) => ({
      hour: `${hour}:00`,
      hourNum: hour,
      avgPool: Math.round(stats.poolSum / stats.count),
      avgWellness: Math.round(stats.wellnessSum / stats.count),
    }))
    .sort((a, b) => a.hourNum - b.hourNum);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Simple Stats Cards */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-medium text-slate-500 mb-2">
            Maximum (Dnes)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Vodní zóna</p>
              <p className="text-2xl font-bold text-sky-600">{maxPool}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Wellness</p>
              <p className="text-2xl font-bold text-pink-600">{maxWellness}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h4 className="text-sm font-medium text-slate-500 mb-2">
            Průměr (Dnes)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">Vodní zóna</p>
              <p className="text-2xl font-bold text-slate-700">{avgPool}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Wellness</p>
              <p className="text-2xl font-bold text-slate-700">{avgWellness}</p>
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
                name="Vodní zóna"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="avgWellness"
                name="Wellness"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
