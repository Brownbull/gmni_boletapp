# Boletapp UX Design Specification

_Created on 2025-12-04 by Gabe_
_Generated using BMad Method - Create UX Design Workflow v1.0_

---

## Executive Summary

**Project:** Boletapp - Smart Expense Tracker PWA for Chilean families

**Vision:** Help Chilean families answer "Where did my money go?" without the pain of manual data entry. Scan receipts, get insights immediately.

**Core Breakthrough:** No competitor combines receipt scanning + item extraction + category learning + analytics in one flow. Boletapp is **proactive** (scan and go) instead of **reactive** (sit down and type).

**Epic 7 Focus:** Brownfield UX redesign transforming analytics from "functional but inconsistent" to "professional and intuitive." Key deliverables:
- Dual breadcrumb navigation (Temporal 5 levels + Category 3 levels)
- Quarter and Week views (new temporal levels)
- Chart dual mode (Aggregation vs Comparison)
- Bug fixes and visual consistency

**Target Users:** Chilean families who reach end of month wondering where their money went - people who want spending insights without manual data entry.

**Platform:** PWA (Progressive Web App), mobile-first design (375px-428px primary viewport)

---

## 1. Design System Foundation

### 1.1 Design System Choice

**Decision:** Keep current Tailwind CSS setup + leverage Tailwind UI premium templates

**Current Stack:**
- **Tailwind CSS** (via CDN) - Utility-first CSS framework
- **Lucide React** - Icon library (24px, stroke-width 2 per PRD)
- **Custom components** - Built with Tailwind classes

**Enhancement:** Tailwind UI Premium Templates
- Located at: `docs/design-references/tailwind_templates/`
- Professional, production-ready component patterns
- Dark theme support included

**Rationale:**
1. No migration needed - builds on existing code
2. Premium templates provide professional polish
3. Full control over customization
4. Templates are reference patterns, not dependencies

### 1.2 Key Templates for Epic 7

**Navigation Components:**
| Template | Location | Use Case |
|----------|----------|----------|
| Breadcrumbs with Chevrons | `Navigation/Breadcrumbs/simple_with_chevrons.js` | Temporal breadcrumb pattern |
| Tabs with Underline | `Navigation/Tabs/tabs_with_underline.js` | Chart mode toggle |
| Progress Bars | `Navigation/Progress Bars/` | Visual position indicator |

**Data Display Components:**
| Template | Location | Use Case |
|----------|----------|----------|
| Stats with Trending | `Data Display/Stats/with_trending.js` | Total amount display |
| Stats in Cards | `Data Display/Stats/simple_in_cards.js` | Drill-down cards |
| Calendars | `Data Display/Calendars/` | Week/Month view patterns |

**Application Shells:**
| Template | Location | Use Case |
|----------|----------|----------|
| Stacked Layouts | `Application Shells/Stacked Layouts/` | Main app structure |

### 1.3 Component Customization Needed

**Custom Components (no template exists):**
1. **Dual Breadcrumb Navigator** - Two independent breadcrumb rows (temporal + category)
2. **Pie/Bar Chart Toggle** - Aggregation vs Comparison mode switch
3. **Drill-down Cards Grid** - Tappable cards showing child periods/categories

**Templates to Adapt:**
1. Breadcrumb → Add tap handlers, highlight current segment
2. Stats with Trending → Adapt for spending totals with category breakdown
3. Progress indicators → Adapt for temporal position visualization

---

## 2. Core User Experience

### 2.1 Defining Experience

**Primary User Actions:**
1. **Quick monthly spending overview** - "Where did my money go this month?" answered at a glance
2. **Temporal comparison** - Compare spending across time periods (quarters, months, weeks)

**What Must Be Effortless:**
- **Always knowing where you are** - The dual breadcrumb navigation must provide constant, clear orientation in both temporal and category hierarchies

**Critical Interactions (All Equally Important):**
1. **Drill-down** - Tapping chart slices or cards to go deeper into data
2. **Breadcrumb navigation** - Jumping back to any previous level with one tap
3. **Mode toggle** - Switching between aggregation (what) and comparison (when) views

**Design Implication:** The dual breadcrumb is the heart of the UX. It must be:
- Always visible and prominent
- Instantly understandable (current position highlighted)
- Touch-friendly (large tap targets)
- Responsive to every navigation action

### 2.2 Desired Emotional Response

**Target Emotion:** Empowered and in control - "I understand my money"

**What This Means for Design:**
- Users feel **confident**, not confused - clear visual hierarchy, no ambiguous states
- Users feel **in charge** of exploring their data - they drive navigation, not the system
- The interface **serves them** - minimal friction, instant feedback, predictable behavior

**Design Principles Derived from Emotion:**
1. **Clarity over cleverness** - Every element has obvious purpose
2. **Control over automation** - Users choose where to go, what to see
3. **Confidence through feedback** - Every tap has visible response
4. **Orientation over decoration** - Breadcrumbs > fancy transitions

**The Feeling Test:** After using analytics, users should think: "I know exactly where my money went and I found that out easily."

### 2.3 Inspiration Analysis

**Key Insight:** Target users love simple, familiar apps - NOT complex analytics tools. They use WhatsApp, Facebook, Candy Crush - apps with minimal learning curves.

#### WhatsApp UX Patterns to Apply:
- **Bottom navigation** - Familiar tab bar (21% faster navigation than top menus)
- **Content-first** - No banners, ads, or unnecessary animations
- **Consistent layouts** - Same patterns across all screens
- **Subtle micro-interactions** - Smooth feedback on every action
- **Clear visual hierarchy** - Important info prominent, secondary info subtle

#### Candy Crush UX Patterns to Apply:
- **Simple menu system** - Maximum 3 options visible at once
- **Playful but clear** - Bright, consistent visual tone
- **Quick return navigation** - "Back to current" buttons when scrolled away
- **Skip options** - Don't force users through tutorials/explanations
- **Visible progress** - Show where you are in the journey (level map = breadcrumb)

#### Facebook Messenger Patterns:
- **Instant familiarity** - Patterns users already know
- **Minimal cognitive load** - One primary action per screen
- **Forgiving navigation** - Easy to go back, hard to get lost

**Design Implications for Boletapp:**
1. **Don't make it feel like "analytics software"** - Make it feel like checking messages
2. **Bottom navigation** for main app areas (already implemented)
3. **Breadcrumbs = Level map** - Visual progress indicator users understand
4. **Maximum 3 primary actions** visible at any time
5. **Instant feedback** on every tap (micro-interactions)
6. **Familiar patterns** - Don't innovate on navigation, innovate on insights

### 2.4 Novel UX Patterns

**Novel Pattern Detected: Dual-Axis Breadcrumb Navigation**

This is Boletapp's core UX innovation for analytics. Standard analytics tools force users to pick ONE axis first (time OR category), then filter within it. Boletapp allows **simultaneous, independent navigation** on both axes.

**The Pattern:**
```
┌─────────────────────────────────────────────────────────────┐
│  TEMPORAL BREADCRUMB (5 levels)                             │
│  [2024] › [Q4] › [October]                   [📊] [📥]     │
├─────────────────────────────────────────────────────────────┤
│  CATEGORY BREADCRUMB (3 levels)                             │
│  [Food] › [Groceries] › Meats                               │
├─────────────────────────────────────────────────────────────┤
│                    CHART + DATA                             │
└─────────────────────────────────────────────────────────────┘
```

**Why This Is Novel:**
- Two independent breadcrumb rows (not one combined path)
- Changing temporal position preserves category filter
- Changing category filter preserves temporal position
- Users can explore any combination: "Q4 + Groceries" or "October + All Categories"

**User Mental Model:**
- Temporal breadcrumb = "When am I looking at?"
- Category breadcrumb = "What am I looking at?"
- Both questions answered at a glance, both changeable independently

**Design Requirements for This Pattern:**
1. **Visual separation** - Two distinct rows, clearly labeled
2. **Independent highlighting** - Each row shows its own "current" segment
3. **Clear reset option** - Easy way to clear category filter ("All Categories")
4. **Responsive to both** - Chart and data update when EITHER breadcrumb changes
5. **No confusion** - Users must understand these are two different filters

**Inspiration:** Think of it like two sliders - one for time, one for category. Move either independently.

### 2.5 Core Experience Principles

Based on the defining experience and novel pattern, these principles guide all UX decisions:

| Principle | Definition | Example |
|-----------|------------|---------|
| **Speed** | Key actions feel instant (<300ms) | Drill-down transitions, breadcrumb jumps |
| **Orientation** | Users always know where they are | Dual breadcrumbs visible, current highlighted |
| **Flexibility** | Users control what they see | Independent axes, chart mode toggle |
| **Feedback** | Every action has visible response | Tap highlights, smooth transitions |

---

## 3. Visual Foundation

### 3.1 Color System

**Decision:** Dual-theme support with user-selectable themes

**Default Theme:** Slate Professional (clean, neutral, familiar)

**Available Themes:**
| Theme | Character | Use Case |
|-------|-----------|----------|
| **Slate Professional** (default) | Clean, neutral, business-like | Users who want familiar, no-nonsense analytics |
| **Ni no Kuni / Ghibli** | Soft pastels, warm, hand-crafted | Users who want a calming, friendly experience |

---

#### Theme 1: Slate Professional (Default)

**Light Mode:**
| Role | Color | Tailwind | Usage |
|------|-------|----------|-------|
| Background | `#f8fafc` | `slate-50` | Main app background |
| Surface | `#ffffff` | `white` | Cards, modals |
| Primary | `#0f172a` | `slate-900` | Text, headers |
| Secondary | `#64748b` | `slate-500` | Secondary text |
| Accent | `#3b82f6` | `blue-500` | Interactive elements, links |
| Success | `#22c55e` | `green-500` | Positive values, confirmations |
| Warning | `#f59e0b` | `amber-500` | Alerts, attention |
| Error | `#ef4444` | `red-500` | Errors, negative values |

**Dark Mode:**
| Role | Color | Tailwind | Usage |
|------|-------|----------|-------|
| Background | `#0f172a` | `slate-900` | Main app background |
| Surface | `#1e293b` | `slate-800` | Cards, modals |
| Primary | `#f8fafc` | `slate-50` | Text, headers |
| Secondary | `#94a3b8` | `slate-400` | Secondary text |
| Accent | `#60a5fa` | `blue-400` | Interactive elements |

**Chart Colors (Both Modes):**
```
Primary:   #3b82f6 (blue-500)
Secondary: #22c55e (green-500)
Tertiary:  #f59e0b (amber-500)
Quaternary:#ef4444 (red-500)
Quinary:   #8b5cf6 (violet-500)
Senary:    #ec4899 (pink-500)
```

---

#### Theme 2: Ni no Kuni / Ghibli

**Philosophy:** Inspired by Studio Ghibli films and Ni no Kuni game - soft, warm, hand-painted aesthetic. Creates a calming, friendly experience that makes financial data feel approachable.

**Custom Colors (extend Tailwind config):**
```javascript
ghibli: {
  sky: '#a3c5e0',      // Soft sky blue
  cream: '#f1dbb6',    // Warm cream
  peach: '#e3bba1',    // Soft peach
  rose: '#f0a3b0',     // Gentle rose
  sage: '#7d9b5f',     // Natural sage
  forest: '#4a7c59',   // Deep forest
  ocean: '#5b8fa8',    // Ocean blue
  sunset: '#e8a87c',   // Sunset orange
  cloud: '#f5f0e8',    // Cloud white
  night: '#2d3a4a',    // Night sky
}
```

**Light Mode:**
| Role | Color | Custom | Usage |
|------|-------|--------|-------|
| Background | `#f5f0e8` | `ghibli-cloud` | Warm paper-like background |
| Surface | `#ffffff` | `white` | Cards with subtle warmth |
| Primary | `#2d3a4a` | `ghibli-night` | Soft dark text |
| Secondary | `#5b8fa8` | `ghibli-ocean` | Secondary text |
| Accent | `#4a7c59` | `ghibli-forest` | Interactive elements |
| Success | `#7d9b5f` | `ghibli-sage` | Positive values |
| Warning | `#e8a87c` | `ghibli-sunset` | Alerts |
| Error | `#f0a3b0` | `ghibli-rose` | Errors (soft, not alarming) |

**Dark Mode:**
| Role | Color | Custom | Usage |
|------|-------|--------|-------|
| Background | `#2d3a4a` | `ghibli-night` | Night sky background |
| Surface | `#3d4a5a` | darker night | Cards |
| Primary | `#f5f0e8` | `ghibli-cloud` | Light text |
| Secondary | `#a3c5e0` | `ghibli-sky` | Secondary text |
| Accent | `#7d9b5f` | `ghibli-sage` | Interactive elements |

**Chart Colors:**
```
Primary:   #5b8fa8 (ocean)
Secondary: #7d9b5f (sage)
Tertiary:  #e8a87c (sunset)
Quaternary:#f0a3b0 (rose)
Quinary:   #a3c5e0 (sky)
Senary:    #e3bba1 (peach)
```

---

### 3.2 Theme Implementation Strategy

**Tailwind Configuration:**
```javascript
// tailwind.config.js extension
module.exports = {
  theme: {
    extend: {
      colors: {
        ghibli: { /* colors above */ },
      }
    }
  }
}
```

**CSS Variables Approach:**
```css
:root {
  --color-bg: theme('colors.slate.50');
  --color-surface: theme('colors.white');
  --color-primary: theme('colors.slate.900');
  --color-accent: theme('colors.blue.500');
  /* ... */
}

[data-theme="ghibli"] {
  --color-bg: theme('colors.ghibli.cloud');
  --color-primary: theme('colors.ghibli.night');
  --color-accent: theme('colors.ghibli.forest');
  /* ... */
}
```

**Theme Switching:**
- Store preference in localStorage
- Add to Settings page under "Appearance"
- Apply via `data-theme` attribute on `<html>` element
- Respect system preference for light/dark within each theme

### 3.3 Typography

**Font Stack:** System fonts for performance
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

**Scale:**
| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 (Page Title) | 24px / `text-2xl` | 700 | 1.2 |
| H2 (Section) | 20px / `text-xl` | 600 | 1.3 |
| H3 (Card Title) | 16px / `text-base` | 600 | 1.4 |
| Body | 14px / `text-sm` | 400 | 1.5 |
| Caption | 12px / `text-xs` | 400 | 1.4 |
| Amount (Large) | 28px / `text-3xl` | 700 | 1.1 |

### 3.4 Spacing & Layout

**Base Unit:** 4px (Tailwind default)

**Common Spacings:**
| Use Case | Value | Tailwind |
|----------|-------|----------|
| Component padding | 16px | `p-4` |
| Card gap | 12px | `gap-3` |
| Section margin | 24px | `my-6` |
| Touch target min | 44px | `min-h-11` |

**Interactive Visualizations:**

- Color Theme Explorer: [ux-color-themes.html](./ux-color-themes.html)

---

## 4. Design Direction

### 4.1 Chosen Design Approach

**Core Layout Decision:** Mobile-first analytics with always-visible receipt scanning CTA

**Key Design Elements:**

| Element | Decision | Rationale |
|---------|----------|-----------|
| **Bottom Navigation** | 5-item nav with center FAB | Familiar pattern (WhatsApp-like), thumb-friendly |
| **Scan Button** | Center FAB with camera icon, gradient accent | Critical differentiator - receipt scanning always one tap away |
| **Breadcrumbs** | Collapsible dual buttons (When/What) | Space-efficient, expands on tap to show full path |
| **Chart Toggle** | Pill-style segmented control | Clear mode indication, familiar iOS pattern |
| **Drill Cards** | Full-width cards with color indicator | Touch-friendly, clear tap targets |

### 4.2 Navigation Structure

```
Bottom Nav (Always Visible):
┌─────┬─────┬─────────┬─────────┬─────────┐
│Home │Rcpts│ [SCAN]  │Analytics│Settings │
└─────┴─────┴─────────┴─────────┴─────────┘
              ↑ Center FAB (Camera icon)
```

### 4.3 Analytics Screen Layout

```
┌─────────────────────────────────────────┐
│ [📅 November ▼] [🏷️ Groceries ▼]       │  ← Collapsed breadcrumbs
├─────────────────────────────────────────┤
│         November 2024                   │
│         $1,340,000                      │  ← Total display
├─────────────────────────────────────────┤
│ [● Aggregation] [○ Comparison]          │  ← Mode toggle
├─────────────────────────────────────────┤
│                                         │
│           [PIE/BAR CHART]               │  ← Chart area
│                                         │
├─────────────────────────────────────────┤
│ ● Food 42%  ● Transport 15%  ...        │  ← Category legend
├─────────────────────────────────────────┤
│ Tap to drill down                       │
│ ┌─────────────────────────────────────┐ │
│ │ ● Week 1        $280,000      21%   │ │  ← Drill cards
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ ● Week 2        $340,000      25%   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 4.4 Breadcrumb Expansion Behavior

**Collapsed State (default):**
- Two buttons side-by-side showing current level only
- Calendar icon + "November" | Tag icon + "Groceries"
- Chevron indicates expandable

**Expanded State (on tap):**
- Dropdown shows all ancestor levels
- Each level labeled (Year, Quarter, Month, Week, Day)
- Current level highlighted with accent color
- Tap any level to navigate there
- Tap outside to collapse

**Interactive Mockups:**

- Design Direction Showcase: [ux-design-directions.html](./ux-design-directions.html)

---

## 5. User Journey Flows

### 5.1 Critical User Paths

**Journey 1: Quick Monthly Overview** (Primary Use Case)
> "Where did my money go this month?"

```
1. User opens app → lands on Home
2. Taps "Analytics" in bottom nav
3. Sees current month view with pie chart (default)
4. Glances at category breakdown in legend
5. Done - question answered in ~3 seconds
```

**Touchpoints:** 2 taps
**Time to insight:** <5 seconds

---

**Journey 2: Drill Down into Category**
> "I spent a lot on Food - what specifically?"

```
1. From monthly pie chart view
2. Taps "Food" drill card (or pie segment)
3. Breadcrumb updates: [November] → [Food]
4. Sees Food subcategories (Groceries, Restaurants, etc.)
5. Taps "Groceries" to drill deeper
6. Breadcrumb: [November] [Food] → [Groceries]
7. Sees store breakdown (Lider, Jumbo, etc.)
```

**Touchpoints:** 2-3 taps per level
**Navigation:** Always visible breadcrumb to jump back

---

**Journey 3: Compare Spending Over Time**
> "Am I spending more this month than last?"

```
1. From monthly view
2. Taps "Comparison" mode toggle
3. Chart switches to stacked bars showing weeks
4. Sees visual comparison of week totals
5. Taps temporal breadcrumb → expands dropdown
6. Taps "Q4" to zoom out to quarter view
7. Sees Oct/Nov/Dec comparison bars
```

**Touchpoints:** 3 taps
**Key insight:** Bars show both total AND category breakdown

---

**Journey 4: Scan New Receipt** (Always Available)
> "I just bought groceries, let me add this receipt"

```
1. From ANY screen in the app
2. Taps center camera FAB (always visible)
3. Camera opens for receipt capture
4. Takes photo → Gemini processes
5. Review extracted items → confirm categories
6. Save → returns to previous screen
```

**Touchpoints:** 1 tap to start scanning
**Key insight:** Never buried, always accessible

---

**Journey 5: Jump Back to Higher Level**
> "I'm deep in Week 3 > Food > Groceries, want to see all of November"

```
1. Currently viewing: Week 3 / Groceries
2. Taps temporal breadcrumb button
3. Dropdown expands showing: Year > Q4 > November > Week 3
4. Taps "November"
5. View updates to November / Groceries
6. (Optional) Taps category breadcrumb, selects "All Categories"
7. Now viewing November / All Categories
```

**Touchpoints:** 2-3 taps
**Key insight:** Independent axis navigation - changing time preserves category filter

---

### 5.2 User Journey Flow Diagram

```
                    ┌──────────────┐
                    │     HOME     │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Receipts │ │   SCAN   │ │Analytics │
        └──────────┘ └──────────┘ └────┬─────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
             ┌────────────┐    ┌────────────┐    ┌────────────┐
             │ Year View  │◄──►│Month View  │◄──►│ Week View  │
             │  (4 Qs)    │    │ (4 Weeks)  │    │  (7 Days)  │
             └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
                   │                 │                 │
                   └────────┬────────┴────────┬────────┘
                            │                 │
                            ▼                 ▼
                     ┌────────────┐    ┌────────────┐
                     │ Category   │    │   Day      │
                     │ Drill Down │    │  Details   │
                     └────────────┘    └────────────┘
```

### 5.3 State Transitions

| From State | Action | To State | Animation |
|------------|--------|----------|-----------|
| Any level | Tap drill card | Child level | Slide left |
| Any level | Tap breadcrumb ancestor | That level | Slide right |
| Aggregation | Tap Comparison toggle | Comparison | Crossfade |
| Comparison | Tap Aggregation toggle | Aggregation | Crossfade |
| Breadcrumb collapsed | Tap breadcrumb button | Dropdown expanded | Slide down |
| Dropdown expanded | Tap outside | Dropdown collapsed | Slide up |
| Any screen | Tap Scan FAB | Camera view | Modal slide up |

---

## 6. Component Library

### 6.1 Component Strategy

**Approach:** Custom Tailwind components with Tailwind UI premium templates as reference

**Component Categories:**

| Category | Components | Source |
|----------|------------|--------|
| Navigation | BottomNav, BreadcrumbButton, BreadcrumbDropdown | Custom |
| Data Display | PieChart, StackedBarChart, DrillCard, StatDisplay | Custom |
| Controls | ModeToggle, ThemeSwitcher | Tailwind UI adapted |
| Layout | ScreenContainer, CardSurface, SectionHeader | Custom |
| Feedback | LoadingSpinner, EmptyState, ErrorState | Custom |

### 6.2 Core Components

#### BottomNavigation
```
Props:
- activeTab: 'home' | 'receipts' | 'analytics' | 'settings'
- onScanPress: () => void

Behavior:
- Fixed to bottom, 90px height (includes safe area)
- Center FAB elevated (-20px) with gradient
- Active tab highlighted with accent color
```

#### CollapsibleBreadcrumb
```
Props:
- type: 'temporal' | 'category'
- items: { label: string, level: string, active: boolean }[]
- currentLabel: string
- isExpanded: boolean
- onToggle: () => void
- onSelect: (index: number) => void

Behavior:
- Collapsed: Shows icon + currentLabel + chevron
- Expanded: Dropdown with all ancestor levels
- Tap outside closes dropdown
```

#### ChartModeToggle
```
Props:
- mode: 'aggregation' | 'comparison'
- onChange: (mode) => void

Behavior:
- Pill-style segmented control
- Active segment has accent background
- Icons + labels for each mode
```

#### PieChart
```
Props:
- data: { label: string, value: number, color: number }[]
- size?: number (default 160)

Behavior:
- SVG-based donut chart
- Each segment proportional to value
- Center cutout for visual balance
```

#### StackedBarChart
```
Props:
- data: { label: string, total: number, segments: { value: number, color: number }[] }[]

Behavior:
- Bars scale to max total
- Each bar divided by category colors
- Dynamic width based on bar count (w-10, w-8, w-6)
- Always has gap-2 between bars
```

#### DrillCard
```
Props:
- label: string
- amount: string
- percent: string
- colorIndex: number
- onPress: () => void

Behavior:
- Full-width card with color indicator
- Hover: border highlight, slight lift
- Touch: scale feedback
```

#### CategoryLegend
```
Props:
- categories: { label: string, value: number, color: number }[]

Behavior:
- Horizontal flex-wrap layout
- Color square + label + percentage
- Centered below chart
```

### 6.3 Component Composition

**Analytics Screen Composition:**
```jsx
<ScreenContainer>
  <BreadcrumbRow>
    <CollapsibleBreadcrumb type="temporal" />
    <CollapsibleBreadcrumb type="category" />
  </BreadcrumbRow>

  <StatDisplay total={amount} subtitle={dateRange} />

  <ChartModeToggle mode={currentMode} />

  {mode === 'aggregation' ? (
    <PieChart data={categoryData} />
  ) : (
    <StackedBarChart data={periodData} />
  )}

  <CategoryLegend categories={categoryData} />

  <DrillCardList>
    {drillItems.map(item => (
      <DrillCard key={item.id} {...item} />
    ))}
  </DrillCardList>
</ScreenContainer>
```

---

## 7. UX Pattern Decisions

### 7.1 Consistency Rules

**Navigation Consistency:**
| Rule | Implementation |
|------|----------------|
| Bottom nav always visible | Fixed position, never hidden on scroll |
| Scan button always accessible | Center FAB on every screen except camera |
| Breadcrumbs always show current position | Even at root level, show "2024" / "All Categories" |

**Interaction Consistency:**
| Rule | Implementation |
|------|----------------|
| Tap = primary action | Drill down, select, navigate |
| Long press = not used | Avoid complexity, keep simple |
| Swipe = not used for navigation | Prevents accidental navigation |
| Pull-to-refresh = only on data lists | Receipts list, not analytics |

**Visual Consistency:**
| Rule | Implementation |
|------|----------------|
| Cards always have 12px border-radius | `rounded-xl` everywhere |
| Touch targets minimum 44px | All buttons, cards, breadcrumbs |
| Icons always 24px, stroke-width 2 | Lucide React standard |
| Amounts always bold, large | `text-3xl font-bold` for totals |

### 7.2 Chart Behavior Rules

**Pie Chart (Aggregation Mode):**
- Shows category breakdown for current temporal period
- Segments clickable → drill into that category
- Legend shows all categories with percentages
- Donut style with center cutout

**Stacked Bar Chart (Comparison Mode):**
- Shows child periods (quarters/months/weeks/days)
- Each bar stacked by category colors
- Same legend as pie chart
- Bars clickable → drill into that period

**Color Assignment:**
- Categories get consistent colors across all views
- Color 1 (blue) = largest category
- Colors assigned by descending value
- Max 6 colors, then cycle

### 7.3 Breadcrumb Behavior Rules

**Temporal Breadcrumb:**
- Levels: Year → Quarter → Month → Week → Day
- Always shows at least one level (Year)
- Current level is active (highlighted)
- Ancestors are tappable to jump back

**Category Breadcrumb:**
- Levels: All Categories → Category → Subcategory → Store
- "All Categories" is root, always accessible
- Drilling down adds to path
- Can clear filter by selecting "All Categories"

**Independence Rule:**
- Changing temporal does NOT reset category
- Changing category does NOT reset temporal
- Both filters persist independently

### 7.4 Loading & Empty States

**Loading:**
- Skeleton shimmer for charts
- Skeleton cards for drill-down list
- No full-screen blockers

**Empty States:**
- No data for period: "No transactions in [period]"
- No data for category: "No spending on [category] in [period]"
- First-time user: "Scan your first receipt to get started!" with prominent scan button

**Error States:**
- Network error: Retry button + cached data if available
- Processing error: "Something went wrong" + contact support link

---

## 8. Responsive Design & Accessibility

### 8.1 Responsive Strategy

**Primary Target:** Mobile PWA (375px - 428px viewport)

**Breakpoints:**
| Breakpoint | Width | Target Devices |
|------------|-------|----------------|
| Mobile (default) | 320px - 428px | iPhone SE to iPhone Pro Max |
| Tablet | 768px+ | iPad, Android tablets |
| Desktop | 1024px+ | Web browser (bonus, not priority) |

**Mobile-First Approach:**
- Design for 375px first (iPhone SE/12/13/14)
- Scale up for larger phones (390px, 414px, 428px)
- Tablet/desktop: center content, max-width container

### 8.2 Layout Adaptations

**Mobile (default):**
```
- Full-width cards
- Single column layout
- Bottom navigation fixed
- Breadcrumbs side-by-side
- Chart fills available width
```

**Tablet (768px+):**
```
- Content centered, max-width 600px
- Same layout as mobile (familiar)
- Larger touch targets optional
- Could show more drill cards
```

**Desktop (1024px+):**
```
- Content centered, max-width 800px
- Side navigation optional (future)
- Hover states for cards
- Keyboard navigation support
```

### 8.3 Accessibility Requirements

**WCAG 2.1 AA Compliance:**

| Requirement | Implementation |
|-------------|----------------|
| Color contrast 4.5:1 | All text meets contrast ratio |
| Touch targets 44px | Minimum size for all interactive elements |
| Focus indicators | Visible focus ring on keyboard navigation |
| Screen reader labels | aria-label on icons, charts |
| Reduced motion | Respect prefers-reduced-motion |

**Specific Implementations:**

**Charts:**
- Screen reader: "Pie chart showing category breakdown. Food 42%, Transport 15%..."
- High contrast mode: Patterns in addition to colors
- Focus: Tab through segments

**Breadcrumbs:**
- aria-label: "Current temporal view: November 2024"
- aria-expanded: true/false for dropdown state
- Role: navigation

**Bottom Navigation:**
- Role: navigation
- aria-current: "page" for active tab
- Scan button: aria-label="Scan receipt"

### 8.4 Performance Considerations

**Target Metrics:**
| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.5s |
| Time to Interactive | <3s |
| Largest Contentful Paint | <2.5s |

**Optimizations:**
- Skeleton loading for perceived performance
- SVG charts (no heavy chart libraries)
- Lazy load drill cards below fold
- Cache analytics data locally

---

## 9. Implementation Guidance

### 9.1 Implementation Priority

**Phase 1: Foundation (Stories 7.1-7.2)**
1. Implement theme system with CSS variables
2. Add Ni no Kuni/Ghibli theme alongside Slate Professional
3. Build CollapsibleBreadcrumb component
4. Wire temporal navigation (Year → Quarter → Month → Week → Day)

**Phase 2: Core Analytics (Stories 7.3-7.4)**
1. Build ChartModeToggle (Aggregation/Comparison)
2. Implement PieChart with tap-to-drill
3. Implement StackedBarChart with category stacking
4. Add CategoryLegend component (shared by both chart types)

**Phase 3: Navigation Polish (Stories 7.5-7.6)**
1. Wire category breadcrumb (Category → Subcategory → Store)
2. Implement independent axis behavior
3. Add drill cards with consistent styling
4. Test and refine transitions

**Phase 4: Accessibility & Polish (Story 7.7)**
1. Add ARIA labels to all interactive elements
2. Verify contrast ratios across both themes
3. Test with screen readers
4. Add keyboard navigation for desktop/tablet

### 9.2 Key Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/CollapsibleBreadcrumb.tsx` | Create | Dual breadcrumb navigation |
| `src/components/ChartModeToggle.tsx` | Create | Aggregation/Comparison switch |
| `src/components/charts/PieChart.tsx` | Modify | Add tap handlers, donut style |
| `src/components/charts/StackedBarChart.tsx` | Modify | Category stacking, gaps |
| `src/components/CategoryLegend.tsx` | Create | Shared legend component |
| `src/components/DrillCard.tsx` | Create | Consistent drill-down cards |
| `src/styles/themes.css` | Create | CSS variables for theming |
| `src/contexts/ThemeContext.tsx` | Modify | Add theme selection logic |

### 9.3 Testing Checklist

- [ ] Theme switching works in both light and dark modes
- [ ] Breadcrumbs collapse/expand correctly on mobile
- [ ] Temporal navigation preserves category filter
- [ ] Category navigation preserves temporal filter
- [ ] Charts render correctly with 0, 1, 5, 10+ categories
- [ ] Touch targets are minimum 44px
- [ ] Scan FAB is always visible and functional
- [ ] Screen reader announces chart data correctly
- [ ] Performance: FCP <1.5s, TTI <3s

### 9.4 Design Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Design system | Tailwind CSS + custom components | Already in use, no migration needed |
| Theme options | Slate Professional + Ni no Kuni | Professional default, friendly alternative |
| Breadcrumb style | Collapsible buttons | Space-efficient on mobile, full path on tap |
| Chart library | Custom SVG | Lightweight, full control, no dependencies |
| Navigation | Bottom nav with center FAB | Familiar pattern, thumb-friendly, scan always available |
| Interactions | Tap only (no swipe/long-press) | Simple, predictable, accessible |

### 9.5 Success Metrics

**User Experience:**
- Time to answer "Where did my money go?" < 5 seconds
- Navigation errors (wrong tap) < 5%
- User can explain breadcrumb system after first use

**Technical:**
- No layout shift during theme changes
- Chart animations < 300ms
- Breadcrumb expansion < 150ms

**Accessibility:**
- WCAG 2.1 AA compliance
- Screen reader navigation time < 2x visual navigation

---

## Appendix

### Related Documents

- Product Requirements: `docs/prd-epic7.md`
- Project Documentation: `docs/index.md`

### Core Interactive Deliverables

This UX Design Specification was created through visual collaboration:

- **Color Theme Visualizer**: docs/ux-color-themes.html
  - Interactive HTML showing all color theme options explored
  - Live UI component examples in each theme
  - Side-by-side comparison and semantic color usage

- **Design Direction Mockups**: docs/ux-design-directions.html
  - Interactive HTML with 6-8 complete design approaches
  - Full-screen mockups of key screens
  - Design philosophy and rationale for each direction

### Version History

| Date       | Version | Changes                         | Author |
| ---------- | ------- | ------------------------------- | ------ |
| 2025-12-04 | 1.0     | Initial UX Design Specification | Gabe   |
| 2025-12-05 | 1.1     | Finalized all sections: user journeys, component library, UX patterns, responsive/accessibility, implementation guidance | Gabe   |

---

_This UX Design Specification was created through collaborative design facilitation, not template generation. All decisions were made with user input and are documented with rationale._
