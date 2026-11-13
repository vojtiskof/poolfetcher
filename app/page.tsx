import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { CurrentStatus } from "@/components/CurrentStatus";
import {
  OccupancyChart,
  ComparisonSeries,
  ChartDataPoint,
} from "@/components/OccupancyChart";
import { DateFilter } from "@/components/DateFilter";
import { StatsSection, WeekdayAverage } from "@/components/StatsSection";
import { DataTable } from "@/components/DataTable";
import { HistorySidebar, DailyStatsSummary } from "@/components/HistorySidebar";
import { PoolSelector } from "@/components/PoolSelector";
import {
  QuickCompareBar,
  ActiveComparisonBadge,
} from "@/components/QuickCompareBar";
import { POOLS, PoolId, normalizePoolId } from "@/lib/pools";
import {
  getPrague10MinBucket,
  getPragueDateString,
  getPragueDayBounds,
  getPragueDayOfWeek,
  normalizePragueDateParam,
  parseDateStringNoon,
  shiftDateString,
} from "@/lib/date";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { OccupancyRecord } from "@prisma/client";
import { AlertTriangle, Waves } from "lucide-react";

export const dynamic = "force-dynamic";
export const preferredRegion = ["fra1", "cdg1", "arn1", "lhr1"];

const COMPARISON_COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#ef4444"];
const WEEKDAY_LABELS: { dayIndex: number; label: string }[] = [
  { dayIndex: 1, label: "Po" },
  { dayIndex: 2, label: "Út" },
  { dayIndex: 3, label: "St" },
  { dayIndex: 4, label: "Čt" },
  { dayIndex: 5, label: "Pá" },
  { dayIndex: 6, label: "So" },
  { dayIndex: 0, label: "Ne" },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    compare?: string;
    pool?: string;
    compare_with?: string;
  }>;
}) {
  const { date, compare, pool: rawPool, compare_with: rawCompareWith } =
    await searchParams;

  const poolId: PoolId = normalizePoolId(rawPool);
  const poolConfig = POOLS[poolId];
  const todayStr = getPragueDateString(new Date());
  const selectedDateStr = normalizePragueDateParam(date);
  const isToday = selectedDateStr === todayStr;

  const comparePoolId: PoolId | null =
    rawCompareWith && normalizePoolId(rawCompareWith) !== poolId
      ? normalizePoolId(rawCompareWith)
      : null;

  const { start, end } = getPragueDayBounds(selectedDateStr);

  let dbError = false;
  let latestRecord: OccupancyRecord | null = null;
  let previousRecord: OccupancyRecord | null = null;
  let comparedPoolLatest: OccupancyRecord | null = null;
  let dailyData: OccupancyRecord[] = [];
  const comparisonData: {
    id: string;
    label: string;
    type: "date" | "pool";
    records: OccupancyRecord[];
  }[] = [];
  let historyData: OccupancyRecord[] = [];

  try {
    // 1. Latest 2 records for selected pool (for live count + trend)
    const latestTwo = await prisma.occupancyRecord.findMany({
      where: { poolId },
      orderBy: { timestamp: "desc" },
      take: 2,
    });
    latestRecord = latestTwo[0] ?? null;
    previousRecord = latestTwo[1] ?? null;

    if (comparePoolId) {
      comparedPoolLatest = await prisma.occupancyRecord.findFirst({
        where: { poolId: comparePoolId },
        orderBy: { timestamp: "desc" },
      });
    }

    // 2. Daily data for selected date (Europe/Prague bounds)
    dailyData = await prisma.occupancyRecord.findMany({
      where: {
        poolId,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    // 3a. Compare Dates
    const compareDates = Array.from(
      new Set(
        (compare ? compare.split(",") : [])
          .map((d) => d.trim())
          .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d !== selectedDateStr)
      )
    ).slice(0, 4);

    for (const compDateStr of compareDates) {
      const bounds = getPragueDayBounds(compDateStr);
      const records = await prisma.occupancyRecord.findMany({
        where: {
          poolId,
          timestamp: {
            gte: bounds.start,
            lte: bounds.end,
          },
        },
        orderBy: { timestamp: "asc" },
      });
      comparisonData.push({
        id: compDateStr,
        label: format(parseDateStringNoon(compDateStr), "EEE d.M.", {
          locale: cs,
        }),
        type: "date",
        records,
      });
    }

    // 3b. Compare Other Pool on the same date
    if (comparePoolId) {
      const otherRecords = await prisma.occupancyRecord.findMany({
        where: {
          poolId: comparePoolId,
          timestamp: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { timestamp: "asc" },
      });
      comparisonData.push({
        id: comparePoolId,
        label: POOLS[comparePoolId].shortName,
        type: "pool",
        records: otherRecords,
      });
    }

    // 4. Last 14 days history (Europe/Prague)
    const historyStartDateStr = shiftDateString(todayStr, -13);
    const { start: historyStart } = getPragueDayBounds(historyStartDateStr);

    historyData = await prisma.occupancyRecord.findMany({
      where: {
        poolId,
        timestamp: {
          gte: historyStart,
        },
      },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    console.error("Database query failed:", error);
    dbError = true;
  }

  // Merge data into 10-minute Prague buckets for smooth, aligned charting
  const chartDataMap = new Map<string, ChartDataPoint>();

  dailyData.forEach((record) => {
    const bucket = getPrague10MinBucket(record.timestamp);
    chartDataMap.set(bucket.label, {
      time: bucket.label,
      minutes: bucket.minutes,
      poolCount: record.poolCount,
    });
  });

  const comparisonSeries: ComparisonSeries[] = [];
  const activeBadges: ActiveComparisonBadge[] = [];

  comparisonData.forEach((item, index) => {
    const color = COMPARISON_COLORS[index % COMPARISON_COLORS.length];
    comparisonSeries.push({ id: item.id, label: item.label, color });
    activeBadges.push({
      id: item.id,
      label: item.label,
      color,
      type: item.type,
    });

    item.records.forEach((record) => {
      const bucket = getPrague10MinBucket(record.timestamp);
      const existing = chartDataMap.get(bucket.label) || {
        time: bucket.label,
        minutes: bucket.minutes,
      };
      chartDataMap.set(bucket.label, {
        ...existing,
        [`pool_${item.id}`]: record.poolCount,
      });
    });
  });

  const mergedChartData = Array.from(chartDataMap.values()).sort(
    (a, b) => a.minutes - b.minutes
  );

  // Aggregate 14-day history by Prague calendar date
  const statsMap = new Map<
    string,
    { maxPool: number; sumPool: number; count: number }
  >();
  const weekdayMap = new Map<
    number,
    { sumPool: number; count: number; days: Set<string> }
  >();

  historyData.forEach((record) => {
    const dateKey = getPragueDateString(record.timestamp);
    const current = statsMap.get(dateKey) || {
      maxPool: 0,
      sumPool: 0,
      count: 0,
    };
    statsMap.set(dateKey, {
      maxPool: Math.max(current.maxPool, record.poolCount),
      sumPool: current.sumPool + record.poolCount,
      count: current.count + 1,
    });

    const dow = getPragueDayOfWeek(dateKey);
    const wd = weekdayMap.get(dow) || {
      sumPool: 0,
      count: 0,
      days: new Set<string>(),
    };
    wd.sumPool += record.poolCount;
    wd.count += 1;
    wd.days.add(dateKey);
    weekdayMap.set(dow, wd);
  });

  const historyStats: DailyStatsSummary[] = Array.from(statsMap.entries())
    .map(([dateStr, stat]) => ({
      dateStr,
      maxPool: stat.maxPool,
      avgPool: Math.round(stat.sumPool / stat.count),
      samples: stat.count,
    }))
    .sort((a, b) => b.dateStr.localeCompare(a.dateStr));

  const weekdayAverages: WeekdayAverage[] =
    historyData.length > 0
      ? WEEKDAY_LABELS.map((w) => {
          const stat = weekdayMap.get(w.dayIndex);
          return {
            dayIndex: w.dayIndex,
            label: w.label,
            avgPool:
              stat && stat.count > 0 ? Math.round(stat.sumPool / stat.count) : 0,
            sampleDays: stat ? stat.days.size : 0,
          };
        }).filter((w) => w.sampleDays > 0)
      : [];

  const selectedDateNoon = parseDateStringNoon(selectedDateStr);
  const selectedDateLabel = format(selectedDateNoon, "EEEE d. MMMM", {
    locale: cs,
  });
  const chartTitle = isToday
    ? "Dnešní průběh návštěvnosti"
    : `Návštěvnost — ${selectedDateLabel}`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Subtle aquatic top bar accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Header */}
        <header className="flex flex-col gap-5 mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="h-11 w-11 rounded-2xl bg-sky-600 text-white flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                <Waves size={22} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {poolConfig.fullName}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {poolConfig.subtitle} • Aktuální obsazenost a statistiky
                </p>
              </div>
            </div>

            <Suspense fallback={<div className="h-10 w-64 bg-slate-100 rounded-xl animate-pulse" />}>
              <DateFilter />
            </Suspense>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
            <Suspense fallback={<div className="h-10 w-72 bg-slate-100 rounded-xl animate-pulse" />}>
              <PoolSelector />
            </Suspense>
          </div>
        </header>

        {dbError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 flex items-start gap-3 shadow-2xs">
            <AlertTriangle
              size={20}
              className="text-amber-600 shrink-0 mt-0.5"
            />
            <div>
              <h2 className="text-sm font-semibold mb-0.5">
                Došlo k chybě při načítání databáze
              </h2>
              <p className="text-xs sm:text-sm text-amber-800">
                Nepodařilo se načíst aktuální ani historická data (databáze může
                být dočasně nedostupná nebo byl vyčerpán limit dotazů). Zkuste
                stránku obnovit za chvíli.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3">
            <Suspense fallback={null}>
              <HistorySidebar
                stats={historyStats}
                variant="sidebar"
                capacity={poolConfig.capacity}
              />
            </Suspense>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-5 sm:space-y-6 min-w-0">
            <section aria-label="Aktuální stav">
              <CurrentStatus
                poolId={poolId}
                nowMs={new Date().getTime()}
                latestRecord={latestRecord}
                previousRecord={previousRecord}
                comparedPool={
                  comparePoolId
                    ? {
                        poolId: comparePoolId,
                        latestRecord: comparedPoolLatest,
                      }
                    : null
                }
              />
            </section>

            {/* Mobile Horizontal History Strip */}
            <Suspense fallback={null}>
              <HistorySidebar
                stats={historyStats}
                variant="strip"
                capacity={poolConfig.capacity}
              />
            </Suspense>

            {/* Quick Comparison Bar */}
            <section aria-label="Rychlé porovnání">
              <Suspense fallback={null}>
                <QuickCompareBar activeComparisons={activeBadges} />
              </Suspense>
            </section>

            {/* Main Occupancy Chart */}
            <section aria-label="Graf obsazenosti">
              <OccupancyChart
                data={mergedChartData}
                comparisons={comparisonSeries}
                title={chartTitle}
                mainSeriesLabel={`${poolConfig.shortName} (${
                  isToday ? "Dnes" : format(selectedDateNoon, "d.M.", { locale: cs })
                })`}
                capacity={poolConfig.capacity}
              />
            </section>

            {/* KPI Strip + Hourly & Weekday Analytics */}
            <section aria-label="Statistiky">
              <StatsSection
                data={dailyData}
                comparisons={comparisonData.map((item, index) => ({
                  id: item.id,
                  label: item.label,
                  color: COMPARISON_COLORS[index % COMPARISON_COLORS.length],
                  records: item.records,
                }))}
                weekdayAverages={weekdayAverages}
                selectedWeekday={getPragueDayOfWeek(selectedDateStr)}
                mainLabel={poolConfig.shortName}
              />
            </section>

            {/* Detailed Table + CSV Export */}
            <section aria-label="Detailní data">
              <DataTable
                data={dailyData}
                poolId={poolId}
                dateStr={selectedDateStr}
              />
            </section>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 pb-6 border-t border-slate-200/80 flex flex-col items-center gap-4 text-xs text-slate-400">
          <p className="text-center">
            Data se automaticky aktualizují každých 10 minut (časové pásmo
            Europe/Prague). Zdroje:{" "}
            <a
              href={POOLS.nymburk.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-sky-600 underline underline-offset-2"
            >
              Relaxační centrum Labe
            </a>{" "}
            &amp;{" "}
            <a
              href={POOLS.mb.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-sky-600 underline underline-offset-2"
            >
              Bazén Sokolovna MB
            </a>
            .
          </p>
          <div className="flex flex-wrap justify-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.cron-job.org/jobs/7098021/0f876e1ba156d2b6/status-7.svg"
              alt="Cron Job Status - morning"
              className="h-5"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.cron-job.org/jobs/7098022/e5cf872b0d84a9d6/status-7.svg"
              alt="Cron Job Status - day"
              className="h-5"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://api.cron-job.org/jobs/7098030/8e63d3af76e0af64/status-7.svg"
              alt="Cron Job Status - end"
              className="h-5"
            />
          </div>
        </footer>
      </div>
    </main>
  );
}
