# Architectural Decisions & Patterns

> Section 4 of Atlas Memory
> Last Sync: 2025-12-31
> Sources: architecture.md, ADRs, tech-spec documents, tech-context-epic14.md

## Tech Stack

<!-- Synced from: architecture/architecture.md -->

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18 + TypeScript + Vite | PWA with mobile-first design |
| Styling | Tailwind CSS + CSS Custom Properties | Runtime theme switching |
| State | React Context | Analytics navigation, auth |
| Backend | Firebase (Auth, Firestore, Storage, Functions) | Serverless architecture |
| AI/ML | Google Gemini 2.0 Flash | Receipt OCR via Cloud Function |
| Testing | Vitest (unit/integration) + Playwright (E2E) | 84%+ coverage, 2534+ tests |
| CI/CD | GitHub Actions → Firebase Hosting | Auto-deploy on main merge |

## System Boundaries

### In Scope (Client)
- Receipt image capture and display
- Transaction CRUD UI
- Analytics visualization
- Learning prompt UI
- User preferences

### In Scope (Backend)
- Firebase Auth (Google sign-in)
- Firestore (transactions, mappings)
- Cloud Storage (receipt images)
- Cloud Functions (Gemini API proxy)

### External Dependencies
- Google Gemini 2.0 Flash API
- Firebase services
- Mercado Pago (future - payments)

## Data Model

```
users/{userId}/
  transactions/{transactionId}    - Individual transactions
  categoryMappings/{mappingId}    - Learned category preferences
  merchantMappings/{mappingId}    - Learned merchant preferences
  subcategoryMappings/{mappingId} - Learned subcategory preferences
  userInsightProfile              - User phase and insight state (Epic 10)
  trustedMerchants/{merchantId}   - Auto-save merchants with category (Epic 11)
  insightRecords/{insightId}      - Extended insight history with full content (Epic 10a)
```

## Architectural Decisions (ADRs)

| ADR | Decision | Rationale | Status |
|-----|----------|-----------|--------|
| ADR-010 | React Context for Analytics State | Clean separation, hook patterns | Active |
| ADR-011 | Chart Registry Pattern | Extensible chart type system | Active |
| ADR-012 | Month-Aligned Weeks | Simpler date math, better financial UX | Active |
| ADR-015 | Client-Side Insight Engine | No Cloud Functions dependency for insights | Active |
| ADR-016 | Hybrid Insight Storage | Local-first with Firestore backup | Active |
| ADR-017 | Phase-Based Priority | Different insights for cold-start vs data-rich | Active |
| ADR-018 | Quick Save Confidence Scoring | Weighted field completeness (85% threshold) | Active (Epic 11) |
| ADR-019 | Trust Merchant Auto-Save | Merchant-specific auto-categorization | Active (Epic 11) |
| ADR-020 | Scan State Machine | Explicit state transitions for scan UX | Active (Epic 11) |

## Security Rules Pattern

<!-- Synced from: architecture.md -->

- All user data scoped by `request.auth.uid == userId`
- Unauthenticated access denied
- Cross-user access impossible by design
- Data isolation enforced at Firestore level

## Key Patterns Adopted

### State Management
- React Context for global state (analytics, auth)
- Local component state for UI interactions
- Firestore for persistence

### Error Handling
- Try/catch with user-friendly error messages
- Loading states during async operations
- Graceful degradation for offline

### Code Organization
```
src/
├── components/   # Reusable UI components
├── views/        # Page-level components
├── services/     # Firebase, Gemini API
├── hooks/        # Custom React hooks
├── types/        # TypeScript interfaces
├── utils/        # Pure utility functions
└── config/       # Constants, prompts
```

## Data Flows

### Receipt Scan Flow
```
Camera → Image Capture → Base64 Encode →
Cloud Function → Gemini API → Parse Response →
Apply Mappings → Display in EditView → Save to Firestore
```

### Analytics Data Flow
```
Firestore Query → FilteringService → AnalyticsContext →
Chart Components → User Interaction → Drill-down/Navigation
```

### Insight Generation Flow (Epic 10)
```
Transaction Save → [Async Side-Effect] →
generateInsightForTransaction() →
generateAllCandidates() → [12 Generators] → selectInsight() →
Display InsightCard (or BuildingProfileCard Fallback)
```

**UI Components (Story 10.6):**
- `InsightCard` - Displays insight with icon, title, message; auto-dismiss 5s; manual dismiss
- `BuildingProfileCard` - Fallback for cold-start users without enough data
- `useInsightProfile` - Hook for Firestore profile and local cache management
- CSS animations: `animate-slide-up`, `animate-fade-out` (respects prefers-reduced-motion)

**Generators (Stories 10.3 & 10.4):**
- Transaction-intrinsic (10.3): `biggest_item`, `item_count`, `unusual_hour`, `weekend_warrior`, `new_merchant`, `new_city`, `category_variety`
- Pattern detection (10.4): `merchant_frequency`, `category_trend`, `day_pattern`, `spending_velocity`, `time_pattern`
- **Default Time Skip (post-10.6 fix)**: Time-based generators (`unusual_hour`, `time_pattern`) skip DEFAULT_TIME ("04:04") sentinel value since it indicates "time not available" rather than actual extracted time

**Precomputed Aggregates (Story 10.4):**
- `computeAggregates()` - merchantVisits, categoryTotals
- Stored in LocalInsightCache for O(1) lookups
- Helpers: `getMerchantVisitCount()`, `getCategoryTotal()`

**Selection Algorithm (Story 10.5):**
- `getInsightPriority()` - Returns category priority order based on phase + sprinkle
- `selectInsight()` - Full selection with cooldown filtering, phase priority, category grouping
- `incrementScanCounter()` - Weekday/weekend counters with weekly reset
- `maybeResetCounters()` - Auto-reset on cache retrieval if 7+ days elapsed

**Selection Logic (ADR-017):**
- WEEK_1: 100% QUIRKY_FIRST
- WEEKS_2_3: 66% CELEBRATORY / 33% ACTIONABLE (same weekday/weekend)
- MATURE weekday: 66% ACTIONABLE / 33% CELEBRATORY
- MATURE weekend: 66% CELEBRATORY / 33% ACTIONABLE
- Sprinkle: `scanCounter % 3 === 0` triggers minority type

---

## Code Review Learnings

### Story 10a.1 - Home Screen Consolidation (2025-12-20)

**Pattern Adoption:**
- HistoryFiltersContext reuse: Same filter context for HistoryView and DashboardView
- Component sharing: HistoryFilterBar, TransactionThumbnail, ImageViewer across views
- Service reuse: getDuplicateIds(), filterTransactionsByHistoryFilters()

**Technical Decisions:**
- Session-scoped filter state (filters reset when view unmounts - intentional)
- Page size 10 hardcoded in DashboardView (could use ITEMS_PER_PAGE constant)
- Backward compatibility: onTriggerScan prop kept but unused (prefixed with _)

### Story 11.1 - One Image = One Transaction (2025-12-21)

**Pattern Adoption:**
- Sequential API calls: Process each image individually to maintain 1:1 image-to-transaction mapping
- Modal overlay pattern: BatchUploadPreview and BatchProcessingProgress use fixed modal overlays
- Fire-and-forget for mapping updates: incrementMappingUsage calls are non-blocking

**Technical Decisions:**
- Credit deduction after save: Credits deducted only after successful Firestore save (prevents lost credits on API failure)
- Batch complete delay: 500ms delay before showing BatchSummary (BATCH_COMPLETE_DELAY_MS constant)
- Image removal UX: When removing images leaves 1, automatically switch to single-image flow

**Coverage Notes:**
- Tests added: 30 tests across BatchUploadPreview.test.tsx (16) and BatchProcessingProgress.test.tsx (14)
- Coverage gap: Missing integration test for full processBatchImages flow

### Story 11.2 - Quick Save Card Component (2025-12-21)

**Pattern Adoption:**
- Modal overlay pattern: QuickSaveCard uses fixed modal with dialog role and aria-modal
- Weighted confidence scoring: Field completeness heuristic (merchant 20%, total 25%, date 15%, category 15%, items 25%)
- Shared utility extraction: categoryEmoji.ts extracted for reuse across components

**Technical Decisions:**
- 85% confidence threshold: Balances speed vs accuracy for quick save eligibility
- Pre-applied mappings: Category and merchant mappings applied before Quick Save Card, not re-applied on save
- Fire-and-forget insight recording: Non-blocking recordInsightShown and trackTransactionForInsight calls

**Coverage Notes:**
- Tests added: 80 tests (30 QuickSaveCard, 24 confidenceCheck, 26 categoryEmoji)
- Coverage gaps: None identified - comprehensive component and logic testing

### Story 11.3 - Animated Item Reveal (2025-12-21)

**Pattern Adoption:**
- Staggered reveal animation: CSS keyframes with `will-change`, wrapped in AnimatedItem component, maxDurationMs caps total time
- Reduced motion preference: `useReducedMotion` hook subscribes to media query changes, skips animation when true
- Component integration: Optional `animateItems` prop with parent state tracking for one-time animation

**Technical Decisions:**
- Animation state in App.tsx: Single `animateEditViewItems` state controls animation for fresh scan results
- Animation timing: 100ms stagger, 300ms initial delay, 2500ms max duration (adjusts stagger for long lists)
- CSS-only implementation: GPU-accelerated transforms/opacity, no JavaScript animation libraries

**Coverage Notes:**
- Tests added: 34 (7 + 12 + 15 across 3 test files)
- Test patterns: Fake timers for animation hooks, mocked useReducedMotion

### Story 11.4 - Trust Merchant System (2025-12-21)

**Pattern Adoption:**
- Merchant trust flow: First save prompts to remember, subsequent scans auto-save
- Type-safe Firestore timestamps: `TrustedMerchantCreate` interface with serverTimestamp(), `TrustedMerchant` interface with Timestamp fields
- Service layer: `merchantTrustService.ts` handles CRUD for trusted merchants

**Technical Decisions:**
- Trust threshold: Merchant must match exactly (case-insensitive) to trigger auto-save
- User control: TrustedMerchantsList in Settings allows removal
- Integration point: Quick Save Card checks trust status before showing

**Coverage Notes:**
- Tests added: 28 (service + hook + component tests)
- Pattern: Mock Firestore operations with vitest

### Story 11.5 - Scan Status Clarity (2025-12-22)

**Pattern Adoption:**
- State machine pattern: `useScanStateMachine` hook with explicit states (idle, uploading, processing, ready, error)
- Status component hierarchy: `ScanProgress` orchestrates `ScanError`, shows clear progression
- State sync via useRef + useEffect: External triggers update internal machine state

**Technical Decisions:**
- Never hardcode loading state: Pass actual boolean loading prop, never `loading={false}`
- Document unused-by-design states: State machine includes states for future extensibility
- Reduced motion support: Status animations respect prefers-reduced-motion

**Coverage Notes:**
- Tests added: 21 (state machine hook + status components)
- Pattern: Explicit state transition testing

### Story 11.6 - PWA Viewport Adaptation (2025-12-22)

**Pattern Adoption:**
- Dynamic viewport units: `h-screen h-[100dvh]` for iOS Safari URL bar changes
- Safe area CSS properties: `env(safe-area-inset-*)` for notched devices
- Mobile keyboard handling: Viewport meta with `interactive-widget=resizes-content`

**Technical Decisions:**
- Dual height declaration: Both `h-screen` (fallback) and `h-[100dvh]` (modern) for compatibility
- Container structure: Root container handles safe areas, inner components use relative sizing
- Touch optimization: Proper touch targets, scroll behavior for small viewports

**Coverage Notes:**
- Visual regression testing recommended
- Manual testing on iOS/Android devices required

---

## PWA Viewport Pattern (Epic 11.6)

### The Problem
iOS Safari hides/shows URL bar, causing layout shifts. Notched devices need safe area handling.

### The Solution
```html
<!-- index.html meta viewport -->
<meta name="viewport" content="..., interactive-widget=resizes-content">
```

```css
/* Tailwind in App.tsx root container */
min-h-screen min-h-[100dvh]
pb-[env(safe-area-inset-bottom)]
```

### Key Patterns
1. **Dynamic viewport height**: Use `dvh` with `vh` fallback
2. **Safe area insets**: Apply to bottom padding for nav bar clearance
3. **Touch targets**: Minimum 44px for accessibility
4. **Scroll containers**: Use `overflow-y-auto` with proper height constraints

---

## Quick Save Confidence Scoring (Epic 11.2)

### Weighted Field Completeness

| Field | Weight | Rationale |
|-------|--------|-----------|
| merchant | 20% | Required for categorization |
| total | 25% | Core transaction value |
| date | 15% | Important for trends |
| category | 15% | Required for analytics |
| items | 25% | Detail completeness |

### Threshold Logic
- **>= 85%**: Quick Save eligible (show QuickSaveCard)
- **< 85%**: Show EditView for manual review

### Implementation
```typescript
// confidenceCheck.ts
export function calculateConfidence(transaction: Transaction): number {
  // Weighted scoring with field-specific validation
}
```

---

## Trust Merchant Flow (Epic 11.4)

### User Journey
```
First Scan → Save → TrustMerchantPrompt ("Remember this store?")
                  ↓ User confirms
Second Scan → Auto-detected → Quick Save (skips card)
```

### Data Model
```typescript
interface TrustedMerchant {
  merchantName: string;
  storeCategory: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Service API
- `checkMerchantTrust(userId, merchantName)`: Check if merchant is trusted
- `saveTrustedMerchant(userId, merchant)`: Add to trusted list
- `removeTrustedMerchant(userId, merchantId)`: Remove trust

---

## State Machine Integration Pattern (Epic 11.5)

### Scan State Machine

```typescript
type ScanState = 'idle' | 'uploading' | 'processing' | 'ready' | 'error';

interface ScanStateMachine {
  state: ScanState;
  error: string | null;
  transition: (to: ScanState) => void;
}
```

### UI Mapping
| State | UI Component | User Message |
|-------|--------------|--------------|
| idle | (none) | Ready to scan |
| uploading | Spinner | Uploading image... |
| processing | Progress | Processing receipt... |
| ready | Success icon | Ready for review |
| error | Error alert | [Error message] |

### Sync Pattern
```typescript
// External state drives internal machine
useEffect(() => {
  if (isLoading) machineRef.current.transition('processing');
  else if (hasError) machineRef.current.transition('error');
  else if (hasResult) machineRef.current.transition('ready');
}, [isLoading, hasError, hasResult]);
```

---

---

## Epic 14 Architecture Preview

### Animation Framework (Story 14.1)

```typescript
// AnimationContext Provider
interface AnimationContextValue {
  breathingPhase: number; // 0-1 for 3s cycle
  isReducedMotion: boolean;
  getStaggerDelay: (index: number) => number;
}

// Constants from motion-design-system.md
const ANIMATION_CONSTANTS = {
  breathingCycleDuration: 3000, // ms
  breathingScaleRange: { min: 1, max: 1.02 },
  breathingOpacityRange: { min: 0.9, max: 1.0 },
  staggerDelayMs: 100,
  celebrationSpringConfig: { tension: 180, friction: 12 },
};
```

### Dynamic Polygon (Stories 14.5-14.7)

```typescript
// Polygon modes
type PolygonMode = 'breathing' | 'interactive';

// Data structure for category-based vertices
interface PolygonVertex {
  category: string;
  value: number; // spending amount
  angle: number; // calculated from category count
}

// Dual-mode: inner = spending, outer = budget threshold
interface DualPolygonConfig {
  innerData: PolygonVertex[]; // actual spending
  outerData: PolygonVertex[]; // budget limits
}
```

### Celebration System (Story 14.12)

```typescript
interface CelebrationConfig {
  type: 'small' | 'big';
  confetti?: boolean;
  haptic?: boolean;
  sound?: boolean;
}

const CELEBRATION_PRESETS = {
  milestone: { type: 'big', confetti: true, haptic: true, sound: true },
  personalRecord: { type: 'big', confetti: true, haptic: true, sound: true },
  quickSave: { type: 'small', confetti: true, haptic: true, sound: false },
};
```

---

## Transaction Groups & Selection Mode (Story 14.15)

### Data Model Extension
```typescript
// New collection for user groups
users/{userId}/groups/{groupId}
  - name: string
  - transactionCount: number
  - totalAmount: number
  - currency?: string
  - createdAt: Timestamp
  - updatedAt: Timestamp

// Transaction fields extended
interface Transaction {
  // ...existing fields
  groupId?: string;    // Reference to group document
  groupName?: string;  // Denormalized for display
}
```

### Service Layer Pattern
```typescript
// groupService.ts - CRUD operations for groups
- subscribeToGroups(): Real-time listener
- createGroup(): Create with serverTimestamp
- assignTransactionsToGroup(): Batch update with totals
- removeTransactionsFromGroup(): Batch removal with totals

// firestore.ts - Extended with batch operations
- deleteTransactionsBatch(): Delete multiple transactions
```

### Hook Pattern
```typescript
// useSelectionMode hook
- isSelectionMode: boolean
- selectedIds: Set<string>
- enterSelectionMode(initialId?): Long-press triggers
- toggleSelection(id): Checkbox toggle
- exitSelectionMode(): Clear selection

// useGroups hook
- groups: TransactionGroup[]
- loading: boolean
- addGroup(input): Create new group
```

### Modal Architecture
```typescript
// Three-modal flow for group assignment:
1. AssignGroupModal - Select existing group or create new
2. CreateGroupModal - Name input with emoji tip
3. DeleteTransactionsModal - Confirmation with preview

// Shared patterns:
- Focus trap with Tab cycling
- Escape key closes modal
- Restore focus on close
- Body scroll prevention
```

---

## Input Sanitization Pattern (Story 14.15 - Security Enhancement)

### Problem Statement
User input fields (merchant names, item names, locations, subcategories) could potentially contain malicious content like XSS scripts or injection attacks.

### Solution: Centralized Sanitization Utility
Created `src/utils/sanitize.ts` with functions that:
1. Remove dangerous patterns (script tags, event handlers, javascript: protocols)
2. Remove control characters
3. Normalize whitespace
4. Enforce maximum length limits

### Available Functions
```typescript
// src/utils/sanitize.ts
sanitizeInput(input, options)      // Base function with configurable options
sanitizeMerchantName(name)         // Max 200 chars
sanitizeItemName(name)             // Max 200 chars
sanitizeLocation(location)         // Max 100 chars
sanitizeSubcategory(subcategory)   // Max 100 chars
sanitizeNumericInput(value)        // Clean numeric strings
```

### Usage Pattern
```typescript
// Apply sanitization before saving to Firestore
const sanitizedMerchant = sanitizeMerchantName(merchantName);
const sanitizedCity = sanitizeLocation(city);

const sanitizedItems = items.map((item) => ({
  ...item,
  name: sanitizeItemName(item.name),
  subcategory: item.subcategory ? sanitizeSubcategory(item.subcategory) : undefined,
}));
```

### Where Applied
- **ScanResultView.tsx**: `handleSave()` and `handleSaveItem()` functions
- **Story 14.23 (planned)**: App-wide audit to apply sanitization to all input fields

### Security Patterns Blocked
- `<script>` tags and event handlers (`onclick=`, etc.)
- Protocol attacks (`javascript:`, `data:`, `vbscript:`)
- Control character injection
- DoS via extremely long strings

---

## Sync Notes

- Architecture stable since Epic 7
- Epic 10 COMPLETE: Client-side insight engine with 12 generators (ADRs 015-017)
- Epic 10a COMPLETE: UX Consolidation with Home+History merge, Insights tab
- Epic 11 COMPLETE: Quick Save optimization with confidence scoring, trust merchants, PWA viewport
- Epic 12 COMPLETE: Batch mode with parallel processing, credit validation
- Epic 13 COMPLETE: UX Design with 10 HTML mockups, motion design system
- **Epic 14 READY-FOR-DEV**: Animation framework, dynamic polygon, celebrations (14 stories, ~48 pts)
- Security rules pattern consistently applied
- Story 10.3 established generator registry pattern with `canGenerate/generate` interface
- Story 10.4 added 5 pattern detection generators with precomputed aggregates (2025-12-18)
- Story 10.5 implemented full selection algorithm with phase-based priority and sprinkle distribution (2025-12-19)
- Story 10.6 added InsightCard UI layer with async side-effect pattern in App.tsx save flow (2025-12-19)
- Story 10a.1 unified Dashboard+History into consolidated Home view with shared filter context (2025-12-20)
- Story 11.1 added batch image processing with sequential API calls and credit-after-save pattern (2025-12-21)
- Story 11.2 added Quick Save Card with weighted confidence scoring and 85% threshold (2025-12-21)
- Story 11.3 added animated item reveal with staggered timing, reduced motion support, and App.tsx integration (2025-12-21)
- Story 11.4 added trust merchant system with auto-save capability for frequent merchants (2025-12-21)
- Story 11.5 added scan status clarity with state machine hook, status components, and reduced motion support (2025-12-22)
- Story 11.6 added PWA viewport fixes with dynamic viewport units (dvh) and safe area CSS properties (2025-12-22)
- Combined retrospective: docs/sprint-artifacts/epic10-11-retro-2025-12-22.md
- Total velocity: ~72 points in ~6 days (~12 pts/day)
- Story 14.15 (done): Selection mode with long-press entry, group assignment modals, batch delete confirmation
- Story 14.16 (done): Weekly Report Story Format - Instagram-style swipeable report cards with weekly summary, category breakdowns, Rosa-friendly language, and progress dots. Added transactionCount + dateRange fields, navigation to History with period filters (2026-01-05)
- Story 14.16b (drafted): Semantic Color System - CSS variables for trend colors (positive/negative/neutral/warning) per theme, harmonized chart palettes

## Weekly Reports System (Story 14.16)

### Architecture Overview
Instagram-style swipeable report cards for displaying weekly spending summaries.

### Key Components
1. **ReportCard** (`src/components/reports/ReportCard.tsx`): Full-screen card with gradient backgrounds, TrendIndicator for arrows/colors
2. **ReportCarousel** (`src/components/reports/ReportCarousel.tsx`): Swipeable carousel using useSwipeNavigation hook, keyboard navigation, progress dots
3. **ReportsView** (`src/views/ReportsView.tsx`): View component rendering the carousel
4. **reportUtils** (`src/utils/reportUtils.ts`): Weekly summary generation, category breakdown, report card generation

### Data Flow
```
Transaction[] → generateWeeklySummary() → WeeklySummary → generateReportCards() → ReportCard[] → ReportCarousel
```

### Patterns Used
- **Rosa-friendly language**: "Subió harto" instead of "Incrementó 27%" (TREND_DESCRIPTIONS in types/report.ts)
- **Swipe navigation reuse**: Uses useSwipeNavigation from Story 14.9
- **Category emoji mapping**: Uses getCategoryEmoji from categoryEmoji.ts
- **Profile menu integration**: Added 'reports' view type, enabled menu item in TopHeader

### Test Coverage
71 tests across 3 files:
- ReportCard.test.tsx: 15 tests
- ReportCarousel.test.tsx: 18 tests
- reportUtils.test.ts: 38 tests

### Recent Enhancements (2026-01-05)
- **Transaction Count Pill**: Report header shows transaction count with Receipt icon, clickable to navigate to History
- **Period Filtering**: Clicking pill navigates to History with temporal filters matching report period
- **Section Counters**: Fixed to show total periods per year (52 weeks, 12 months, 4 quarters, 1 yearly)
- **New Fields**: ReportRowData now includes `transactionCount` and `dateRange` for all period types

---

## Semantic Color System (Story 14.16b - Planned)

### Problem Statement
Hardcoded trend colors (#ef4444 red, #22c55e green) don't harmonize with all themes:
- **Normal (Ghibli)**: Bright corporate colors look jarring in warm, hand-painted aesthetic
- **Mono**: Saturated colors clash with subdued palette

### Proposed Solution
CSS variables for semantic colors that adapt per theme:

```css
/* Theme-specific semantic colors */
--positive-primary: /* Spending down (good) */
--positive-bg: /* Badge background */
--positive-border: /* Badge border */

--negative-primary: /* Spending up (bad) */
--negative-bg:
--negative-border:

--neutral-primary: /* No change */
--warning-primary: /* Approaching limits */

/* Chart palette (6 harmonized colors) */
--chart-1 through --chart-6
```

### Theme Color Mapping
| State | Normal (Ghibli) | Professional | Mono |
|-------|-----------------|--------------|------|
| Positive | Sage #3d8c5a | Green #16a34a | Teal #3a8c70 |
| Negative | Terracotta #b85c4a | Red #dc2626 | Clay #a05858 |
| Neutral | Warm gray #7a7268 | Cool gray #64748b | True gray #686870 |
| Warning | Ochre #a8842c | Amber #d97706 | Tan #988040 |

### Files to Migrate
- `types/report.ts`: TREND_COLORS constant
- `DashboardView.tsx`: Hardcoded #ef4444/#22c55e
- `TrendsView.tsx`: DRILL_DOWN_COLORS array
- `insightTypeConfig.ts`: Accent colors
- `ScanReady.tsx`: Success green

### Design Reference
`docs/uxui/mockups/00_components/category-colors.html` - "Semantic Colors" section
