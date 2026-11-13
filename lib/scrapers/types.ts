import { PoolId } from "../pools";

export interface ScrapedData {
  poolId: PoolId;
  poolCount: number;
  sourceUrl?: string;
}

export interface Scraper {
  id: PoolId;
  scrape: () => Promise<ScrapedData>;
}
