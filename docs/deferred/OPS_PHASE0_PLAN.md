# Operations Console – Phase 0 Plan
**Project:** IndicGlyph Data Studio  
**Initiative:** Admin → Operations Console Transformation  
**Date:** October 24, 2025  
**Status:** 🟡 **PLANNING - AWAITING APPROVAL**

---

## Executive Summary

This document provides a **gap analysis** and **phased delivery plan** for transforming the current Admin panel into a professional **Operations Console** with granular RBAC (10 roles), bulk owner ingestion, trust/QA dashboards, and dataset packaging capabilities.

**Current State:** Production-ready platform with 4-role RBAC, admin tools, analytics, OCR ingestion, and homepage CMS.

**Target State:** Enterprise-grade Ops Console with 10-role RBAC, owner bulk ingest pipeline, batch lifecycle management, provenance tracking, and evaluation kit packaging.

**Recommendation:** Proceed with **4-phase gated delivery** as outlined in Section 5.

---

## 1. RBAC Design (10 Roles)

### 1.1 Current State (4 Roles)

| Role | Permissions | Implementation |
|------|-------------|----------------|
| `user` | Basic authenticated access | Default role on registration |
| `reviewer` | Review app access | Can review items, access dashboard |
| `admin` | Full platform access | All admin routes via `get_admin_user()` |
| `superadmin` | All admin + potential escalations | Same as admin currently |

**Implementation:**
- `backend/app/utils/role_checker.py` - `require_roles()` dependency
- JWT payload includes `roles: []` array
- Frontend: `useAuth()` hook checks `user.roles`
- Admin routes protected by `Depends(get_admin_user)` (checks admin/superadmin)

### 1.2 Target State (10 Roles)

Based on spec RBAC matrix, map to existing + new capabilities:

| Role Key | Display Name | Maps To Current | New Capabilities | UI Modules |
|----------|--------------|-----------------|------------------|------------|
| `owner` | Platform Owner | `superadmin` (extend) | Billing, role grants, tenant policies | All modules + billing |
| `ops_admin` | Ops Admin | `admin` (rename) | Dataset types, routes, configs, exports | Most modules except billing |
| `ingest_owner` | Ingest Owner | **NEW** | Bulk ingest, manifests, overrides; no Red zone | Bulk Ingest, Batch Lifecycle |
| `data_curator` | Data Curator | **NEW** | Edit metadata, tags, domains | Dataset Types (edit mode) |
| `qa_lead` | QA Lead | **NEW** | Gold/honeypot, trust dashboards, adjudication | Trust & QA, Flagged Items |
| `review_manager` | Review Manager | **NEW** | Assignment rules, tiers, cohorts | Overrides & Routing |
| `analyst` | Analyst | **NEW** | Read-only analytics/exports | Analytics (read-only) |
| `security_officer` | Security Officer | **NEW** | Audit logs, access anomalies, PII summaries | Ledger, Rights & PII |
| `engineer` | Engineer | **NEW** | System configs, queues, health; no financials | System Config, Monitoring |
| `reviewer` | Reviewer | `reviewer` (keep) | Review app only | Reviewer Dashboard + Review Page |

**Key Design Principles:**
1. **Feature Hiding:** If role lacks permission, hide module entirely (not greyed/disabled)
2. **Backward Compat:** Existing `admin` → `ops_admin`; `superadmin` → `owner`
3. **Migration Path:** Add role mapping utility; auto-upgrade existing admins
4. **Granular Permissions:** Each API endpoint checks specific role requirements

### 1.3 Permission Matrix Implementation Plan

**Backend Changes:**
- [ ] Define role constants (`backend/app/constants/roles.py`)
- [ ] Create permission matrix (`backend/app/constants/permissions.py`)
- [ ] Update `require_roles()` to check permission matrix
- [ ] Add `get_user_permissions()` helper
- [ ] Create role seeding script for existing users

**Frontend Changes:**
- [ ] Update `useAuth()` hook with `hasPermission(module)` helper
- [ ] Create `<PermissionGate>` component
- [ ] Update `AdminPanel.jsx` tabs to filter by role
- [ ] Add role display badge in header

**Estimated Effort:** 3-4 hours (Phase 1)

---

## 2. Module Inventory

### 2.1 Existing Admin Modules (To Preserve)

| Module | Status | Routes | Frontend | Notes |
|--------|--------|--------|----------|-------|
| **Overview** | ✅ Exists | `/api/admin/stats` | `AdminOverview.jsx` | Keep; add queue health |
| **Dataset Types** | ✅ Exists | `/api/admin/dataset-type` (CRUD) | `DatasetTypesPage.jsx` | Schema builder exists |
| **Dataset Items** | ✅ Exists | `/api/admin/dataset-items` | `DatasetItemsPage.jsx` | Pagination working |
| **Users** | ✅ Exists | `/api/admin/users` (CRUD) | `UserManagementPage.jsx` | Add role editor |
| **System Config** | ✅ Exists | `/api/admin/system-config` | `SystemConfigPage.jsx` | Keep as-is |
| **Payouts** | ✅ Exists | `/api/admin/payouts` | `PayoutManagementPage.jsx` | Keep as-is |
| **Analytics** | ✅ Exists | `/api/analytics/*` | `AnalyticsDashboardPage.jsx` | Reviewer + dataset analytics |
| **Flagged Items** | ✅ Exists | `/api/analytics/flagged-items` | `FlaggedItemsPage.jsx` | Admin review panel |
| **OCR Ingestion** | ✅ Exists | `/api/admin/ocr/*` | `OcrIngestionPage.jsx` | Job-based OCR processing |
| **Homepage Editor** | ✅ Exists | `/api/homepage/*` | `HomepageSetup.jsx` | CMS for landing page |

**Total Existing:** 10 modules, ~1,900 lines backend routes, 20 frontend pages

### 2.2 New Ops Console Modules (To Add)

| Module | Priority | Backend Routes | Frontend Pages | Phase |
|--------|----------|----------------|----------------|-------|
| **RBAC & Roles** | P0 | `/api/ops/roles/*` | `RolesManagementPage.jsx` | Phase 1 |
| **Owner Bulk Ingest** | P1 | `/api/ops/bulk-ingest/*` | `BulkIngestPage.jsx` | Phase 2 |
| **Batch Lifecycle** | P1 | `/api/ops/batches/*` | `BatchLifecyclePage.jsx` | Phase 2 |
| **Overrides & Routing** | P2 | `/api/ops/overrides/*` | `OverridesEditorPage.jsx` | Phase 3 |
| **Trust & QA Dashboards** | P2 | `/api/ops/trust/*` | `TrustDashboardPage.jsx` | Phase 3 |
| **Rights & PII** | P3 | `/api/ops/rights/*` | `RightsPIIPage.jsx` | Phase 4 |
| **Ledger & Audit** | P3 | `/api/ops/audit/*` | `AuditLedgerPage.jsx` | Phase 4 |
| **Packaging & Exports** | P3 | `/api/ops/packaging/*` | `PackagingBuilderPage.jsx` | Phase 4 |
| **Monitoring & Queues** | P2 | `/api/ops/monitoring/*` | `MonitoringPage.jsx` | Phase 3 |

**Total New:** 9 modules, est. ~2,500 lines backend, 9 new frontend pages

---

## 3. Feasibility Matrix

### 3.1 Current Capabilities vs Spec Requirements

| Spec Requirement | Current Implementation | Gap | Risk | Complexity | Effort |
|------------------|------------------------|-----|------|------------|--------|
| **10-role RBAC** | 4 roles, basic RBAC | 6 new roles, permission matrix | 🟢 Low | Medium | 4h |
| **Role UI hiding** | No role-based UI gating | Hide modules by permission | 🟢 Low | Low | 2h |
| **Bulk ZIP upload** | OCR single file upload | Multi-file ZIP, manifest parsing | 🟡 Medium | Medium | 8h |
| **Manifest validation** | None | CSV schema validation, checksums | 🟢 Low | Low | 4h |
| **Overrides YAML** | None | YAML editor, server validation | 🟡 Medium | Medium | 6h |
| **Batch lifecycle** | None | State machine, status tracking | 🟢 Low | Medium | 6h |
| **Trust/IAA scoring** | None | Consensus math, trust metrics | 🟡 Medium | High | 12h |
| **Rights & PII tracking** | None | Consent classes, redaction summaries | 🟡 Medium | High | 10h |
| **Audit ledger UI** | `AuditService` exists (no UI) | Admin audit log viewer | 🟢 Low | Low | 4h |
| **Packaging builder** | Export exists (basic) | Module builder, dataset cards | 🟡 Medium | High | 12h |
| **Queue monitoring** | None | Queue depths, worker health | 🟢 Low | Medium | 6h |
| **Red/Amber/Green zones** | None | Privacy zone enforcement | 🔴 High | High | 16h |

**Legend:** Risk - 🟢 Low | 🟡 Medium | 🔴 High

### 3.2 Existing Assets We Can Reuse

✅ **Reusable:**
- JWT auth infrastructure (`backend/app/auth/*`)
- `role_checker.py` utilities (extend for permissions)
- `db_adapter.py` (MongoDB-like API over Replit DB)
- `AuditService` (backend/app/services/audit_service.py)
- Export endpoint (extend for packaging)
- OCR job infrastructure (adapt for batch jobs)
- Admin panel layout (`AdminPanel.jsx`, nav, glassmorphism CSS)
- React components (cards, modals, forms, tables)

✅ **Low-Hanging Fruit:**
- Audit log viewer UI (service exists, add page)
- Role management UI (user CRUD exists, add role editor)
- System config expansion (add new fields)
- Analytics read-only mode for `analyst` role

🟡 **Needs Adaptation:**
- OCR upload → Bulk ingest (add ZIP, manifest, dry-run)
- Analytics → Trust dashboards (add IAA, consensus metrics)
- Export → Packaging (add module builder, dataset cards)

🔴 **Build from Scratch:**
- Overrides YAML editor
- Batch lifecycle state machine
- Rights & PII tracking
- Red/Amber/Green privacy enforcement

---

## 4. Risk Assessment

### 4.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **RBAC breaks existing flows** | Medium | High | Phase 1: Add roles, keep `admin`/`superadmin` working; migrate later |
| **ZIP upload memory issues** | Low | Medium | Stream processing, size limits, chunked uploads |
| **YAML injection attacks** | Medium | High | Server-side validation, whitelist keys, no eval() |
| **Red zone data leaks** | High | Critical | API-layer enforcement, separate collections, audit all access |
| **Performance (large batches)** | Medium | Medium | Pagination, async processing, job queues |
| **Replit DB scale limits** | Low | Medium | Monitor keys/size; plan Postgres migration if needed |

### 4.2 UX/Product Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Feature overload (10 modules)** | High | Medium | Phased rollout; hide unused modules by role |
| **Reviewer confusion** | Low | Low | Reviewers see no changes (separate app path) |
| **Admin learning curve** | Medium | Medium | Rename "Admin" → "Ops Console"; add onboarding tooltips |
| **Mobile responsiveness** | Medium | Medium | Test all new modules on mobile; reuse existing responsive patterns |

---

## 5. Phasing Plan (4 Phases)

### 🧱 Phase 0: **Plan Approval** (Current Phase)

**Scope:** This document  
**Deliverables:**
- [x] Gap analysis
- [x] RBAC design (10 roles)
- [x] Module inventory
- [x] Feasibility matrix
- [x] Risk assessment
- [x] Phasing plan with estimates

**Decision Gate:** 🚦 **STOP HERE - AWAIT APPROVAL** before proceeding to Phase 1

---

### 🔧 Phase 1: **Enablement & Foundation** (Est. 12-16 hours)

**Goal:** RBAC scaffolding, rename Admin → Ops Console, role-based UI hiding

**Backend Tasks:**
1. [ ] Create `backend/app/constants/roles.py` with 10 role definitions
2. [ ] Create `backend/app/constants/permissions.py` with permission matrix
3. [ ] Update `require_roles()` to check permissions (not just role names)
4. [ ] Add `get_user_permissions(user)` helper
5. [ ] Create role seeding/migration script
6. [ ] Extend `AuditService` to log all admin actions (already partially done)
7. [ ] Add `/api/ops/roles` endpoints (list roles, update user roles)
8. [ ] Update existing admin routes to use new permission checks

**Frontend Tasks:**
1. [ ] Rename "Admin Panel" → "Operations Console" in UI
2. [ ] Update `useAuth()` hook with `hasPermission(module)` helper
3. [ ] Create `<PermissionGate module="...">` component
4. [ ] Filter `AdminPanel.jsx` tabs by user permissions
5. [ ] Add role badge in Ops Console header
6. [ ] Create `RolesManagementPage.jsx` (assign/revoke roles)
7. [ ] Add audit log viewer UI (`AuditLedgerPage.jsx` basic version)

**Docs & QA:**
- [ ] Update `replit.md` with RBAC changes
- [ ] Create `OPS_PHASE1_CHANGES.md` (diffs only, not full files)
- [ ] Update `QA_CHECKLIST_INDICGLYPH_PRODUCTION_LAUNCH.md` with new test cases
- [ ] Create `QA_RUN_PHASE_1.md` (test RBAC, UI hiding, role management)

**Estimates:**
- Backend: 6-8 hours
- Frontend: 4-6 hours
- QA: 2-3 hours
- **Total: 12-16 hours**

**Success Criteria:**
- ✅ All 10 roles defined and assignable
- ✅ Existing admin users auto-migrated to `ops_admin`
- ✅ UI modules hidden for roles without permission
- ✅ No regressions in existing admin functionality
- ✅ Audit log UI showing recent admin actions

---

### 📦 Phase 2: **Owner Bulk Ingest MVP** (Est. 18-24 hours)

**Goal:** ZIP/folder upload, manifest validation, dry-run, ticket creation, basic batch lifecycle view

**Backend Tasks:**
1. [ ] Create `backend/app/models/batch_ingest.py` (Batch, IngestTicket models)
2. [ ] Create `/api/ops/bulk-ingest/upload` (multipart ZIP upload)
3. [ ] Add manifest CSV parser and validator
4. [ ] Add `overrides.yaml` parser with schema validation
5. [ ] Create dry-run engine (license/consent checks, dedup, PII risk flags)
6. [ ] Create ingest ticket queue (push validated items)
7. [ ] Add `/api/ops/batches` (list batches, status, retries)
8. [ ] Add batch detail endpoint with per-item status

**Frontend Tasks:**
1. [ ] Create `BulkIngestPage.jsx` (ZIP upload zone, drag-drop)
2. [ ] Add manifest preview table (show parsed CSV)
3. [ ] Add dry-run report UI (issues list, warnings)
4. [ ] Create `BatchLifecyclePage.jsx` (batch list, status badges)
5. [ ] Add batch detail view (per-item status, retry actions)

**Docs & QA:**
- [ ] Create `OPS_PHASE2_CHANGES.md`
- [ ] Update QA checklist
- [ ] Create `QA_RUN_PHASE_2.md` (upload ZIP, test validation, check dry-run)

**Estimates:**
- Backend: 10-14 hours
- Frontend: 6-8 hours
- QA: 2-3 hours
- **Total: 18-24 hours**

**Success Criteria:**
- ✅ ZIP upload works (max 100MB for MVP)
- ✅ Manifest CSV validated with clear error messages
- ✅ Dry-run shows license/consent/dedup issues
- ✅ Tickets created and visible in batch lifecycle view
- ✅ Idempotency (re-uploading same batch doesn't duplicate)

---

### 🧠 Phase 3: **Routing & Trust** (Est. 20-28 hours)

**Goal:** Overrides editor, trust/IAA dashboards, low-confidence routing, adjudication queue

**Backend Tasks:**
1. [ ] Create `backend/app/models/overrides.py` (YAML schema)
2. [ ] Add `/api/ops/overrides` (CRUD for routing overrides)
3. [ ] Implement trust scoring logic (IAA, consensus, anomaly detection)
4. [ ] Add `/api/ops/trust/dashboard` (trust metrics, low-confidence items)
5. [ ] Add adjudication queue (items below trust threshold)
6. [ ] Update `QueueService` to apply overrides (language routing, tiers)
7. [ ] Add `/api/ops/monitoring/queues` (queue depths, DLQ, worker health)

**Frontend Tasks:**
1. [ ] Create `OverridesEditorPage.jsx` (YAML editor with validation)
2. [ ] Create `TrustDashboardPage.jsx` (IAA charts, trust distribution)
3. [ ] Add adjudication queue UI (review low-confidence items)
4. [ ] Create `MonitoringPage.jsx` (queue metrics, pause/resume controls)

**Docs & QA:**
- [ ] Create `OPS_PHASE3_CHANGES.md`
- [ ] Update QA checklist
- [ ] Create `QA_RUN_PHASE_3.md`

**Estimates:**
- Backend: 12-16 hours
- Frontend: 6-10 hours
- QA: 2-3 hours
- **Total: 20-28 hours**

**Success Criteria:**
- ✅ Overrides YAML editor saves and validates
- ✅ Trust dashboard shows IAA/consensus metrics
- ✅ Low-confidence items routed to adjudication queue
- ✅ Queue monitoring shows real-time depths

---

### 🔒 Phase 4: **Provenance & Packaging** (Est. 16-22 hours)

**Goal:** Ledger views, module packaging, export presets, eval kit selector

**Backend Tasks:**
1. [ ] Enhance `AuditService` with hash anchoring (SHA-256)
2. [ ] Add `/api/ops/audit/ledger` (event timeline, search, proof export)
3. [ ] Create `backend/app/models/module_package.py`
4. [ ] Add `/api/ops/packaging/builder` (module packaging configs)
5. [ ] Add dataset card generation (JSON metadata)
6. [ ] Add export preset templates (JSONL, Parquet, PAGE-XML, ALTO)
7. [ ] Add `/api/ops/rights` (rights table, PII summaries)

**Frontend Tasks:**
1. [ ] Enhance `AuditLedgerPage.jsx` (timeline, search, export proof)
2. [ ] Create `PackagingBuilderPage.jsx` (module builder, dataset card editor)
3. [ ] Create `RightsPIIPage.jsx` (rights table, consent classes, PII grades)
4. [ ] Add eval kit template picker to packaging

**Docs & QA:**
- [ ] Create `OPS_PHASE4_CHANGES.md`
- [ ] Update QA checklist
- [ ] Create `QA_RUN_PHASE_4.md`

**Estimates:**
- Backend: 10-14 hours
- Frontend: 4-6 hours
- QA: 2-3 hours
- **Total: 16-22 hours**

**Success Criteria:**
- ✅ Audit ledger shows event timeline with hash anchors
- ✅ Module packaging creates exportable dataset bundles
- ✅ Rights & PII summaries visible (Red/Amber/Green zones noted but not enforced yet)

---

## 6. Test Plan Summary

### 6.1 Phase-Specific QA

| Phase | QA Focus | Test Cases | QA Doc |
|-------|----------|------------|---------|
| Phase 1 | RBAC, role hiding, audit logs | 15 test cases | `QA_RUN_PHASE_1.md` |
| Phase 2 | Bulk ingest, manifest validation | 20 test cases | `QA_RUN_PHASE_2.md` |
| Phase 3 | Overrides, trust dashboards, queues | 18 test cases | `QA_RUN_PHASE_3.md` |
| Phase 4 | Packaging, ledger, rights tracking | 12 test cases | `QA_RUN_PHASE_4.md` |

### 6.2 Regression Testing

After each phase:
- [ ] Run full reviewer flow (ensure no breaking changes)
- [ ] Test existing admin modules (dataset types, users, payouts)
- [ ] Check mobile responsiveness (all new pages)
- [ ] Security audit (RBAC enforcement, audit logs)

---

## 7. Out of Scope (For Now)

The following are **design-only** or **future phases**:

- ❌ Red/Amber/Green privacy zones (full enforcement) - design only, not implemented
- ❌ External billing/payment API integration - plan only
- ❌ Compose API for external dataset access - Phase 5+
- ❌ PostgreSQL/MinIO migration - keep Replit DB for MVP
- ❌ Multi-tenant support - single tenant for now
- ❌ Reviewer tier system (R1-R5) - routing logic only, no tier UI

---

## 8. Success Metrics

### 8.1 Technical Metrics

- **Code Quality:** All LSP diagnostics resolved, no TypeScript/Python errors
- **Test Coverage:** 100% of new endpoints tested in QA runs
- **Performance:** Batch upload <10s for 100-item manifests
- **Security:** No RBAC bypass vulnerabilities

### 8.2 Product Metrics

- **Usability:** Admin users can assign roles without documentation
- **Efficiency:** Bulk ingest reduces upload time by 10x vs manual entry
- **Trust:** Trust dashboard identifies low-quality reviewers
- **Auditability:** Full event ledger with hash proofs

---

## 9. Rollback Plan

If any phase fails:

1. **Immediate:** Revert to previous git checkpoint (auto-committed by Replit)
2. **Database:** RBAC changes are additive (no data loss)
3. **Fallback:** Keep existing `admin`/`superadmin` roles working in parallel during migration

---

## 10. Approval Checklist

Before proceeding to Phase 1, confirm:

- [ ] RBAC design (10 roles) approved
- [ ] Module inventory aligns with business needs
- [ ] Phasing plan (4 phases) makes sense
- [ ] Effort estimates (66-90 hours total) acceptable
- [ ] Risk mitigation strategies agreed
- [ ] Out-of-scope items confirmed

---

## 11. Next Steps

**Current Status:** 🟡 **AWAITING APPROVAL**

**Decision Required:** Approve Phase 1 implementation?

**If approved:**
1. Begin Phase 1: RBAC scaffolding (12-16 hours)
2. Return `OPS_PHASE1_CHANGES.md` (diffs only, not full files)
3. Update QA checklist and create `QA_RUN_PHASE_1.md`
4. Await Phase 2 approval before proceeding

**If changes needed:**
- Provide feedback on RBAC design, module priorities, or phasing
- Adjust plan and re-submit for approval

---

**Document Status:** 📋 **COMPLETE - READY FOR REVIEW**  
**Prepared by:** Replit Agent  
**Date:** October 24, 2025
