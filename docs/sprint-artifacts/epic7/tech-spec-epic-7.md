# Epic Technical Specification: Analytics UX Redesign

Date: 2025-12-05
Author: Gabe
Epic ID: 7
Status: Draft

---

## Overview

Epic 7 transforms Boletapp's analytics experience from functional-but-inconsistent to professional and intuitive. This is a **brownfield UX redesign** of an existing production application with 6 completed epics, 450+ tests, and active users.

The core innovation is **dual-axis breadcrumb navigation** - a novel UX pattern allowing users to independently filter by time (Year → Quarter → Month → Week → Day) and category (Category → Group → Subcategory). This enables Chilean families to naturally explore their spending data to answer the fundamental question: "Where did my money go?"

Key deliverables include: bug fixes for existing UI inconsistencies (month off-by-one, icon sizes, layout shifts, Spanish translations), new Quarter and Week temporal views, collapsible breadcrumb components, chart dual mode (Aggregation vs Comparison), and drill-down cards for hierarchical navigation. The epic prepares the UX quality bar needed for monetization in Epic 8.

## Objectives and Scope

**In Scope (MVP):**
- Bug fixes: Month selector off-by-one (FR1), icon size inconsistency (FR2), bottom bar layout shifts (FR3), Spanish translation gaps (FR4)
- Dual-axis navigation: 5 temporal levels (Year/Quarter/Month/Week/Day) + 3 category levels (Category/Group/Subcategory)
- Temporal breadcrumb: Collapsible dropdown showing position, each segment tappable
- Category breadcrumb: Collapsible dropdown with "All Categories" reset option
- Quarter view: New temporal level with Q1-Q4 aggregation
- Week view: Month-aligned chunks (Oct 1-7, 8-14, etc.) with date range labels
- Chart dual mode: Aggregation (pie/bar for "what") vs Comparison (grouped bar for "when")
- Drill-down cards: Tappable cards showing child periods/categories with amounts
- Empty states: Helpful messaging when no data exists for period/category
- Download standardization: BarChart2 icon for stats (Year/Quarter), FileText for transactions (Month/Week/Day)
- Visual consistency: 24px icons, 8px grid, 44px touch targets
- Internationalization: English and Spanish labels, locale-aware date/currency formatting

**Out of Scope:**
- New graph types (line, stacked area, horizontal bar) - Growth feature
- Graph type Settings toggles - Growth feature
- Dark mode contrast improvements - Growth feature
- Ghibli theme implementation - Post-MVP
- AI-powered insights - Vision
- Budget tracking - Vision
- URL state sync for shareable links - Future epic
- Category-specific downloads - Intentionally excluded for simplicity

## System Architecture Alignment

**Alignment with Existing Stack (ADRs from architecture-epic7.md):**

| Decision | Choice | Impact on Epic 7 |
|----------|--------|------------------|
| State Management | React Context with useReducer (ADR-010) | Centralizes 6+ useState calls scattered in App.tsx into single AnalyticsContext |
| Component Structure | Incremental extraction (ADR-014) | Extract one component per story to reduce Big Bang refactor risk |
| Breadcrumb UX | Collapsible dropdowns | Space-efficient on mobile, full path visible on tap |
| Week Calculation | Month-aligned chunks (ADR-012) | Oct 1-7, 8-14, etc. - NOT ISO weeks (matches user mental model) |
| Chart Strategy | Registry Pattern (ADR-011) | Future-ready for Sankey, Treemap, Heatmap; easy Settings toggles |
| Theme System | CSS Variables (ADR-013) | Runtime theme switching without page reload |

**Integration Points:**
- `useTransactions` hook (existing) → AnalyticsContext (new) → TrendsView (refactored)
- No new Firestore collections or Cloud Functions required
- Export functionality uses existing `csvExport.ts` utilities from Epic 5
- Subscription tier checks use existing `useSubscriptionTier` hook from Epic 5

**Critical Constraint:** State Management Chaos is the #1 failure mode. All navigation state MUST flow through AnalyticsContext - no component should maintain its own navigation state that conflicts with the context.

## Detailed Design

### Services and Modules

| Module | Location | Responsibility | Stories |
|--------|----------|----------------|---------|
| **AnalyticsContext** | `src/contexts/AnalyticsContext.tsx` | Single source of truth for temporal/category/chartMode state; useReducer for state updates; validateNavigationState() for impossible state detection | 7.1 |
| **useAnalyticsNavigation** | `src/hooks/useAnalyticsNavigation.ts` | Custom hook exposing context state and dispatch; memoized selectors for derived state | 7.1 |
| **TemporalBreadcrumb** | `src/components/analytics/TemporalBreadcrumb.tsx` | Collapsible dropdown showing temporal hierarchy; tap handlers for navigation; keyboard accessibility | 7.2 |
| **CategoryBreadcrumb** | `src/components/analytics/CategoryBreadcrumb.tsx` | Collapsible dropdown showing category filter; "All Categories" reset; preserves temporal when changed | 7.3 |
| **ChartModeToggle** | `src/components/analytics/ChartModeToggle.tsx` | Pill-style segmented control; dispatches TOGGLE_CHART_MODE; hidden on Day view | 7.4 |
| **chartRegistry** | `src/config/chartRegistry.ts` | Registry mapping chart types to components + metadata; getChartsForMode() helper | 7.4 |
| **AnalyticsChart** | `src/components/charts/AnalyticsChart.tsx` | Wrapper selecting chart from registry based on mode; handles transitions | 7.4 |
| **DrillDownCard** | `src/components/analytics/DrillDownCard.tsx` | Presentational component: label, amount, percentage, color; memo'd for performance | 7.5 |
| **DrillDownGrid** | `src/components/analytics/DrillDownGrid.tsx` | Grid layout consuming context; renders temporal children + category children | 7.5 |
| **Date Utilities** | `src/utils/date.ts` (extended) | getQuartersInYear(), getWeeksInMonth(), getQuarterFromMonth(), formatWeekLabel() | 7.6 |
| **TrendsView** | `src/views/TrendsView.tsx` (refactored) | Orchestration-only; delegates to child components; no direct state management | 7.7 |
| **translations** | `src/utils/translations.ts` (extended) | New keys for temporal/category labels in English and Spanish | 7.8 |

### Data Models and Contracts

**New Type Definitions (src/types/analytics.ts):**

```typescript
// Temporal hierarchy levels
type TemporalLevel = 'year' | 'quarter' | 'month' | 'week' | 'day';

// Temporal position in the hierarchy
interface TemporalPosition {
  level: TemporalLevel;
  year: string;              // "2024"
  quarter?: string;          // "Q1" | "Q2" | "Q3" | "Q4"
  month?: string;            // "2024-10" (YYYY-MM format)
  week?: number;             // 1-5 (week index within month)
  day?: string;              // "2024-10-15" (YYYY-MM-DD format)
}

// Category hierarchy levels
type CategoryLevel = 'all' | 'category' | 'group' | 'subcategory';

// Category filter position
interface CategoryPosition {
  level: CategoryLevel;
  category?: string;         // "Food", "Transport", etc.
  group?: string;            // "Groceries", "Restaurants", etc.
  subcategory?: string;      // "Meats", "Produce", etc.
}

// Chart display mode
type ChartMode = 'aggregation' | 'comparison';

// Complete navigation state
interface AnalyticsNavigationState {
  temporal: TemporalPosition;
  category: CategoryPosition;
  chartMode: ChartMode;
}

// Navigation actions (for useReducer)
type NavigationAction =
  | { type: 'SET_TEMPORAL_LEVEL'; payload: TemporalPosition }
  | { type: 'SET_CATEGORY_FILTER'; payload: CategoryPosition }
  | { type: 'TOGGLE_CHART_MODE' }
  | { type: 'RESET_TO_YEAR'; payload: { year: string } }
  | { type: 'CLEAR_CATEGORY_FILTER' };
```

**Existing Data Model (UNCHANGED):**
- `Transaction` interface remains as-is
- `TransactionItem` interface remains as-is (category, subcategory fields used for filtering)
- No Firestore schema changes required

**Derived Data Structures:**

```typescript
interface PeriodSummary {
  label: string;          // "Q4", "October", "Oct 1-7"
  total: number;
  transactionCount: number;
}

interface CategorySummary {
  label: string;          // "Food", "Groceries", "Meats"
  total: number;
  percentage: number;     // Of current view total
  color: string;          // From getColor() utility
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  segments?: ChartData[]; // For stacked/comparison charts
}
```

### APIs and Interfaces

**No new API endpoints.** All data comes from existing `useTransactions` hook reading from Firestore. Navigation state is client-side only.

**Context API:**

```typescript
// AnalyticsContext exports
interface AnalyticsContextValue {
  state: AnalyticsNavigationState;
  dispatch: React.Dispatch<NavigationAction>;
  // Derived/memoized selectors
  filteredTransactions: Transaction[];
  periodSummaries: PeriodSummary[];
  categorySummaries: CategorySummary[];
}

// Hook usage
const { state, dispatch, filteredTransactions } = useAnalyticsNavigation();
```

**Component Props:**

```typescript
// DrillDownCard (presentational)
interface DrillDownCardProps {
  label: string;
  value: number;
  percentage?: number;
  onClick: () => void;
  colorIndex?: number;
  isEmpty?: boolean;
}

// Breadcrumb components
interface BreadcrumbProps {
  // No props - consume from context
}
```

### Workflows and Sequencing

**User Journey: Drill-Down Flow**

```
1. User on Year 2024, All Categories
   ↓ Tap "Q4" drill card
2. AnalyticsContext dispatch({ type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } })
   ↓ State updates
3. TemporalBreadcrumb re-renders: [2024] › [Q4]
4. Chart re-renders with Q4 data
5. DrillDownGrid shows October, November, December cards
   ↓ Tap "October" drill card
6. dispatch({ type: 'SET_TEMPORAL_LEVEL', payload: { level: 'month', ..., month: '2024-10' } })
   ↓ State updates
7. Breadcrumb: [2024] › [Q4] › [October]
8. Drill cards show weeks: Oct 1-7, Oct 8-14, etc.
```

**User Journey: Category Filter Flow**

```
1. User on October, All Categories
   ↓ Tap "Food" pie slice OR "Food" drill card
2. dispatch({ type: 'SET_CATEGORY_FILTER', payload: { level: 'category', category: 'Food' } })
   ↓ State updates (temporal preserved!)
3. CategoryBreadcrumb re-renders: [Food]
4. Chart re-renders showing Food breakdown (Groceries, Restaurants, etc.)
5. Temporal breadcrumb unchanged: [2024] › [Q4] › [October]
```

**User Journey: Breadcrumb Jump-Back**

```
1. User on Week Oct 8-14, Groceries filter
   ↓ Tap "Q4" in temporal breadcrumb dropdown
2. dispatch({ type: 'SET_TEMPORAL_LEVEL', payload: { level: 'quarter', year: '2024', quarter: 'Q4' } })
   ↓ Temporal resets to Q4, but category PRESERVED
3. View now shows Q4 Groceries (not all categories)
```

**Data Flow:**

```
┌─────────────────────────────────────────────────────────────┐
│                        App.tsx                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            AnalyticsContext.Provider                   │  │
│  │                                                        │  │
│  │   useTransactions() ──► filteredTransactions ──►      │  │
│  │                                                        │  │
│  │   ┌──────────────┐    ┌──────────────┐               │  │
│  │   │TemporalBread │    │CategoryBread │               │  │
│  │   │    crumb     │    │    crumb     │               │  │
│  │   └──────┬───────┘    └──────┬───────┘               │  │
│  │          │ dispatch()        │ dispatch()             │  │
│  │          ▼                   ▼                        │  │
│  │   ┌────────────────────────────────────┐             │  │
│  │   │   AnalyticsContext (state)          │◄────────┐  │  │
│  │   └────────────────────────────────────┘          │  │  │
│  │          │                                         │  │  │
│  │          ▼                                         │  │  │
│  │   ┌──────────────┐  ┌──────────────┐              │  │  │
│  │   │AnalyticsChart│  │ChartModeToggle│──────────────┘  │  │
│  │   └──────────────┘  └──────────────┘                  │  │
│  │          │                                            │  │
│  │          ▼                                            │  │
│  │   ┌──────────────┐                                    │  │
│  │   │DrillDownGrid │                                    │  │
│  │   └──────────────┘                                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Non-Functional Requirements

### Performance

| NFR ID | Requirement | Target | Source | Validation |
|--------|-------------|--------|--------|------------|
| NFR1 | View transitions complete quickly | < 300ms | PRD NFR1 | Manual timing, Lighthouse |
| NFR2 | Chart renders after data available | < 500ms | PRD NFR2 | React DevTools Profiler |
| NFR3 | Cumulative Layout Shift | < 0.1 | PRD NFR3 | Lighthouse CI |
| NFR4 | Time to Interactive on 3G | < 2s | PRD NFR4 | Lighthouse with throttling |

**Implementation Strategies:**
- `useMemo` for derived state (filteredTransactions, summaries) to prevent recalculation
- `React.memo` on DrillDownCard, chart components
- CSS transforms for transitions (GPU-accelerated)
- Fixed dimensions for breadcrumbs and chart areas (prevents layout shift)
- Consider lazy loading StackedBarChart (only used in comparison mode)

### Security

| NFR ID | Requirement | Source | Notes |
|--------|-------------|--------|-------|
| NFR18 | User data isolation maintained | PRD NFR18 | No changes to Firestore security rules |
| NFR19 | Export respects subscription tier | PRD NFR19 | Uses existing useSubscriptionTier hook |

**No new security concerns for Epic 7:**
- Navigation state is client-side only (no server storage)
- No new API endpoints or data models
- Existing Firestore rules provide user isolation
- Export functionality already gated by subscription checks from Epic 5

### Reliability/Availability

| Scenario | Strategy | User Feedback |
|----------|----------|---------------|
| Invalid navigation state | `validateNavigationState()` auto-resets to Year view | Silent reset, no error shown |
| Empty period/category | Empty state component with helpful message | "No transactions in Q3 2024" + CTA |
| Chart render failure | ErrorBoundary catches error | "Unable to display chart" fallback |
| Date calculation error | Return safe default, log warning | No user-facing error |
| Network offline | Use cached transactions | Existing offline support unchanged |

**State Validation:**
```typescript
function validateNavigationState(state: AnalyticsNavigationState): AnalyticsNavigationState {
  // Catches impossible states like "week without month"
  // Auto-corrects rather than crashing
  // Logs warning for debugging
}
```

### Observability

| Signal | Implementation | Purpose |
|--------|----------------|---------|
| Navigation actions | `console.warn` on invalid state detection | Debug state management issues |
| Chart render errors | `console.error` in ErrorBoundary | Track chart failures |
| Performance marks | React DevTools Profiler integration | Identify render bottlenecks |

**Logging Strategy:**
- `console.warn`: Invalid state auto-corrected (e.g., "Invalid state: week without month, resetting")
- `console.error`: Unexpected errors caught (e.g., "Chart render failed")
- No logging: Normal navigation operations (keep console clean for users)

## Dependencies and Integrations

### External Dependencies (No Changes Required)

| Dependency | Version | Purpose | Epic 7 Usage |
|------------|---------|---------|--------------|
| React | ^18.3.1 | UI Framework | Context API, hooks, memoization |
| TypeScript | ^5.3.3 | Type Safety | New analytics types |
| Firebase | ^10.14.1 | Backend | Existing Firestore reads only |
| Lucide React | ^0.460.0 | Icons | Calendar, Tag, ChevronDown icons (24px) |
| Tailwind CSS | CDN | Styling | Existing patterns, CSS variables for themes |

### Internal Dependencies

| Module | Used By | Purpose |
|--------|---------|---------|
| `useTransactions` | AnalyticsContext | Source of transaction data |
| `useSubscriptionTier` | TrendsView | Gate premium export features |
| `csvExport.ts` | TrendsView | Existing export utilities |
| `translations.ts` | All components | English/Spanish labels |
| `colors.ts` | Charts, DrillDownCards | Consistent category colors |

### Integration Points

**Upstream (Data Sources):**
- `src/hooks/useTransactions.ts` → Provides transaction array to AnalyticsContext
- `src/config/firebase.ts` → Existing Firestore configuration

**Downstream (Consumers):**
- `src/views/TrendsView.tsx` → Orchestrates all analytics components
- `src/components/Nav.tsx` → May need icon size verification (FR2)

**Parallel (Shared Utilities):**
- `src/utils/date.ts` → Extended with quarter/week functions
- `src/utils/currency.ts` → Existing formatting (used by charts, cards)

### New Files to Create

| File | Type | Story |
|------|------|-------|
| `src/types/analytics.ts` | Types | 7.1 |
| `src/contexts/AnalyticsContext.tsx` | Context | 7.1 |
| `src/hooks/useAnalyticsNavigation.ts` | Hook | 7.1 |
| `src/components/analytics/TemporalBreadcrumb.tsx` | Component | 7.2 |
| `src/components/analytics/CategoryBreadcrumb.tsx` | Component | 7.3 |
| `src/components/analytics/ChartModeToggle.tsx` | Component | 7.4 |
| `src/config/chartRegistry.ts` | Config | 7.4 |
| `src/components/charts/AnalyticsChart.tsx` | Component | 7.4 |
| `src/components/analytics/DrillDownCard.tsx` | Component | 7.5 |
| `src/components/analytics/DrillDownGrid.tsx` | Component | 7.5 |

### Files to Modify

| File | Modification | Story |
|------|--------------|-------|
| `src/utils/date.ts` | Add quarter/week utilities | 7.6 |
| `src/views/TrendsView.tsx` | Major refactor to use context | 7.7 |
| `src/App.tsx` | Wrap with AnalyticsContext.Provider | 7.7 |
| `src/utils/translations.ts` | Add new i18n keys | 7.8 |
| `src/components/Nav.tsx` | Verify icon sizes (if needed) | 7.8 |

## Acceptance Criteria (Authoritative)

### Bug Fixes (FR1-FR4)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC1 | Month selector displays correct month | Selecting "October" in month picker displays October data, not November |
| AC2 | Icons are consistently sized | All Lucide icons across analytics views render at 24px with stroke-width 2 |
| AC3 | Bottom nav is fixed | Bottom navigation bar maintains position during scroll, no layout shifts during navigation |
| AC4 | Spanish mode is complete | When language is Spanish, all analytics labels display in Spanish with no English fallbacks |

### Temporal Navigation (FR5-FR15)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC5 | Year view works | Analytics displays annual totals with Q1-Q4 drill-down options |
| AC6 | Quarter view works | Quarter view shows 3-month aggregation (e.g., Q4 = Oct+Nov+Dec totals) |
| AC7 | Month view works | Month view shows monthly totals with week drill-down options |
| AC8 | Week view works | Week view shows weekly totals using date range labels (e.g., "Oct 1-7") |
| AC9 | Day view works | Day view shows daily totals for selected date |
| AC10 | Drill-down navigation | Tapping a period card navigates to that child level |
| AC11 | Breadcrumb jump-back | Tapping any breadcrumb ancestor navigates directly to that level |
| AC12 | Breadcrumb displays position | Temporal breadcrumb shows current hierarchy (e.g., "2024 › Q4 › October") |
| AC13 | Breadcrumb segments tappable | Each segment in temporal breadcrumb dropdown is tappable |
| AC14 | Breadcrumb updates immediately | Navigation changes reflect in breadcrumb within same render cycle |
| AC15 | Current level highlighted | Active temporal level has distinct visual styling (bold/accent color) |

### Category Navigation (FR16-FR24)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC16 | Category filter works | Selecting a category filters chart and totals to that category |
| AC17 | Group filter works | Selecting a group (e.g., Groceries) filters to items with that group |
| AC18 | Subcategory filter works | Selecting a subcategory (e.g., Meats) filters to items with that subcategory |
| AC19 | Category drill-down | Tapping a category card drills into its children |
| AC20 | Category breadcrumb jump-back | Tapping any category breadcrumb ancestor returns to that filter level |
| AC21 | Category breadcrumb displays filter | Category breadcrumb shows current filter (e.g., "Food › Groceries") |
| AC22 | Category segments tappable | Each segment in category breadcrumb dropdown is tappable |
| AC23 | All Categories option | "All Categories" option clears category filter completely |
| AC24 | Category breadcrumb updates | Category changes reflect in breadcrumb within same render cycle |

### Dual-Axis Independence (FR25-FR28)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC25 | Axes work independently | Temporal and category filters can be applied separately or together |
| AC26 | Temporal preserves category | Changing from Month to Quarter preserves current category filter |
| AC27 | Category preserves temporal | Changing from Groceries to Restaurants preserves current temporal level |
| AC28 | Combined filtering works | "Q4 + Groceries" shows only Q4 groceries data |

### Chart Display (FR29-FR39)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC29 | Chart displays | Analytics view shows a chart (pie or bar) for current filters |
| AC30 | Total displays | Total amount for current view shown above/near chart |
| AC31 | Mode toggle works | Tapping Comparison mode switches chart type |
| AC32 | Aggregation shows pie/bar | Aggregation mode displays pie chart (default) or vertical bar |
| AC33 | Comparison shows grouped bar | Comparison mode displays grouped bar chart |
| AC34 | Year comparison shows quarters | Year view in Comparison mode shows Q1 vs Q2 vs Q3 vs Q4 bars |
| AC35 | Quarter comparison shows months | Quarter view in Comparison mode shows 3 month bars |
| AC36 | Month comparison shows weeks | Month view in Comparison mode shows 4-5 week bars |
| AC37 | Week comparison shows days | Week view in Comparison mode shows Mon-Sun bars |
| AC38 | Day is aggregation only | Day view hides mode toggle (no children to compare) |
| AC39 | Mode persists in session | Selecting Comparison mode persists until changed or session ends |

### Drill-Down Cards (FR40-FR46)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC40 | Period cards display | Below chart, drill-down cards show available child periods |
| AC41 | Category cards display | When filtered, subcategory cards also appear |
| AC42 | Cards show label and amount | Each card displays period/category label with total amount |
| AC43 | Cards are tappable | Tapping a card navigates to that level |
| AC44 | Empty periods have message | Period with no data shows "No transactions in [period]" |
| AC45 | Empty state has CTA | Empty state shows "Scan a receipt to add data" suggestion |
| AC46 | Empty periods remain tappable | Empty periods are grayed but still navigable via breadcrumb |

### Download (FR47-FR51) - Existing Functionality Verification

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC47 | Download visible | Download button visible on all temporal views |
| AC48 | Year/Quarter exports stats | At Year or Quarter level, download exports yearly statistics CSV |
| AC49 | Month/Week/Day exports transactions | At granular levels, download exports current month transactions |
| AC50 | Icon indicates type | Download icon is BarChart2 for stats, FileText for transactions |
| AC51 | Download ignores category | Export contains all categories regardless of current filter |

### Visual Consistency (FR52-FR58)

| AC# | Criterion | Testable Statement |
|-----|-----------|-------------------|
| AC52 | Layout is consistent | All temporal views use identical structure (breadcrumbs, chart, drill-downs) |
| AC53 | Icons are 24px | All icons use size={24} strokeWidth={2} |
| AC54 | Spacing follows grid | All spacing uses 8px multiples (8, 16, 24, 32px) |
| AC55 | Touch targets are 44px | All interactive elements have minimum 44x44px hit area |
| AC56 | Labels have translations | All new labels have English and Spanish versions |
| AC57 | Dates are locale-aware | Date formatting uses user's language setting |
| AC58 | Currency is locale-aware | Currency formatting uses user's currency/locale setting |

## Traceability Mapping

| AC# | FR# | Spec Section | Component(s) | Test Type |
|-----|-----|--------------|--------------|-----------|
| AC1 | FR1 | Bug Fixes | TrendsView date picker | Unit, E2E |
| AC2 | FR2 | Visual Consistency | All components with icons | Visual inspection |
| AC3 | FR3 | Visual Consistency | Nav.tsx | E2E scroll test |
| AC4 | FR4 | i18n | translations.ts | Unit, E2E |
| AC5-AC9 | FR5-FR9 | Temporal Navigation | AnalyticsContext, TrendsView | Integration, E2E |
| AC10-AC11 | FR10-FR11 | Temporal Navigation | DrillDownGrid, TemporalBreadcrumb | E2E |
| AC12-AC15 | FR12-FR15 | Temporal Breadcrumb | TemporalBreadcrumb | Unit, E2E |
| AC16-AC19 | FR16-FR19 | Category Navigation | AnalyticsContext, DrillDownGrid | Integration, E2E |
| AC20-AC24 | FR20-FR24 | Category Breadcrumb | CategoryBreadcrumb | Unit, E2E |
| AC25-AC28 | FR25-FR28 | Dual-Axis | AnalyticsContext reducer | Unit, Integration |
| AC29-AC39 | FR29-FR39 | Chart Display | ChartModeToggle, AnalyticsChart, chartRegistry | Unit, E2E |
| AC40-AC46 | FR40-FR46 | Drill-Down Cards | DrillDownCard, DrillDownGrid | Unit, E2E |
| AC47-AC51 | FR47-FR51 | Download | TrendsView (existing) | E2E (verification) |
| AC52-AC55 | FR52-FR55 | Visual Consistency | All new components | Visual inspection, Unit |
| AC56-AC58 | FR56-FR58 | i18n | translations.ts, date.ts | Unit |

### Story-to-AC Mapping

| Story | ACs Covered |
|-------|-------------|
| 7.1 | AC25-AC28 (dual-axis state management) |
| 7.2 | AC11-AC15 (temporal breadcrumb) |
| 7.3 | AC20-AC24 (category breadcrumb) |
| 7.4 | AC29-AC39 (chart display, mode toggle) |
| 7.5 | AC40-AC46 (drill-down cards, empty states) |
| 7.6 | AC5-AC10 (quarter/week utilities) |
| 7.7 | AC5-AC9, AC16-AC19, AC52 (TrendsView integration) |
| 7.8 | AC1-AC4, AC53-AC58 (bug fixes, polish, i18n) |
| 7.9 | All (deployment verification) |

## Risks, Assumptions, Open Questions

### Risks

| ID | Risk | Probability | Impact | Mitigation |
|----|------|-------------|--------|------------|
| R1 | **State Management Chaos** - Different stories implement navigation state inconsistently, causing breadcrumbs to show one thing while charts show another | Medium | High | Story 7.1 establishes single source of truth BEFORE any UI components; strict code review for context usage patterns |
| R2 | **TrendsView Refactor Regression** - Major refactor breaks existing analytics functionality | Medium | High | Incremental extraction (one component per story per ADR-014); existing 450+ tests provide safety net; E2E tests run before merge |
| R3 | **Performance Regression** - Context re-renders cause sluggish UI | Medium | Medium | useMemo for derived state; React.memo on components; Lighthouse CI baseline from Epic 3 catches regressions |
| R4 | **Week Boundary Edge Cases** - Month-aligned week chunks have bugs at month boundaries | Low | Medium | Comprehensive unit tests for edge cases (leap year February, short months, year transitions) |
| R5 | **Mobile Touch Target Issues** - Breadcrumb dropdowns too small on mobile | Low | Medium | 44px minimum enforced via Tailwind `min-h-11`; manual testing on real devices |
| R6 | **Accessibility Gaps** - New components don't meet WCAG 2.1 AA | Low | Medium | ARIA attributes specified in component patterns; axe-core tests in CI (existing from Epic 3) |

### Assumptions

| ID | Assumption | Validation |
|----|------------|------------|
| A1 | Transaction data structure is stable - `category`, `group`, `subcategory` fields exist on items | Verified in existing codebase |
| A2 | Existing charts (SimplePieChart, GroupedBarChart) can be wrapped without modification | Code review during Story 7.4 |
| A3 | 450+ existing tests provide adequate regression coverage | CI runs full suite on every PR |
| A4 | Users understand breadcrumb navigation pattern from other apps | Aligned with WhatsApp/Facebook patterns per UX spec |
| A5 | Month-aligned weeks are more intuitive than ISO weeks for target users | Per ADR-012 decision |
| A6 | Ghibli theme is post-MVP - Slate Professional theme is sufficient | Confirmed in PRD scope |

### Open Questions

| ID | Question | Owner | Resolution |
|----|----------|-------|------------|
| Q1 | Should empty quarter/week periods be visible in breadcrumb dropdown? | UX | Resolved: Yes, grayed but tappable per FR46 |
| Q2 | What happens when user has no transactions at all? | Dev | Show year view with empty state + scan CTA |
| Q3 | Should comparison mode persist across navigation or reset on drill-down? | UX | Persists per session (FR39) |
| Q4 | How to handle categories that don't exist at subcategory level? | Dev | Skip subcategory level in breadcrumb; drill directly to transaction list |

## Test Strategy Summary

### Test Levels

| Level | Framework | Coverage Target | Focus Areas |
|-------|-----------|-----------------|-------------|
| **Unit** | Vitest | ≥80% on new code | Reducer logic, validation functions, date utilities, component rendering |
| **Integration** | Vitest + Testing Library | Critical paths | Context + components working together, data flow |
| **E2E** | Playwright | Happy paths + edge cases | Full navigation journeys, drill-down flows, breadcrumb interactions |
| **Visual** | Manual + Lighthouse | All new components | Layout consistency, touch targets, icon sizes |
| **Accessibility** | axe-core (existing) | WCAG 2.1 AA | ARIA labels, focus management, contrast |

### Test Categories by Story

| Story | Unit Tests | Integration Tests | E2E Tests |
|-------|------------|-------------------|-----------|
| 7.1 | Reducer actions, validateNavigationState(), memoized selectors | Context provider with mock data | - |
| 7.2 | TemporalBreadcrumb render states, dropdown behavior | Breadcrumb + Context interaction | Temporal navigation journey |
| 7.3 | CategoryBreadcrumb render states, "All Categories" reset | Breadcrumb + Context interaction | Category filter journey |
| 7.4 | chartRegistry, ChartModeToggle states | Toggle + Chart switching | Mode toggle + chart render |
| 7.5 | DrillDownCard props, DrillDownGrid rendering | Grid + Context navigation | Drill-down card journey |
| 7.6 | getQuartersInYear(), getWeeksInMonth(), edge cases | - | - |
| 7.7 | - | TrendsView with full component tree | Full analytics flow |
| 7.8 | Translation keys, date/currency formatting | - | Spanish mode, icon audit |
| 7.9 | - | - | Full regression suite |

### Key Test Scenarios

**E2E Happy Path: Dual-Axis Navigation**
```
1. Navigate to Analytics → Year view loads
2. Tap Q4 card → Quarter view, breadcrumb shows [2024] › [Q4]
3. Tap October card → Month view, breadcrumb shows [2024] › [Q4] › [October]
4. Tap Food pie slice → Category filter applied, category breadcrumb shows [Food]
5. Tap "2024" in temporal breadcrumb → Jump to Year view, [Food] filter preserved
6. Verify chart shows Year + Food data
```

**E2E Edge Case: Empty States**
```
1. Navigate to Q3 (no transactions)
2. Verify empty state message: "No transactions in Q3 2024"
3. Verify CTA: "Scan a receipt to add data"
4. Verify Q3 is grayed in breadcrumb but remains tappable
```

**Unit Test: Week Calculation Edge Cases**
```typescript
describe('getWeeksInMonth', () => {
  it('handles October 2024 (31 days)', () => {
    expect(getWeeksInMonth('2024-10')).toEqual([
      { label: 'Oct 1-7', start: '2024-10-01', end: '2024-10-07' },
      { label: 'Oct 8-14', start: '2024-10-08', end: '2024-10-14' },
      { label: 'Oct 15-21', start: '2024-10-15', end: '2024-10-21' },
      { label: 'Oct 22-28', start: '2024-10-22', end: '2024-10-28' },
      { label: 'Oct 29-31', start: '2024-10-29', end: '2024-10-31' },
    ]);
  });

  it('handles February 2024 (leap year)', () => {
    const weeks = getWeeksInMonth('2024-02');
    expect(weeks[weeks.length - 1].end).toBe('2024-02-29');
  });
});
```

### Coverage Enforcement

- New code must have ≥80% line coverage (NFR15)
- CI blocks merge if coverage drops below baseline
- Existing `npm run test:coverage` command validates

### Performance Testing

- Lighthouse CI runs on every PR (existing from Epic 3)
- Targets: TTI < 2s on 3G, CLS < 0.1
- Alert if metrics regress by >10%

---

_Tech Spec generated by BMAD BMM epic-tech-context workflow_
_Date: 2025-12-05_
_Author: Gabe_
