import * as cheerio from 'cheerio';
import { ScrapedData } from './types';

const URL = 'https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp';

export async function scrapeNymburk(): Promise<ScrapedData> {
    const response = await fetch(URL, {
        cache: 'no-store',
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${URL}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let poolCount: number | null = null;

    $('.navstevy__heading').each((_, el) => {
        const title = $(el).text().trim();
        const valueEl = $(el).next('.navstevy__value');
        if (valueEl.length && title.includes('Vodní zóna')) {
            const val = parseInt(valueEl.text().trim(), 10);
            if (!isNaN(val)) {
                poolCount = val;
            }
        }
    });

    if (poolCount === null) {
        console.warn("Nymburk scraper: Could not find pool count");
        // throw new Error("Could not find pool count for Nymburk"); 
        // Instead of throwing, maybe return -1 or handle upstream? 
        // Existing logic returned null, let's throw to indicate failure so it's skipped.
        throw new Error("Could not find pool count for Nymburk");
    }

    return {
        poolId: 'nymburk',
        poolCount: poolCount,
    };
}
