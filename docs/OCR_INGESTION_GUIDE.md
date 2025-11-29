# 📘 OCR Ingestion Pipeline Guide

**Feature:** OCR Ingestion  
**Location:** Admin → OCR Ingestion  
**Role Required:** Administrator

---

## Overview

The OCR Ingestion Pipeline automates the process of:

1. **Uploading** PDF files or images (JPG, PNG)
2. **Processing** them through Tesseract OCR engine
3. **Extracting** text with confidence scores
4. **Slicing** OCR results into individual dataset items

This pipeline is ideal for digitizing scanned documents, receipts, forms, newspapers, and handwritten notes.

---

## Prerequisites

Before using the OCR pipeline:

1. **Create an OCR Dataset Type**:
   - Navigate to Admin → Dataset Types
   - Create a dataset type with `modality: ocr`
   - Include required fields:
     - `source_image_url` (text field)
     - `extracted_text` (textarea field)
   - See [Dataset Types Guide](./DATASET_TYPES_GUIDE.md)

2. **Configure Languages**:
   - Ensure target languages are configured in System Config
   - Tesseract supports multiple languages
   - Common codes: `eng` (English), `hin` (Hindi), `spa` (Spanish)

---

## Accessing OCR Ingestion

1. Login as an administrator
2. Navigate to **Admin Panel** (top navigation)
3. Click **OCR Ingestion** in the admin sidebar
4. View active OCR jobs and upload interface

---

## Uploading Files for OCR

### Step-by-Step Instructions

1. Click the **"Upload PDF/Images"** button or drag-and-drop zone
2. Select one or more files from your computer:
   - **Supported formats**: PDF, JPG, JPEG, PNG
   - **Max file size**: 10MB per file (configurable)
   - **Multi-page PDFs**: Supported - each page processed separately
3. Click **"Upload & Process"**
4. Progress indicator appears
5. Job is created with status **"Processing"**

### File Requirements

✅ **Supported:**
- PDF documents (multi-page or single-page)
- Image files (JPG, JPEG, PNG)
- Clear, high-resolution scans
- Multiple files in a single upload

❌ **Not Supported:**
- Encrypted/password-protected PDFs
- Extremely low-resolution images (< 150 DPI)
- Handwriting (results may vary)
- Files > 10MB

---

## Monitoring OCR Jobs

### Job Status States

| Status | Meaning | Next Step |
|--------|---------|-----------|
| **Queued** | Waiting to be processed | Wait - will auto-process |
| **Processing** | OCR in progress | Wait - check back in 30-60 seconds |
| **Completed** | OCR finished successfully | View results or slice into items |
| **Failed** | OCR error occurred | Check error message, re-upload |

### Viewing Job Details

1. Locate the job in the OCR jobs list
2. Each job card shows:
   - Filename
   - Upload timestamp
   - Current status
   - File size
   - Action buttons

### Checking Progress

- **Auto-refresh**: Page auto-refreshes every 10 seconds
- **Manual refresh**: Click refresh icon
- **Notification**: Success message when job completes

---

## Viewing OCR Results

### Step-by-Step Instructions

1. Locate a **Completed** job in the list
2. Click the **"View Results"** button
3. Modal opens displaying:
   - Original filename
   - Total pages/images processed
   - Per-page OCR results
   - Text blocks with confidence scores

### Understanding Results

#### Confidence Scores
- **90-100%**: High confidence - text is likely accurate
- **70-89%**: Medium confidence - may need manual review
- **0-69%**: Low confidence - requires careful validation

#### Text Blocks
- OCR extracts text in "blocks" (paragraphs, lines)
- Each block has:
  - Extracted text
  - Confidence score
  - Bounding box coordinates (if available)

---

## Slicing OCR Results into Dataset Items

Once OCR is complete, convert results into reviewable dataset items.

### Step-by-Step Instructions

1. Locate the **Completed** job
2. Click the **"Slice into Items"** button
3. **Slicing modal** appears with options:

#### Select Dataset Type
- **Requirement**: Must be a dataset type with `modality: ocr`
- **Dropdown**: Shows only compatible dataset types
- **If empty**: Create an OCR dataset type first

#### Select Language
- **Requirement**: Choose target language for these items
- **Dropdown**: Shows languages from system config
- **Common**: `eng` (English), `hin` (Hindi), `spa` (Spanish)

#### Review Mapping Preview
- Shows how OCR fields map to dataset type fields
- Typical mapping:
  - `source_image_url` ← Original image/page
  - `extracted_text` ← OCR-extracted text

4. Click **"Confirm Slicing"**
5. Items are created:
   - One item per page/image
   - Sequential numbering applied automatically
   - Items appear in Dataset Items list

### Post-Slicing

- **View items**: Navigate to Admin → Dataset Items
- **Assign to reviewers**: Items enter reviewer queues automatically
- **Track progress**: Monitor in Analytics dashboard

---

## Common Workflows

### Workflow 1: Processing a Multi-Page PDF

**Goal**: Digitize a 10-page scanned newspaper

1. Navigate to **Admin → OCR Ingestion**
2. Click **"Upload PDF/Images"**
3. Select `newspaper_scans.pdf` (10 pages, 5MB)
4. Click **"Upload & Process"**
5. Job appears with status **"Processing"**
6. Wait 1-2 minutes (depends on page count and quality)
7. Status changes to **"Completed"**
8. Click **"View Results"**:
   - See 10 pages of extracted text
   - Review confidence scores (check for low-confidence pages)
9. Click **"Slice into Items"**:
   - Select dataset type: "Newspaper Headlines OCR"
   - Select language: Hindi (`hin`)
   - Click **"Confirm Slicing"**
10. Success: 10 items created (News #1, News #2, ..., News #10)
11. Navigate to **Admin → Dataset Items** to verify

---

### Workflow 2: Batch Processing Multiple Images

**Goal**: Process 50 receipt images

1. Navigate to **Admin → OCR Ingestion**
2. Select all 50 receipt images at once:
   - `receipt_001.jpg`, `receipt_002.jpg`, ..., `receipt_050.jpg`
3. Click **"Upload & Process"**
4. 50 separate jobs are created (one per image)
5. Monitor status - jobs process in parallel
6. As jobs complete, click **"Slice into Items"** for each:
   - Select dataset type: "Receipt OCR Validation"
   - Select language: English (`eng`)
7. Alternatively, use **"Batch Slice"** if available:
   - Select multiple completed jobs
   - Slice all at once with same settings

---

### Workflow 3: Handling Failed OCR Jobs

**Goal**: Troubleshoot and retry a failed job

1. Locate job with status **"Failed"**
2. Click **"View Error"** or expand error message:
   - Common errors:
     - "File corrupted or unreadable"
     - "OCR timeout - file too large"
     - "Unsupported format"
3. **Solutions**:
   - **Corrupted file**: Re-export from source, re-upload
   - **File too large**: Split PDF into smaller chunks
   - **Unsupported format**: Convert to PDF or JPG
4. Delete failed job
5. Re-upload corrected file

---

## Tips & Best Practices

### File Preparation

✅ **DO:**
- Use high-resolution scans (300+ DPI)
- Ensure good lighting/contrast
- Clean scans (no coffee stains, folds)
- Test with 1-2 files before batch upload

❌ **DON'T:**
- Upload blurry or low-quality scans
- Mix different document types in one batch
- Upload password-protected PDFs
- Exceed file size limits

### OCR Accuracy

✅ **DO:**
- Review low-confidence results manually
- Use appropriate Tesseract language codes
- Process similar document types together
- Validate extracted text with reviewers

❌ **DON'T:**
- Assume 100% accuracy - always validate
- Skip confidence score checks
- Process handwriting without manual review
- Ignore failed jobs without investigation

### Slicing Strategy

✅ **DO:**
- Create separate dataset types for different doc types
- Use consistent language selection
- Review first few items before bulk slicing
- Monitor item numbering sequence

❌ **DON'T:**
- Slice before reviewing OCR results
- Mix languages in one dataset type
- Slice to wrong dataset type
- Forget to check Dataset Items after slicing

---

## Troubleshooting

### Problem: OCR Job Stuck in "Processing"

**Symptoms**: Job shows "Processing" for > 5 minutes

**Solutions**:
1. Refresh the page
2. Check file size - large PDFs take longer
3. Wait 10-15 minutes for very large files
4. If still stuck after 30 minutes, delete and re-upload
5. Contact admin if issue persists

---

### Problem: Low Confidence Scores

**Symptoms**: Most text blocks show < 70% confidence

**Causes**:
- Low-quality scans
- Incorrect language setting
- Handwritten text
- Unusual fonts

**Solutions**:
1. Re-scan at higher resolution
2. Verify correct Tesseract language code
3. Use manual entry instead of OCR for handwriting
4. Try different scan settings (contrast, brightness)

---

### Problem: No Dataset Types Available for Slicing

**Symptoms**: "No compatible dataset types found"

**Solutions**:
1. Navigate to **Admin → Dataset Types**
2. Create a new dataset type with:
   - **Modality**: OCR
   - **Required fields**: `source_image_url`, `extracted_text`
3. Return to OCR Ingestion and retry slicing

---

### Problem: Slicing Creates Wrong Number of Items

**Symptoms**: Expected 10 items, got 8

**Causes**:
- Some pages failed OCR
- Duplicate page detection
- Empty pages skipped

**Solutions**:
1. Check OCR results for all pages
2. Verify page count in "View Results"
3. Re-slice missing pages individually
4. Check Dataset Items for exact count

---

## Technical Details

### OCR Engine
- **Backend**: Tesseract 4.x
- **Languages**: 100+ supported via Tesseract language packs
- **Output**: Text blocks with bounding boxes and confidence scores

### File Storage
- Uploaded files stored in `/tmp` (temporary storage)
- Original files deleted after 7 days
- OCR results cached for 30 days

### Performance
- **Small images** (< 1MB): 5-15 seconds
- **PDFs** (10 pages): 1-3 minutes
- **Large batches** (50+ files): Parallel processing, 5-10 minutes total

---

## Mobile Responsiveness

OCR Ingestion page is fully responsive:

- **Desktop**: Grid layout with drag-and-drop
- **Tablet**: Simplified grid, touch-friendly buttons
- **Mobile**: Stacked layout, native file picker

Viewing results and slicing work on all screen sizes.

---

## Security & Permissions

- Only administrators can access OCR Ingestion
- Uploaded files are scanned for malware
- OCR processing runs in isolated environment
- All actions logged in audit trail

---

## Related Pages

- [Dataset Types Guide](./DATASET_TYPES_GUIDE.md) - Creating OCR dataset types
- [Dataset Items Guide](./DATASET_ITEMS_GUIDE.md) - Managing sliced items
- [System Config Guide](./SYSTEM_CONFIG_GUIDE.md) - Configuring languages
- [Admin Playbook](./ADMIN_PLAYBOOK.md) - Complete admin documentation

---

**Need Help?** Contact your platform administrator or check the [Admin Playbook](./ADMIN_PLAYBOOK.md).
