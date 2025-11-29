# Backend Specification – FastAPI + Replit DB (Adapter)

## Purpose
Provide auth (JWT), roles, dataset types, review queue, payouts, and OCR ingestion using Replit DB for storage.

## Stack
- FastAPI, Uvicorn
- Replit DB (`replit` pkg)
- Pydantic, python‑jose, passlib[bcrypt], httpx
- CORS middleware for frontend dev

## Folder Layout
```
backend/app/
  main.py
  config.py
  db_adapter.py         # <- storage abstraction (Replit DB)
  auth/ { jwt_handler.py, password_utils.py }
  utils/ { role_checker.py }
  models/ { user_model.py, dataset_type_model.py, dataset_item_model.py, review_log_model.py, payout_model.py }
  routes/ { routes_auth.py, routes_users.py, routes_admin.py, routes_datasets.py, routes_reviews.py, routes_ocr.py }
  services/ { payout_service.py, queue_service.py, review_service.py, ocr_service.py }
```

## Config
- Secrets: `JWT_SECRET` (required), `OCR_API_KEY` (optional).
- `config.py` reads via `decouple` then `os.getenv` fallback.

## Replit DB Adapter
- `db_adapter.py` exposes: `insert`, `get`, `update`, `delete`, `find`, `find_one`, `inc`, `upsert`, `list_collection`.
- Keys are namespaced: `curation:<collection>:<id>`.
- Queries are **predicate functions** evaluated in Python (scan). Keep datasets small for MVP.

## Auth & Roles
- Register/Login with bcrypt, JWT (HS256). JWT payload includes `user_id`, `roles[]`.
- `require_roles([...])` dependency validates access for admin routes.

## Routes (high level)
- `/api/auth/*`: register, login.
- `/api/users/me`: current user profile.
- `/api/admin/system-config`: GET/PUT config (`payout_rate_default`, `skip_threshold_default`, `lock_timeout_sec`).
- `/api/admin/dataset-type`: CRUD dataset types.
- `/api/datasets/next`: fetch next item filtered by language(s), with simple lock.
- `/api/review/submit`: approve/edit/skip + payout increment.

## Health Endpoint
`GET /health` → `{ "status": "ok", "storage": "replit-db" }`.

## Notes
- Avoid heavy aggregations; compute simple analytics in Python or on the frontend.
- When migrating to Mongo, swap `db_adapter.py` calls with driver ops; routes/services stay intact.
