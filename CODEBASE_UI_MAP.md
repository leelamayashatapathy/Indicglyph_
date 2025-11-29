# CODEBASE_UI_MAP.md

## 1. Overview of the UI
- Single-page React app (Vite) with public marketing landing, reviewer workspace behind auth guards, and operator/admin console under `/admin/*`.
- Personas: anonymous visitor (reads landing content), reviewer (login/register, dashboard, review queue, profile), operator/super-operator (dataset setup, ingestion, payouts, analytics, CMS).
- Layout: `App.jsx` wraps auth + theme providers; authenticated users see global nav/footer with theme toggle and links to review/dashboard/admin. Landing is full-bleed with its own header; admin console is a sidebar layout with nested routes.

## 2. Routing and screen map
- `/` → `frontend/src/pages/LandingPage.jsx` (public). Anonymous marketing page; fetches homepage content. If logged in, auto-redirects to `/dashboard`.
- `/login` → `LoginPage.jsx` (public, guarded redirect when authed). Username/password form with animated hero background.
- `/register` → `RegisterPage.jsx` (public, guarded redirect when authed). Creates account then auto-logs in.
- `/dashboard` → `ReviewerDashboardPage.jsx` (ProtectedRoute). Assigned dataset cards with progress, payout rate, and “Continue reviewing” deep link to `/review?dataset_type=...`.
- `/review` → `ReviewPage.jsx` (ProtectedRoute). Core review queue with schema-driven widgets, approve/edit/skip/flag, keyboard shortcuts, and skip/flag modals.
- `/profile` → `ProfilePage.jsx` (ProtectedRoute). Read-only user info.
- `/admin` → `AdminPanel.jsx` (AdminRoute: requires `platform_operator` or `super_operator`). Sidebar shell with nested content:
  - index → `AdminOverview.jsx` (stats + export modal).
  - `/admin/dataset-types` → `DatasetTypesPage.jsx` (schema builder).
  - `/admin/add-items` → `AddDatasetItemsPage.jsx` (manual + ZIP upload).
  - `/admin/dataset-items` → `DatasetItemsPage.jsx` (table with filters/pagination).
  - `/admin/users` → `UserManagementPage.jsx` (roles/active toggles, delete).
  - `/admin/system-config` → `SystemConfigPage.jsx` (review/payout/language config).
  - `/admin/payouts` → `PayoutManagementPage.jsx` (process/approve/reject).
  - `/admin/analytics` → `AnalyticsDashboardPage.jsx` (reviewer/dataset stats).
  - `/admin/flagged-items` → `FlaggedItemsPage.jsx` (triage flags, local-only resolution).
  - `/admin/ocr` → `OcrIngestionPage.jsx` (upload/list OCR jobs).
  - `/admin/ocr/:jobId` → `OcrJobDetailPage.jsx` (job detail, slice to items).
  - `/admin/audio` → `AudioIngestionPage.jsx` (upload audio, transcribe, slice).
  - `/admin/homepage-setup` → `HomepageSetup.jsx` (CMS editor for landing).
- Unrouted legacy pages: `DashboardPage.jsx`, `ItemsPage.jsx` exist but are not wired into routes.

## 3. Key user journeys
- Reviewer: land on `/login` → submit credentials → redirected to `/dashboard` (nav + footer appear) → choose dataset card → go to `/review?dataset_type=...` → view item fields per schema → approve/edit/skip/flag with keyboard shortcuts or buttons → success toast and auto-fetch next item; balance/stats update via profile refresh.
- Skip/flag branches: skip shows optional “data is correct” checkbox; after configurable unchecked skips, a modal collects feedback before submitting. Flag opens modal to choose reason + note, then returns to queue.
- Operator: login → `/admin` overview for counts/export → create dataset types (schema, payout, languages) → add items (manual or ZIP) → monitor `/admin/dataset-items` table → adjust system config (payouts/queues/languages) → manage users/roles → process payouts via confirm dialogs → review analytics/flagged items.
- Ingestion: `/admin/ocr` uploads PDF/image (validates type/size) → job table; open job detail to retry/cancel or slice OCR pages into dataset items (select dataset type, target field, language, pages). `/admin/audio` uploads audio (type/size checks) → start transcription → slice transcript to dataset items using first voice/conversation dataset type by default.
- CMS: `/admin/homepage-setup` edits hero/testimonials/sponsors/footer; uses bearer token fetch PUT per section; landing page consumes `/api/homepage/content`.
- Anonymous visitor: visits `/` to read hero/testimonials/sponsors with theme toggle + CTA links to auth; sees error banner if content fetch fails.

## 4. Components and UI patterns
- `ProtectedRoute.jsx`/`AdminRoute.jsx`: redirect with session message when unauthenticated or unauthorized; show inline “Loading...” during auth fetch.
- `SessionMessage.jsx`: dismissible status pill shown globally (used for auth prompts); includes decorative mojibake icon and “A-” close affordance.
- `ThemeToggle.jsx`: button toggling `data-theme` attr; used in nav and landing header.
- Feedback primitives: `Toast.jsx` (auto-dismiss), `ErrorBanner.jsx` (alert with optional Retry), `LoadingSkeleton.jsx` (stacked skeleton lines).
- Dialogs: `Modal.jsx` (overlay, focus return, ESC closes), `ConfirmDialog.jsx` (overlay, ESC closes, action buttons). Review page adds custom modals using `useFocusTrap.js` for skip/flag; other dialogs do not trap focus.
- Status/labels: `StatusBadge.jsx` maps status → tone label; used across payouts, jobs, flags.
- Admin layout: `AdminPanel.jsx` sidebar groups with collapse/expand; `ErrorBoundary.jsx` wraps nested routes.
- Repeated patterns without shared abstraction: tables in dataset items/users/payouts/analytics/flags each implement their own filter/pagination/sorting; forms for login/register/system config/payout triage use page-local validation.

## 5. Visual and interaction consistency
- Buttons/badges/icons vary by page; many screens reuse gradient cards and glass panels, but others show plain buttons. Mojibake glyph strings appear on reviewer dashboard, analytics tab labels, session message, and some CTAs.
- Navigation appears only when authenticated; landing has separate header/footer. Theme toggle exists on landing and authed nav, but styling differs.
- Status colors consistent via `StatusBadge`, yet some tables still use ad-hoc text badges (dataset items).
- Loading/error handling mixes skeletons (landing, review, payouts) with plain text (“Loading...”) on auth guards and several admin pages.
- Keyboard hints displayed on ReviewPage (A/E/S) align with implemented shortcuts; elsewhere, no shortcuts or focus cues.

## 6. Accessibility and keyboard behavior
- Skip/flag modals on ReviewPage use `useFocusTrap` (initial focus, ESC, return focus). `Modal`/`ConfirmDialog` set `role="dialog"` + `aria-modal`, return focus, and close on ESC/overlay click, but lack focus trapping; confirm dialogs rely on window key listener.
- Keyboard shortcuts: ReviewPage listens for A (approve), E (edit), S (skip), F (flag) when not in inputs or modals. Risk of triggering actions while focus is on non-input interactive elements; no “undo”.
- Nav hamburger has `aria-expanded`/`aria-controls`; other menus lack aria states. Many inputs lack associated `htmlFor`; icons include decorative mojibake without `aria-hidden`/labels.
- Color reliance for statuses persists; text labels accompany badges, but contrast is unverified. Tables require horizontal scroll on mobile; no responsive view for screen readers.

## 7. Page-by-page UX notes
- Landing (`LandingPage.jsx`): Clear hero/testimonials/sponsors; theme toggle visible. Errors show banner. CMS-driven copy but fetch failure leaves minimal guidance besides banner; CTA icons and gradients are decorative without alt text.
- Login/Register (`LoginPage.jsx`, `RegisterPage.jsx`): Polished cards with icons and trust badges; validation minimal (password length only). Errors inline; no password reset.
- Reviewer Dashboard (`ReviewerDashboardPage.jsx`): Cards show progress, earnings, languages; modality icons are mojibake; empty state friendly. “Start/Continue” button disabled when no items.
- Review Queue (`ReviewPage.jsx`): Schema-driven rendering for text/audio/image/video; sticky action pane with shortcuts and skip checkbox. Success/empty/error states present. Edit mode persists values per field. Risks: double-submit during latency, no preview of payout change, limited inline validation, mojibake badges, keyboard shortcuts global.
- Profile (`ProfilePage.jsx`): Read-only account fields; role uses singular `user.role` while roles elsewhere are array; no edit or password change UI (API supports change-password/payout request but not exposed here).
- Admin Overview (`AdminOverview.jsx`): Animated stats, quick links, export modal with filters. Export success/failure via alert() and toasts; modal lacks focus trap; mojibake in title/labels.
- Dataset Types (`DatasetTypesPage.jsx`): Full CRUD form with field builders, duplicate key validation, activation toggle, delete with `confirm()`. Languages pulled from system config when available. Errors inline; no edit existing fields beyond activate/delete.
- Add Items (`AddDatasetItemsPage.jsx`): Manual form renders widgets per schema; required validation per field. Bulk ZIP upload with instructions and result stats; no progress indicator, relies on API success.
- Dataset Items (`DatasetItemsPage.jsx`): Filter/search/sort + pagination; table shows status, counts, preview. Uses LoadingSkeleton initially; no row actions (read-only). Sort icons are text placeholders (“<>”, “^/v”).
- User Management (`UserManagementPage.jsx`): Table with inline role toggles (edit mode per user), active toggle, delete with confirm. No debounce or optimistic UI; errors shown at top.
- System Config (`SystemConfigPage.jsx`): Form cards with numeric validation and language list editor. Inline errors, success toast message; no guard against concurrent edits.
- Payout Management (`PayoutManagementPage.jsx`): Filter by status, status chips, ConfirmDialog for processing/completing/rejecting (rejection requires reason). Toast feedback; prompts are modal-based not browser prompts. Payment details displayed raw JSON/text.
- Analytics (`AnalyticsDashboardPage.jsx`): Tabs for reviewers (table + CSV export via Blob) and dataset analytics cards. Mojibake in titles/labels; no filters or pagination; CSV export uses client-side download.
- Flagged Items (`FlaggedItemsPage.jsx`): Filters, cards with flags + resolution status; triage actions set local resolution only (not persisted). Detail modal shows full JSON content. Toast feedback; no backend update path yet.
- OCR Ingestion (`OcrIngestionPage.jsx`): Drag/drop upload with validation; job table with status filter and spinner icon; open detail, cancel pending job. Toasts for upload/cancel; errors via banner.
- OCR Job Detail (`OcrJobDetailPage.jsx`): Job metadata, retry/cancel, results list per page with confidence; slice modal to create dataset items (dataset type, text field, language, selected pages). Uses ConfirmDialog; success toast; no progress indicator after slice submit.
- Audio Ingestion (`AudioIngestionPage.jsx`): Upload audio (type/size checks), list jobs, start transcription, slice completed jobs to items (pick dataset type and language), retry failed. Toasts; no polling; slicing assumes first voice/conversation dataset type if none chosen initially.
- Homepage Setup (`HomepageSetup.jsx`): Tabbed CMS editor for hero/testimonials/sponsors/footer using raw fetch + token; success message per section. If token missing/expired, shows inline error; no redirect to login.

## 8. Error handling and feedback
- Uses `ErrorBanner` for data load failures on landing, review, payouts, flags, ingestion pages; banners sometimes include Retry callback.
- Uses `Toast` for transient success/error on payouts, flags, ingestion. Review page uses inline success alert; admin overview export uses browser `alert`.
- Loading states: `LoadingSkeleton` on landing/review/dataset items/payouts/homepage setup; plain text “Loading...” on auth guards, analytics, user management, system config initial fetch.
- Empty states: review queue (“Ready to Review”, “All Done”), dashboard no datasets, jobs tables empty. Some tables silently empty when filters exclude items.
- User guidance gaps: session expiry handled by `useAuth` logout + message, but many fetch errors just log to console (CMS save, profile fetch fallback); actions rarely confirm success beyond toasts.

## 9. UI testing strategy
- Existing tests: `frontend/src/__tests__/Modal.test.jsx`, `ThemeToggle.test.jsx`, `StatusBadge.test.jsx`, `ErrorBanner.test.jsx`.
- Component tests to add: `ProtectedRoute/AdminRoute` redirect messaging; `SessionMessage` dismiss; `ConfirmDialog` keyboard/ESC; `Toast` auto-dismiss; `LoadingSkeleton` aria busy.
- Page/flow tests: reviewer happy path (login → dashboard → review approve/edit/skip/flag, keyboard shortcuts, skip feedback modal gating); admin dataset pipeline (create type → add item manual + ZIP → item appears); payout processing (reject requires reason; status chip updates); flag triage (filters + local resolution state); OCR/Audiο ingestion (upload validation, status filters, slice to items); homepage CMS save with expired token error.
- Accessibility checks: focus trap/return on review modals; dialog roles/labels on ConfirmDialog/Modal; keyboard-only navigation through admin sidebar; table headers + aria labels; color contrast of badges/buttons.
- Visual/responsive sanity: snapshot tables at narrow widths (dataset items/users/analytics) to ensure scroll, not clipping.

## 10. Prioritized UX improvements
- High impact: replace mojibake icons/labels across reviewer dashboard, analytics, session message with clear text or icon set; add submit/disabled states and double-submit guards on ReviewPage actions; ensure payout/ingestion dialogs show success/failure without alert(); persist flag triage resolutions to backend or explicitly label as session-only.
- Medium impact: add focus trapping + return focus to all dialogs/overlays; standardize status badges and table sort icons; add polling or manual refresh cues for OCR/Audio jobs and analytics; add inline validation + error display on CMS save and auth errors (e.g., profile fetch).
- Nice to have: responsive table patterns or horizontal scroll affordances for admin grids; expose payout request or profile edit for reviewers; unify nav/header between landing and authed views with consistent theme toggle; add inline guidance/breadcrumbs on OCR detail and dataset item views.
