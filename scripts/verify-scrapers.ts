
import { scrapers } from '../lib/scraper';

async function main() {
    console.log("Starting scraper verification...");
    for (const scraper of scrapers) {
        console.log(`Testing scraper: ${scraper.id}`);
        try {
            const data = await scraper.scrape();
            console.log(`[SUCCESS] ${scraper.id}:`, data);
        } catch (error) {
            console.error(`[FAILURE] ${scraper.id}:`, error);
        }
    }
}

main().catch(console.error);
