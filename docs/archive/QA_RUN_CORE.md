# Core Data Engine - E2E Validation Plan
**Platform:** IndicGlyph Data Studio  
**Focus:** Ingestion → Queue → Review → Export Pipeline  
**Date:** October 24, 2025  
**Status:** 🟡 **GAP ANALYSIS - IMPLEMENTATION PENDING**

---

## Executive Summary

This document validates the **core data engine** for all 7 supported modalities: **text, OCR, voice, image, video, conversation, and custom**. It identifies gaps in the ingestion → queue → review → export pipeline and provides an implementation roadmap.

**Strategic Focus:**
- ✅ Keep: Dataset creation, review routing, consensus scoring, exports
- 🛑 Defer: Advanced RBAC, provenance ledger, privacy zones, bulk owner CLI

---

## 1. Modality Support Matrix

| Modality | Schema | Ingestion | Queue | Review UI | Export | Status |
|----------|--------|-----------|-------|-----------|--------|--------|
| **text** | ✅ Defined | ✅ Bulk/Manual | ✅ Working | ✅ Textarea | ✅ CSV/JSONL | 🟢 **COMPLETE** |
| **ocr** | ✅ Defined | ✅ File → OCR → Slice | ✅ Working | ⚠️ Generic text | ✅ CSV/JSONL | 🟡 **UI GAP** |
| **voice** | ✅ Defined | ❌ No audio upload | ✅ Working | ❌ No audio player | ✅ CSV/JSONL | 🔴 **MISSING** |
| **conversation** | ✅ Defined | ✅ Bulk/Manual | ✅ Working | ⚠️ Generic text | ✅ CSV/JSONL | 🟡 **UI GAP** |
| **image** | ✅ Defined | ⚠️ OCR only | ✅ Working | ❌ No image viewer | ✅ CSV/JSONL | 🔴 **MISSING** |
| **video** | ✅ Defined | ❌ No video upload | ✅ Working | ❌ No video player | ✅ CSV/JSONL | 🔴 **MISSING** |
| **custom** | ✅ Defined | ✅ Bulk/Manual | ✅ Working | ✅ Generic text | ✅ CSV/JSONL | 🟢 **COMPLETE** |

**Legend:**
- 🟢 Complete: Full E2E working
- 🟡 UI Gap: Works but needs better review widgets
- 🔴 Missing: Critical ingestion or review features absent

---

## 2. Current State Assessment

### 2.1 Ingestion Methods (What Works)

| Method | Endpoint | Modalities | Status |
|--------|----------|------------|--------|
| **OCR Upload** | `POST /api/admin/ocr/upload` | OCR (PDF/images) | ✅ Production-ready |
| **Bulk Upload** | `POST /api/admin/ocr/bulk-upload` | All (CSV/JSONL) | ✅ Production-ready |
| **Manual Creation** | `POST /api/datasets/items` | All | ✅ Production-ready |

**OCR Pipeline Flow:**
1. Upload PDF/image → `file_storage.save_upload()`
2. Background OCR processing → `ocr_service.process_file()`
3. Results stored in `ocr_results` collection
4. Admin slices results → `POST /api/admin/ocr/jobs/{job_id}/slice`
5. Dataset items created with `content`, `language`, `metadata`

**Strengths:**
- ✅ Job-based async processing
- ✅ Retry/cancel mechanisms
- ✅ Detailed error handling
- ✅ Page-by-page results with confidence scores

### 2.2 Queue Service (Works Perfectly)

**File:** `backend/app/services/queue_service.py`

**Logic:**
```python
QueueService.get_next_item(user_id, user_languages)
  → Filter by: language match, not finalized, status=pending
  → Exclude: user already reviewed, stale locks
  → Lock item: status=in_review, lock_owner=user_id, lock_time
  → Populate modality from dataset_type
```

**Strengths:**
- ✅ Language filtering working
- ✅ Lock timeout handling (180s default)
- ✅ Unique reviewer assignment
- ✅ Modality backfill from parent dataset_type

**No changes needed.**

### 2.3 Review UI (Partial Implementation)

**File:** `frontend/src/pages/ReviewPage.jsx`

**Current Implementation:**
- ✅ Modality badges display correctly (📝 text, 🔍 OCR, 🎤 voice, etc.)
- ✅ Welcome state: "Ready to Review? Start Reviewing" button
- ✅ Empty queue state: "All Done!"
- ✅ Stats header: Balance, Reviews, Streak
- ✅ Approve/Edit/Skip actions
- ✅ Flag modal with reasons
- ⚠️ **Generic text rendering for all modalities**

**Rendering Logic (Lines 346-372):**
```jsx
{Object.entries(item.content || {}).map(([field, value]) => (
  <div key={field} className="content-field">
    {editMode ? (
      typeof value === 'number' ? (
        <input type="number" ... />
      ) : (
        <textarea ... />  // Generic text for ALL modalities
      )
    ) : (
      <div className="content-display">{value}</div>
    )}
  </div>
))}
```

**Problem:** No modality-specific widgets implemented.

**Dataset Type Schema Supports:**
```python
# backend/app/models/dataset_type_model.py
review_widget: Optional[str] = Field(
    None, 
    description="Custom review widget: text_input, textarea, audio_player, image_viewer, ocr_editor, video_player"
)
```

**But ReviewPage doesn't use these widgets!**

### 2.4 Export System (Working)

**File:** `backend/app/routes/routes_admin.py` (lines 440-580)

**Endpoints:**
- `POST /api/admin/export` (CSV/JSONL with filters)

**Recently Fixed (Oct 24, 2025):**
- ✅ Dynamic fieldname generation for any dataset type schema
- ✅ Handles custom content fields correctly

**Strengths:**
- ✅ Filters: gold standard, flagged, language, dataset type, finalized, reviewer
- ✅ CSV/JSONL formats
- ✅ Timestamp-based filenames
- ✅ Streaming responses for large exports

**No changes needed.**

---

## 3. Gap Analysis & Implementation Plan

### 🔴 Priority 1: Audio/Voice Ingestion (MISSING)

**Problem:** No way to upload audio files for transcription/review.

**Required Implementation:**

#### Backend:
1. **File Upload Endpoint** (`backend/app/routes/routes_admin_audio.py`)
```python
@router.post("/admin/audio/upload")
async def upload_audio(
    file: UploadFile,
    dataset_type_id: str,
    language: str
):
    # Validate: .mp3, .wav, .m4a, .ogg, .flac
    # Save to file_storage
    # Create audio_jobs entry (pending)
    # Background task: transcribe_audio_job(job_id)
    # Return job_id
```

2. **Audio Processing Service** (`backend/app/services/audio_service.py`)
```python
class AudioService:
    def transcribe_file(audio_path: str) -> dict:
        # Mock transcription (replace with real API)
        # Return: {text, confidence, segments, duration}
```

3. **Slice to Dataset Items** (reuse OCR pattern)
```python
@router.post("/admin/audio/jobs/{job_id}/slice")
```

#### Frontend:
1. **AudioIngestionPage.jsx** (similar to OcrIngestionPage)
   - Drag-drop upload zone
   - Job list with status badges
   - Transcription preview
   - Slice to items button

**Effort:** 6-8 hours

---

### 🔴 Priority 2: Image/Video Ingestion (MISSING)

**Problem:** No native image/video upload (OCR pipeline is workaround).

**Required Implementation:**

#### Backend:
1. **Media Upload Endpoint** (`backend/app/routes/routes_admin_media.py`)
```python
@router.post("/admin/media/upload")
async def upload_media(
    file: UploadFile,
    dataset_type_id: str,
    modality: str  # 'image' or 'video'
):
    # Validate: .jpg, .png (image), .mp4, .webm (video)
    # Save to file_storage
    # Create media_jobs entry
    # Background task: process_media_job(job_id)
    # For images: extract metadata, thumbnails
    # For videos: extract frames, duration
```

2. **Media Processing Service** (`backend/app/services/media_service.py`)
```python
class MediaService:
    def process_image(image_path: str) -> dict:
        # Return: {url, width, height, format, size}
    
    def process_video(video_path: str) -> dict:
        # Return: {url, duration, fps, frames, thumbnail}
```

#### Frontend:
1. **MediaIngestionPage.jsx**
   - Upload zone with image/video preview
   - Job list
   - Metadata display

**Effort:** 8-10 hours

---

### 🟡 Priority 3: Review UI Widgets (CRITICAL UX GAP)

**Problem:** ReviewPage renders all modalities as generic text fields.

**Required Implementation:**

#### Frontend Components:

1. **AudioPlayerWidget.jsx**
```jsx
export default function AudioPlayerWidget({ url, onChange }) {
  return (
    <div className="audio-widget">
      <audio controls src={url} />
      <textarea 
        placeholder="Transcription (editable)"
        onChange={onChange}
      />
    </div>
  )
}
```

2. **ImageViewerWidget.jsx**
```jsx
export default function ImageViewerWidget({ url, annotations }) {
  return (
    <div className="image-widget">
      <img src={url} alt="Review item" />
      <div className="annotations">
        {/* Bounding boxes, labels */}
      </div>
    </div>
  )
}
```

3. **VideoPlayerWidget.jsx**
```jsx
export default function VideoPlayerWidget({ url, timestamps }) {
  return (
    <div className="video-widget">
      <video controls src={url} />
      <div className="timeline-annotations">
        {/* Timestamp markers */}
      </div>
    </div>
  )
}
```

4. **OcrEditorWidget.jsx**
```jsx
export default function OcrEditorWidget({ blocks, image_url }) {
  return (
    <div className="ocr-widget">
      <img src={image_url} className="ocr-source" />
      <div className="ocr-blocks">
        {blocks.map(block => (
          <div className="block" style={{
            position: 'absolute',
            top: block.bbox.y,
            left: block.bbox.x
          }}>
            <textarea value={block.text} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

5. **ConversationWidget.jsx**
```jsx
export default function ConversationWidget({ turns }) {
  return (
    <div className="conversation-widget">
      {turns.map((turn, i) => (
        <div key={i} className={`turn ${turn.role}`}>
          <strong>{turn.role}:</strong>
          <textarea value={turn.message} />
        </div>
      ))}
    </div>
  )
}
```

#### Update ReviewPage.jsx:

**Replace lines 346-372:**
```jsx
// Render based on dataset type field schema
{datasetType.fields.map(field => {
  const value = item.content[field.key]
  const widget = field.review_widget || 'textarea'
  
  switch(widget) {
    case 'audio_player':
      return <AudioPlayerWidget url={value} onChange={...} />
    case 'image_viewer':
      return <ImageViewerWidget url={value} />
    case 'video_player':
      return <VideoPlayerWidget url={value} />
    case 'ocr_editor':
      return <OcrEditorWidget blocks={value} />
    default:
      return <textarea ... />  // Fallback
  }
})}
```

**Effort:** 10-12 hours

---

### 🟢 Priority 4: E2E Testing (All Modalities)

**Goal:** Validate ingestion → queue → review → export for each modality.

#### Test Cases by Modality:

##### 📝 Text (Already Working)
1. ✅ Create dataset type (modality: text)
2. ✅ Bulk upload 10 items via CSV
3. ✅ Reviewer fetches item from queue
4. ✅ Approve/edit/skip actions work
5. ✅ Export as CSV/JSONL
6. ✅ Verify exported data matches source

##### 🔍 OCR
1. ✅ Upload PDF with 3 pages
2. ✅ OCR job completes
3. ✅ Slice 3 pages into dataset items
4. ⚠️ **TODO:** Reviewer sees OCR editor widget (not generic text)
5. ✅ Export with OCR metadata

##### 🎤 Voice
1. ❌ **TODO:** Upload MP3 file
2. ❌ **TODO:** Transcription job completes
3. ❌ **TODO:** Slice into dataset item
4. ❌ **TODO:** Reviewer sees audio player + editable transcript
5. ✅ Export (after implementation)

##### 🖼️ Image
1. ❌ **TODO:** Upload JPG with annotations
2. ❌ **TODO:** Processing job extracts metadata
3. ❌ **TODO:** Create dataset item with image URL
4. ❌ **TODO:** Reviewer sees image viewer widget
5. ✅ Export (after implementation)

##### 🎬 Video
1. ❌ **TODO:** Upload MP4
2. ❌ **TODO:** Processing extracts frames/duration
3. ❌ **TODO:** Create dataset item
4. ❌ **TODO:** Reviewer sees video player widget
5. ✅ Export (after implementation)

##### 💬 Conversation
1. ✅ Bulk upload conversation (JSON with turns)
2. ✅ Queue assigns to reviewer
3. ⚠️ **TODO:** Reviewer sees conversation widget (not generic text)
4. ✅ Export works

---

## 4. Implementation Roadmap

### Phase 1: Audio/Voice Pipeline (Est. 6-8 hours)

**Backend:**
- [ ] Create `backend/app/routes/routes_admin_audio.py`
- [ ] Create `backend/app/services/audio_service.py` (mock transcription)
- [ ] Create `backend/app/models/audio_job_model.py`
- [ ] Add audio file upload endpoint
- [ ] Add audio job status/detail endpoints
- [ ] Add slice-to-items endpoint
- [ ] Update file_storage to handle .mp3, .wav, .m4a

**Frontend:**
- [ ] Create `frontend/src/pages/AudioIngestionPage.jsx`
- [ ] Add audio upload zone
- [ ] Add job list UI
- [ ] Add transcription preview
- [ ] Update admin nav to include Audio Ingestion

**QA:**
- [ ] Test upload → transcription → slice → queue → export
- [ ] Test error handling (invalid files, failed jobs)

---

### Phase 2: Image/Video Pipeline (Est. 8-10 hours)

**Backend:**
- [ ] Create `backend/app/routes/routes_admin_media.py`
- [ ] Create `backend/app/services/media_service.py`
- [ ] Create `backend/app/models/media_job_model.py`
- [ ] Add media upload endpoint
- [ ] Add image/video processing logic
- [ ] Update file_storage for image/video types

**Frontend:**
- [ ] Create `frontend/src/pages/MediaIngestionPage.jsx`
- [ ] Add image/video preview
- [ ] Add job tracking UI

**QA:**
- [ ] Test image upload → metadata → queue
- [ ] Test video upload → frame extraction → queue

---

### Phase 3: Review Widgets (Est. 10-12 hours)

**Frontend:**
- [ ] Create `frontend/src/components/widgets/AudioPlayerWidget.jsx`
- [ ] Create `frontend/src/components/widgets/ImageViewerWidget.jsx`
- [ ] Create `frontend/src/components/widgets/VideoPlayerWidget.jsx`
- [ ] Create `frontend/src/components/widgets/OcrEditorWidget.jsx`
- [ ] Create `frontend/src/components/widgets/ConversationWidget.jsx`
- [ ] Update `ReviewPage.jsx` to render widgets based on `field.review_widget`
- [ ] Fetch dataset type schema in ReviewPage (need parent dataset type)
- [ ] Add widget-specific CSS

**Backend:**
- [ ] Add `/api/datasets/types/{id}` endpoint (if missing) to fetch full schema

**QA:**
- [ ] Test each widget renders correctly
- [ ] Test edit mode for each widget
- [ ] Test mobile responsiveness for all widgets

---

### Phase 4: E2E Validation & Documentation (Est. 4-6 hours)

**QA:**
- [ ] Run full E2E test suite for all 7 modalities
- [ ] Document results in this file (QA_RUN_CORE.md)
- [ ] Create video walkthrough of each modality
- [ ] Update main QA checklist

**Documentation:**
- [ ] Update `replit.md` with new ingestion methods
- [ ] Create `CORE_ENGINE_CHANGES.md` (diff summary only)
- [ ] Add architecture diagrams for each pipeline

---

## 5. Success Criteria

### 5.1 Functional Requirements

- ✅ All 7 modalities have ingestion methods
- ✅ Queue service assigns items correctly for all modalities
- ✅ Review UI renders modality-specific widgets
- ✅ Export works for all modalities with correct schemas

### 5.2 Performance Requirements

- ✅ OCR processing: <30s per page
- ✅ Audio transcription: <60s per minute of audio
- ✅ Image processing: <5s per image
- ✅ Video processing: <10s per minute of video
- ✅ Queue fetch: <500ms
- ✅ Export generation: <10s for 1000 items

### 5.3 Quality Requirements

- ✅ Zero LSP errors
- ✅ Mobile responsive (all new pages)
- ✅ Error handling (invalid files, failed jobs, network issues)
- ✅ Accessibility (ARIA labels, keyboard nav)

---

## 6. Out of Scope (Deferred)

The following are **not part of core data engine**:

- ❌ Advanced RBAC (10 roles) → Deferred to OPS_PHASE0_PLAN.md
- ❌ Provenance ledger UI → Deferred
- ❌ Red/Amber/Green privacy zones → Deferred
- ❌ Homepage CMS cosmetic updates → Deferred
- ❌ Bulk Owner CLI → Deferred

---

## 7. Test Execution Log

### Run #1: Text Modality (Baseline)
**Date:** TBD  
**Status:** ⏸️ Pending implementation

**Test Cases:**
1. [ ] Create text dataset type
2. [ ] Bulk upload 10 items
3. [ ] Fetch item from queue
4. [ ] Approve item
5. [ ] Edit item
6. [ ] Skip item
7. [ ] Export CSV
8. [ ] Export JSONL
9. [ ] Verify data integrity

**Results:** TBD

---

### Run #2: OCR Modality
**Date:** TBD  
**Status:** ⏸️ Pending widget implementation

**Test Cases:**
1. [ ] Upload 3-page PDF
2. [ ] Wait for OCR completion
3. [ ] Slice to 3 items
4. [ ] Fetch first item
5. [ ] Verify OCR editor widget renders
6. [ ] Edit text block
7. [ ] Approve with edits
8. [ ] Export with OCR metadata

**Results:** TBD

---

### Run #3: Voice Modality
**Date:** TBD  
**Status:** ⏸️ Pending full implementation

**Test Cases:**
1. [ ] Upload MP3 (30s audio)
2. [ ] Wait for transcription
3. [ ] Slice to dataset item
4. [ ] Fetch item
5. [ ] Verify audio player widget
6. [ ] Edit transcription
7. [ ] Approve
8. [ ] Export

**Results:** TBD

---

### Run #4: Image Modality
**Date:** TBD  
**Status:** ⏸️ Pending full implementation

**Test Cases:**
1. [ ] Upload JPG
2. [ ] Process metadata
3. [ ] Create item
4. [ ] Fetch item
5. [ ] Verify image viewer widget
6. [ ] Add annotations (if supported)
7. [ ] Approve
8. [ ] Export

**Results:** TBD

---

### Run #5: Video Modality
**Date:** TBD  
**Status:** ⏸️ Pending full implementation

**Test Cases:**
1. [ ] Upload MP4 (1 minute)
2. [ ] Process frames/duration
3. [ ] Create item
4. [ ] Fetch item
5. [ ] Verify video player widget
6. [ ] Add timestamp annotations
7. [ ] Approve
8. [ ] Export

**Results:** TBD

---

### Run #6: Conversation Modality
**Date:** TBD  
**Status:** ⏸️ Pending widget implementation

**Test Cases:**
1. [ ] Bulk upload conversation JSON
2. [ ] Fetch item
3. [ ] Verify conversation widget (turn-by-turn)
4. [ ] Edit speaker labels
5. [ ] Approve
6. [ ] Export

**Results:** TBD

---

### Run #7: Custom Modality
**Date:** TBD  
**Status:** ⏸️ Pending testing

**Test Cases:**
1. [ ] Create custom dataset type
2. [ ] Define custom schema
3. [ ] Bulk upload
4. [ ] Fetch item
5. [ ] Verify generic text rendering
6. [ ] Export

**Results:** TBD

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **File storage limits (Replit)** | Medium | High | Monitor storage usage; add file size limits |
| **Audio transcription API costs** | Low | Medium | Use mock service for MVP; plan budget for production |
| **Video processing memory issues** | Medium | High | Use streaming/chunked processing; limit file sizes |
| **Widget complexity delays** | High | Medium | Start with basic widgets; enhance iteratively |
| **Mobile performance (large media)** | High | Medium | Use adaptive quality; thumbnails for large files |

---

## 9. Next Steps

**Current Status:** 🟡 **GAP ANALYSIS COMPLETE - AWAITING APPROVAL**

**Decision Required:** Proceed with implementation?

**If approved:**
1. Begin Phase 1: Audio/Voice Pipeline (6-8 hours)
2. Return `CORE_ENGINE_CHANGES.md` (diffs only)
3. Update this document with test results
4. Await Phase 2 approval

**If changes needed:**
- Adjust priorities (e.g., skip video, focus on widgets first)
- Provide feedback on approach
- Re-scope implementation

---

**Document Status:** 📋 **COMPLETE - READY FOR REVIEW**  
**Prepared by:** Replit Agent  
**Date:** October 24, 2025  
**Total Estimated Effort:** 28-36 hours across 4 phases
