# Project Overview – Replit DB Edition (FastAPI + React)

## Vision
A modular, language-aware, multi‑modal curation platform where humans review, correct, and verify data (text, OCR slices, audio, images). Verified items remain in our datastore; engineers control exports.

## Replit Edition Rationale
- **$0 infra**: Use Replit DB (key–value JSON store) instead of MongoDB Atlas.
- **Adapter pattern**: A small database adapter abstracts storage (`insert/get/update/find/inc`). Swap later for Mongo with minimal code changes.
- **Agentic workflow**: Build via Replit’s AI Agent using the prompts in `8_PROMPTS_LIBRARY_REPLIT.md`.

## Components
- **Backend**: FastAPI + Replit DB adapter, JWT auth, role checks, datasets/review/payout logic.
- **Frontend**: React (Vite), SPA UX, dynamic forms from dataset schemas, reviewer loop.
- **Admin**: Schema builder (dataset types), payout & thresholds, role management.
- **OCR**: AI/manual slicing → each slice becomes a review item.

## Roles
- SuperAdmin, Admin, Curator, Reviewer, Uploader, Engineer (same semantics as original docs).

## Non‑goals in this edition
- No external DB, no complex queries, no Atlas indexes. Keep item volumes modest for MVP; migrate later when needed.
