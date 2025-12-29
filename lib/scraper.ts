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
    
    // Strategy: Find all elements, look for text match, then look for the number in the next element or same element.
    // Based on "Vodní zóna\n105", it might be in a separate element or a text node.
    
    let poolCount = 0;
    let wellnessCount = 0;

    // Helper to extract number from string
    const extractNumber = (text: string) => {
      const match = text.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    };

    $('body *').each((i, el) => {
        const text = $(el).text().trim();
        // Check for direct text match or contains
        if (text.includes('Vodní zóna')) {
            // Checks if the number is in the same element's text (if it's a leaf node)
            // or if it is in the next sibling.
            // But 'body *' iterates all.
            
            // A more specific selector would be better if we knew the class, but we don't.
            // Let's try to look at logical siblings or parent structures if we were debugging.
            // For now, let's assume standard layout.
        }
    });

    // Alternative robust strategy: 
    // Get the full text of the body, regex match the pattern.
    // "Vodní zóna" ... number
    // "Wellness zóna" ... number
    const bodyText = $('body').text().replace(/\s+/g, ' '); // normalize whitespace
    
    const poolMatch = bodyText.match(/Vodní zóna.*?(\d+)/);
    if (poolMatch) {
       poolCount = parseInt(poolMatch[1], 10);
    }
    
    const wellnessMatch = bodyText.match(/Wellness zóna.*?(\d+)/);
    if (wellnessMatch) {
        wellnessCount = parseInt(wellnessMatch[1], 10);
    }

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
