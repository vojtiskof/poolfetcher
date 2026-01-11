import * as cheerio from 'cheerio';
import { ScrapedData } from './types';

const URL = 'https://sokolovna.bazenmb.cz/';

export async function scrapeMB(): Promise<ScrapedData> {
    const response = await fetch(URL, {
        cache: 'no-store',
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch ${URL}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Based on user provided HTML:
    // <div class="ds_swimming">
    //   <h5 class="ds_swimming_title">Bazén sokolovna</h5>
    //   ...
    //   <p>4 osoby <span>jsou aktuálně v bazénu</span></p>
    // </div>

    const container = $('.ds_swimming');
    if (!container.length) {
        throw new Error("MB scraper: .ds_swimming not found");
    }

    const text = container.find('p').first().text().trim();
    // Text should be "4 osoby jsou aktuálně v bazénu" or similar.
    // We want to extract the first number.

    const match = text.match(/^(\d+)/);
    if (!match) {
        throw new Error(`MB scraper: Could not extract number from text: "${text}"`);
    }

    const poolCount = parseInt(match[1], 10);

    return {
        poolId: 'mb',
        poolCount,
    };
}
