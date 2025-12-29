-- CreateTable
CREATE TABLE "OccupancyRecord" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poolCount" INTEGER NOT NULL,
    "wellnessCount" INTEGER NOT NULL,

    CONSTRAINT "OccupancyRecord_pkey" PRIMARY KEY ("id")
);
