# Story 14e.9a: Move Scan Components to Feature Directory

Status: ready-for-dev

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

- [ ] **Task 1: Create Directory Structure** (AC: 1)
  - [ ] Create `src/features/scan/components/` directory
  - [ ] Create `src/features/scan/components/states/` subdirectory
  - [ ] Create `src/features/scan/components/index.ts` barrel file (empty exports for now)

- [ ] **Task 2: Move Components** (AC: 2, 5)
  - [ ] Move ScanOverlay.tsx via `git mv`
  - [ ] Move ScanStatusIndicator.tsx via `git mv`
  - [ ] Move ScanModeSelector.tsx via `git mv`
  - [ ] Move ScanProgress.tsx via `git mv`
  - [ ] Move ScanError.tsx via `git mv`
  - [ ] Move ScanReady.tsx via `git mv`
  - [ ] Move ScanSkeleton.tsx via `git mv`
  - [ ] Move ScanCompleteModal.tsx via `git mv`

- [ ] **Task 3: Update Imports & Exports** (AC: 3)
  - [ ] Add all components to barrel exports
  - [ ] Update imports in App.tsx
  - [ ] Update imports in views/
  - [ ] Update imports in other components
  - [ ] Search and fix any remaining broken imports

- [ ] **Task 4: Move & Update Tests** (AC: 4)
  - [ ] Move ScanOverlay.test.tsx
  - [ ] Move ScanStatusIndicator.test.tsx
  - [ ] Move ScanModeSelector.test.tsx
  - [ ] Update test imports
  - [ ] Run tests, verify all pass

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

### Debug Log References

### Completion Notes List

### File List

**Points:** 2
