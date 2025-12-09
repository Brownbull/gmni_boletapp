# Boletapp Epic 7 - Product Requirements Document

**Author:** Gabe
**Date:** 2025-12-04
**Version:** 1.0

---

## Executive Summary

Boletapp has reached a milestone: the core functionality works well. Receipt scanning, item extraction, category learning, and data export are all operational. Now it's time to polish the interface and user experience to make it feel **professional, simple, and impactful**.

This epic transforms the analytics experience from functional-but-inconsistent to a cohesive, intuitive system that helps Chilean families answer the fundamental question: **"Where did my money go?"**

Life in Chile is getting expensive. People reach the end of the month wondering where their money went. Boletapp answers that question without the pain of manual data entry - scan your receipts and get insights immediately. Epic 7 ensures that experience feels as good as it works.

### What Makes This Special

**Boletapp's unique breakthrough:** No competitor combines receipt scanning + item extraction + category learning + analytics in one flow. Other apps connect to banks or require manual entry. Boletapp is **proactive** - scan and go - instead of **reactive** - sit down and type everything.

Epic 7 gives this breakthrough the professional, polished interface it deserves. An experience with soul that communicates: "This makes your life better and simpler."

---

## Project Classification

**Technical Type:** web_app (PWA)
**Domain:** general (personal finance, expense tracking)
**Complexity:** medium

This is a **brownfield UX redesign** of an existing, functional application. The core features (scanning, categorization, learning, export) are complete. This epic focuses on:
- Fixing UI inconsistencies and bugs
- Adding missing temporal navigation (Quarter, Week views)
- Creating a unified navigation architecture
- Polishing the professional feel

---

## Success Criteria

Success for Epic 7 means users experience the analytics as **intuitive and professional**:

1. **Navigation feels natural** - Users can move between Year → Quarter → Month → Week → Day without confusion. They always know where they are and how to go back.

2. **Consistency builds trust** - Same icons, fonts, positions, and patterns across all views. No layout shifts, no surprises.

3. **Dual-axis exploration works** - Users can slice data by time (when) AND category (what) on every view. "Show me October's groceries" is one tap away from "Show me all 2024 groceries."

4. **Bugs are gone** - Month selection shows the correct month. Spanish interface shows Spanish labels. Icons are consistent sizes.

5. **Download behavior is predictable** - Users understand what they'll get when they tap download at any level.

### Business Metrics

- **User retention:** Users return to check analytics (not just scan receipts)
- **Session depth:** Users explore multiple temporal levels per session
- **Export usage:** Increased downloads indicate users find the data valuable
- **Preparation for Epic 8:** UX quality bar met for subscription monetization

---

## Product Scope

### MVP - Minimum Viable Product

The MVP for Epic 7 delivers a **consistent, bug-free analytics experience** with proper navigation architecture.

#### Bug Fixes (Must Have)

1. **Month selection off-by-one** - Selecting October shows November data
2. **Icon size inconsistency** - Icons vary in size between views
3. **Bottom bar layout shifts** - Navigation bar moves unexpectedly
4. **Spanish translation gaps** - Interface shows English labels in Spanish mode

#### Navigation Architecture (Must Have)

5. **Dual-axis navigation model** - Every view supports both:
   - **Temporal axis:** Year → Quarter → Month → Week → Day
   - **Category axis:** All → Category → Group → Subcategory → Transaction

6. **Consistent top bar pattern** - Every temporal view has:
   - Back navigation (left)
   - Period indicator with selector (center-left)
   - Download button (right)
   - Chart type toggle (right)

7. **Quarter view** - New temporal level between Year and Month
   - Shows 3-month aggregation (Q1, Q2, Q3, Q4)
   - Drill-down to months within quarter

8. **Week view in Month** - New temporal level between Month and Day
   - Shows weekly breakdown within selected month
   - Drill-down to days within week

#### Download Behavior Standardization (Must Have)

| View Level | Download Content | Icon |
|------------|------------------|------|
| Year | Yearly statistics summary | BarChart2 |
| Quarter | Yearly statistics summary | BarChart2 |
| Month | Full transactions for that month | FileText |
| Week | Full transactions for parent month | FileText |
| Day | Full transactions for parent month | FileText |

### Growth Features (Post-MVP)

These enhance the experience but are not required for the MVP quality bar:

9. **New graph types** - Additional visualization options beyond pie/bar:
    - Line chart for trend over time
    - Stacked area chart for composition over time
    - Horizontal bar for category comparison

10. **Graph type Settings toggles** - User can enable/disable graph types in Settings

11. **Dark mode contrast improvements** - Ensure all UI elements have proper contrast in dark mode

**Note:** Category-specific downloads were considered but removed from scope. The existing download behavior (yearly stats at Year/Quarter level, full transactions at Month/Week/Day level) applies regardless of category filter. This keeps the export simple and predictable.

### Vision (Future)

Beyond Epic 7, analytics could evolve to include:

- **AI-powered insights** - "You spent 23% more on groceries than last month"
- **Budget tracking** - Set category budgets and track progress
- **Predictive analytics** - "At this rate, you'll spend X by month end"
- **Comparison views** - Compare months, quarters, or years side-by-side
- **Export scheduling** - Automatic monthly reports via email

---

## Web App Specific Requirements

### Browser Support

Boletapp is a Progressive Web App (PWA) targeting modern mobile browsers:

- **Primary:** Chrome Mobile (Android), Safari Mobile (iOS)
- **Secondary:** Chrome Desktop, Safari Desktop, Firefox
- **Not supported:** IE11, legacy Edge

### Responsive Design

Epic 7 focuses on **mobile-first** design since receipt scanning happens on phones:

- **Primary viewport:** 375px - 428px (iPhone SE to iPhone Pro Max)
- **Secondary viewport:** 768px+ (tablet/desktop for analytics review)
- **Touch targets:** Minimum 44x44px for all interactive elements
- **Safe areas:** Respect notch/home indicator on modern devices

### Performance Targets

Analytics views must feel instant:

- **Time to Interactive:** < 2s on 3G connection
- **Chart render:** < 500ms after data load
- **View transitions:** < 300ms for drill-down navigation
- **No layout shift:** CLS score < 0.1

### PWA Capabilities

- **Offline:** Analytics should work with cached data when offline
- **Install prompt:** Already implemented, no changes needed
- **Push notifications:** Not in scope for Epic 7

---

## User Experience Principles

### Design Philosophy

Boletapp's UX should feel **professional, simple, and impactful**:

1. **Professional** - Clean lines, consistent spacing, no visual clutter
2. **Simple** - One primary action per screen, clear hierarchy
3. **Impactful** - Data visualizations that tell a story at a glance

### The Soul of the Interface

The UX should communicate: **"This makes your life better and simpler."**

- Users shouldn't feel they're doing accounting
- They should feel empowered to understand their spending
- Every interaction should feel effortless

### Key Interactions

#### Dual Breadcrumb Navigation Architecture

The analytics view has **two independent breadcrumb trails** that work together:

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPORAL BREADCRUMB                                            │
│  [2024] › [Q4] › [October]                    [📊] [📥]        │
├─────────────────────────────────────────────────────────────────┤
│  CATEGORY BREADCRUMB                                            │
│  [Food] › [Groceries] › Meats                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    $1,250 TOTAL                                 │
│                                                                 │
│                    ┌─────────┐                                  │
│                    │  CHART  │                                  │
│                    │  (pie   │                                  │
│                    │   or    │                                  │
│                    │   bar)  │                                  │
│                    └─────────┘                                  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  DRILL-DOWN OPTIONS (based on current view)                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Oct 1-7     │ │ Oct 8-14    │ │ Oct 15-21   │  (weeks)      │
│  │ $320        │ │ $450        │ │ $280        │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Chicken     │ │ Beef        │ │ Pork        │  (subcats)    │
│  │ $89         │ │ $156        │ │ $45         │               │
│  └─────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
```

#### Temporal Breadcrumb (5 levels)

Shows current position in time hierarchy. Each segment is tappable to jump back.

| Level | Example | Tap Behavior |
|-------|---------|--------------|
| Year | `2024` | Jump to year view |
| Quarter | `Q4` | Jump to quarter view |
| Month | `October` | Jump to month view (current) |
| Week | `Oct 8-14` | Jump to week view |
| Day | `Oct 10` | Jump to day view |

**Week labeling uses date ranges** (not week numbers): `Oct 1-7`, `Oct 8-14`, etc.

#### Category Breadcrumb (3 levels)

Shows current category filter. Each segment is tappable to jump back.

| Level | Scope | Example |
|-------|-------|---------|
| Category | Transaction-level | `Food`, `Transport`, `Shopping` |
| Group | Item-level | `Groceries`, `Restaurants`, `Delivery` |
| Subcategory | Item-level | `Meats`, `Produce`, `Dairy` |

**No category selected** = breadcrumb shows "All Categories" or is hidden.

#### Chart Dual Mode (All Temporal Views)

Every temporal view supports **two visualization modes** via chart toggle:

| Mode | Purpose | Chart Type | What It Shows |
|------|---------|------------|---------------|
| **Aggregation** (default) | "What did I spend on?" | Pie or Bar | Category breakdown for the period |
| **Comparison** | "How does spending vary?" | Grouped Bar | Child periods side-by-side |

**Dual Mode by View Level:**

| View | Aggregation Mode | Comparison Mode |
|------|------------------|-----------------|
| **Year** | 2024 total by category | Q1 vs Q2 vs Q3 vs Q4 |
| **Quarter** | Q4 total by category | Oct vs Nov vs Dec |
| **Month** | October total by category | Week 1 vs Week 2 vs Week 3 vs Week 4 |
| **Week** | Oct 8-14 total by category | Mon vs Tue vs Wed vs Thu vs Fri vs Sat vs Sun |
| **Day** | Oct 10 total by category | N/A (single day, no children) |

**Toggle Behavior:**
- Tap chart icon to switch between modes
- Aggregation: Pie (default) or Vertical Bar
- Comparison: Grouped/Stacked Bar only
- User's last choice is remembered per session

#### Dual-Axis Example

User wants to see "October's meat spending":

1. Start at `[2024]` - year view, all categories
2. Tap Q4 in drill-down → `[2024] › [Q4]`
3. Tap October → `[2024] › [Q4] › [October]`
4. Tap Food slice → `[Food]` appears in category breadcrumb
5. Tap Groceries → `[Food] › [Groceries]`
6. Tap Meats → `[Food] › [Groceries] › [Meats]`

**Current view:** October + Meats
- Temporal: `[2024] › [Q4] › [October]`
- Category: `[Food] › [Groceries] › [Meats]`
- Chart shows meat subcategory breakdown for October
- Drill-down shows weeks (Oct 1-7, Oct 8-14, etc.)

**To see all 2024 meats:** Tap `[2024]` in temporal breadcrumb
**To see October groceries:** Tap `[Groceries]` in category breadcrumb
**To see all October spending:** Tap `[All]` or clear category breadcrumb

#### Empty States

When a period or category has no data:

- **Specific message:** "No transactions in Q3 2024" or "No Groceries in October"
- **Suggested action:** "Scan a receipt to add data"
- **Navigation visibility:** Empty periods appear grayed out but remain tappable in breadcrumb

### Visual Consistency Rules

| Element | Specification |
|---------|---------------|
| Icons | 24px, stroke-width 2, from lucide-react |
| Fonts | System font stack, weights 400/600/700 |
| Spacing | 8px grid system (8, 16, 24, 32px) |
| Colors | Slate palette for UI, category colors for data |
| Corners | 8px for cards, 4px for buttons |
| Shadows | Minimal - only for elevation (modals) |

### Accessibility Requirements

- **WCAG 2.1 AA compliance** for all new components
- **Focus indicators** visible on all interactive elements
- **Screen reader support** for charts (aria-labels with data summary)
- **Keyboard navigation** for all temporal/category selections
- **Color contrast** 4.5:1 minimum for text

---

## Functional Requirements

The capability contract for Epic 7. UX designers will design what's listed here. Architects will support what's listed here. Epic breakdown will implement what's listed here.

### Bug Fixes

- **FR1:** Month selector displays the correct month (fix off-by-one bug)
- **FR2:** All icons render at consistent 24px size across all views
- **FR3:** Bottom navigation bar maintains fixed position without layout shifts
- **FR4:** Spanish language mode displays all labels in Spanish (no English fallbacks)

### Temporal Navigation

- **FR5:** Users can view analytics at Year level showing annual totals
- **FR6:** Users can view analytics at Quarter level (Q1, Q2, Q3, Q4) showing 3-month aggregation
- **FR7:** Users can view analytics at Month level showing monthly totals
- **FR8:** Users can view analytics at Week level showing weekly totals with date range labels (e.g., "Oct 1-7")
- **FR9:** Users can view analytics at Day level showing daily totals
- **FR10:** Users can drill down from any temporal level to the next (Year→Quarter→Month→Week→Day)
- **FR11:** Users can navigate back to any previous temporal level via breadcrumb

### Temporal Breadcrumb

- **FR12:** Temporal breadcrumb displays current position in hierarchy (e.g., "2024 › Q4 › October")
- **FR13:** Each segment in temporal breadcrumb is tappable to jump directly to that level
- **FR14:** Temporal breadcrumb updates immediately when user navigates
- **FR15:** Current temporal level is visually distinguished in breadcrumb (highlighted/bold)

### Category Navigation

- **FR16:** Users can filter analytics by Category (transaction-level: Food, Transport, etc.)
- **FR17:** Users can filter analytics by Group (item-level: Groceries, Restaurants, etc.)
- **FR18:** Users can filter analytics by Subcategory (item-level: Meats, Produce, etc.)
- **FR19:** Users can drill down from Category→Group→Subcategory→Transaction list
- **FR20:** Users can navigate back to any previous category level via breadcrumb

### Category Breadcrumb

- **FR21:** Category breadcrumb displays current filter (e.g., "Food › Groceries › Meats")
- **FR22:** Each segment in category breadcrumb is tappable to jump directly to that filter level
- **FR23:** Category breadcrumb shows "All Categories" or is hidden when no filter is active
- **FR24:** Category breadcrumb updates immediately when user selects or clears a filter

### Dual-Axis Navigation

- **FR25:** Temporal and category filters work independently (can be combined or used separately)
- **FR26:** Changing temporal level preserves current category filter
- **FR27:** Changing category filter preserves current temporal level
- **FR28:** Users can view any combination of temporal level + category filter (e.g., "Q4 + Groceries")

### Chart Display

- **FR29:** Analytics view displays a chart showing spending breakdown
- **FR30:** Chart displays total amount for current view (temporal + category filters applied)
- **FR31:** Users can toggle between Aggregation mode (category breakdown) and Comparison mode (child periods)
- **FR32:** Aggregation mode shows Pie chart (default) or Vertical Bar chart
- **FR33:** Comparison mode shows Grouped Bar chart comparing child periods
- **FR34:** Year view Comparison mode shows Q1 vs Q2 vs Q3 vs Q4
- **FR35:** Quarter view Comparison mode shows Month1 vs Month2 vs Month3
- **FR36:** Month view Comparison mode shows Week1 vs Week2 vs Week3 vs Week4(+)
- **FR37:** Week view Comparison mode shows Mon vs Tue vs Wed vs Thu vs Fri vs Sat vs Sun
- **FR38:** Day view only shows Aggregation mode (no comparison - single day has no children)
- **FR39:** Chart type selection is remembered for the session

### Drill-Down Options

- **FR40:** Below the chart, drill-down options show available child periods (temporal)
- **FR41:** Below the chart, drill-down options show available subcategories (category)
- **FR42:** Each drill-down option displays its label and total amount
- **FR43:** Tapping a drill-down option navigates to that level

### Empty States

- **FR44:** When a period has no transactions, display specific message (e.g., "No transactions in Q3 2024")
- **FR45:** Empty state includes suggested action: "Scan a receipt to add data"
- **FR46:** Empty periods appear grayed out but remain tappable in breadcrumb navigation

### Download/Export

- **FR47:** Download button is visible on all temporal views
- **FR48:** At Year or Quarter level, download exports yearly statistics summary (CSV)
- **FR49:** At Month, Week, or Day level, download exports full transactions for that month (CSV)
- **FR50:** Download icon changes based on export type (BarChart2 for stats, FileText for transactions)
- **FR51:** Download works regardless of current category filter (exports all categories)

### Visual Consistency

- **FR52:** All temporal views use identical layout structure (breadcrumbs, chart, drill-downs)
- **FR53:** All icons use 24px size with stroke-width 2 from lucide-react
- **FR54:** All spacing follows 8px grid system
- **FR55:** All interactive elements have minimum 44x44px touch targets

### Internationalization

- **FR56:** All new UI labels have English and Spanish translations
- **FR57:** Date formatting respects user's language setting (locale-aware)
- **FR58:** Currency formatting respects user's currency setting

---

## Non-Functional Requirements

### Performance

- **NFR1:** View transitions complete in < 300ms (drill-down, breadcrumb navigation)
- **NFR2:** Chart renders in < 500ms after data is available
- **NFR3:** Cumulative Layout Shift (CLS) score < 0.1 (no layout jumps)
- **NFR4:** Time to Interactive < 2s on 3G connection for analytics view

### Accessibility

- **NFR5:** All new components meet WCAG 2.1 AA compliance
- **NFR6:** All interactive elements have visible focus indicators
- **NFR7:** Charts include aria-labels with data summary for screen readers
- **NFR8:** All breadcrumb segments are keyboard-navigable (Tab + Enter)
- **NFR9:** Color contrast ratio ≥ 4.5:1 for all text elements
- **NFR10:** Touch targets minimum 44x44px for mobile accessibility

### Compatibility

- **NFR11:** Works on Chrome Mobile 90+ (Android)
- **NFR12:** Works on Safari Mobile 14+ (iOS)
- **NFR13:** Works on Chrome Desktop 90+, Safari Desktop 14+, Firefox 90+
- **NFR14:** Responsive layout supports 375px to 1920px viewport widths

### Maintainability

- **NFR15:** New components have unit test coverage ≥ 80%
- **NFR16:** Navigation state management is centralized (single source of truth)
- **NFR17:** Breadcrumb components are reusable across views

### Security

- **NFR18:** No changes to existing security model (user data isolation maintained)
- **NFR19:** Export functionality respects existing subscription tier checks

---

## PRD Summary

### Epic 7 at a Glance

| Attribute | Value |
|-----------|-------|
| **Epic Name** | Analytics UX Redesign |
| **Type** | UX Polish / Feature Enhancement |
| **Functional Requirements** | 58 FRs |
| **Non-Functional Requirements** | 19 NFRs |
| **MVP Scope** | Bug fixes + Dual breadcrumb navigation + Quarter/Week views + Dual chart mode |
| **Growth Scope** | New graph types, Settings toggles, Dark mode polish |

### Key Deliverables

1. **Dual Breadcrumb Navigation** - Temporal (5 levels) + Category (3 levels) working independently
2. **Quarter View** - New temporal level between Year and Month
3. **Week View** - New temporal level between Month and Day (date range labels)
4. **Chart Dual Mode** - Aggregation vs Comparison toggle on all views
5. **Bug Fixes** - Month off-by-one, icon sizes, layout shifts, Spanish translations
6. **Visual Consistency** - Identical structure across all temporal views

### What Makes This Special

This epic transforms Boletapp's analytics from "functional but inconsistent" to "professional and intuitive." Users will be able to answer "where did my money go?" by naturally exploring their data across time and categories - without ever feeling lost.

The dual breadcrumb architecture gives users complete control:
- **Know where you are** - Always visible position in both hierarchies
- **Go anywhere directly** - Tap any breadcrumb segment to jump
- **Explore freely** - Combine temporal and category filters in any way

This is the quality bar that prepares Boletapp for monetization in Epic 8.

---

## Next Steps

1. **UX Design** - `workflow create-ux-design` - Design the dual breadcrumb components and view layouts
2. **Architecture** - `workflow create-architecture` - Define state management for navigation
3. **Tech Spec** - `workflow tech-spec` - Break down into implementable stories
4. **Implementation** - Story cycle with deployment story at end

**Recommendation:** Start with UX Design to nail the visual patterns before architecture.

---

_This PRD captures the essence of Epic 7 - transforming analytics from functional to professional, giving Chilean families a tool that helps them understand their spending without the pain of manual tracking._

_Created through collaborative discovery between Gabe and AI facilitator._
