# Story 15b-1c: Consolidate features/transaction-editor/

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Move TransactionEditorView directory (9 files, ~3,080 lines), TransactionEditorViewInternal.tsx (1,422 lines), EditView.tsx (1,811 lines), and useActiveTransaction.ts (537 lines) into `features/transaction-editor/`. The feature already has 5 files (541 lines) containing the Zustand store, types, and barrel — this story adds the views and hooks layers. Create re-export shims at old locations for backward compatibility. Follows the shim-based pattern from 15b-1a and 15b-1b.

**Key corrections from draft:**
- `useTransactionEditorHandlers.ts` is NOT in `src/hooks/` — it's inside `src/views/TransactionEditorView/` and moves with the directory
- Only `useActiveTransaction.ts` moves from `src/hooks/` (editor-scoped, currently unused but planned)
- App-level hooks (`useTransactionHandlers`, `useScanHandlers`, `useNavigationHandlers`) are shared — do NOT move
- TransactionEditorView/ has 9 files (not 8)
- Re-sized from 2 pts to 3 pts due to 19 files touched and extensive import rewiring on large files

## Functional Acceptance Criteria

- [ ] **AC1:** TransactionEditorView/ directory (9 files) moved into `features/transaction-editor/views/TransactionEditorView/`
- [ ] **AC2:** TransactionEditorViewInternal.tsx moved into `features/transaction-editor/views/`
- [ ] **AC3:** EditView.tsx moved into `features/transaction-editor/views/`
- [ ] **AC4:** useActiveTransaction.ts moved from `src/hooks/` into `features/transaction-editor/hooks/`
- [ ] **AC5:** All `../../` and `../` relative imports in moved files converted to `@/` path aliases
- [ ] **AC6:** Re-export shims at all 4 old locations for backward compatibility
- [ ] **AC7:** `npm run test:quick` passes with 0 failures
- [ ] **AC8:** Feature barrel `src/features/transaction-editor/index.ts` updated with views and hooks exports

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** All 9 TransactionEditorView source modules located under `src/features/transaction-editor/views/TransactionEditorView/`
- [ ] **AC-ARCH-LOC-2:** TransactionEditorViewInternal.tsx at `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx`
- [ ] **AC-ARCH-LOC-3:** EditView.tsx at `src/features/transaction-editor/views/EditView.tsx`
- [ ] **AC-ARCH-LOC-4:** useActiveTransaction.ts at `src/features/transaction-editor/hooks/useActiveTransaction.ts`
- [ ] **AC-ARCH-LOC-5:** Views sub-barrel at `src/features/transaction-editor/views/index.ts`
- [ ] **AC-ARCH-LOC-6:** Hooks sub-barrel at `src/features/transaction-editor/hooks/index.ts`
- [ ] **AC-ARCH-LOC-7:** Barrel shim at `src/views/TransactionEditorView/index.ts`
- [ ] **AC-ARCH-LOC-8:** Shim at `src/views/TransactionEditorViewInternal.tsx`
- [ ] **AC-ARCH-LOC-9:** Shim at `src/views/EditView.tsx`
- [ ] **AC-ARCH-LOC-10:** Shim at `src/hooks/useActiveTransaction.ts`
- [ ] **AC-ARCH-LOC-11:** No source files remain at old locations except the 4 shim files (+ empty old TransactionEditorView/ directory for barrel shim)

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** FSD barrel chain — `features/transaction-editor/index.ts` → `views/index.ts` + `hooks/index.ts` (extends existing store barrel)
- [ ] **AC-ARCH-PATTERN-2:** Re-export shims at all 4 old locations — 5 external consumers resolved without modification
- [ ] **AC-ARCH-PATTERN-3:** All moved source files use `@/` aliases for external imports — zero `../../` or `../` relative imports to outside the feature
- [ ] **AC-ARCH-PATTERN-4:** Internal `./` imports within TransactionEditorView directory preserved
- [ ] **AC-ARCH-PATTERN-5:** Wrapper → Internal relative import (`../TransactionEditorViewInternal`) preserved after move (same relative position)
- [ ] **AC-ARCH-PATTERN-6:** Existing store files (`store/`) untouched — no changes to working code

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No circular dependency — moved views must NOT import from `@features/transaction-editor` barrel (use direct `./` paths or `@/` for external)
- [ ] **AC-ARCH-NO-2:** No stale imports — `grep -rE "from '(\.\./){2,}" src/features/transaction-editor/views/` returns 0
- [ ] **AC-ARCH-NO-3:** Shim files contain ONLY export/re-export statements — no business logic
- [ ] **AC-ARCH-NO-4:** App-level hooks (`useTransactionHandlers`, `useScanHandlers`, `useNavigationHandlers`) must NOT be moved
- [ ] **AC-ARCH-NO-5:** No behavior changes — pure structural refactoring; zero function/prop/return type changes
- [ ] **AC-ARCH-NO-6:** Existing feature store tests (`tests/unit/features/transaction-editor/`) must not break

## File Specification

### Target Directory Structure

```
src/features/transaction-editor/
  index.ts                              # MODIFY — add views + hooks exports
  store/                                # EXISTING — unchanged
    index.ts
    useTransactionEditorStore.ts
    selectors.ts
    types.ts
  views/                                # NEW directory
    index.ts                            # NEW — views sub-barrel
    TransactionEditorView/              # MOVED from src/views/TransactionEditorView/
      index.ts                          # MOVED
      TransactionEditorViewWrapper.tsx  # MOVED + MODIFIED (fix ../../ imports)
      useTransactionEditorData.ts       # MOVED + MODIFIED
      useTransactionEditorHandlers.ts   # MOVED + MODIFIED
      EditorScanThumbnail.tsx           # MOVED + MODIFIED
      EditorConfirmationDialogs.tsx     # MOVED
      EditorItemsSection.tsx            # MOVED + MODIFIED
      useCrossStoreSuggestions.ts       # MOVED + MODIFIED
      useEditorLearningPrompts.ts       # MOVED + MODIFIED
    TransactionEditorViewInternal.tsx    # MOVED + MODIFIED (fix ../imports)
    EditView.tsx                         # MOVED + MODIFIED (fix ../imports)
  hooks/                                # NEW directory
    index.ts                            # NEW — hooks sub-barrel
    useActiveTransaction.ts             # MOVED + MODIFIED

src/views/
  TransactionEditorView/
    index.ts                            # REPLACED — re-export shim
  TransactionEditorViewInternal.tsx     # REPLACED — re-export shim
  EditView.tsx                          # REPLACED — re-export shim
src/hooks/
  useActiveTransaction.ts               # REPLACED — re-export shim
```

### File Action Table

| File/Component | Exact Path | Action | AC Reference |
|----------------|------------|--------|--------------|
| TEV Barrel | `src/features/transaction-editor/views/TransactionEditorView/index.ts` | MOVE | AC-ARCH-LOC-1 |
| TransactionEditorViewWrapper.tsx | `src/features/transaction-editor/views/TransactionEditorView/TransactionEditorViewWrapper.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useTransactionEditorData.ts | `src/features/transaction-editor/views/TransactionEditorView/useTransactionEditorData.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useTransactionEditorHandlers.ts | `src/features/transaction-editor/views/TransactionEditorView/useTransactionEditorHandlers.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| EditorScanThumbnail.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorScanThumbnail.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| EditorConfirmationDialogs.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorConfirmationDialogs.tsx` | MOVE | AC-ARCH-LOC-1 |
| EditorItemsSection.tsx | `src/features/transaction-editor/views/TransactionEditorView/EditorItemsSection.tsx` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useCrossStoreSuggestions.ts | `src/features/transaction-editor/views/TransactionEditorView/useCrossStoreSuggestions.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| useEditorLearningPrompts.ts | `src/features/transaction-editor/views/TransactionEditorView/useEditorLearningPrompts.ts` | MOVE + MODIFY | AC-ARCH-LOC-1 |
| TransactionEditorViewInternal.tsx | `src/features/transaction-editor/views/TransactionEditorViewInternal.tsx` | MOVE + MODIFY | AC-ARCH-LOC-2 |
| EditView.tsx | `src/features/transaction-editor/views/EditView.tsx` | MOVE + MODIFY | AC-ARCH-LOC-3 |
| useActiveTransaction.ts | `src/features/transaction-editor/hooks/useActiveTransaction.ts` | MOVE + MODIFY | AC-ARCH-LOC-4 |
| Views sub-barrel | `src/features/transaction-editor/views/index.ts` | CREATE | AC-ARCH-LOC-5 |
| Hooks sub-barrel | `src/features/transaction-editor/hooks/index.ts` | CREATE | AC-ARCH-LOC-6 |
| TEV barrel shim | `src/views/TransactionEditorView/index.ts` | REPLACE (shim) | AC-ARCH-LOC-7 |
| Internal shim | `src/views/TransactionEditorViewInternal.tsx` | REPLACE (shim) | AC-ARCH-LOC-8 |
| EditView shim | `src/views/EditView.tsx` | REPLACE (shim) | AC-ARCH-LOC-9 |
| Hook shim | `src/hooks/useActiveTransaction.ts` | REPLACE (shim) | AC-ARCH-LOC-10 |
| Feature barrel | `src/features/transaction-editor/index.ts` | MODIFY | AC8 |

### External Consumers (resolved by shims — NO changes needed)

| Consumer | Import Path | Shim |
|----------|-------------|------|
| `src/App.tsx` line 78 | `'./views/TransactionEditorView'` | TEV barrel shim |
| `src/components/App/viewRenderers.tsx` line 44 | `'../../views/TransactionEditorView'` | TEV barrel shim |
| `tests/unit/components/App/viewRenderers.test.tsx` line 94 | `vi.mock('../../../../src/views/TransactionEditorView')` | TEV barrel shim |
| `tests/integration/category-learning.test.tsx` line 16 | `'../../src/views/EditView'` | EditView shim |
| `src/entities/transaction/hooks/index.ts` line 23 | `'../../../hooks/useActiveTransaction'` | Hook shim |

### Files That Do NOT Move

| File | Reason |
|------|--------|
| `src/hooks/app/useTransactionHandlers.ts` | App-level shared hook (2 consumers: App.tsx, hooks/app/index.ts) |
| `src/hooks/app/useScanHandlers.ts` | App-level shared hook (shared with batch-review) |
| `src/hooks/app/useNavigationHandlers.ts` | App-level shared hook (all views) |
| `src/features/transaction-editor/store/*` | Already in correct location |
| `tests/unit/features/transaction-editor/store/*` | Already in correct location |

## Tasks / Subtasks

### Task 1: Move TransactionEditorView directory (9 files)

- [ ] 1.1 Create target directory `src/features/transaction-editor/views/TransactionEditorView/`
- [ ] 1.2 `git mv` all 9 files from `src/views/TransactionEditorView/` to target
- [ ] 1.3 Convert all `../../` relative imports to `@/` path aliases in 8 files (all except index.ts):
  - TransactionEditorViewWrapper.tsx: ~5 relative imports
  - useTransactionEditorHandlers.ts: ~10 relative imports (largest hook, 581 lines)
  - useTransactionEditorData.ts: ~5 relative imports
  - useEditorLearningPrompts.ts: ~5 relative imports
  - useCrossStoreSuggestions.ts: ~3 relative imports
  - EditorItemsSection.tsx: ~8 relative imports (734 lines)
  - EditorScanThumbnail.tsx: ~5 relative imports
  - EditorConfirmationDialogs.tsx: ~2 relative imports (may have none)
- [ ] 1.4 Verify internal `./` imports within directory are preserved

### Task 2: Move TransactionEditorViewInternal.tsx + EditView.tsx

- [ ] 2.1 `git mv src/views/TransactionEditorViewInternal.tsx` to `src/features/transaction-editor/views/`
- [ ] 2.2 Convert all `../` relative imports to `@/` aliases in TransactionEditorViewInternal.tsx (~30+ imports, 1,422 lines)
- [ ] 2.3 `git mv src/views/EditView.tsx` to `src/features/transaction-editor/views/`
- [ ] 2.4 Convert all `../` relative imports to `@/` aliases in EditView.tsx (~20+ imports, 1,811 lines)
- [ ] 2.5 Verify Wrapper→Internal relative import (`../TransactionEditorViewInternal`) still resolves
- [ ] 2.6 Run `npx tsc --noEmit` — fix any type errors

### Task 3: Move useActiveTransaction.ts + create sub-barrels

- [ ] 3.1 Create `src/features/transaction-editor/hooks/` directory
- [ ] 3.2 `git mv src/hooks/useActiveTransaction.ts` to `src/features/transaction-editor/hooks/`
- [ ] 3.3 Fix relative imports in useActiveTransaction.ts (`../types/*` → `@/types/*`, etc.)
- [ ] 3.4 Create hooks sub-barrel `src/features/transaction-editor/hooks/index.ts`
- [ ] 3.5 Create views sub-barrel `src/features/transaction-editor/views/index.ts`
- [ ] 3.6 Update feature barrel `src/features/transaction-editor/index.ts` — add `export * from './views'` and `export * from './hooks'`

### Task 4: Create re-export shims (4 files)

- [ ] 4.1 Create shim at `src/views/TransactionEditorView/index.ts` (re-exports from `@features/transaction-editor/views/TransactionEditorView`)
- [ ] 4.2 Create shim at `src/views/TransactionEditorViewInternal.tsx` (re-exports from `@features/transaction-editor/views/TransactionEditorViewInternal`)
- [ ] 4.3 Create shim at `src/views/EditView.tsx` (re-exports from `@features/transaction-editor/views/EditView`)
- [ ] 4.4 Create shim at `src/hooks/useActiveTransaction.ts` (re-exports from `@features/transaction-editor/hooks/useActiveTransaction`)
- [ ] 4.5 Run `npx tsc --noEmit` — verify all shims resolve

### Task 5: Verification and cleanup

- [ ] 5.1 Grep: `grep -rE "from '(\.\./){2,}" src/features/transaction-editor/views/` returns 0
- [ ] 5.2 Grep: verify no stale imports in tests referencing old direct paths
- [ ] 5.3 Verify external consumers via shims: `npx vitest run tests/unit/components/App/viewRenderers.test.tsx`
- [ ] 5.4 Verify existing store tests: `npx vitest run tests/unit/features/transaction-editor/`
- [ ] 5.5 Run `npm run test:quick` — all tests pass
- [ ] 5.6 Verify no circular deps: `npx madge --circular src/features/transaction-editor/`

## Dev Notes

### Architecture Guidance

**Import rewiring — extensive but mechanical:** This story has the most import rewiring of any Phase 1 consolidation due to three large files (EditView 1,811 lines, TransactionEditorViewInternal 1,422 lines, useTransactionEditorHandlers 581 lines). All use `../../` or `../` relative imports that must convert to `@/` aliases. Use find-and-replace per file.

**Wrapper→Internal cross-reference:** The TransactionEditorViewWrapper.tsx imports `from '../TransactionEditorViewInternal'`. After moving both files, the relative path is preserved:
- Wrapper at `features/transaction-editor/views/TransactionEditorView/TransactionEditorViewWrapper.tsx`
- Internal at `features/transaction-editor/views/TransactionEditorViewInternal.tsx`
- `../TransactionEditorViewInternal` resolves correctly (one level up from directory)

**Move order matters:** Move TransactionEditorView/ directory AND TransactionEditorViewInternal.tsx together (or in immediate sequence) before running `tsc`, since the Wrapper has a cross-reference to Internal. If only one is moved, `tsc` will fail.

**EditView.tsx — legacy but intentionally moved:** EditView is not in App.tsx routing (superseded by modular TransactionEditorView), but it's referenced by `tests/integration/category-learning.test.tsx` and planned for decomposition in story 15b-2a. Move it now; decompose later.

**useActiveTransaction.ts — unused but editor-scoped:** This hook is not actively called by any component, but it's re-exported through the entity chain (`entities/transaction/hooks/index.ts`). It's designed for the transaction-editor feature. Move it; the entity re-export resolves via shim.

**Existing store files untouched:** The 5 files in `features/transaction-editor/store/` (useTransactionEditorStore, selectors, types) are already correctly located. This story only adds `views/` and `hooks/` layers alongside the existing `store/`.

### Critical Pitfalls

1. **Circular import via feature barrel:** The TransactionEditorView files currently import from `@features/transaction-editor` (the store). After the move, these files ARE inside the feature. If the feature barrel re-exports views that import from the barrel, you get a cycle. Solution: the view files must import from `./store` or `../store` (intra-feature), NOT from `@features/transaction-editor`. Check and fix any barrel self-imports.

2. **git mv order:** Move all TransactionEditorView/ files AND TransactionEditorViewInternal.tsx before creating shims. The old index.ts must be moved before a shim can take its place.

3. **Large file import count:** EditView.tsx and TransactionEditorViewInternal.tsx have 20-30+ relative imports each. Carefully check each one — some may already use `@/` aliases (no change needed), some use `../` (need conversion).

4. **Feature barrel circular risk:** `useTransactionEditorHandlers.ts` imports store selectors from `@features/transaction-editor`. After the move, this becomes a self-referencing feature import. Either:
   - Change to relative: `from '../../store/selectors'` (preferred for intra-feature)
   - Or keep `@features/transaction-editor` if the barrel doesn't re-export the handler (safe if barrel only adds `export * from './views'`)

### E2E Testing

No E2E testing needed — pure structural refactoring with zero behavior changes.

## ECC Analysis Summary

- **Risk Level:** MEDIUM (extensive import rewiring on large files, Wrapper→Internal cross-reference)
- **Complexity:** Moderate (12 source files, 3 oversized files, intra-feature circular import risk)
- **Sizing:** MEDIUM (5 tasks, ~24 subtasks, 19 files) — re-sized to **3 pts** from original 2 pts
- **Agents consulted:** Planner, Architect (via Explorer)
- **Pattern reference:** 15b-1a (consolidate-analytics), 15b-1b (consolidate-dashboard) — same shim approach
- **No test files to move** — existing store test already correctly located

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-14
- **Classification:** COMPLEX (19 files, 5 tasks)
- **ECC Agents:** code-reviewer (10/10), security-reviewer (10/10), architect (10/10), tdd-guide (9/10)
- **Overall Score:** 9.75/10
- **Outcome:** APPROVE — clean structural consolidation
- **Findings:** 5 INFO-level (all pre-existing tech debt, already tracked in Phase 2)
- **Action Items:** 0 quick fixes, 0 TD stories created
- **Architectural ACs:** 23/23 PASS — fully ALIGNED with FSD shim pattern
- **Session Cost:** $13.03
