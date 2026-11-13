"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { GitCompareArrows, X } from "lucide-react";
import {
  getPragueDateString,
  normalizePragueDateParam,
  shiftDateString,
} from "@/lib/date";
import { POOL_LIST, normalizePoolId } from "@/lib/pools";

export interface ActiveComparisonBadge {
  id: string;
  label: string;
  color: string;
  type: "date" | "pool";
}

export function QuickCompareBar({
  activeComparisons,
}: {
  activeComparisons: ActiveComparisonBadge[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentPool = normalizePoolId(searchParams.get("pool"));
  const currentDate = normalizePragueDateParam(searchParams.get("date"));
  const compareDates =
    searchParams.get("compare")?.split(",").filter(Boolean) || [];
  const compareWithPool = searchParams.get("compare_with");

  const yesterdayStr = shiftDateString(currentDate, -1);
  const weekAgoStr = shiftDateString(currentDate, -7);
  const todayStr = getPragueDateString(new Date());
  const otherPool = POOL_LIST.find((p) => p.id !== currentPool);

  const toggleDateCompare = (targetDate: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = compareDates.includes(targetDate)
      ? compareDates.filter((d) => d !== targetDate)
      : [...compareDates, targetDate];

    if (next.length > 0) {
      params.set("compare", next.join(","));
    } else {
      params.delete("compare");
    }
    router.push(`/?${params.toString()}`);
  };

  const togglePoolCompare = () => {
    if (!otherPool) return;
    const params = new URLSearchParams(searchParams.toString());
    if (compareWithPool === otherPool.id) {
      params.delete("compare_with");
    } else {
      params.set("compare_with", otherPool.id);
    }
    router.push(`/?${params.toString()}`);
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("compare");
    params.delete("compare_with");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  };

  const removeBadge = (item: ActiveComparisonBadge) => {
    if (item.type === "pool") {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("compare_with");
      router.push(`/?${params.toString()}`);
    } else {
      toggleDateCompare(item.id);
    }
  };

  const isYesterdayActive = compareDates.includes(yesterdayStr);
  const isWeekAgoActive = compareDates.includes(weekAgoStr);
  const isOtherPoolActive = Boolean(compareWithPool && compareWithPool !== currentPool);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 mr-1">
        <GitCompareArrows size={14} className="text-slate-400" />
        Rychlé porovnání:
      </span>

      <button
        type="button"
        onClick={() => toggleDateCompare(yesterdayStr)}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
          isYesterdayActive
            ? "bg-amber-50 text-amber-800 border-amber-200"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        {currentDate === todayStr ? "Včera" : "Předchozí den"}
      </button>

      <button
        type="button"
        onClick={() => toggleDateCompare(weekAgoStr)}
        className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
          isWeekAgoActive
            ? "bg-violet-50 text-violet-800 border-violet-200"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
        }`}
      >
        Před týdnem
      </button>

      {otherPool && (
        <button
          type="button"
          onClick={togglePoolCompare}
          className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
            isOtherPoolActive
              ? "bg-sky-50 text-sky-800 border-sky-200"
              : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
          }`}
        >
          vs {otherPool.shortName}
        </button>
      )}

      {activeComparisons.length > 0 && (
        <>
          <span className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:inline-block" />
          {activeComparisons.map((badge) => (
            <button
              key={`${badge.type}-${badge.id}`}
              type="button"
              onClick={() => removeBadge(badge)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
              title="Odebrat porovnání"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: badge.color }}
              />
              <span>{badge.label}</span>
              <X size={12} className="text-slate-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-slate-400 hover:text-slate-700 px-1.5 py-1 transition-colors cursor-pointer"
          >
            Zrušit vše
          </button>
        </>
      )}
    </div>
  );
}
