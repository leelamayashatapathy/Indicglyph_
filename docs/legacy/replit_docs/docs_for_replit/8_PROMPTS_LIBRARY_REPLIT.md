# Prompts Library – Replit DB Edition

## Global Context (paste at top of first message)
```
You are GPT‑5, senior engineer. Stack: FastAPI + Replit DB (adapter), React (Vite).
Repo layout: /backend/app/... /frontend/src/... /shared/... /docs/...
Rules: async FastAPI, Pydantic, JWT auth, role checks, minimal deps, no dead code.
Output: (A) file list (B) code blocks (C) checks (D) run cmds.
```

## A1‑R Backend Bootstrap (storage adapter)
```
Scaffold backend using Replit DB:
- backend/app/{ main.py, config.py, db_adapter.py }
- backend/app/auth/{ jwt_handler.py, password_utils.py }
- backend/app/utils/role_checker.py
- backend/app/models/{ user_model.py, dataset_type_model.py, dataset_item_model.py, review_log_model.py, payout_model.py }
- backend/app/routes/{ routes_auth.py, routes_users.py, routes_admin.py, routes_datasets.py, routes_reviews.py, routes_ocr.py }
- backend/app/services/{ payout_service.py, queue_service.py, review_service.py, ocr_service.py }
Add backend/requirements.txt. Ensure /health returns {status:"ok", storage:"replit-db"}. Install deps and run uvicorn.
```

## B (Auth & Roles)
```
Implement register/login with bcrypt + JWT (HS256). Add require_roles([...]) and guard /api/admin/*.
```

## C (System Config)
```
Create system_config doc with payout_rate_default, skip_threshold_default, lock_timeout_sec. GET/PUT endpoints.
```

## D (Review Engine)
```
/api/datasets/next?langs=en,hi → pick one eligible item, set status=in_review, lock_owner=user_id.
/api/review/submit { item_id, action:approve|edit|skip, changes? } → update review_state; finalize on skip>=5 or review_count>=3; increment payout.
```

## E (Admin Schema Builder)
```
CRUD dataset types; prevent hard deletes; provide preview endpoint.
```

## F (OCR Ingestion)
```
Upload endpoint saving raw file; AI/manual slicing to dataset_items; ocr_jobs status endpoints.
```

## G (Frontend)
```
Vite skeleton + routes; Axios with JWT interceptor; Login/Register; ReviewPage rendering schema fields; Admin dataset type builder.
```

## H (Polish)
```
Language switcher; optimistic UI; simple payout widget; basic analytics.
```
