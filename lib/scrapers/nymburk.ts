import * as cheerio from "cheerio";
import { ScrapedData } from "./types";

const NYMBURK_URLS = [
  "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp",
  "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/",
  "https://www.relaxacnicentrumlabe.cz/",
];

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
  "Cache-Control": "no-cache",
};

function parseValidCount(raw: string): number | null {
  const match = raw.replace(/\s+/g, " ").trim().match(/(\d+)/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  if (isNaN(val) || val < 0 || val > 1000) return null;
  return val;
}

/**
 * Extracts current water-zone occupancy count from Nymburk Relaxační centrum Labe HTML.
 * Supports primary .navstevy__heading/.navstevy__value markup plus resilient fallbacks.
 */
export function extractNymburkPoolCount(html: string): number | null {
  const $ = cheerio.load(html);

  // Strategy 1: Original .navstevy__heading + .navstevy__value structure
  let found: number | null = null;
  $(".navstevy__heading").each((_, el) => {
    if (found !== null) return;
    const title = $(el).text().trim().toLowerCase();
    if (title.includes("vodní zóna") || title.includes("vodni zona")) {
      const nextVal = $(el).next(".navstevy__value");
      if (nextVal.length) {
        const parsed = parseValidCount(nextVal.text());
        if (parsed !== null) {
          found = parsed;
          return;
        }
      }
      const parentVal = $(el).parent().find(".navstevy__value").first();
      if (parentVal.length) {
        const parsed = parseValidCount(parentVal.text());
        if (parsed !== null) {
          found = parsed;
        }
      }
    }
  });
  if (found !== null) return found;

  // Strategy 2: Any container with navstev / obsazen / kapacit class mentioning Vodní zóna
  $('[class*="navstev"], [class*="obsazen"], [class*="occupancy"]').each(
    (_, el) => {
      if (found !== null) return;
      const text = $(el).text().replace(/\s+/g, " ").trim();
      const match = text.match(/Vodn[íi]\s*z[oó]na\s*:?\s*(\d{1,4})/i);
      if (match) {
        const parsed = parseValidCount(match[1]);
        if (parsed !== null) found = parsed;
      }
    }
  );
  if (found !== null) return found;

  // Strategy 3: Normalized full-page text regex fallback
  const bodyText = $("body").text().replace(/\s+/g, " ").trim();
  const patterns = [
    /Vodn[íi]\s*z[oó]na\s*:?\s*(\d{1,4})/i,
    /Aktu[áa]ln[íi]\s*n[áa]v[šs]t[ěe]vnost[^0-9]{0,60}?Vodn[íi]\s*z[oó]na[^0-9]{0,20}?(\d{1,4})/i,
    /Baz[ée]n\s*[-–:]?\s*aktu[áa]ln[ěe]\s*:?\s*(\d{1,4})\s*(?:osob|n[áa]v[šs]t)/i,
  ];

  for (const pattern of patterns) {
    const match = bodyText.match(pattern);
    if (match) {
      const parsed = parseValidCount(match[1]);
      if (parsed !== null) return parsed;
    }
  }

  return null;
}

async function fetchViaProxy(
  proxyUrl: string,
  proxySecret?: string
): Promise<{ poolCount: number; sourceUrl: string } | null> {
  const headers: Record<string, string> = {
    ...BROWSER_HEADERS,
  };
  if (proxySecret) {
    headers["x-proxy-secret"] = proxySecret;
    headers["Authorization"] = `Bearer ${proxySecret}`;
  }

  const response = await fetch(proxyUrl, {
    cache: "no-store",
    headers,
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const json = (await response.json()) as {
      poolCount?: unknown;
      html?: unknown;
      sourceUrl?: unknown;
    };
    if (
      typeof json.poolCount === "number" &&
      Number.isInteger(json.poolCount) &&
      json.poolCount >= 0 &&
      json.poolCount <= 1000
    ) {
      return {
        poolCount: json.poolCount,
        sourceUrl:
          typeof json.sourceUrl === "string" ? json.sourceUrl : proxyUrl,
      };
    }
    if (typeof json.html === "string") {
      const parsed = extractNymburkPoolCount(json.html);
      if (parsed !== null) {
        return {
          poolCount: parsed,
          sourceUrl:
            typeof json.sourceUrl === "string" ? json.sourceUrl : proxyUrl,
        };
      }
    }
    throw new Error("Proxy JSON did not contain valid poolCount or html");
  }

  const html = await response.text();
  const parsed = extractNymburkPoolCount(html);
  if (parsed === null) {
    throw new Error("Proxy HTML parsed but pool count not found");
  }
  return { poolCount: parsed, sourceUrl: proxyUrl };
}

export async function scrapeNymburk(): Promise<ScrapedData> {
  const errors: string[] = [];
  const proxyUrl = process.env.NYMBURK_PROXY_URL?.trim();
  const proxySecret = process.env.NYMBURK_PROXY_SECRET?.trim();

  if (proxyUrl) {
    try {
      const proxied = await fetchViaProxy(proxyUrl, proxySecret);
      if (proxied) {
        return {
          poolId: "nymburk",
          poolCount: proxied.poolCount,
          sourceUrl: proxied.sourceUrl,
        };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`proxy -> ${message}`);
    }
  }

  for (const url of NYMBURK_URLS) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        headers: BROWSER_HEADERS,
        signal: AbortSignal.timeout(5500),
      });

      if (!response.ok) {
        errors.push(`${url} -> HTTP ${response.status}`);
        continue;
      }

      const html = await response.text();
      const poolCount = extractNymburkPoolCount(html);

      if (poolCount !== null) {
        return {
          poolId: "nymburk",
          poolCount,
          sourceUrl: url,
        };
      }

      errors.push(`${url} -> HTML parsed but pool count not found`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`${url} -> ${message}`);
    }
  }

  throw new Error(`Nymburk scraper failed: ${errors.join(" | ")}`);
}
