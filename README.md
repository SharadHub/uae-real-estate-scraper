# 🏠 PropertyFinder Scraper

A high-performance, production-ready web scraper for [PropertyFinder.ae](https://www.propertyfinder.ae) built with **TypeScript** and [Crawlee](https://crawlee.dev). It systematically crawls property listings filtered by type, bedroom count, bathroom count, and price range — then extracts rich detail data including descriptions, amenities, images, and pricing.

---

## 📋 Table of Contents

- [About the Project](#-about-the-project)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
  - [Clone the Repository](#1-clone-the-repository)
  - [Install Dependencies](#2-install-dependencies)
  - [Run the Scraper](#3-run-the-scraper)
- [Configuration](#-configuration)
- [Output & Data Schema](#-output--data-schema)
- [Docker Support](#-docker-support)
- [Anti-Detection Strategy](#-anti-detection-strategy)
- [Error Handling & Resilience](#-error-handling--resilience)
- [License](#-license)

---

## 📖 About the Project

This scraper targets the UAE real estate portal **PropertyFinder.ae**, one of the largest property listing platforms in the Middle East. It navigates paginated search result pages across hundreds of filter combinations (property type × bedrooms × bathrooms × price band), discovers individual property detail pages, and saves structured records to Crawlee's built-in dataset storage.

The crawler uses `CheerioCrawler` — a fast, server-side HTML parser — instead of a full browser, making it significantly more efficient while still reliably handling modern server-rendered markup.

---

## ✨ Features

- 🔍 **Systematic URL generation** — combinatorially generates search URLs across 13 property types, 9 bedroom options, 9 bathroom options, and 5 price bands
- 📄 **Paginated list crawling** — follows next-page links up to a configurable max-page limit (default: 50)
- 🏡 **Rich detail extraction** — scrapes price, location, beds, baths, area, description, amenities, images, and upfront cost flags from each listing
- 🖼️ **Image extraction** — parses embedded `__NEXT_DATA__` JSON to retrieve full-resolution property images
- 🤖 **Anti-detection** — random user-agent rotation and 3–7 second delays between requests to mimic human browsing patterns
- 🔁 **Auto-retry** — up to 3 retries per failed request with a 30-second handler timeout
- 💾 **Failed URL persistence** — permanently failed URLs are buffered and flushed to `failed_urls.json` for later inspection or reprocessing
- 🐳 **Docker-ready** — multi-stage Dockerfile for clean, minimal production images

---

## 🗂️ Project Structure

```
property-finder/
├── src/
│   ├── main.ts               # Entry point — generates URLs & runs the crawler
│   ├── config.ts             # Global constants (BASE_URL, MAX_PAGES)
│   ├── urls.ts               # URL generator for all filter combinations
│   ├── crawler.ts            # CheerioCrawler setup, middleware & routing
│   └── handlers/
│       ├── list.ts           # Parses listing pages and discovers detail links
│       └── detail.ts         # Extracts full property data from detail pages
├── storage/                  # Crawlee runtime storage (auto-generated, git-ignored)
│   ├── datasets/             # Scraped output records (JSON)
│   ├── key_value_stores/     # Crawler state & session data
│   └── request_queues/       # Pending & processed URL queue
├── Dockerfile                # Multi-stage Docker build
├── .dockerignore
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## ✅ Prerequisites

Ensure the following are installed on your system before proceeding:

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | `>= 18.x` | LTS recommended. [Download](https://nodejs.org/) |
| **npm** | `>= 9.x` | Bundled with Node.js |
| **TypeScript** | `~6.0.0` | Installed automatically as a dev dependency |
| **Docker** *(optional)* | Latest | Only needed for containerised runs |
| **Git** | Any | For cloning the repository |

> [!NOTE]
> The project uses ES Modules (`"type": "module"` in `package.json`). Node.js 18+ is required for full ESM compatibility.

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd real-estate-scraper/property-finder
```

### 2. Install Dependencies

```bash
npm install
```

This installs all production and development dependencies, including:

- [`crawlee`](https://crawlee.dev) — core web scraping framework
- [`@crawlee/impit-client`](https://www.npmjs.com/package/@crawlee/impit-client) — HTTP client integration
- [`playwright`](https://playwright.dev) — browser automation (available but not used in the current HTTP-based crawler)
- `typescript`, `tsx`, `@types/node` — TypeScript toolchain

### 3. Run the Scraper

**Development mode** (using `tsx` — no prior build step needed):

```bash
npm run dev
# or
npm start
```

**Production mode** (compile first, then run):

```bash
npm run build      # Compiles TypeScript → dist/
npm run start:prod # Runs the compiled output
```

> [!TIP]
> Use development mode during testing — `tsx` executes TypeScript directly without requiring a build step, making iteration much faster.

---

## ⚙️ Configuration

All global settings live in `src/config.ts`:

```typescript
export const BASE_URL = "https://www.propertyfinder.ae";
export const MAX_PAGES = 50;  // Maximum pages to crawl per search URL
```

Filter parameters are defined at the top of `src/urls.ts`:

| Constant | Description | Default Values |
|---|---|---|
| `PROPERTY_TYPES` | PropertyFinder property type IDs | 13 types (apartments, villas, plots, etc.) |
| `BEDROOMS` | Bedroom filter values | 0–8 |
| `BATHROOMS` | Bathroom filter values | 0–8 |
| `PRICE_RANGES` | Min/max price bands (AED) | 10k–30k, 30k–50k, 50k–70k, 70k–90k, 90k–110k |
| `MAX_PAGES` | Pagination depth limit | `50` (in `config.ts`) |

> [!IMPORTANT]
> Modify `PRICE_RANGES` in `src/urls.ts` if you need to target higher-value properties, as the defaults cover AED 10,000–110,000 only.

Crawler behaviour (concurrency, timeouts, retries) can be tuned inside `src/crawler.ts`:

```typescript
minConcurrency: 1,
maxConcurrency: 2,           // Keep low to avoid rate-limiting
maxRequestRetries: 3,
requestHandlerTimeoutSecs: 30,
navigationTimeoutSecs: 20,
```

---

## 📦 Output & Data Schema

Crawlee stores all scraped records in `storage/datasets/default/`. Each record is saved as a JSON object with the following schema:

```jsonc
{
  "url": "https://www.propertyfinder.ae/en/buy/...",   // Property detail page URL
  "location": "Dubai Marina, Dubai",                    // Location string
  "price": "AED 1,200,000",                             // Full price with currency
  "beds": "2",                                          // Number of bedrooms
  "baths": "2",                                         // Number of bathrooms
  "area": "1,050 sqft",                                 // Property area
  "images": [                                           // Array of full-resolution image URLs
    "https://images.propertyfinder.ae/..."
  ],
  "description": "Stunning 2BR apartment...",           // Full property description
  "amenities": ["Pool", "Gym", "Covered Parking"],      // List of amenity labels
  "hasUpfrontCost": false,                              // Whether upfront cost info is present
  "compareRentVsBuyUrl": null                           // Rent vs. buy comparison link (if available)
}
```

**Failed URLs** are logged to `failed_urls.json` in the project root for manual review or re-queuing.

---

## 🐳 Docker Support

The project ships with a multi-stage `Dockerfile` based on the official `apify/actor-node-playwright-chrome` image.

### Build the Docker Image

```bash
docker build -t propertyfinder-scraper .
```

### Run the Container

```bash
docker run --rm -v $(pwd)/storage:/home/myuser/storage propertyfinder-scraper
```

> [!NOTE]
> Mounting the `storage/` directory as a volume persists scraped data on your host machine even after the container exits.

The container entrypoint starts an XVFB virtual display (required for headful Playwright sessions if needed) and then runs the compiled production build:

```
./start_xvfb_and_run_cmd.sh && npm run start:prod
```

---

## 🛡️ Anti-Detection Strategy

The scraper implements several techniques to avoid bot-detection and rate-limiting:

| Technique | Implementation |
|---|---|
| **Random User-Agent** | Rotates between 4 realistic browser UA strings per request |
| **Request Delays** | 3–7 second randomised wait before each navigation |
| **Low Concurrency** | Max 2 concurrent requests to mimic natural browsing pace |
| **Browser-like Headers** | Sets `Accept`, `Accept-Language`, `Sec-Fetch-*`, and other standard headers |
| **Auto-Retry** | Retries failed requests up to 3 times before persisting as failed |

---

## 🔧 Error Handling & Resilience

- **Per-request retries** — Crawlee automatically retries each request up to `maxRequestRetries: 3` times on failure.
- **Failed URL buffer** — URLs that exhaust all retries are collected in an in-memory buffer and atomically flushed to `failed_urls.json` to prevent race conditions under concurrent writes.
- **Graceful fallbacks** — The detail handler falls back to list-page data (pre-scraped on the listing card) for fields like price, beds, baths, and area when the detail page fails to render those values.
- **Image parsing safety** — `__NEXT_DATA__` JSON parsing is wrapped in a try/catch; malformed or missing data returns an empty array rather than crashing the handler.

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](./LICENSE) file for details.

---

> **Disclaimer:** This tool is intended for personal research and educational purposes. Always review and comply with the target website's [Terms of Service](https://www.propertyfinder.ae/en/terms-and-conditions) and `robots.txt` before running any scraper.
