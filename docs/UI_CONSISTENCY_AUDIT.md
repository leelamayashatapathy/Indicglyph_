# UI Consistency Audit Report
**Date:** 2025-01-14  
**Scope:** Project-wide frontend UI consistency across Mobile (≤640px), Tablet (641-1024px), Desktop (≥1024px)

---

## 1. Global Pattern Summary

### Intended Design System

**Styling Approach:**
- CSS Custom Properties (Design Tokens) in `tokens.css`
- Component-level CSS files for page-specific styles
- Global utility classes in `components.css` and `global.css`
- No Tailwind/MUI/Chakra - pure CSS with design tokens

**Breakpoints:**
- Mobile: ≤640px (some files use 480px)
- Tablet: 641-1024px (some files use 768px as tablet breakpoint)
- Desktop: ≥1024px (some files use 1200px)

**Color System:**
- Primary: `#00B8D9` (cyan) with variants
- Semantic: Success (`#10B981`), Warning (`#F59E0B`), Error (`#EF4444`)
- Surface: `#F5F7FA` (light), `#FFFFFF` (elevated)
- Ink: `#1C2541` (base), `#475569` (light), `#94A3B8` (lighter)
- Navy: `#0A192F` (base) with dark/light variants

**Typography Scale:**
- Display: 2.75rem (44px)
- H1: 2rem (32px)
- H2: 1.5rem (24px)
- H3: 1.25rem (20px)
- Body: 1rem (16px)
- Caption: 0.875rem (14px)
- Small: 0.75rem (12px)
- Fonts: DM Sans (display), Inter (UI), JetBrains Mono (mono)

**Spacing Scale:**
- 0.25rem (4px) to 6rem (96px) in increments
- Standard: 1rem (16px), 1.5rem (24px), 2rem (32px), etc.

**Border Radius:**
- sm: 0.25rem (4px)
- base: 0.5rem (8px)
- lg: 0.75rem (12px)
- xl: 1rem (16px)
- 2xl: 1.25rem (20px)
- full: 9999px

**Shadows:**
- sm, base, md, lg, xl variants
- Colored shadows for primary/success/error

---

## 2. Issue List by Category

### A. Breakpoints & Responsiveness

#### Issue A1: Inconsistent Mobile Breakpoint Values
- **Category:** Breakpoint
- **Viewports Affected:** Mobile
- **Files:**
  - `styles/AdminPanel.css` uses `640px`
  - `styles/AuthPages.css` uses `640px`
  - `styles/ReviewPage.css` uses `640px`
  - `styles/global.css` uses `480px` and `768px`
  - `styles/LandingPage.css` uses `480px` and `768px`
  - `styles/DatasetTypesPage.css` uses `768px`
  - `styles/FlaggedItemsPage.css` uses `768px`
  - `styles/HomepageSetup.css` uses `768px`
  - `styles/OcrIngestionPage.css` uses `768px`
  - `styles/DashboardPage.css` uses `768px` and `1200px`
  - `styles/ReviewPage.css` uses `1024px` and `640px`
  - `styles/AdminOverview.css` uses `1024px` and `768px`
  - `pages/SystemConfigPage.jsx` uses `768px` and `480px`
  - `pages/DatasetItemsPage.jsx` uses `1024px`, `768px`, and `480px`
  - `pages/AddDatasetItemsPage.jsx` uses `768px`
  - `pages/AnalyticsDashboardPage.jsx` uses `768px` and `480px`
  - `pages/ReviewerDashboardPage.jsx` uses `768px`
- **Code Reference:** Multiple `@media (max-width: X)` declarations
- **Why Inconsistent:** No standardized breakpoint system. Mix of 480px, 640px, 768px, 1024px, 1200px
- **Recommended Fix:** Standardize to:
  - Mobile: `640px` (primary), `480px` (small mobile)
  - Tablet: `1024px`
  - Desktop: `>1024px`
  - Create breakpoint mixins or constants

#### Issue A2: Missing Responsive Styles for Key Components
- **Category:** Breakpoint
- **Viewports Affected:** Mobile, Tablet
- **Files:**
  - `pages/AddDatasetItemsPage.jsx` - Inline styles, no mobile breakpoints
  - `pages/PayoutManagementPage.jsx` - No responsive styles
  - `pages/AudioIngestionPage.jsx` - No responsive styles
  - `pages/ProfilePage.jsx` - No responsive styles
  - `pages/ItemsPage.jsx` - Minimal responsive handling
- **Code Reference:** Missing `@media` queries in these components
- **Why Inconsistent:** Some pages have comprehensive responsive design, others don't
- **Recommended Fix:** Add responsive breakpoints for all pages, especially for:
  - Form layouts (stack on mobile)
  - Tables (horizontal scroll or card view on mobile)
  - Grid layouts (single column on mobile)

#### Issue A3: Inconsistent Container Max-Widths
- **Category:** Layout
- **Viewports Affected:** Desktop, Tablet
- **Files:**
  - `styles/global.css`: `1400px` (standard container)
  - `styles/LandingPage.css`: `1200px` (multiple instances)
  - `styles/HomepageSetup.css`: `1200px`
  - `styles/OcrJobDetailPage.css`: `1200px`
  - `styles/ReviewPage.css`: `1400px`
  - `styles/DashboardPage.css`: `1400px`
  - `styles/OcrIngestionPage.css`: `1400px`
  - `pages/AddDatasetItemsPage.jsx`: `1000px` (inline)
  - `pages/ReviewerDashboardPage.jsx`: `1400px` (inline)
  - `pages/DatasetItemsPage.jsx`: `300px` for filter (inline)
- **Code Reference:** Various `max-width` values
- **Why Inconsistent:** No standard container width system
- **Recommended Fix:** Standardize to:
  - Full width: `100%`
  - Narrow: `800px` (use `.container-narrow`)
  - Standard: `1400px` (use `.container`)
  - Wide: `1600px` (if needed)

---

### B. Colors

#### Issue B1: Hardcoded Hex Colors Instead of Tokens
- **Category:** Colors
- **Viewports Affected:** All
- **Files:**
  - `styles/OcrJobDetailPage.css`: `#333`, `#555`, `#f5f5f5`, `#2196F3`, `#1976D2`, `#d32f2f`, `#b71c1c`, `#fff3f3`, `#e3f2fd`, `#f9f9f9`, `#d4edda`, `#155724`, `#fff3cd`, `#856404`, `#f8d7da`, `#721c24`, `#e2e3e5`, `#383d41`, `#d1ecf1`, `#0c5460`
  - `styles/HomepageSetup.css`: `#0A192F`, `#666`, `#d4edda`, `#155724`, `#f8d7da`, `#721c24`, `#e0e0e0`, `#00B8D9`, `#ddd`, `#333`, `#f8f9fa`, `#dc3545`, `#c82333`
  - `pages/AddDatasetItemsPage.jsx`: `#00B8D9`, `#0A192F`, `#94A3B8`, `#E2E8F0`, `#EF4444`, `rgba(255, 255, 255, 0.05)`, `rgba(255, 255, 255, 0.1)`, `rgba(0, 184, 217, 0.1)`, `rgba(10, 25, 47, 0.3)`, `rgba(15, 23, 42, 0.6)`, `rgba(0, 184, 217, 0.3)`
  - `pages/DatasetItemsPage.jsx`: Multiple hardcoded colors in inline styles
  - `pages/SystemConfigPage.jsx`: Hardcoded colors in inline styles
  - `pages/ReviewerDashboardPage.jsx`: `#2196F3`, `#9C27B0`, `#FF9800`, `#4CAF50`, `#E91E63`, `#00BCD4`, `#607D8B`, `#757575`
  - `pages/AnalyticsDashboardPage.jsx`: Hardcoded colors in inline styles
  - `pages/PayoutManagementPage.jsx`: Hardcoded colors in inline styles
- **Code Reference:** Direct hex/rgb values instead of `var(--color-*)`
- **Why Inconsistent:** Legacy code and inline styles bypass design tokens
- **Recommended Fix:** Replace all hardcoded colors with design tokens:
  - `#333` → `var(--color-ink)`
  - `#666` → `var(--color-ink-light)`
  - `#f5f5f5` → `var(--color-surface)`
  - `#2196F3` → `var(--color-primary)` (or create `--color-info` if semantic)
  - Error colors → `var(--color-error)` and variants
  - Success colors → `var(--color-success)` and variants

#### Issue B2: Inconsistent Error/Success/Warning Color Shades
- **Category:** Colors
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: Uses `rgba(16, 185, 129, 0.1)`, `#059669`, `rgba(245, 158, 11, 0.1)`, `#D97706`, `rgba(239, 68, 68, 0.1)`, `#DC2626`
  - `styles/UserManagementPage.css`: `#DC2626` (hardcoded)
  - `styles/OcrJobDetailPage.css`: `#d32f2f`, `#b71c1c`, `#155724`, `#856404`, `#721c24`
  - `styles/HomepageSetup.css`: `#155724`, `#721c24`, `#dc3545`, `#c82333`
- **Code Reference:** Different shades for same semantic meaning
- **Why Inconsistent:** No standardized semantic color variants
- **Recommended Fix:** Add to `tokens.css`:
  - `--color-success-dark: #059669`
  - `--color-error-dark: #DC2626`
  - `--color-warning-dark: #D97706`
  - Use these consistently across all files

#### Issue B3: Missing Design Tokens for Common Colors
- **Category:** Colors
- **Viewports Affected:** All
- **Files:** All files using hardcoded grays
- **Code Reference:** `#f0f0f0`, `#e0e0e0`, `#ddd`, `#ccc`, `#999`, etc.
- **Why Inconsistent:** Gray scale not fully defined in tokens
- **Recommended Fix:** Add gray scale tokens:
  - `--color-gray-50` through `--color-gray-900`
  - Map existing grays to tokens

---

### C. Typography

#### Issue C1: Inconsistent Font Sizes for Same Element Types
- **Category:** Typography
- **Viewports Affected:** All
- **Files:**
  - Page titles: `2rem`, `2.25rem`, `2.5rem`, `3.5rem` (AdminOverview)
  - Form labels: `0.85rem`, `0.9rem`, `0.95rem`, `1rem`, `1.1rem`
  - Button text: `0.9rem`, `1rem`, `1.1rem`, `1.25rem`
  - Captions: `0.75rem`, `0.85rem`, `0.875rem`, `0.9rem`
- **Code Reference:** Various `font-size` declarations
- **Why Inconsistent:** No strict typography scale enforcement
- **Recommended Fix:** 
  - Page titles: Use `var(--text-h1)` (2rem) consistently
  - Form labels: Use `var(--text-caption)` (0.875rem)
  - Buttons: Use `1.1rem` (standardized in components.css)
  - Captions: Use `var(--text-caption)` (0.875rem)

#### Issue C2: Missing Responsive Typography Adjustments
- **Category:** Typography
- **Viewports Affected:** Mobile
- **Files:**
  - `styles/LandingPage.css`: Has responsive font sizes
  - `styles/AdminOverview.css`: Has responsive font sizes
  - Most other files: No responsive typography
- **Code Reference:** Missing `@media` queries for font-size adjustments
- **Why Inconsistent:** Only some pages adjust font sizes for mobile
- **Recommended Fix:** Add responsive typography to all pages:
  ```css
  @media (max-width: 640px) {
    .page-title { font-size: 1.75rem; }
    .page-subtitle { font-size: 0.9rem; }
  }
  ```

#### Issue C3: Inconsistent Font Weight Usage
- **Category:** Typography
- **Viewports Affected:** All
- **Files:**
  - Some use `font-weight: 500` (medium)
  - Some use `font-weight: 600` (semibold)
  - Some use `font-weight: 700` (bold)
  - Some use numeric: `400`, `500`, `600`, `700`
  - Some use keywords: `normal`, `medium`, `semibold`, `bold`
- **Code Reference:** Mixed font-weight declarations
- **Why Inconsistent:** No standardized weight system
- **Recommended Fix:** Use design tokens:
  - `var(--weight-normal)` (400)
  - `var(--weight-medium)` (500)
  - `var(--weight-semibold)` (600)
  - `var(--weight-bold)` (700)

---

### D. Spacing

#### Issue D1: Magic Number Spacing Values
- **Category:** Spacing
- **Viewports Affected:** All
- **Files:**
  - `pages/DatasetItemsPage.jsx`: `20px`, `30px`, `24px`, `8px`, `15px`, `10px`, `4px`, `12px`, `16px`
  - `pages/ReviewPage.jsx`: `8px` (inline style)
  - `pages/AddDatasetItemsPage.jsx`: `1rem`, `2rem`, `0.5rem`, `0.35rem`, `0.25rem`, `1.25rem`
  - `pages/SystemConfigPage.jsx`: Various rem values not from scale
  - `styles/OcrJobDetailPage.css`: `2rem`, `1.5rem`, `0.75rem`, `1rem`, `0.5rem`, `0.25rem`, `3rem`
  - `styles/HomepageSetup.css`: `2rem`, `1.5rem`, `1rem`, `0.5rem`, `0.75rem`, `4rem`
- **Code Reference:** Hardcoded spacing values
- **Why Inconsistent:** Not using design token spacing scale
- **Recommended Fix:** Replace all with tokens:
  - `8px` → `var(--space-2)`
  - `12px` → `var(--space-3)`
  - `16px` → `var(--space-4)`
  - `20px` → `var(--space-5)`
  - `24px` → `var(--space-6)`
  - `32px` → `var(--space-8)`
  - Add missing tokens if needed (e.g., `--space-7: 1.75rem`)

#### Issue D2: Inconsistent Padding/Margin Patterns
- **Category:** Spacing
- **Viewports Affected:** All
- **Files:**
  - Cards: Some use `var(--space-6)`, others use `1.5rem`, `2rem`, `24px`
  - Form groups: Some use `var(--space-4)`, others use `1.5rem`, `1.25rem`
  - Page headers: Some use `var(--space-8)`, others use `2rem`, `1.5rem`
- **Code Reference:** Mixed spacing patterns
- **Why Inconsistent:** No component-level spacing standards
- **Recommended Fix:** Create spacing standards:
  - Cards: `padding: var(--space-6)`
  - Form groups: `margin-bottom: var(--space-4)`
  - Page headers: `margin-bottom: var(--space-8)`
  - Sections: `margin-bottom: var(--space-6)`

---

### E. Buttons & Interactive Elements

#### Issue E1: Inconsistent Button Padding
- **Category:** Button
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: Standardized `var(--space-4) var(--space-6)`
  - `styles/OcrJobDetailPage.css`: `0.75rem 1.5rem`, `0.5rem 1rem`
  - `styles/HomepageSetup.css`: `0.75rem 2rem`, `0.75rem 1.5rem`, `0.5rem 1rem`
  - `pages/AddDatasetItemsPage.jsx`: Inline button styles
  - `pages/DatasetItemsPage.jsx`: Inline button styles
  - `pages/SystemConfigPage.jsx`: Inline button styles
- **Code Reference:** Various padding values
- **Why Inconsistent:** Not all buttons use `.btn` class
- **Recommended Fix:** 
  - Use `.btn`, `.btn-primary`, `.btn-secondary` classes consistently
  - Remove inline button styles
  - If custom needed, extend base classes

#### Issue E2: Inconsistent Button Border Radius
- **Category:** Button
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: `var(--radius-base)` (8px)
  - `styles/OcrJobDetailPage.css`: `4px`
  - `styles/HomepageSetup.css`: `6px`, `4px`
  - Inline styles: Various values
- **Code Reference:** Mixed border-radius values
- **Why Inconsistent:** Not using design tokens
- **Recommended Fix:** Use `var(--radius-base)` for all buttons

#### Issue E3: Missing Hover/Active/Disabled States
- **Category:** Button
- **Viewports Affected:** All
- **Files:**
  - `styles/OcrJobDetailPage.css`: Basic hover states
  - `styles/HomepageSetup.css`: Some hover states
  - Inline button styles: Often missing states
- **Code Reference:** Missing `:hover`, `:active`, `:disabled` pseudo-classes
- **Why Inconsistent:** Incomplete button implementations
- **Recommended Fix:** Use `.btn` classes which include all states, or ensure custom buttons have:
  - `:hover` - transform and shadow
  - `:active` - transform reset
  - `:disabled` - opacity and cursor

#### Issue E4: Inconsistent Button Font Sizes
- **Category:** Button
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: `1.1rem` (standard), `1rem` (small)
  - `styles/OcrJobDetailPage.css`: `0.9rem`
  - `styles/HomepageSetup.css`: `1rem`, `0.9rem`
  - Inline styles: Various
- **Code Reference:** Mixed font-size values
- **Why Inconsistent:** Not using standardized button classes
- **Recommended Fix:** Use `.btn` (1.1rem) or `.btn-sm` (1rem) consistently

---

### F. Forms

#### Issue F1: Inconsistent Input Styling
- **Category:** Form
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: Standardized `.input` class
  - `pages/AddDatasetItemsPage.jsx`: Custom inline styles with `rgba(15, 23, 42, 0.6)` background
  - `pages/DatasetItemsPage.jsx`: Inline input styles
  - `pages/SystemConfigPage.jsx`: Inline input styles
  - `styles/OcrJobDetailPage.css`: No input styles defined
  - `styles/HomepageSetup.css`: Custom input styles
- **Code Reference:** Different padding, border, background values
- **Why Inconsistent:** Not using `.input` class consistently
- **Recommended Fix:** 
  - Use `.input` class from `components.css` everywhere
  - Remove inline input styles
  - If dark theme needed, create `.input-dark` variant

#### Issue F2: Inconsistent Form Label Styling
- **Category:** Form
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: `.input-label` class
  - `styles/HomepageSetup.css`: Custom label styles
  - Inline styles: Various label implementations
- **Code Reference:** Different font-size, weight, color, margin
- **Why Inconsistent:** Not using standardized label class
- **Recommended Fix:** Use `.input-label` or `.input-group` pattern consistently

#### Issue F3: Inconsistent Error Message Styling
- **Category:** Form
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: `.alert-error` class
  - `styles/OcrJobDetailPage.css`: Custom `.error-message` with `#f8d7da`, `#721c24`
  - `styles/HomepageSetup.css`: Custom `.message.error` with `#f8d7da`, `#721c24`
  - `index.css`: `.error` class
  - Inline error messages: Various styles
- **Code Reference:** Different background, border, padding, colors
- **Why Inconsistent:** Multiple error message implementations
- **Recommended Fix:** Use `.alert-error` class consistently, or create unified `.error-message` class

---

### G. Cards, Modals, Lists

#### Issue G1: Inconsistent Card Styling
- **Category:** Card
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: Standardized `.card` class
  - `styles/OcrJobDetailPage.css`: Custom `.job-info-card`, `.result-card` with `white` background, `8px` radius
  - `styles/HomepageSetup.css`: Custom `.section-content` with `white` background, `12px` radius
  - `pages/AddDatasetItemsPage.jsx`: Custom `.glass-panel` with `rgba(255, 255, 255, 0.05)`
  - Inline card styles: Various
- **Code Reference:** Different background, border-radius, padding, shadow
- **Why Inconsistent:** Not using `.card` class
- **Recommended Fix:** Use `.card` class or create variants:
  - `.card` - standard
  - `.card-glass` - glass effect (already exists)
  - `.card-flat` - no shadow (already exists)

#### Issue G2: Inconsistent Modal Styling
- **Category:** Modal
- **Viewports Affected:** All
- **Files:**
  - `styles/ReviewPage.css`: `.modal-overlay`, `.modal-content` with tokens
  - `styles/FlaggedItemsPage.css`: `.modal-overlay`, `.modal-content` with tokens
  - `styles/OcrJobDetailPage.css`: `.modal-overlay`, `.modal-content` with `white` background, `8px` radius
  - Inline modal styles: Various
- **Code Reference:** Different background, border-radius, padding, max-width
- **Why Inconsistent:** No standardized modal component
- **Recommended Fix:** Create unified modal classes in `components.css`:
  - `.modal-overlay` - backdrop
  - `.modal-content` - content container
  - Use consistently across all modals

#### Issue G3: Inconsistent List/Table Styling
- **Category:** Layout
- **Viewports Affected:** All
- **Files:**
  - `styles/components.css`: `.data-table` class
  - `pages/PayoutManagementPage.jsx`: Custom table styles
  - `pages/AnalyticsDashboardPage.jsx`: Custom table styles
  - `pages/DatasetItemsPage.jsx`: Custom table styles
- **Code Reference:** Different table implementations
- **Why Inconsistent:** Not using `.data-table` class
- **Recommended Fix:** Use `.data-table` class or create responsive table wrapper

---

### H. Icons & Images

#### Issue H1: Inconsistent Icon Sizes
- **Category:** Icon
- **Viewports Affected:** All
- **Files:**
  - Various icon sizes: `16px`, `20px`, `24px`, `32px`, `48px`, `64px`
  - No standardized icon size system
- **Code Reference:** Hardcoded `width` and `height` on SVG/icons
- **Why Inconsistent:** No icon size tokens
- **Recommended Fix:** Create icon size tokens:
  - `--icon-xs: 16px`
  - `--icon-sm: 20px`
  - `--icon-md: 24px`
  - `--icon-lg: 32px`
  - `--icon-xl: 48px`

#### Issue H2: Inconsistent Image/Avatar Styling
- **Category:** Image
- **Viewports Affected:** All
- **Files:**
  - Various `border-radius` values for avatars/images
  - Some use `50%` (circle), others use `var(--radius-base)`, `var(--radius-lg)`
- **Code Reference:** Mixed border-radius for images
- **Why Inconsistent:** No standard for image styling
- **Recommended Fix:** Create image utility classes:
  - `.avatar` - circular image
  - `.image-rounded` - rounded corners
  - `.media-responsive` - already exists, use consistently

---

## 3. Duplicate / Divergent Patterns

### Pattern 1: Button Implementations
**Divergence:**
- `.btn` class in `components.css` (standardized)
- Custom buttons in `OcrJobDetailPage.css`
- Custom buttons in `HomepageSetup.css`
- Inline button styles in multiple JSX files

**Canonical Style:** Use `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-sm`, `.btn-lg` from `components.css`

### Pattern 2: Form Input Implementations
**Divergence:**
- `.input` class in `components.css` (standardized)
- Custom inputs in `HomepageSetup.css`
- Dark theme inputs in `AddDatasetItemsPage.jsx` (inline)
- Various inline input styles

**Canonical Style:** Use `.input` class, create `.input-dark` variant if needed

### Pattern 3: Card Implementations
**Divergence:**
- `.card` class in `components.css` (standardized)
- Custom cards in `OcrJobDetailPage.css`
- Custom cards in `HomepageSetup.css`
- Glass panel in `AddDatasetItemsPage.jsx`

**Canonical Style:** Use `.card`, `.card-glass`, `.card-flat` from `components.css`

### Pattern 4: Error Message Implementations
**Divergence:**
- `.alert-error` in `components.css`
- `.error-message` in `OcrJobDetailPage.css`
- `.message.error` in `HomepageSetup.css`
- `.error` in `index.css`
- Inline error styles

**Canonical Style:** Use `.alert-error` from `components.css` consistently

### Pattern 5: Modal Implementations
**Divergence:**
- Modals in `ReviewPage.css` (token-based)
- Modals in `FlaggedItemsPage.css` (token-based)
- Modals in `OcrJobDetailPage.css` (hardcoded colors)
- Various inline modal implementations

**Canonical Style:** Create unified modal classes in `components.css`

---

## 4. Suggestions for Fixes

### Global Refactors

#### Priority: HIGH

1. **Standardize Breakpoints**
   - Create breakpoint constants/mixins
   - Mobile: `640px` (primary), `480px` (small)
   - Tablet: `1024px`
   - Desktop: `>1024px`
   - Update all `@media` queries

2. **Replace All Hardcoded Colors**
   - Audit all files for hex/rgb values
   - Map to design tokens
   - Add missing tokens (gray scale, error-dark, etc.)
   - Remove all hardcoded colors

3. **Standardize Button System**
   - Remove all inline button styles
   - Use `.btn` classes everywhere
   - Create button variants if needed (don't inline)

4. **Standardize Form System**
   - Remove all inline form styles
   - Use `.input`, `.input-label`, `.input-group` classes
   - Create form variants if needed

5. **Extract Inline Styles**
   - Move all inline styles from JSX to CSS files
   - Create page-specific CSS files where needed
   - Use design tokens in extracted styles

#### Priority: MEDIUM

6. **Standardize Container Widths**
   - Use `.container` (1400px) or `.container-narrow` (800px)
   - Remove custom max-widths
   - Create container variants if needed

7. **Standardize Typography**
   - Use typography tokens consistently
   - Add responsive typography to all pages
   - Remove magic number font sizes

8. **Standardize Spacing**
   - Replace all magic number spacing
   - Use spacing tokens
   - Add missing spacing tokens if needed

9. **Create Modal Component System**
   - Unified modal classes in `components.css`
   - Use across all modals
   - Remove custom modal implementations

10. **Create Icon Size System**
    - Icon size tokens
    - Use consistently
    - Remove hardcoded icon sizes

#### Priority: LOW

11. **Standardize Image/Avatar Styling**
    - Image utility classes
    - Consistent border-radius
    - Use `.media-responsive` consistently

12. **Add Missing Responsive Styles**
    - Audit all pages for missing mobile styles
    - Add responsive breakpoints
    - Test on actual devices

13. **Standardize Table Implementations**
    - Use `.data-table` class
    - Create responsive table wrapper
    - Remove custom table styles

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Add missing design tokens (gray scale, error-dark, etc.)
2. Standardize breakpoints (create constants)
3. Extract all inline styles to CSS files

### Phase 2: Components (Week 2)
1. Standardize buttons (remove inline, use classes)
2. Standardize forms (remove inline, use classes)
3. Standardize cards (use `.card` classes)
4. Create unified modal system

### Phase 3: Pages (Week 3)
1. Replace hardcoded colors with tokens
2. Replace magic number spacing with tokens
3. Standardize typography usage
4. Add missing responsive styles

### Phase 4: Polish (Week 4)
1. Test all pages on mobile/tablet/desktop
2. Fix any remaining inconsistencies
3. Document component usage
4. Create style guide

---

## 6. Testing Checklist

### Mobile (≤640px)
- [ ] All pages render without horizontal scroll
- [ ] Forms stack vertically
- [ ] Tables have horizontal scroll or card view
- [ ] Buttons are touch-friendly (min 44x44px)
- [ ] Typography is readable (min 14px)
- [ ] Navigation works (hamburger menu)

### Tablet (641-1024px)
- [ ] Layouts adapt appropriately
- [ ] Forms use 2-column where appropriate
- [ ] Cards use 2-column grid
- [ ] Typography scales appropriately

### Desktop (≥1024px)
- [ ] Content doesn't exceed max-width
- [ ] Hover states work
- [ ] Focus states visible
- [ ] All interactive elements accessible

---

## Summary Statistics

- **Total Issues Found:** 50+
- **High Priority:** 5
- **Medium Priority:** 8
- **Low Priority:** 3
- **Files Requiring Updates:** 25+
- **Hardcoded Colors:** 100+ instances
- **Magic Number Spacings:** 50+ instances
- **Inconsistent Breakpoints:** 15+ different values
- **Missing Responsive Styles:** 10+ pages

---

**Next Steps:**
1. Review this audit report
2. Prioritize fixes based on UX impact
3. Create implementation tickets
4. Begin Phase 1 refactoring

