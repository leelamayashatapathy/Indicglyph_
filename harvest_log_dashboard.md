**Harvest Log Dashboard: Real-Time Scraping Oversight System**

---

### 🎯 Purpose
This dashboard isn’t decorative. It’s your mission control — tracking which domains are being scraped, what’s flowing in, what’s breaking, and what’s being flagged. It prevents chaos, rate-limit bans, and wasteful parallel fires.

---

### ✅ Assumption: Controlled Parallelism
You are NOT launching 100 scrapers at once. That’s how DDoS attacks and IP bans happen. Instead:
- Domains are grouped into **batches** (e.g. 5–10 active domains at a time)
- Active batch rotates hourly or based on queue thresholds
- Each domain respects:
  - Its own rate limit (e.g. 1–5 req/sec)
  - Crawl-delay if specified
  - Async request throttling with backoff

---

### 📊 Dashboard Core Sections

#### 1. **Domain Queue Overview**
- List of all 100 domains with status:
  - `IDLE`
  - `ACTIVE`
  - `PAUSED`
  - `FAILED`
  - `MANUAL CHECK NEEDED`
- Sortable by ingest count, error rate, ETA to completion

#### 2. **Scraper Health Stats**
Per domain:
- Requests per minute
- Avg response time
- Error codes (403, 429, 503 spikes)
- Retry counts
- Items successfully ingested vs failed

#### 3. **Ingestion Flow Chart**
Live count of:
- Products queued
- Product pages parsed
- Images discovered
- Images downloaded
- Valid images (post-filtered)

Can be filtered by domain, category, or batch

#### 4. **Flag Monitor (Anomaly Detection)**
Shows flagged images:
- NSFW
- Watermarked
- Too small or corrupted
- Detected duplicates

Used to redirect low-quality domains for manual review

#### 5. **Rate-Limiter Guardrail Display**
Each domain shows:
- Current delay between requests
- Cooldown mode if recent errors > threshold
- Proxy pool status (if used)

#### 6. **Ingestion Calendar**
Tracks what day/time each domain was last scraped
- Auto-pauses domains hit within last `X` days
- Helps plan re-crawls if needed later

#### 7. **Export Queue Tracker**
Final records waiting to be:
- Cleaned
- JSON serialized
- Handed off to enrichment/labeling layer

Shows backlogs, export speeds, and stuck items

---

### 📦 Data Sources
Populated from:
- Scraper logs
- Download success/failure queues
- Image validation layer
- Metadata JSON builder

---

### ⚠️ Alerts & Auto-Safety
- Any spike in 403/429 triggers a domain pause
- If a domain returns zero products for 5 mins → auto-check
- Domains with >10% flagged content → reroute for admin check
- Failed scraper module reloads tracked live

---

### 🧠 Optional Smart Ideas
- **“Top Domains Today”** by image count
- **“Image of the Hour”** preview tile (most recent valid ingest)
- **Scraper Agent Map** — which machine/container is scraping what

---

This dashboard isn't fluff — it’s your **governor**, **early warning system**, and **ROI auditor** all in one. If scraping is your refinery, this is the glass cockpit.

