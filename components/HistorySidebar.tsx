"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cs } from "date-fns/locale";
import { CalendarDays, GitCompareArrows } from "lucide-react";
import { getPragueDateString, parseDateStringNoon } from "@/lib/date";

export interface DailyStatsSummary {
  dateStr: string; // YYYY-MM-DD in Europe/Prague
  maxPool: number;
  avgPool: number;
  samples: number;
}

export function HistorySidebar({
  stats,
  variant = "sidebar",
  capacity,
}: {
  stats: DailyStatsSummary[];
  variant?: "sidebar" | "strip";
  capacity?: number | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareList =
    searchParams.get("compare")?.split(",").filter(Boolean) || [];

  const mainDate =
    searchParams.get("date") || getPragueDateString(new Date());

  const maxAcrossDays =
    capacity || Math.max(1, ...stats.map((s) => s.maxPool));

  const toggleCompare = (dateStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompare = compareList.includes(dateStr)
      ? compareList.filter((d) => d !== dateStr)
      : [...compareList, dateStr];

    const params = new URLSearchParams(searchParams.toString());
    if (newCompare.length > 0) {
      params.set("compare", newCompare.join(","));
    } else {
      params.delete("compare");
    }
    router.push(`/?${params.toString()}`);
  };

  const handleDateClick = (dateStr: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const todayStr = getPragueDateString(new Date());
    if (dateStr === todayStr) {
      params.delete("date");
    } else {
      params.set("date", dateStr);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  if (variant === "strip") {
    if (stats.length === 0) return null;
    return (
      <div className="lg:hidden">
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <CalendarDays size={13} className="text-sky-600" />
            Historie (14 dní)
          </span>
          <span className="text-[11px] text-slate-400">Posuňte pro výběr</span>
        </div>
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 snap-x">
          {stats.map((day) => {
            const noon = parseDateStringNoon(day.dateStr);
            const isMain = day.dateStr === mainDate;
            const isComparing = compareList.includes(day.dateStr);

            return (
              <div
                key={day.dateStr}
                onClick={() => handleDateClick(day.dateStr)}
                className={`snap-start shrink-0 w-[138px] p-3 rounded-xl border transition-all cursor-pointer ${
                  isMain
                    ? "border-sky-500 bg-sky-50/80 ring-1 ring-sky-500/50 shadow-xs"
                    : "border-slate-200/80 bg-white active:scale-[0.98]"
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`text-xs font-semibold capitalize truncate ${
                      isMain ? "text-sky-800" : "text-slate-800"
                    }`}
                  >
                    {format(noon, "EEE d.M.", { locale: cs })}
                  </span>
                  {!isMain && (
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(day.dateStr, e)}
                      aria-label={`Porovnat ${day.dateStr}`}
                      title="Porovnat v grafu"
                      className={`p-1 rounded-md transition-colors ${
                        isComparing
                          ? "bg-amber-100 text-amber-700"
                          : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      }`}
                    >
                      <GitCompareArrows size={13} />
                    </button>
                  )}
                </div>
                <div className="flex items-baseline justify-between text-xs mt-1.5">
                  <span className="text-slate-400">Max</span>
                  <span
                    className={`font-bold tabular-nums ${
                      isMain ? "text-sky-700" : "text-slate-900"
                    }`}
                  >
                    {day.maxPool}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                  <span>Průměr</span>
                  <span className="font-medium text-slate-600 tabular-nums">
                    {day.avgPool}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-4 lg:sticky lg:top-6">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <CalendarDays size={16} className="text-sky-600" />
          Historie dní
        </h3>
        <span className="text-xs text-slate-400">posledních 14</span>
      </div>

      {stats.length === 0 ? (
        <p className="text-xs text-slate-400 px-1 py-6 text-center">
          Zatím žádná historická data.
        </p>
      ) : (
        <div className="space-y-2.5 max-h-[500px] lg:max-h-[75vh] overflow-y-auto pr-1">
          {stats.map((day) => {
            const noon = parseDateStringNoon(day.dateStr);
            const isMain = day.dateStr === mainDate;
            const isComparing = compareList.includes(day.dateStr);
            const fillPct = Math.min(
              100,
              Math.round((day.maxPool / maxAcrossDays) * 100)
            );

            return (
              <div
                key={day.dateStr}
                onClick={() => handleDateClick(day.dateStr)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isMain
                    ? "border-sky-500 bg-sky-50/70 shadow-2xs ring-1 ring-sky-500/40"
                    : "border-slate-100 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex justify-between items-center gap-2 mb-2">
                  <span
                    className={`text-sm font-semibold capitalize ${
                      isMain ? "text-sky-800" : "text-slate-800"
                    }`}
                  >
                    {format(noon, "EEEE d.M.", { locale: cs })}
                  </span>
                  {!isMain && (
                    <button
                      type="button"
                      onClick={(e) => toggleCompare(day.dateStr, e)}
                      aria-pressed={isComparing}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border transition-colors cursor-pointer ${
                        isComparing
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-slate-50 text-slate-500 border-slate-200/70 hover:bg-slate-100 hover:text-slate-800"
                      }`}
                    >
                      <GitCompareArrows size={11} />
                      {isComparing ? "V grafu" : "Porovnat"}
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>
                    Max:{" "}
                    <strong
                      className={`tabular-nums ${
                        isMain ? "text-sky-700" : "text-slate-900"
                      }`}
                    >
                      {day.maxPool}
                    </strong>
                  </span>
                  <span>
                    Průměr:{" "}
                    <strong className="text-slate-700 tabular-nums">
                      {day.avgPool}
                    </strong>
                  </span>
                </div>

                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isMain ? "bg-sky-500" : "bg-sky-300"
                    }`}
                    style={{ width: `${Math.max(4, fillPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
