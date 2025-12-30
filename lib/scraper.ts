import * as cheerio from 'cheerio';

const URL = 'https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp';

export interface ScrapedData {
  poolCount: number;
  wellnessCount: number;
}

export async function scrapeOccupancy(): Promise<ScrapedData> {
  try {
    const response = await fetch(URL, {
      cache: 'no-store', // Ensure fresh data
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch ${URL}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Context based on the text analysis: "Vodní zóna" followed by number
    // We need to find the element that contains "Vodní zóna" and extract the number nearby.
    // Since I don't have the exact DOM structure, I'll search for text nodes.
    
    // Targeted scraping based on provided HTML structure:
    // <div class="navstevy">...<p class="navstevy__heading">Vodní zóna</p><p class="navstevy__value">44</p>...</div>
    
    // We can directly find the values. The order seems to be 1. Water, 2. Wellness.
    // However, relying on index might be brittle if they change order.
    // Let's try to find the heading and then the next value.

    let poolCount = 0;
    let wellnessCount = 0;

    $('.navstevy__heading').each((_, el) => {
        const title = $(el).text().trim();
        const valueEl = $(el).next('.navstevy__value');
        if (valueEl.length) {
            const val = parseInt(valueEl.text().trim(), 10);
            if (!isNaN(val)) {
                if (title.includes('Vodní zóna')) {
                    poolCount = val;
                } else if (title.includes('Wellness zóna')) {
                    wellnessCount = val;
                }
            }
        }
    });

    // fallback check: if counts are zero, maybe the regex is too loose or tight.
    // Specifically looking for the structure found in read_url_content:
    // "## Aktuální návštěvnost\nVodní zóna\n105\nWellness zóna\n14"
    // This implies text proximity.

    return { poolCount, wellnessCount };

  } catch (error) {
    console.error("Scraping error:", error);
    throw error;
  }
}
