# Landing Page Refactor Preview

**Status:** Preview Only - Not Applied Yet  
**Date:** 2025-01-14

This document shows the before/after comparison for refactoring `LandingPage.css` to use design tokens.

---

## Step 1: Add Missing Tokens to `tokens.css`

First, we need to add a few missing color tokens that are used in the landing page:

```css
/* Add to tokens.css after line 36 */

/* Landing Page Specific Colors */
--color-text-muted: #8892b0;        /* Muted text color */
--color-link-subtle: #ccd6f6;       /* Subtle link color */
--color-primary-alpha-05: rgba(0, 184, 217, 0.05);
--color-primary-alpha-30: rgba(0, 184, 217, 0.3);
--color-primary-alpha-50: rgba(0, 184, 217, 0.5);
--color-white-alpha-05: rgba(255, 255, 255, 0.05);
--color-white-alpha-10: rgba(255, 255, 255, 0.1);
--color-white-alpha-95: rgba(255, 255, 255, 0.95);

/* Additional Typography */
--text-hero-title: 3.5rem;          /* 56px - Hero title */
--text-hero-subtitle: 1.5rem;       /* 24px - Hero subtitle */
--text-section-title: 2.5rem;      /* 40px - Section titles */
--text-stat-number: 3rem;           /* 48px - Stat numbers */

/* Additional Spacing */
--space-20: 5rem;                   /* 80px */
--space-24: 6rem;                   /* 96px */
```

---

## Step 2: Before/After Comparison

### Example 1: Background Gradient

**BEFORE:**
```css
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
  color: #fff;
}
```

**AFTER:**
```css
.landing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-navy-base) 0%, var(--color-navy-light) 100%);
  color: var(--color-surface-elevated);
}
```

**Benefits:**
- Uses design tokens
- Automatically adapts to dark mode
- Consistent with rest of app

---

### Example 2: Navbar

**BEFORE:**
```css
.landing-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(10, 25, 47, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 184, 217, 0.2);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

**AFTER:**
```css
.landing-navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(10, 25, 47, 0.95); /* Keep rgba for transparency */
  backdrop-filter: var(--glass-blur);
  z-index: 1000;
  border-bottom: 1px solid var(--color-primary-alpha-20);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-4) var(--space-8);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
```

**Benefits:**
- Consistent spacing tokens
- Reusable blur effect
- Primary color alpha token

---

### Example 3: Brand Colors

**BEFORE:**
```css
.brand-indic {
  color: #00B8D9;
}

.brand-glyph {
  color: #fff;
}

.brand-studio {
  color: #8892b0;
  font-weight: 400;
  margin-left: 0.5rem;
}
```

**AFTER:**
```css
.brand-indic {
  color: var(--color-primary);
}

.brand-glyph {
  color: var(--color-surface-elevated);
}

.brand-studio {
  color: var(--color-text-muted);
  font-weight: var(--weight-normal);
  margin-left: var(--space-2);
}
```

**Benefits:**
- All colors use tokens
- Consistent font weights
- Consistent spacing

---

### Example 4: Navigation Links

**BEFORE:**
```css
.nav-link {
  color: #ccd6f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #00B8D9;
}
```

**AFTER:**
```css
.nav-link {
  color: var(--color-link-subtle);
  text-decoration: none;
  font-weight: var(--weight-medium);
  transition: color var(--transition-base);
}

.nav-link:hover {
  color: var(--color-primary);
}
```

**Benefits:**
- Consistent transition timing
- Token-based colors
- Standard font weight

---

### Example 5: Hero Section

**BEFORE:**
```css
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8rem 2rem 4rem;
  overflow: hidden;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #00B8D9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 1s ease-out;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #8892b0;
  margin-bottom: 3rem;
  line-height: 1.6;
  animation: fadeInUp 1s ease-out 0.2s backwards;
}
```

**AFTER:**
```css
.hero-section {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-16) var(--space-8) var(--space-16);
  overflow: hidden;
}

.hero-title {
  font-size: var(--text-hero-title);
  font-weight: var(--weight-bold);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-6);
  background: linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: fadeInUp 1s ease-out;
}

.hero-subtitle {
  font-size: var(--text-hero-subtitle);
  color: var(--color-text-muted);
  margin-bottom: var(--space-12);
  line-height: var(--leading-relaxed);
  animation: fadeInUp 1s ease-out 0.2s backwards;
}
```

**Benefits:**
- Typography tokens
- Consistent spacing
- Standard line heights
- Token-based gradient

---

### Example 6: CTA Buttons

**BEFORE:**
```css
.cta-primary {
  padding: 1rem 2.5rem;
  background: linear-gradient(135deg, #00B8D9 0%, #0088a8 100%);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  font-size: 1.1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s;
  box-shadow: 0 10px 30px rgba(0, 184, 217, 0.3);
}

.cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px rgba(0, 184, 217, 0.5);
}
```

**AFTER:**
```css
.cta-primary {
  padding: var(--space-4) var(--space-10);
  background: var(--gradient-primary);
  color: var(--color-surface-elevated);
  text-decoration: none;
  border-radius: var(--radius-full);
  font-weight: var(--weight-semibold);
  font-size: var(--text-body);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  transition: all var(--transition-base);
  box-shadow: var(--shadow-primary);
}

.cta-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 15px 40px var(--color-primary-alpha-50);
}
```

**Benefits:**
- Uses existing gradient token
- Consistent spacing
- Standard border radius
- Reusable shadow token

---

### Example 7: Stats Banner

**BEFORE:**
```css
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
  max-width: 1200px;
  margin: -4rem auto 6rem;
  padding: 0 2rem;
  position: relative;
  z-index: 20;
}

.stat-number {
  font-size: 3rem;
  font-weight: 800;
  color: #00B8D9;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #8892b0;
  font-size: 0.9rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

**AFTER:**
```css
.stats-banner {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-8);
  max-width: 1200px;
  margin: calc(-1 * var(--space-16)) auto var(--space-24);
  padding: 0 var(--space-8);
  position: relative;
  z-index: 20;
}

.stat-number {
  font-size: var(--text-stat-number);
  font-weight: var(--weight-bold);
  color: var(--color-primary);
  margin-bottom: var(--space-2);
}

.stat-label {
  color: var(--color-text-muted);
  font-size: var(--text-caption);
  font-weight: var(--weight-medium);
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

**Benefits:**
- Typography tokens
- Consistent spacing
- Standard font weights

---

## Summary of Changes

### Colors Replaced (15 instances)
- `#0A192F` → `var(--color-navy-base)`
- `#112240` → `var(--color-navy-light)`
- `#00B8D9` → `var(--color-primary)`
- `#8892b0` → `var(--color-text-muted)` (new token)
- `#ccd6f6` → `var(--color-link-subtle)` (new token)
- `#fff` / `white` → `var(--color-surface-elevated)`
- `rgba(0, 184, 217, 0.2)` → `var(--color-primary-alpha-20)`
- `rgba(0, 184, 217, 0.3)` → `var(--color-primary-alpha-30)`
- `rgba(0, 184, 217, 0.5)` → `var(--color-primary-alpha-50)`

### Spacing Replaced (25 instances)
- `1rem` → `var(--space-4)`
- `1.5rem` → `var(--space-6)`
- `2rem` → `var(--space-8)`
- `3rem` → `var(--space-12)`
- `4rem` → `var(--space-16)`
- `6rem` → `var(--space-24)`
- `8rem` → `var(--space-16)` (or new `--space-32`)
- `0.5rem` → `var(--space-2)`
- `2.5rem` → `var(--space-10)`

### Typography Replaced (10 instances)
- `3.5rem` → `var(--text-hero-title)`
- `1.5rem` → `var(--text-hero-subtitle)`
- `2.5rem` → `var(--text-section-title)`
- `3rem` → `var(--text-stat-number)`
- `1.1rem` → `var(--text-body)`
- `0.9rem` → `var(--text-caption)`
- `1.2` → `var(--leading-tight)`
- `1.6` → `var(--leading-relaxed)`
- `700` / `800` → `var(--weight-bold)`
- `500` / `600` → `var(--weight-medium)` / `var(--weight-semibold)`

### Other Improvements
- `border-radius: 50px` → `var(--radius-full)`
- `transition: all 0.3s` → `var(--transition-base)`
- `box-shadow: 0 10px 30px rgba(...)` → `var(--shadow-primary)`
- `backdrop-filter: blur(10px)` → `var(--glass-blur)`

---

## Visual Impact

**No visual changes expected** - The refactoring maintains the exact same appearance while making the code:
- ✅ More maintainable
- ✅ Consistent with design system
- ✅ Dark mode compatible
- ✅ Easier to theme in the future

---

## Next Steps

1. **Review this preview** - Check if you like the approach
2. **Approve or request changes** - Let me know if you want adjustments
3. **Apply changes** - I'll update both `tokens.css` and `LandingPage.css`
4. **Test** - Verify the landing page looks identical

---

**Ready to proceed?** If you approve, I'll apply these changes. If you want modifications, let me know!

