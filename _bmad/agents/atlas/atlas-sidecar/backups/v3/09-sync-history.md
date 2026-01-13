# Sync History

> Section 9 of Atlas Memory
> Tracks all knowledge synchronizations

## Sync Log

> **Generation 2 Optimization (2026-01-07)**: Consolidated pre-2026 entries into epic summaries

### Pre-2026 Sync Summary (Consolidated)

| Period | Epics | Key Patterns Added |
|--------|-------|-------------------|
| 2025-12-18 | Initial sync | All 9 knowledge sections created |
| 2025-12-19-20 | Epic 10, 10a | Insight engine, Home+History merge |
| 2025-12-21-22 | Epic 11 | QuickSave, trust merchants, PWA viewport |
| 2025-12-22-23 | Epic 12 | Batch processing, credit-after-save |
| 2025-12-31 | Epic 13 | 10 HTML mockups, motion design system |

### 2026 Sync Log (Active)

| Date | Section | Notes |
|------|---------|-------|
| 2026-01-04 | 04-architecture | Story 14.15 - Selection Mode & Groups |
| 2026-01-05 | 04-architecture | Story 14.16 - Weekly Reports (71 tests) |
| 2026-01-05 | 02-features | Story 14.16b - Semantic Color System |
| 2026-01-06 | 05-testing | CI/CD optimization, 3,118+ tests |
| 2026-01-06 | ALL | Generation 1 memory optimization (37K → 23K tokens) |
| 2026-01-07 | 04-architecture | V3 Prompt System - 21% token reduction |
| 2026-01-07 | 04-architecture | Story 14.23 - Unified Transaction Editor |
| 2026-01-07 | 04-architecture | Story 14.24 - Persistent Transaction State (hooks created) |
| 2026-01-07 | 04-architecture | Stories 14.25-14.27 - Firestore Cost Optimization |
| 2026-01-07 | 04-architecture | **Story 14.29 - React Query Migration** (COMPLETE) |
| 2026-01-07 | 06-lessons | React Query bugfixes: refs for subscribeFn, initializedRef, JSON comparison |
| 2026-01-07 | ALL | **Generation 2 memory optimization** - consolidated architecture section |
| 2026-01-07 | 04-architecture | **Story 14.28 - App-Level Preferences** - useFirestoreQuery for cache warming |
| 2026-01-07 | 06-lessons | **Story 14.24 - Persistent Transaction State** (CORE COMPLETE) |
| 2026-01-07 | 06-lessons | Credit reserve/confirm/refund pattern, TransactionConflictDialog, localStorage persistence |
| 2026-01-08 | 02-features, 04-architecture | **Story 14.13 - Analytics Explorer Redesign** (session progress) |
| 2026-01-08 | 04-architecture | Squarified treemap algorithm, adaptive cell layouts, font color mode pattern |
| 2026-01-08 | 04-architecture | AnimatedPercent/AnimatedAmount components, CSS scaleXGrow animation |
| 2026-01-08 | 04-architecture | **Live Swipe Animation Pattern** - Month nav + carousel swipe with live feedback |
| 2026-01-08 | docs/development | Created `swipe-animation-pattern.md` - reusable pattern documentation |
| 2026-01-08 | 02-features, 08-workflow-chains | **Epic 14d - Scan Architecture Refactor** design complete |
| 2026-01-08 | docs/epic14d | Created `scan-request-lifecycle.md` - state machine + persistence rules |
| 2026-01-08 | docs/epic14d | Story 14d.7 tech-spec complete - Mode Selector Popup (Style 19) |
| 2026-01-08 | docs/uxui/mockups | Created `scan-mode-selector.html` - 22 popup style variations |
| 2026-01-08 | 02-features | **Story 14.31 - Items History View** session updates |
| 2026-01-08 | src/utils/csvExport.ts | Aggregated items export (`downloadAggregatedItemsCSV`) with translated categories |
| 2026-01-08 | src/components/ProfileDropdown.tsx | "Transacciones" → "Compras/Purchases", CreditCard → Receipt icon |
| 2026-01-08 | src/components/history | Layers → Bookmark icon (IconFilterBar, SelectionBar) - freeing Layers for batch scan |
| 2026-01-08 | 04-architecture | **Story 14d.1 - Scan State Machine Hook** (CODE REVIEW COMPLETE) |
| 2026-01-08 | 04-architecture | Dialog-as-overlay pattern, 6 phases (not 7), `isBlocking` computed value |
| 2026-01-08 | 04-architecture | Removed dead code (isValidTransition), 74 tests passing |
| 2026-01-09 | 04-architecture | **Story 14d.2 - ScanContext Provider** (CODE REVIEW COMPLETE) |
| 2026-01-09 | 04-architecture | 27 action wrappers, useScan/useScanOptional hooks, 23 tests passing |
| 2026-01-09 | 04-architecture | **Story 14d.3 - Hybrid Navigation Blocking** (CODE REVIEW COMPLETE) |
| 2026-01-09 | 04-architecture | Browser back blocking via pushState pattern, 40 tests (18 Nav + 22 NavigationBlocker) |
| 2026-01-09 | 04-architecture | Learnings: popstate not cancelable, dev-only console.warn, dead code removal |
| 2026-01-09 | 04-architecture | **Story 14d.4a - State Bridge Layer** (CODE REVIEW COMPLETE) |
| 2026-01-09 | 04-architecture | Bridge pattern for incremental migration, 16 tests, performance optimization (no JSON.stringify on images) |
| 2026-01-09 | 04-architecture | Learnings: Use length+prefix key for large base64, ESLint disable with comment, debug hook pattern |
| 2026-01-09 | 04-architecture | **Story 14d.4b - Consumer Migration** (CODE REVIEW COMPLETE - 2 sessions) |
| 2026-01-09 | 04-architecture | DIALOG_TYPES constants added, effectiveIsProcessing used in TransactionEditorView |
| 2026-01-09 | 04-architecture | 19 new tests in DialogScanContextIntegration.test.tsx, total 122 tests for 14d stories |
| 2026-01-09 | 04-architecture | Learnings: Verify "prepared" variables are actually used, use constants for type safety, document double-callback pattern |
| 2026-01-09 | 02-features | **Story 14.13 BLOCKED** - Multi-level filter gap identified |
| 2026-01-09 | docs/stories | Created **Story 14.13a** - Multi-Level Filter Support (5 pts) |
| 2026-01-09 | docs/stories | Created **Story 14.13b** - Header Clear Filter Buttons (3 pts) |
| 2026-01-09 | 08-workflow-chains | Workflow gap: drill-down context lost when navigating to Compras/Productos |
| 2026-01-09 | 04-architecture, 06-lessons | **Story 14.13a COMPLETE** - Multi-Level Filter Support |
| 2026-01-09 | 06-lessons | BUG: HistoryView ignores itemGroup/itemCategory - only filters by storeCategory |
| 2026-01-09 | 06-lessons | BUG: ItemsView doesn't show itemGroup filter badge in UI |
| 2026-01-09 | 06-lessons | BUG: "Más" aggregated category shows 0 productos when clicking item count |
| 2026-01-09 | 06-lessons | LESSON: matchesCategoryFilter must iterate tx.items[] for item-level filtering |
| 2026-01-10 | 06-lessons | **Story 14.13b COMPLETE** - Header Clear Filter Buttons |
| 2026-01-10 | src/views | HistoryView.tsx + ItemsView.tsx - Added X clear button next to titles |
| 2026-01-10 | src/components/history | IconFilterBar.tsx - Filter persistence across Transactions/Items tabs |
| 2026-01-10 | 06-lessons | LESSON: drillDownPath enables true multi-dimension filtering (store + item) |
| 2026-01-10 | 02-features | **Story 14.13 COMPLETE** - Analytics Explorer Redesign unblocked |
| 2026-01-10 | sprint-status.yaml | Updated 14.13 to done, 14.13a + 14.13b complete |
| 2026-01-10 | 06-lessons | **Story 14d.4c CODE REVIEW PASSED** - State Variable Removal |
| 2026-01-10 | src/App.tsx | Removed 36 dead `setScanButtonState` calls, removed no-op wrapper |
| 2026-01-10 | 06-lessons | ANTI-PATTERN: No-op setter wrappers create dead code when migrating to derived state |
| 2026-01-10 | 06-lessons | PATTERN: setTimeout(0) valid for deferring React state update chains |
| 2026-01-10 | 02-features, 04-architecture, 06-lessons | **Story 14.13b IN REVIEW** - Filter Persistence + Multi-Level Manual Filtering |
| 2026-01-10 | src/contexts | HistoryFiltersContext.tsx - onStateChange callback, default month filter |
| 2026-01-10 | src/App.tsx | navigateToView clears filters when from outside related views |
| 2026-01-10 | src/components/history | FilterChips.tsx - X button at start, translateItemGroup for display |
| 2026-01-10 | src/components/history | IconFilterBar.tsx - pending selections from other tab preserved |
| 2026-01-10 | src/views | ItemsView.tsx - normalizeItemCategory for filtering, fixed early return bug |
| 2026-01-10 | src/utils | historyFilterUtils.ts - comma-separated multi-select support |
| 2026-01-10 | 06-lessons | PATTERN: Context state sync via onStateChange callback for persistence |
| 2026-01-10 | 06-lessons | BUG FIX: Category filters skipped when no temporal filter (early return) |
| 2026-01-10 | 06-lessons | **Story 14d.4d CODE REVIEW PASSED** - pendingScan Migration |
| 2026-01-10 | src/services | pendingScanStorage.ts - PersistedScanState format with version field |
| 2026-01-10 | src/services | pendingScanStorage.ts - migrateOldFormat() for PendingScan → ScanState |
| 2026-01-10 | src/App.tsx | ScanContext persistence effect, restoreState on load |
| 2026-01-10 | tests/unit | pendingScanStorage.test.ts - 32 tests (14 new for 14d.4d) |
| 2026-01-10 | 06-lessons | PATTERN: Versioned persistence format enables safe migrations |
| 2026-01-10 | 06-lessons | PATTERN: Phased migration with parallel systems reduces regression risk |
| 2026-01-10 | 06-lessons | FIX: DEV-gate console warnings, remove redundant clear calls |
| 2026-01-10 | 04-architecture, 06-lessons | **Story 14d.5 IN PROGRESS** - Batch Scan Refactor |
| 2026-01-10 | src/contexts | ScanContext.tsx - Added batch computed values (isBatchMode, isBatchCapturing, isBatchProcessing, isBatchReviewing, batchProgress) |
| 2026-01-10 | src/hooks | useScanStateBridge.ts - Extended with batch state syncing (mode, images, progress) |
| 2026-01-10 | src/views | BatchCaptureView.tsx + BatchReviewView.tsx - Added useScanOptional() integration |
| 2026-01-10 | src/App.tsx | Batch entry points now dispatch startBatchScanContext to ScanContext |
| 2026-01-10 | tests/unit | BatchCaptureView.test.tsx - Added ScanContext mock |
| 2026-01-10 | 06-lessons | PATTERN: Incremental migration with useScanOptional() and prop fallback |
| 2026-01-10 | 06-lessons | PATTERN: Computed values (isBatchProcessing) simplify context consumption |

## Documents Tracked

| Document | Location | Last Checked |
|----------|----------|--------------|
| PRD | docs/sprint-artifacts/epic1/prd.md | 2025-12-18 |
| Architecture | docs/architecture/architecture.md | 2025-12-18 |
| UX Design | docs/ux-design-specification.md | 2025-12-18 |
| Pricing Model | docs/business/pricing-model.md | 2025-12-18 |
| Sprint Status | docs/sprint-artifacts/sprint-status.yaml | 2025-12-22 |
| Epic 8 Retro | docs/sprint-artifacts/epic8/epic-8-retrospective.md | 2025-12-18 |
| Epic 9 Retro | docs/sprint-artifacts/epic9/epic-9-retro-2025-12-16.md | 2025-12-18 |
| Epic 10-11 Retro | docs/sprint-artifacts/epic10-11-retro-2025-12-22.md | 2025-12-22 |
| Epic 10 Architecture | docs/sprint-artifacts/epic10/architecture-epic10-insight-engine.md | 2025-12-22 |
| Epic 10a Tech Context | docs/sprint-artifacts/epic10a/tech-context-epic10a.md | 2025-12-22 |
| Epic 11 Tech Context | docs/sprint-artifacts/epic11/tech-context-epic11.md | 2025-12-22 |

## Drift Detection

| Document | Changed | Section Affected | Synced |
|----------|---------|------------------|--------|
| sprint-status.yaml | Epics 10, 10a, 11 complete | 02-features | ✅ |
| sprint-status.yaml | Epic 12 next development | 02-features | ✅ |

## Push Alert Triggers

Active monitoring for:
- Story creation affecting existing workflows
- Code review findings without test coverage
- Architecture conflicts with documented patterns
- Strategy/process references needing alignment check
- **ALERT: Bundle size at 2.0 MB** (exceeded 1MB threshold - code splitting needed)
- Test coverage dropping below 80% (currently 84%+, 3,118+ tests)

## Verification Checklist

Critical facts verified with user confirmation on 2025-12-18:

- [x] Target market: "Chilean families" (ux-design-specification.md:10)
- [x] Primary currency: "Chilean Pesos (CLP) primary" (pricing-model.md:164)
- [x] Target persona: "Chilean families who reach end of month..." (ux-design-specification.md:22)
- [x] Core value: "Help Chilean families answer 'Where did my money go?'" (ux-design-specification.md:12)

---

## Next Sync Recommended

- [x] Section 1 (Purpose) - synced 2025-12-18
- [x] Section 2 (Features) - synced 2026-01-06 (Epic 14 progress)
- [x] Section 3 (Personas) - synced 2025-12-18
- [x] Section 4 (Architecture) - synced 2026-01-06 (Epic 14 patterns)
- [x] Section 5 (Testing) - synced 2026-01-06 (CI/CD optimizations)
- [x] Section 6 (Lessons) - synced 2025-12-22 (12 new patterns added)
- [x] Section 7 (Process) - synced 2025-12-18
- [x] Section 8 (Workflow Chains) - synced 2025-12-22 (4 new workflow chains)

**All sections synced 2026-01-06. Next sync recommended after Epic 14 completion.**

## Epic Completion Summary (2026-01-06)

| Epic | Stories | Points | Deployed | Key Features |
|------|---------|--------|----------|--------------|
| Epic 10 | 9 | ~35 | 2025-12-19 | InsightEngine, 12 generators, ADRs 015-017 |
| Epic 10a | 5 | ~13 | 2025-12-21 | Home+History merged, Insights tab |
| Epic 11 | 7 | ~24 | 2025-12-22 | QuickSaveCard, trust merchants, viewport |
| Epic 12 | 6 | ~25 | 2025-12-23 | Batch capture, parallel processing, review queue |
| Epic 13 | 15 | ~41 | 2025-12-31 | 10 HTML mockups, design system, motion design |
| Epic 14 | 19/23 | ~55/65 | 2026-01-06 | Animation framework, polygon, settings redesign |
| **TOTAL** | **61** | **~193** | **~18 days** | **~11 pts/day velocity** |

**Versions Deployed:** v9.3.0 → v10.x.x
**Test Count:** 3,118+ unit tests
**Bundle Size:** 2.0 MB (**ALERT: Code splitting needed**)

## Current Development: Epic 14 (IN PROGRESS)

| Status | Stories |
|--------|---------|
| ✅ Done | 14.1-14.11, 14.14, 14.15, 14.15b, 14.15c, 14.16, 14.21, 14.23, 14.25, 14.26, **14.29** |
| 📝 Ready | 14.22, 14.24, 14.27, 14.28 |

### Phase 6 - Firestore Cost Optimization
- **14.25**: ✅ COMPLETE - LISTENER_LIMITS constant
- **14.26**: ✅ COMPLETE - limit(1) on single-doc queries
- **14.27**: Ready - Transaction pagination with `useInfiniteQuery`
- **14.28**: Ready - App-level preferences (React Query cache warming)
- **14.29**: ✅ **COMPLETE** - React Query Migration (foundation for 14.27, 14.28, Epic 14c)

### Stories Reset for Re-evaluation (Post-14.29)
- **14.24**: Persistent Transaction State - needs alignment with React Query
- **14.27**: Now uses `useInfiniteQuery` pattern
- **14.28**: Simplified - just warm React Query cache at App level

| 2026-01-09 | 04-architecture | **Story 14d.4a - State Bridge Layer** - useScanStateBridge hook for incremental migration |
| 2026-01-09 | src/hooks | Created `useScanStateBridge.ts` - bridge from App.tsx local state to ScanContext |
| 2026-01-09 | tests/unit/hooks | Created `useScanStateBridge.test.ts` - 16 tests for bridge hook |
| 2026-01-09 | src/App.tsx | Integrated useScanStateBridge for incremental ScanContext migration |

## Next Development: Epic 14d (READY) + Epic 14c + Epic 15

| Epic | Stories | Status | Key Features |
|------|---------|--------|--------------|
| **Epic 14d** | **11** | **READY** | **Scan architecture refactor, state machine, mode selector** |
| Epic 14c | 10 | UNBLOCKED | Household sharing (requires 14.29 ✅) |
| Epic 15 | 13 | BACKLOG | Goals/GPS, learned thresholds, skins |

### Epic 14d Key Decisions (2026-01-08)

| Decision | Choice |
|----------|--------|
| Request Precedence | Active request blocks new requests |
| Persistence | No expiration, survives logout |
| Offline | Error immediately, refund credit |
| Credit Timing | Reserve on API, confirm on success |

**Reference:** docs/sprint-artifacts/epic14d/scan-request-lifecycle.md
