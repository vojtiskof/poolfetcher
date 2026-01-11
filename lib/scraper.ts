import { scrapeNymburk } from './scrapers/nymburk';
import { scrapeMB } from './scrapers/mb';
import { Scraper } from './scrapers/types';

export const scrapers: Scraper[] = [
  { id: 'nymburk', scrape: scrapeNymburk },
  { id: 'mb', scrape: scrapeMB },
];

export { scrapeNymburk, scrapeMB };
