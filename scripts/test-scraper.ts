import { scrapeOccupancy } from '../lib/scraper';

(async () => {
    console.log("Testing scraper...");
    try {
        const data = await scrapeOccupancy();
        console.log("Scraped Data:", data);
    } catch (e) {
        console.error("Test failed:", e);
    }
})();
