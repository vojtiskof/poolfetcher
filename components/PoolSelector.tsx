"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftRight, Waves } from "lucide-react";
import { POOL_LIST, normalizePoolId } from "@/lib/pools";

export function PoolSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPool = normalizePoolId(searchParams.get("pool"));
  const isComparing = searchParams.has("compare_with");

  const handlePoolChange = (poolId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCompare = params.get("compare_with");

    if (currentCompare === poolId) {
      const other = POOL_LIST.find((p) => p.id !== poolId)?.id;
      if (other) {
        params.set("compare_with", other);
      } else {
        params.delete("compare_with");
      }
    }

    params.set("pool", poolId);
    router.push(`/?${params.toString()}`);
  };

  const toggleComparison = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (!isComparing) {
      const other =
        POOL_LIST.find((p) => p.id !== currentPool)?.id || "mb";
      params.set("compare_with", other);
    } else {
      params.delete("compare_with");
    }
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
      <div
        role="tablist"
        aria-label="Výběr bazénu"
        className="grid grid-cols-2 sm:inline-flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70"
      >
        {POOL_LIST.map((pool) => {
          const active = currentPool === pool.id;
          return (
            <button
              key={pool.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handlePoolChange(pool.id)}
              className={`flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                active
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Waves
                size={15}
                className={active ? "text-sky-600" : "text-slate-400"}
              />
              <span className="truncate">{pool.shortName}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-pressed={isComparing}
        onClick={toggleComparison}
        className={`inline-flex items-center justify-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl border transition-all cursor-pointer ${
          isComparing
            ? "bg-sky-50 text-sky-700 border-sky-200 shadow-xs"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
        }`}
      >
        <ArrowLeftRight size={15} />
        <span>Porovnat bazény</span>
      </button>
    </div>
  );
}
