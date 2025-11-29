# 📘 System Configuration Guide

**Feature:** System Configuration  
**Location:** Admin → System Config  
**Role Required:** Administrator

---

## Overview

The System Configuration page allows administrators to manage platform-wide settings including:

- **Payout Settings** - Default reviewer payment rates
- **Review Settings** - Finalization thresholds and quality controls
- **Queue Settings** - Item lock timeouts
- **Available Languages** - Platform-supported languages

All settings apply globally unless overridden at the dataset type level.

---

## Accessing System Config

1. Login as an administrator
2. Navigate to **Admin Panel** (top navigation)
3. Click **System Config** in the admin sidebar
4. The configuration page loads with current settings

---

## Configuration Sections

### 1. Payout Settings

#### Default Payout Rate ($)
- **What it does**: Sets the base amount paid to reviewers per approved/edited review
- **Default**: $0.002 (0.2 cents)
- **Range**: Any positive number
- **When to adjust**:
  - Increase for complex review tasks
  - Decrease for simple yes/no reviews
  - Test with small batches before scaling

**Example Values:**
- Simple text tagging: `$0.001 - $0.002`
- OCR correction: `$0.003 - $0.005`
- Multi-turn conversation review: `$0.010 - $0.020`

---

### 2. Review Settings

#### Reviews for Finalization
- **What it does**: Number of approval/edit reviews needed before an item is marked as finalized
- **Default**: 3 reviews
- **Range**: 1-10
- **Recommendation**: 
  - Critical data: 3-5 reviews
  - General data: 2-3 reviews
  - Low-risk data: 1-2 reviews

#### Skip Threshold
- **What it does**: Number of "skip" actions before an item is automatically finalized (usually removed from queue)
- **Default**: 5 skips
- **Range**: 1-20
- **Use case**: If 5 different reviewers skip an item, it's likely problematic data

#### Gold Skip Correct Threshold
- **What it does**: Number of "data is correct" skip reasons needed to auto-finalize an item into the gold standard dataset
- **Default**: 5
- **Range**: 1-20
- **Use case**: High-quality items that multiple reviewers confirm as already correct

#### Max Unchecked Skips Before Prompt
- **What it does**: How many times a reviewer can skip without providing a reason before being prompted
- **Default**: 2
- **Range**: 1-10
- **Use case**: Ensures reviewers provide feedback on skipped items for quality tracking

---

### 3. Queue Settings

#### Item Lock Timeout (seconds)
- **What it does**: How long an item remains locked to a reviewer after being fetched
- **Default**: 180 seconds (3 minutes)
- **Range**: 30-600 seconds
- **Recommendations**:
  - Simple reviews: 60-120 seconds
  - Complex reviews: 180-300 seconds
  - OCR/Audio reviews: 300-600 seconds

**What happens after timeout:**
- Item is released back to the queue
- Another reviewer can fetch it
- Previous reviewer's work is discarded if not submitted

---

### 4. Available Languages

#### Managing Languages

Languages configured here appear as options when:
- Creating dataset types
- Assigning languages to dataset items
- Filtering datasets and analytics

#### Adding a Language

1. Locate the **"Available Languages"** card
2. In the "Code" field, enter the language code:
   - Use ISO 639-1 codes (2-3 letters)
   - Examples: `en` (English), `hi` (Hindi), `ja` (Japanese)
3. In the "Name" field, enter the full language name:
   - Example: `Japanese`, `Hindi`, `Spanish`
4. Click **"+ Add"** button
5. Language appears in the list below
6. **Important**: Click **"Save Configuration"** at the bottom to persist changes

#### Removing a Language

1. Find the language in the list
2. Click the **trash icon** (🗑️) on the right
3. Language is removed from the list
4. **Important**: Click **"Save Configuration"** to persist changes

⚠️ **Warning**: Removing a language that's actively used in dataset types may cause issues. Check dataset types before removing.

#### Default Languages (Pre-configured)

- English (en)
- Hindi (hi)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Arabic (ar)
- Bengali (bn)
- Marathi (mr)
- Tamil (ta)
- Telugu (te)
- Gujarati (gu)
- Kannada (kn)
- Malayalam (ml)
- Punjabi (pa)
- Odia (or)

---

## Saving Changes

### How to Save

1. Make all desired changes to any section
2. Scroll to the bottom of the page
3. Click the **"Save Configuration"** button
4. Wait for success message: "System configuration updated successfully!"
5. Changes take effect immediately

### Resetting Changes

1. Click the **"Reset"** button at the bottom
2. All fields revert to last saved values
3. Unsaved changes are discarded

---

## Common Workflows

### Workflow 1: Adding Support for a New Language

**Goal**: Add Japanese language support to the platform

1. Navigate to **Admin → System Config**
2. Scroll to **Available Languages** card
3. Enter language code: `ja`
4. Enter language name: `Japanese`
5. Click **"+ Add"**
6. Verify `ja - Japanese` appears in the list
7. Click **"Save Configuration"** at the bottom
8. Japanese now appears as an option when creating dataset types

---

### Workflow 2: Adjusting Payout Rates

**Goal**: Increase payout rate for complex reviews

1. Navigate to **Admin → System Config**
2. Locate **Payout Settings** card
3. Change **Default Payout Rate** from `0.002` to `0.005`
4. Click **"Save Configuration"**
5. New dataset types will use the new rate by default
6. Existing dataset types retain their configured rates

**Note**: This only changes the **default** for new dataset types. Update individual dataset types for existing ones.

---

### Workflow 3: Configuring Review Thresholds

**Goal**: Set stricter quality controls for critical data

1. Navigate to **Admin → System Config**
2. Locate **Review Settings** card
3. Set:
   - **Reviews for Finalization**: `5` (require 5 approvals)
   - **Skip Threshold**: `3` (remove after 3 skips)
   - **Gold Skip Correct Threshold**: `7` (high bar for gold standard)
   - **Max Unchecked Skips Before Prompt**: `1` (always ask for skip reason)
4. Click **"Save Configuration"**
5. New items follow these stricter rules

---

## Tips & Best Practices

### Language Management

✅ **DO:**
- Add languages before creating dataset types that use them
- Use standard ISO codes for consistency
- Keep language names in English for admin clarity
- Document which languages are actively used

❌ **DON'T:**
- Remove languages that are in active use
- Use inconsistent code formats (`EN` vs `en`)
- Add duplicate languages with different codes

### Payout Configuration

✅ **DO:**
- Test payout rates with small batches first
- Document rate justification for budgeting
- Review cost-per-review monthly
- Adjust based on reviewer feedback and quality

❌ **DON'T:**
- Set rates without calculating total cost
- Change rates drastically without warning reviewers
- Use different rates for similar task complexity

### Review Thresholds

✅ **DO:**
- Higher thresholds for critical/sensitive data
- Lower thresholds for low-risk or preliminary data
- Monitor skip reasons to calibrate thresholds
- Test threshold changes on small datasets first

❌ **DON'T:**
- Set finalization count too low (< 2) for critical data
- Set skip threshold too high (causes reviewer fatigue)
- Change thresholds mid-project without reason

---

## Troubleshooting

### Problem: Changes Not Saving

**Symptoms**: Click save, but values revert after page reload

**Solutions**:
1. Check browser console for errors (F12)
2. Verify you have admin permissions
3. Try logging out and back in
4. Check network connection

---

### Problem: Language Not Appearing in Dataset Type Form

**Symptoms**: Added language in system config, but not showing in dataset type creation

**Solutions**:
1. Verify you clicked **"Save Configuration"**
2. Refresh the dataset types page
3. Check browser cache - hard refresh (Ctrl+Shift+R)
4. Verify language code format is correct

---

### Problem: Invalid Value Errors

**Symptoms**: Can't save due to validation errors

**Solutions**:
- **Payout Rate**: Must be positive number
- **Review Counts**: Must be between 1-10 or 1-20 (check field hints)
- **Lock Timeout**: Must be between 30-600 seconds
- **Language Code**: Max 5 characters
- **Language Name**: Cannot be empty

---

## Mobile Responsiveness

The System Config page is fully responsive:

- **Desktop (1200px+)**: Cards displayed in grid (2-3 columns)
- **Tablet (768-1024px)**: Cards stack in single column
- **Mobile (< 768px)**: Simplified layout, full-width inputs, stacked buttons

Language inputs become vertical on mobile for better usability.

---

## Security & Audit

- All configuration changes are logged in the **Audit Log**
- Logs track: admin username, timestamp, changed fields
- Access is restricted to administrator role only
- Changes take effect immediately across the platform

---

## Related Pages

- [Dataset Types Guide](./DATASET_TYPES_GUIDE.md) - Uses languages from system config
- [User Management Guide](./USER_MANAGEMENT_GUIDE.md) - Reviewer role configuration
- [Admin Playbook](./ADMIN_PLAYBOOK.md) - Complete admin documentation

---

**Need Help?** Contact your platform administrator or check the [Admin Playbook](./ADMIN_PLAYBOOK.md).
