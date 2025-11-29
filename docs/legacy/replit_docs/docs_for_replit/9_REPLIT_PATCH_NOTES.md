# Replit Patch Notes – What Changed from Atlas Edition

1) **Storage**: Replaced MongoDB Atlas with Replit DB using `db_adapter.py` (insert/get/update/find/inc).
2) **Queries**: Predicates run in Python (scan). Keep per‑language queues reasonable; optimize later with caches or Mongo swap.
3) **Health**: `/health` reports `storage: "replit-db"`.
4) **Prompts**: All prompt packs updated for Replit Agent; start with **A1‑R**.
5) **Migration path**: When ready, add `database.py` (motor), switch services to driver ops, re‑enable indexes.
