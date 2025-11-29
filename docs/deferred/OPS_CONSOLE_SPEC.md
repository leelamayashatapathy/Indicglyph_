# Operations Console – Modular AI Dataset Plan (Prompts)

> We’re renaming **Admin** → **Operations Console** (Ops Console). Add **RBAC with 10 roles** and design a phased plan to bring the OCR + AI-training dataset owner-flow into the UI. **Do NOT implement yet.** First: compare with current system, return a feasibility + phasing plan, then proceed upon approval. Hide features a user isn’t elevated to see.

---

## Prompt 1 — Feasibility & Phasing Plan (Gap Analysis First)

```md
Objective: Convert "Admin" into a professional **Operations Console** with modular controls for OCR and AI training datasets. First, perform a **gap analysis** vs current codebase and propose a **phased delivery plan**. Do not change code yet.

Deliverables (return in one doc):
1) **RBAC Design** — 10 roles, permissions, and UI visibility rules.
2) **Module Inventory** — which Ops Console modules we will add, mapped to current screens.
3) **Feasibility Matrix** — what’s already present vs what’s missing; risk/complexity for each.
4) **Phasing Plan** — break down into Phase 0 (enablement), Phase 1 (foundational), Phase 2 (operational scale), Phase 3 (advanced/provenance & packaging). Include time/effort estimates and test plans.

Context: We already have datasets, analytics, exports, flags, system config, reviewer dashboard, QA logs. We want to go deeper (owner bulk ingest, manifests, overrides, pipeline states, trust scoring, packaging, evaluation kits).

Return the plan and wait for approval before implementation.
```

---

## Proposed RBAC (10 roles)

> Include this in the gap analysis and refine as needed. Enforce **feature hiding** when a role lacks permission.

| Role Key | Display Name | Core Permissions |
|---|---|---|
| `owner` | Platform Owner | All permissions; tenant policies; billing; role grants |
| `ops_admin` | Ops Admin | Create/edit dataset types, routes, configs; view audit; exports; packaging |
| `ingest_owner` | Ingest Owner | Bulk Owner Ingest access; manifest/overrides; batch lifecycle; cannot see Red content |
| `data_curator` | Data Curator | Edit dataset metadata, language/script/domain tags; module assignment |
| `qa_lead` | QA Lead | Gold/honeypot design; audits; adjudication tools; trust dashboards |
| `review_manager` | Review Manager | Assignment rules, tiers, payouts review; cohort management |
| `analyst` | Analyst | Read-only analytics/exports; dashboards; no mutations |
| `security_officer` | Security Officer | View audit logs, policy snapshots, access anomalies; cannot edit datasets |
| `engineer` | Engineer | System configs, feature flags, job queues, health; no financials |
| `reviewer` | Reviewer | Review app only; dashboard; no Ops Console access |

UI: Only show menu items/modules that the current role can access. Greyed-out or hidden (prefer hidden).

---

## Prompt 2 — Ops Console Modules (Design Spec, No Code Yet)

```md
Objective: Define the Ops Console modules, screens, and UX. Return **wireframe-level specs** and minimal schema diffs. Do not implement yet.

Modules to include:
1) **RBAC & Roles** — role assignment UI, per-role capability toggles, and visibility rules.
2) **Owner Bulk Ingest** — batch list, batch detail; upload ZIP; validate `manifest.csv`; show `overrides.yaml`; dry-run; submit; error list.
3) **Batch Lifecycle** — status machine per item/atom: INGESTED → RIGHTS_OK → REDACTED → PREPROCESSED → OCRED → QUEUED(R1..R5) → CONSENSUS → (ADJUDICATE?) → QA_AUDIT → RELEASED → PACKAGED. Filters, counters, retry actions.
4) **Overrides & Routing** — editor for YAML overrides (language hints, reviewer tiers, gold/audit rates, geo rules). Server-side validation.
5) **Trust & QA** — consensus/IAA, gold, anomaly rates; trust-score distribution; escalations queue.
6) **Rights & PII** — rights table, consent classes; PII grades (R0–R2); redaction summaries.
7) **Ledger & Audit** — event timeline, search, export proof (hash anchor), admin audit logs.
8) **Packaging & Exports** — module builder; dataset card fields; export formats (JSONL/Parquet/PAGE-XML/ALTO); split configs; eval kit template picker.
9) **Monitoring & Queues** — queue depths, DLQ, worker health, throughput; simple controls (pause/resume).
10) **Homepage Editor** — hero text, testimonials, sponsors, footer blurb (already spec’d); respect RBAC.

For each module provide:
- Routes & navigation placement
- API endpoints (proposed)
- Minimal schema fields/changes
- Error & empty states
- Mobile responsiveness notes

Return a consolidated design spec, then wait for approval.
```

---

## Prompt 3 — Bulk Ingest + AI Dataset Ops (Plan First)

```md
Objective: Plan the **Bulk Owner Ingest** flow and AI dataset operations end-to-end. Do not implement yet.

Inputs:
- **Folder conventions** under `/owner_staging/batch_*/` (raw/, meta/, manifest/, overrides.yaml)
- **Manifest schema** (id, rel_path, modality, lang, script, domain, license, consent, source_ref, owner_tags, pii_expect, priority)
- **Overrides YAML** (routing, reviewers, qa, redaction, packaging targets)

Plan for:
1) **ZIP/Folder Upload** in Ops Console with server-side validation; generate checksums; surface diffs.
2) **Dry-Run** that shows: license/consent issues, PII risk, dedup hits, missing files, invalid fields.
3) **Ingest Tickets** per row → push to queues; idempotency keys; retries; DLQ policies.
4) **Rights/PII** stage UI: counts per class; promotion rules (Red→Amber→Green) visible; no human access to Red.
5) **Routing**: use overrides to steer languages, tiers, gold/audit rates; show effective policy snapshot.
6) **Trust & QA**: compute per-atom trust scores; show low-confidence/rework list.
7) **Packaging**: create modules, dataset cards, export presets; eval-kit selection.
8) **RBAC**: only `ingest_owner`, `ops_admin`, `engineer`, `security_officer` see these modules; others hidden.

Also return:
- **Feasibility & risks** in current codebase
- **Interfaces** needed (CLI `bulkctl`, API endpoints)
- **Test plan** for Phase 1 (unit + integration + QA cases)
- **Rollout plan** with feature flags

Deliver the plan, then wait for approval.
```

---

## Phasing Template (to be filled by Replit in Prompt 1 response)

- **Phase 0 – Enablement**: RBAC scaffolding, role gates, menu visibility, audit logs coverage.
- **Phase 1 – Bulk Ingest MVP**: ZIP upload + manifest validation + dry-run + ticket creation; basic batch views.
- **Phase 2 – Routing & Trust**: Overrides editor; low-confidence routing; trust/IAA dashboards; adjudication queue.
- **Phase 3 – Provenance & Packaging**: Ledger views; anchoring; module packaging; eval kit presets; Compose API.

---

## Notes
- Enforce “hidden if not permitted” for all Ops Console modules.
- Keep defaults so homepage/admin doesn’t break if CMS data is empty.
- Keep owner path **separate from reviewer path** (no Red-zone leaks).
- Return plans first; we will approve before any code changes.



---

## RBAC Permission Matrix (v1)
> Use this as the single source of truth. Hide modules if the user’s role lacks permission. Where *Write* implies create/update/delete; *Read* implies view/export.

| Module / Capability                         | owner | ops_admin | ingest_owner | data_curator | qa_lead | review_manager | analyst | security_officer | engineer | reviewer |
|---------------------------------------------|:-----:|:--------:|:------------:|:------------:|:------:|:--------------:|:------:|:----------------:|:--------:|:--------:|
| **RBAC & Roles** (assign/revoke)            |  W    |    R     |      -       |      -       |   -    |       -        |   -    |        R         |    R     |    -     |
| **Homepage Editor**                         |  W    |    W     |      -       |      W       |   -    |       -        |   R    |        R         |    R     |    -     |
| **Owner Bulk Ingest** (ZIP upload, dry-run) |  W    |    W     |      W       |      R       |   -    |       -        |   R    |        R         |    W     |    -     |
| **Batch Lifecycle** (status, retries)       |  W    |    W     |      W       |      R       |   R    |       R        |   R    |        R         |    W     |    -     |
| **Overrides & Routing** (editor + apply)    |  W    |    W     |      W       |      R       |   R    |       W        |   R    |        R         |    W     |    -     |
| **Trust & QA Dashboards**                   |  R    |    R     |      R       |      R       |   W    |       R        |   R    |        R         |    R     |    -     |
| **Rights & PII** (view summaries)           |  R    |    R     |      R       |      R       |   R    |       R        |   R    |        W         |    R     |    -     |
| **Ledger & Admin Audit Logs**               |  R    |    R     |      -       |      -       |   -    |       -        |   R    |        W         |    R     |    -     |
| **Packaging & Exports** (module builder)    |  W    |    W     |      R       |      W       |   R    |       R        |   R    |        R         |    R     |    -     |
| **Monitoring & Queues** (pause/resume)      |  R    |    W     |      -       |      -       |   -    |       -        |   R    |        R         |    W     |    -     |
| **System Config / Feature Flags**           |  W    |    W     |      -       |      -       |   -    |       -        |   R    |        R         |    W     |    -     |
| **Reviewer App**                             |  -    |    -     |      -       |      -       |   -    |       -        |   -    |        -         |    -     |    W     |

Legend: **W**=Write, **R**=Read, **-**=No access.

> Notes:
> - `security_officer` is the only role with **Write** on Admin Audit Logs; others have Read or none.
> - `ingest_owner` cannot see Red-zone assets beyond metadata (enforce at API layer).
> - `owner` has full Write; can delegate role grants to `ops_admin` if desired via feature flag. Can also define custom Module or capability

