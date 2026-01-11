import { prisma } from '../lib/prisma';
import { subDays, startOfDay, addMinutes, isBefore } from 'date-fns';

async function main() {
  console.log('Seeding database with mock data...');

  // Configuration
  const daysBack = 7;
  const startHour = 6;
  const endHour = 12; // Noon as per request
  const intervalMinutes = 10;

  // Clear existing data (optional, but good for clean slate)
  // await prisma.occupancyRecord.deleteMany();
  // console.log('Cleared existing data.');

  const endDate = new Date();
  const startDate = subDays(endDate, daysBack);

  let recordsToCreate = [];

  const pools = ['nymburk', 'mb'];

  for (let d = 0; d <= daysBack; d++) {
    const currentDay = subDays(endDate, d);

    // Start time for this day (06:00)
    let currentTime = startOfDay(currentDay);
    currentTime.setHours(startHour, 0, 0, 0);

    // End time for this day (12:00)
    const dayEndTime = startOfDay(currentDay);
    dayEndTime.setHours(endHour, 0, 0, 0);

    while (isBefore(currentTime, dayEndTime) || currentTime.getTime() === dayEndTime.getTime()) {

      for (const poolId of pools) {
        // Generate random pool count (0 - 100) with some time-based variance
        // Different ranges for variety
        const isMb = poolId === 'mb';
        const base = isMb ? 10 : 20;
        const variance = isMb ? 40 : 80;

        const poolCount = Math.floor(Math.random() * variance) + base;

        recordsToCreate.push({
          timestamp: new Date(currentTime),
          poolId,
          poolCount,
        });
      }

      currentTime = addMinutes(currentTime, intervalMinutes);
    }
  }

  console.log(`Generating ${recordsToCreate.length} records...`);

  // Batch insert
  for (const record of recordsToCreate) {
    await prisma.occupancyRecord.create({
      data: record
    });
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
