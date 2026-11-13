import * as cheerio from "cheerio";
import { ScrapedData } from "./types";

const URL = "https://sokolovna.bazenmb.cz/";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

/**
 * Extracts current occupancy count from Bazén Sokolovna MB HTML.
 */
export function extractMBPoolCount(html: string): number | null {
  const $ = cheerio.load(html);

  const container = $(".ds_swimming");
  if (container.length) {
    const text = container.find("p").first().text().trim();
    const match = text.match(/(\d+)/);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val >= 0 && val <= 1000) {
        return val;
      }
    }
  }

  // Fallback on full body text
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const fallbackMatch = bodyText.match(
    /Baz[ée]n\s*sokolovna[^0-9]{0,40}(\d{1,4})\s*osob/i
  );
  if (fallbackMatch) {
    const val = parseInt(fallbackMatch[1], 10);
    if (!isNaN(val) && val >= 0 && val <= 1000) {
      return val;
    }
  }

  return null;
}

export async function scrapeMB(): Promise<ScrapedData> {
  const response = await fetch(URL, {
    cache: "no-store",
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${URL} (HTTP ${response.status})`);
  }

  const html = await response.text();
  const poolCount = extractMBPoolCount(html);

  if (poolCount === null) {
    throw new Error("MB scraper: Could not extract pool count from page");
  }

  return {
    poolId: "mb",
    poolCount,
    sourceUrl: URL,
  };
}
