# OCR & Ingestion – Replit DB Edition

## Flow
1) Upload PDF/image → store raw file reference (`raw_uploads`).
2) AI extract (optional) or manual slicing via canvas.
3) Each slice → `dataset_items` with `language`, `content`, `bbox`, `confidence`.
4) Track job in `ocr_jobs` with status and counts.

## Endpoints
- `POST /api/ocr/upload` (roles: uploader|admin|superadmin).
- `POST /api/ocr/manual-slice` → append slice as dataset item.
- `GET /api/ocr/jobs`, `/api/ocr/jobs/{id}` → status/progress.

## Storage
- Use `insert/update` to persist `ocr_jobs`, `raw_uploads`, and resulting `dataset_items`.
- Keep files in Replit storage or external object store if large.

## Notes
- Language detection: pass through OCR API or via manual admin choice.
- Confidence is optional; reviewers will correct errors anyway.
