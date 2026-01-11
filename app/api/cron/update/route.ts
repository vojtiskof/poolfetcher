import { NextResponse } from 'next/server';
import { scrapers } from '@/lib/scraper';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const vercelCronHeader = request.headers.get('x-vercel-cron'); // Auto-injected by Vercel

    const authorized =
      vercelCronHeader === '1' ||
      authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!authorized) {
      // In production, we must strictly enforce auth
      if (process.env.NODE_ENV === 'production') {
        return new NextResponse('Unauthorized', { status: 401 });
      }
    }

    const results = await Promise.allSettled(scrapers.map(async (scraper) => {
      try {
        const data = await scraper.scrape();

        // Skip if critical data is missing
        if (data.poolCount === null) {
          console.warn(`[${scraper.id}] Scraper returned null values. Skipping DB write.`);
          return { success: false, id: scraper.id, message: 'Data unavailable' };
        }

        const record = await prisma.occupancyRecord.create({
          data: {
            poolId: data.poolId,
            poolCount: data.poolCount ?? 0,
          },
        });
        return { success: true, id: scraper.id, record };
      } catch (err) {
        console.error(`[${scraper.id}] Scraper failed:`, err);
        return { success: false, id: scraper.id, error: String(err) };
      }
    }));

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
