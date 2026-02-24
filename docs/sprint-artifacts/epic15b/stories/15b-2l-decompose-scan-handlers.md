# Story 15b-2l: Decompose useScanHandlers.ts

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Overview

Decompose `useScanHandlers.ts` (957 lines, 7 local type definitions, 16 handler/utility functions) into smaller focused files. The file is dominated by two extractable blocks: a 181-line type definitions section and a 173-line scan flow routing pair (`continueScanWithTransaction` + `proceedAfterCurrencyResolved`). Extracting these two blocks into `scanHandlerTypes.ts` and `useScanFlowRouter.ts` reduces the main file to approximately 600 lines, well under the 800-line limit. This is a PURE DECOMPOSITION -- no new features, no behavior changes.

## Functional Acceptance Criteria

- [ ] **AC1:** `useScanHandlers.ts` reduced to <800 lines (from 957)
- [ ] **AC2:** Each extracted file is <400 lines
- [ ] **AC3:** Behavior snapshot: all existing tests pass before AND after extraction (including `tests/unit/features/scan/hooks/useScanHandlers.test.ts`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** The `UseScanHandlersResult` return type remains unchanged -- consumers see the same API
- [ ] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Type definitions at `src/features/scan/hooks/scanHandlerTypes.ts`
- [ ] **AC-ARCH-LOC-2:** Flow routing sub-hook at `src/features/scan/hooks/useScanFlowRouter.ts`
- [ ] **AC-ARCH-LOC-3:** Flow router tests at `tests/unit/features/scan/hooks/useScanFlowRouter.test.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [ ] **AC-ARCH-PATTERN-2:** `useScanHandlers.ts` imports extracted modules via relative `./` paths (same directory)
- [ ] **AC-ARCH-PATTERN-3:** `scanHandlerTypes.ts` contains ONLY type definitions, interfaces, and type re-exports -- no runtime code, no React imports
- [ ] **AC-ARCH-PATTERN-4:** `useScanFlowRouter.ts` follows React custom hook pattern (function name starts with `use`, returns object with handlers)
- [ ] **AC-ARCH-PATTERN-5:** `useScanFlowRouter` receives its dependencies via a props object -- NOT via context or store access
- [ ] **AC-ARCH-PATTERN-6:** The barrel export at `src/features/scan/hooks/index.ts` continues to export `useScanHandlers`, `UseScanHandlersProps`, and `UseScanHandlersResult` -- sub-files are internal implementation details

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- `useScanFlowRouter.ts` must NOT import from `./useScanHandlers` or from `@features/scan/hooks` barrel
- [ ] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files (existing `console.error` and `console.warn` are preserved as-is)
- [ ] **AC-ARCH-NO-3:** No `: any` types in new files -- the 2 existing `eslint-disable` for `: any` in `UseScanHandlersProps` stay in `scanHandlerTypes.ts`
- [ ] **AC-ARCH-NO-4:** No hook call order changes -- `useCallback` calls in `useScanHandlers` that depend on `useScanFlowRouter` outputs must appear AFTER the `useScanFlowRouter()` call
- [ ] **AC-ARCH-NO-5:** No barrel modification -- `src/features/scan/hooks/index.ts` does NOT export `useScanFlowRouter` or `scanHandlerTypes` (they are internal)

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| useScanHandlers.ts | `src/features/scan/hooks/useScanHandlers.ts` | Reduce from 957 to ~600 lines; import types from `./scanHandlerTypes`, call `useScanFlowRouter()` |
| hooks barrel | `src/features/scan/hooks/index.ts` | No change (verify only) |
| re-export shim | `src/hooks/app/useScanHandlers.ts` | No change (verify only) |

### New Files

| File/Component | Exact Path | Pattern | Est. Lines |
|----------------|------------|---------|------------|
| scanHandlerTypes.ts | `src/features/scan/hooks/scanHandlerTypes.ts` | Type-only module | ~185 |
| useScanFlowRouter.ts | `src/features/scan/hooks/useScanFlowRouter.ts` | Custom sub-hook | ~195 |
| useScanFlowRouter.test.ts | `tests/unit/features/scan/hooks/useScanFlowRouter.test.ts` | Hook test (renderHook) | ~250 |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/features/scan/hooks/useScanHandlers.test.ts` and confirm all pass
- [ ] 1.3 Count current lines: `wc -l src/features/scan/hooks/useScanHandlers.ts` (expect 957)
- [ ] 1.4 Verify no circular deps in scan hooks: `npx madge --circular src/features/scan/hooks/`

### Task 2: Extract type definitions into scanHandlerTypes.ts

- [ ] 2.1 Create `src/features/scan/hooks/scanHandlerTypes.ts`
- [ ] 2.2 Move `BatchSession` interface
- [ ] 2.3 Move `ItemNameMapping` interface
- [ ] 2.4 Move `ItemNameMatchResult` interface
- [ ] 2.5 Move `SessionContextData` interface
- [ ] 2.6 Move `ScanOverlayState` interface
- [ ] 2.7 Move `UseScanHandlersProps` interface with its doc comment (including the 2 existing `eslint-disable` comments)
- [ ] 2.8 Move `UseScanHandlersResult` interface with its doc comment
- [ ] 2.9 Add necessary type imports to `scanHandlerTypes.ts`: `User` from `firebase/auth`, `Firestore` from `firebase/firestore`, `Transaction`/`TransactionItem` from `@/types/transaction`, `UserPreferences` from `@/services/userPreferencesService`, `Insight`/`UserInsightProfile`/`LocalInsightCache` from `@/types/insight`, `View` from `@app/types`, `TrustPromptEligibility` from `@/types/trust`, dialog types from `@/types/scanStateMachine`, `ToastMessage` from `@/shared/hooks`
- [ ] 2.10 Update `useScanHandlers.ts`: replace inline types with `import type { ... } from './scanHandlerTypes'`
- [ ] 2.11 Run `npx tsc --noEmit` -- fix any type errors

### Task 3: Extract flow routing into useScanFlowRouter.ts

- [ ] 3.1 Create `src/features/scan/hooks/useScanFlowRouter.ts`
- [ ] 3.2 Define `UseScanFlowRouterProps` interface with the subset of props needed: `user`, services, `userPreferences`, `categoryMappings`, `findMerchantMatch`, `applyCategoryMappings`, `applyItemNameMappings` (passed as callback), `incrementMappingUsage`, `incrementMerchantMappingUsage`, `incrementItemNameMappingUsage`, `checkTrusted`, `dispatchProcessSuccess`, `showScanDialog`, `setCurrentTransaction`, `setToastMessage`, `setView`, `setSkipScanCompleteModal`, `setAnimateEditViewItems`, `t`
- [ ] 3.3 Move `continueScanWithTransaction` handler into the new hook
- [ ] 3.4 Move `proceedAfterCurrencyResolved` handler into the new hook
- [ ] 3.5 Add imports for scan state machine types, confidence check utils, and firestore services as needed
- [ ] 3.6 Return `{ continueScanWithTransaction, proceedAfterCurrencyResolved }` from the hook
- [ ] 3.7 Update `useScanHandlers.ts`: call `useScanFlowRouter()` at the correct position (after `applyItemNameMappings` useCallback, before currency/total mismatch handlers) and destructure results
- [ ] 3.8 Run `npx tsc --noEmit` -- fix any type errors

### Task 4: Add tests for useScanFlowRouter

- [ ] 4.1 Create `tests/unit/features/scan/hooks/useScanFlowRouter.test.ts`
- [ ] 4.2 Create `createDefaultFlowRouterProps()` factory matching `UseScanFlowRouterProps`
- [ ] 4.3 Test `continueScanWithTransaction`: applies category mappings, applies merchant mappings, applies item name mappings, checks currency mismatch, shows quick save dialog, auto-saves for trusted merchants, falls through to edit view for low confidence
- [ ] 4.4 Test `proceedAfterCurrencyResolved`: trusted merchant auto-save, quick save dialog, edit view fallback
- [ ] 4.5 Run `npx vitest run tests/unit/features/scan/hooks/useScanFlowRouter.test.ts` -- all pass

### Task 5: Verify extraction and run full test suite

- [ ] 5.1 Count final `useScanHandlers.ts` lines: `wc -l src/features/scan/hooks/useScanHandlers.ts` (target: <800)
- [ ] 5.2 Verify all new files are <400 lines each
- [ ] 5.3 Verify no `../../` imports: `grep -rE "from '\.\./\.\." src/features/scan/hooks/scanHandlerTypes.ts src/features/scan/hooks/useScanFlowRouter.ts` returns 0
- [ ] 5.4 Verify no circular deps: `npx madge --circular src/features/scan/hooks/`
- [ ] 5.5 Run `npx vitest run tests/unit/features/scan/hooks/useScanHandlers.test.ts` -- all pass unchanged
- [ ] 5.6 Run `npm run test:quick` -- all tests pass

## Dev Notes

### Architecture Guidance

**Why extract types separately:** The type definitions block (lines 79-314) is 236 lines of pure type code. Extracting it into `scanHandlerTypes.ts` is zero-risk (no runtime behavior), saves ~180 lines, and makes the types independently importable by the new sub-hook without circular imports.

**Why extract flow routing:** `continueScanWithTransaction` (124 lines) orchestrates: category mapping application, merchant mapping application, item name mapping application, currency mismatch detection, trusted merchant auto-save, and quick save dialog display. Its companion `proceedAfterCurrencyResolved` (49 lines) duplicates the routing decision tree but skips mapping application. Together they form a cohesive "scan flow router" concept that is cleanly separable.

**`applyItemNameMappings` dependency:** The `useScanFlowRouter` hook needs `applyItemNameMappings` which is a `useCallback` defined in `useScanHandlers`. Pass it as a prop callback to `useScanFlowRouter` rather than duplicating the logic. This means `useScanFlowRouter()` must be called AFTER the `applyItemNameMappings` useCallback in `useScanHandlers`.

### Critical Pitfalls

1. **Hook call order matters:** After extraction, the `useScanFlowRouter()` call must appear AFTER the `applyItemNameMappings` useCallback but BEFORE the currency/total mismatch handlers that depend on `continueScanWithTransaction`. Insert at approximately the position after the utility wrappers section.

2. **Duplicated routing logic:** `continueScanWithTransaction` and `proceedAfterCurrencyResolved` share identical trusted-merchant/quick-save/edit-view routing logic. Do NOT DRY this during decomposition -- that would be a behavior change. Extract both functions as-is.

3. **Existing eslint-disable comments:** `UseScanHandlersProps` has 2 `eslint-disable-next-line @typescript-eslint/no-explicit-any` comments. These must transfer to `scanHandlerTypes.ts` as-is. Do not remove them.

4. **console.error in catch blocks:** Both extracted functions contain `console.error` calls in catch blocks. These are existing error logging and must be preserved. The pre-edit hook warns on `console.log` but not `console.error`.

5. **Test file stays unchanged:** The existing `useScanHandlers.test.ts` (1,279 lines) tests the public API. Since `UseScanHandlersResult` does not change, all existing tests pass without modification. Do NOT split or modify the existing test file.

6. **Re-export shim:** `src/hooks/app/useScanHandlers.ts` re-exports from `@features/scan/hooks/useScanHandlers`. Since the barrel is unchanged, this shim continues to work.

### What stays in useScanHandlers.ts (after extraction ~600 lines)

- File header comment + imports
- `useScanHandlers` function with props destructuring
- Utility wrappers: `applyItemNameMappings`, `reconcileItemsTotal`
- `useScanFlowRouter()` call + destructuring
- Scan overlay handlers: `handleScanOverlayCancel`, `handleScanOverlayRetry`, `handleScanOverlayDismiss`
- Quick save handlers: `handleQuickSaveComplete`, `handleQuickSave`, `handleQuickSaveEdit`, `handleQuickSaveCancel`
- Currency mismatch handlers: `handleCurrencyUseDetected`, `handleCurrencyUseDefault`, `handleCurrencyMismatchCancel`
- Total mismatch handlers: `handleTotalUseItemsSum`, `handleTotalKeepOriginal`, `handleTotalMismatchCancel`
- Return useMemo

## ECC Analysis Summary

- **Risk Level:** LOW (pure type extraction + sub-hook extraction; public API unchanged; comprehensive existing test suite)
- **Complexity:** Low-moderate -- 2 extractions (types + sub-hook), prop interface design for sub-hook
- **Sizing:** 5 tasks / 22 subtasks / 6 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- `useScanHandlers.ts` is self-contained within `features/scan/hooks/`

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial stub draft |
| 2026-02-23 | Full rewrite. Source analysis of useScanHandlers.ts (957 lines). 2 extraction targets: scanHandlerTypes.ts (~185L type definitions), useScanFlowRouter.ts (~195L flow routing sub-hook). Target residual: ~600 lines. 15 architectural ACs, 5 tasks, 22 subtasks, 6 files. Identified hook call order constraint and duplicated routing logic as critical pitfalls. |
