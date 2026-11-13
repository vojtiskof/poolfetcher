"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import {
  getPragueDateString,
  normalizePragueDateParam,
  shiftDateString,
} from "@/lib/date";

export function DateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const todayStr = getPragueDateString(new Date());
  const currentDateStr = normalizePragueDateParam(searchParams.get("date"));
  const isToday = currentDateStr === todayStr;

  const pushDate = (newDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newDate === todayStr) {
      params.delete("date");
    } else {
      params.set("date", newDate);
    }
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      pushDate(todayStr);
      return;
    }
    pushDate(val);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
      <div className="flex items-center bg-white rounded-xl border border-slate-200 shadow-2xs p-1 flex-1 sm:flex-initial justify-between sm:justify-start">
        <button
          type="button"
          onClick={() => pushDate(shiftDateString(currentDateStr, -1))}
          aria-label="Předchozí den"
          title="Předchozí den"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <label className="flex items-center gap-2 px-2 cursor-pointer">
          <Calendar size={15} className="text-sky-600 shrink-0" />
          <input
            type="date"
            id="date-filter"
            aria-label="Vybrat datum"
            max={todayStr}
            value={currentDateStr}
            onChange={handleDateChange}
            className="outline-none text-slate-800 bg-transparent text-sm font-medium tabular-nums cursor-pointer"
          />
        </label>

        <button
          type="button"
          disabled={isToday}
          onClick={() => pushDate(shiftDateString(currentDateStr, 1))}
          aria-label="Následující den"
          title="Následující den"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors disabled:opacity-35 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {!isToday && (
        <button
          type="button"
          onClick={() => pushDate(todayStr)}
          className="px-3 py-2 text-sm font-medium rounded-xl bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
        >
          Dnes
        </button>
      )}

      <button
        type="button"
        onClick={handleRefresh}
        aria-label="Obnovit data"
        title="Obnovit data"
        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-xl bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 shadow-2xs transition-all cursor-pointer"
      >
        <RefreshCw
          size={15}
          className={isRefreshing ? "animate-spin text-sky-600" : ""}
        />
        <span className="hidden sm:inline">Obnovit</span>
      </button>
    </div>
  );
}
