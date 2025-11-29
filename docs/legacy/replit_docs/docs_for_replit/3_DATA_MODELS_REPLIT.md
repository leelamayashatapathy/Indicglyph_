# Data Models – Replit DB Edition

> Document shapes are unchanged; only storage changes. Replit DB stores JSON strings under namespaced keys.

## Collections
- `users`, `dataset_types`, `dataset_items`, `review_logs`, `payouts`, `system_config`, `ocr_jobs`, `raw_uploads`.

## User
```json
{
  "_id": "uuid",
  "email": "string",
  "hashed_password": "string",
  "roles": ["reviewer"],
  "languages": ["en"],
  "payout_balance": 0.0,
  "reviews_done": 0
}
```

## DatasetType
```json
{
  "_id": "uuid",
  "name": "newspaper",
  "fields": [{ "key": "headline", "type": "text", "label": "Headline" }],
  "languages": ["en", "hi"],
  "payout_rate": 0.003,
  "active": true
}
```

## DatasetItem
```json
{
  "_id": "uuid",
  "dataset_type_id": "uuid",
  "language": "en",
  "content": { "headline": "Sample", "body": "..." },
  "review_state": {
    "status": "pending",
    "review_count": 0,
    "skip_count": 0,
    "finalized": false,
    "reviewed_by": []
  },
  "meta": { "source": "upload" }
}
```

## ReviewLog
```json
{
  "_id": "uuid",
  "reviewer_id": "uuid",
  "dataset_item_id": "uuid",
  "action": "approve|edit|skip",
  "changes": {},
  "timestamp": "ISO",
  "payout_amount": 0.002
}
```

## System Config
```json
{
  "_id": "system_config",
  "payout_rate_default": 0.002,
  "skip_threshold_default": 5,
  "lock_timeout_sec": 180
}
```

## Replit DB Notes
- No native indexes. Keep per‑language volumes modest. If needed, keep an in‑memory cache inside services.
