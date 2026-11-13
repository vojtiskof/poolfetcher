export type PoolId = "nymburk" | "mb";

export interface PoolConfig {
  id: PoolId;
  shortName: string;
  name: string;
  fullName: string;
  subtitle: string;
  city: string;
  websiteUrl: string;
  capacity: number | null;
  openingHours: {
    weekday: { open: string; close: string; label: string };
    weekend: { open: string; close: string; label: string };
    byDay?: Partial<Record<number, { open: string; close: string; label: string }>>;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
  };
}

export const POOLS: Record<PoolId, PoolConfig> = {
  nymburk: {
    id: "nymburk",
    shortName: "Nymburk",
    name: "Nymburk",
    fullName: "Relaxační centrum Labe",
    subtitle: "Plavecký bazén 25 m • Nymburk",
    city: "Nymburk",
    websiteUrl: "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp",
    capacity: 128,
    openingHours: {
      weekday: { open: "06:00", close: "21:00", label: "6:00–21:00" },
      weekend: { open: "06:00", close: "21:00", label: "6:00–21:00" },
    },
    thresholds: {
      low: 30,
      medium: 65,
      high: 95,
    },
  },
  mb: {
    id: "mb",
    shortName: "Mladá Boleslav",
    name: "Mladá Boleslav",
    fullName: "Bazén Sokolovna MB",
    subtitle: "Plavecký bazén Sokolovna • Mladá Boleslav",
    city: "Mladá Boleslav",
    websiteUrl: "https://sokolovna.bazenmb.cz/",
    capacity: null,
    openingHours: {
      weekday: { open: "06:00", close: "22:00", label: "6:00–8:00, 14:00–22:00" },
      weekend: { open: "08:00", close: "20:00", label: "8:00–20:00" },
      byDay: {
        2: { open: "06:00", close: "22:00", label: "6:00–8:00, 13:30–15:00, 18:00–22:00" },
        5: { open: "06:00", close: "22:00", label: "6:00–8:00, 13:30–15:00, 18:00–22:00" },
      },
    },
    thresholds: {
      low: 15,
      medium: 35,
      high: 55,
    },
  },
};

export const POOL_LIST: PoolConfig[] = [POOLS.nymburk, POOLS.mb];

export function normalizePoolId(pool?: string | null): PoolId {
  if (pool === "mb") return "mb";
  return "nymburk";
}

export interface OccupancyStatus {
  level: "low" | "medium" | "high" | "full";
  label: string;
  badgeClass: string;
  dotClass: string;
  barClass: string;
  percentage: number | null;
}

export function getOccupancyStatus(poolId: PoolId, count: number): OccupancyStatus {
  const pool = POOLS[poolId];
  const percentage = pool.capacity
    ? Math.min(100, Math.round((count / pool.capacity) * 100))
    : null;

  if (count <= pool.thresholds.low) {
    return {
      level: "low",
      label: "Klidno",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      dotClass: "bg-emerald-500",
      barClass: "bg-emerald-500",
      percentage,
    };
  }
  if (count <= pool.thresholds.medium) {
    return {
      level: "medium",
      label: "Středně plno",
      badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
      dotClass: "bg-sky-500",
      barClass: "bg-sky-500",
      percentage,
    };
  }
  if (count <= pool.thresholds.high) {
    return {
      level: "high",
      label: "Vyšší návštěvnost",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      dotClass: "bg-amber-500",
      barClass: "bg-amber-500",
      percentage,
    };
  }
  return {
    level: "full",
    label: "Velmi plno",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    dotClass: "bg-rose-500",
    barClass: "bg-rose-500",
    percentage,
  };
}
