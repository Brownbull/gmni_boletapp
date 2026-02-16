# Story 15b-0c: Fix Stores/ModalManager/EditorScanThumbnail Cycles (3/6)

## Status: done
## Epic: 15b - Continued Codebase Refactoring

## Overview

Fix the remaining 3 circular dependencies after the App barrel cycles are resolved in 15b-0b. Each cycle has a different root cause requiring a distinct fix strategy — all are import-path-only changes with zero runtime behavior change.

**Points:** 2
**Priority:** HIGH
**Depends on:** 15b-0b (App barrel cycles must be fixed first)

## Background

Remaining cycles (after 15b-0b resolves the 3 App barrel cycles):

1. **Cycle 4 (4 nodes):** `shared/stores/index.ts → useInsightStore.ts → @/components/session → SessionComplete.tsx → @/shared/stores`
   - **Root cause:** `SessionContext` interface defined inside `SessionComplete.tsx` (a component file). The store needs the type, but the component needs the store.

2. **Cycle 5 (4 nodes):** `ModalManager/index.ts → ModalManager.tsx → registry.tsx → (lazy) CreditInfoModal.tsx → ModalManager/index.ts`
   - **Root cause:** `CreditInfoModal.tsx` imports `CreditInfoProps` type through the barrel (`@managers/ModalManager`), which re-exports the registry that lazy-loads CreditInfoModal.

3. **Cycle 6 (2 nodes):** `TransactionEditorViewInternal.tsx ↔ EditorScanThumbnail.tsx`
   - **Root cause:** `EditorScanThumbnail` imports `ScanButtonState` type from parent component `TransactionEditorViewInternal`, while the parent imports the child as a component.

## Functional Acceptance Criteria

- [x] **AC1:** Stores barrel cycle resolved — `useInsightStore.ts` imports `SessionContext` from `@/types/session` instead of `@/components/session`
- [x] **AC2:** ModalManager registry cycle resolved — `CreditInfoModal.tsx` imports `CreditInfoProps` from `@managers/ModalManager/types` instead of `@managers/ModalManager`
- [x] **AC3:** EditorScanThumbnail bidirectional dep resolved — imports `ScanButtonState` from `@/shared/utils/scanHelpers` (canonical location) instead of parent component
- [x] **AC4:** 0 circular dependencies remaining (import tracing confirms all 3 targeted cycles resolved; depcruise unavailable locally)
- [x] **AC5:** `npm run test:quick` passes (281 files, 6884 tests)
- [x] **AC6:** `npx tsc --noEmit` passes with zero errors

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements
- **AC-ARCH-LOC-1:** Session type interfaces (`SessionContext`, `SessionAction`, `Suggestion`) defined in `src/types/session.ts`
- **AC-ARCH-LOC-2:** No new files created in `src/managers/ModalManager/` or `src/views/TransactionEditorView/` — fixes use existing canonical type locations

### Pattern Requirements
- **AC-ARCH-PATTERN-1:** `useInsightStore.ts` imports `SessionContext` from `@/types/session`, NOT from `@/components/session`
- **AC-ARCH-PATTERN-2:** `EditorScanThumbnail.tsx` imports `ScanButtonState` from `@/shared/utils/scanHelpers`, NOT from `../TransactionEditorViewInternal`
- **AC-ARCH-PATTERN-3:** `CreditInfoModal.tsx` imports `CreditInfoProps` from `@managers/ModalManager/types`, NOT from `@managers/ModalManager` (barrel)
- **AC-ARCH-PATTERN-4:** `src/components/session/index.ts` re-exports `SessionContext`, `SessionAction`, `Suggestion` to maintain backward compatibility for existing consumers (App.tsx, AppOverlays.tsx, test files)
- **AC-ARCH-PATTERN-5:** `SessionComplete.tsx` still exports the session types (as re-exports from `@/types/session`) because test files import directly from the file
- **AC-ARCH-PATTERN-6:** After all changes, depcruise reports 0 circular dependencies for the 3 targeted cycles

### Anti-Pattern Requirements (Must NOT Happen)
- **AC-ARCH-NO-1:** Stores (`src/shared/stores/`) MUST NOT import from component barrels (`src/components/*/index.ts`) — stores import types from `src/types/` only
- **AC-ARCH-NO-2:** Leaf components (modals rendered by registries) MUST NOT import from their parent's barrel — use direct path to types file
- **AC-ARCH-NO-3:** Child components MUST NOT import types from parent component files — shared types go in `src/types/` or canonical utility locations
- **AC-ARCH-NO-4:** No duplicate type definitions — `ScanButtonState` has exactly one canonical definition (in `scanHelpers.ts`). TransactionEditorViewInternal may re-export but MUST NOT redefine
- **AC-ARCH-NO-5:** No backward-incompatible import removals — all existing consumer import paths continue to resolve via barrel re-exports

## File Specification

| # | File/Component | Exact Path | Action | AC Reference |
|---|----------------|------------|--------|--------------|
| 1 | EditorScanThumbnail | `src/views/TransactionEditorView/EditorScanThumbnail.tsx` | MODIFY — line 26: import ScanButtonState from `@/shared/utils/scanHelpers` | AC3, AC-ARCH-PATTERN-2 |
| 2 | TransactionEditorViewInternal | `src/views/TransactionEditorViewInternal.tsx` | MODIFY — line 109: replace local type with re-export from `@/shared/utils/scanHelpers` | AC-ARCH-NO-4 |
| 3 | CreditInfoModal | `src/components/modals/CreditInfoModal.tsx` | MODIFY — line 19: import CreditInfoProps from `@managers/ModalManager/types` | AC2, AC-ARCH-PATTERN-3 |
| 4 | Session types | `src/types/session.ts` | CREATE — SessionContext, SessionAction, Suggestion interfaces | AC-ARCH-LOC-1 |
| 5 | useInsightStore | `src/shared/stores/useInsightStore.ts` | MODIFY — line 25: import SessionContext from `@/types/session` | AC1, AC-ARCH-PATTERN-1 |
| 6 | SessionComplete | `src/components/session/SessionComplete.tsx` | MODIFY — replace local type defs with imports + re-exports from `@/types/session` | AC-ARCH-PATTERN-5 |
| 7 | Session barrel | `src/components/session/index.ts` | MODIFY — re-export types from `@/types/session` for backward compat | AC-ARCH-PATTERN-4 |

## Tasks / Subtasks

- [x] **Task 1:** Fix Cycle 6 — EditorScanThumbnail bidirectional dep (simplest)
  - [x] Change `EditorScanThumbnail.tsx` line 26: `'../TransactionEditorViewInternal'` → `'@/shared/utils/scanHelpers'`
  - [x] Change `TransactionEditorViewInternal.tsx` line 109: replace local `export type ScanButtonState = ...` with `import type` + `export type { ScanButtonState } from '@/shared/utils/scanHelpers'`
  - [x] Run `npx tsc --noEmit` — verify 0 errors
- [x] **Task 2:** Fix Cycle 5 — ModalManager registry
  - [x] Change `CreditInfoModal.tsx` line 19: `'@managers/ModalManager'` → `'@managers/ModalManager/types'`
  - [x] Run `npx tsc --noEmit` — verify 0 errors
- [x] **Task 3:** Fix Cycle 4 — Stores barrel (most complex)
  - [x] Create `src/types/session.ts` with `SessionContext`, `SessionAction`, `Suggestion` extracted from SessionComplete.tsx (uses `import type { ReactNode } from 'react'`)
  - [x] Change `useInsightStore.ts` line 25: `'@/components/session'` → `'@/types/session'`
  - [x] Update `SessionComplete.tsx`: replace local interface definitions with `import type` + `export type` from `@/types/session`
  - [x] Update `src/components/session/index.ts`: re-export types from `@/types/session`
  - [x] Run `npx tsc --noEmit` — verify 0 errors
- [x] **Task 4:** Verification
  - [x] Run `npm run test:quick` — all pass (281 files, 6884 tests)
  - [x] Run depcruise — confirm 0 circular dependencies (import tracing verified; depcruise unavailable locally)
  - [x] Verify backward compat: App.tsx, AppOverlays.tsx, test files compile with existing import paths

## Dev Notes

### Architecture Guidance

**Why these fixes work:**
- **Cycle 6:** `ScanButtonState` already exists canonically at `src/shared/utils/scanHelpers.ts` line 22. Redirecting the import eliminates the child→parent type dependency.
- **Cycle 5:** `CreditInfoProps` is defined in `src/managers/ModalManager/types.ts`. Importing directly from the types file instead of the barrel avoids traversing the registry chain.
- **Cycle 4:** Extracting `SessionContext` to `src/types/session.ts` means `useInsightStore` no longer needs to import from the component tree, breaking the stores→components→stores loop.

### Technical Notes

**Execution order (independent but recommended):**
1. Cycle 6 (EditorScanThumbnail) — 1 import change + 1 dedup
2. Cycle 5 (ModalManager) — 1 import change
3. Cycle 4 (Stores barrel) — 1 new file + 3 modifications

**Consumers that MUST NOT break (backward compat verification):**
- `src/App.tsx` line 82: `import { type SessionContext, type SessionAction } from './components/session'`
- `src/components/App/AppOverlays.tsx` line 31: `import type { SessionContext, SessionAction } from '../session'`
- `tests/unit/shared/stores/useInsightStore.test.ts` line 37: `import type { SessionContext } from '@/components/session'`
- `tests/unit/components/session/SessionComplete.test.tsx` lines 22-23: direct import from SessionComplete.tsx

**React import note:** `Suggestion.icon` is typed as `React.ReactNode` — the new `src/types/session.ts` file needs `import type { ReactNode } from 'react'` (or inline the type).

**Mock audit:** No test mocks target the import paths being changed. Verified: no mocks for `@/components/session` (SessionContext type), `@managers/ModalManager` (CreditInfoProps type), or `@/shared/utils/scanHelpers` (ScanButtonState type).

### What NOT to Change
- `src/shared/stores/index.ts` barrel — does NOT need modification (the cycle is from useInsightStore's import, not the barrel's exports)
- `src/managers/ModalManager/registry.ts` — already uses `React.lazy()`, no changes needed
- `src/managers/ModalManager/ModalManager.tsx` — no changes needed
- `src/components/session/index.ts` component re-exports — keep re-exporting `SessionComplete`, `selectMessage`, `getSuggestions`, `SessionCompleteProps` from `./SessionComplete`

### Verification Commands
```bash
# Type check
npx tsc --noEmit

# Quick test
npm run test:quick

# Targeted tests for modified modules
npx vitest run tests/unit/shared/stores/useInsightStore.test.ts tests/unit/components/session/SessionComplete.test.tsx tests/unit/components/modals/CreditInfoModal.test.tsx

# Verify 0 cycles
npx depcruise --output-type err src/

# Verify no remaining barrel imports for cycle-causing paths
grep -rn "import.*SessionContext.*from.*@/components/session" src/shared/stores/
grep -rn "import.*CreditInfoProps.*from.*@managers/ModalManager'" src/components/modals/
grep -rn "import.*ScanButtonState.*from.*TransactionEditorViewInternal" src/views/TransactionEditorView/
```

### E2E Testing
E2E coverage not applicable — pure import refactoring with no UI/behavior changes.

## ECC Analysis Summary
- Risk Level: LOW
- Complexity: Simple
- Sizing: SMALL (2 pts) — 4 tasks, ~13 subtasks, 7 files
- Agents consulted: Planner, Architect

## Senior Developer Review (ECC)

- **Review date:** 2026-02-13
- **Classification:** STANDARD
- **ECC agents used:** code-reviewer (Sonnet), security-reviewer (Sonnet)
- **Outcome:** APPROVE 10/10
- **Findings:** 0 issues (8 informational confirmations of AC satisfaction)
- **Action items:** 0 quick fixes, 0 deferred items, 0 TD stories
- **All ACs validated:** functional (AC1-AC6), architectural (LOC-1/2, PATTERN-1-6, NO-1-5)
- **Session cost:** $4.88
