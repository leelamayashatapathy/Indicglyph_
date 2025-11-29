# Admin UI – Schema Builder (Replit DB Edition)

## Purpose
Let Admins define dataset types without touching code. Persist schemas in `dataset_types` using `db_adapter` helpers.

## Admin Endpoints
- `POST /api/admin/dataset-type` – create (ensure unique `name`).
- `GET /api/admin/dataset-type` – list.
- `PUT /api/admin/dataset-type/{id}` – update fields/languages/active.
- `PUT /api/admin/system-config` – payout + thresholds.

## Preview
- Frontend uses the same `DynamicField` components as the reviewer UI to render a live preview from the draft schema.

## Safety
- Prevent deletion if items exist; use `active=false` instead.
- Validate `fields[].key` uniqueness.
