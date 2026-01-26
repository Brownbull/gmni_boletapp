# Story 14e.9a: Move Scan Components to Feature Directory

Status: done

<!-- Part 1/3 of Story 14e-9 split (2026-01-24) -->

## Story

As a **developer**,
I want **existing scan components moved to the feature directory**,
so that **scan UI is colocated with scan logic in the FSD structure**.

## Acceptance Criteria

1. **AC1: Directory Structure Created**
   - `src/features/scan/components/` directory created
   - `src/features/scan/components/states/` subdirectory created
   - Barrel exports file created

2. **AC2: Components Moved Successfully**
   - All 8 scan components moved from `src/components/scan/`
   - Original directory kept empty (or deleted if no other files)
   - Git history preserved via `git mv`

3. **AC3: Import Paths Updated**
   - All imports across codebase updated to new paths
   - No broken imports (build succeeds)
   - IDE navigation works correctly

4. **AC4: Tests Moved & Pass**
   - Test files moved from `tests/unit/components/scan/`
   - Test imports updated
   - All existing tests pass

5. **AC5: No Functional Changes**
   - Components unchanged (no logic modifications)
   - This is a structural-only refactor
   - All functionality works as before

## Tasks / Subtasks

- [x] **Task 1: Create Directory Structure** (AC: 1)
  - [x] Create `src/features/scan/components/` directory
  - [x] Create `src/features/scan/components/states/` subdirectory
  - [x] Create `src/features/scan/components/index.ts` barrel file (empty exports for now)

- [x] **Task 2: Move Components** (AC: 2, 5)
  - [x] Move ScanOverlay.tsx via `git mv`
  - [x] Move ScanStatusIndicator.tsx via `git mv`
  - [x] Move ScanModeSelector.tsx via `git mv`
  - [x] Move ScanProgress.tsx via `git mv`
  - [x] Move ScanError.tsx via `git mv`
  - [x] Move ScanReady.tsx via `git mv`
  - [x] Move ScanSkeleton.tsx via `git mv`
  - [x] Move ScanCompleteModal.tsx via `git mv`

- [x] **Task 3: Update Imports & Exports** (AC: 3)
  - [x] Add all components to barrel exports
  - [x] Update imports in App.tsx
  - [x] Update imports in views/
  - [x] Update imports in other components
  - [x] Search and fix any remaining broken imports

- [x] **Task 4: Move & Update Tests** (AC: 4)
  - [x] Move ScanOverlay.test.tsx
  - [x] Move ScanStatusIndicator.test.tsx
  - [x] Move ScanModeSelector.test.tsx
  - [x] Update test imports
  - [x] Run tests, verify all pass

## Dev Notes

### Components to Move

| From | To |
|------|-----|
| `src/components/scan/ScanOverlay.tsx` | `src/features/scan/components/ScanOverlay.tsx` |
| `src/components/scan/ScanStatusIndicator.tsx` | `src/features/scan/components/ScanStatusIndicator.tsx` |
| `src/components/scan/ScanModeSelector.tsx` | `src/features/scan/components/ScanModeSelector.tsx` |
| `src/components/scan/ScanProgress.tsx` | `src/features/scan/components/ScanProgress.tsx` |
| `src/components/scan/ScanError.tsx` | `src/features/scan/components/ScanError.tsx` |
| `src/components/scan/ScanReady.tsx` | `src/features/scan/components/ScanReady.tsx` |
| `src/components/scan/ScanSkeleton.tsx` | `src/features/scan/components/ScanSkeleton.tsx` |
| `src/components/scan/ScanCompleteModal.tsx` | `src/features/scan/components/ScanCompleteModal.tsx` |

### Import Update Strategy

```bash
# Find all files importing from old path
grep -r "components/scan" src/ --include="*.tsx" --include="*.ts"
```

### Barrel Exports Template

```typescript
// src/features/scan/components/index.ts
export { ScanOverlay } from './ScanOverlay';
export { ScanStatusIndicator } from './ScanStatusIndicator';
export { ScanModeSelector } from './ScanModeSelector';
export { ScanProgress } from './ScanProgress';
export { ScanError } from './ScanError';
export { ScanReady } from './ScanReady';
export { ScanSkeleton } from './ScanSkeleton';
export { ScanCompleteModal } from './ScanCompleteModal';
```

### Project Structure Notes

- Uses `git mv` to preserve history
- No functional changes - pure structural refactor
- Build must pass after each task

### Dependencies

- **Part of split from**: Story 14e-9
- **Depends On**: Story 14e-1 (Directory Structure setup - creates `src/features/`)
- **Blocks**: Story 14e-9b (Zustand component update)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e9]
- [Source: src/components/scan/*] - Current component locations

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References
N/A - No debug issues encountered

### Completion Notes List

1. **Directory Structure**: Created `src/features/scan/components/` with `states/` subdirectory and barrel exports file
2. **Components Moved**: All 8 scan components moved via `git mv`:
   - ScanOverlay, ScanStatusIndicator, ScanModeSelector, ScanProgress
   - ScanError, ScanReady, ScanSkeleton, ScanCompleteModal
3. **Import Updates**:
   - Updated Nav.tsx to import from `@features/scan/components`
   - Updated TransactionEditorView.tsx to use new path
   - Updated old barrel (`src/components/scan/index.ts`) to re-export from new location for backward compatibility
   - Updated internal imports in moved components to use `@/` aliases
4. **Test Migration**:
   - Moved 3 test files to `tests/unit/features/scan/components/`
   - Fixed vitest.config.unit.ts to add explicit path aliases for tests (tsconfig include only covers src/)
   - Updated DialogScanContextIntegration.test.tsx to use `@features/scan/components`
5. **Verification**: All 5447 tests pass, build succeeds

### File List

**Modified:**
- `src/features/scan/index.ts` - Added components re-export
- `src/features/scan/components/index.ts` - New barrel exports file
- `src/features/scan/components/ScanOverlay.tsx` - Import paths updated
- `src/features/scan/components/ScanStatusIndicator.tsx` - Import paths updated
- `src/features/scan/components/ScanModeSelector.tsx` - Import paths updated
- `src/features/scan/components/ScanProgress.tsx` - Import paths updated
- `src/features/scan/components/ScanError.tsx` - Import paths updated
- `src/features/scan/components/ScanReady.tsx` - Import paths updated
- `src/features/scan/components/ScanSkeleton.tsx` - No changes needed
- `src/features/scan/components/ScanCompleteModal.tsx` - Import paths updated
- `src/components/scan/index.ts` - Updated to re-export from new location
- `src/components/Nav.tsx` - Updated import path
- `src/views/TransactionEditorView.tsx` - Updated import path
- `vitest.config.unit.ts` - Added explicit path aliases for tests
- `tests/unit/features/scan/components/ScanOverlay.test.tsx` - Moved & updated
- `tests/unit/features/scan/components/ScanStatusIndicator.test.tsx` - Moved & updated
- `tests/unit/features/scan/components/ScanModeSelector.test.tsx` - Moved & updated
- `tests/unit/components/scan/DialogScanContextIntegration.test.tsx` - Updated import

**Points:** 2
