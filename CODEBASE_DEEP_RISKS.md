# IndicGlyphAI Deep Risk Review

## Executive Summary
- Core data layer is a single JSONB table with in-process filtering and no transactional guarantees; correctness, performance, and observability all hinge on this brittle adapter.
- Critical business paths (review queue, payouts, analytics, ingestion) have logic mismatches and blocking calls that can double-assign work, underpay reviewers, or silently drop data.
- Async boundaries are routinely crossed incorrectly (sync calls to async DB, heavy CPU/IO work on the event loop), so failures will be silent and latency will spike under load.
- Frontend ships with debug scaffolding, garbled glyphs, and missing accessibility patterns; admin/review flows lack guardrails and rely on stale/incorrect backend stats.
- No automated tests or migrations; exports, listings, and analytics scan entire collections in memory—untenable as volumes grow.
- Operational posture is weak: permissive CORS, dev secrets, minimal logging/metrics, and background jobs without monitoring make incident response hard.
- Overall: workable for demos, but risky to own in production without shoring up data consistency, locking, and basic observability.

## Problem List by Category

### Architecture
General: Monolith is small but tightly coupled to a homegrown JSONB adapter; background jobs share the same process and block the event loop.

1. **Single-table JSONB with in-process filtering** — Where: `backend/app/db_adapter.py`. Severity: High. Complexity: High-level. Why it matters: All collections live in one table; `find`/`list_collection` load and filter in Python without pagination or query predicates, so every call scans the entire dataset and races on concurrent updates. Path forward: Introduce query predicates at the DB layer (SQL WHERE), add per-collection tables or at least keyed indexes, and wrap multi-step mutations in transactions; plan a migration path off the generic adapter.
2. **No transactional integrity for multi-write operations** — Where: `services/review_service.py`, `services/item_number_service.py`, `routes_operator.py` exports. Severity: High. Complexity: Medium. Why: Actions like claim+lock+update+log occur across multiple awaits without a transaction or optimistic locking, so double assignments and partial writes are possible. Path forward: Add database transactions/locking around queue pops, review writes, and counter increments; expose atomic “claim next” in the adapter instead of composing in Python.
3. **Background tasks block the main process** — Where: `routes_admin_audio.py` (ASR), `routes_admin_ocr.py` (OCR), `services/asr_service.py`, `services/ocr_service.py`. Severity: High. Complexity: Medium. Why: CPU/IO heavy OCR/ASR run synchronously on the event loop (or via `BackgroundTasks` calling `run_until_complete`), starving API latency and risking process crashes. Path forward: Push OCR/ASR into real background workers/queues; make route handlers enqueue jobs and return immediately; add timeouts and retries with persisted status.

### Data Model
General: Models are loosely defined; fields diverge between services and analytics; invariants are not enforced.

1. **Payout balance inconsistency** — Where: `services/payout_service.py`, `models/user_model.py`, `routes_users.py`. Severity: High. Complexity: Actionable & safe. Why: PayoutService reads/writes `user.balance` (nonexistent) while the rest of the app uses `payout_balance`; refunds and thresholds operate on the wrong field, causing silent under/overpayments. Path forward: Standardize on `payout_balance`, migrate existing documents, and add schema validation to reject unexpected fields.
2. **Analytics read wrong collections/fields** — Where: `routes_analytics.py`. Severity: Medium. Complexity: Actionable & safe. Why: Reviewer stats query `reviews` and `user.balance`, but logs live in `review_logs` and balances in `payout_balance`; dashboards will show zeros or garbage, hiding real performance. Path forward: Point analytics to the correct collections/fields; add unit tests to lock this down.
3. **Homepage and audit services misuse async DB** — Where: `services/homepage_service.py`, `services/audit_service.py`, `routes_homepage.py`. Severity: High. Complexity: Actionable & safe. Why: Async DB calls are invoked without `await`, so content/audit writes often never hit the database; routes are sync, hiding coroutine warnings. Path forward: Make services async, await DB operations, and add error handling/logging; optionally move homepage content to a static file/cache if immutability is acceptable.
4. **Queue/job state lacks invariants** — Where: `models/dataset_item_model.py`, `models/ocr_job_model.py`, `models/audio_job_model.py`. Severity: Medium. Complexity: Medium. Why: Status fields are free-form strings with no guards; locks are just timestamps; job retries overwrite results without history. Path forward: Use enums, enforce allowed transitions, and persist lock ownership/lease semantics.

### Reliability
General: Minimal error handling and no retries; race conditions in queues, exports, and ingestion.

1. **Locking is best-effort and racy** — Where: `services/queue_service.py`, `routes_datasets.py`. Severity: High. Complexity: Medium. Why: `get_next_item` scans all items in memory, then updates in a separate call; concurrent callers can claim the same item, and stale locks are unlocked without verifying status. Path forward: Add atomic “claim if unlocked” update with compare-and-set semantics, backed by DB-level locking or a queue table.
2. **Bulk uploads and exports lack input limits and fail atomically** — Where: `routes_admin_items.py`, `routes_operator.py@export_dataset_items`. Severity: Medium. Complexity: Actionable & safe. Why: ZIP/CSV/JSONL fully loaded to memory; partial inserts proceed after parse errors; exports stream large datasets by building full strings. Path forward: Stream parse with row caps, validate required fields early, wrap bulk inserts in transactions, and use server-side cursors/streaming responses.
3. **Blocking IO in async routes** — Where: `routes_admin_audio.py` transcribe, `routes_admin_ocr.py` background wrapper. Severity: Medium. Complexity: Medium. Why: CPU-heavy OCR/ASR and file operations block the event loop, causing head-of-line blocking for all requests. Path forward: Move to worker pool/queue; mark endpoints as fire-and-forget and poll status via DB.
4. **Missing idempotency/duplication checks** — Where: `routes_reviews.submit_review`, `routes_admin_*` upload endpoints. Severity: Medium. Complexity: Medium. Why: Replays can double-charge payout_balance or create duplicate items; no request IDs or dedupe keys. Path forward: Add idempotency tokens on writes and enforce unique constraints per dataset item/reviewer pair and per upload batch.

### Performance
General: Everything is in-memory scans over JSONB; no pagination boundaries in many places.

1. **Collection scans for core dashboards** — Where: `routes_operator.list_dataset_items`, `routes_analytics`, `services/queue_service`, `services/review_service`. Severity: High. Complexity: Medium. Why: Every list, export, or queue claim loads all items/logs into Python, which will fail with modest data volumes. Path forward: Push filtering/sorting/pagination into SQL (LIMIT/OFFSET/ORDER BY, JSONB indexes), and add hard limits on page sizes.
2. **Large responses and no response shaping** — Where: `routes_operator.export_dataset_items`, `routes_admin_audio/ocr` job detail. Severity: Medium. Complexity: Actionable & safe. Why: Full content blocks and transcripts are returned without size limits; exports have no streaming back-pressure. Path forward: Add projection fields, max payload sizes, and chunked streaming; paginate job results.

### UX/A11y
General: Debug UI left in production; inconsistent icons/text; modals lack accessibility primitives.

1. **Debug noise and broken glyphs in navigation and review** — Where: `frontend/src/App.jsx`, `frontend/src/pages/ReviewPage.jsx`. Severity: Medium. Complexity: Actionable & safe. Why: Console spam, garbled Unicode icons, and inline styles leak to users; undermines trust and distracts from tasks. Path forward: Remove debug logging, replace placeholder glyphs with accessible icons, centralize theming in CSS variables.
2. **Modals and interactive controls lack accessibility** — Where: `ReviewPage.jsx` skip/flag modals, keyboard shortcuts. Severity: Medium. Complexity: Actionable & safe. Why: No focus trap, no ARIA labels/roles, and shortcuts aren’t announced; screen-reader and keyboard users will struggle. Path forward: Add ARIA roles/labels, focus management, and visible focus states; ensure buttons have descriptive text.
3. **Admin console lacks consistent loading/error patterns** — Where: `frontend/src/pages/AdminPanel.jsx` children, `useAuth.jsx`. Severity: Low. Complexity: Actionable & safe. Why: Token/profile failures just log to console and clear storage; nested pages assume data presence, leading to blank screens. Path forward: Add global error boundary UX, skeleton/loading states, and retry/sign-out flows on 401.

### Testing
General: No automated tests or fixtures.

1. **Zero test coverage on critical flows** — Where: whole repo. Severity: High. Complexity: Medium. Why: Review queue, payouts, ingestion, and exports can regress silently; async/sync bugs would be caught with minimal tests. Path forward: Add unit tests for queue claiming, payout calculations, analytics aggregation, and API contract tests with seeded data.

### Ops/Observability
General: Logging and metrics are minimal; security defaults are permissive.

1. **Permissive security defaults** — Where: `backend/app/config.py`. Severity: Medium. Complexity: Actionable & safe. Why: CORS allows `*` and SECRET_KEY defaults to a dev value; JWTs are long-lived; no rate limiting. Path forward: Lock down allowed origins per env, require SECRET_KEY, add rate limiting and audit on auth endpoints.
2. **No structured logging or job monitoring** — Where: backend generally; ingestion routes. Severity: Medium. Complexity: Medium. Why: Failures in OCR/ASR/uploads are only surfaced via HTTP exceptions; no metrics, traces, or audit of background tasks. Path forward: Add structured logs with request/job IDs, expose health/queue stats, and create admin views for job history with error reasons.

### Docs/DevEx
General: CODEBASE_MAP is helpful, but setup/ops expectations and schema evolution are undocumented.

1. **No migrations or data model reference** — Where: repository lacks migrations folder; `db_adapter.py` auto-creates schema. Severity: Medium. Complexity: Medium. Why: Schema drift and production data changes are unmanaged; onboarding requires reverse-engineering JSON shapes. Path forward: Add migration tooling (even Alembic lite) and a living schema document for collections and invariants.
2. **Missing operational runbooks** — Where: repo root; no docs for OCR/ASR prerequisites. Severity: Low. Complexity: Actionable & safe. Why: Operators won’t know how to provision Tesseract/ffmpeg, manage uploads, or monitor queues. Path forward: Add setup guides per environment, including optional dependencies and sample .env with required secrets.

## Systemic Patterns & Hidden Traps
- In-process filtering on JSONB collections (`db_adapter.find`) everywhere; any data growth will degrade all endpoints and make locks unreliable.
- Async/sync mismatches (calling async DB without await, blocking CPU in async routes) leading to silent data loss and head-of-line blocking.
- Divergent field names across services (`balance` vs `payout_balance`, `reviews` vs `review_logs`), so dashboards and payouts can silently desync.
- Background jobs are executed in the web process without isolation; failures can cascade to user traffic.
- Debug/placeholder UI assets remain in production code, making it easy to leak internal state to users.

## Recommended Next Steps
- Make DB operations atomic: implement transactional “claim next item” and payout adjustments; add unique constraints on reviewer/item pairs and dataset counters.
- Fix data model inconsistencies: migrate users to `payout_balance`, point analytics at `review_logs`, and enforce enum-based statuses.
- Separate ingestion from the web app: queue OCR/ASR work to a worker (Celery/RQ/Arq) and poll via job status endpoints; add job timeouts and retries.
- Replace in-Python scans with DB queries: add indexed filters for language/status/finalized, enforce pagination, and cap export sizes.
- Clean up async usage: make homepage/audit services async, await DB calls, and wrap background tasks with logging and error propagation.
- Harden security defaults: require a non-default SECRET_KEY, restrict CORS to known origins, and add rate limiting on auth and upload endpoints.
- Stabilize the frontend: remove debug logs/glyphs, add ARIA/focus handling for modals, and implement 401 handling and loading states across admin pages.
- Add a minimal test suite: unit tests for queue claiming, payout math, analytics aggregation; API contract tests for auth/review flows; fixture data for CI.
- Document operational requirements: OCR/ASR dependencies, upload storage expectations, environment variables, and a schema/invariant reference.
