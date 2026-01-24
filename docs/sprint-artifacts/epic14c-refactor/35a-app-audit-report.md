# App.tsx Audit Report - Story 14c-refactor-35a

**Date:** 2026-01-24
**Current Line Count:** 4,221 lines
**Target Line Count:** 1,500-2,000 lines (per story 14c-refactor.35 requirements)
**Reduction Needed:** ~2,200-2,700 lines (52-64% reduction)

---

## Executive Summary

App.tsx has undergone significant refactoring in the Epic 14c-refactor series. Handler hooks and view composition hooks have been extracted, reducing complexity. However, the file remains large due to:

1. **Unextracted handler functions** (~700 lines) - especially `processScan` and `handleRescan`
2. **Inline modal JSX** (~300 lines) - could move to `AppOverlays.tsx` or `viewRenderers.tsx`
3. **Dead/deprecated code** (~230 lines) - marked for removal but still present
4. **Duplicated batch processing callbacks** (~200 lines) - redundancy across batch flows

---

## Section 1: Code Categories (Lines 1-4221)

### 1.1 Imports (Lines 1-133)
**~133 lines** - MUST REMAIN

- React, hooks, types
- Contexts (AuthContext, ScanContext, AnalyticsContext, etc.)
- Components (AppLayout, AppOverlays, Nav, TopHeader, Views)
- Custom hooks (useScanHandlers, useTransactionHandlers, etc.)
- Utilities (formatters, validators)
- Lucide icons

**Status:** Cannot be reduced further without removing functionality.

---

### 1.2 Type Definitions (Lines 134-200)
**~66 lines** - CANDIDATE FOR EXTRACTION

Types defined inline:
- `SettingsSubview`
- `BatchItemResult`
- Several inline type aliases

**Recommendation:** Move to `src/types/app.types.ts` or `src/components/App/types.ts`

---

### 1.3 State Declarations (Lines ~250-500)
**~250 lines** - MUST REMAIN (with cleanup)

Heavy use of useState for:
- View state (`view`, `settingsSubview`)
- Transaction state (`currentTransaction`, `transactionEditorMode`)
- Batch state (`batchImages`, `batchProgress`, `batchResults`)
- UI state (`toastMessage`, `showCreditInfoModal`, etc.)
- Dialog state (`showConflictDialog`, `conflictDialogData`)

**Optimization Opportunity:**
- Group related states into reducers (e.g., `useBatchState` hook)
- ~50 batch-related states could become a single hook

---

### 1.4 Hook Calls (Lines ~500-800)
**~300 lines** - MUST REMAIN

Current hook usage:
- Context hooks (useAuth, useScan, useAnalytics, etc.)
- Feature hooks (useCredits, useMappings, useInsights)
- Handler hooks (useScanHandlers, useTransactionHandlers, etc.)
- Composition hooks (useHistoryViewProps, useTrendsViewProps, etc.)

**Status:** Already well-organized, no further extraction needed.

---

### 1.5 Handler Functions (Lines ~1200-2750)
**~1,550 lines** - MAJOR EXTRACTION CANDIDATES

#### 1.5.1 Already Extracted to Hooks
| Handler | Moved To |
|---------|----------|
| saveTransaction | useTransactionHandlers |
| deleteTransaction | useTransactionHandlers |
| wipeDB | useTransactionHandlers |
| handleExportData | useTransactionHandlers |
| navigateToView | useNavigationHandlers |
| navigateBack | useNavigationHandlers |
| handleNavigateToHistory | useNavigationHandlers |
| handleScanOverlayCancel/Retry/Dismiss | useScanHandlers |
| handleQuickSave* | useScanHandlers |
| handleCurrencyMismatch* | useScanHandlers |
| handleTotalMismatch* | useScanHandlers |
| handleConflictClose/ViewCurrent/Discard | useDialogHandlers |

#### 1.5.2 Remaining in App.tsx - EXTRACTION CANDIDATES

| Function | Lines | Priority | Target Hook |
|----------|-------|----------|-------------|
| `processScan` | ~400 | **P0** | useScanProcessing |
| `handleRescan` | ~100 | **P0** | useScanProcessing |
| `hasActiveTransactionConflict` | ~80 | P1 | useConflictDetection |
| `handleBatchEditReceipt` | ~20 | P1 | useBatchNavigation |
| `handleBatchPrevious/Next` | ~40 | P1 | useBatchNavigation |
| `handleTransactionListPrevious/Next` | ~30 | P1 | useTransactionNavigation |
| `handleEditorUpdateTransaction` | ~15 | P2 | useEditorCallbacks |
| `handleEditorSave` | ~20 | P2 | useEditorCallbacks |
| `handleEditorCancel` | ~20 | P2 | useEditorCallbacks |
| `handleEditorPhotoSelect` | ~10 | P2 | useEditorCallbacks |
| `handleEditorProcessScan` | ~5 | P2 | useEditorCallbacks |
| `handleEditorRetry` | ~5 | P2 | useEditorCallbacks |
| `handleEditorBatchModeClick` | ~10 | P2 | useEditorCallbacks |
| `handleEditorGroupsChange` | ~60 | P2 | useEditorCallbacks |
| `applyItemNameMappings` | ~45 | P2 | useMappingApplication |
| `handleFileSelect` | ~50 | P2 | useFileUpload |
| `handleCreditWarningConfirm` | ~50 | P2 | useBatchProcessing |
| `handleReduceBatch` | ~15 | P2 | useBatchProcessing |
| `handleBatchReviewBack` | ~15 | P3 | useBatchNavigation |
| `handleBatchDiscardConfirm/Cancel` | ~20 | P3 | useBatchNavigation |
| `handleBatchSaveComplete` | ~30 | P3 | useBatchSave |
| `handleBatchSaveTransaction` | ~70 | P3 | useBatchSave |
| `handleRemoveBatchImage` | ~20 | P3 | useBatchCapture |
| `handleAcceptTrust/DeclineTrust` | ~30 | P3 | useTrustHandlers |
| `createDefaultTransaction` | ~20 | P3 | useTransactionFactory |

**Estimated Reduction:** ~700 lines by extracting P0-P2 handlers

---

### 1.6 Composition Hook Calls (Lines ~2800-3200)
**~400 lines** - MUST REMAIN (already optimal)

Current composition hooks:
- `useHistoryViewProps` - composing HistoryView props
- `useTrendsViewProps` - composing TrendsView props
- `useBatchReviewViewProps` - composing BatchReviewView props
- `useTransactionEditorViewProps` - composing TransactionEditorView props
- `useDashboardViewProps` - composing DashboardView props
- `useSettingsViewProps` - composing SettingsView props
- `useItemsViewProps` - composing ItemsView props

**Status:** These are the result of 14c-refactor work. Keep as-is.

---

### 1.7 Early Returns (Lines ~3240-3250)
**~10 lines** - MUST REMAIN

```tsx
if (initError) { return <div>Error: {initError}</div>; }
if (!user) { return <LoginScreen ... />; }
```

---

### 1.8 JSX Rendering (Lines ~3250-4221)
**~970 lines** - PARTIAL EXTRACTION CANDIDATES

#### 1.8.1 Already Extracted to viewRenderers.tsx (~432 lines)
- `renderInsightsView`
- `renderAlertsView`
- `renderStatementScanView`
- `renderRecentScansView`
- `renderReportsView`

#### 1.8.2 Already Extracted to AppOverlays.tsx
- ScanOverlay
- QuickSaveCard
- InsightCard
- SessionComplete
- PersonalRecordBanner
- CreditWarningDialog
- BatchSummary
- TrustPrompt
- CurrencyMismatchDialog
- TotalMismatchDialog
- ConflictDialog
- BatchCompleteModal
- PWAUpdatePrompt

#### 1.8.3 Remaining Inline JSX - EXTRACTION CANDIDATES

| Component | Lines | Target Location |
|-----------|-------|-----------------|
| Credit Info Modal | ~120 | AppOverlays.tsx or new CreditInfoModal.tsx |
| Toast notification | ~30 | viewRenderers.tsx or new Toast.tsx |
| BatchUploadPreview modal wrapper | ~15 | AppOverlays.tsx |
| BatchProcessingProgress modal wrapper | ~15 | AppOverlays.tsx |
| Batch cancel confirmation dialog | ~50 | AppOverlays.tsx |
| Batch discard confirmation dialog | ~55 | Already using ScanContext dialog |

**Estimated Reduction:** ~230 lines by moving to AppOverlays

---

## Section 2: Code for viewRenderers.tsx

### Current Content (432 lines)
- `renderInsightsView`
- `renderAlertsView`
- `renderStatementScanView`
- `renderRecentScansView`
- `renderReportsView`

### Recommended Additions
None - most remaining views use composition hooks with single-spread pattern.

---

## Section 3: Handlers That Can Become Hooks

### Priority 0 (Critical - ~500 lines)

#### 3.1 useScanProcessing Hook
**Extract from App.tsx:**
- `processScan` (~400 lines)
- `handleRescan` (~100 lines)

**Dependencies needed:**
- ScanContext (dispatchProcessStart, dispatchProcessSuccess, etc.)
- Credits (deductUserCredits, addUserCredits)
- Mappings (applyCategoryMappings, findMerchantMatch, etc.)
- User preferences (defaultCountry, defaultCity)
- Services (db, appId)

**Complexity:** HIGH - This is the core scan logic with credit handling, mapping application, dialog triggering, and error recovery.

### Priority 1 (~150 lines)

#### 3.2 useBatchNavigation Hook
**Extract:**
- `handleBatchEditReceipt`
- `handleBatchPrevious`
- `handleBatchNext`
- `handleBatchReviewBack`
- `handleBatchDiscardConfirm`
- `handleBatchDiscardCancel`

#### 3.3 useConflictDetection Hook
**Extract:**
- `hasActiveTransactionConflict`
- Related conflict state management

### Priority 2 (~200 lines)

#### 3.4 useEditorCallbacks Hook
**Extract all handleEditor* functions:**
- `handleEditorUpdateTransaction`
- `handleEditorSave`
- `handleEditorCancel`
- `handleEditorPhotoSelect`
- `handleEditorProcessScan`
- `handleEditorRetry`
- `handleEditorRescan` (conditional)
- `handleEditorDelete` (conditional)
- `handleEditorBatchPrevious` (conditional)
- `handleEditorBatchNext` (conditional)
- `handleEditorBatchModeClick`
- `handleEditorGroupsChange`

---

## Section 4: Dead Code for Removal

### 4.1 Deprecated Functions (~230 lines)

| Item | Lines | Location | Notes |
|------|-------|----------|-------|
| `_handleCancelNewTransaction` | 7 | ~1200-1207 | Marked DEPRECATED, unused |
| `_processBatchImages_DEPRECATED` | ~200 | ~1947-2151 | Full deprecated function |

### 4.2 Commented View Blocks (~20 lines)

| Item | Lines | Location |
|------|-------|----------|
| ScanView comment block | ~10 | ~3493-3505 |
| ScanResultView comment block | ~5 | ~3507-3515 |
| EditView comment block | ~5 | ~3517-3524 |

### 4.3 Unused Imports (Verify)
Run TypeScript to identify:
```bash
npx tsc --noEmit 2>&1 | grep "is declared but"
```

**Total Dead Code:** ~250 lines

---

## Section 5: Must Remain Items

### 5.1 Core App Structure (~50 lines)
- Function component declaration
- AppLayout wrapper
- ViewHandlersProvider wrapper
- TopHeader component (with conditional rendering)
- Nav component (with all callbacks)
- Main content area with view routing

**Reason:** These define the app shell and cannot be extracted.

### 5.2 State Declarations (~250 lines)
All useState calls must remain at component level.

**Reason:** React state must be declared in the component that owns it.

### 5.3 Hook Calls (~300 lines)
Context hooks, feature hooks, handler hooks, composition hooks.

**Reason:** Hook rules require consistent ordering at component top level.

### 5.4 View Switch Logic (~300 lines)
The main `{view === 'xxx' && <XxxView />}` conditionals.

**Reason:** Core routing logic that coordinates all views.

### 5.5 Theme/Document Effects (~30 lines)
The synchronous document.documentElement updates.

**Reason:** Must run during render to avoid flicker.

---

## Section 6: Extraction Roadmap

### Phase 1: Dead Code Removal (Story 35d)
- Remove `_handleCancelNewTransaction`
- Remove `_processBatchImages_DEPRECATED`
- Remove commented view blocks
- **Estimated reduction:** 250 lines

### Phase 2: Handler Extraction - P0 (Story 35c)
- Create `useScanProcessing` hook with `processScan` and `handleRescan`
- **Estimated reduction:** 500 lines

### Phase 3: Handler Extraction - P1/P2 (Future story)
- Create `useEditorCallbacks` hook
- Create `useBatchNavigation` hook
- **Estimated reduction:** 350 lines

### Phase 4: JSX Extraction (Story 35b)
- Move Credit Info Modal to AppOverlays
- Move batch dialog wrappers to AppOverlays
- Move Toast to viewRenderers
- **Estimated reduction:** 230 lines

### Phase 5: State Consolidation (Future story)
- Create `useBatchState` reducer hook
- Consolidate dialog state
- **Estimated reduction:** 100 lines

---

## Section 7: Line Count Projections

| Phase | Action | Lines Removed | Running Total |
|-------|--------|---------------|---------------|
| Current | - | 0 | 4,221 |
| Phase 1 | Dead code removal | 250 | 3,971 |
| Phase 2 | P0 handlers | 500 | 3,471 |
| Phase 3 | P1/P2 handlers | 350 | 3,121 |
| Phase 4 | JSX extraction | 230 | 2,891 |
| Phase 5 | State consolidation | 100 | 2,791 |

**Note:** After Phase 5, estimate is 2,791 lines. To reach the 1,500-2,000 line target would require additional architectural changes such as:
- Moving ALL view rendering to a separate ViewRouter component (~300-400 lines)
- Consolidating state declarations further (~200-300 lines)
- These changes are beyond the scope of Epic 14c-refactor

**Gap Analysis:**
- Projected after Phase 5: 2,791 lines
- Target minimum: 1,500 lines
- Gap: 1,291 lines (86% over minimum)
- Additional work needed: ViewRouter extraction (~400 lines) + state consolidation (~300+ lines)
- Recommendation: Document as tech debt for future epic (Epic 14E or similar)

---

## Section 8: Recommendations

### Immediate Actions (Stories 35b-35d)
1. **Remove dead code** - Easy win, 250 lines
2. **Extract processScan/handleRescan** - High impact, 500 lines
3. **Move inline modals to AppOverlays** - Clean separation, 230 lines

### Future Refactoring
1. Consider extracting view routing to `<ViewRouter>` component
2. Consider moving batch state to `useBatchReducer` hook
3. Consider moving editor callbacks to dedicated hook

### Architectural Notes
The current architecture with composition hooks is sound. The remaining bulk comes from:
1. The complexity of scan processing (multiple dialog flows, credit handling, error recovery)
2. The number of supported views requiring coordination
3. State that must live at the App level for cross-view sharing

---

## Appendix A: File Structure Reference

```
src/
├── App.tsx (4,221 lines - THIS FILE)
├── components/
│   └── App/
│       ├── AppLayout.tsx
│       ├── AppOverlays.tsx (extracted overlays)
│       ├── viewRenderers.tsx (432 lines)
│       └── index.ts
├── hooks/
│   └── app/
│       ├── useScanHandlers.ts (37KB)
│       ├── useTransactionHandlers.ts (19KB)
│       ├── useNavigationHandlers.ts (16KB)
│       ├── useDialogHandlers.ts (13KB)
│       ├── useHistoryViewProps.ts (11KB)
│       ├── useTrendsViewProps.ts (8KB)
│       ├── useBatchReviewViewProps.ts (10KB)
│       ├── useTransactionEditorViewProps.ts (20KB)
│       ├── useDashboardViewProps.ts (8KB)
│       ├── useSettingsViewProps.ts (19KB)
│       ├── useItemsViewProps.ts (6KB)
│       └── index.ts
└── contexts/
    └── ViewHandlersContext.tsx (extracted handler bundles)
```

---

## Appendix B: Testing Checklist

**Note:** This checklist is for Stories 35b/35c/35d that perform extractions. Story 35a is documentation-only and requires no code testing.

After any extraction:
- [ ] Run full test suite: `npm run test`
- [ ] Verify all views render correctly
- [ ] Test scan flow (single image)
- [ ] Test batch scan flow
- [ ] Test transaction editing
- [ ] Test navigation between views
- [ ] Verify no circular dependencies
- [ ] Check bundle size impact

---

*Generated by Atlas-enhanced dev-story workflow*
*Story: 14c-refactor-35a-audit-documentation*
