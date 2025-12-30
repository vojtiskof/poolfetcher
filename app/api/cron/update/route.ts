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

    let poolCount = data.poolCount;
    let wellnessCount = data.wellnessCount;

    // Fallback to last known values if scraping failed to find numbers (e.g. site changed or empty)
    if (poolCount === null || wellnessCount === null) {
      console.warn('Scraper returned null values, fetching last known record.');
      const lastRecord = await prisma.occupancyRecord.findFirst({
        orderBy: { timestamp: 'desc' },
      });

      if (lastRecord) {
        poolCount = poolCount ?? lastRecord.poolCount;
        wellnessCount = wellnessCount ?? lastRecord.wellnessCount;
      } else {
        // Cold start fallback
        poolCount = poolCount ?? 0;
        wellnessCount = wellnessCount ?? 0;
      }
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
