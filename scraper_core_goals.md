**Scraper Core Goals: Precision Execution Over Verified Sources**

---

### ✅ Contextual Foundation
I already possess a curated list of 50 legally verified ecommerce sites (sourced via Agent AI). These sources:
- Permit scraping under public and commercial-use conditions
- Require no login or gated access
- Offer open visual content under their robots.txt and TOS constraints

Thus, the scraper’s job is not about exploration — it's about maximum ingestion at category scale. If the internet’s offering a buffet of product pixels, we’re showing up with forks and NAS drives.

---

### 🎯 Focused Scraper Objectives

#### 1. **Automate Site-Specific Crawling (Async & Aggressive)**
- Each of the 100 domains runs via a parallelized, rate-controlled scraper module
- Use asynchronous HTTP libraries (`aiohttp`, `httpx`, etc.)
- Traverse:
  - Category pages
  - Pagination logic
  - Product detail pages
  - Image/carousel endpoints
- Fail gracefully, retry smartly, log everything

#### 2. **Scrape Across All Known Categories**
- Maximize coverage across every available product category
- Category traversal config lives in a domain-specific scraper profile
- Scrapers attempt full exhaust of available items in:
  - Fashion
  - Furniture
  - Electronics
  - Grocery
  - Cosmetics
  - Any other exposed vertical

#### 3. **Capture Product Image Sets in Full**
- For each product:
  - Primary image
  - All alternates / angles / variants / zoomed views
  - If carousel or swatches exist, collect them all
- Use `product_id` or structured path to group images

#### 4. **Download and Normalize All Images**
- Store images in NAS or distributed object store
- Capture metadata:
  - File size, format, resolution, image hash
- Ensure every image is hashed and de-duped
- Discard thumbnails, retain max resolution versions

#### 5. **Trace Every Pixel**
- Maintain traceability for every image:
  - `source.url`
  - `source.platform`
  - `ingestion_timestamp`
  - License context (inferred from verified source rules)

#### 6. **Pre-Filter for Downstream Quality**
- Run fast, lightweight checks to:
  - Discard corrupted/broken images
  - Flag watermarked or bannered visuals
  - Tag white background, low-contrast images

#### 7. **Output JSON Records for Downstream Enrichment**
- Structure image data into JSON per schema
- Fields populated:
  - `image_id`, `source`, `file_name`, `file_format`, `flags`, `category`, `product_id`, etc.
- Stored and versioned for handoff to AI and human labeling

#### 8. **Rate-Limit, Log, and Audit**
- Respect crawl rates and ethical scraping practices
- Rotate user-agents/IPs as needed
- Maintain audit logs per domain, per run
- Detect TOS changes and auto-disable scrapers if needed

---

### 💡 Async by Design
- All scrapers run independently
- Workers download, tag, and process images as they arrive
- GPT is NOT used here — it joins only after structured metadata is ready
- Human reviewers process batches post-scrape → async and clean

---

### 🎁 Outcome
A fully loaded, legally compliant, maximally harvested image corpus — with:
- High category diversity
- Multi-angle visual sets
- Traceable provenance
- AI/human-ready metadata

And yes, if there’s a visual ocean out there... we’re bringing the fleet. 🐙

