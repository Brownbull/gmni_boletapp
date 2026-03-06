# Story 16-8: Move Legacy Scan Components Into Feature Directory

## Status: ready-for-dev

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by putting every scan component under one roof -- no more split custody"

## Story
As a developer, I want all scan UI components in `features/scan/components/`, so that the scan feature is fully self-contained with zero legacy directory dependencies.

## Acceptance Criteria

### Functional
- **AC-1:** Given `src/components/scan/` has ~17 files, when moved to `features/scan/components/`, then the legacy directory is deleted
- **AC-2:** Given `ScanFeature.tsx` imports from `@/components/scan/`, when updated, then it imports from `@features/scan/components/`
- **AC-3:** Given other features may import scan components, when moved, then imports are updated or re-exported from feature barrel
- **AC-4:** Given the move completes, when build runs, then zero TypeScript errors and zero broken imports

### Architectural
- **AC-ARCH-LOC-1:** All scan components at `src/features/scan/components/`
- **AC-ARCH-PATTERN-1:** Scan feature barrel exports components that are part of the public API
- **AC-ARCH-NO-1:** No files remain in `src/components/scan/` after this story
- **AC-ARCH-NO-2:** No layer violations (`features/` -> `components/`) for scan-related imports

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Legacy scan dir | `src/components/scan/` (~17 files) | — | DELETED (moved) |
| Feature scan components | `src/features/scan/components/` | FSD components | MODIFIED (files added) |
| ScanFeature orchestrator | `src/features/scan/ScanFeature.tsx` | FSD component | MODIFIED (imports) |
| Feature barrel | `src/features/scan/index.ts` | FSD barrel | MODIFIED |
| Consumer imports (~10-15 files) | Various | — | MODIFIED (import paths) |

## Tasks

### Task 1: Inventory Legacy Components (2 subtasks)
- [ ] 1.1: List all files in `src/components/scan/` — document each file's purpose and consumers
- [ ] 1.2: Identify which components are scan-internal vs. used by other features (e.g., `ScanCompleteModal` used by transaction-editor)

### Task 2: Move Files (3 subtasks)
- [ ] 2.1: Move all scan-internal components to `src/features/scan/components/`
- [ ] 2.2: Handle naming conflicts — if a component with the same name already exists in `features/scan/components/`, merge or rename
- [ ] 2.3: Components used by other features: move to scan feature but re-export from barrel for cross-feature access

### Task 3: Update Import Paths (3 subtasks)
- [ ] 3.1: Update `ScanFeature.tsx` — change all `@/components/scan/` imports to `@features/scan/components/` or relative paths
- [ ] 3.2: Update any other files importing from `@/components/scan/` (grep for all consumers)
- [ ] 3.3: Update scan feature barrel (`index.ts`) to export public components

### Task 4: Delete Legacy Directory and Verify (2 subtasks)
- [ ] 4.1: Delete `src/components/scan/` directory entirely
- [ ] 4.2: Run `npx tsc --noEmit` and `npm run test:quick` — zero errors

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 4
- **Subtasks:** 10
- **Files:** ~8 (moves) + ~10-15 (import updates)

## Dependencies
- None (independent — can run at any point in the epic)

## Risk Flags
- None

## Dev Notes
- The key components in legacy `src/components/scan/`: `QuickSaveCard`, `BatchCompleteModal`, `CurrencyMismatchDialog`, `TotalMismatchDialog`, `ScanOverlay`, and supporting components.
- Some of these may already have copies in `features/scan/components/` from Epic 14e migration. Check for duplicates before moving.
- `ScanCompleteModal` is imported by `TransactionEditorScanStatus.tsx` (created in 16-5). This cross-feature import is acceptable — the component is part of scan's public API, re-exported from barrel.
- This story eliminates the most common layer violation pattern (50 edges in the dependency analysis).
- Keep the commit atomic — move all files in one commit to avoid broken intermediate states.
