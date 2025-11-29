# Unified Review Platform: Complete Architecture Plan
**IndicGlyphAI + Ecommerce Image Trustworthiness**

---

## 🎯 Core Philosophy

**Maximum Output, Minimum Cost, Maximum Fun**

- Reviewers should find it **game-like**, not boring, not cringe
- Unified platform = shared infrastructure = lower costs
- Variety prevents fatigue = higher reviewer retention
- One reviewer pool serves both modules = better utilization

---

## 🏗️ Architecture Overview

### Platform Structure

```
Unified Review Platform
├── Core Platform (Shared Infrastructure)
│   ├── User Management & RBAC
│   ├── Reviewer Pool (Shared)
│   ├── Gamification System
│   ├── Task Routing Engine
│   ├── Admin Dashboard
│   └── Export System
│
├── Module 1: IndicGlyph (OCR/Glyph Review)
│   └── Admin: Upload → Slice → OCR → Queue
│
└── Module 2: Ecommerce Image Trustworthiness
    └── Admin: Scraper → Pre-filter → Queue
```

---

## 🎮 Reviewer Experience: Game-Like Design

### Task Variety Strategy
**Answer: Mixed Queue with Smart Rotation**

- Reviewers get **mixed tasks** (glyph OR image) from unified queue
- **Smart rotation**: After 5 glyphs → auto-suggest image (and vice versa)
- **"Streak bonuses"**: Review 10 mixed tasks → bonus XP
- **Variety prevents boredom**: Different UI, different mental load

### Gamification Enhancements

**1. Task Type Badges**
- "Glyph Master" badge for 100+ glyph reviews
- "Image Detective" badge for 100+ image reviews
- "Universal Reviewer" badge for 50+ of each type

**2. Daily Challenges**
- "Review 5 glyphs today" → bonus XP
- "Review 10 images today" → bonus XP
- "Mix it up: 3 glyphs + 3 images" → extra bonus

**3. Streak System**
- Daily login streak (separate from review count)
- "Hot streak" bonus: 7 days in a row = 2x XP for that day
- Visual streak counter in app

**4. Level Progression**
- Levels unlock new features (e.g., Level 10 = see review history)
- Level 20 = "Trusted Reviewer" status (higher pay per review)
- Level 50 = "Expert Reviewer" (can review "gold" tasks)

**5. Mini-Games (Optional, Low Cost)**
- "Guess the trust score" before reviewing → see if you match AI prediction
- "Spot the difference" between similar images
- Leaderboard races (daily/weekly)

### Anti-Cringe Measures

**1. No Forced Social Elements**
- No public comments/chat (keeps it professional)
- Leaderboard is opt-in (privacy-friendly)
- No "share your earnings" prompts

**2. Clean, Professional UI**
- Modern, minimal design (not childish)
- Clear task instructions (no condescending tone)
- Respectful language throughout

**3. Fair Compensation**
- Transparent pay structure (no hidden fees)
- Clear XP → earnings conversion
- No "gacha" mechanics or random rewards

---

## 📊 Task Routing & Priority

### Unified Task Queue Logic

**Priority Order:**
1. **Urgent tasks** (admin-flagged, deadline approaching)
2. **Balanced rotation** (alternate between modules if available)
3. **Reviewer preference** (if reviewer opts into specific module)
4. **Quality-based routing** (new reviewers get easier tasks first)

**Smart Rotation Algorithm:**
```python
def get_next_task(reviewer):
    # Check reviewer's recent task history
    recent_tasks = get_last_10_tasks(reviewer)
    
    # If all recent tasks are same type, suggest opposite
    if all_same_type(recent_tasks):
        return get_task_from_other_module(reviewer)
    
    # Otherwise, round-robin or priority-based
    return get_highest_priority_task(reviewer)
```

**Module Config: Separate but Unified**

- Each module has its own config (IndicGlyph: OCR settings, Ecommerce: review thresholds)
- Shared config: XP rates, payment rates, reviewer restrictions
- Admin can adjust per-module settings independently
- Unified reviewer pool sees both types

---

## 🗄️ Database Architecture (Django)

### Core Models

```python
# Core Platform
class User(AbstractUser):
    role = CharField(choices=['admin', 'moderator', 'reviewer'])
    xp = IntegerField(default=0)
    level = IntegerField(default=1)
    total_earnings = DecimalField(default=0)
    streak_days = IntegerField(default=0)
    last_login_date = DateField(null=True)
    preferred_modules = JSONField(default=list)  # ['indicglyph', 'ecommerce']

class Task(AbstractBaseModel):
    module_type = CharField(choices=['indicglyph', 'ecommerce'])
    status = CharField(choices=['pending', 'in_progress', 'reviewed', 'verified'])
    priority = IntegerField(default=0)  # Higher = more urgent
    assigned_to = ForeignKey(User, null=True)
    review_count = IntegerField(default=0)
    skip_count = IntegerField(default=0)
    created_at = DateTimeField(auto_now_add=True)

class Review(AbstractBaseModel):
    task = ForeignKey(Task)
    reviewer = ForeignKey(User)
    submitted_at = DateTimeField(auto_now_add=True)
    # Module-specific fields in subclasses

class ReviewerStats(AbstractBaseModel):
    reviewer = OneToOneField(User)
    total_reviews = IntegerField(default=0)
    glyph_reviews = IntegerField(default=0)
    image_reviews = IntegerField(default=0)
    accuracy_score = FloatField(default=0.0)
    trust_score = FloatField(default=0.0)
    badges = JSONField(default=list)
```

### Module-Specific Models

```python
# IndicGlyph Module
class Slice(Task):
    file = ForeignKey('File')
    x = IntegerField()
    y = IntegerField()
    w = IntegerField()
    h = IntegerField()
    ocr_text = TextField()
    ocr_confidence = FloatField()

class SliceReview(Review):
    translation = TextField()
    phonetics = TextField()
    explanation = TextField()
    tags = JSONField(default=list)

# Ecommerce Module
class Image(Task):
    image_id = CharField(unique=True)
    file_name = CharField()
    file_format = CharField()
    width = IntegerField()
    height = IntegerField()
    file_size_bytes = IntegerField()
    image_hash = CharField()
    source_url = URLField()
    source_platform = CharField()
    category = CharField()
    use_case = CharField()
    quality_tier = CharField()
    # ... all fields from dataset_schema.json

class ImageReview(Review):
    trust_score = IntegerField()  # 0-100
    realism_score = IntegerField()  # 0-100
    lighting_score = IntegerField()  # 0-100
    over_editing_flag = BooleanField()
    comments = TextField(blank=True)

class ReviewSummary(AbstractBaseModel):
    image = OneToOneField(Image)
    average_trust_score = FloatField()
    std_dev_trust_score = FloatField()
    confidence = FloatField()
    review_count = IntegerField()
    calculated_at = DateTimeField(auto_now=True)
```

---

## 🎯 Task Routing Implementation

### Reviewer Choice Strategy

**Answer: Opt-In with Smart Defaults**

- **Default**: Reviewers get mixed tasks (both modules)
- **Opt-in**: Reviewers can enable "Module Preferences" in settings
  - "I prefer glyph reviews" → 70% glyph, 30% image
  - "I prefer image reviews" → 70% image, 30% glyph
  - "Give me variety" → 50/50 split
- **Admin override**: Admin can assign module-specific batches if needed

### Task Priority Logic

**Priority Levels:**
1. **Urgent (Priority 10)**: Admin-flagged, deadline < 24h
2. **High (Priority 7)**: Tasks waiting > 48h, low review count
3. **Normal (Priority 5)**: Standard queue
4. **Low (Priority 3)**: New tasks, no rush

**Module Balance:**
- If glyph queue is 2x larger than image queue → prioritize glyphs
- If image queue is 2x larger than glyph queue → prioritize images
- Auto-balance to prevent one module from starving

---

## 👨‍💼 Admin Workflow

### Unified Admin Dashboard

**Main Dashboard:**
- **Overview**: Total tasks, reviewers active, earnings paid today
- **Module Tabs**: Switch between IndicGlyph and Ecommerce
- **Reviewer Management**: Unified across modules
- **Config**: Shared + module-specific settings

**IndicGlyph Module Admin:**
- Upload pages → Slice → OCR → Queue tasks
- View slice queue, assign batches
- Monitor OCR quality, retry failed OCRs

**Ecommerce Module Admin:**
- View scraper status (harvest_log_dashboard integration)
- Monitor image queue, flag monitoring
- Pre-filter settings, quality thresholds
- Export dataset (JSON matching dataset_schema.json)

**Shared Admin Features:**
- Reviewer management (ban, promote, adjust XP)
- Config management (XP rates, payment rates)
- Export system (both modules)
- Audit logs (all actions)

---

## 📱 Mobile App Strategy

### React Native App Structure

**Screens:**
1. **Home/Dashboard**: Today's stats, streak, level progress
2. **Task Queue**: Next task (glyph or image), with type badge
3. **Review Screen**: Dynamic UI based on task type
   - Glyph: Text annotation fields
   - Image: Scoring sliders + image viewer
4. **History**: Past reviews, earnings, badges
5. **Profile**: Stats, settings, module preferences

**Task Type Detection:**
```typescript
const TaskReviewScreen = ({ task }) => {
  if (task.module_type === 'indicglyph') {
    return <GlyphReviewUI task={task} />
  } else if (task.module_type === 'ecommerce') {
    return <ImageReviewUI task={task} />
  }
}
```

**Gamification UI:**
- Streak counter (top bar)
- XP progress bar (after each review)
- Badge notifications (when earned)
- Level-up animation (celebratory, not cringe)

---

## 💰 Cost Optimization

### Reviewer Incentives (Low Cost, High Engagement)

**1. XP-Based Earnings**
- Base: 1 XP per review
- Bonus: +1 XP for full annotation (all fields filled)
- Streak: +0.5 XP per day of streak (max +5 XP)
- Daily challenge: +2 XP for completion

**2. Payment Structure**
- ₹200 per 200 reviews (as per IndicGlyph spec)
- Works across both modules (unified earnings)
- Payout every 200 reviews (not per module)

**3. Badge System (Zero Cost)**
- Pure gamification, no monetary value
- Visual recognition, leaderboard status
- Unlock features (e.g., "Expert Reviewer" badge = can review gold tasks)

**4. Leaderboards (Engagement, No Cost)**
- Daily leaderboard (resets daily)
- Weekly leaderboard (top 10 get featured)
- All-time leaderboard (hall of fame)
- Opt-in only (privacy-friendly)

---

## 🔄 Integration Points

### Scraper → Ecommerce Module

1. **Scraper outputs** JSON per `dataset_schema.json`
2. **Django admin** imports JSON → creates `Image` tasks
3. **Pre-filtering** happens before import (watermark, size, etc.)
4. **Task queue** populates automatically

### Harvest Log Dashboard → Admin

1. **Dashboard** shows scraper health (separate service)
2. **Admin** can trigger imports from dashboard
3. **Flag monitoring** alerts admin to low-quality domains
4. **Export** generates dataset JSON for delivery

---

## 📋 Implementation Phases

### Phase 1: Core Platform (Django Migration)
- Migrate IndicGlyphAI from FastAPI → Django
- Set up core models (User, Task, Review)
- Implement RBAC, gamification system
- Build unified admin dashboard

### Phase 2: IndicGlyph Module
- Port IndicGlyph workflow to Django
- Admin upload/slice interface
- Reviewer glyph review UI
- OCR integration

### Phase 3: Ecommerce Module
- Image models (matching dataset_schema.json)
- Scraper integration (JSON import)
- Reviewer image review UI
- Review summary aggregation

### Phase 4: Mobile App
- React Native app
- Unified task queue
- Module-specific review UIs
- Gamification features

### Phase 5: Polish & Scale
- Performance optimization
- Load testing
- Reviewer onboarding flow
- Analytics dashboard

---

## ✅ Success Metrics

**Reviewer Engagement:**
- Daily active reviewers
- Average reviews per reviewer per day
- Reviewer retention (30-day, 90-day)
- Task completion rate (vs skip rate)

**Platform Efficiency:**
- Tasks reviewed per day (both modules)
- Time to review (average)
- Reviewer utilization (active vs idle)
- Cost per review

**Quality:**
- Inter-reviewer agreement (for images)
- Review accuracy (for glyphs)
- Flag detection accuracy
- Export dataset quality

---

## 🎯 Key Decisions Summary

1. **Reviewer Choice**: Opt-in module preferences, default = mixed
2. **Task Priority**: Balanced rotation with urgent override
3. **Module Config**: Separate per module, shared for platform
4. **Gamification**: XP-based, badge system, streaks, challenges
5. **Mobile**: React Native, unified app, module-specific UIs
6. **Cost**: Low-cost incentives (XP, badges) + fair payment structure

---

**Next Steps**: Review this plan, then we'll start with Phase 1 (Django migration + core platform setup).

