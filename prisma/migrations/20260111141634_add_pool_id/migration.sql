-- AlterTable
ALTER TABLE "OccupancyRecord" ADD COLUMN     "poolId" TEXT NOT NULL DEFAULT 'nymburk',
ALTER COLUMN "wellnessCount" SET DEFAULT 0;
