/**
 * Minimal Cloudflare Worker relay for fetching Nymburk occupancy HTML
 * outside AWS IP ranges (since mesto-nymburk.cz drops AWS/US connections).
 *
 * Deploy to Cloudflare Workers (Free tier), optionally set secret `PROXY_SECRET`,
 * and set `NYMBURK_PROXY_URL` (+ optional `NYMBURK_PROXY_SECRET`) on Vercel.
 */

const ALLOWED_TARGETS = new Set([
  "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp",
  "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/",
  "https://www.relaxacnicentrumlabe.cz/",
]);

const DEFAULT_TARGET =
  "https://www.mesto-nymburk.cz/relaxacni-centrum-labe/index.asp";

const worker = {
  async fetch(request, env) {
    if (env.PROXY_SECRET) {
      const auth = request.headers.get("authorization");
      const secretHeader = request.headers.get("x-proxy-secret");
      if (
        auth !== `Bearer ${env.PROXY_SECRET}` &&
        secretHeader !== env.PROXY_SECRET
      ) {
        return new Response("Unauthorized", { status: 401 });
      }
    }

    const reqUrl = new URL(request.url);
    const requestedTarget = reqUrl.searchParams.get("url");
    const target =
      requestedTarget && ALLOWED_TARGETS.has(requestedTarget)
        ? requestedTarget
        : DEFAULT_TARGET;

    const upstream = await fetch(target, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "cs-CZ,cs;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
    });

    const html = await upstream.text();
    return new Response(html, {
      status: upstream.status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  },
};

export default worker;
