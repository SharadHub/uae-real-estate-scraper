import { CheerioCrawler } from "crawlee";
import fs from "fs";
import path from "path";
import { proxyConfiguration } from "./config.js";
import { handleListPage } from "./handlers/list.js";
import { handleDetailPage } from "./handlers/detail.js";

// ── Helpers ────────────────────────────────────────────────────────────────

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

const randomUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Failed-URL persistence ─────────────────────────────────────────────────
// Write via an in-memory buffer + flush to avoid read-parse-write race
// conditions when maxConcurrency > 1 hits failures simultaneously.

const FAILED_URLS_PATH = path.resolve("failed_urls.json");
const failedUrlBuffer: string[] = [];
let flushScheduled = false;

function persistFailedUrl(url: string) {
  failedUrlBuffer.push(url);

  if (!flushScheduled) {
    flushScheduled = true;
    setImmediate(() => {
      let existing: string[] = [];
      if (fs.existsSync(FAILED_URLS_PATH)) {
        try {
          existing = JSON.parse(fs.readFileSync(FAILED_URLS_PATH, "utf-8"));
        } catch {
          existing = [];
        }
      }
      existing.push(...failedUrlBuffer);
      failedUrlBuffer.length = 0;
      flushScheduled = false;
      fs.writeFileSync(FAILED_URLS_PATH, JSON.stringify(existing, null, 2));
    });
  }
}

// ── Crawler ────────────────────────────────────────────────────────────────

export const crawler = new CheerioCrawler({
  proxyConfiguration,

  // Low concurrency to mimic human browsing pace and avoid rate-limits
  minConcurrency: 1,
  maxConcurrency: 2,

  maxRequestRetries: 3,
  requestHandlerTimeoutSecs: 30,
  navigationTimeoutSecs: 20,

  preNavigationHooks: [
    async (_ctx, options) => {
      // Random delay between 3–7 s before each request
      const randomWait = Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000;
      await delay(randomWait);

      options.headers = {
        ...options.headers,
        "User-Agent": randomUA(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
      };
    },
  ],

  async requestHandler(context) {
    if (context.request.label === "DETAIL") {
      await handleDetailPage(context);
    } else {
      await handleListPage(context);
    }
  },

  failedRequestHandler({ request, log }) {
    log.error(`Request ${request.url} failed permanently after 3 retries.`);
    persistFailedUrl(request.url);
  },
});