import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import { Users, Droplets } from "lucide-react";

interface CurrentStatusProps {
  latestRecord: {
    timestamp: Date;
    poolCount: number;
    wellnessCount: number;
  } | null;
}

export function CurrentStatus({ latestRecord }: CurrentStatusProps) {
  if (!latestRecord) {
    return (
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
        <p className="text-slate-500">Zatím žádná data.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">Vodní zóna</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">
              {latestRecord.poolCount}
            </span>
            <span className="text-sm text-slate-500">osob</span>
          </div>
        </div>
        <div className="h-12 w-12 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
          <Droplets size={24} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            Wellness zóna
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-slate-900">
              {latestRecord.wellnessCount}
            </span>
            <span className="text-sm text-slate-500">osob</span>
          </div>
        </div>
        <div className="h-12 w-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
          <Users size={24} />
        </div>
      </div>

      <p className="col-span-1 md:col-span-2 text-xs text-right text-slate-400 mt-2">
        Aktualizováno:{" "}
        {formatDistanceToNow(new Date(latestRecord.timestamp), {
          addSuffix: true,
          locale: cs,
        })}
      </p>
    </div>
  );
}
