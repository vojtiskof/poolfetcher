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

  // 1. Fetch latest Record (for selected pool)
  const latestRecord = await prisma.occupancyRecord.findFirst({
    where: { poolId: pool },
    orderBy: { timestamp: "desc" },
  });

  // 2. Fetch Daily Data (Main Chart - selected pool)
  const dailyData = await prisma.occupancyRecord.findMany({
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

  const comparisonData: { id: string; label: string; records: typeof dailyData }[] = [];

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
  dailyData.forEach((record) => {
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

    item.records.forEach((record) => {
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

  // 5. Fetch History Stats (Last 14 days) - Filtered by current POOL
  const historyStart = startOfDay(subDays(new Date(), 14));
  const historyData = await prisma.occupancyRecord.findMany({
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
  historyData.forEach((record) => {
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

        <footer className="pt-12 text-center text-xs text-slate-400">
          Data jsou sbírána každých 10 minut (6:00 - 12:00).
        </footer>
      </div>
    </main>
  );
}
