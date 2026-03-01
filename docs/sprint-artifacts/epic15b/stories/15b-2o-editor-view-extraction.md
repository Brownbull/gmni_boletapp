# Story 15b-2o: TransactionEditorViewInternal Further Extraction

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 2 - Decomposition
**Points:** 3
**Priority:** MEDIUM
**Status:** done

## Overview

TransactionEditorViewInternal.tsx is currently 1,423 lines with 33 import dependencies. Epic 15 already extracted 5 sub-files (EditorConfirmationDialogs, EditorItemsSection, EditorScanThumbnail, useCrossStoreSuggestions, useEditorLearningPrompts), reducing it from approximately 2,721 lines. The remaining 1,423 lines contain a 140-line props interface, swipe gesture state and handlers, a 92-line sticky header JSX block, and various original-value-capture effects -- all of which are extractable without behavior change. Target: reduce TransactionEditorViewInternal.tsx to under 1,200 lines.

## Functional Acceptance Criteria

- [x] **AC1:** TransactionEditorViewInternal.tsx reduced to 1,133 lines (from 1,422) — PASS
- [x] **AC2:** Each extracted file is <400 lines (162, 101, 133) — PASS
- [x] **AC3:** All existing tests pass before AND after extraction — PASS (7089 tests)
- [x] **AC4:** No new functionality added -- pure decomposition — PASS
- [x] **AC5:** Fan-out decreased from 33 to 31 — PASS
- [x] **AC6:** `npm run test:quick` passes with 0 failures — PASS (294 files)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** Props/types file at `src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts`
- [x] **AC-ARCH-LOC-2:** Swipe gesture hook at `src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts`
- [x] **AC-ARCH-LOC-3:** Header bar component at `src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx`
- [x] **AC-ARCH-LOC-4:** Swipe gesture hook tests at `tests/unit/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.test.ts`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** All extracted files use `@/` or `@features/` path aliases — zero `../../` imports
- [x] **AC-ARCH-PATTERN-2:** Parent imports via relative `./TransactionEditorView/` paths
- [x] **AC-ARCH-PATTERN-3:** `editorViewTypes.ts` is type-only — no runtime code, no React imports
- [x] **AC-ARCH-PATTERN-4:** `useEditorSwipeGestures.ts` follows hook pattern — `use` prefix, returns state+handlers
- [x] **AC-ARCH-PATTERN-5:** `EditorHeaderBar` is props-only — no store/context access
- [x] **AC-ARCH-PATTERN-6:** Test directory mirrors source structure

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No circular deps — madge confirms zero cycles
- [x] **AC-ARCH-NO-2:** No console.log in extracted files
- [x] **AC-ARCH-NO-3:** No `: any` in extracted files — proper TypeScript types throughout
- [x] **AC-ARCH-NO-4:** No state lifting — only swipe state moved; dialog/editing/overlay state stays in parent
- [x] **AC-ARCH-NO-5:** No barrel modification — index.ts unchanged

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

- [x] 1.1 Run `npm run test:quick` and record total pass count — 293 files, 7077 tests passed
- [x] 1.2 Run `npx vitest run tests/unit/components/App/viewRenderers.test.tsx` and confirm all pass — 49 passed
- [x] 1.3 Run `npx vitest run tests/unit/features/transaction-editor/store/useTransactionEditorStore.test.ts` and confirm all pass — 79 passed
- [x] 1.4 Count current TransactionEditorViewInternal.tsx lines: 1,422
- [x] 1.5 Record current fan-out: 33 import statements

### Task 2: Extract props interface and types into editorViewTypes.ts

- [x] 2.1 Create `src/features/transaction-editor/views/TransactionEditorView/editorViewTypes.ts`
- [x] 2.2 Move the `ScanButtonState` import/re-export
- [x] 2.3 Move `TransactionEditorViewProps` interface (140 lines) with type-only imports (TransactionItem excluded — not used in interface)
- [x] 2.4 Update TransactionEditorViewInternal.tsx with import/re-export from editorViewTypes
- [x] 2.5 Remove type-only imports: Language, UserCredits, ItemNameMapping (verified not used in component body)
- [x] 2.6 Run `npx tsc --noEmit` — passed
- [x] 2.7 Verify shim still compiles — passed

### Task 3: Extract swipe gesture hook into useEditorSwipeGestures.ts

- [x] 3.1 Create `src/features/transaction-editor/views/TransactionEditorView/useEditorSwipeGestures.ts`
- [x] 3.2 Define `UseEditorSwipeGesturesProps` interface
- [x] 3.3 Define `UseEditorSwipeGesturesReturn` interface
- [x] 3.4 Move `swipeTouchStart` + `setSwipeTouchStart` useState to the hook
- [x] 3.5 Move `swipeOffset` + `setSwipeOffset` useState to the hook
- [x] 3.6 Move `fadeInKey` + `setFadeInKey` useState to the hook
- [x] 3.7 Move `prevTransactionIdRef` useRef to the hook
- [x] 3.8 Move transaction-change fade-in useEffect to the hook
- [x] 3.9 Move computed swipe flags to the hook
- [x] 3.10 Move touch handlers to the hook
- [x] 3.11 Return all state values and handlers; export the hook and its types
- [x] 3.12 Update TransactionEditorViewInternal.tsx to use the hook
- [x] 3.13 Run `npx tsc --noEmit` — passed
- [x] 3.14 Create tests with 12 test cases — all passing

### Task 4: Extract EditorHeaderBar component

- [x] 4.1 Create `src/features/transaction-editor/views/TransactionEditorView/EditorHeaderBar.tsx`
- [x] 4.2 Define `EditorHeaderBarProps` interface
- [x] 4.3 Extract sticky header JSX block into EditorHeaderBar
- [x] 4.4 Audit icons: moved Trash2, X, Camera, Zap, Info (header-only); kept ChevronLeft in both files
- [x] 4.5 Move `formatCreditsDisplay` to EditorHeaderBar (header-only usage)
- [x] 4.6 Update TransactionEditorViewInternal.tsx with `<EditorHeaderBar>` component usage
- [x] 4.7 Run `npx tsc --noEmit` — passed

### Task 5: Verify extraction and run full test suite

- [x] 5.1 Final line count: 1,133 (target: <1,200) — PASS
- [x] 5.2 All extracted files <400 lines: editorViewTypes.ts=162, useEditorSwipeGestures.ts=101, EditorHeaderBar.tsx=133 — PASS
- [x] 5.3 No `../../` imports in extracted files — PASS
- [x] 5.4 No circular deps — PASS
- [x] 5.5 test:quick: 294 files passed, 7089 tests passed — PASS
- [x] 5.6 viewRenderers.test.tsx: 49 passed — PASS
- [x] 5.7 Final import count: 31 (was 33) — PASS

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
| 2026-02-27 | ECC re-creation validation: All extraction targets confirmed. Import count 33 confirmed. No corrections needed. Status: ready-for-dev. |
| 2026-02-27 | ECC Code Review: APPROVE 9.25/10. Agents: code-reviewer + security-reviewer. 1 quick fix (removed unused readOnly prop from EditorHeaderBar). 0 TD stories created. All 11 architectural ACs validated. 294 files / 7089 tests green. |

## Senior Developer Review (ECC)

- **Date:** 2026-02-27
- **Agents:** code-reviewer, security-reviewer (STANDARD classification)
- **Outcome:** APPROVE 9.25/10
- **Quick Fixes:** 1 (removed unused `readOnly` prop from `EditorHeaderBarProps`)
- **TD Stories:** 0 (pre-existing `value: any` debt already partially tracked by TD-15b-5)
- **Architectural ACs:** 11/11 PASS (4 location, 6 pattern, 5 anti-pattern)
- **Tests:** 294 files, 7089 tests passed
