"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

export interface DailyStatsSummary {
  date: Date;
  maxPool: number;
  avgPool: number;
}

export function HistorySidebar({ stats }: { stats: DailyStatsSummary[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareList =
    searchParams.get("compare")?.split(",").filter(Boolean) || [];

  // Normalize dates to comparable strings
  const mainDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const toggleCompare = (dateStr: string) => {
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
    params.set("date", dateStr);
    // Maybe clear comparison when switching main date? Let's keep it flexible.
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 lg:sticky lg:top-4">
      <h3 className="font-medium text-slate-800 mb-4 px-1">Historie dní</h3>
      <div className="space-y-3 max-h-[500px] lg:max-h-[80vh] overflow-y-auto pr-1">
        {stats.map((day) => {
          const dateStr = format(day.date, "yyyy-MM-dd");
          const isMain = dateStr === mainDate;
          const isComparing = compareList.includes(dateStr);

          return (
            <div
              key={dateStr}
              className={`p-3 rounded-lg border transition-all ${isMain
                ? "border-sky-500 bg-sky-50 shadow-sm ring-1 ring-sky-500"
                : "border-slate-100 hover:border-slate-300 bg-white"
                }`}
            >
              <div className="flex justify-between items-start mb-2">
                <button
                  onClick={() => handleDateClick(dateStr)}
                  className={`font-medium capitalize text-left hover:underline ${isMain ? "text-sky-700" : "text-slate-700"
                    }`}
                >
                  {format(day.date, "EEEE d.M.", { locale: cs })}
                </button>
                {!isMain && (
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none py-1 px-1.5 rounded hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isComparing}
                      onChange={() => toggleCompare(dateStr)}
                      className="rounded border-slate-300 text-sky-500 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span className="text-slate-500">Porovnat</span>
                  </label>
                )}
              </div>
              <div
                className="grid grid-cols-1 gap-2 text-xs text-slate-500"
                onClick={() => handleDateClick(dateStr)}
                style={{ cursor: "pointer" }}
              >
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-slate-400">
                    Bazén Max
                  </span>
                  <span
                    className={`font-semibold ${isMain ? "text-sky-700" : "text-slate-700"
                      }`}
                  >
                    {day.maxPool}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
