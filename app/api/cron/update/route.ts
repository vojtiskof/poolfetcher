import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { scrapers } from "@/lib/scraper";
import { prisma } from "@/lib/prisma";
import { PoolId } from "@/lib/pools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const EXECUTION_REGION = process.env.VERCEL_REGION ?? "local";

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const cronHeader = request.headers.get("x-cron-secret");
  const vercelCronHeader = request.headers.get("x-vercel-cron");
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");

  if (vercelCronHeader === "1") return true;
  if (!secret) return false;

  return (
    authHeader === `Bearer ${secret}` ||
    cronHeader === secret ||
    querySecret === secret
  );
}

interface ScraperResult {
  success: boolean;
  id: PoolId;
  poolCount?: number;
  durationMs: number;
  sourceUrl?: string;
  error?: string;
}

async function runScrapers(targetPool?: string | null): Promise<ScraperResult[]> {
  const selectedScrapers = targetPool
    ? scrapers.filter((s) => s.id === targetPool)
    : scrapers;

  return Promise.all(
    selectedScrapers.map(async (scraper): Promise<ScraperResult> => {
      const started = Date.now();
      try {
        const data = await scraper.scrape();
        const record = await prisma.occupancyRecord.create({
          data: {
            poolId: data.poolId,
            poolCount: data.poolCount,
          },
        });
        return {
          success: true,
          id: scraper.id,
          poolCount: record.poolCount,
          sourceUrl: data.sourceUrl,
          durationMs: Date.now() - started,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[${scraper.id}] Scraper failed:`, err);
        Sentry.captureException(err, {
          tags: { poolId: scraper.id, component: "cron-scraper" },
        });
        return {
          success: false,
          id: scraper.id,
          error: message,
          durationMs: Date.now() - started,
        };
      }
    })
  );
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const poolFilter = url.searchParams.get("pool");
    const strict = url.searchParams.get("strict") === "1";

    if (poolFilter && !scrapers.some((s) => s.id === poolFilter)) {
      return NextResponse.json(
        { success: false, error: `Unknown pool: ${poolFilter}` },
        { status: 400 }
      );
    }

    const results = await runScrapers(poolFilter);
    const succeeded = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);
    const partialFailure = failed.length > 0 && succeeded.length > 0;

    if (succeeded.length === 0 || (strict && failed.length > 0)) {
      return NextResponse.json(
        {
          success: false,
          partialFailure,
          region: EXECUTION_REGION,
          results,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      partialFailure,
      region: EXECUTION_REGION,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

interface IngestPayloadItem {
  poolId: string;
  poolCount: number;
  timestamp?: string;
}

/**
 * Optional POST endpoint allowing either direct external push of scraped counts
 * (useful if municipal servers block cloud IP ranges) or running scrapers.
 */
export async function POST(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: unknown = null;
    try {
      const text = await request.text();
      body = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      const results = await runScrapers();
      const succeeded = results.some((r) => r.success);
      return NextResponse.json(
        {
          success: succeeded,
          region: EXECUTION_REGION,
          results,
          timestamp: new Date().toISOString(),
        },
        { status: succeeded ? 200 : 502 }
      );
    }

    const payload = body as {
      poolId?: string;
      poolCount?: number;
      timestamp?: string;
      records?: IngestPayloadItem[];
    };

    const items: IngestPayloadItem[] = Array.isArray(payload.records)
      ? payload.records
      : payload.poolId !== undefined && payload.poolCount !== undefined
        ? [
            {
              poolId: payload.poolId,
              poolCount: payload.poolCount,
              timestamp: payload.timestamp,
            },
          ]
        : [];

    if (items.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid records provided" },
        { status: 400 }
      );
    }

    const validPoolIds = new Set<string>(scrapers.map((s) => s.id));
    const created = [];

    for (const item of items) {
      if (
        !validPoolIds.has(item.poolId) ||
        typeof item.poolCount !== "number" ||
        !Number.isInteger(item.poolCount) ||
        item.poolCount < 0 ||
        item.poolCount > 1000
      ) {
        return NextResponse.json(
          { success: false, error: `Invalid record: ${JSON.stringify(item)}` },
          { status: 400 }
        );
      }

      const parsedDate = item.timestamp ? new Date(item.timestamp) : undefined;
      if (parsedDate && isNaN(parsedDate.getTime())) {
        return NextResponse.json(
          { success: false, error: `Invalid timestamp: ${item.timestamp}` },
          { status: 400 }
        );
      }

      const record = await prisma.occupancyRecord.create({
        data: {
          poolId: item.poolId,
          poolCount: item.poolCount,
          ...(parsedDate ? { timestamp: parsedDate } : {}),
        },
      });
      created.push(record);
    }

    return NextResponse.json({
      success: true,
      region: EXECUTION_REGION,
      createdCount: created.length,
      records: created,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron POST failed:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
