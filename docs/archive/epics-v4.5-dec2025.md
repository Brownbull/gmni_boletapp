# boletapp - Epic Breakdown

**Date:** 2025-12-02
**Project Level:** Quick-Flow Brownfield
**Last Updated:** Epic 7 added (2025-12-05)

---

## Epic 4.5: Receipt Image Storage

**Slug:** receipt-image-storage

### Goal

Enable users to store receipt images linked to transactions, providing verification capability, audit trails for tax purposes, and foundation for future export features. Implements the "Scan = Image Storage" unified operation established in Epic 4 retrospective.

### Scope

**In Scope:**
- Firebase Storage initialization and security rules
- Cloud Function enhancement for image processing (normalize, compress, thumbnail)
- Transaction model extension with imageUrls[] and thumbnailUrl
- Client UI updates (thumbnail display, image viewer modal)
- Cascade delete (images removed when transaction deleted)
- Testing infrastructure for Storage emulator

**Out of Scope:**
- Retention policy enforcement (Epic 7)
- Quota tracking per subscription tier (Epic 7)
- Image export to PDF/reports (Epic 5)
- Offline image caching (Future)
- Image editing features (Future)

### Success Criteria

1. Receipt images are stored in Firebase Storage at `users/{userId}/receipts/{transactionId}/`
2. Images are normalized to max 1200x1600px, JPEG 80% quality
3. Thumbnails (120x160px) are generated for list views
4. Transaction documents include `imageUrls[]` and `thumbnailUrl` fields
5. Deleting a transaction cascades to delete associated images
6. Existing transactions without images continue to work (backward compatible)
7. All tests pass (unit, integration, E2E)

### Dependencies

- Epic 4 complete (Cloud Function `analyzeReceipt` exists)
- Firebase Blaze plan (required for Cloud Functions + Storage)
- firebase-admin SDK with Storage permissions

---

## Story Map - Epic 4.5

```
Epic 4.5: Receipt Image Storage (13 points)
│
├── Story 4.5-1: Firebase Storage Infrastructure (3 points)
│   └── Dependencies: None
│   └── Deliverable: Storage rules, emulator config, client init
│
├── Story 4.5-2: Cloud Function Image Processing (5 points)
│   └── Dependencies: Story 4.5-1
│   └── Deliverable: Images stored on scan, URLs returned
│
├── Story 4.5-3: Client Updates & UI (3 points)
│   └── Dependencies: Story 4.5-2
│   └── Deliverable: Thumbnails in history, image viewer modal
│
└── Story 4.5-4: Cascade Delete & Documentation (2 points)
    └── Dependencies: Story 4.5-2
    └── Deliverable: Auto-delete images, updated docs
```

---

## Stories - Epic 4.5

### Story 4.5-1: Firebase Storage Infrastructure

As a **developer**,
I want **Firebase Storage initialized with security rules and emulator support**,
So that **receipt images can be securely stored with user isolation**.

**Acceptance Criteria:**
- AC #1: Storage security rules deployed with user-scoped access pattern
- AC #2: Storage emulator running on port 9199
- AC #3: Firebase Storage exported from src/config/firebase.ts
- AC #4: npm scripts updated to include storage emulator
- AC #5: Infrastructure test validates rules enforcement

**Prerequisites:** None
**Technical Notes:** First story - establishes foundation for all image storage
**Estimated Effort:** 3 points

---

### Story 4.5-2: Cloud Function Image Processing

As a **user scanning receipts**,
I want **my receipt images automatically stored after analysis**,
So that **I can view the original receipt later for verification**.

**Acceptance Criteria:**
- AC #1: sharp library processes images (resize to 1200x1600 max, JPEG 80%)
- AC #2: Thumbnail generated (120x160px, JPEG 70%)
- AC #3: Images stored at `users/{userId}/receipts/{transactionId}/`
- AC #4: analyzeReceipt returns imageUrls[] and thumbnailUrl with transaction
- AC #5: Unit tests cover image processing functions
- AC #6: Integration tests verify full scan flow with Storage emulator

**Prerequisites:** Story 4.5-1 (Storage infrastructure)
**Technical Notes:** Core implementation - modifies analyzeReceipt Cloud Function
**Estimated Effort:** 5 points

---

### Story 4.5-3: Client Updates & UI

As a **user viewing transaction history**,
I want **to see receipt thumbnails and view full-size images**,
So that **I can quickly identify transactions and verify details**.

**Acceptance Criteria:**
- AC #1: Transaction interface extended with imageUrls and thumbnailUrl fields
- AC #2: HistoryView displays thumbnails for transactions with images
- AC #3: Clicking thumbnail opens ImageViewer modal with full-size image
- AC #4: Transactions without images display without errors (backward compatible)
- AC #5: ImageViewer supports multi-image navigation for receipts with multiple pages
- AC #6: E2E test covers scan-to-view flow

**Prerequisites:** Story 4.5-2 (Images available from Cloud Function)
**Technical Notes:** UI changes to HistoryView, new ImageViewer component
**Estimated Effort:** 3 points

---

### Story 4.5-4: Cascade Delete & Documentation

As a **user deleting a transaction**,
I want **associated images automatically deleted**,
So that **I don't accumulate orphaned images in storage**.

**Acceptance Criteria:**
- AC #1: Firestore trigger function deletes Storage folder on transaction delete
- AC #2: Integration test verifies cascade delete behavior
- AC #3: ADR-009 documents image storage architecture decisions
- AC #4: docs/index.md updated with Epic 4.5 section
- AC #5: Architecture docs updated with Storage security rules

**Prerequisites:** Story 4.5-2 (Images exist to delete)
**Technical Notes:** Cloud Function trigger, documentation updates
**Estimated Effort:** 2 points

---

## Implementation Timeline - Epic 4.5

**Total Story Points:** 13 points

**Implementation Sequence:**
1. Story 4.5-1 → Foundation (no dependencies)
2. Story 4.5-2 → Core (depends on 4.5-1)
3. Story 4.5-3 → UI (depends on 4.5-2)
4. Story 4.5-4 → Cleanup (depends on 4.5-2, can run parallel with 4.5-3)

**Notes:**
- Stories 4.5-3 and 4.5-4 can be developed in parallel after 4.5-2 completes
- All stories reference tech-spec.md for detailed implementation guidance

---

## Epic 5: Data Download & Export

**Slug:** data-download-export

### Goal

Enable users to download their expense data with two distinct capabilities: (1) Basic data export from Settings for all users (compliance/data portability), and (2) Premium context-aware analytics export for Pro/Max subscribers that adapts based on analytics view granularity.

### Scope

**In Scope:**
- CSV generation utilities with proper formatting (UTF-8, Excel-compatible)
- Basic data export from Settings (all users) - date, total, merchant only
- Subscription tier check infrastructure (mock for now, real after Epic 7)
- Premium transaction export (month/week/day views → current month data)
- Premium statistics export (quarter/year views → yearly aggregates)
- Context-aware download icon in analytics view
- Upgrade prompt for non-subscribers

**Out of Scope:**
- Multiple export formats (XLSX, PDF) - Growth feature
- Custom date range selection - Growth feature
- Email delivery of exports - Growth feature
- Cloud storage integration (Google Drive, Dropbox) - Vision
- Receipt image export bundle - Vision
- Quarterly aggregated statistics (only yearly for MVP)

### Success Criteria

1. Any authenticated user can download basic data (date, total, merchant) from Settings
2. Pro/Max subscribers can download rich transaction data from analytics view
3. Download icon visually indicates export type based on current view
4. Non-subscribers see clear upgrade prompt when attempting premium export
5. All exports complete in <3 seconds with non-blocking UI
6. CSV files are properly formatted and Excel-compatible
7. All tests pass (unit, integration, E2E)

### Dependencies

- Epic 4 complete (transaction data exists)
- Epic 7 (Subscription System) - **mocked for now**, will integrate when available
- Existing analytics view components
- Existing Settings page

### FR Coverage

| Story | Functional Requirements Covered |
|-------|--------------------------------|
| 5.1 | FR24-FR28 (CSV utilities) |
| 5.2 | FR1-FR5 (Basic export) |
| 5.3 | FR20-FR23 (Subscription gating) |
| 5.4 | FR6-FR7, FR10, FR12-FR15 (Transaction export) |
| 5.5 | FR8-FR9, FR11, FR16-FR19 (Statistics export + upgrade) |

---

## Story Map - Epic 5

```
Epic 5: Data Download & Export
│
├── Story 5.1: CSV Export Utilities (Foundation)
│   └── Dependencies: None
│   └── Deliverable: Reusable CSV generation with proper formatting
│
├── Story 5.2: Basic Data Export (Settings)
│   └── Dependencies: Story 5.1
│   └── Deliverable: "Download All Your Data" in Settings (all users)
│
├── Story 5.3: Subscription Tier Check Infrastructure
│   └── Dependencies: None (can parallel with 5.1-5.2)
│   └── Deliverable: canAccessPremiumExport() utility (mocked)
│
├── Story 5.4: Premium Transaction Export (Month/Week/Day)
│   └── Dependencies: Story 5.1, Story 5.3
│   └── Deliverable: Download icon + full transaction export
│
└── Story 5.5: Premium Statistics Export & Upgrade Flow
    └── Dependencies: Story 5.1, Story 5.3, Story 5.4
    └── Deliverable: Yearly stats export + upgrade prompt for non-subscribers
```

---

## Stories - Epic 5

### Story 5.1: CSV Export Utilities

As a **developer**,
I want **reusable CSV generation utilities with proper formatting**,
So that **all export features have consistent, Excel-compatible output**.

**Acceptance Criteria:**

**Given** transaction data or statistics data
**When** the CSV utility processes the data
**Then** output is comma-separated with proper quoting for strings containing commas

**And** header row is included with column names
**And** dates are formatted as YYYY-MM-DD (Excel-compatible)
**And** currency values are numbers without symbols (e.g., 1234.56 not $1,234.56)
**And** file is UTF-8 encoded for international character support
**And** filename follows pattern: `boletapp-{type}-{date}.csv`

**Prerequisites:** None
**Technical Notes:**
- Create `src/utils/csvExport.ts` with generic CSV generation
- Use native browser APIs (no heavy libraries needed for CSV)
- Export functions: `generateCSV(data, columns)`, `downloadCSV(content, filename)`
- Handle edge cases: null values, special characters, very long strings

**Covers:** FR24, FR25, FR26, FR27, FR28

---

### Story 5.2: Basic Data Export (Settings)

As a **user (any tier)**,
I want **to download all my transaction data from Settings**,
So that **I have a portable copy of my data for compliance or personal records**.

**Acceptance Criteria:**

**Given** I am an authenticated user on the Settings page
**When** I click "Download All Your Data" button
**Then** a CSV file downloads containing ALL my transactions

**And** each row contains only: date, total amount, merchant name
**And** filename is `boletapp-data-export-YYYY-MM-DD.csv`
**And** download completes in under 2 seconds for up to 10,000 transactions
**And** UI shows loading indicator during generation
**And** success toast confirms download completed

**Given** I have no transactions
**When** I click "Download All Your Data"
**Then** I see a message "No transactions to export" (no empty file download)

**Prerequisites:** Story 5.1 (CSV utilities)
**Technical Notes:**
- Add button to Settings page (existing `src/views/SettingsView.tsx`)
- Query all user transactions from Firestore (no date filter)
- Map to minimal fields: `{ date, total, merchant }`
- Client-side generation only - no Cloud Function needed
- Accessible: button has proper ARIA label, loading state announced

**Covers:** FR1, FR2, FR3, FR4, FR5

---

### Story 5.3: Subscription Tier Check Infrastructure

As a **developer**,
I want **a subscription check utility that can be easily updated when Epic 7 lands**,
So that **premium features can be properly gated without major refactoring later**.

**Acceptance Criteria:**

**Given** the application needs to check subscription tier
**When** `canAccessPremiumExport()` is called
**Then** it returns `true` for all users during testing phase

**And** the utility is a single point of change (one file to update for Epic 7)
**And** the utility returns subscription tier: 'free' | 'basic' | 'pro' | 'max'
**And** a React hook `useSubscriptionTier()` is available for components
**And** the implementation includes TODO comments marking Epic 7 integration point

**Given** Epic 7 is implemented in the future
**When** a developer updates the subscription utility
**Then** all premium gating automatically works without changing consuming code

**Prerequisites:** None (can be developed in parallel with 5.1, 5.2)
**Technical Notes:**
- Create `src/hooks/useSubscriptionTier.ts`
- Create `src/utils/subscription.ts` with `canAccessPremiumExport()`
- For now: always return `{ tier: 'max', canAccessPremiumExport: true }`
- Add clear TODO: `// Epic 7: Replace with actual Firestore subscription check`
- Type definitions: `SubscriptionTier = 'free' | 'basic' | 'pro' | 'max'`

**Covers:** FR20, FR21, FR22

---

### Story 5.4: Premium Transaction Export (Analytics - Month/Week/Day Views)

As a **Pro/Max subscriber viewing analytics**,
I want **to download my current month's transactions with full details**,
So that **I can use my categorized expense data in external tools**.

**Acceptance Criteria:**

**Given** I am a Pro/Max subscriber on the analytics view
**And** I am viewing month, week, or day granularity
**When** I click the download icon
**Then** a CSV downloads with current month's transactions

**And** each row contains: date, category, price, item name, subcategory, group, receipt ID
**And** all scanned metadata fields are included
**And** download icon shows "transaction" style (e.g., list/table icon)
**And** filename is `boletapp-transactions-YYYY-MM.csv`
**And** download completes in under 3 seconds
**And** loading indicator shows during generation

**Given** I am viewing week or day granularity
**When** I click download
**Then** I still get the FULL current month (not just that week/day)

**Prerequisites:** Story 5.1 (CSV utilities), Story 5.3 (subscription check)
**Technical Notes:**
- Add download icon to analytics view header (`src/views/AnalyticsView.tsx`)
- Icon style indicates export type (transaction icon for granular views)
- Query transactions for current month only
- Include all Transaction fields in export
- Consider column ordering for usability (date first, then category, etc.)

**Covers:** FR6, FR7, FR10, FR12, FR13, FR14, FR15

---

### Story 5.5: Premium Statistics Export & Upgrade Prompt

As a **Pro/Max subscriber viewing yearly analytics**,
I want **to download yearly aggregated statistics**,
So that **I can see my spending patterns in external tools**.

As a **free/basic user**,
I want **to see a clear upgrade path when I try to download**,
So that **I understand this is a premium feature**.

**Acceptance Criteria:**

**Given** I am a Pro/Max subscriber on analytics view
**And** I am viewing quarter or year granularity
**When** I click the download icon
**Then** a CSV downloads with yearly aggregated statistics

**And** statistics include: category totals, monthly spending trends, period summaries
**And** download icon shows "statistics" style (e.g., chart/graph icon)
**And** filename is `boletapp-statistics-YYYY.csv`
**And** download completes in under 2 seconds

**Given** I am a free/basic user on analytics view
**When** I click the download icon
**Then** I see an upgrade prompt modal/dialog

**And** the prompt clearly explains this is a Pro/Max feature
**And** the prompt has a clear CTA to upgrade (link to upgrade page or placeholder)
**And** the prompt can be dismissed without action

**Given** I am viewing quarter granularity
**When** I click download (as subscriber)
**Then** I get YEARLY statistics (not quarterly - out of scope for MVP)

**Prerequisites:** Story 5.1, Story 5.3, Story 5.4 (download icon already in place)
**Technical Notes:**
- Extend analytics download icon to detect view type
- Quarter/Year views → statistics export, different icon style
- Create `UpgradePromptModal` component for non-subscribers
- Statistics aggregation: group by category, calculate totals per month
- Statistics CSV columns: month, category, total, percentage of monthly spend

**Covers:** FR8, FR9, FR11, FR16, FR17, FR18, FR19, FR23

---

## Implementation Sequence - Epic 5

**Recommended Order:**

1. **Story 5.1** (CSV Utilities) - Foundation, no dependencies
2. **Story 5.3** (Subscription Check) - Can parallel with 5.1
3. **Story 5.2** (Basic Export) - Depends on 5.1, delivers user value quickly
4. **Story 5.4** (Transaction Export) - Depends on 5.1 + 5.3
5. **Story 5.5** (Statistics + Upgrade) - Depends on 5.1 + 5.3 + 5.4

**Parallelization Options:**
- 5.1 and 5.3 can be developed simultaneously
- 5.2 can start as soon as 5.1 is done
- 5.4 and 5.5 are sequential (5.5 extends 5.4's download icon)

---

## FR Coverage Matrix - Epic 5

| FR | Description | Story |
|----|-------------|-------|
| FR1 | All users access "Download All Your Data" from Settings | 5.2 |
| FR2 | Basic export includes all transactions | 5.2 |
| FR3 | Basic export: date, total, merchant only | 5.2 |
| FR4 | Basic export as CSV with appropriate filename | 5.2 |
| FR5 | Basic export client-side, no server | 5.2 |
| FR6 | Download icon in analytics header | 5.4 |
| FR7 | Icon indicates export type | 5.4, 5.5 |
| FR8 | Non-subscribers see upgrade prompt | 5.5 |
| FR9 | Subscribers download directly | 5.4, 5.5 |
| FR10 | Month/Week/Day → current month transactions | 5.4 |
| FR11 | Quarter/Year → yearly statistics | 5.5 |
| FR12 | Transaction export full details | 5.4 |
| FR13 | Transaction export includes metadata | 5.4 |
| FR14 | Transaction export scoped to current month | 5.4 |
| FR15 | Transaction export CSV with filename | 5.4 |
| FR16 | Statistics export yearly data | 5.5 |
| FR17 | Statistics: category totals, trends, summaries | 5.5 |
| FR18 | Statistics from quarter and year views | 5.5 |
| FR19 | Statistics export CSV with filename | 5.5 |
| FR20 | System checks subscription tier | 5.3 |
| FR21 | Mock returns true during testing | 5.3 |
| FR22 | Utility designed for Epic 7 replacement | 5.3 |
| FR23 | Free/Basic see upgrade path | 5.5 |
| FR24 | CSV standard formatting | 5.1 |
| FR25 | CSV header row | 5.1 |
| FR26 | Date formatting Excel-compatible | 5.1 |
| FR27 | Currency as numbers | 5.1 |
| FR28 | UTF-8 encoding | 5.1 |

**Coverage Verification:** ✅ All 28 FRs mapped to stories

---

## Epic 7: Analytics UX Redesign

**Slug:** analytics-ux-redesign

### Goal

Transform the analytics experience from functional-but-inconsistent to professional and intuitive, implementing dual-axis breadcrumb navigation (temporal + category), adding Quarter and Week views, and establishing chart dual mode. Help Chilean families answer "Where did my money go?" through natural data exploration.

**Key Innovation:** Dual-axis navigation pattern allows users to independently filter by time (Year → Quarter → Month → Week → Day) and category (Category → Group → Subcategory) - a novel UX pattern requiring careful state management.

### Scope

**In Scope (MVP):**
- Bug fixes: Month off-by-one, icon sizes, layout shifts, Spanish translations
- Dual breadcrumb navigation (temporal 5 levels + category 3 levels)
- Quarter view (new temporal level between Year and Month)
- Week view (new temporal level between Month and Day, date range labels)
- Chart dual mode (Aggregation vs Comparison toggle)
- Drill-down cards for child periods/categories
- Empty states with helpful messaging
- Download behavior standardization
- Visual consistency (24px icons, 8px grid, 44px touch targets)
- i18n for new labels (English/Spanish)

**Out of Scope:**
- New graph types (line, stacked area, horizontal bar) - Growth
- Graph type Settings toggles - Growth
- Dark mode contrast improvements - Growth
- Ghibli theme - Post-MVP (defer to reduce scope)
- AI-powered insights - Vision
- Budget tracking - Vision
- URL state sync for shareable links - Future

### Success Criteria

1. Users can navigate Year → Quarter → Month → Week → Day without confusion
2. Users can filter by Category → Group → Subcategory independently of temporal
3. Changing temporal level preserves category filter (and vice versa)
4. Chart toggles between Aggregation (pie/bar) and Comparison (grouped bar) modes
5. Bug fixes: Month shows correct month, icons 24px, no layout shifts, Spanish labels
6. All interactive elements have 44px touch targets
7. All tests pass (unit, integration, E2E) with ≥80% coverage on new code

### Dependencies

- Epics 1-6 complete (existing TrendsView, charts, navigation)
- Existing React/TypeScript/Firebase stack
- Existing Tailwind CSS styling

### Architecture Decisions (from architecture-epic7.md)

| Decision | Choice | ADR |
|----------|--------|-----|
| State Management | React Context with useReducer | ADR-010 |
| Component Structure | Incremental extraction to `components/analytics/` | ADR-014 |
| Breadcrumb UX | Collapsible dropdowns | - |
| Week Calculation | Month-aligned chunks (Oct 1-7, 8-14, etc.) | ADR-012 |
| Chart Strategy | Registry Pattern for extensibility | ADR-011 |
| Theme System | CSS Variables with data attributes | ADR-013 |

### FR Inventory - Epic 7

| FR | Description |
|----|-------------|
| FR1 | Month selector displays the correct month (fix off-by-one bug) |
| FR2 | All icons render at consistent 24px size across all views |
| FR3 | Bottom navigation bar maintains fixed position without layout shifts |
| FR4 | Spanish language mode displays all labels in Spanish |
| FR5 | Users can view analytics at Year level showing annual totals |
| FR6 | Users can view analytics at Quarter level (Q1, Q2, Q3, Q4) |
| FR7 | Users can view analytics at Month level showing monthly totals |
| FR8 | Users can view analytics at Week level with date range labels |
| FR9 | Users can view analytics at Day level showing daily totals |
| FR10 | Users can drill down from any temporal level to the next |
| FR11 | Users can navigate back to any previous temporal level via breadcrumb |
| FR12 | Temporal breadcrumb displays current position in hierarchy |
| FR13 | Each segment in temporal breadcrumb is tappable |
| FR14 | Temporal breadcrumb updates immediately when user navigates |
| FR15 | Current temporal level is visually distinguished (highlighted/bold) |
| FR16 | Users can filter analytics by Category (transaction-level) |
| FR17 | Users can filter analytics by Group (item-level) |
| FR18 | Users can filter analytics by Subcategory (item-level) |
| FR19 | Users can drill down Category→Group→Subcategory→Transaction list |
| FR20 | Users can navigate back to any previous category level via breadcrumb |
| FR21 | Category breadcrumb displays current filter |
| FR22 | Each segment in category breadcrumb is tappable |
| FR23 | Category breadcrumb shows "All Categories" when no filter active |
| FR24 | Category breadcrumb updates immediately on filter change |
| FR25 | Temporal and category filters work independently |
| FR26 | Changing temporal level preserves current category filter |
| FR27 | Changing category filter preserves current temporal level |
| FR28 | Users can view any combination of temporal + category |
| FR29 | Analytics view displays a chart showing spending breakdown |
| FR30 | Chart displays total amount for current view |
| FR31 | Users can toggle between Aggregation and Comparison modes |
| FR32 | Aggregation mode shows Pie chart (default) or Vertical Bar |
| FR33 | Comparison mode shows Grouped Bar chart |
| FR34 | Year view Comparison shows Q1 vs Q2 vs Q3 vs Q4 |
| FR35 | Quarter view Comparison shows Month1 vs Month2 vs Month3 |
| FR36 | Month view Comparison shows Week1 vs Week2 vs Week3 vs Week4(+) |
| FR37 | Week view Comparison shows Mon vs Tue vs Wed vs Thu vs Fri vs Sat vs Sun |
| FR38 | Day view only shows Aggregation mode (no children) |
| FR39 | Chart type selection is remembered for the session |
| FR40 | Below chart, drill-down options show available child periods |
| FR41 | Below chart, drill-down options show available subcategories |
| FR42 | Each drill-down option displays label and total amount |
| FR43 | Tapping a drill-down option navigates to that level |
| FR44 | When period has no transactions, display specific message |
| FR45 | Empty state includes suggested action |
| FR46 | Empty periods appear grayed out but tappable in breadcrumb |
| FR47 | Download button is visible on all temporal views |
| FR48 | At Year/Quarter level, download exports yearly statistics summary |
| FR49 | At Month/Week/Day level, download exports full transactions for month |
| FR50 | Download icon changes based on export type |
| FR51 | Download works regardless of current category filter |
| FR52 | All temporal views use identical layout structure |
| FR53 | All icons use 24px size with stroke-width 2 |
| FR54 | All spacing follows 8px grid system |
| FR55 | All interactive elements have minimum 44x44px touch targets |
| FR56 | All new UI labels have English and Spanish translations |
| FR57 | Date formatting respects user's language setting |
| FR58 | Currency formatting respects user's currency setting |

---

## Story Map - Epic 7

```
Epic 7: Analytics UX Redesign
│
├── Story 7.1: Analytics Navigation Context (Foundation)
│   └── Dependencies: None
│   └── Deliverable: AnalyticsContext, useAnalyticsNavigation hook, types
│
├── Story 7.2: Temporal Breadcrumb Component
│   └── Dependencies: Story 7.1
│   └── Deliverable: Collapsible temporal breadcrumb with 5 levels
│
├── Story 7.3: Category Breadcrumb Component
│   └── Dependencies: Story 7.1
│   └── Deliverable: Collapsible category breadcrumb with 3 levels
│
├── Story 7.4: Chart Mode Toggle & Registry
│   └── Dependencies: Story 7.1
│   └── Deliverable: ChartModeToggle, chart registry pattern
│
├── Story 7.5: Drill-Down Cards Grid
│   └── Dependencies: Story 7.1
│   └── Deliverable: DrillDownCard, DrillDownGrid components
│
├── Story 7.6: Quarter & Week Date Utilities
│   └── Dependencies: None (can parallel with 7.1)
│   └── Deliverable: getQuartersInYear(), getWeeksInMonth() utilities
│
├── Story 7.7: TrendsView Integration
│   └── Dependencies: Stories 7.1-7.6
│   └── Deliverable: Refactored TrendsView using new components
│
├── Story 7.8: Bug Fixes & Polish
│   └── Dependencies: Story 7.7
│   └── Deliverable: FR1-4 fixes, visual consistency, i18n
│
└── Story 7.9: Epic Release & Deployment
    └── Dependencies: All above
    └── Deliverable: Deployed, tested, documented
```

---

## Stories - Epic 7

### Story 7.1: Analytics Navigation Context (Foundation)

As a **developer**,
I want **centralized analytics navigation state with typed actions**,
So that **all analytics components share a single source of truth**.

**Acceptance Criteria:**

**Given** the analytics view loads
**When** the AnalyticsContext provider mounts
**Then** navigation state initializes with current year, "all categories", aggregation mode

**And** state includes:
- `temporal: { level, year, quarter?, month?, week?, day? }`
- `category: { level, category?, group?, subcategory? }`
- `chartMode: 'aggregation' | 'comparison'`

**And** actions available via `dispatch()`:
- `SET_TEMPORAL_LEVEL` - navigate temporal hierarchy
- `SET_CATEGORY_FILTER` - apply category filter
- `TOGGLE_CHART_MODE` - switch aggregation/comparison
- `RESET_TO_YEAR` - return to year view
- `CLEAR_CATEGORY_FILTER` - remove category filter

**And** `validateNavigationState()` function catches impossible states
**And** `useAnalyticsNavigation()` hook provides typed access

**Prerequisites:** None
**Technical Notes:**
- Create `src/contexts/AnalyticsContext.tsx`
- Create `src/hooks/useAnalyticsNavigation.ts`
- Create `src/types/analytics.ts` with TypeScript interfaces (from architecture-epic7.md)
- Use `useReducer` for state management (ADR-010)
- Add memoization with `useMemo` for derived state
- Unit tests for reducer and validation function

**Covers:** FR25, FR26, FR27, FR28 (dual-axis independence)

---

### Story 7.2: Temporal Breadcrumb Component

As a **user viewing analytics**,
I want **a collapsible breadcrumb showing my current time position**,
So that **I always know where I am and can jump to any ancestor level**.

**Acceptance Criteria:**

**Given** I am on any temporal level (Year/Quarter/Month/Week/Day)
**When** I view the temporal breadcrumb
**Then** I see a collapsed button showing current level (e.g., "📅 October ▼")

**When** I tap the breadcrumb button
**Then** dropdown expands showing full path: Year > Q4 > October
**And** each ancestor level is tappable
**And** current level is highlighted with accent color
**And** tapping outside closes dropdown

**When** I tap an ancestor (e.g., "Q4")
**Then** view navigates to Q4 level preserving category filter
**And** breadcrumb updates immediately
**And** dropdown closes

**And** keyboard accessible: Tab to focus, Enter to expand, Arrow keys to navigate, Escape to close
**And** touch targets are 44x44px minimum
**And** ARIA attributes: `aria-expanded`, `aria-haspopup="listbox"`, `role="navigation"`

**Prerequisites:** Story 7.1 (AnalyticsContext)
**Technical Notes:**
- Create `src/components/analytics/TemporalBreadcrumb.tsx`
- Use Pattern 3 from architecture: Breadcrumb Dropdown Pattern
- Consume context via `useAnalyticsNavigation()` hook (Pattern 1)
- Close on outside click and Escape key
- Calendar icon (Lucide: Calendar) 24px
- Unit tests for render states, E2E for interaction

**Covers:** FR11, FR12, FR13, FR14, FR15 (temporal breadcrumb)

---

### Story 7.3: Category Breadcrumb Component

As a **user filtering analytics by category**,
I want **a collapsible breadcrumb showing my current category filter**,
So that **I can see what's filtered and jump back to broader categories**.

**Acceptance Criteria:**

**Given** I have no category filter active
**When** I view the category breadcrumb
**Then** I see collapsed button: "🏷️ All Categories ▼"

**Given** I have filtered to Food > Groceries > Meats
**When** I view the category breadcrumb
**Then** I see collapsed button: "🏷️ Meats ▼"

**When** I tap the breadcrumb button
**Then** dropdown expands showing: All Categories > Food > Groceries > Meats
**And** "All Categories" option always available at top
**And** each level is tappable
**And** current level is highlighted

**When** I tap "All Categories"
**Then** category filter clears, showing all data for current temporal level

**When** I tap "Groceries"
**Then** view updates to show Groceries (not Meats), temporal preserved

**And** keyboard/touch/ARIA requirements same as TemporalBreadcrumb

**Prerequisites:** Story 7.1 (AnalyticsContext)
**Technical Notes:**
- Create `src/components/analytics/CategoryBreadcrumb.tsx`
- Tag icon (Lucide: Tag) 24px
- Reuse dropdown pattern from TemporalBreadcrumb
- Unit tests, E2E tests

**Covers:** FR20, FR21, FR22, FR23, FR24 (category breadcrumb)

---

### Story 7.4: Chart Mode Toggle & Registry

As a **user viewing analytics**,
I want **to toggle between category breakdown and time comparison views**,
So that **I can answer both "what did I spend on?" and "how does spending vary?"**.

**Acceptance Criteria:**

**Given** I am on any temporal view except Day
**When** I view the chart area
**Then** I see mode toggle: [● Aggregation] [○ Comparison]

**When** I tap "Comparison"
**Then** toggle updates to: [○ Aggregation] [● Comparison]
**And** chart switches from pie/bar to grouped bar showing child periods
**And** transition is smooth crossfade (<300ms)

**Given** I am on Day view
**When** I view the chart area
**Then** mode toggle is hidden (single day has no children to compare)

**And** chart registry pattern implemented:
- `chartRegistry` maps chart types to components + metadata
- `getChartsForMode(mode)` returns available charts
- Future-ready for Sankey, Treemap, Heatmap additions

**And** mode selection persists for session (FR39)
**And** pill-style segmented control matches UX spec
**And** touch targets 44px

**Prerequisites:** Story 7.1 (AnalyticsContext)
**Technical Notes:**
- Create `src/components/analytics/ChartModeToggle.tsx`
- Create `src/config/chartRegistry.ts` with registry pattern (ADR-011)
- Create `src/components/charts/AnalyticsChart.tsx` wrapper
- Use `chartMode` from context
- Comparison mode: Year→Quarters, Quarter→Months, Month→Weeks, Week→Days
- Unit tests for registry, E2E for toggle behavior

**Covers:** FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37, FR38, FR39 (chart display)

---

### Story 7.5: Drill-Down Cards Grid

As a **user exploring analytics**,
I want **tappable cards showing child periods and subcategories**,
So that **I can drill deeper into my spending data**.

**Acceptance Criteria:**

**Given** I am on Month view (October) with no category filter
**When** I view below the chart
**Then** I see drill-down cards for weeks: Oct 1-7, Oct 8-14, Oct 15-21, Oct 22-28, Oct 29-31
**And** each card shows: label, total amount, percentage of current view

**When** I tap "Oct 8-14" card
**Then** view drills down to Week level for Oct 8-14
**And** breadcrumb updates, category filter preserved

**Given** I have category filter active (e.g., Food)
**When** I view drill-down section
**Then** I see BOTH temporal children (weeks) AND category children (subcategories)
**And** category cards show: Groceries $X, Restaurants $Y, etc.

**When** I tap a category card (e.g., "Groceries")
**Then** category filter updates to Groceries, temporal preserved

**And** cards have color indicator matching chart colors
**And** cards are full-width on mobile, 44px minimum height
**And** cards have hover/tap feedback (border highlight, slight lift)
**And** empty periods show grayed out but remain tappable

**Prerequisites:** Story 7.1 (AnalyticsContext)
**Technical Notes:**
- Create `src/components/analytics/DrillDownCard.tsx` (presentational, memo'd)
- Create `src/components/analytics/DrillDownGrid.tsx` (connected to context)
- Use Pattern 4 from architecture: Drill-Down Card Pattern
- Cards use callbacks, not direct dispatch (pure/presentational)
- Unit tests for card rendering, E2E for drill-down flow

**Covers:** FR40, FR41, FR42, FR43, FR44, FR45, FR46 (drill-down options, empty states)

---

### Story 7.6: Quarter & Week Date Utilities

As a **developer**,
I want **utilities for quarter and week calculations**,
So that **temporal navigation works correctly with consistent edge-case handling**.

**Acceptance Criteria:**

**Given** a year (e.g., 2024)
**When** `getQuartersInYear(2024)` is called
**Then** returns: [{ label: 'Q1', months: ['2024-01', '2024-02', '2024-03'] }, ...]

**Given** a month (e.g., "2024-10")
**When** `getWeeksInMonth('2024-10')` is called
**Then** returns month-aligned chunks: [{ label: 'Oct 1-7', start: '2024-10-01', end: '2024-10-07' }, ...]
**And** last week may be shorter (Oct 29-31 has 3 days)

**Given** a quarter string (e.g., "Q4")
**When** `getMonthsInQuarter(2024, 'Q4')` is called
**Then** returns: ['2024-10', '2024-11', '2024-12']

**And** `getQuarterFromMonth('2024-10')` returns 'Q4'
**And** `formatWeekLabel(start, end, locale)` returns localized "Oct 1-7" or "1-7 oct"
**And** all functions handle edge cases: leap years, month boundaries

**Prerequisites:** None (can develop in parallel with Story 7.1)
**Technical Notes:**
- Extend `src/utils/date.ts` with new functions
- Use month-aligned week chunks per ADR-012 (NOT ISO weeks)
- Use `Intl.DateTimeFormat` for locale-aware formatting
- Comprehensive unit tests for edge cases
- No external date libraries needed

**Covers:** FR6, FR7, FR8 (Quarter/Week views), FR57 (date formatting)

---

### Story 7.7: TrendsView Integration

As a **user**,
I want **the analytics view to use the new navigation components**,
So that **I can explore my spending with the dual-axis breadcrumb system**.

**Acceptance Criteria:**

**Given** I navigate to Analytics (TrendsView)
**When** the view loads
**Then** I see:
- Temporal breadcrumb (top left)
- Category breadcrumb (top right or below temporal)
- Total amount for current view
- Chart mode toggle
- Chart (pie/bar or grouped bar based on mode)
- Drill-down cards grid

**And** layout matches UX spec structure:
```
[📅 November ▼] [🏷️ Groceries ▼]
         November 2024
         $1,340,000
[● Aggregation] [○ Comparison]
        [CHART]
● Food 42%  ● Transport 15%  ...
Tap to drill down:
[Week 1 $280,000] [Week 2 $340,000] ...
```

**And** existing TrendsView props/state migrated to AnalyticsContext
**And** no layout shifts during navigation (CLS < 0.1)
**And** view transitions < 300ms
**And** chart renders < 500ms

**Prerequisites:** Stories 7.1-7.6 (all components ready)
**Technical Notes:**
- Refactor `src/views/TrendsView.tsx` to use new components
- Remove 6 useState calls, replace with AnalyticsContext
- Remove prop drilling (20+ props → context consumption)
- Incremental extraction per ADR-014
- Integration tests for full flow
- E2E test for complete user journey

**Covers:** FR5-11 (temporal navigation), FR16-19 (category navigation), FR52 (consistent layout)

---

### Story 7.8: Bug Fixes & Polish

As a **user**,
I want **the analytics view to be consistent and bug-free**,
So that **I can trust the interface and focus on understanding my spending**.

**Acceptance Criteria:**

**Given** I select October in month picker (FR1)
**When** the view updates
**Then** October data displays (not November - fix off-by-one)

**Given** any view with icons (FR2)
**When** I view the interface
**Then** all icons are 24px with stroke-width 2 (Lucide standard)

**Given** any view (FR3)
**When** I scroll or navigate
**Then** bottom navigation bar stays fixed, no layout shifts

**Given** Spanish language setting (FR4)
**When** I view analytics
**Then** all labels show Spanish: "Año", "Trimestre", "Mes", "Semana", "Día"
**And** "Todas las Categorías", "Por Categoría", "En el Tiempo"
**And** date formatting uses Spanish locale

**And** all spacing follows 8px grid (FR54)
**And** all touch targets ≥ 44x44px (FR55)
**And** new translation keys added to translations.ts (FR56)
**And** currency formatting respects user setting (FR58)

**Prerequisites:** Story 7.7 (integrated view)
**Technical Notes:**
- FR1: Fix month selector index calculation
- FR2: Audit all Lucide icons, ensure `size={24} strokeWidth={2}`
- FR3: Verify `position: fixed` on Nav, test across devices
- FR4: Add translation keys per architecture spec
- Use `Intl.DateTimeFormat` and `Intl.NumberFormat` with locale
- Visual regression tests recommended

**Covers:** FR1, FR2, FR3, FR4, FR53, FR54, FR55, FR56, FR57, FR58 (bug fixes, visual, i18n)

---

### Story 7.9: Epic Release & Deployment

As a **product owner**,
I want **Epic 7 deployed to production with all tests passing**,
So that **users can benefit from the improved analytics experience**.

**Acceptance Criteria:**

**Given** all stories 7.1-7.8 are complete
**When** I run the test suite
**Then** all unit tests pass (450+ existing + new)
**And** all integration tests pass
**And** all E2E tests pass
**And** new code has ≥80% coverage

**When** I deploy to Firebase Hosting
**Then** deployment succeeds
**And** production app shows new analytics UI
**And** no regressions in existing functionality

**And** docs/index.md updated with Epic 7 section
**And** story files moved to completed status
**And** retrospective scheduled/completed

**Prerequisites:** Stories 7.1-7.8 complete
**Technical Notes:**
- Run `npm run test:all` for full suite
- Run `npm run deploy` for Firebase deployment
- Update documentation
- May include Lighthouse performance check
- Schedule retrospective

**Covers:** NFR15 (test coverage), NFR16 (centralized state), deployment

---

## FR Coverage Matrix - Epic 7

| FR | Description | Story |
|----|-------------|-------|
| FR1 | Month selector fix | 7.8 |
| FR2 | Icon consistency 24px | 7.8 |
| FR3 | Fixed bottom nav | 7.8 |
| FR4 | Spanish translations | 7.8 |
| FR5 | Year view | 7.7 |
| FR6 | Quarter view | 7.6, 7.7 |
| FR7 | Month view | 7.7 |
| FR8 | Week view | 7.6, 7.7 |
| FR9 | Day view | 7.7 |
| FR10 | Drill down temporal | 7.5, 7.7 |
| FR11 | Navigate back temporal | 7.2 |
| FR12 | Temporal breadcrumb display | 7.2 |
| FR13 | Temporal breadcrumb tappable | 7.2 |
| FR14 | Temporal breadcrumb updates | 7.2 |
| FR15 | Current level highlighted | 7.2 |
| FR16 | Filter by Category | 7.3, 7.7 |
| FR17 | Filter by Group | 7.3, 7.7 |
| FR18 | Filter by Subcategory | 7.3, 7.7 |
| FR19 | Category drill down | 7.5 |
| FR20 | Navigate back category | 7.3 |
| FR21 | Category breadcrumb display | 7.3 |
| FR22 | Category breadcrumb tappable | 7.3 |
| FR23 | "All Categories" option | 7.3 |
| FR24 | Category breadcrumb updates | 7.3 |
| FR25 | Independent filters | 7.1 |
| FR26 | Temporal preserves category | 7.1 |
| FR27 | Category preserves temporal | 7.1 |
| FR28 | Any combination | 7.1 |
| FR29 | Chart displays | 7.4 |
| FR30 | Total amount | 7.4, 7.7 |
| FR31 | Mode toggle | 7.4 |
| FR32 | Aggregation pie/bar | 7.4 |
| FR33 | Comparison grouped bar | 7.4 |
| FR34 | Year comparison Q1-Q4 | 7.4 |
| FR35 | Quarter comparison months | 7.4 |
| FR36 | Month comparison weeks | 7.4 |
| FR37 | Week comparison days | 7.4 |
| FR38 | Day aggregation only | 7.4 |
| FR39 | Mode remembered | 7.4 |
| FR40 | Drill-down periods | 7.5 |
| FR41 | Drill-down categories | 7.5 |
| FR42 | Card label and amount | 7.5 |
| FR43 | Card navigation | 7.5 |
| FR44 | Empty state message | 7.5 |
| FR45 | Empty state action | 7.5 |
| FR46 | Empty periods grayed | 7.5 |
| FR47 | Download visible | 7.7 (existing) |
| FR48 | Year/Quarter stats export | 7.7 (existing) |
| FR49 | Month/Week/Day transaction export | 7.7 (existing) |
| FR50 | Download icon changes | 7.7 (existing) |
| FR51 | Download ignores category | 7.7 (existing) |
| FR52 | Consistent layout | 7.7 |
| FR53 | 24px icons | 7.8 |
| FR54 | 8px grid | 7.8 |
| FR55 | 44px touch targets | 7.2, 7.3, 7.4, 7.5 |
| FR56 | English/Spanish labels | 7.8 |
| FR57 | Locale date formatting | 7.6, 7.8 |
| FR58 | Locale currency formatting | 7.8 |

**Coverage Verification:** ✅ All 58 FRs mapped to stories

---

## Implementation Sequence - Epic 7

**Recommended Order (per Architecture ADR-014):**

1. **Story 7.6** (Date Utilities) - No dependencies, can start immediately
2. **Story 7.1** (AnalyticsContext) - Foundation, enables all other stories
3. **Story 7.2** (Temporal Breadcrumb) - Depends on 7.1
4. **Story 7.3** (Category Breadcrumb) - Depends on 7.1, can parallel with 7.2
5. **Story 7.4** (Chart Mode Toggle) - Depends on 7.1, can parallel with 7.2/7.3
6. **Story 7.5** (Drill-Down Cards) - Depends on 7.1
7. **Story 7.7** (TrendsView Integration) - Depends on 7.1-7.6
8. **Story 7.8** (Bug Fixes & Polish) - Depends on 7.7
9. **Story 7.9** (Release & Deploy) - Depends on all above

**Parallelization Options:**
- 7.1 and 7.6 can be developed simultaneously
- 7.2, 7.3, 7.4, 7.5 can parallel after 7.1 completes
- 7.7 requires all components ready
- 7.8 and 7.9 are sequential after 7.7
