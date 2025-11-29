# Theme Usage Guide

**Last Updated:** 2025-01-14  
**Purpose:** Comprehensive guide for using design tokens and maintaining theme consistency across the IndicGlyph platform.

---

## Overview

The IndicGlyph platform uses a **design token system** (`frontend/src/styles/tokens.css`) to ensure visual consistency, reduce reviewer fatigue, and enable easy theme maintenance. All colors, spacing, typography, and other design values should use these tokens instead of hardcoded values.

---

## Design Tokens Reference

### Colors

#### Primary Palette
```css
--color-navy-base: #0A192F      /* Main dark background */
--color-navy-dark: #020C1B      /* Darker variant */
--color-navy-light: #112240     /* Lighter variant */

--color-primary: #00B8D9        /* Main brand color (cyan) */
--color-primary-light: #33C9E6  /* Lighter variant */
--color-primary-dark: #0099BA   /* Darker variant */
--color-primary-alpha-10: rgba(0, 184, 217, 0.1)
--color-primary-alpha-20: rgba(0, 184, 217, 0.2)
--color-primary-alpha-30: rgba(0, 184, 217, 0.3)
--color-primary-alpha-50: rgba(0, 184, 217, 0.5)
```

#### Status Colors
```css
--color-success: #10B981
--color-success-light: #34D399
--color-success-alpha-10: rgba(16, 185, 129, 0.1)

--color-warning: #F59E0B

--color-error: #EF4444
--color-error-alpha-10: rgba(239, 68, 68, 0.1)
--color-error-alpha-20: rgba(239, 68, 68, 0.2)

--color-info: #3B82F6
```

#### Accent Colors
```css
--color-accent-purple: #B794F6      /* For AdminOverview */
--color-accent-blue: #4F9CF9        /* For AdminOverview */
--color-accent-cyan: #22D3EE         /* For AdminOverview */
--color-accent-purple-auth: #667EEA /* For AuthPages */
```

#### Neutrals
```css
--color-surface: #F5F7FA           /* Light background */
--color-surface-elevated: #FFFFFF  /* Cards, modals */
--color-background: #FAFBFC        /* Page background */

--color-ink: #1C2541               /* Primary text */
--color-ink-light: #475569         /* Secondary text */
--color-ink-lighter: #94A3B8       /* Tertiary text */

--color-border: #E2E8F0            /* Borders */
--color-border-light: #F1F5F9     /* Subtle borders */
```

#### Utility Colors
```css
--color-white-alpha-05: rgba(255, 255, 255, 0.05)
--color-white-alpha-10: rgba(255, 255, 255, 0.1)
--color-white-alpha-95: rgba(255, 255, 255, 0.95)
--color-text-muted: #8892b0        /* Muted text */
--color-link-subtle: #ccd6f6       /* Subtle links */
```

### Typography

#### Font Families
```css
--font-display: 'DM Sans', ...     /* Headings */
--font-ui: 'Inter', ...            /* UI text */
--font-mono: 'JetBrains Mono', ... /* Code */
```

#### Font Sizes
```css
--text-display: 2.75rem      /* 44px - Large headings */
--text-h1: 2rem              /* 32px - H1 */
--text-h2: 1.5rem            /* 24px - H2 */
--text-h3: 1.25rem           /* 20px - H3 */
--text-body: 1rem            /* 16px - Body text */
--text-caption: 0.875rem     /* 14px - Captions */
--text-small: 0.75rem         /* 12px - Small text */

/* Landing Page Specific */
--text-hero-title: 3.5rem    /* 56px */
--text-hero-subtitle: 1.5rem  /* 24px */
--text-section-title: 2.5rem  /* 40px */
--text-stat-number: 3rem      /* 48px */
```

#### Font Weights
```css
--weight-normal: 400
--weight-medium: 500
--weight-semibold: 600
--weight-bold: 700
```

#### Line Heights
```css
--leading-tight: 1.2
--leading-normal: 1.5
--leading-relaxed: 1.75
```

### Spacing

```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem       /* 16px */
--space-5: 1.25rem    /* 20px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-10: 2.5rem    /* 40px */
--space-12: 3rem      /* 48px */
--space-16: 4rem      /* 64px */
--space-20: 5rem      /* 80px */
--space-24: 6rem      /* 96px */
```

### Borders & Radius

```css
--radius-sm: 0.25rem    /* 4px */
--radius-base: 0.5rem   /* 8px */
--radius-lg: 0.75rem    /* 12px */
--radius-xl: 1rem       /* 16px */
--radius-2xl: 1.25rem   /* 20px */
--radius-full: 9999px   /* Full circle */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
--shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), ...
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), ...
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), ...
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), ...

/* Colored Shadows */
--shadow-primary: 0 4px 14px 0 rgba(0, 184, 217, 0.25)
--shadow-success: 0 4px 14px 0 rgba(16, 185, 129, 0.25)
--shadow-error: 0 4px 14px 0 rgba(239, 68, 68, 0.25)
```

### Transitions

```css
--transition-fast: 120ms ease-in
--transition-base: 200ms ease-out
--transition-slow: 300ms ease-out
```

### Gradients

```css
--gradient-primary: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)
--gradient-hero: linear-gradient(135deg, #0A192F 0%, #1C2541 50%, #0A192F 100%)
--gradient-surface: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4))

/* AdminOverview Gradients */
--gradient-purple: linear-gradient(135deg, #B794F6 0%, #9F7AEA 100%)
--gradient-blue: linear-gradient(135deg, #4F9CF9 0%, #00B8D9 100%)
--gradient-cyan: linear-gradient(135deg, #22D3EE 0%, #10B981 100%)
```

### Glass Effects

```css
--glass-bg: rgba(255, 255, 255, 0.7)
--glass-border: rgba(255, 255, 255, 0.3)
--glass-blur: blur(10px)
```

---

## Common Patterns

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-surface-elevated);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-base);
  font-weight: var(--weight-semibold);
  transition: all var(--transition-base);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--shadow-primary);
}
```

### Cards

```css
.card {
  background: var(--color-surface-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-base);
}
```

### Text Styles

```css
/* Primary Heading */
.heading-primary {
  font-size: var(--text-h1);
  font-weight: var(--weight-bold);
  color: var(--color-ink);
  line-height: var(--leading-tight);
}

/* Body Text */
.body-text {
  font-size: var(--text-body);
  color: var(--color-ink-light);
  line-height: var(--leading-normal);
}

/* Muted Text (use utility class) */
.text-muted {
  color: var(--color-ink-light);
  font-size: var(--text-caption);
}
```

### Media Elements

```css
/* Responsive Media (use utility class) */
.media-responsive {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-base);
}
```

### Error/Success Messages

```css
.error-message {
  background: var(--color-error-alpha-10);
  color: var(--color-error);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border-left: 4px solid var(--color-error);
}

.success-message {
  background: var(--color-success-alpha-10);
  color: var(--color-success);
  padding: var(--space-4);
  border-radius: var(--radius-base);
  border-left: 4px solid var(--color-success);
}
```

---

## Utility Classes

The following utility classes are available in `components.css`:

- `.media-responsive` - Responsive images/videos with consistent border radius
- `.text-muted` - Muted secondary text styling

---

## Migration Guide

### Before (Hardcoded)
```css
.button {
  background: #00B8D9;
  color: white;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 16px;
}
```

### After (Tokens)
```css
.button {
  background: var(--color-primary);
  color: var(--color-surface-elevated);
  padding: var(--space-4) var(--space-8);
  border-radius: var(--radius-base);
  font-size: var(--text-body);
}
```

### Color Mapping Reference

| Hardcoded | Token |
|-----------|-------|
| `#00B8D9` | `var(--color-primary)` |
| `#10B981` | `var(--color-success)` |
| `#EF4444` | `var(--color-error)` |
| `#F59E0B` | `var(--color-warning)` |
| `#1C2541` | `var(--color-ink)` |
| `#475569` | `var(--color-ink-light)` |
| `#94A3B8` | `var(--color-ink-lighter)` |
| `#FFFFFF` | `var(--color-surface-elevated)` |
| `#F5F7FA` | `var(--color-surface)` |
| `#E2E8F0` | `var(--color-border)` |

---

## Best Practices

### 1. Always Use Tokens
- ✅ `color: var(--color-ink)`
- ❌ `color: #1C2541`

### 2. Use Semantic Names
- ✅ `var(--color-primary)` for brand color
- ❌ `var(--color-cyan)` (too specific)

### 3. Prefer Utility Classes
- ✅ `className="text-muted"`
- ❌ `style={{ color: '#666', fontSize: '0.9rem' }}`

### 4. Maintain Spacing Consistency
- ✅ `padding: var(--space-4) var(--space-8)`
- ❌ `padding: 1rem 2rem`

### 5. Use Alpha Variants for Overlays
- ✅ `background: var(--color-primary-alpha-10)`
- ❌ `background: rgba(0, 184, 217, 0.1)`

### 6. Extract Inline Styles
- ✅ Create CSS file and use classes
- ❌ Inline `<style>` tags in JSX

### 7. Test Dark Mode
- All tokens support dark mode via `@media (prefers-color-scheme: dark)`
- Test your components in both light and dark modes

---

## Adding New Tokens

If you need a new color or value:

1. **Check if it exists** - Review `tokens.css` first
2. **Use existing token** - If a similar token exists, use it
3. **Add to tokens.css** - If truly needed, add with semantic naming:
   ```css
   --color-new-semantic-name: #HEX_VALUE;
   ```
4. **Document it** - Update this guide
5. **Use consistently** - Apply across all relevant components

---

## Reviewer Experience Focus

Remember: The goal is to **reduce cognitive load and fatigue** for reviewers working 8+ hour shifts.

- **Consistent colors** = Less visual confusion
- **Consistent spacing** = Muscle memory for navigation
- **Consistent typography** = Easier reading
- **Smooth transitions** = Less jarring interactions

Every hardcoded value breaks this consistency and increases reviewer fatigue.

---

## File Structure

```
frontend/src/styles/
├── tokens.css              # Design tokens (source of truth)
├── components.css          # Reusable component styles + utilities
├── global.css             # Global styles
├── index.css              # Legacy compatibility + navigation
├── LandingPage.css        # Landing page styles
├── UserManagementPage.css # User management styles
├── AdminOverview.css      # Admin overview styles
├── AuthPages.css          # Authentication pages
├── ReviewPage.css         # Review page styles
├── DashboardPage.css      # Dashboard styles
├── AdminPanel.css         # Admin panel styles
├── HomepageSetup.css      # Homepage setup styles
├── OcrIngestionPage.css   # OCR ingestion styles
└── OcrJobDetailPage.css   # OCR job detail styles
```

---

## Questions?

- Check `tokens.css` for available tokens
- Review existing page CSS files for patterns
- Follow the migration guide above
- When in doubt, use semantic tokens (e.g., `--color-primary` not `--color-cyan`)

---

**Remember:** Consistency is key to reducing reviewer fatigue and maintaining a professional, cohesive user experience.

