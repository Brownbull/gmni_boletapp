# Story 15b-4f: App.tsx Fan-Out Reduction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 4 - Architecture
**Points:** 5
**Priority:** HIGH
**Status:** drafted

## Overview

App.tsx currently imports from **62+ unique source files** (82 import statements, 2,081 lines total), making it the highest-coupling file in the codebase. These imports cluster naturally into 7 logical groups: auth/user data hooks, transaction/scan workflows, mapping/learning systems, UI utilities, view rendering, feature orchestration, and shared stores. This story extracts these clusters into **5 new domain orchestrators** composing into a single `useAppDataHooks()` bundle, reducing App.tsx's outgoing dependencies from ~62 to **<30** and lowering line count from 2,081 to ~1,200-1,400.

## Functional Acceptance Criteria

- [ ] **AC1:** App.tsx outgoing dependency count (unique source files) reduced from ~62 to <30
- [ ] **AC2:** App.tsx line count reduced from 2,081 to <1,500
- [ ] **AC3:** All data hook initialization centralized in orchestrators called from `useAppDataHooks()`
- [ ] **AC4:** No new cross-feature imports introduced — all new imports are within orchestrators or via existing feature entry points
- [ ] **AC5:** No behavioral changes — all view prop construction preserved with identical logic
- [ ] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** All new orchestrators at `src/app/hooks/use*Orchestrator.ts`
- [ ] **AC-ARCH-LOC-2:** Bundle hook at `src/app/hooks/useAppDataHooks.ts`
- [ ] **AC-ARCH-LOC-3:** New barrel at `src/app/hooks/index.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PAT-1:** Orchestrators are PURELY compositional — no new state, no new logic, only hook composition
- [ ] **AC-ARCH-PAT-2:** App.tsx replaces 82 import lines with ~15 imports (5 orchestrators, providers, view components, nav, auth)
- [ ] **AC-ARCH-PAT-3:** Complex callback logic preserved verbatim (especially `setScanImages` phase-transition and `navigateToView` branching)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT introduce new state management in orchestrators — only compose existing hooks
- [ ] **AC-ARCH-NO-2:** Do NOT create circular imports between App.tsx, orchestrators, and feature modules
- [ ] **AC-ARCH-NO-3:** Do NOT split `viewRenderers.tsx` — already extracted in 15b-0b (barrel cycle fix)
- [ ] **AC-ARCH-NO-4:** Do NOT modify view components (DashboardView, TrendsView, etc.) — orchestrators only handle data/state concerns

## File Specification

### New Files

| File | Exact Path | Purpose | Est. Lines |
|------|------------|---------|------------|
| User Context Orchestrator | `src/app/hooks/useUserContextOrchestrator.ts` | Composes auth, preferences, credits, notifications, personal records, reduced motion | 80-120 |
| Transaction Data Orchestrator | `src/app/hooks/useTransactionDataOrchestrator.ts` | Composes transactions, recent scans, paginated transactions + merge logic | 60-100 |
| Scan Workflow Orchestrator | `src/app/hooks/useScanWorkflowOrchestrator.ts` | Composes scan state, handlers, overlays + critical wrapper callbacks | 120-160 |
| Mapping System Orchestrator | `src/app/hooks/useMappingSystemOrchestrator.ts` | Composes mapping/merchant/item-name hooks + insight profile | 80-120 |
| View Handlers Orchestrator | `src/app/hooks/useViewHandlersOrchestrator.ts` | Composes navigation, dialog handlers, toast, modal actions | 100-140 |
| App Data Hooks Bundle | `src/app/hooks/useAppDataHooks.ts` | Single hook composing all 5 orchestrators | 40-60 |
| App Hooks Barrel | `src/app/hooks/index.ts` | Re-exports all orchestrators + bundle | 10-15 |

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| App.tsx | `src/App.tsx` | Replace 82 import lines + hook initialization with `useAppDataHooks()` call. Remove ~850 LOC from import + initialization. |

## Tasks / Subtasks

### Task 1: Audit and cluster App.tsx imports

- [ ] 1.1 Read App.tsx import section and cluster by domain: auth, transactions, mappings, scan, view handlers, UI. **Note:** The baseline of "lines 15-130" assumes no Phase 3 stories have run yet. After 15b-3f (removes AnalyticsProvider) and 15b-3g (removes HistoryFiltersProvider), some import lines will already be gone. Run `grep -c "^import" src/App.tsx` to get the current import count before clustering — adjust the line range accordingly.
- [ ] 1.2 Identify cross-cutting imports (keep in App.tsx): React, AppProviders, AppLayout, AppOverlays, FeatureOrchestrator, Nav, Toast, LoginScreen
- [ ] 1.3 Document clustering decision: which imports go into which orchestrator

### Task 2: Create User Context Orchestrator

- [ ] 2.1 Create `src/app/hooks/useUserContextOrchestrator.ts` composing: `useAuth()`, `useUserPreferences()`, `useUserCredits()`, `useInAppNotifications()`, `usePersonalRecords()`, `useReducedMotion()`
- [ ] 2.2 Return type: `{ user, services, preferences, credits, notifications, personalRecords, reducedMotion }`
- [ ] 2.3 Write unit test: all 6 hooks called, return shape matches spec, null user state handled

### Task 3: Create Transaction Data Orchestrator

- [ ] 3.1 Create `src/app/hooks/useTransactionDataOrchestrator.ts` composing: `useTransactions()`, `useRecentScans()`, `usePaginatedTransactions()`, plus `useMemo` merge logic for `transactionsWithRecentScans`
- [ ] 3.2 Extract merge logic verbatim from App.tsx lines ~165-194 — preserve Map construction logic exactly
- [ ] 3.3 Write unit test: 3 hooks called, merge produces correct Map, handles 0/1/many recent scans

### Task 4: Create Scan Workflow Orchestrator

- [ ] 4.1 Create `src/app/hooks/useScanWorkflowOrchestrator.ts` composing: `useScanStore()`, `useScanMode()`, `useIsProcessing()`, `useScanActions()`, plus wrapper callbacks
- [ ] 4.2 Extract `setScanImages` wrapper verbatim from App.tsx (~lines 315-331) — this callback auto-transitions scan phase and defers setTimeout; CRITICAL, preserve exactly
- [ ] 4.3 Extract `setScanError`, `showScanDialog`, `dismissScanDialog`, `isBatchModeFromContext` from App.tsx
- [ ] 4.4 Write unit test: Zustand hooks called, `setScanImages` auto-transition preserved, wrappers delegate correctly

### Task 5: Create Mapping System Orchestrator

- [ ] 5.1 Create `src/app/hooks/useMappingSystemOrchestrator.ts` composing: `useCategoryMappings()`, `useMerchantMappings()`, `useSubcategoryMappings()`, `useItemNameMappings()`, `useInsightProfile()`
- [ ] 5.2 Return: `{ mappings, findMerchantMatch, insightProfile, insightCache }`
- [ ] 5.3 Write unit test: all 5 hooks called, return shape matches spec

### Task 6: Create View Handlers Orchestrator + Bundle

- [ ] 6.1 Create `src/app/hooks/useViewHandlersOrchestrator.ts` composing navigation store selectors, `useModalActions()`, `useToast()`, and all `navigateToView` + `setCurrentTransaction` logic from App.tsx (lines ~607-700)
- [ ] 6.2 **CRITICAL**: Extract `navigateToView` function verbatim — it has 5 conditional branches (batch state, history state, distribution state, scan state, standard). Preserve exact branching and comments
- [ ] 6.3 Write unit test: all store hooks called, `navigateToView` branching preserved for each of 5 conditional paths
- [ ] 6.4 Create `src/app/hooks/useAppDataHooks.ts` composing all 5 orchestrators into single return object
- [ ] 6.5 Create `src/app/hooks/index.ts` barrel exporting all orchestrators + bundle

### Task 7: Refactor App.tsx

- [ ] 7.1 Replace App.tsx import lines 20-130 with ~15 imports: `React`, `AppProviders`, `AppLayout`, `AppOverlays`, `FeatureOrchestrator`, view renderers, `Nav`, `Toast`, `LoginScreen`, `useAppDataHooks`
- [ ] 7.2 Replace hook initialization block (lines ~164-356) with: `const appData = useAppDataHooks();` + destructuring
- [ ] 7.3 Verify view prop construction still works — each view receives same props as before (just sourced from orchestrators now)
- [ ] 7.4 Run `npx tsc --noEmit` after each change section — fix type errors immediately

### Task 8: Verification

- [ ] 8.1 Count App.tsx import lines: must be <30 unique source files
- [ ] 8.2 Count App.tsx total lines: must be <1,500
- [ ] 8.3 Run `npm run test:quick` — all tests must pass, 0 failures
- [ ] 8.4 `grep -c "^import" src/App.tsx` — should be <30

## Dev Notes

### Current App.tsx Import Breakdown (82 imports, ~62 unique sources)

**Cross-cutting (keep in App.tsx):** React, AppProviders, AppLayout, AppOverlays, FeatureOrchestrator, Nav, Toast, LoginScreen, PWAUpdatePrompt, NavigationBlocker (~10 imports)

**User context cluster (→ useUserContextOrchestrator):** useAuth, useUserPreferences, useUserCredits, useInAppNotifications, usePersonalRecords, useReducedMotion (~8 imports)

**Transaction data cluster (→ useTransactionDataOrchestrator):** useTransactions, useRecentScans, usePaginatedTransactions (~6 imports)

**Scan workflow cluster (→ useScanWorkflowOrchestrator):** useScanStore, useScanMode, useIsProcessing, useScanActions, scan handler imports, batch session (~10 imports)

**Mapping cluster (→ useMappingSystemOrchestrator):** useCategoryMappings, useMerchantMappings, useSubcategoryMappings, useItemNameMappings, useInsightProfile (~7 imports)

**View handlers cluster (→ useViewHandlersOrchestrator):** navigation store selectors, useModalActions, useToast, dialog handlers, useTransactionHandlers (~12 imports)

**View rendering (keep in App.tsx):** viewRenderers, feature entry points (~8 imports)

### CRITICAL: Preserve setScanImages Logic

Lines ~315-331 in App.tsx contain a complex wrapper:
```typescript
const setScanImages = useCallback((images: string[]) => {
  // Auto-transition phase when images array changes
  // Defers setTimeout to avoid state batching issues
  // Clears state on empty array
  ...
}, [scanActions, setScanPhase]);
```
This must be extracted verbatim to `useScanWorkflowOrchestrator`. Any change in timing/logic will break the scan UI.

### CRITICAL: Preserve navigateToView Branching

The `navigateToView` function has 5+ conditional branches checking:
1. Batch mode active → route to batch review
2. History filter pending → initialize history filters
3. Distribution check → analytics routing
4. Default → standard view navigation

Extract verbatim from App.tsx lines ~607-700. Adding or removing conditions will break navigation.

### App.tsx Structure After Refactor

```typescript
// ~15-20 import lines (reduced from 82)
import React, { ... } from 'react';
import { useAppDataHooks } from './app/hooks';
import { AppProviders } from './app/AppProviders';
// ... view components, nav, providers...

function App() {
  const { userContext, transactions, scans, mappings, viewHandlers } = useAppDataHooks();
  const { user, services } = userContext;

  if (!user) return <LoginScreen />;

  // View routing (unchanged) — ~30-40 LOC
  // Return JSX with providers + views + nav — ~40-60 LOC
}
```
Target: 1,200-1,400 LOC (from 2,081).

### Test Strategy

New orchestrators need unit tests. Existing App.tsx tests should continue to pass.
- Add test files: `tests/unit/app/hooks/use*Orchestrator.test.ts`
- Each test: mock all composed hooks, verify orchestrator calls them and returns correct shape
- App.tsx test file: should NOT need updates (props still flow correctly)

## ECC Analysis Summary

- **Risk Level:** HIGH (App.tsx is the highest-coupling file; touches ~1,100 LOC; any behavioral regression affects the whole app)
- **Complexity:** MEDIUM-HIGH (5 orchestrators, each preserving existing logic exactly)
- **Sizing:** 8 tasks / 26 subtasks / 8 new files + 1 modified (within limits: max 8 tasks, max 40 subtasks, max 12 files)
- **Dependencies:** 15b-3g should complete first (HistoryFiltersProvider removal reduces App.tsx complexity)

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial stub (reduce App.tsx from 74 to <30 deps) |
| 2026-02-23 | Full rewrite with codebase research. Confirmed 82 import lines (~62 unique sources). Designed 5 orchestrator clustering strategy. Identified critical preserved logic: setScanImages auto-transition, navigateToView branching. |
