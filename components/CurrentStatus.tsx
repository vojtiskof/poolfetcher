import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  TrendingDown,
  TrendingUp,
  Minus,
  Users,
} from "lucide-react";
import {
  POOLS,
  PoolId,
  getOccupancyStatus,
} from "@/lib/pools";
import {
  formatPragueTime,
  getPoolOpeningInfo,
} from "@/lib/date";

interface LatestReading {
  timestamp: Date;
  poolCount: number;
}

interface CurrentStatusProps {
  poolId: PoolId;
  nowMs: number;
  latestRecord: LatestReading | null;
  previousRecord?: LatestReading | null;
  comparedPool?: {
    poolId: PoolId;
    latestRecord: LatestReading | null;
  } | null;
}

function PoolStatusCard({
  poolId,
  nowMs,
  latestRecord,
  previousRecord,
  compact = false,
}: {
  poolId: PoolId;
  nowMs: number;
  latestRecord: LatestReading | null;
  previousRecord?: LatestReading | null;
  compact?: boolean;
}) {
  const pool = POOLS[poolId];
  const opening = getPoolOpeningInfo(poolId, new Date(nowMs));

  if (!latestRecord) {
    return (
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {pool.fullName}
            </p>
            <h2 className="text-base font-semibold text-slate-800">
              Aktuální obsazenost
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
              opening.isOpen
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            <Clock size={12} />
            {opening.isOpen ? "Otevřeno" : "Zavřeno"}
          </span>
        </div>
        <p className="text-sm text-slate-500 py-4">
          Pro tento bazén zatím nejsou v databázi žádná měření.
        </p>
      </div>
    );
  }

  const ts = new Date(latestRecord.timestamp);
  const ageMinutes = Math.round((nowMs - ts.getTime()) / 60000);
  const isStale = opening.isOpen ? ageMinutes > 30 : ageMinutes > 180;
  const isFresh = ageMinutes <= 25;
  const status = getOccupancyStatus(poolId, latestRecord.poolCount);

  const delta =
    previousRecord && previousRecord.timestamp
      ? latestRecord.poolCount - previousRecord.poolCount
      : null;

  return (
    <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-700">
              {pool.fullName}
            </span>
            <a
              href={pool.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-sky-600 transition-colors"
              title={`Otevřít web ${pool.fullName}`}
              aria-label={`Otevřít web ${pool.fullName}`}
            >
              <ExternalLink size={13} />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                opening.isOpen
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              <Clock size={11} />
              {opening.isOpen
                ? `Otevřeno (${opening.todayHoursLabel})`
                : `Zavřeno (dnes ${opening.todayHoursLabel})`}
            </span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${status.badgeClass}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${status.dotClass} ${
              isFresh ? "animate-pulse" : ""
            }`}
          />
          {status.label}
        </span>
      </div>

      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1">
            Aktuálně ve vodní zóně
          </p>
          <div className="flex items-baseline gap-2.5">
            <span
              className={`font-bold tracking-tight text-slate-900 tabular-nums ${
                compact ? "text-4xl" : "text-4xl sm:text-5xl"
              }`}
            >
              {latestRecord.poolCount}
            </span>
            <span className="text-sm font-medium text-slate-500">
              {latestRecord.poolCount === 1
                ? "osoba"
                : latestRecord.poolCount >= 2 && latestRecord.poolCount <= 4
                  ? "osoby"
                  : "osob"}
            </span>
          </div>

          {delta !== null && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-medium">
              {delta > 0 ? (
                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  <TrendingUp size={13} />+{delta} oproti předchozímu měření
                </span>
              ) : delta < 0 ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <TrendingDown size={13} />
                  {delta} oproti předchozímu měření
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  <Minus size={13} />
                  Beze změny
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-12 w-12 sm:h-14 sm:w-14 bg-sky-50 border border-sky-100 rounded-2xl flex items-center justify-center text-sky-600 shrink-0">
          <Users size={24} />
        </div>
      </div>

      {pool.capacity && status.percentage !== null && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Využití kapacity ({pool.capacity} osob)</span>
            <span className="font-semibold text-slate-700 tabular-nums">
              {status.percentage} %
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${status.barClass}`}
              style={{ width: `${Math.max(2, status.percentage)}%` }}
            />
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-400">
          Poslední záznam:{" "}
          <strong className="font-medium text-slate-600 tabular-nums">
            {formatPragueTime(ts)}
          </strong>{" "}
          (
          {formatDistanceToNow(ts, {
            addSuffix: true,
            locale: cs,
          })}
          )
        </span>

        {isStale && (
          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-medium">
            <AlertTriangle size={12} />
            Neaktuální data
          </span>
        )}
      </div>
    </div>
  );
}

export function CurrentStatus({
  poolId,
  nowMs,
  latestRecord,
  previousRecord,
  comparedPool,
}: CurrentStatusProps) {
  if (comparedPool) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PoolStatusCard
          poolId={poolId}
          nowMs={nowMs}
          latestRecord={latestRecord}
          previousRecord={previousRecord}
          compact
        />
        <PoolStatusCard
          poolId={comparedPool.poolId}
          nowMs={nowMs}
          latestRecord={comparedPool.latestRecord}
          compact
        />
      </div>
    );
  }

  return (
    <PoolStatusCard
      poolId={poolId}
      nowMs={nowMs}
      latestRecord={latestRecord}
      previousRecord={previousRecord}
    />
  );
}
