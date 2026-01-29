# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2026-01-25
> Last Optimized: 2026-01-24 (Generation 5)
> Sources: sprint-status.yaml, epics.md, PRD documents

## Core Features (Implemented)

| Feature | Purpose | Epic |
|---------|---------|------|
| Receipt Scanning | AI-powered OCR extracts transaction data | Epic 1 |
| Transaction Management | CRUD operations for transactions | Epic 1 |
| Category System | Hierarchical: Store Category → Item Group → Subcategory | Epic 9 |
| Smart Category Learning | Auto-applies learned preferences on future scans | Epic 6 |
| Merchant Learning | Fuzzy matching for merchant suggestions | Epic 9 |
| Analytics Dashboard | Dual-axis navigation (temporal + category) | Epic 7 |
| History Filters | Filter by time, category, location, groups | Epic 9, 14 |
| Data Export | CSV export for transactions and aggregated items | Epic 5, 14 |
| PWA Installation | Add to Home Screen, push notifications | Epic 9 |
| Theme System | Light/Dark modes, Normal/Professional/Mono themes | Epic 7, 14 |
| Insight Engine | 12 generators, phase-based selection | Epic 10 |
| Quick Save | 85% confidence threshold, weighted scoring | Epic 11 |
| Trust Merchant | Auto-categorization for trusted merchants | Epic 11 |
| Batch Processing | Multi-receipt capture, parallel API calls | Epic 12 |
| **Household Sharing** | Multi-user groups with transaction tagging | Epic 14c |

## Completed Epics Summary

| Epic | Stories | Deployed | Key Deliverables |
|------|---------|----------|------------------|
| Epic 10 | 9 | 2025-12-19 | InsightEngine, 12 generators, ADRs 015-017 |
| Epic 10a | 5 | 2025-12-21 | Home+History merged, Insights tab |
| Epic 11 | 7 | 2025-12-22 | QuickSaveCard, trust merchants, PWA viewport |
| Epic 12 | 6 | 2025-12-23 | Batch capture, parallel processing, 2799 tests |
| Epic 13 | 15 | 2025-12-31 | 10 HTML mockups, design system, motion system |
| **Epic 14** | **50+** | **2026-01-15** | Animation, polygon, analytics, React Query |
| **Epic 14d** | **11** | **2026-01-12** | Scan state machine, navigation blocking |

---

## Epic 14c-refactor: Codebase Cleanup (✅ COMPLETE)

**Status:** ✅ COMPLETE (36 stories) | **Points:** ~110 | **Deployed:** 2026-01-24

### Epic Context
Epic 14c (original Household Sharing) was **REVERTED** on 2026-01-20. This epic cleaned the codebase.

### Key Deliverables
- App.tsx reduced: 4,800 → 3,850 lines (~20% reduction)
- 11 handler hooks extracted (`src/hooks/app/`)
- ViewHandlersContext for prop-drilling elimination
- Service/hook stubs for reverted features
- Test suite: 5,759+ tests maintained

### Patterns Established
- **Handler extraction:** Props-based injection, `useCallback` stability
- **View migration:** ViewHandlersContext incremental adoption
- **Story sizing:** Max 4 tasks, 15 subtasks, 8 files per story

**Spec:** `docs/sprint-artifacts/epic14c-refactor/`

---

## Epic 14d: Scan Architecture Refactor (COMPLETE)

**Status:** 11/11 stories done (2026-01-12) | **Points:** ~45

### Key Deliverables
- State machine hook (`useScanStateMachine`)
- ScanContext provider (single source of truth)
- Hybrid navigation blocking
- Mode selector popup (long-press FAB)
- FAB visual states (phase-based colors)
- Unified persistence (no expiration)

### Key Decisions (ADR-020)
| Decision | Choice |
|----------|--------|
| Request Precedence | Active request blocks ALL new requests |
| Persistence | No expiration, survives logout/app close |
| Batch State | ScanContext owns all (no dual-sync) |

**Spec:** `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

---

## Future Roadmap (Epics 15-18)

| Epic | Name | Focus | Status |
|------|------|-------|--------|
| 14E | Codebase Refactoring | Bundle optimization, modularization | Planning |
| 14F | Invite-Only Access | Controlled beta rollout | Planning |
| 15 | Advanced Features | Goals/GPS, learned thresholds | Backlog |
| 16 | Onboarding | <60 second time-to-value | Backlog |
| 17 | Tags & Grouping | User-defined tags for project/trip tracking | Backlog |
| 18 | Achievements | Ethical gamification, milestones | Backlog |

---

## Feature Dependencies

### Scan Flow
```
Camera → Gemini OCR → Merchant Mapping → Category Mapping → EditView → Save
```

### Learning System
```
User Edit → Learning Prompt → Mapping Saved → Future Scans Auto-Apply
```

### Analytics
```
Transactions → FilteringService → AnalyticsContext → Charts → Drill-down
```

### Household Sharing (Epic 14c - REVERTED)
```
Create Group → Share Code → Accept Invite → View Mode Switch → Merged Feed
```
> Note: Epic 14c was reverted. Redesigned in Epic 14d-v2.

---

## Epic 14d-v2: Shared Groups v2 (BACKLOG)

**Status:** 11/41 stories ready | **Points:** ~138 total | **Blocked by:** Epic 14e

### Epic Context
Rebuild shared groups with lessons learned from Epic 14c failure:
- Single `sharedGroupId` (not array) - eliminates `array-contains` limitations
- Changelog-driven sync - explicit removal events
- Double-gate privacy model - group + user opt-in
- Manual sync buttons - no complex auto-sync

### Ready Stories Summary

| Story | Description | Points |
|-------|-------------|--------|
| 1.2 | Transaction Type Migration | 2 |
| 1.3 | Changelog Infrastructure | 3 |
| 1.4 | Create Shared Group | 3 |
| 1.5 | Invite Members | 3 |
| 1.6 | Accept/Decline Invitation | 3 |
| 1.8 | Cloud Function Changelog Writer | 5 |
| 1.10 | View Mode Switcher | 2 |
| 1.11 | Transaction Sharing Toggle (Group) | 3 |
| 1.12 | User Transaction Sharing Preference | 3 |
| 1.13 | User Group Preferences Document | 2 |
| 1.14 | Join Flow Opt-In | 2 |

**Spec:** `docs/sprint-artifacts/epic14d-shared-groups-v2/`

---

## Epic 14e: Feature-Based Architecture (🔄 IN PROGRESS)

**Status:** 21/32 stories ready | **Points:** ~86 total | **Started:** 2026-01-24

### Epic Context
Transform monolithic App.tsx (~3,850 lines) into feature-based architecture:
- Feature Slicing: Organize by feature domain (scan, batch-review, categories, credit)
- Zustand Stores: Centralized client state (per ADR-018 - no XState)
- Modal Manager: Single point for all modal rendering

### Part 1: Modal Manager (✅ COMPLETE - 6 stories, 14 pts)

| Story | Description | Points | Status |
|-------|-------------|--------|--------|
| 14e-0 | Delete Bridge Dead Code | 1 | ✅ |
| 14e-1 | Directory Structure & Zustand Setup | 2 | ✅ |
| 14e-2 | Modal Manager Zustand Store | 3 | ✅ |
| 14e-3 | Modal Manager Component | 2 | ✅ |
| 14e-4 | Migrate Simple Modals | 3 | ✅ |
| 14e-5 | Migrate Complex Modals | 3 | ✅ |

### Part 2-5: Scan Feature & App Shell (IN PROGRESS)

| Story | Description | Points | Risk |
|-------|-------------|--------|------|
| 14e-6 | Scan Zustand Store Definition | 5 | CRITICAL |
| 14e-8 | Extract processScan Handler | 5 | CRITICAL |
| 14e-10 | Scan Feature Orchestrator | 3 | HIGH |
| 14e-11 | ScanContext Migration & Cleanup | 2 | LOW |
| 14e-12a | Batch Review Store Foundation | 2 | LOW |
| 14e-12b | Batch Review Store Actions & Tests | 2 | LOW |
| 14e-13 | Batch Review Store Selectors | 2 | LOW |
| 14e-14a | Batch Handler Types + Navigation | 2 | LOW |
| 14e-14b | Batch Handler Edit + Save | 2 | LOW |
| 14e-14c | Batch Handler Discard + Credit | 2 | LOW |
| 14e-14d | Batch Handler App.tsx Integration | 2 | LOW |
| 14e-15 | Batch Review Feature Components | 3 | LOW |
| 14e-16 | Batch Review Feature Orchestrator | 5 | MEDIUM |
| 14e-17 | Categories Feature Extraction | 3 | LOW |
| 14e-18a | Credit State Hook | 2 | LOW |
| 14e-18b | Credit Handlers | 2 | LOW |
| 14e-18c | Credit Feature Integration | 3 | LOW |

### Story Created - 14e-16-batch-review-feature-orchestrator (2026-01-25)

**Summary:** BatchReviewFeature orchestrator component - renders phase-appropriate UI from Zustand store

**User Value:** Single entry point for all batch review functionality in App.tsx, ~400-500 lines reduced

**Workflow Touchpoints:**
- Workflow #3 (Batch Processing): DIRECT - orchestrates full batch review phase UI
- Workflow #9 (Scan Lifecycle): INDIRECT - batch review is sub-phase of scan
- Workflow #1 (Scan Receipt): DOWNSTREAM - single scans may feed into batch context

**Dependencies:** 14e-12a/b (store), 14e-13 (selectors), 14e-14a-d (handlers), 14e-15 (components)

**Phase-based Rendering:**
- `idle` → null (not visible)
- `processing` → ProcessingState
- `reviewing/editing/saving` → ReviewingState
- `complete` → SuccessState
- `error` → ErrorState

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-16-batch-review-feature-orchestrator.md`

### Story Created - 14e-15-batch-review-feature-components (2026-01-25)

**Summary:** Migrate batch review components to feature module with Zustand integration

**User Value:** Batch UI colocated with batch logic, centralized state via useBatchReviewStore()

**Workflow Touchpoints:**
- Workflow #3 (Batch Processing): DIRECT - components render batch processing results
- Workflow #9 (Scan Lifecycle): INDIRECT - batch review is sub-phase of scan

**Components Migrated:**
- `BatchSummaryCard.tsx` → `BatchReviewCard.tsx` (renamed for clarity)
- NEW: `BatchProgressIndicator.tsx` (extracted from BatchReviewView)
- NEW: `states/ReviewingState.tsx`, `ProcessingState.tsx`, `EmptyState.tsx`

**Target Structure:**
```
src/features/batch-review/components/
  BatchReviewCard.tsx
  BatchProgressIndicator.tsx
  BatchHeader.tsx
  states/
    ReviewingState.tsx
    ProcessingState.tsx
    EmptyState.tsx
```

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-15-batch-review-feature-components.md`

### Story Created - 14e-12a/b (Split) - Batch Review Zustand Store (2026-01-25)

**Summary:** Batch Review Zustand Store - centralized state management for batch review flow

**User Value:** Predictable batch review state with phase-based guards, consistent with scan store pattern

**Split Details:**
- **14e-12a** (2 pts): Store foundation + lifecycle/item actions
- **14e-12b** (2 pts): Save/edit actions + phase guards + tests
- **Reason:** Original story exceeded sizing limits (7 tasks, 27 subtasks)

**Workflow Touchpoints:**
- Workflow #3 (Batch Processing): DIRECT - manages batch review phase state
- Workflow #9 (Scan Lifecycle): INDIRECT - batch review is sub-phase of scan
- Workflow #1 (Scan Receipt): DOWNSTREAM - batch mode feeds into review

**Store Phases:** idle → loading → reviewing ↔ editing → saving → complete/error

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-12a-*.md, 14e-12b-*.md`

### Story Created - 14e-11-scancontext-migration-cleanup (2026-01-25)

**Summary:** Delete legacy ScanContext and useScanStateMachine after Zustand migration

**User Value:** Single source of truth for scan state, eliminates "2.5 paradigms" problem

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): Legacy cleanup - no new impact
- Workflow #2 (Quick Save): Legacy cleanup - no new impact
- Workflow #3 (Batch Processing): Legacy cleanup - no new impact
- Workflow #9 (Scan Lifecycle): Legacy cleanup - no new impact

**Files Deleted:**
- `src/contexts/ScanContext.tsx` (~680 lines)
- `src/hooks/useScanStateMachine.ts` (~898 lines)

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-11-scancontext-migration-cleanup.md`

### Story Created - 14e-17-categories-feature-extraction (2026-01-25)

**Summary:** Extract category management to feature module - wraps existing hooks, extracts handlers

**User Value:** Category logic colocated and isolated, App.tsx simplified by ~30-50 lines

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): Uses `applyCategoryMappings` - verify unchanged after extraction
- Workflow #5 (Learning Flow): Category mappings save/retrieve via `useCategoryMappings`
- Workflow #4 (Analytics Navigation): Category drill-down depends on categorization
- Workflow #6 (History Filter Flow): Category filtering in IconFilterBar

**Feature Structure:**
```
src/features/categories/
  index.ts                    # Public API
  CategoriesFeature.tsx       # Orchestrator (headless)
  state/useCategoriesState.ts # Wraps existing hooks
  handlers/categoryHandlers.ts
```

**Key Pattern:** Wrapper hooks (not replacement) - maintains backward compatibility

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-17-categories-feature-extraction.md`

### Story Created - 14e-18a/b/c (Split) - Credit Feature Extraction (2026-01-25)

**Summary:** Extract credit/payment functionality to feature module - wraps useUserCredits, extracts handlers

**User Value:** Credit logic colocated and isolated, App.tsx simplified by ~50-80 lines

**Split Details:**
- **14e-18a** (2 pts): Feature structure + useCreditState hook
- **14e-18b** (2 pts): Credit handlers extraction (warning dialog handlers)
- **14e-18c** (3 pts): CreditFeature orchestrator + App.tsx integration
- **Reason:** Original story exceeded sizing limits (6 tasks, 36 subtasks)

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): DIRECT - Credit check before scan, deduct on start
- Workflow #3 (Batch Processing): DIRECT - Super credit check and warning dialog
- Workflow #9 (Scan Lifecycle): DIRECT - Credit reserve/confirm/refund pattern
- Workflow #2 (Quick Save): INDIRECT - Uses credit state for UI display

**Feature Structure:**
```
src/features/credit/
  index.ts                    # Public API
  CreditFeature.tsx           # Orchestrator (renders CreditWarningDialog)
  state/useCreditState.ts     # Wraps useUserCredits hook
  handlers/creditHandlers.ts  # Warning dialog handlers
```

**Key Pattern:** Wrapper hooks (not replacement) - maintains backward compatibility

**Dependencies:**
- 14e-18a: Depends on 14e-1 (directory structure)
- 14e-18b: Depends on 14e-18a
- 14e-18c: Depends on 14e-18a, 14e-18b

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-18a-credit-state-hook.md`, `14e-18b-credit-handlers.md`, `14e-18c-credit-feature-integration.md`

### Story Created - 14e-19-transactions-feature-foundation (2026-01-25)

**Summary:** Transaction Entity Foundation - organize transaction-related code as FSD entity module

**User Value:** Centralized transaction API via `@entities/transaction`, clear separation of domain objects from features

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): Uses Transaction type for creation
- Workflow #3 (Batch Processing): Uses Transaction type for batch creation
- Workflow #4 (Analytics Navigation): Uses `useAnalyticsTransactions` hook
- Workflow #5 (Learning Flow): Modifies transactions via type
- Workflow #6 (History Filter): Uses `useTransactions` hook
- Workflow #9 (Scan Lifecycle): Transaction save is end goal

**Risk:** LOW (re-organization via re-exports, no functional changes)

**Entity Structure:**
```
src/entities/transaction/
├── index.ts        # Public API (barrel export)
├── types.ts        # Re-exports from src/types/transaction.ts
├── hooks/index.ts  # Re-exports transaction hooks
└── utils/index.ts  # Re-exports transaction utilities
```

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-19-transactions-feature-foundation.md`

### Story Created - 14e-20a/b (Split) - Remaining UI State Extraction (2026-01-25)

**Summary:** Extract remaining UI state (toast + settings) from App.tsx to shared hooks/stores

**User Value:** App.tsx contains minimal local state, UI concerns properly organized

**Split Details:**
- **14e-20a** (2 pts): Toast hook extraction - useToast.ts with auto-dismiss
- **14e-20b** (2 pts): Settings store extraction - Zustand store with localStorage persist
- **Reason:** Original story exceeded sizing limits (4 tasks, 23 subtasks)

**Workflow Touchpoints:**
- Workflow #1-3, #5 (Scan, Quick Save, Batch, Learning): Use toast notifications
- All Views: Use settings for theme, font size, etc.
- Risk: LOW (pure refactor, no behavior change)

**Files Created:**
- `src/shared/hooks/useToast.ts` - Toast state + auto-dismiss
- `src/shared/stores/useSettingsStore.ts` - Settings with Zustand persist

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-20a-toast-hook-extraction.md`, `14e-20b-settings-store-extraction.md`

### Story Created - 14e-14a/b/c/d (Split) - Extract Batch Review Handlers (2026-01-25)

**Summary:** Extract batch review handlers from App.tsx to feature handlers

**User Value:** Batch logic colocated with batch state, App.tsx simplified by ~100-150 lines

**Split Details:**
- **14e-14a** (2 pts): Handler directory + context types + navigation handlers
- **14e-14b** (2 pts): Edit handler + save handlers
- **14e-14c** (2 pts): Discard handlers + credit check handler
- **14e-14d** (2 pts): App.tsx integration + verification
- **Reason:** Original story exceeded sizing limits (7 tasks, 30 subtasks)

**Workflow Touchpoints:**
- Workflow #3 (Batch Processing): DIRECT - handlers orchestrate batch review phase
- Workflow #9 (Scan Lifecycle): INDIRECT - batch review is sub-phase of scan
- Workflow #1 (Scan Receipt): DOWNSTREAM - batch mode feeds into review

**Handlers Extracted:**
- `navigateToPreviousReceipt`, `navigateToNextReceipt` (navigation)
- `editBatchReceipt` (edit)
- `saveBatchTransaction`, `handleSaveComplete` (save)
- `handleReviewBack`, `confirmDiscard`, `cancelDiscard` (discard)
- `confirmWithCreditCheck` (credit)

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-14a-*.md, 14e-14b-*.md, 14e-14c-*.md, 14e-14d-*.md`

### Story Created - 14e-21-create-feature-orchestrator (2026-01-25)

**Summary:** FeatureOrchestrator component - central composition of all features into single render tree

**User Value:** App.tsx becomes thin shell, feature visibility managed centrally (~100-200 lines removed)

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): Renders ScanFeature
- Workflow #2 (Quick Save): ScanFeature handles internally
- Workflow #3 (Batch Processing): Renders BatchReviewFeature
- Workflow #9 (Scan Lifecycle): Composes both scan and batch features

**Dependencies:** 14e-10 (ScanFeature), 14e-16 (BatchReviewFeature), 14e-17 (CategoriesFeature), 14e-18c (CreditFeature), 14e-3 (ModalManager)

**Blocks:** 14e-22 (AppProviders), 14e-23 (App.tsx Final Cleanup)

**Risk Assessment:** LOW - Pure composition layer, all logic delegated to features

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-21-create-feature-orchestrator.md`

### Story COMPLETED - 14e-10-scan-feature-orchestrator (2026-01-26)

**Summary:** ScanFeature orchestrator component - renders phase-appropriate UI from Zustand store

**User Value:** Single entry point for all scan functionality in App.tsx

**Implementation:**
- Created `src/features/scan/ScanFeature.tsx` (322 lines)
- Phase-based rendering: idle → capturing → scanning → reviewing → saving → error
- Mode-aware: batch vs single vs statement
- Integrated into App.tsx with existing handlers
- 29 comprehensive tests

**Workflow Touchpoints:**
- Workflow #1 (Scan Receipt): Orchestrates full capture→save flow
- Workflow #2 (Quick Save): Routes high-confidence to QuickSaveCard
- Workflow #3 (Batch Processing): Coordinates batch capture and review
- Workflow #9 (Scan Lifecycle): Integrates with FAB mode selector

**Modal Integration Decision:** Keep scan modals in AppOverlays (Option B)
- Rationale: Existing pattern established, non-breaking

**Remaining Work (14e-11):**
- Full replacement of view-based scan rendering
- ScanContext deletion (~1,578 lines)
- ~800-1000 lines of scan code removal from App.tsx

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-10-scan-feature-orchestrator.md`

### Story Created - 14e-23-app-tsx-final-cleanup (2026-01-25)

**Summary:** Final App.tsx cleanup - reduce from ~3,231 to 500-800 lines via feature extraction completion

**User Value:** Clean app shell architecture with FeatureOrchestrator and AppProviders

**Workflow Touchpoints:**
- Workflow #4 (Analytics Navigation): LOW IMPACT - View routing remains in App.tsx
- Workflow #6 (History Filter): LOW IMPACT - View routing remains in App.tsx
- All other workflows: INDIRECT - Features handle via FeatureOrchestrator

**Dependencies:** 14e-21 (FeatureOrchestrator), 14e-22 (AppProviders), all Part 1-4 stories

**Blocks:** 14e-24 (Documentation)

**Target:** App.tsx 500-800 lines (from ~3,231 lines)

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-23-app-tsx-final-cleanup.md`

### Story Created - 14e-24-documentation-architecture-guide (2026-01-25)

**Summary:** Documentation & Architecture Guide - comprehensive docs for feature-based architecture

**User Value:** Onboarding guide for new developers, architecture pattern reference, prevents drift

**Workflow Touchpoints:**
- NO DIRECT WORKFLOW IMPACT - Documentation story
- Enables future feature development via documented patterns
- Completes Epic 14e as final story

**Key Documentation:**
- Feature creation guide
- Zustand store patterns (ADR-018)
- Modal Manager usage
- State management philosophy

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-24-documentation-architecture-guide.md`

### Story Created - 14e-25b (Split) - TrendsView + DashboardView Migration (2026-01-27)

**Summary:** View-owned data migration for TrendsView and DashboardView - largest analytical views

**User Value:** App.tsx reduced by ~150 lines, views self-contained with no prop drilling

**Workflow Touchpoints:**
- Workflow #4 (Analytics Navigation): DIRECT - TrendsView is entry point, DashboardView is upstream
- Workflow #6 (History Filter): DOWNSTREAM - TrendsView navigates to History with filters

**Split Details:**
- **14e-25b.1** (3 pts): TrendsView migration + useTrendsViewData hook
- **14e-25b.2** (3 pts): DashboardView migration + useDashboardViewData hook

**Pattern:** `useXxxViewData()` composition hook + `__testData` prop for testing

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-25b*.md`

### Story Enhanced - 14e-25d - ViewHandlersContext Deletion (2026-01-28)

**Summary:** ViewHandlersContext Deletion + Final Cleanup - completes feature-based architecture

**User Value:** App.tsx reduced to 500-800 lines (from 3,163), clean orchestration shell

**Workflow Touchpoints:**
- Workflow #4 (Analytics Navigation): LOW IMPACT - Views already migrated
- Workflow #6 (History Filter): LOW IMPACT - Views already migrated
- Workflows #1-3 (Scan): NONE - Not related to ViewHandlers

**Atlas Enhancements Added:**
- AC8: Composition hooks deletion (useXxxViewProps hooks obsolete after views own data)
- AC9: Test file updates (mock internal hooks, not ViewHandlers)

**Prerequisite Chain:** 14e-25a (HistoryView) → 14e-25b (TrendsView+Dashboard) → 14e-25c (Settings+Rest) → **14e-25d (Cleanup)**

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-25d-viewhandlers-deletion-cleanup.md`

### Story Ready - 14e-31-itemsview-data-ownership (2026-01-29)

**Summary:** ItemsView owns data via internal hook - final view migration before ViewHandlersContext deletion

**User Value:** ItemsView self-contained, useItemsViewProps deleted, App.tsx reduced by ~30 lines

**Workflow Touchpoints:**
- Workflow #6 (History Filter Flow): DIRECT - ItemsView is alternate history view for items
- Workflow #4 (Analytics Navigation): DOWNSTREAM - TrendsView drill-down navigates to ItemsView
- Workflow #1 (Scan Receipt Flow): DOWNSTREAM - Saved transactions appear as items

**Pattern:** View-owned data via `useItemsViewData()` hook (same as HistoryView, TrendsView, etc.)

**Key Changes:**
- Create `src/views/ItemsView/useItemsViewData.ts`
- Delete `src/hooks/app/useItemsViewProps.ts`
- Get formatters (t, formatCurrency, formatDate) from internal sources
- Navigation handler uses store directly

**Blocks:** 14e-25d (ViewHandlersContext deletion)

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-31-itemsview-data-ownership.md`

### Key Architecture Decisions
- **ADR-018:** Zustand over XState for simpler state management
- **Modal Manager:** 21 modal types, lazy loading, single render point
- **Scan Store:** Port existing scanReducer (74+ tests), same semantics

**Spec:** `docs/sprint-artifacts/epic14e-feature-architecture/`
