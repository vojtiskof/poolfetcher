import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POOL_LIST } from "@/lib/pools";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const poolsStatus = await Promise.all(
      POOL_LIST.map(async (pool) => {
        const latest = await prisma.occupancyRecord.findFirst({
          where: { poolId: pool.id },
          orderBy: { timestamp: "desc" },
        });
        const ageMinutes = latest
          ? Math.round((Date.now() - latest.timestamp.getTime()) / 60000)
          : null;

        return {
          poolId: pool.id,
          name: pool.fullName,
          lastRecordAt: latest?.timestamp.toISOString() ?? null,
          lastCount: latest?.poolCount ?? null,
          ageMinutes,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      region: process.env.VERCEL_REGION ?? "local",
      timestamp: new Date().toISOString(),
      pools: poolsStatus,
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { ok: false, error: "Database unavailable" },
      { status: 503 }
    );
  }
}
