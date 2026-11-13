import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizePoolId } from "@/lib/pools";
import {
  formatPragueTime,
  getPragueDayBounds,
  normalizePragueDateParam,
} from "@/lib/date";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pool = normalizePoolId(searchParams.get("pool"));
    const dateStr = normalizePragueDateParam(searchParams.get("date"));
    const formatParam = searchParams.get("format");

    const { start, end } = getPragueDayBounds(dateStr);

    const records = await prisma.occupancyRecord.findMany({
      where: {
        poolId: pool,
        timestamp: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    if (formatParam === "csv") {
      const header = "timestamp_utc,time_prague,pool_id,pool_count\n";
      const rows = records
        .map(
          (r) =>
            `${r.timestamp.toISOString()},${formatPragueTime(r.timestamp)},${r.poolId},${r.poolCount}`
        )
        .join("\n");

      return new NextResponse(header + rows, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="occupancy-${pool}-${dateStr}.csv"`,
        },
      });
    }

    return NextResponse.json({
      pool,
      date: dateStr,
      count: records.length,
      records,
    });
  } catch (error) {
    console.error("Occupancy API failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch occupancy data" },
      { status: 500 }
    );
  }
}
