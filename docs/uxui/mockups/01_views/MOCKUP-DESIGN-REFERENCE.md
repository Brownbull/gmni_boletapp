# Gastify Home Dashboard - Mockup Design Reference

> This document captures all design decisions, patterns, constraints, and component specifications for the home dashboard mockup. Use this as a reference when creating new screens to ensure consistency.

## 1. Page Structure & Layout

### Phone Frame Container
```css
.phone-frame {
  width: 375px;           /* iPhone standard width */
  min-height: 812px;      /* iPhone X/11/12 height */
  background: #1e293b;    /* Dark slate frame */
  border-radius: 54px;    /* Rounded corners like real phone */
  padding: 14px;          /* Frame bezel */
}

.phone-screen {
  width: 100%;
  height: 784px;          /* Screen height inside frame */
  background: var(--bg-primary);
  border-radius: 44px;    /* Inner screen radius */
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
```

### Main Content Area
```css
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;          /* Reduced from 16px for wider cards */
  display: flex;
  flex-direction: column;
  gap: 14px;              /* Space between cards/sections */
}
```

### Page Wrapper (for controls below phone)
```css
body {
  background: #1a1a2e;    /* Dark purple background */
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
}

.page-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
```

---

## 2. Theme System

### Theme Definitions
Three themes available, each with auto-paired logo:

| Theme | Primary | Logo Style | Description |
|-------|---------|------------|-------------|
| **Mono** (default) | `#18181b` | Black gradient | Clean monochrome minimal |
| **Professional** | `#2563eb` | Blue/dark blue gradient | Corporate blue |
| **Ni No Kuni** | `#4a7c59` | Green/blue gradient | Studio Ghibli inspired |

### Theme CSS Variables
```css
/* Mono Theme (Default) */
[data-theme="mono"] {
  --primary: #18181b;
  --primary-hover: #27272a;
  --primary-light: #f4f4f5;
  --bg-primary: #fafafa;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f4f4f5;
  --text-primary: #18181b;
  --text-secondary: #52525b;
  --text-tertiary: #a1a1aa;
  --border-light: #e4e4e7;
  --border-medium: #d4d4d8;
}

/* Professional Blue Theme */
[data-theme="professional"] {
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-light: #dbeafe;
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --border-light: #e2e8f0;
  --border-medium: #cbd5e1;
}

/* Ni No Kuni Theme */
[data-theme="ninokuni"] {
  --primary: #4a7c59;
  --primary-hover: #3d6b4a;
  --primary-light: #d4e5d9;
  --bg-primary: #f5f0e8;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1dbb6;
  --text-primary: #2d3a4a;
  --text-secondary: #4a5568;
  --text-tertiary: #7d9b5f;
  --border-light: #e3bba1;
  --border-medium: #d4a574;
}
```

### Logo-Theme Pairing (Automatic)
```css
body[data-theme="professional"] .g-logo-circle {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}
body[data-theme="mono"] .g-logo-circle {
  background: linear-gradient(135deg, #18181b 0%, #3f3f46 100%);
}
body[data-theme="ninokuni"] .g-logo-circle {
  background: linear-gradient(135deg, #4a7c59 0%, #5b8fa8 100%);
}
```

---

## 3. Typography

### Font Options
- **Outfit** (default): Clean modern sans-serif
- **Space Grotesk**: Technical/geometric feel

### Font Sizes
| Element | Size | Weight |
|---------|------|--------|
| Card title | 15-16px | 600 |
| Body text | 14px | 400-500 |
| Secondary text | 12px | 400-500 |
| Small labels/pills | 10-11px | 500 |
| Amounts (large) | 18-24px | 700 |

---

## 4. Spacing & Radius

### Spacing Scale
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
```

### Border Radius Scale
```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
--radius-full: 9999px;  /* Pills */
```

---

## 5. Component Patterns

### Pattern A: Carousel with Navigation Bar
Three-level structure for carousels:
```
container (position: relative)
  └── wrapper (holds slides)
       └── track (transforms for slides)
            └── slides
  └── indicator-bar (SIBLING to wrapper, inside container)
       └── segments
```

**Key CSS:**
```css
.carousel-container { position: relative; width: 100%; }

/* Navigation bar - subtle gray, not primary color */
.indicator-bar {
  display: flex;
  width: 100%;
  height: 6px;
  background: var(--border-light);
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  border: 1px solid var(--border-light);
  border-top: none;
}
.segment.active { background: var(--border-medium); }  /* Subtle, not primary */
```

### Pattern B: Card with Rounded Top + Navigation Bar Bottom
```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;  /* Round top only */
  padding: 12px;
  border: 1px solid var(--border-light);
  border-bottom: none;  /* Nav bar provides bottom edge */
}
```

### Pattern C: Expandable List (3 visible + N collapsible)
```html
<div class="list" id="my-list">
  <div class="item">Visible 1</div>
  <div class="item">Visible 2</div>
  <div class="item">Visible 3</div>
  <div class="item collapsible">Hidden 4</div>
  <div class="item collapsible">Hidden 5</div>
</div>
```

```css
.item.collapsible { display: none; }
.list.expanded .item.collapsible { display: block; }
```

Toggle button in title area (subtle style):
```css
.expand-btn {
  width: 18px;
  height: 18px;
  margin-left: 6px;
  background: transparent;
  border: 1px solid var(--border-light);
  border-radius: 50%;
}
.expand-btn.expanded {
  background: var(--bg-tertiary);
  border-color: var(--border-medium);
}
```

### Pattern D: Compact Expandable Transaction Item
```html
<div class="expandable-item">
  <div class="expandable-header">
    <div class="transaction-thumb">
      <div class="receipt-icon"><!-- Receipt SVG --></div>
    </div>
    <div class="expandable-content">
      <div class="expandable-row">
        <span class="expandable-title">Store Name</span>
        <span class="expandable-amount">$45.990</span>
      </div>
      <div class="expandable-meta">
        <div class="expandable-pills">
          <span class="category-icon groceries">🛒</span>
          <span class="meta-pill">📅 24 Dic</span>
          <span class="meta-pill">📍 Santiago</span>
        </div>
        <span class="chevron">›</span>
      </div>
    </div>
  </div>
  <div class="expandable-details"><!-- Expanded content --></div>
</div>
```

**Sizing:**
- Receipt thumbnail: 40x46px
- Category icon: 22x22px (circular)
- Meta pills: padding 3px 6px, font-size 10px
- Item padding: 10px 8px (compact)

---

## 6. Header Bar

```html
<div class="header-bar">
  <!-- Left: Logo -->
  <div class="g-logo-circle">
    <span>G</span>
  </div>
  <!-- Center: Wordmark -->
  <span class="header-wordmark">Gastify</span>
  <!-- Right: Menu -->
  <button class="header-menu"><!-- Hamburger icon --></button>
</div>
```

```css
.g-logo-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  /* Background set by theme */
}
.header-wordmark {
  font-family: 'Baloo 2', sans-serif;
  font-size: 24px;
  font-weight: 700;
}
```

---

## 7. Bottom Navigation

```css
.bottom-nav {
  display: flex;
  justify-content: space-around;
  padding: 8px 0 20px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-light);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
}
.nav-item svg { width: 22px; height: 22px; }
.nav-item span { font-size: 11px; }
.nav-item.active svg { stroke: var(--primary); }
.nav-item.active span { color: var(--primary); font-weight: 600; }

/* Center scan button */
.scan-btn {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  margin-top: -56px;  /* Float above nav */
}
```

---

## 8. Status Bar

```css
.status-bar {
  display: flex;
  justify-content: space-between;
  padding: 12px 24px 8px;
}
.status-time { font-size: 14px; font-weight: 600; }
.status-icons svg { width: 16px; height: 16px; }
```

---

## 9. Currency Formatting

**Chilean Peso (CLP):**
- Use DOT as thousands separator: `$45.990` NOT `$45,200`
- Large amounts abbreviated: `$216.8k` for $216,800
- Always include $ symbol

---

## 10. Global Controls (for mockups)

Horizontal bar below phone for theme/font switching:
```css
.global-controls {
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 12px 20px;
  display: flex;
  gap: 24px;
  align-items: center;
}
```

---

## 11. Key Design Principles

1. **Subtle UI Elements**: Navigation bars and buttons use `--border-medium` not `--primary` for active states
2. **Compact Spacing**: Reduced padding (12px) for cards to maximize content width
3. **Consistent Radii**: Cards use `--radius-lg` (12px), pills use `--radius-full`
4. **Theme-Aware**: All colors use CSS variables for theme switching
5. **Mobile-First**: 375px width constraint, touch-friendly tap targets
6. **Expandable Patterns**: Lists show 3 items by default, expand to show more
7. **Visual Hierarchy**: Titles 15-16px bold, content 14px, meta 10-11px

---

## 12. File Structure

```
docs/uxui/mockups/home-dashboard/
├── layout-a-analytics-first.html    # Main mockup (reference)
├── MOCKUP-DESIGN-REFERENCE.md       # This file
└── [future screens...]
```

---

## 13. Creating New Screens

When creating a new screen mockup:

1. **Copy the base structure** from `layout-a-analytics-first.html`
2. **Keep these unchanged:**
   - Phone frame dimensions (375x812)
   - Theme system and CSS variables
   - Header bar with logo/wordmark
   - Bottom navigation
   - Status bar
   - Global controls panel
   - Main content padding (12px) and gap (14px)

3. **Replace only the main-content section** with new components

4. **Use established patterns:**
   - Carousels with navigation bars
   - Expandable lists
   - Card components with consistent styling

5. **Test all three themes** before finalizing
