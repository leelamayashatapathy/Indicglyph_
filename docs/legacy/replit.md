# IndicGlyph Data Studio

## Overview
IndicGlyph Data Studio is a language-aware, multi-modal data curation system that enables reviewers to approve, edit, or skip dataset items and earn payouts. It features a FastAPI backend with a MongoDB-like adapter for Replit DB and a React frontend. The platform supports dynamic dataset type creation, a comprehensive reviewer interface, and an administrative panel for system configuration, user management, payout processing, and data export. The project aims to provide a robust and scalable solution for data annotation and curation across various modalities, including text, OCR, voice, image, and video, ensuring high-quality data for diverse applications.

## User Preferences
I want to prioritize iterative development, receiving regular updates and demonstrations of progress. For explanations, please provide detailed insights, especially regarding architectural decisions and complex logic. I prefer clear, concise communication and for the agent to ask for confirmation before implementing significant changes or making irreversible actions. I expect the agent to maintain the established coding standards and project structure.

## Documentation (October 25, 2025)
Comprehensive admin playbook documentation has been created:
- **Master Playbook**: `docs/ADMIN_PLAYBOOK.md` - Complete overview with feature index and workflows
- **Individual Guides**: Step-by-step how-to guides for each major feature:
  - `docs/SYSTEM_CONFIG_GUIDE.md` - Platform settings and language management
  - `docs/DATASET_TYPES_GUIDE.md` - Schema creation and management  
  - `docs/OCR_INGESTION_GUIDE.md` - PDF/image processing pipeline
- All guides include common workflows, best practices, troubleshooting, and mobile responsiveness notes

## System Architecture
The platform follows a client-server architecture with a FastAPI backend and a React frontend.

**UI/UX Decisions:**
The frontend utilizes React, employing a navy/cyan (#0A192F, #00B8D9) design system with gradients, glassmorphism, and animations for a modern aesthetic. Key UI components include:
- **ReviewPage:** Dynamically renders forms based on dataset type schema, supporting multi-modal content with custom review widgets (e.g., image viewer, audio player, OCR editor).
- **Reviewer Dashboard:** Displays assigned datasets with modality badges, progress, earnings, and guidelines.
- **Admin Panel:** Features icon navigation, a glassmorphic header, and tabbed navigation for comprehensive administrative tasks.
- **Dataset Type Builder (Schema Builder):** A no-code interface for defining dataset schemas, including modality selection and review widget assignment, with a live preview.
- **OCR Ingestion:** Features a drag-and-drop upload zone and modern job cards for managing OCR tasks.
- **Audio Ingestion (M2 - October 2025):** Drag-and-drop audio upload interface with job status tracking, transcribe/slice action buttons, and integration with Admin Panel navigation.
- **Mobile Responsiveness:** Implemented across all major pages, including stacked navigation and responsive forms.

**Technical Implementations:**
- **Backend (FastAPI):**
    - **Database Adapter:** A custom MongoDB-like adapter for Replit DB provides flexible data storage and simplifies potential migration.
    - **Authentication & Authorization:** JWT-based authentication with `python-jose` and `bcrypt` for secure password hashing, and Role-Based Access Control (RBAC) for managing user permissions.
    - **Multi-Modal Support:** Dataset types include a `modality` field (ocr, voice, text, conversation, image, video, custom) which dictates review UI rendering and data processing.
    - **Queue Service:** Manages fetching and locking dataset items for review, ensuring unique assignments and supporting language filtering.
    - **Review Service:** Handles review submission, payout calculation, user balance updates, and item finalization based on configurable thresholds (e.g., Gold Standard auto-finalization, skip feedback prompts).
    - **OCR Service:** Asynchronous, job-based OCR processing with Tesseract integration, file storage management, and comprehensive admin endpoints for OCR job lifecycle.
    - **Audio/ASR Service (M2 - October 2025):** Production-ready audio transcription pipeline with faster-whisper integration. Features provider switching (`AUDIO_ASR_PROVIDER=whispercpp|none`), configurable model selection (`WHISPER_MODEL`), word-level timestamps, manual transcript fallback, and automatic slicing into dataset items. Admin endpoints for upload, transcribe, job management, and slicing.
    - **Data Export:** Supports CSV/JSONL exports with extensive filtering options (gold standard, flagged, finalized, dataset type, language, reviewer).
    - **System Config:** Centralized management of configurable system parameters via admin UI and API.
    - **Analytics Routes:** Dedicated analytics router (`routes_analytics.py`) provides three comprehensive endpoints: reviewer statistics with performance metrics and earnings, dataset analytics with completion/quality metrics and skip reason aggregation, and flagged items with advanced filtering and pagination.
- **Frontend (React):**
    - **Routing:** React Router v6 for navigation and protected routes, with SPA fallback for Replit deployment.
    - **State Management:** Local component state for UI logic and API calls for data interaction.
    - **API Client:** Uses Fetch API for backend communication, including multipart form data for file uploads.
    - **Build Tool:** Vite, configured for Replit environment with API proxying and `allowedHosts: true`.

**Feature Specifications:**
- **Core Review Workflow:** Reviewers interact with multi-modal content, approve/edit/skip items, and earn payouts. Items finalize based on review/skip counts and can be marked as gold standard.
- **Quality Control:** Features include item flagging, a skip feedback system, and automatic gold standard finalization based on configured thresholds.
- **OCR Ingestion Pipeline:** Supports secure file upload (PDF, images), asynchronous OCR processing, job status tracking, detailed result viewing (text blocks, confidence scores), and slicing OCR results into dataset items.
- **Audio Ingestion Pipeline (M2 - October 2025):** Production-grade audio transcription with faster-whisper ASR (4x faster than openai/whisper). Supports .mp3/.wav/.m4a/.ogg/.flac uploads (max 50MB), automatic transcription with int8 quantization, manual transcript path when ASR disabled, word-level timestamps, and automatic slicing into voice/conversation dataset items.
- **Dataset Item Creation (M3 - October 2025):** Dual-mode interface for adding dataset items:
  - **Manual Entry:** Schema-driven form with dynamic widget rendering (text_input, textarea, image_viewer, audio_player, video_player) based on dataset type fields, supporting required field validation
  - **Bulk Upload:** ZIP file upload accepting CSV/JSONL files, automatic parsing and validation, batch creation of 1000s of items, detailed error reporting per file/row/line
  - Integrated into Admin Panel with dedicated "Add Items" navigation
- **Dataset Items Enhancements (October 25, 2025):**
  - **Sequential Item Numbering:** Items now have auto-incremented numbers per dataset type (News #1, OCR #23, etc.) for better human readability instead of UUIDs
  - **Content Search:** Full-text search across all content fields with case-insensitive matching
  - **Multi-Column Sorting:** Sort by item number, created date, or review count with ascending/descending order toggling
  - **Statistics Dashboard:** Real-time summary cards showing total items, pending items, and finalized items at top of page
  - **ItemNumberService:** Atomic counter management per dataset type with migration support for existing items
  - **API Enhancements:** /admin/dataset-items endpoint supports search, sort_by, sort_order parameters and returns stats object
- **Admin Features:** Comprehensive CRUD for dataset types, user management (roles, activation), system configuration, payout processing, OCR job management, and dataset item creation.
- **Analytics Dashboard:** Dual-tabbed interface showing reviewer performance metrics (reviews, approvals/edits/skips, flags, earnings, activity) and dataset analytics (completion rates, gold standard coverage, flagged items, skip reasons, unique reviewers). Includes CSV export for reviewer stats.
- **Flagged Items Review Panel:** Dedicated admin interface for reviewing and managing flagged dataset items with advanced filtering (dataset type, language, flag reason) and pagination. Displays full item content, all flags with reviewer notes, and review state information.
- **Performance Optimizations:** 
  - Dataset items endpoint includes pagination (limit/offset) to prevent performance issues with large datasets
  - Dashboard endpoint uses username-based lookups consistent with JWT token structure
  - QueueService.get_queue_stats() optimized to use efficient counting instead of loading all items into memory, dramatically improving admin overview performance
  - AdminOverview tolerates both `pending_items` and `pending` API response formats for compatibility
- **UX Improvements (October 2025):**
  - ReviewPage no longer auto-fetches on mount, preventing infinite loading states
  - Added beautiful welcome state: "Ready to Review? Start Reviewing" button with clear call-to-action
  - Improved empty queue messaging: "🎉 All Done! No more items to review"
  - Better error state differentiation for network issues vs. empty queues
- **Responsive Design:**
  - All major pages fully responsive across mobile (< 640px), tablet (640-1024px), and desktop (> 1024px)
  - Analytics tables use horizontal scroll with touch support on mobile (min-width: 900px on small screens, 700px on phones)
  - Grid layouts use adaptive minmax values: 320px for analytics/flagged items, 280px for OCR jobs
  - Mobile breakpoints ensure buttons, filters, and forms stack appropriately
  - Comprehensive media queries at 1200px, 1024px, 768px, 640px, and 480px breakpoints
- **Security:** Implements privilege escalation prevention (self-privilege downgrade protection), bcrypt hashing, JWT tokens, and robust RBAC. All analytics and flagged item endpoints require admin role authentication.
- **Admin Audit Logging (October 2025):**
  - Comprehensive audit trail system tracks all admin actions (user updates, dataset type CRUD, system config changes, exports)
  - AuditService provides log filtering, pagination, and recent activity queries
  - Integrated into key admin endpoints for compliance and security monitoring
- **Error Handling (October 2025):**
  - React ErrorBoundary component wraps admin routes for graceful error recovery
  - Dev mode shows detailed stack traces, production mode shows user-friendly messages
  - "Try Again" and "Go to Dashboard" recovery options prevent full page crashes
- **Production Bug Fixes (October 24, 2025):**
  - Fixed Admin Stats endpoint: Replaced private `_get_collection_keys()` with `list_collection()` in QueueService
  - Fixed Reviewer Analytics: Changed `users_db.keys()` to `users_db.get_all().keys()` for compatibility with custom DB adapter
  - Fixed CSV Export: Implemented dynamic fieldname generation to support any dataset type schema with custom content fields

## External Dependencies

**Backend:**
- **FastAPI:** Web framework.
- **Uvicorn:** ASGI server.
- **Pydantic:** Data validation and settings.
- **python-jose[cryptography]:** JWT implementation.
- **passlib[bcrypt] & bcrypt (v4.3.0):** Password hashing (v4.x for passlib compatibility).
- **faster-whisper (v1.2.0):** Production ASR with int8 quantization (M2).
- **ffmpeg-python (v0.2.0):** Audio file processing (M2).
- **Replit DB:** Key-value store (via custom adapter).

**Frontend:**
- **React:** UI library.
- **React Router v6:** Routing.
- **Vite:** Frontend tooling.
- **@vitejs/plugin-react:** Vite plugin for React.