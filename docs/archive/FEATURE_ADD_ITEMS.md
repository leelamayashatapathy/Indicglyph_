# Dataset Item Creation Feature (M3)

## Overview
Implemented a comprehensive dataset item creation interface that allows admins to add items either manually (one at a time) or in bulk (via ZIP uploads), with full schema-aware form rendering and validation.

## Implementation Summary

### Backend Changes

**New Router: `routes_admin_items.py`**
- **POST /api/admin/items/bulk-upload-zip**: Accepts ZIP files containing CSV or JSONL files
  - Automatically extracts and parses CSV files (first row as headers)
  - Parses JSONL files (one JSON object per line)
  - Creates dataset items in batch with metadata tracking (source file, row/line numbers)
  - Returns detailed success/error reporting with counts and specific error locations
  - Validates dataset type existence before processing

**Updated Files:**
- `backend/app/main.py`: Added routes_admin_items router
- `frontend/src/services/api.js`: Added `createDatasetItem()` and `bulkUploadZip()` methods

### Frontend Changes

**New Page: `AddDatasetItemsPage.jsx`**
- **Dataset Type & Language Selection**: Dropdown for dataset types, language selector
- **Tab Switcher**: Toggle between Manual Entry and Bulk Upload modes
- **Manual Entry Tab**:
  - Schema-driven dynamic form rendering based on selected dataset type
  - Supports all review widgets: text_input, textarea, image_viewer, audio_player, video_player
  - Live preview for media content (images, audio, video)
  - Required field validation with visual indicators
  - Success/error messaging
- **Bulk Upload Tab**:
  - Drag-and-drop ZIP file upload zone
  - Format guidelines and instructions
  - Upload progress tracking
  - Detailed result display: created count, error count
  - Error list with file/row/line specificity
- **Styling**: Glassmorphism design matching existing admin panel aesthetic

**Updated Files:**
- `frontend/src/App.jsx`: Added AddDatasetItemsPage route at `/admin/add-items`
- `frontend/src/pages/AdminPanel.jsx`: Added "Add Items" navigation link with plus icon

## File Formats Supported

### CSV Format
```csv
headline,body
Breaking News: AI Revolution,The world of artificial intelligence is rapidly evolving.
Tech Update: New Release,A major software company announced their latest product today.
```

### JSONL Format
```jsonl
{"headline": "Breaking News", "body": "Content here"}
{"headline": "Another Story", "body": "More content"}
```

## Key Features

1. **Schema Validation**: Automatically validates that uploaded data matches the dataset type schema
2. **Batch Processing**: Can process thousands of items in a single ZIP upload
3. **Error Reporting**: Provides detailed error messages with exact file, row, and line numbers
4. **Media Support**: Manual entry supports URLs for images, audio, and video with live previews
5. **Required Fields**: Enforces required field constraints defined in dataset type schema
6. **Source Tracking**: Metadata includes source file and location for traceability

## Usage Flow

### Manual Entry
1. Admin navigates to Admin Panel → Add Items
2. Selects dataset type from dropdown
3. Chooses language
4. Switches to "Manual Entry" tab
5. Fills in dynamic form based on schema
6. Clicks "Add Item" to create

### Bulk Upload
1. Admin navigates to Admin Panel → Add Items
2. Selects dataset type and language
3. Switches to "Bulk Upload (ZIP)" tab
4. Prepares ZIP file with CSV/JSONL files
5. Uploads ZIP file via drag-and-drop or file picker
6. Reviews results: created count, errors (if any)
7. Checks error list for specific issues

## Testing Recommendations

1. **Manual Entry**: Create single items for each widget type (text, image, audio, video)
2. **CSV Upload**: Upload 10-100 items via CSV in ZIP
3. **JSONL Upload**: Upload 100+ items via JSONL in ZIP
4. **Error Handling**: Test with invalid data, missing required fields, malformed JSON
5. **Large Batches**: Test with 1000+ items to verify batch processing

## Technical Details

- **API Endpoints**: 
  - `POST /api/datasets/items` (manual, authenticated users)
  - `POST /api/admin/items/bulk-upload-zip` (bulk, admin only)
- **Authentication**: Both endpoints require authentication, bulk requires admin role
- **File Size Limit**: Backend accepts files up to FastAPI's default limit
- **Supported Extensions**: `.zip` for bulk, containing `.csv` or `.jsonl`/`.json` files
- **Error Tolerance**: Continues processing even if individual rows/lines fail, reports all errors at end

## Future Enhancements

- Direct CSV/JSONL upload without ZIP requirement
- Excel (.xlsx) file support
- Progress bar for large uploads
- Preview before committing items
- Duplicate detection
- Automatic field mapping/guessing for CSV headers
