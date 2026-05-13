# Google Maps Business Scraper

A prospecting tool that searches for local businesses using the Google Places API and exports results to CSV and JSON. The main goal is to find businesses **with no web presence or a weak one** (social media only) to offer them web design or digital marketing services.

---

## What it does

- Searches businesses by sector and city (e.g. "dentistas en Vigo")
- Extracts: name, phone, website, rating, review count, and Google Maps link
- Automatically classifies each business's web presence: `no_website`, `Instagram only`, `Facebook only`, `Booksy`, or `own_website`
- Exports results to `output/` in CSV format (for Notion) and JSON (for AI processing)

---

## Requirements

- Node.js v18 or higher
- A Google Places API (New) key

---

## Setup

**1. Clone or download the project**

**2. Create a `.env` file** in the project root (same level as `index.js`):

```
GOOGLE_PLACES_API_KEY=your_key_here
```

**3. No dependencies to install** — the project uses only native Node.js modules (`fs`, `path`, `readline`, `fetch`).

---

## How to get the API key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Search for and enable **Places API (New)**
4. Go to **APIs & Services → Credentials → + Create Credentials → API Key**
5. Copy the key and paste it into your `.env`

> Google gives $200/month in free credit. Each search costs ~$0.032, so the tool is free for normal use.
> For extra safety, create a $0 budget under **Billing → Budgets & alerts** with the billing-stop option enabled.

---

## Usage

Run from the terminal inside the project folder:

```bash
node index.js
```

The script will prompt:

```
=== Scraper de Negocios Locales ===

¿Qué tipo de negocio buscas? (ej: dentistas, gimnasios): peluquerías
¿En qué ciudad?                                          Santiago de Compostela
```

When done, two files are created in `output/`:

```
output/
├── peluquerias_en_santiago_de_compostela_2026-03-31.csv
└── peluquerias_en_santiago_de_compostela_2026-03-31.json
```

---

## Output files

| File   | Purpose |
|--------|---------|
| `.csv` | Import directly into Notion as a table |
| `.json`| Paste into Claude or other AI tools for filtering and prioritization |

### Recommended AI workflow

1. Run the script and get the `.json`
2. Open the file, copy its contents
3. Paste into a new Claude chat with a prompt like:

```
Here is a list of businesses in JSON format.
Filter out those without a website, sort by rating,
and add a "priority" field (high/medium/low) based on these criteria:
- High: no website, more than 10 reviews, rating > 4
- Medium: no website, fewer than 10 reviews
- Low: has a website
```

---

## Project structure

```
google-maps-scrapper/
├── src/
│   ├── api/
│   │   └── placesClient.js     → calls Google Places API and handles pagination
│   ├── parser/
│   │   └── placesParser.js     → transforms raw API data into clean objects
│   ├── exporter/
│   │   ├── csvExporter.js      → generates the Notion-compatible CSV file
│   │   └── jsonExporter.js     → generates the JSON file
│   └── utils/
│       ├── env.js              → reads the .env file without external dependencies
│       └── fileHelper.js       → shared file-name and output-folder utilities
├── output/                     → generated files (not committed to GitHub)
├── business_filter.py          → optional Python script to filter leads by web presence
├── .env                        → your API key (not committed to GitHub)
├── .env.example                → .env template
├── .gitignore
└── index.js                    → entry point, orchestrates the full flow
```

---

## How it works internally

### `index.js` — Orchestrator

Reads environment variables, prompts the user for business type and city via `readline`, then calls the modules in this order:

```
loadEnv() → searchBusinesses() → parseResults() → exportCSV() + exportJSON()
```

Contains no business logic — it only connects the modules and prints the summary to the console.

---

### `src/utils/env.js` — `.env` loader

A manual implementation of the env variable loader, without using the `dotenv` package. Reads the `.env` file line by line, ignores comments (`#`) and empty lines, and assigns each `KEY=value` to `process.env`.

**Important behavior:** if a variable is already defined in the system environment, it is **not overwritten**. This allows the script to run in CI or with externally injected variables without issues.

---

### `src/api/placesClient.js` — Google Places API client

Uses the **Text Search** endpoint from Places API (New):
```
POST https://places.googleapis.com/v1/places:searchText
```

**Field Mask:** only requests the necessary fields to reduce cost and response time:
- `places.name` (internal Google place ID — used for deduplication)
- `places.displayName` (visible business name)
- `places.websiteUri`, `places.nationalPhoneNumber`
- `places.rating`, `places.userRatingCount`
- `places.googleMapsUri`
- `nextPageToken` (for pagination)

**Pagination:** Google returns a maximum of 20 results per page and up to 3 pages (60 results max per search). The client automatically fetches all pages using the `nextPageToken` from each response. It waits 1.5 seconds between pages to avoid rate-limiting.

**Deduplication:** although rare, the API can return the same place on different pages. The client removes duplicates using `places.name` (the API's unique identifier, in the format `places/ChIJ...`).

**Timeout:** each request has a 10-second timeout via `AbortController`. If the API doesn't respond in time, a clear error is thrown instead of hanging indefinitely.

---

### `src/parser/placesParser.js` — Data transformer

Converts each raw API object into a clean, normalized business object with this structure:

```json
{
  "name":         "Peluquería Ana",
  "rating":       4.5,
  "reviewCount":  87,
  "phone":        "+34 981 00 00 00",
  "websiteUrl":   "https://instagram.com/peluqueriaana",
  "googleMapsUrl":"https://maps.google.com/?cid=...",
  "webPresence":  "Instagram only"
}
```

**`webPresence` field:** classifies the business's website by its URL:

| Value | Condition |
|-------|-----------|
| `no_website` | No URL present |
| `Instagram only` | URL contains `instagram.com` |
| `Facebook only` | URL contains `facebook.com` |
| `Booksy` | URL contains `booksy.com` |
| `own_website` | Any other URL |

This field is the key to the prospecting flow: it lets you quickly filter businesses with the most potential (those without their own website).

---

### `src/exporter/csvExporter.js` — CSV exporter

Generates the CSV manually (no external libraries). Correctly escapes values that contain commas, quotes, or newlines by wrapping them in double quotes.

**UTF-8 BOM:** the file is written with a BOM (`﻿`) at the start. This is required for Excel on Windows and Notion to correctly interpret special characters (accents, ñ, etc.) on import.

CSV columns:
```
name, rating, reviewCount, phone, websiteUrl, googleMapsUrl, webPresence
```

---

### `src/exporter/jsonExporter.js` — JSON exporter

Saves the business array as JSON with 2-space indentation (`JSON.stringify(businesses, null, 2)`). This format is designed to be pasted directly into a Claude conversation or other AI tools.

---

### `src/utils/fileHelper.js` — Shared file utilities

Contains two helpers used by both exporters:
- `buildBaseFileName(query)` — converts the search query into a normalized file name with a date suffix
- `ensureOutputFolder()` — creates the `output/` folder if it doesn't exist yet

---

### `business_filter.py` — Optional Python filter

A standalone CLI script that filters a JSON output file to keep only businesses that do **not** have their own website (i.e. `webPresence !== "own_website"`).

```bash
python business_filter.py input.json output_filtered.json
```

---

## Generated file names

Both exporters name files the same way:

1. The query is lowercased
2. Accents and special characters are removed
3. Spaces and non-alphanumeric characters are replaced with `_`
4. Today's date is appended in `YYYY-MM-DD` format

Example: `"peluquerías en Santiago de Compostela"` → `peluquerias_en_santiago_de_compostela_2026-04-04.csv`

**If you repeat the same search on the same day, the file is overwritten.** Different searches or different days generate new files without deleting the previous ones.

---

## Known limitations

- **Maximum 60 results per search** — Google Places API limit (3 pages × 20 results).
- **No geographic radius filter** — the search is free-text; Google decides what area it covers. For large cities it may return results from specific neighborhoods instead of the whole city.
- **`webPresence` covers the most common cases** (Instagram, Facebook, Booksy) but not every possible social media profile (Twitter/X, TikTok, LinkedIn, etc.).
- **No automatic retries** — if the API fails mid-pagination, the script exits with an error.
