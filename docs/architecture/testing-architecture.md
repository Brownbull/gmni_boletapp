# BoletApp Testing Architecture

> **Version:** 1.0
> **Last Updated:** 2026-01-14
> **Total Tests:** ~3,200+
> **Coverage Target:** 84%+

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Unit Tests](#unit-tests)
4. [Integration Tests](#integration-tests)
5. [E2E Tests](#e2e-tests)
6. [Prompt Tests](#prompt-tests)
7. [Cloud Function Tests](#cloud-function-tests)
8. [Security Tests](#security-tests)
9. [Test Infrastructure](#test-infrastructure)
10. [Coverage by Feature Area](#coverage-by-feature-area)
11. [CI/CD Pipeline](#cicd-pipeline)
12. [Known Issues & Technical Debt](#known-issues--technical-debt)

---

## Overview

BoletApp employs a multi-layered testing strategy designed to ensure reliability across the receipt scanning and expense tracking application. The testing pyramid follows industry best practices:

```
                    ┌─────────┐
                    │   E2E   │  7 specs - User journeys
                    │  Tests  │  (~50 tests)
                   ─┼─────────┼─
                  / │         │ \
                 /  │Integrat.│  \  25 files - Service integration
                /   │  Tests  │   \ (~200 tests)
              ─/────┼─────────┼────\─
             /      │         │      \
            /       │  Unit   │       \  170 files - Isolated logic
           /        │  Tests  │        \ (~3,000 tests)
          ──────────┴─────────┴──────────
```

### Test Frameworks

| Framework | Purpose | Tests |
|-----------|---------|-------|
| **Vitest** | Unit & Integration tests | ~3,200 |
| **Playwright** | E2E browser tests | ~50 |
| **ESLint Security** | Static security analysis | N/A |
| **Firebase Rules Testing** | Security rules validation | ~20 |

---

## Testing Strategy

### Test Levels

| Level | Purpose | Coverage Target | Emulator Required |
|-------|---------|-----------------|-------------------|
| **Unit** | Isolated function/component testing | 80%+ | Some tests |
| **Integration** | Service and hook testing with real Firestore | Key flows | Yes |
| **E2E** | Full user journey validation | Critical paths | Yes |
| **Security** | Static vulnerability scanning | All source files | No |

### Test Priorities

| Priority | Area | Risk Level | Reason |
|----------|------|------------|--------|
| 1 | Authentication Flow | HIGH | Security |
| 1 | Data Isolation | HIGH | Privacy - Multi-tenant data |
| 1 | Firestore Security Rules | HIGH | Security |
| 2 | Transaction CRUD | HIGH | Data integrity |
| 2 | Receipt Scanning | HIGH | Core feature |
| 3 | Analytics Accuracy | MEDIUM | User trust |
| 3 | Category Learning | MEDIUM | UX quality |

---

## Unit Tests

**Location:** `tests/unit/`
**Files:** 170 test files
**Tests:** ~3,000
**Framework:** Vitest + happy-dom

### Directory Structure

```
tests/unit/
├── analytics/           # 12 files - Dashboard & navigation
├── components/          # 73 files - UI components
│   ├── analytics/       # Analytics UI components
│   ├── animation/       # Animation system
│   ├── batch/           # Batch processing UI
│   ├── celebrations/    # Achievement celebrations
│   ├── charts/          # Chart components
│   ├── history/         # Transaction history
│   ├── insights/        # AI insights (17 files)
│   ├── items/           # Item management
│   ├── polygon/         # Polygon visualization
│   ├── reports/         # Report generation
│   ├── scan/            # Receipt scanning UI
│   ├── session/         # Session management
│   └── settings/        # Settings UI
├── config/              # 2 files - Configuration
├── contexts/            # 1 file - React contexts
├── hooks/               # 25 files - Custom hooks
├── lib/                 # 1 file - Library utilities
├── services/            # 13 files - Business logic
├── types/               # 2 files - Type definitions
├── utils/               # 23 files - Utility functions
└── views/               # 6 files - Full page views
```

### Subsections by Functional Area

#### A. Analytics Tests (12 files)

Tests for the analytics dashboard, drill-down navigation, and temporal filtering.

| File | Purpose | Key Tests |
|------|---------|-----------|
| `CategoryBreadcrumb.test.tsx` | Category navigation trail | Breadcrumb rendering, click handlers |
| `ChartModeToggle.test.tsx` | Chart type switching | Mode toggle, state persistence |
| `DrillDownCard.test.tsx` | Drill-down cards | Card rendering, click navigation |
| `DrillDownGrid.test.tsx` | Drill-down grid layout | Grid responsiveness, item rendering |
| `DrillDownModeToggle.test.tsx` | Drill-down mode switching | Mode toggle state |
| `FloatingDownloadFab.test.tsx` | Export button | FAB visibility, click handlers |
| `TemporalBreadcrumb.test.tsx` | Time period navigation | Period selection, range display |
| `TotalDisplay.test.tsx` | Total amount display | Currency formatting, animations |
| `analyticsReducer.test.tsx` | Analytics state reducer | All reducer actions, state transitions |
| `chartModeRegistry.test.ts` | Chart type registry | Registration, retrieval |
| `useAnalyticsNavigation.test.tsx` | Navigation hook | Navigation actions, URL sync |
| `validateNavigationState.test.ts` | State validation | Invalid state handling |

#### B. Component Tests (73 files)

Organized by feature area:

**Animation System (7 files):**
- Page transitions with spring physics
- Staggered reveal animations
- Breathing/pulse effects
- Reduced motion accessibility
- Navigation direction detection

**Batch Processing (5 files):**
- Multi-receipt capture UI
- Batch processing progress
- Summary cards
- Confirmation dialogs
- Credit warning dialogs

**Celebrations (3 files):**
- Achievement triggers
- Personal record banners
- Celebration hook logic

**Charts (2 files):**
- Pie chart rendering
- Stacked bar chart rendering

**History (3 files):**
- Date group headers
- Filter chips
- Transaction cards

**Insights (17 files)** - Largest subsection:
- Airlock sequence (AI processing visualization)
- Badge unlock animations
- Batch summary display
- Celebration cards
- Insight cards (standard and large)
- Detail modals
- History list
- Carousel navigation
- Temporal filtering
- View switcher

**Polygon Visualization (4 files):**
- Dynamic polygon rendering
- Lava overlay effects
- Mode toggle
- Combined polygon view

**Scan Components (8 files):**
- Batch processing progress
- Upload preview
- Quick save card
- Mode selector
- Overlay UI
- Status indicator
- Total mismatch dialog

#### C. Hook Tests (25 files)

Custom React hooks covering state management and business logic:

| Hook | Purpose | Key Tests |
|------|---------|-----------|
| `useBatchCapture` | Receipt capture orchestration | Capture flow, queue management |
| `useBatchProcessing` | Parallel receipt processing | Concurrency, error handling |
| `useBatchReview` | Review workflow | Navigation, approval/reject |
| `useBatchSession` | Session state | Start/end session, persistence |
| `useCategoryStatistics` | Category stats calculation | Min/max/avg/median |
| `useChangeDetection` | Data change tracking | Dirty state, reset |
| `useCountUp` | Animated number counting | Animation timing, formatting |
| `useDerivedItems` | Computed item properties | Filtering, sorting |
| `useInsightProfile` | User insight preferences | Profile loading, updates |
| `useIsForeignLocation` | Location detection | Country detection, foreign check |
| `useItems` | Item CRUD operations | Add/edit/delete items |
| `useLearningPhases` | User learning phase | Phase transitions |
| `usePaginatedTransactions` | Transaction pagination | Page loading, infinite scroll |
| `usePersonalRecords` | Personal records tracking | Record detection, history |
| `usePolygonMode` | Polygon view mode | Mode switching |
| `useReducedMotion` | Accessibility preference | System preference detection |
| `useScanOverlayState` | Scan overlay UI | Show/hide states |
| `useScanState` | Scan workflow state | State machine |
| `useScanStateBridge` | State bridging | Context integration |
| `useScanStateMachine` | Full state machine | All transitions |
| `useSelectionMode` | Multi-select mode | Selection state |
| `useStaggeredReveal` | Animation timing | Reveal sequence |
| `useSwipeNavigation` | Gesture navigation | Swipe detection |
| `useTrustedMerchants` | Trusted merchant list | Trust operations |
| `useUserCredits` | Credit system | Balance, transactions |

#### D. Service Tests (13 files)

Business logic and external service integrations:

| Service | Purpose | Key Tests |
|---------|---------|-----------|
| `airlockService` | AI/ML processing queue | Queue management, timeouts |
| `batchProcessingService` | Batch orchestration | Parallel processing, errors |
| `creditService` | Credit management | Reserve/confirm/refund |
| `firestore.getTransactionPage` | Pagination | Query building, cursors |
| `gemini` | Google Gemini API | API calls, response parsing |
| `insightEngineService` | Insight generation | Generator execution |
| `insightProfileService` | Profile management | CRUD operations |
| `itemDuplicateDetectionService` | Duplicate detection | Algorithm accuracy |
| `locationService` | Location resolution | Geocoding, address parsing |
| `merchantTrustService` | Trust ratings | Trust calculation |
| `pendingScanStorage` | Local storage | Persistence, recovery |
| `recordsService` | Personal records | Record calculation |
| `transactionQuery` | Query building | Filter construction |

#### E. Utility Tests (23 files)

Pure function tests for data transformation and formatting:

| Utility | Purpose | Key Tests |
|---------|---------|-----------|
| `analyticsToHistoryFilters` | Filter conversion | State mapping |
| `categoryEmoji` | Emoji mapping | All categories |
| `categoryTranslations` | i18n translations | Spanish/English |
| `celebrationSounds` | Sound effects | Sound loading |
| `chartDataComputation` | Chart data prep | Aggregations |
| `confetti` | Confetti animation | Particle generation |
| `confidenceCheck` | Confidence scoring | Score calculation |
| `countryFlags` | Flag rendering | All countries |
| `currency` | Currency formatting | CLP, USD, EUR, etc. |
| `haptic` | Vibration patterns | Pattern validation |
| `historyFilterUtils.drillDown` | Drill-down filters | Filter logic |
| `historyFilterUtils.group` | Transaction grouping | Group logic |
| `historyFilterUtils.location` | Location filtering | Location matching |
| `insightGenerators` | Insight algorithms | 12+ generators |
| `insightTypeConfig` | Type configuration | Config validation |
| `periodComparison` | Period analysis | MoM, YoY |
| `reportUtils` | Report generation | PDF/CSV generation |
| `sankeyDataBuilder` | Sankey diagrams | Flow calculation |
| `semanticColors` | Color system | Theme colors |
| `statisticsUtils` | Statistics | Median, average |
| `temporalNavigation` | Date navigation | Period calculation |
| `totalValidation` | Total checking | Validation rules |
| `treemapLayout` | Treemap layout | Layout algorithm |

---

## Integration Tests

**Location:** `tests/integration/`
**Files:** 25 test files
**Tests:** ~200
**Framework:** Vitest + Firebase Emulators

### Test Categories

#### A. Analytics Workflows (7 files)

End-to-end analytics testing with real Firestore data:

| File | Purpose |
|------|---------|
| `analytics.test.tsx` | Monthly totals, category breakdown, date filtering |
| `analytics-workflows.test.tsx` | Complex multi-step workflows |
| `analytics/categoryBreadcrumb.test.tsx` | Category drill-down navigation |
| `analytics/chartModeToggle.test.tsx` | Chart mode switching integration |
| `analytics/drillDown.test.tsx` | Full drill-down functionality |
| `analytics/temporalBreadcrumb.test.tsx` | Temporal navigation integration |
| `analytics/trendsViewIntegration.test.tsx` | Full TrendsView integration |

#### B. Data Operations (8 files)

CRUD and data management:

| File | Purpose |
|------|---------|
| `crud-operations.test.tsx` | Transaction create/read/update/delete |
| `batch-processing.test.tsx` | Batch receipt processing |
| `cascade-delete.test.tsx` | Cascade delete on removal |
| `data-isolation.test.ts` | Multi-user data isolation |
| `data-persistence.test.tsx` | Persistence across sessions |
| `image-storage.test.tsx` | Image upload/retrieval |
| `trends-export.test.tsx` | Data export functionality |
| `settings-export.test.tsx` | Settings export/import |

#### C. Category System (3 files)

Category learning and mapping:

| File | Purpose |
|------|---------|
| `category-apply.test.tsx` | Apply categories to transactions |
| `category-learning.test.tsx` | ML-based category suggestions |
| `category-mappings.test.tsx` | Store-to-category mappings |

#### D. Security (2 files)

Firebase security rules validation:

| File | Purpose |
|------|---------|
| `firestore-rules.test.ts` | Firestore security rules |
| `storage-rules.test.ts` | Storage security rules |

**What Security Rules Tests Cover:**
- User can only access their own data (`request.auth.uid == userId`)
- Cross-user access is blocked
- Unauthenticated access is blocked
- Write validation rules
- Field-level security

#### E. Services & Auth (3 files)

| File | Purpose |
|------|---------|
| `auth-flow.test.tsx` | Login/logout workflows |
| `categoryMappingService.test.ts` | Category mapping service |
| `merchantMappingService.test.ts` | Merchant mapping service |

---

## E2E Tests

**Location:** `tests/e2e/`
**Files:** 7 spec files
**Tests:** ~50
**Framework:** Playwright + Firebase Emulators

### User Journeys Covered

| Spec File | Journey | Priority |
|-----------|---------|----------|
| `auth-workflow.spec.ts` | Login → Use App → Logout | P0 |
| `transaction-management.spec.ts` | Create → Edit → Delete → Filter | P0 |
| `category-mappings.spec.ts` | Create → Apply → Verify | P1 |
| `image-viewer.spec.ts` | Upload → View → Rotate → Delete | P1 |
| `trends-export.spec.ts` | Filter → Export → Download | P2 |
| `accessibility.spec.ts` | Keyboard nav → Screen reader → WCAG | P1 |
| `lighthouse.spec.ts` | Performance → PWA → Best Practices | P2 |

### Detailed Test Coverage

#### Authentication Workflow
- Login screen renders for unauthenticated users
- App branding displays correctly
- Sign-in button is interactive
- Navigation to authenticated views
- Logout returns to login screen
- Session persistence

#### Transaction Management
- Create new transaction
- Edit existing transaction
- Delete transaction
- Filter by date range
- Filter by category
- Search by merchant
- Bulk operations

#### Accessibility
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast (4.5:1 minimum)
- Focus management
- ARIA attributes

#### Performance (Lighthouse)
- Performance score > 80
- Core Web Vitals (LCP, FID, CLS)
- PWA requirements
- Best practices
- SEO basics

---

## Prompt Tests

**Locations:** 3 separate test files
**Total Tests:** 134
**Purpose:** AI prompt validation and versioning

### A. Shared Prompts (`shared/prompts/__tests__/index.test.ts`)

**Tests:** 62
**Purpose:** Core prompt library for production use

| Test Group | Tests | Purpose |
|------------|-------|---------|
| ACTIVE_PROMPT | 5 | Current production prompt |
| PROMPT_V1 | 10 | Legacy single-currency prompt |
| getPrompt() | 5 | Prompt retrieval |
| listPrompts() | 4 | Prompt listing |
| replacePromptVariables() | 5 | Variable substitution |
| Category constants | 5 | Category validation (13 store, 9 item) |
| PROMPT_V2 | 13 | Multi-currency prompt |
| getCurrencyContext() | 7 | Currency context building |
| getReceiptTypeDescription() | 7 | Receipt type descriptions |
| buildCompleteV2Prompt() | 9 | Complete prompt building |
| Prompt Registry | 3 | Registry operations |

### B. Prompt Testing Suite (`prompt-testing/prompts/__tests__/index.test.ts`)

**Tests:** 72
**Purpose:** Extended testing for V3 prompt with expanded categories

| Test Group | Tests | Purpose |
|------------|-------|---------|
| PROMPT_V3 | 15 | Category auto-detection |
| Extended categories | 10 | 36 store, 39 item categories |
| Template system | 12 | Variable replacement |
| Versioning | 8 | V1→V2→V3 compatibility |
| buildPrompt() | 15 | Complete prompt generation |
| Currency handling | 12 | Multi-currency support |

### C. Functions Prompts (`functions/src/prompts/__tests__/index.test.ts`)

**Status:** SKIPPED
**Reason:** Vitest module resolution cannot resolve `../shared/schema/categories` from the functions directory
**Coverage:** Effectively covered by A and B above (same code)

---

## Cloud Function Tests

**Location:** `functions/src/__tests__/`
**Files:** 2
**Purpose:** Firebase Cloud Function validation

### A. analyzeReceipt.test.ts

Tests the main receipt analysis Cloud Function:

| Test Category | Purpose |
|---------------|---------|
| Authentication | Rejects unauthenticated requests |
| Input validation | Validates image format, size |
| Gemini API integration | Tests API call structure |
| Response parsing | JSON structure validation |
| Merchant extraction | Merchant name extraction |
| Item extraction | Line item parsing |
| Total calculation | Total validation |
| Category assignment | Category inference |
| Error handling | API errors, timeouts |
| Rate limiting | Request throttling |

### B. imageProcessing.test.ts

Tests image preprocessing utilities:

| Test Category | Purpose |
|---------------|---------|
| Compression | Image size reduction |
| Format validation | JPG, PNG, WebP support |
| Size validation | Max file size enforcement |
| Metadata extraction | EXIF data handling |
| OCR preprocessing | Image enhancement for OCR |
| Rotation handling | Auto-rotation based on EXIF |
| Quality optimization | Quality/size tradeoff |

---

## Security Tests

### Static Analysis (`eslint.config.security.mjs`)

**Command:** `npm run security:lint`

| Rule | Severity | Purpose |
|------|----------|---------|
| `detect-eval-with-expression` | ERROR | Blocks dangerous eval() |
| `detect-unsafe-regex` | ERROR | Prevents ReDoS attacks |
| `detect-buffer-noassert` | ERROR | Blocks unsafe buffer ops |
| `detect-object-injection` | WARN | Warns on obj[var] patterns |
| `detect-non-literal-regexp` | WARN | Dynamic regex warning |
| `detect-non-literal-require` | WARN | Dynamic require warning |
| `detect-non-literal-fs-filename` | WARN | Dynamic file path warning |
| `detect-possible-timing-attacks` | WARN | Timing attack detection |
| `detect-bidi-characters` | WARN | Unicode bidi attack |
| `detect-pseudoRandomBytes` | WARN | Weak random warning |
| `detect-child-process` | WARN | Child process warning |

### Dependency Audit

**Command:** `npm audit --audit-level=high --omit=dev`

Scans production dependencies for known vulnerabilities. Dev dependencies are excluded (known issues in transitive packages are acceptable for dev-only tools).

---

## Test Infrastructure

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.unit.ts` | Local unit test config (parallel, fast) |
| `vitest.config.ci.ts` | CI config (forks, memory-safe) |
| `playwright.config.ts` | E2E test config |
| `tests/setup/vitest.setup.ts` | Test initialization |
| `tests/setup/test-utils.tsx` | React Testing Library utilities |
| `tests/setup/firebase-emulator.ts` | Emulator setup |

### Vitest CI Configuration

```typescript
// vitest.config.ci.ts - Optimized for GitHub Actions
{
  pool: 'forks',           // Process isolation
  maxForks: 2,             // Memory limit
  maxConcurrency: 2,       // Parallel limit
  isolate: true,           // Full isolation
  reporters: ['default'],  // Reduced output
}
```

### Playwright Configuration

```typescript
// playwright.config.ts
{
  testDir: 'tests/e2e',
  baseURL: 'http://localhost:5174',
  browser: 'chromium',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
}
```

---

## Coverage by Feature Area

| Feature Area | Unit | Integration | E2E | Total Coverage |
|--------------|------|-------------|-----|----------------|
| **Authentication** | 1 | 1 | 1 | HIGH |
| **Batch Processing** | 6 | 1 | 0 | HIGH |
| **Category System** | 3 | 3 | 1 | HIGH |
| **Analytics/Trends** | 12 | 7 | 0 | HIGH |
| **Scanning/Receipt** | 8 | 0 | 1 | MEDIUM |
| **Insights Engine** | 17 | 0 | 0 | HIGH |
| **Transactions** | 10+ | 2 | 1 | HIGH |
| **Merchant Mapping** | 2 | 2 | 1 | HIGH |
| **Reports** | 2 | 1 | 1 | MEDIUM |
| **Animations** | 7 | 0 | 0 | HIGH |
| **Accessibility** | 1 | 0 | 1 | MEDIUM |
| **Utilities** | 23 | 0 | 0 | HIGH |
| **Cloud Functions** | 2 | 0 | 0 | MEDIUM |
| **Prompts** | 134 | 0 | 0 | HIGH |

---

## CI/CD Pipeline

### Pipeline Structure

```
gitleaks (parallel) ────────────────────────────────────────┐
setup ─┬─► test-unit-1 ─────────┬                           │
       ├─► test-unit-2 ─────────┼─► test-unit ─┬─► test ────┴─► deploy
       ├─► test-unit-3 ─────────┤              │
       ├─► test-coverage (PR only, non-blocking)
       ├─► test-integration ───────────────────┤
       ├─► test-e2e ───────────────────────────┤
       ├─► security ───────────────────────────┘
       └─► lighthouse (main push only)
```

### Job Timing Targets

| Job | Target | Max Allowed |
|-----|--------|-------------|
| gitleaks | ~10s | 5 min |
| setup | ~2 min | 10 min |
| test-unit (per shard) | ~3-5 min | 15 min |
| test-integration | ~1.5 min | 10 min |
| test-e2e | ~2.5 min | 15 min |
| security | ~2 min | 10 min |
| **Total Pipeline** | **~8 min** | **20 min** |

### Test Commands

```bash
# Local development
npm run test                    # Watch mode
npm run test:unit               # Unit tests only
npm run test:unit:parallel      # Parallel unit tests
npm run test:integration        # Integration tests
npm run test:e2e                # E2E tests
npm run security:lint           # Security linting

# CI-specific
npm run test:coverage           # With coverage report
npm run test:all                # Full suite
```

---

## Known Issues & Technical Debt

### Current Issues

| Issue | Impact | Status |
|-------|--------|--------|
| Shard 2 timeout | CI failures | **Sub-story 14.30.2 created** |
| Coverage job redundant | +14 min CI time | **Sub-story 14.30.1 created** |
| Memory accumulation | Flaky tests | Mitigated with forks |
| Firebase emulator restart per job | ~30s × 6 jobs | **Sub-story 14.30.4 created** |

### Technical Debt Items

1. **Prompt test consolidation** - 3 locations should be unified → **Sub-story 14.30.5**
2. **Functions module resolution** - Skipped test file
3. **E2E coverage gaps** - Analytics, insights not covered
4. **Unit test isolation** - Some tests require emulator → **Sub-story 14.30.4**

### Optimization Plan (2026-01-14)

See [Story 14.30 Sub-Stories](../sprint-artifacts/epic14/stories/story-14.30-substories.md) for detailed implementation plan.

| Sub-Story | Action | Time Savings | Priority |
|-----------|--------|--------------|----------|
| 14.30.1 | Remove coverage redundancy | 10-14 min | P0 |
| 14.30.2 | Rebalance to 5 shards | 5-7 min | P0 |
| 14.30.3 | Bun package installation | 30-60s | P1 |
| 14.30.4 | Split pure vs Firebase tests | 2-3 min | P2 |
| 14.30.5 | Prompt test consolidation | Maintenance | P3 |

**Target:** Reduce CI from ~20 min to ~6-8 min (50-60% reduction)

---

## Appendix: Test File Inventory

### Unit Test Files (170 total)

<details>
<summary>Click to expand full file list</summary>

**Root (11 files):**
- analyticsReducer.test.tsx
- categoryMatcher.test.ts
- categoryTranslations.test.ts
- csvExport.test.ts
- date.test.ts
- duplicateDetection.test.ts
- merchantMappingService.test.ts
- merchantMatcherService.test.ts
- smoke.test.ts
- subscription.test.ts
- transactionNormalizer.test.ts

**Analytics (12 files):**
- CategoryBreadcrumb.test.tsx
- ChartModeToggle.test.tsx
- DrillDownCard.test.tsx
- DrillDownGrid.test.tsx
- DrillDownModeToggle.test.tsx
- FloatingDownloadFab.test.tsx
- TemporalBreadcrumb.test.tsx
- TotalDisplay.test.tsx
- analyticsReducer.test.tsx
- chartModeRegistry.test.ts
- useAnalyticsNavigation.test.tsx
- validateNavigationState.test.ts

**Components (73 files):** [See detailed breakdown above]

**Config (2 files):**
- categoryColors.test.ts
- fabColors.test.ts

**Contexts (1 file):**
- ScanContext.test.tsx

**Hooks (25 files):** [See detailed breakdown above]

**Lib (1 file):**
- queryKeys.test.ts

**Services (13 files):** [See detailed breakdown above]

**Types (2 files):**
- transactionGroup.test.ts
- trust.test.ts

**Utils (23 files):** [See detailed breakdown above]

**Views (6 files):**
- BatchCaptureView.test.tsx
- BatchReviewView.test.tsx
- DashboardView.test.tsx
- InsightsView.test.tsx
- StatementScanView.test.tsx
- TrendsView.polygon.test.tsx

</details>

### Integration Test Files (25 total)

<details>
<summary>Click to expand full file list</summary>

- analytics.test.tsx
- analytics-workflows.test.tsx
- analytics/categoryBreadcrumb.test.tsx
- analytics/chartModeToggle.test.tsx
- analytics/drillDown.test.tsx
- analytics/temporalBreadcrumb.test.tsx
- analytics/trendsViewIntegration.test.tsx
- auth-flow.test.tsx
- batch-processing.test.tsx
- cascade-delete.test.tsx
- category-apply.test.tsx
- category-learning.test.tsx
- category-mappings.test.tsx
- categoryMappingService.test.ts
- crud-operations.test.tsx
- data-isolation.test.ts
- data-persistence.test.tsx
- firestore-rules.test.ts
- form-validation.test.tsx
- image-storage.test.tsx
- merchantMappingService.test.ts
- settings-export.test.tsx
- smoke.test.tsx
- storage-rules.test.ts
- trends-export.test.tsx

</details>

### E2E Test Files (7 total)

- accessibility.spec.ts
- auth-workflow.spec.ts
- category-mappings.spec.ts
- image-viewer.spec.ts
- lighthouse.spec.ts
- transaction-management.spec.ts
- trends-export.spec.ts

---

*Document generated by Atlas - Project Intelligence Guardian*
*For questions or updates, consult the development team*
