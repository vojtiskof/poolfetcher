import { NextResponse } from 'next/server';
import { scrapeOccupancy } from '@/lib/scraper';
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

    const data = await scrapeOccupancy();

    const { poolCount, wellnessCount } = data;

    // If data is unavailable, do NOT use last known value as it messes up averages.
    // Instead, skip storing this data point.
    if (poolCount === null || wellnessCount === null) {
      console.warn('Scraper returned null values. Skipping DB write.');
      return NextResponse.json({ success: true, message: 'Data unavailable, skipped storage' });
    }

    const record = await prisma.occupancyRecord.create({
      data: {
        poolCount,
        wellnessCount,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
