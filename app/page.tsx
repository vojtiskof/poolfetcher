import { prisma } from "@/lib/prisma";
import { CurrentStatus } from "@/components/CurrentStatus";
import { OccupancyChart, ComparisonSeries } from "@/components/OccupancyChart";
import { DateFilter } from "@/components/DateFilter";
import { StatsSection } from "@/components/StatsSection";
import { DataTable } from "@/components/DataTable";
import { HistorySidebar } from "@/components/HistorySidebar";
import { PoolSelector } from "@/components/PoolSelector";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { cs } from "date-fns/locale";

import { OccupancyRecord } from "@prisma/client";

export const dynamic = "force-dynamic";

interface ChartDataPoint {
  time: string;
  timestamp: Date;
  poolCount?: number;
  [key: string]: string | number | Date | undefined;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; compare?: string; pool?: string; compare_with?: string }>;
}) {
  const { date, compare, pool = "nymburk", compare_with } = await searchParams;

  const targetDate = date ? new Date(date) : new Date();
  const validDate = isNaN(targetDate.getTime()) ? new Date() : targetDate;

  const start = startOfDay(validDate);
  const end = endOfDay(validDate);

  // Fallback states
  let dbError = false;
  let latestRecord: OccupancyRecord | null = null;
  let dailyData: OccupancyRecord[] = [];
  const comparisonData: { id: string; label: string; records: OccupancyRecord[] }[] = [];
  let historyData: OccupancyRecord[] = [];

  try {
    // 1. Fetch latest Record (for selected pool)
    latestRecord = await prisma.occupancyRecord.findFirst({
      where: { poolId: pool },
      orderBy: { timestamp: "desc" },
    });

    // 2. Fetch Daily Data (Main Chart - selected pool)
    dailyData = await prisma.occupancyRecord.findMany({
      where: {
        poolId: pool,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    // 3. Fetch Comparison Data
    // Can compare with other dates (existing feature) OR other pool (new feature)

    // 3a. Compare Date
    const compareDates = compare ? compare.split(",") : [];
    for (const dateStr of compareDates) {
      const compDate = new Date(dateStr);
      if (!isNaN(compDate.getTime())) {
        const compStart = startOfDay(compDate);
        const compEnd = endOfDay(compDate);
        const records = await prisma.occupancyRecord.findMany({
          where: {
            poolId: pool,
            timestamp: {
              gte: compStart,
              lte: compEnd,
            },
          },
          orderBy: { timestamp: "asc" },
        });
        comparisonData.push({
          id: dateStr,
          label: format(new Date(dateStr), "d.M.", { locale: cs }),
          records
        });
      }
    }

    // 3b. Compare Pool
    if (compare_with && compare_with !== pool) {
      // Fetch data for the OTHER pool on the SAME date
      const otherRecords = await prisma.occupancyRecord.findMany({
        where: {
          poolId: compare_with,
          timestamp: {
            gte: start,
            lte: end,
          }
        },
        orderBy: { timestamp: "asc" }
      });
      const otherPoolName = compare_with === 'mb' ? 'Mladá Boleslav' : 'Nymburk';
      comparisonData.push({
        id: compare_with,
        label: otherPoolName,
        records: otherRecords
      });
    }

    // 5. Fetch History Stats (Last 14 days) - Filtered by current POOL
    const historyStart = startOfDay(subDays(new Date(), 14));
    historyData = await prisma.occupancyRecord.findMany({
      where: {
        poolId: pool,
        timestamp: {
          gte: historyStart,
        },
      },
      orderBy: {
        timestamp: "desc",
      },
    });
  } catch (error) {
    console.error("Database query failed:", error);
    dbError = true;
  }

  // 4. Merge Data for Chart
  const formatTimePrague = (date: Date) => {
    return date.toLocaleTimeString("cs-CZ", {
      timeZone: "Europe/Prague",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const chartDataMap = new Map<string, ChartDataPoint>();

  // Initialize with main data
  dailyData.forEach((record: OccupancyRecord) => {
    const time = formatTimePrague(record.timestamp);
    chartDataMap.set(time, {
      time,
      timestamp: record.timestamp,
      poolCount: record.poolCount,
    });
  });

  // Merge comparison data
  const colors = ["#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];

  const comparisonSeries: ComparisonSeries[] = [];

  comparisonData.forEach((item, index) => {
    const color = colors[index % colors.length];

    // If comparing POOLS, maybe we want different styling, but color differentiation is enough for now.
    comparisonSeries.push({ id: item.id, label: item.label, color });

    item.records.forEach((record: OccupancyRecord) => {
      const time = formatTimePrague(record.timestamp);
      const existing = chartDataMap.get(time) || {
        time,
        timestamp: record.timestamp,
      };

      chartDataMap.set(time, {
        ...existing,
        [`pool_${item.id}`]: record.poolCount,
      });
    });
  });

  const mergedChartData = Array.from(chartDataMap.values()).sort((a, b) =>
    a.time.localeCompare(b.time)
  );

  // Aggregate history data by day
  const statsMap = new Map<
    string,
    {
      date: Date;
      poolMax: number;
      poolSum: number;
      poolCount: number;
    }
  >();
  historyData.forEach((record: OccupancyRecord) => {
    const dateKey = record.timestamp.toISOString().split("T")[0];
    const current = statsMap.get(dateKey) || {
      date: record.timestamp,
      poolMax: 0,
      poolSum: 0,
      poolCount: 0,
    };
    statsMap.set(dateKey, {
      date: record.timestamp,
      poolMax: Math.max(current.poolMax, record.poolCount),
      poolSum: current.poolSum + record.poolCount,
      poolCount: current.poolCount + 1,
    });
  });
  const historyStats = Array.from(statsMap.values())
    .map((stat) => ({
      date: stat.date,
      maxPool: stat.poolMax,
      avgPool: Math.round(stat.poolSum / stat.poolCount),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const poolTitle = pool === 'mb' ? 'Bazén Sokolovna MB' : 'Relaxační centrum Labe';

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {poolTitle} - Návštěvnost
            </h1>
            <p className="text-slate-500 mb-4">
              Aktuální a historická data obsazenosti bazénu{pool === 'nymburk' && ' a wellness'}.
            </p>
            <PoolSelector />
          </div>
          <DateFilter />
        </header>

        {dbError && (
          <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 flex items-start gap-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 flex-shrink-0 text-orange-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold mb-1">Došlo k chybě databáze</h3>
              <p className="text-sm">
                Aplikace pravděpodobně vyčerpala svůj měsíční free limit databázových dotazů, proto se nemohla načíst žádná aktuální ani historická data. Grafy jsou momentálně prázdné.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <HistorySidebar stats={historyStats} />
          </aside>

          <div className="lg:col-span-3 order-1 lg:order-2 space-y-8">
            <section>
              <CurrentStatus latestRecord={latestRecord} />
            </section>

            <section>
              <StatsSection
                data={dailyData}
                comparisons={comparisonData.map((item, index) => ({
                  id: item.id,
                  label: item.label,
                  color: colors[index % colors.length],
                  records: item.records
                }))}
              />
            </section>

            <section>
              <OccupancyChart
                data={mergedChartData}
                comparisons={comparisonSeries}
              />
            </section>

            <section>
              <DataTable data={dailyData} />
            </section>
          </div>
        </div>

        <footer className="pt-12 pb-8 flex flex-col items-center gap-4 text-xs text-slate-400">
          <p>
            Data jsou sbírána každých 10 minut 6:10 - 12:50.
          </p>
          <div className="flex flex-wrap justify-center gap-2 grayscale hover:grayscale-0 transition-all opacity-70 hover:opacity-100">
            {/* Cron Job Status Badges */}
            <img src="https://api.cron-job.org/jobs/7098021/0f876e1ba156d2b6/status-7.svg" alt="Cron Job Status" className="h-5" />
            <img src="https://api.cron-job.org/jobs/7098022/e5cf872b0d84a9d6/status-7.svg" alt="Cron Job Status" className="h-5" />
            <img src="https://api.cron-job.org/jobs/7098030/8e63d3af76e0af64/status-7.svg" alt="Cron Job Status" className="h-5" />

            {/* Vercel Badge */}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">
              <img src="https://img.shields.io/badge/vercel-deployed-000000?style=flat&logo=vercel&logoColor=white" alt="Deployed on Vercel" className="h-5" />
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
}
