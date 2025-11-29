# Review Engine – Replit DB Edition

## Goals
- Instant “next item” loop
- Fair rotation (avoid same reviewer)
- Skips finalize after threshold
- Simple payout increments

## Fetch Next
- Predicate: language ∈ user langs, not finalized, status `pending`, requester not in `reviewed_by`.
- Set `status = in_review`, `lock_owner = user_id`.

## Skip
- `skip_count += 1`, append reviewer to `reviewed_by` if absent, set `status = pending`.
- If `skip_count >= skip_threshold_default` → `finalized = true`.

## Approve/Edit
- If `edit`: merge `changes` into `content`.
- `review_count += 1`, append reviewer.
- If `review_count >= 3` → `finalized = true`.
- Add payout using `payout_rate_default`.

## Realtime (optional)
- Emit `payout_update` and `new_item` via Socket.io; fallback to polling.

## Error Handling
- If an item is locked and never submitted, auto‑unlock after `lock_timeout_sec` (compare timestamps on fetch; re‑serve item).

## Analytics (lightweight)
- Compute counts by scanning `dataset_items` or caching simple tallies (e.g., per language finalized counts).
