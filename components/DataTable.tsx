"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Download, Table2 } from "lucide-react";
import { formatPragueTime, getPragueHour } from "@/lib/date";
import { PoolId } from "@/lib/pools";

interface DataTableProps {
  data: {
    timestamp: Date | string;
    poolCount: number;
  }[];
  poolId: PoolId;
  dateStr: string;
}

export function DataTable({ data, poolId, dateStr }: DataTableProps) {
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "hourly">("all");

  // Sort ascending first to compute deltas accurately, then reverse for display
  const ascending = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const rowsWithDelta = ascending
    .map((record, idx) => {
      const prev = idx > 0 ? ascending[idx - 1] : null;
      const delta = prev ? record.poolCount - prev.poolCount : null;
      return {
        time: formatPragueTime(record.timestamp),
        poolCount: record.poolCount,
        delta,
      };
    })
    .reverse();

  // Hourly summary rows
  const hourlyMap = new Map<
    number,
    { sum: number; count: number; min: number; max: number }
  >();
  for (const record of ascending) {
    const h = getPragueHour(record.timestamp);
    const curr = hourlyMap.get(h) || {
      sum: 0,
      count: 0,
      min: record.poolCount,
      max: record.poolCount,
    };
    hourlyMap.set(h, {
      sum: curr.sum + record.poolCount,
      count: curr.count + 1,
      min: Math.min(curr.min, record.poolCount),
      max: Math.max(curr.max, record.poolCount),
    });
  }

  const hourlyRows = Array.from(hourlyMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([hour, s]) => ({
      hourLabel: `${String(hour).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59`,
      avg: Math.round(s.sum / s.count),
      min: s.min,
      max: s.max,
      samples: s.count,
    }));

  const visibleAllRows = expanded ? rowsWithDelta : rowsWithDelta.slice(0, 12);

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Table2 size={18} className="text-sky-600" />
          <h3 className="text-base font-semibold text-slate-900">
            Detailní záznamy
          </h3>
          <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full tabular-nums">
            {data.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === "all"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Měření
            </button>
            <button
              type="button"
              onClick={() => setViewMode("hourly")}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                viewMode === "hourly"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Po hodinách
            </button>
          </div>

          {data.length > 0 && (
            <a
              href={`/api/occupancy?pool=${poolId}&date=${dateStr}&format=csv`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
            >
              <Download size={13} />
              <span>CSV</span>
            </a>
          )}
        </div>
      </div>

      {data.length === 0 ? (
        <div className="px-6 py-8 text-center text-sm text-slate-500">
          Žádná data pro tento den.
        </div>
      ) : viewMode === "all" ? (
        <>
          <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50/90 sticky top-0 backdrop-blur-xs">
                <tr>
                  <th className="px-4 sm:px-6 py-3 font-semibold">Čas</th>
                  <th className="px-4 sm:px-6 py-3 font-semibold">
                    Návštěvníků
                  </th>
                  <th className="px-4 sm:px-6 py-3 font-semibold text-right">
                    Změna
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleAllRows.map((row, idx) => (
                  <tr
                    key={`${row.time}-${idx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-3 font-medium text-slate-900 whitespace-nowrap tabular-nums">
                      {row.time}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-slate-700 font-semibold tabular-nums">
                      {row.poolCount}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-right tabular-nums text-xs font-medium">
                      {row.delta === null ? (
                        <span className="text-slate-300">—</span>
                      ) : row.delta > 0 ? (
                        <span className="text-amber-600">+{row.delta}</span>
                      ) : row.delta < 0 ? (
                        <span className="text-emerald-600">{row.delta}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rowsWithDelta.length > 12 && (
            <div className="border-t border-slate-100 px-4 py-2.5 bg-slate-50/50 text-center">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} /> Zobrazit méně
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Zobrazit všech {rowsWithDelta.length}{" "}
                    záznamů
                  </>
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="max-h-[380px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50/90 sticky top-0">
              <tr>
                <th className="px-4 sm:px-6 py-3 font-semibold">Hodina</th>
                <th className="px-4 sm:px-6 py-3 font-semibold">Průměr</th>
                <th className="px-4 sm:px-6 py-3 font-semibold">Min – Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hourlyRows.map((row) => (
                <tr
                  key={row.hourLabel}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 sm:px-6 py-3 font-medium text-slate-900 tabular-nums">
                    {row.hourLabel}
                  </td>
                  <td className="px-4 sm:px-6 py-3 font-semibold text-sky-700 tabular-nums">
                    ø {row.avg}
                  </td>
                  <td className="px-4 sm:px-6 py-3 text-slate-600 tabular-nums">
                    {row.min} – {row.max}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
