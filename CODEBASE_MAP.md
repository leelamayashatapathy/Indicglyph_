# Codebase Map – IndicGlyphAI / IndicGlyph Studio

## 1. What this project is
- A web platform for reviewing and curating multi-modal data (text, OCR documents, audio transcripts). Reviewers earn payouts for approving or editing items; operators manage datasets, ingestion jobs, payouts, and homepage content.
- Personas: reviewers (complete review tasks), platform operators/super-operators (configure schemas, ingest files, manage users/payouts/analytics), and anonymous visitors (see landing page content).

## 2. High-level architecture
- Monolith split into `backend/` (FastAPI) and `frontend/` (React + Vite). The backend serves the SPA build in production and exposes JSON APIs under `/api`.
- Data flows: browser SPA → `frontend/src/services/api.js` fetch helpers → FastAPI routers → a PostgreSQL-backed JSONB adapter (`backend/app/db_adapter.py`) that stores all collections in one `documents` table. Uploads land in `backend/uploads` (or MinIO/S3 via env), optional OCR/ASR processing turns files into dataset items for review.
- Background-ish work runs inside the API process via `run_in_executor` helpers; there is no separate worker service yet.

## 3. Backend layout
- Entrypoint: `backend/app/main.py` wires CORS, mounts routers, and serves the built frontend if `frontend/dist` exists.
- Config: `backend/app/config.py` reads env for host/port, JWT expiry, CORS origins, `DATABASE_URL`, payout defaults, and enforces non-dev secrets.
- Storage: `backend/app/db_adapter.py` wraps an async SQLAlchemy engine, creates a single `documents` table, and offers Mongo-like helpers plus a SQL-based `claim_next_dataset_item` for queue locking.
- Auth: `backend/app/auth` (JWT creation/validation, bcrypt hashing). Common dependency `get_current_user` lives in `routes/routes_auth.py`.
- Routes: all under `backend/app/routes/` (auth, users, datasets/reviews/queue, operator console, analytics/dashboard, homepage CMS, OCR, audio, bulk item uploads). Admin/OCR/Audio modules also expose worker helpers (`run_ocr_job_worker`, `run_audio_job_worker`).
- Services: `backend/app/services/` hold business logic (review queue/review handling, payout adjustments, OCR/ASR drivers, homepage content persistence, audit logging, per-dataset counters).
- Models/schemas: `backend/app/models/` define Pydantic models and status enums for users, dataset types/items, review logs, payouts, OCR/audio jobs, and homepage content.
- Utils: `backend/app/utils/file_storage.py` handles file paths/validation; `role_checker.py` centralizes role checks; background file uploads use `backend/uploads/`.
- Scripts: `backend/seed_data.py`, `seed_super_operator.py`, `cleanup_data.py`, `migrate_roles.py` for local setup and maintenance.

## 4. Data model & storage
- Storage shape: all documents live in one PostgreSQL table with `collection_name`, `doc_id`, and JSONB `data`. There are no migrations; the adapter auto-creates the table/indexes at runtime.
- Main collections: `user` (profiles, roles, payout_balance), `dataset_types` (schema per dataset/modalities/languages/payout rate), `dataset_items` (content, modality, language, review_state with status/locks/reviewed_by/skip counters), `review_logs` (approve/edit/skip with payout amounts), `payouts`, `system_config` (payout/lock thresholds, language list), `counters` (per-dataset item numbers), `ocr_jobs` + `ocr_results`, `audio_jobs` + `audio_transcripts`, `homepage_content`, plus audit logs and flags embedded on items.
- Key relationships: dataset items reference a dataset type; review logs reference items/reviewers; payout records reference users; OCR/Audio jobs capture uploader and file paths, and slicing endpoints turn results into new dataset items.
- Locking/queueing: `review_state` holds `status`, `lock_owner`, `lock_time`, `reviewed_by`; `claim_next_dataset_item` marks an item `in_review` if not finalized or if a lock is stale.

## 5. Frontend layout
- App shell: `frontend/src/App.jsx` defines routes with `ProtectedRoute`/`AdminRoute` and shared nav/footer. `main.jsx` mounts providers.
- Pages (`frontend/src/pages/`): reviewer flows (`ReviewPage`, `ReviewerDashboardPage`, `ProfilePage`), auth (`LoginPage`, `RegisterPage`), admin console (`AdminPanel` with nested pages for dataset types/items, bulk uploads, users, system config, payouts, analytics, flagged items, OCR/audio ingestion, homepage setup, overview), public landing (`LandingPage`).
- Components (`frontend/src/components/`): UI primitives (Modal, ConfirmDialog, StatusBadge, Toast, ErrorBoundary/Banner, LoadingSkeleton, SessionMessage, ThemeToggle, ProtectedRoute).
- Hooks: `useAuth` handles token storage/profile fetch and redirects; `useTheme` toggles theme; other simple hooks manage UI state.
- API client: `frontend/src/services/api.js` centralizes fetch calls to backend endpoints, including file upload/export helpers.
- Styles: global styles in `index.css` and admin-specific CSS in `styles/AdminPanel.css`.
- Tests: a few component tests under `frontend/src/__tests__/` (e.g., Modal, ThemeToggle, StatusBadge, ErrorBanner); no configured test runner in `package.json`.

## 6. Background jobs & long-running work
- OCR flow: `/api/operator/ocr/upload` stores a PDF/image, creates an `ocr_jobs` record, and expects a worker (helper `run_ocr_job_worker`) to call `ocr_service` (Tesseract if installed, otherwise mock) and write `ocr_results`. Operators can retry/cancel, and `/slice` turns results into dataset items.
- Audio transcription: `/api/operator/audio/upload` creates an `audio_jobs` record; `run_audio_job_worker` calls `ASRService` (faster-whisper via `ffprobe`/`run_in_executor` or a “none” provider) to emit `audio_transcripts`, then `/slice` wraps transcript into dataset items. Jobs support cancel/delete/retry.
- Review queue: `QueueService.get_next_item` uses `claim_next_dataset_item` to atomically lock an eligible item; `ReviewService.submit_review` updates item status/payouts/logs inside a DB transaction.
- Exports/imports: `/operator/export` streams CSV/JSONL; `/operator/items/bulk-upload-zip` and `/operator/ocr/bulk-upload` ingest ZIP/JSONL/CSV payloads into dataset items.

## 7. Testing & quality checks
- Backend tests: only `backend/tests/test_analytics.py` covering analytics aggregation helpers (`compute_reviewer_stats_from_data`, `compute_dataset_analytics_from_data`); no automated coverage for auth/review/queue/payout flows.
- Frontend tests: a handful of UI unit tests exist but no npm test script or runner config; likely require adding Vitest/Jest to execute.
- Linting/typing: no lint/type tooling configured (no ruff/flake8/mypy/eslint). Manual logging is sparse; no CI config present.

## 8. Configuration & deployment
- Environment: `.env.example` lists DB credentials, MinIO creds, `SECRET_KEY`, `DATABASE_URL`, super-operator bootstrap credentials. Backend config enforces non-empty `SECRET_KEY` and explicit CORS origins outside `dev`.
- Docker: `docker-compose.yml` brings up Postgres 15, MinIO, backend (Uvicorn) and frontend (Vite dev server). Backend `Dockerfile` installs Python deps and runs `uvicorn backend.app.main:app`; frontend `Dockerfile` uses `npm run dev`.
- Local storage: uploads saved under `backend/uploads/` (volume-mounted in compose); MinIO is available but code largely reads local paths.
- No migrations: the adapter auto-creates the `documents` table; schema evolution relies on code paths and seed scripts (`backend/seed_data.py`, `seed_super_operator.py`).
- Approximate bring-up: set env vars (.env), start Postgres/MinIO, run FastAPI app, run Vite frontend (or rely on backend to serve `frontend/dist` in production), optionally execute seed scripts to create sample data and admin user.

## 9. Known tricky areas / things to be careful about
- Single-table JSONB adapter: most queries still load/filter in Python; pagination and filtering are uneven, making performance and locking fragile as data grows.
- Transactional gaps: multi-step mutations (queue claiming outside `claim_next_dataset_item`, payouts) can race; some services mix async/sync usage.
- Background work shares the web process: OCR/ASR and file I/O can block the event loop; no dedicated worker or monitoring.
- Data inconsistencies: legacy fields (`balance` vs `payout_balance`), duplicated operator routes (`routes_operator` vs `routes_admin`), analytics historically read wrong collections; beware of drift.
- Input size and memory: bulk uploads/exports and analytics endpoints can scan entire collections; limited caps (`EXPORT_ROW_LIMIT`) but still memory-heavy.
- Frontend reliability: debug glyphs/logging remain; auth/profile failures clear tokens without graceful recovery; admin pages assume data presence.

## 10. Next steps / ideas
- Introduce real schema/migrations (per-collection tables or typed JSONB) and push filtering/pagination into SQL across listings, exports, analytics, and queue operations.
- Split background workers from the API (e.g., task queue for OCR/ASR), add status polling and monitoring, and move heavy work off the event loop.
- Standardize data fields (payout_balance, review logs, status enums), deduplicate operator routes, and add validation around status transitions and locks.
- Add automated tests: auth/queue/payout happy paths and race cases, analytics correctness, ingestion slicing, and frontend auth/admin flows; wire a test runner for the React tests.
- Harden security/ops: require non-default secrets/CORS, rate-limit auth/upload endpoints, add structured logging/metrics, and document storage expectations (MinIO vs local).
