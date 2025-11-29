# 📘 IndicGlyph Data Studio - Admin Playbook

**Version:** 1.0  
**Last Updated:** October 25, 2025  
**Audience:** Platform Administrators

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Feature Index](#feature-index)
4. [Common Workflows](#common-workflows)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Overview

IndicGlyph Data Studio is a comprehensive data curation platform for multi-modal training data. As an administrator, you have access to all platform features including:

- **Dataset Type Management** - Define schemas for different data types
- **Dataset Item Management** - Add, view, search, and manage data items
- **Reviewer Management** - Control user access and monitor performance
- **Ingestion Pipelines** - OCR and Audio processing workflows
- **Analytics & Reporting** - Track performance, quality, and flagged items
- **System Configuration** - Platform-wide settings and language management

---

## Quick Start

### First-Time Setup

1. **Login** with your admin credentials
2. **Configure Languages** (Admin → System Config)
   - Add all languages your platform will support
   - Default: English, Hindi, Spanish, French, German, Chinese, Arabic, Bengali, Marathi, Tamil, Telugu, Gujarati, Kannada, Malayalam, Punjabi, Odia

3. **Create Your First Dataset Type** (Admin → Dataset Types)
   - Define schema (fields, modality, languages)
   - Set review requirements and payout rates

4. **Add Dataset Items** (Admin → Add Items or Ingestion Pipelines)
   - Manual entry for single items
   - Bulk upload for large batches
   - OCR/Audio pipelines for automated ingestion

5. **Assign Reviewers** (Admin → Users)
   - Activate reviewer accounts
   - Reviewers will see items in their dashboard

---

## Feature Index

### Core Features

| Feature | Documentation | Quick Access |
|---------|--------------|--------------|
| **Dataset Types** | [Dataset Types Guide](./DATASET_TYPES_GUIDE.md) | Admin → Dataset Types |
| **Dataset Items** | [Dataset Items Guide](./DATASET_ITEMS_GUIDE.md) | Admin → Dataset Items |
| **Add Items (Manual)** | [Manual Entry Guide](./ADD_ITEMS_MANUAL_GUIDE.md) | Admin → Add Items |
| **Bulk Upload** | [Bulk Upload Guide](./ADD_ITEMS_BULK_GUIDE.md) | Admin → Add Items → Bulk Upload |
| **System Config** | [System Config Guide](./SYSTEM_CONFIG_GUIDE.md) | Admin → System Config |
| **User Management** | [User Management Guide](./USER_MANAGEMENT_GUIDE.md) | Admin → Users |

### Ingestion Pipelines

| Pipeline | Documentation | Quick Access |
|----------|--------------|--------------|
| **OCR Ingestion** | [OCR Pipeline Guide](./OCR_INGESTION_GUIDE.md) | Admin → OCR Ingestion |
| **Audio Transcription** | [Audio Pipeline Guide](./AUDIO_INGESTION_GUIDE.md) | Admin → Audio Ingestion |

### Analytics & Quality

| Feature | Documentation | Quick Access |
|---------|--------------|--------------|
| **Analytics Dashboard** | [Analytics Guide](./ANALYTICS_GUIDE.md) | Admin → Analytics |
| **Flagged Items Review** | [Flagged Items Guide](./FLAGGED_ITEMS_GUIDE.md) | Admin → Flagged Items |
| **Data Export** | [Export Guide](./DATA_EXPORT_GUIDE.md) | Admin → Export |

---

## Common Workflows

### Workflow 1: Adding a New Dataset Type

1. Navigate to **Admin → Dataset Types**
2. Click **"+ Create Dataset Type"**
3. Fill in basic information:
   - **Name**: Descriptive name (e.g., "News Headlines")
   - **Description**: Purpose and context
   - **Modality**: Type of data (text, OCR, voice, etc.)
4. Define fields:
   - Add content fields reviewers will see/edit
   - Set field types and review widgets
   - Mark required fields
5. Select languages this dataset type will support
6. Set payout rate (defaults to system config)
7. Add review guidelines for reviewers
8. Click **"Create Dataset Type"**

[See full guide →](./DATASET_TYPES_GUIDE.md)

---

### Workflow 2: Bulk Importing Data

1. Navigate to **Admin → Add Items**
2. Click **"Bulk Upload"** tab
3. Select target dataset type
4. Prepare your file:
   - **Format**: CSV or JSONL
   - **ZIP support**: Upload multiple files at once
   - **Field mapping**: Columns/keys must match dataset type fields
5. Upload file and click **"Upload & Create Items"**
6. Review success/error report
7. Check **Admin → Dataset Items** to verify

[See full guide →](./ADD_ITEMS_BULK_GUIDE.md)

---

### Workflow 3: Processing OCR Documents

1. Navigate to **Admin → OCR Ingestion**
2. Click **"Upload PDF/Images"**
3. Select files (PDF, JPG, PNG)
4. Click **"Upload & Process"**
5. Monitor job status:
   - **Processing**: OCR in progress
   - **Completed**: Ready to slice
6. Click **"View Results"** to see extracted text
7. Click **"Slice into Items"**:
   - Select target dataset type (must be `modality: ocr`)
   - Choose language
   - Confirm slicing
8. Items appear in dataset items list with sequential numbers

[See full guide →](./OCR_INGESTION_GUIDE.md)

---

### Workflow 4: Managing System Languages

1. Navigate to **Admin → System Config**
2. Scroll to **"Available Languages"** card
3. To **add** a language:
   - Enter language code (e.g., `ja` for Japanese)
   - Enter language name (e.g., `Japanese`)
   - Click **"+ Add"**
4. To **remove** a language:
   - Click trash icon next to language
5. Click **"Save Configuration"** at bottom
6. New languages appear in dataset type creation forms

[See full guide →](./SYSTEM_CONFIG_GUIDE.md)

---

### Workflow 5: Reviewing Flagged Items

1. Navigate to **Admin → Flagged Items**
2. Use filters to narrow down:
   - **Dataset Type**: Specific dataset
   - **Language**: Specific language
   - **Flag Reason**: Quality, offensive, unclear, etc.
3. Review each flagged item:
   - See full item content
   - View all flags with reviewer notes
   - Check review state (approved, edited, skipped)
4. Take action:
   - Edit content if needed
   - Mark as resolved
   - Remove from dataset if necessary

[See full guide →](./FLAGGED_ITEMS_GUIDE.md)

---

## Best Practices

### Dataset Type Design

✅ **DO:**
- Use clear, descriptive field names
- Set reasonable payout rates based on complexity
- Provide detailed review guidelines
- Test with a few items before bulk import

❌ **DON'T:**
- Create duplicate dataset types
- Use overly complex schemas
- Skip review guidelines
- Set payout rates too high/low without testing

### Data Quality

✅ **DO:**
- Use sequential item numbering for tracking
- Review flagged items regularly
- Export gold standard data periodically
- Monitor skip reasons to identify data issues

❌ **DON'T:**
- Ignore flagged items
- Skip quality checks before assigning to reviewers
- Delete items without reviewing flags

### System Configuration

✅ **DO:**
- Set appropriate review finalization thresholds
- Configure languages before creating dataset types
- Test payout rates with small batches
- Document configuration changes

❌ **DON'T:**
- Change core settings without testing impact
- Remove languages that are in use
- Set lock timeout too short (< 120 seconds)

---

## Troubleshooting

### Items Not Appearing in Reviewer Queue

**Possible Causes:**
1. Dataset type is inactive
2. No items marked for the reviewer's languages
3. All items are locked or finalized
4. Reviewer account is inactive

**Solutions:**
- Check dataset type **Active** status
- Verify language assignments match reviewer preferences
- Check item finalization status in Dataset Items page
- Ensure reviewer account is active in Users page

---

### Bulk Upload Failing

**Possible Causes:**
1. File format mismatch (CSV/JSONL structure)
2. Field names don't match dataset type schema
3. Required fields missing in data
4. File encoding issues

**Solutions:**
- Use UTF-8 encoding for all files
- Match column/key names exactly to dataset type field keys
- Include all required fields
- Check error report for specific row/line failures

---

### OCR Jobs Stuck in "Processing"

**Possible Causes:**
1. Large file size causing timeout
2. Corrupted PDF/image
3. Server resource limitations

**Solutions:**
- Split large PDFs into smaller files
- Verify file integrity
- Try re-uploading
- Check backend logs for errors

---

### Sequential Numbering Not Working

**Possible Causes:**
1. Items created before migration
2. Dataset type counter not initialized

**Solutions:**
- Run item number migration: `POST /api/admin/migrate-item-numbers`
- Counters reset automatically for new dataset types
- Check backend logs for errors

---

## Additional Resources

- **API Documentation**: `/docs` (FastAPI Swagger UI)
- **Developer Guide**: See `BACKEND.md` and `README.md`
- **Audit Logs**: Track all admin actions in system
- **Support**: Contact platform administrator

---

## Document Index

Individual detailed guides are available for each feature:

1. [Dataset Types Guide](./DATASET_TYPES_GUIDE.md) - Schema creation and management
2. [Dataset Items Guide](./DATASET_ITEMS_GUIDE.md) - Viewing, searching, sorting items
3. [Manual Entry Guide](./ADD_ITEMS_MANUAL_GUIDE.md) - Adding items one by one
4. [Bulk Upload Guide](./ADD_ITEMS_BULK_GUIDE.md) - CSV/JSONL batch imports
5. [System Config Guide](./SYSTEM_CONFIG_GUIDE.md) - Platform settings and languages
6. [User Management Guide](./USER_MANAGEMENT_GUIDE.md) - Reviewer accounts and roles
7. [OCR Ingestion Guide](./OCR_INGESTION_GUIDE.md) - PDF/image processing
8. [Audio Ingestion Guide](./AUDIO_INGESTION_GUIDE.md) - Audio transcription pipeline
9. [Analytics Guide](./ANALYTICS_GUIDE.md) - Performance and quality metrics
10. [Flagged Items Guide](./FLAGGED_ITEMS_GUIDE.md) - Quality control and review
11. [Data Export Guide](./DATA_EXPORT_GUIDE.md) - Exporting datasets

---

**Need Help?** Contact your platform administrator or check the detailed guides above.
