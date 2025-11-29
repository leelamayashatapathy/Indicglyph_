# 📘 Dataset Types Guide

**Feature:** Dataset Type Management  
**Location:** Admin → Dataset Types  
**Role Required:** Administrator

---

## Overview

Dataset Types are the foundation of IndicGlyph Data Studio. They define:

- **Schema**: What fields each dataset item contains
- **Modality**: Type of data (text, OCR, voice, image, video, conversation, custom)
- **Languages**: Which languages this dataset supports
- **Review Configuration**: How reviewers interact with the data
- **Payout Rates**: Custom payment per review (optional)

Think of a Dataset Type as a "template" or "schema" for your data.

---

## Accessing Dataset Types

1. Login as an administrator
2. Navigate to **Admin Panel** (top navigation)
3. Click **Dataset Types** in the admin sidebar
4. View all existing dataset types in a card grid

---

## Creating a Dataset Type

### Step-by-Step Instructions

1. Click the **"+ Create Dataset Type"** button (top right)
2. A creation form appears with tabs: **Basic Info**, **Fields**, **Languages**, **Review**

### Tab 1: Basic Info

#### Name **(Required)**
- **Purpose**: Unique identifier for this dataset type
- **Format**: Alphanumeric, spaces allowed
- **Examples**: 
  - "News Headlines OCR"
  - "Hindi Conversation QA"
  - "Product Image Labeling"
- **Best Practice**: Use descriptive, searchable names

#### Description
- **Purpose**: Explain what this dataset type is for
- **Format**: Free text, 1-2 sentences
- **Examples**:
  - "OCR-extracted news headlines in Hindi for sentiment analysis training"
  - "Customer service conversation turns for intent classification"

#### Modality **(Required)**
- **Purpose**: Defines the type of data and how it's displayed to reviewers
- **Options**:
  - **Text**: Plain text review (articles, headlines, descriptions)
  - **OCR**: Image with extracted text (scanned documents, receipts)
  - **Voice**: Audio transcription (speech-to-text data)
  - **Conversation**: Multi-turn dialogue (chatbot training data)
  - **Image**: Visual content review (photos, screenshots)
  - **Video**: Video content review (clips, recordings)
  - **Custom**: Custom modality (flexible schema)

**Choosing the Right Modality:**
- OCR pipeline items → Use `ocr`
- Audio transcription items → Use `voice` or `conversation`
- Plain text without media → Use `text`

---

### Tab 2: Fields

Fields define the data structure reviewers will see and potentially edit.

#### Adding a Field

1. Click **"+ Add Field"** button
2. Fill in field properties:

##### Field Key **(Required)**
- **Purpose**: Internal identifier for this field
- **Format**: Lowercase, underscores, no spaces
- **Examples**: `headline_text`, `transcription`, `sentiment_label`
- **Important**: Must be unique within this dataset type

##### Field Label **(Required)**
- **Purpose**: Human-readable name shown to reviewers
- **Format**: Any text
- **Examples**: "Headline Text", "Transcription", "Sentiment Label"

##### Field Type **(Required)**
- **text**: Single-line text input
- **textarea**: Multi-line text area
- **number**: Numeric input
- **select**: Dropdown menu (requires options)
- **checkbox**: True/false toggle

##### Required
- **Purpose**: Whether this field must have a value
- **Options**: Checkbox (checked = required)
- **Use Case**: Mark critical fields as required

##### Review Widget
- **Purpose**: How this field is displayed during review
- **Options**:
  - **Auto (based on field type)**: Default behavior
  - **Text Input**: Single-line text box
  - **Textarea**: Multi-line text box
  - **Image Viewer**: Display image with zoom/pan
  - **Audio Player**: Playback controls
  - **Video Player**: Video playback
  - **OCR Editor**: Specialized OCR text correction UI

**Recommendation**: Use "Auto" unless you need specific rendering

#### Field Examples

**Example 1: News Headline OCR**
```
Field 1:
  - Key: source_image_url
  - Label: Source Image
  - Type: text
  - Required: Yes
  - Widget: Image Viewer

Field 2:
  - Key: extracted_text
  - Label: Extracted Headline
  - Type: textarea
  - Required: Yes
  - Widget: Textarea
```

**Example 2: Voice Transcription**
```
Field 1:
  - Key: audio_file_url
  - Label: Audio Recording
  - Type: text
  - Required: Yes
  - Widget: Audio Player

Field 2:
  - Key: transcription
  - Label: Transcription
  - Type: textarea
  - Required: Yes
  - Widget: Textarea

Field 3:
  - Key: speaker_id
  - Label: Speaker ID
  - Type: text
  - Required: No
  - Widget: Text Input
```

---

### Tab 3: Languages

Select which languages this dataset type supports.

#### How It Works

1. Languages are sourced from **System Config** (Admin → System Config)
2. Check the box next to each language you want to support
3. At least one language must be selected

#### Use Cases

- **Single Language**: Hindi-only news dataset
- **Multi-Language**: Supports English, Hindi, and Tamil
- **All Languages**: General-purpose dataset

**Reviewers** can filter queue items by language preference.

---

### Tab 4: Review

#### Payout Rate (Optional)
- **Purpose**: Override system default payout for this specific dataset type
- **Format**: Decimal (e.g., 0.005 = half a cent)
- **Default**: Uses system config default rate if left empty
- **Use Case**: Pay more for complex review tasks

#### Review Guidelines (Optional)
- **Purpose**: Instructions for reviewers on how to review this dataset
- **Format**: Rich text, markdown supported
- **Examples**:
  - "Ensure headlines are grammatically correct"
  - "Flag items with offensive language"
  - "Verify speaker labels match audio"

**Best Practice**: Always provide clear guidelines for consistent reviews

---

### Completing Creation

1. Review all tabs - ensure required fields are filled
2. Click **"Create Dataset Type"** button at the bottom
3. Success message appears
4. New dataset type appears in the card grid
5. Status is **Active** by default

---

## Managing Existing Dataset Types

### Viewing Dataset Type Details

Each dataset type card shows:
- **Name** and **Description**
- **Modality** badge (color-coded)
- **Field Count**: How many fields defined
- **Languages**: List of supported languages
- **Payout Rate**: Custom or default
- **Active Status**: Green (active) or Red (inactive)

### Toggling Active Status

1. Locate the dataset type card
2. Click the **"Active"** / **"Inactive"** toggle button
3. Confirmation dialog appears
4. Status changes immediately

**What happens when inactive:**
- Existing items remain in database
- Items don't appear in reviewer queues
- Can't create new items for this type
- Admin can still view/manage items

### Editing a Dataset Type

1. Locate the dataset type card
2. Click the **"Edit"** button
3. Form appears with pre-filled data
4. Modify any field (except modality - this is locked after creation)
5. Click **"Update Dataset Type"**

**Note**: Changing fields after items exist may require data migration.

### Deleting a Dataset Type

1. Locate the dataset type card
2. Click the **"Delete"** button
3. Confirmation dialog: "Are you sure? This will fail if items exist."
4. Confirm deletion

**Important**: 
- ❌ Cannot delete if dataset items exist
- ✅ Can delete if no items have been created yet
- **Alternative**: Set to Inactive instead of deleting

---

## Common Workflows

### Workflow 1: Creating an OCR Dataset Type

**Goal**: Set up a dataset type for scanned Hindi news headlines

1. Click **"+ Create Dataset Type"**
2. **Basic Info** tab:
   - Name: "Hindi News Headlines OCR"
   - Description: "Scanned newspaper headlines in Hindi for OCR validation"
   - Modality: **OCR**
3. **Fields** tab:
   - Add Field 1:
     - Key: `source_image_url`
     - Label: "Source Image"
     - Type: text
     - Required: Yes
     - Widget: Image Viewer
   - Add Field 2:
     - Key: `extracted_text`
     - Label: "Extracted Headline"
     - Type: textarea
     - Required: Yes
     - Widget: Textarea
4. **Languages** tab:
   - Check: **Hindi**
5. **Review** tab:
   - Payout Rate: `0.004`
   - Guidelines: "Verify OCR extraction is accurate. Fix any mistakes. Flag if image quality is too poor."
6. Click **"Create Dataset Type"**

---

### Workflow 2: Creating a Conversation Dataset Type

**Goal**: Multi-turn customer service dialogues

1. Click **"+ Create Dataset Type"**
2. **Basic Info** tab:
   - Name: "Customer Support Conversations"
   - Description: "Multi-turn dialogues between customer and agent"
   - Modality: **Conversation**
3. **Fields** tab:
   - Add Field 1:
     - Key: `conversation_text`
     - Label: "Full Conversation"
     - Type: textarea
     - Required: Yes
   - Add Field 2:
     - Key: `intent_label`
     - Label: "Customer Intent"
     - Type: select
     - Required: Yes
     - Options: "billing, technical_support, account_management, other"
4. **Languages** tab:
   - Check: **English**, **Hindi**
5. **Review** tab:
   - Payout Rate: `0.010` (higher for complex task)
   - Guidelines: "Read full conversation. Identify primary customer intent. Flag if multiple intents exist."
6. Click **"Create Dataset Type"**

---

## Tips & Best Practices

### Schema Design

✅ **DO:**
- Keep field keys simple and consistent (`headline_text`, not `HeadLineText!!`)
- Use descriptive labels for reviewer clarity
- Mark only truly required fields as required
- Test schema with 5-10 items before bulk import

❌ **DON'T:**
- Create overly complex schemas (> 10 fields)
- Use special characters in field keys
- Change field keys after items exist
- Skip review guidelines

### Language Configuration

✅ **DO:**
- Configure languages in System Config first
- Select only languages you'll actually use
- Enable multiple languages for multilingual datasets
- Document language coverage in description

❌ **DON'T:**
- Select all languages by default
- Mix unrelated languages without reason
- Forget to add language when creating items later

### Modality Selection

✅ **DO:**
- Choose modality that matches your data type
- Use OCR for scanned documents
- Use Voice/Conversation for audio data
- Use Text for simple text-only tasks

❌ **DON'T:**
- Use wrong modality (affects reviewer UI)
- Change modality after creation
- Use Custom unless you have specific needs

---

## Troubleshooting

### Problem: Can't Delete Dataset Type

**Error**: "Cannot delete dataset type with existing items"

**Solution**:
1. Navigate to **Admin → Dataset Items**
2. Filter by this dataset type
3. Delete all items first, or
4. Set dataset type to **Inactive** instead

---

### Problem: Field Keys Not Unique

**Error**: "Field keys must be unique within a dataset type"

**Solution**:
- Review all field keys
- Ensure no duplicates exist
- Use clear, distinct names

---

### Problem: Languages Not Appearing

**Error**: No languages available to select

**Solution**:
1. Navigate to **Admin → System Config**
2. Add languages in "Available Languages" section
3. Save configuration
4. Return to dataset type creation
5. Refresh page

---

## Mobile Responsiveness

Dataset Types page is fully responsive:

- **Desktop**: Card grid with 2-3 columns
- **Tablet**: 2-column grid or single column
- **Mobile**: Single column, stacked form fields

Form fields stack vertically on mobile for better usability.

---

## Security & Permissions

- Only administrators can create/edit/delete dataset types
- Reviewers can only view active dataset types they're assigned to
- All actions are logged in audit trail

---

## Related Pages

- [Dataset Items Guide](./DATASET_ITEMS_GUIDE.md) - Managing items for dataset types
- [Manual Entry Guide](./ADD_ITEMS_MANUAL_GUIDE.md) - Adding items to dataset types
- [Bulk Upload Guide](./ADD_ITEMS_BULK_GUIDE.md) - Importing items in bulk
- [System Config Guide](./SYSTEM_CONFIG_GUIDE.md) - Configuring languages
- [Admin Playbook](./ADMIN_PLAYBOOK.md) - Complete admin documentation

---

**Need Help?** Contact your platform administrator or check the [Admin Playbook](./ADMIN_PLAYBOOK.md).
