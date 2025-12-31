# Story 13.4: Design System HTML Components

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Done
**Story Points:** 5
**Type:** Design/Specification
**Dependencies:** Stories 13.1-13.3 (foundation docs)
**Priority:** HIGH - Blocks Story 13.5 (Extract Reference) → All mockups

> **Note:** Renumbered from 13.4a to 13.4 during Epic 13 restructuring (2025-12-27)

---

## User Story

As a **designer/developer**,
I want **a comprehensive component library with consistent styles**,
So that **all screen mockups use the same visual language and can be built quickly from pre-defined pieces**.

---

## Background

Story 13.4 (Home Dashboard mockup) revealed inconsistencies in:
- Font sizes and weights
- Color usage and palette
- Spacing and margins
- Card styles and shadows
- Icon sizes and styles
- Navigation patterns

This story creates the **"menu of pieces"** that all subsequent mockups will draw from.

---

## Acceptance Criteria

- [x] **AC #1:** Typography scale defined (H1-H4, body, caption, labels, currency)
- [x] **AC #2:** Color palette with semantic meanings (primary, success, warning, error, categories)
- [x] **AC #3:** Spacing tokens (4px grid system, margins, padding)
- [x] **AC #4:** Card component variants (transaction, insight, summary, empty state)
- [x] **AC #5:** Button variants (primary, secondary, ghost, FAB, icon)
- [x] **AC #6:** Navigation components (bottom nav, headers, tab bars)
- [x] **AC #7:** Form elements (inputs, selects, toggles)
- [x] **AC #8:** Feedback states (loading, error, success, skeleton)
- [x] **AC #9:** Icon library with consistent sizing
- [x] **AC #10:** Interactive HTML with side-by-side comparisons

---

## Design Inspiration Sources

| Source | What to Reference |
|--------|-------------------|
| **Current Boletapp** | Card patterns, transaction list, working elements to modernize |
| **Yahoo Finance** | Dashboard layout, data density, financial data presentation |
| **Nubank** | Clean fintech aesthetic, purple/violet palette, card interactions |
| **Instagram** | Modern mobile UX, stories bar, bottom navigation |
| **Fintual / Racional** | Chilean fintech patterns, local design sensibility |

---

## Component Categories

### 1. Typography

| Token | Size | Weight | Use Case |
|-------|------|--------|----------|
| `heading-1` | 28px | 800 (Extra Bold) | Screen titles |
| `heading-2` | 22px | 700 (Bold) | Section headers |
| `heading-3` | 18px | 600 (Semibold) | Card titles |
| `heading-4` | 16px | 600 (Semibold) | Subsections |
| `body` | 15px | 400 (Regular) | Primary text |
| `body-small` | 13px | 400 (Regular) | Secondary text |
| `caption` | 12px | 500 (Medium) | Labels, metadata |
| `currency-large` | 32px | 700 (Bold) | Hero amounts |
| `currency-medium` | 20px | 600 (Semibold) | Card amounts |
| `currency-small` | 15px | 500 (Medium) | List amounts |

### 2. Color Palette

**Primary & Neutral:**
| Name | Light Mode | Dark Mode | Usage |
|------|-----------|-----------|-------|
| `primary-500` | #3b82f6 | #60a5fa | Primary actions, links |
| `primary-600` | #2563eb | #3b82f6 | Primary hover |
| `slate-900` | #0f172a | #f8fafc | Primary text |
| `slate-500` | #64748b | #94a3b8 | Secondary text |
| `slate-200` | #e2e8f0 | #334155 | Borders |
| `slate-50` | #f8fafc | #0f172a | Background |

**Semantic:**
| Name | Light Mode | Usage |
|------|-----------|-------|
| `success` | #22c55e | Positive trends, savings |
| `warning` | #f59e0b | Approaching limits |
| `error` | #ef4444 | Over budget, errors |

**Category Colors:**
| Category | Color | Hex |
|----------|-------|-----|
| Groceries | Green | #22c55e |
| Restaurants | Orange | #f97316 |
| Transport | Blue | #3b82f6 |
| Entertainment | Purple | #a855f7 |
| Health | Pink | #ec4899 |
| Shopping | Indigo | #6366f1 |
| Bills | Slate | #64748b |
| Other | Gray | #9ca3af |

### 3. Spacing Scale (4px Grid)

| Token | Value | Use Case |
|-------|-------|----------|
| `space-1` | 4px | Tight spacing, icon gaps |
| `space-2` | 8px | Between related elements |
| `space-3` | 12px | Card internal padding |
| `space-4` | 16px | Standard padding |
| `space-5` | 20px | Section spacing |
| `space-6` | 24px | Large section gaps |
| `space-8` | 32px | Screen margins |

### 4. Card Variants

**Transaction Card:**
- Height: 72px
- Internal padding: 12px
- Corner radius: 12px
- Shadow: sm (subtle)
- Contains: emoji, merchant, category, amount, date

**Insight Card:**
- Flexible height
- Internal padding: 16px
- Corner radius: 16px
- Shadow: md
- Contains: icon, title, message, actions

**Summary Card:**
- Height: varies
- Internal padding: 20px
- Corner radius: 20px
- Shadow: lg
- Contains: metric, trend, chart placeholder

**Empty State Card:**
- Centered content
- Internal padding: 32px
- Corner radius: 16px
- Border: dashed slate-300
- Contains: illustration, message, CTA

### 5. Button Variants

| Variant | Height | Padding | Corner Radius | Style |
|---------|--------|---------|---------------|-------|
| Primary | 48px | 16px 24px | 12px | Solid primary |
| Secondary | 44px | 12px 20px | 10px | Border only |
| Ghost | 40px | 8px 16px | 8px | Text only |
| FAB | 56px | - | 28px (full) | Floating, shadow-xl |
| Icon | 40px | 10px | 10px | Icon only |

### 6. Navigation

**Bottom Nav Bar:**
- Height: 64px + safe-area
- 5 items: Home, Insights, Scan (FAB), Analytics, Settings
- Active: primary color, filled icon
- Inactive: slate-400, outline icon

**Screen Header:**
- Height: 56px
- Left: Back arrow or Logo
- Center: Title (optional)
- Right: Actions (1-2 icons)

**Tab Bar:**
- Height: 48px
- Underline indicator
- Smooth slide animation

### 7. Form Elements

**Text Input:**
- Height: 48px
- Corner radius: 10px
- Border: slate-200, focus: primary
- Label: caption above

**Select:**
- Same as input
- Chevron icon right

**Toggle:**
- Width: 48px, Height: 28px
- Thumb: 24px
- Track: slate-200 off, primary on

### 8. Feedback States

**Loading:**
- Skeleton: pulse animation
- Spinner: 24px primary

**Error:**
- Red border/background
- Error icon
- Message below

**Success:**
- Green checkmark
- Fade out after 2s

**Toast:**
- Bottom of screen
- Auto-dismiss 3s
- Swipe to dismiss

---

## HTML Mockup Requirements

### Layout Rules

1. **Left margin always present** - minimum 40px from page edge to phone frame
2. **Side-by-side comparisons** - group variants horizontally when possible
3. **Vertical stacking** - for state variations (default, hover, active, disabled)
4. **Minimal labels** - component name above, no long descriptions between
5. **Section headers** - clear separation between component categories
6. **Interactive elements** - hover states work, buttons clickable

### Page Structure

```
+------------------------------------------------------------------+
|  BOLETAPP DESIGN SYSTEM - Component Library                       |
+------------------------------------------------------------------+
|                                                                    |
|  NAVIGATION                                                        |
|  [Typography] [Colors] [Spacing] [Cards] [Buttons] [Nav] [Forms]   |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  TYPOGRAPHY                                                        |
|  +------------------+  +------------------+  +------------------+  |
|  | Heading 1        |  | Heading 2        |  | Heading 3        |  |
|  | 28px / 800       |  | 22px / 700       |  | 18px / 600       |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
|  +------------------+  +------------------+  +------------------+  |
|  | Body             |  | Caption          |  | Currency         |  |
|  | 15px / 400       |  | 12px / 500       |  | $45.000          |  |
|  +------------------+  +------------------+  +------------------+  |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  COLOR PALETTE                                                     |
|  [Primary swatches side by side]                                   |
|  [Category colors in a row]                                        |
|  [Semantic colors (success/warning/error)]                         |
|                                                                    |
+------------------------------------------------------------------+
```

---

## Key Decisions to Make During Implementation

1. **Font family:** Keep Inter or explore alternatives?
2. **Corner radius scale:** 8-12-16-20px or different?
3. **Shadow intensity:** Current level or softer/harder?
4. **FAB position:** Center elevated or right-side?
5. **Dark mode priority:** Define now or later?

---

## Definition of Done

- [x] Interactive HTML component library created
- [x] All component categories documented
- [x] Side-by-side comparisons for variants
- [x] Light mode complete (dark mode can follow)
- [x] Typography scale applied consistently
- [x] Color palette with CSS custom properties
- [x] Spacing using 4px grid system
- [x] Reviewed by Gabe (Atlas Code Review 2025-12-27)
- [x] Approved for use in remaining mockups

---

## Implementation Status Legend

| Symbol | Meaning |
|--------|---------|
| 🟢 CURRENT | Pattern exists in production app - modernize/document |
| 🟡 FUTURE | New pattern for Epic 14-15 implementation |

### Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Transaction Cards | 🟢 CURRENT | Modernized from existing TransactionThumbnail |
| Bottom Navigation | 🟢 CURRENT | Follows existing 5-tab pattern |
| Form Inputs | 🟢 CURRENT | Based on existing EditView inputs |
| Category Badges | 🟢 CURRENT | Color palette from existing categoryEmoji |
| 3 Themes (Professional/Mono/Ni No Kuni) | 🟡 FUTURE | New theme options for Epic 14 |
| Analytics Charts | 🟡 FUTURE | New chart components for Epic 14 |
| Period Selector | 🟡 FUTURE | New navigation pattern for Analytics |
| Insight Cards | 🟢 CURRENT | Modernized from InsightCard component |

---

## Use Case Mapping

| Component Section | Use Cases (from Story 13.1) | Notes |
|-------------------|----------------------------|-------|
| Transactions | UC1: First Receipt Scan, UC8: Transaction Review | List display, expandable items |
| Settings | UC6: Subscription Journey | Theme selection, preferences |
| Scan | UC1: First Receipt Scan, UC7: Trust Merchant | Camera overlay, progress states |
| Analytics | UC2: Weekly Health Check | Charts, period selectors, summary cards |
| Insights | UC5: Insight Discovery | Insight cards, celebration states |
| Navigation | All Use Cases | Bottom nav, headers, tabs |
| Feedback States | All Use Cases | Loading, error, success, skeleton |

---

## Context References

- **Current App UI:** Reference existing Boletapp patterns
- **Motion Design System:** [motion-design-system.md](../../uxui/motion-design-system.md)
- **Voice & Tone:** [voice-tone-guidelines.md](../../uxui/voice-tone-guidelines.md)
- **Inspiration:** Yahoo Finance, Nubank, Instagram, Fintual, Racional

---

## Impact on Epic 13

This story **blocks** remaining mockup stories:
- 13.5 Analytics → Use design system components
- 13.6 Transaction List → Use design system components
- 13.7 Scan Overlay → Use design system components
- etc.

**Recommendation:** Complete 13.4a before continuing with 13.5+

---

## Notes

- Dynamic Polygon will be a separate specialized component - use placeholder in mockups
- Home screen should be card-based with recent transactions (like current app, modernized)
- Polygon moves to Insights/Analytics screens (more technical context)

---

## Dev Agent Record

### Implementation Plan
Created comprehensive interactive HTML design system component library with:
- **3 font family options** (Inter, DM Sans, Plus Jakarta Sans) for user comparison
- **2 corner radius scales** (gradual vs. simplified) for user selection
- **2 shadow intensity options** (standard vs. soft) for user preference
- **2 FAB positions** (center vs. right) for layout decision
- All components implemented with CSS custom properties for easy theming

### Completion Notes
- Interactive HTML mockup created at `docs/uxui/mockups/00_components/design-system-final.html` (590KB)
- **8 Tab Sections:** Transactions, Settings, Scan, Analytics, Insights, Navigation, Components, Design
- **3 Themes:** Professional Blue, Monochrome Minimal, Ni No Kuni (Ghibli-inspired)
- **2 Fonts:** Outfit (default), Space Grotesk
- **Typography:** Full scale from H1 (32px/800) to caption (12px/500), currency display styles
  - **Note:** Typography scale adjusted from spec (H1: 28px→32px, H2: 22px→24px) for better visual hierarchy on mobile
- **Colors:** Complete palette with CSS custom properties, semantic colors, category colors
- **Spacing:** 4px grid system with space-1 through space-10 tokens
- **Cards:** Flat, Elevated, Transparent variants with transaction item styles
- **Buttons:** Soft, Secondary, Icon, Raised, Pill variants with size options
- **Navigation:** Standard and Floating bottom nav, responsive tabs
- **Forms:** Inputs, editable tags, category badges, dropdowns
- **Feedback:** Spinner, skeleton, toast, status messages (success/warning/error)
- **Icons:** Grid-based icon library with hover effects
- **Interactions:** Hover lift, press squish, glow focus, pulse, bounce animations
- Follows existing Boletapp patterns while offering modernization options

### File List
| File | Action | Description |
|------|--------|-------------|
| `docs/uxui/mockups/00_components/design-system-final.html` | Created | Interactive design system component library (590KB, 3 themes, 2 fonts, 8 component sections) |

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story created based on 13.4 review feedback |
| 2025-12-23 | 1.1 | Implementation complete - interactive HTML with version comparisons |
| 2025-12-27 | 1.2 | Atlas dev-story validation - File path corrected, completion notes expanded, status → review |
| 2025-12-27 | 1.3 | Atlas code review - Added: prefers-reduced-motion CSS, ARIA attributes, Implementation Status Legend, Use Case Mapping |
