
export interface ScrapedData {
  poolId: string;
  poolCount: number;
}

export interface Scraper {
  id: string;
  scrape: () => Promise<ScrapedData>;
}
