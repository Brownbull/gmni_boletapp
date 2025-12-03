# boletapp - Epic Breakdown

**Date:** 2025-12-02
**Project Level:** Quick-Flow Brownfield
**Last Updated:** Epic 5 added

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
