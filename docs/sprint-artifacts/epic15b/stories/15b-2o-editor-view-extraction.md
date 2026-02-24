# Story 15b-2o: TransactionEditorViewInternal Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Overview

TransactionEditorViewInternal.tsx is currently 1,423 lines with 33 import dependencies. Epic 15 already extracted 5 sub-files (EditorConfirmationDialogs, EditorItemsSection, EditorScanThumbnail, useCrossStoreSuggestions, useEditorLearningPrompts), reducing it from approximately 2,721 lines. The remaining 1,423 lines contain a 140-line props interface, swipe gesture state and handlers, a 92-line sticky header JSX block, and various original-value-capture effects -- all of which are extractable without behavior change. Target: reduce TransactionEditorViewInternal.tsx to under 1,200 lines.

## Functional Acceptance Criteria

- [ ] **AC1:** TransactionEditorViewInternal.tsx reduced to <1,200 lines (from 1,423)
- [ ] **AC2:** Each extracted file is <400 lines
- [ ] **AC3:** All existing tests pass before AND after extraction (including `tests/unit/components/App/viewRenderers.test.tsx` and `tests/unit/features/transaction-editor/store/useTransactionEditorStore.test.ts`)
- [ ] **AC4:** No new functionality added -- pure decomposition
- [ ] **AC5:** Fan-out of TransactionEditorViewInternal.tsx decreased from 33
- [ ] **AC6:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** Props/types file at `src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts`
- [ ] **AC-ARCH-LOC-2:** Swipe gesture hook at `src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts`
- [ ] **AC-ARCH-LOC-3:** Header bar component at `src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx`
- [ ] **AC-ARCH-LOC-4:** Swipe gesture hook tests at `tests/unit/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.test.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases for external imports -- zero `../../` relative imports
- [ ] **AC-ARCH-PATTERN-2:** TransactionEditorViewInternal.tsx imports extracted modules via relative `./TransactionEditorView/` paths (same as existing sub-files)
- [ ] **AC-ARCH-PATTERN-3:** `editorViewTypes.ts` contains ONLY `interface`, `type`, and re-export statements -- no runtime code, no React imports, no hooks
- [ ] **AC-ARCH-PATTERN-4:** `useEditorSwipeGestures.ts` follows React custom hook pattern (function name starts with `use`, returns object with state values and handlers)
- [ ] **AC-ARCH-PATTERN-5:** `EditorHeaderBar` accepts all data and callbacks as props -- no direct store access or context consumption
- [ ] **AC-ARCH-PATTERN-6:** Test directory mirrors source: `tests/unit/features/transaction-editor/views/TransactionEditorView/`

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency -- extracted files must NOT import from `@features/transaction-editor` barrel or `@features/transaction-editor/views` barrel (index.ts)
- [ ] **AC-ARCH-NO-2:** No new `console.log` statements in extracted files
- [ ] **AC-ARCH-NO-3:** No `: any` types in extracted files -- use proper TypeScript types (note: `handleUpdateItem` in TransactionEditorViewInternal.tsx already has `value: any` -- do NOT copy that pattern into extracted files)
- [ ] **AC-ARCH-NO-4:** No state lifting -- only swipe-specific state moves to the hook; dialog visibility state, editing state, and category overlay state stay in TransactionEditorViewInternal
- [ ] **AC-ARCH-NO-5:** No feature barrel modification -- `src/features/transaction-editor/views/TransactionEditorView/index.ts` continues to export only TransactionEditorView, useTransactionEditorData, and useTransactionEditorHandlers

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| TransactionEditorViewInternal.tsx | `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | Reduce from 1,423 to ~1,130 lines; import types from `editorViewTypes.ts`, swipe hook from `useEditorSwipeGestures.ts`, and header component from `EditorHeaderBar.tsx` |

### New Files

| File/Component | Exact Path | Pattern | Est. Lines |
|----------------|------------|---------|------------|
| editorViewTypes.ts | `src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts` | Type-only module | ~160 |
| useEditorSwipeGestures.ts | `src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts` | Custom hook | ~100 |
| EditorHeaderBar.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx` | React FC sub-component | ~120 |
| useEditorSwipeGestures.test.ts | `tests/unit/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.test.ts` | Hook test (renderHook) | ~120 |

### Unchanged Files (verified no modification needed)

| File | Exact Path | Reason |
|------|------------|--------|
| index.ts | `src/features/transaction-editor/views/TransactionEditorView/index.ts` | Sub-files are internal; barrel stays unchanged |
| TransactionEditorViewWrapper.tsx | `src/features/transaction-editor/views/TransactionEditorView/TransactionEditorViewWrapper.tsx` | Imports from `../TransactionEditorViewInternal` -- path unchanged |
| EditorConfirmationDialogs.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorConfirmationDialogs.tsx` | Already extracted in Epic 15; no changes |
| EditorItemsSection.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx` | Already extracted in Epic 15; no changes |
| EditorScanThumbnail.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorScanThumbnail.tsx` | Already extracted in Epic 15; no changes |
| useCrossStoreSuggestions.ts | `src/features/transaction-editor/views/TransactionEditorView/useCrossStoreSuggestions.ts` | Already extracted in Epic 15; no changes |
| useEditorLearningPrompts.ts | `src/features/transaction-editor/views/TransactionEditorView/useEditorLearningPrompts.ts` | Already extracted in Epic 15; no changes |
| viewRenderers.test.tsx | `tests/unit/components/App/viewRenderers.test.tsx` | Tests interact via wrapper public API; no change needed |
| shim | `src/views/TransactionEditorViewInternal.tsx` | Re-export shim from Story 15b-1c; unchanged |

## Tasks / Subtasks

### Task 1: Establish baseline

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 Run `npx vitest run tests/unit/components/App/viewRenderers.test.tsx` and confirm all pass
- [ ] 1.3 Run `npx vitest run tests/unit/features/transaction-editor/store/useTransactionEditorStore.test.ts` and confirm all pass
- [ ] 1.4 Count current TransactionEditorViewInternal.tsx lines: `wc -l src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` (expect 1,423)
- [ ] 1.5 Record current fan-out: count import statements in TransactionEditorViewInternal.tsx (expect ~33)

### Task 2: Extract props interface and types into editorViewTypes.ts

- [ ] 2.1 Create `src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts`
- [ ] 2.2 Move the `ScanButtonState` import/re-export (lines 109-110): `import type { ScanButtonState } from '@/shared/utils/scanHelpers'; export type { ScanButtonState };`
- [ ] 2.3 Move `TransactionEditorViewProps` interface (~140 lines) into the new file, adding necessary type-only imports: `Transaction`, `TransactionItem`, `StoreCategory`, `ItemCategory` from `@/types/transaction`; `UserCredits` from `@/types/scan`; `Language` from `@/utils/translations`; `ItemNameMapping` from `@/types/itemNameMapping`; `ScanButtonState` from `@/shared/utils/scanHelpers`
- [ ] 2.4 Update TransactionEditorViewInternal.tsx: replace the inline interface with `import type { TransactionEditorViewProps, ScanButtonState } from './TransactionEditorView/editorViewTypes'` and `export type { TransactionEditorViewProps, ScanButtonState } from './TransactionEditorView/editorViewTypes'`
- [ ] 2.5 Remove type-only imports from TransactionEditorViewInternal.tsx that are no longer needed after the move -- verify `Language`, `UserCredits`, `ItemNameMapping` are not used in the component body before removing them
- [ ] 2.6 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 2.7 Verify `src/views/TransactionEditorViewInternal.tsx` shim still compiles (re-exports `TransactionEditorViewProps` and `ScanButtonState`)

### Task 3: Extract swipe gesture hook into useEditorSwipeGestures.ts

- [ ] 3.1 Create `src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts`
- [ ] 3.2 Define `UseEditorSwipeGesturesProps` interface: `batchContext: { index: number; total: number } | null`, `onBatchPrevious?: () => void`, `onBatchNext?: () => void`, `transactionId?: string`
- [ ] 3.3 Define `UseEditorSwipeGesturesReturn` interface: `swipeOffset: number`, `swipeTouchStart: number | null`, `fadeInKey: number`, `handleSwipeTouchStart: (e: React.TouchEvent) => void`, `handleSwipeTouchMove: (e: React.TouchEvent) => void`, `handleSwipeTouchEnd: () => void`
- [ ] 3.4 Move `swipeTouchStart` + `setSwipeTouchStart` useState to the hook
- [ ] 3.5 Move `swipeOffset` + `setSwipeOffset` useState to the hook
- [ ] 3.6 Move `fadeInKey` + `setFadeInKey` useState to the hook
- [ ] 3.7 Move `prevTransactionIdRef` useRef to the hook
- [ ] 3.8 Move transaction-change fade-in useEffect to the hook
- [ ] 3.9 Move computed swipe flags: `canSwipePrevious`, `canSwipeNext`, `canSwipe`, `minSwipeDistance` to the hook
- [ ] 3.10 Move `handleSwipeTouchStart`, `handleSwipeTouchMove`, `handleSwipeTouchEnd` useCallbacks to the hook
- [ ] 3.11 Return all state values and handlers; export the hook and its types
- [ ] 3.12 Update TransactionEditorViewInternal.tsx: import and call `useEditorSwipeGestures({ batchContext, onBatchPrevious, onBatchNext, transactionId: transaction?.id })` and destructure returned values
- [ ] 3.13 Run `npx tsc --noEmit` -- fix any type errors
- [ ] 3.14 Create `tests/unit/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.test.ts` with renderHook tests for: initial state (offset=0, fadeInKey=0), touchStart/move/end gesture simulation, swipe-left triggers onBatchNext, swipe-right triggers onBatchPrevious, resistance when swiping past boundaries, no-op when batchContext is null, fadeInKey increments on transactionId change

### Task 4: Extract EditorHeaderBar component

- [ ] 4.1 Create `src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx`
- [ ] 4.2 Define `EditorHeaderBarProps` interface: `mode: 'new' | 'existing'`, `readOnly: boolean`, `transactionId?: string`, `credits: UserCredits`, `onCancelClick: () => void`, `onDeleteClick: () => void`, `onCreditInfoClick: () => void`, `t: (key: string) => string`
- [ ] 4.3 Extract the sticky header JSX block (the `<div className="sticky px-4">` containing the back button, title `<h1>`, credit badges section, and close/delete button) into the new component
- [ ] 4.4 Audit lucide-react icon imports: only move icons that are exclusively used in the header; leave shared icons (`ChevronLeft` is also used in batch counter -- keep in parent too) in TransactionEditorViewInternal.tsx
- [ ] 4.5 Move `formatCreditsDisplay` import to EditorHeaderBar if only used in the header
- [ ] 4.6 Update TransactionEditorViewInternal.tsx: replace the sticky header `<div>` with `<EditorHeaderBar mode={mode} readOnly={readOnly} credits={credits} onCancelClick={handleCancelClick} onDeleteClick={() => setShowDeleteConfirm(true)} onCreditInfoClick={openCreditInfoModal} t={t} />`
- [ ] 4.7 Run `npx tsc --noEmit` -- fix any type errors

### Task 5: Verify extraction and run full test suite

- [ ] 5.1 Count final TransactionEditorViewInternal.tsx lines: `wc -l src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` (target: <1,200)
- [ ] 5.2 Verify all extracted files are <400 lines each
- [ ] 5.3 Verify no `../../` imports in extracted files: `grep -rE "from '\.\./\.\." src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx` returns 0
- [ ] 5.4 Verify no circular deps: `npx madge --circular src/features/transaction-editor/views/TransactionEditorView/`
- [ ] 5.5 Run `npm run test:quick` -- all tests pass
- [ ] 5.6 Run `npx vitest run tests/unit/components/App/viewRenderers.test.tsx` -- all pass
- [ ] 5.7 Record final import count in TransactionEditorViewInternal.tsx -- must be lower than 33

## Dev Notes

### Architecture Guidance

**Extraction 1 -- editorViewTypes.ts:** The `TransactionEditorViewProps` interface is 140 lines of pure type definitions with JSDoc comments. It has no runtime behavior and is imported by the wrapper (`TransactionEditorViewWrapper.tsx`) via the barrel, the shim (`src/views/TransactionEditorViewInternal.tsx`), and the internal view itself. After extraction, TransactionEditorViewInternal.tsx re-exports the types so the shim and barrel continue to work. Verify before removing that `Language`, `UserCredits`, and `ItemNameMapping` imports are not used in the component body itself -- `Language` appears on several lines for translation; only remove imports that were solely referenced in the props interface.

**Extraction 2 -- useEditorSwipeGestures hook:** This hook encapsulates the batch navigation swipe gesture state machine: touch start/move/end handlers, swipe offset for CSS transforms, and the fade-in animation key that increments on transaction changes. The hook is self-contained -- it receives `batchContext`, `onBatchPrevious`, `onBatchNext`, and `transactionId` as props and returns all state and handlers. The calling code uses `swipeOffset` and `swipeTouchStart` in the main content `<div>` for inline style calculations (transform, opacity, transition). The `fadeInKey` is used as a React `key` prop on the same `<div>` to trigger CSS fade-in animation on transaction navigation.

**Extraction 3 -- EditorHeaderBar component:** The sticky header is a self-contained presentation block. It shows the back button, page title, credit badges, and a context-dependent close/delete button. All data is passed as props; no state mutation occurs inside the header. The `openCreditInfoModal` lambda is constructed in the parent using `useModalActions` -- pass it as an `onCreditInfoClick` prop. After extraction, TransactionEditorViewInternal.tsx may no longer need `formatCreditsDisplay`, `Zap`, `Camera`, `Info`, or `X` icon imports if they are not used elsewhere -- audit carefully before removing.

### Critical Pitfalls

1. **React hook call order:** The swipe gesture hook must be called unconditionally in TransactionEditorViewInternal.tsx. Place the `useEditorSwipeGestures()` call adjacent to the existing `useCrossStoreSuggestions()` and `useEditorLearningPrompts()` calls. Since hooks extracted to a custom hook do not change the parent's hook call order, this is safe.

2. **ScanButtonState re-export chain:** The file currently has both `import type { ScanButtonState }` and `export type { ScanButtonState }`. After moving to `editorViewTypes.ts`, the parent file must re-export: `export type { ScanButtonState } from './TransactionEditorView/editorViewTypes'`. The shim at `src/views/TransactionEditorViewInternal.tsx` imports `ScanButtonState` from the parent, so the chain must remain intact.

3. **Batch counter shares ChevronLeft with header:** Both the sticky header back button and the batch counter previous button use `ChevronLeft`. After extracting the header to `EditorHeaderBar`, keep `ChevronLeft` import in both files -- `ChevronLeft` must remain in TransactionEditorViewInternal.tsx for the batch counter section.

4. **Icon audit before removing imports:** Before removing any lucide-react icon from TransactionEditorViewInternal.tsx, grep the JSX (lines 791-1419) for each icon name. Icons like `Trash2`, `Check`, `ChevronDown`, `ChevronUp`, `BookMarked`, `Pencil`, `Layers`, `Receipt` are used in the metadata/items/footer sections that stay in the parent file.

5. **`UserCredits` type in EditorHeaderBar props:** The header displays `credits.remaining` and `credits.superRemaining`. `EditorHeaderBar` needs `UserCredits` type from `@/types/scan` as a type-only import.

6. **Pre-existing `value: any` on handleUpdateItem:** This is a pre-existing code smell, not introduced by this story. Do NOT attempt to fix it during decomposition -- it should be addressed in a separate tech debt story.

## ECC Analysis Summary

- **Risk Level:** LOW (plateaued view, 5 prior extractions, pure decomposition)
- **Complexity:** Moderate -- 3 extractions (1 types file, 1 custom hook, 1 sub-component), 1 new test file
- **Sizing:** 5 tasks / 22 subtasks / 5 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** None -- TransactionEditorViewInternal is self-contained; all 5 existing sub-files remain unchanged

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft |
| 2026-02-23 | Full rewrite. Source analysis of TransactionEditorViewInternal.tsx (1,423 lines, 33 imports, 5 existing sub-files from Epic 15 Story 15-5d). 3 extraction targets: editorViewTypes.ts (~160L types), useEditorSwipeGestures.ts (~100L hook), EditorHeaderBar.tsx (~120L sub-component). Target residual: ~1,130 lines. 10 architectural ACs, 5 tasks, 22 subtasks, 5 files. |
