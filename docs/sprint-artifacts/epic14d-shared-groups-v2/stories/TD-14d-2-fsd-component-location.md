# Tech Debt Story TD-14d-2: Move SharedGroups Components to Feature Module

Status: done

> **Source:** ECC Code Review #2 (2026-02-03) on story 14d-v2-1-7e
> **Priority:** LOW (organizational, no functional impact)
> **Estimated Effort:** 4-6 hours
> **Risk:** MEDIUM (many import path changes, potential merge conflicts)

## Story

As a **developer**,
I want **SharedGroups components moved from `src/components/SharedGroups/` to `src/features/shared-groups/components/`**,
So that **the codebase follows Feature-Sliced Design (FSD) patterns consistently**.

## Problem Statement

SharedGroups components are in a **legacy location**:
```
src/components/SharedGroups/
├── DeleteGroupDialog.tsx
├── CreateGroupDialog.tsx
├── InviteMembersDialog.tsx
├── AcceptInvitationDialog.tsx
├── LeaveGroupDialog.tsx
├── OwnerLeaveWarningDialog.tsx
├── MemberSelectorDialog.tsx
├── TransferOwnershipDialog.tsx
├── PendingInvitationsSection.tsx
├── JoinGroupByCode.tsx
├── ViewModeSwitcher.tsx
├── GroupMembersManager.tsx
├── InvitationErrorView.tsx
├── TransactionSharingOptInDialog.tsx
└── index.ts
```

Per `04-architecture.md`, feature module structure should be:
```
src/features/shared-groups/
├── store/
├── hooks/
├── services/
├── handlers/
└── components/          <-- Components should be here
    ├── DeleteGroupDialog.tsx
    └── ...
```

## Acceptance Criteria

1. **Given** components in `src/components/SharedGroups/`
   **When** the migration is complete
   **Then** all components are in `src/features/shared-groups/components/`

2. **Given** existing imports across the codebase
   **When** updated to new paths
   **Then** all imports use `@/features/shared-groups` barrel export

3. **Given** existing tests in `tests/unit/components/SharedGroups/`
   **When** migrated to new location
   **Then** all tests pass with correct import paths

4. **Given** the feature index
   **When** components are exported
   **Then** they are accessible via `@/features/shared-groups`

## Tasks / Subtasks

- [x] **Task 1: Create Component Directory Structure** (AC: #1)
  - [x] 1.1: Create `src/features/shared-groups/components/` directory
  - [x] 1.2: Create `src/features/shared-groups/components/index.ts` barrel export

- [x] **Task 2: Move Component Files** (AC: #1)
  - [x] 2.1: Move all .tsx files from `src/components/SharedGroups/` (35 files, not 14)
  - [x] 2.2: Update internal imports within moved files (converted to @/ path aliases)
  - [x] 2.3: Delete old directory

- [x] **Task 3: Update Barrel Exports** (AC: #4)
  - [x] 3.1: Add component exports to `src/features/shared-groups/index.ts`
  - [x] 3.2: Update component barrel export (100+ exports)

- [x] **Task 4: Update Consumer Imports** (AC: #2)
  - [x] 4.1: Update `src/components/settings/subviews/GruposView.tsx`
  - [x] 4.2: Update `src/App.tsx` (ViewModeSwitcher, JoinGroupDialog)
  - [x] 4.3: Update other consumers (8 additional files):
    - `src/components/transactions/TransactionCard.tsx`
    - `src/views/NotificationsView.tsx`
    - `src/views/HistoryView.tsx`
    - `src/views/TrendsView.tsx`
    - `src/views/TransactionEditorViewInternal.tsx`
    - `src/views/DashboardView.tsx`
    - `src/components/scan/QuickSaveCard.tsx`

- [x] **Task 5: Move and Update Tests** (AC: #3)
  - [x] 5.1: Move tests from `tests/unit/components/SharedGroups/` to `tests/unit/features/shared-groups/components/`
  - [x] 5.2: Update test import paths (converted to @/ path aliases)
  - [x] 5.3: Run all tests to verify (320 test files passed, 8293 tests passed)

- [x] **Task 6: Verification**
  - [x] 6.1: Run TypeScript compilation ✅
  - [x] 6.2: Run full test suite ✅ (320 passed, 1 unrelated pre-existing failure)
  - [x] 6.3: Build passes ✅

## Dev Notes

### Components to Move (14 files)

| Component | Lines | Tests |
|-----------|-------|-------|
| DeleteGroupDialog.tsx | ~400 | 48 tests |
| CreateGroupDialog.tsx | ~350 | 31 tests |
| InviteMembersDialog.tsx | ~280 | 47 tests |
| AcceptInvitationDialog.tsx | ~250 | 41 tests |
| LeaveGroupDialog.tsx | ~220 | Yes |
| OwnerLeaveWarningDialog.tsx | ~180 | Yes |
| MemberSelectorDialog.tsx | ~200 | Yes |
| TransferOwnershipDialog.tsx | ~180 | Yes |
| PendingInvitationsSection.tsx | ~150 | Yes |
| JoinGroupByCode.tsx | ~200 | Yes |
| ViewModeSwitcher.tsx | ~300 | Yes |
| GroupMembersManager.tsx | ~180 | Yes |
| InvitationErrorView.tsx | ~100 | Yes |
| TransactionSharingOptInDialog.tsx | ~150 | Yes |

### Import Path Changes

**Before:**
```typescript
import { DeleteGroupDialog } from '@/components/SharedGroups/DeleteGroupDialog';
```

**After:**
```typescript
import { DeleteGroupDialog } from '@/features/shared-groups';
// or
import { DeleteGroupDialog } from '@/features/shared-groups/components';
```

### Files to Update (Consumers)

| File | Import Count |
|------|-------------|
| `src/components/settings/subviews/GruposView.tsx` | ~12 imports |
| `src/App.tsx` | 1-2 imports (if any) |
| Various test files | ~14 test files |

### Merge Conflict Risk

This refactor touches many files. Best done when:
- No parallel stories are in-progress on SharedGroups
- Early in a sprint to allow time for conflicts

### Dependencies

- **Recommended:** Complete TD-14d-1 (Zustand migration) first
  - If done together, can combine store + components in one refactor
  - Reduces total merge conflicts

### References

- [04-architecture.md](../../../architecture/04-architecture.md) - Feature module structure
- [14d-v2-1-7e](./14d-v2-1-7e-delete-ui-security-rules.md) - Source of this tech debt item

## Completion Notes (2026-02-03)

### Summary

Successfully migrated SharedGroups components from legacy location to FSD-compliant feature module structure.

### Scope Expansion

Initial estimate was 14 component files. Actual count was **35 component files** plus **14 test files**. The legacy directory contained additional utility components not documented in the original story.

### Migration Details

| Metric | Value |
|--------|-------|
| Component files moved | 35 |
| Test files moved | 14 |
| Consumer files updated | 10 |
| Barrel exports added | 100+ |
| Build passes | ✅ |
| Tests passing | 320/321 (1 pre-existing Jest/Vitest failure) |

### Files Changed

**New Directories:**
- `src/features/shared-groups/components/` (35 .tsx files)
- `tests/unit/features/shared-groups/components/` (14 test files)

**Deleted Directories:**
- `src/components/SharedGroups/`
- `tests/unit/components/SharedGroups/`

**Consumer Updates:**
- `src/App.tsx` - ViewModeSwitcher, JoinGroupDialog
- `src/components/settings/subviews/GruposView.tsx` - All dialog imports
- `src/components/transactions/TransactionCard.tsx` - ProfileIndicator
- `src/components/scan/QuickSaveCard.tsx` - AutoTagIndicator
- `src/views/DashboardView.tsx` - TransactionGroupSelector
- `src/views/HistoryView.tsx` - TransactionGroupSelector
- `src/views/TrendsView.tsx` - MemberContributionChart
- `src/views/TransactionEditorViewInternal.tsx` - GroupWithMeta type
- `src/views/NotificationsView.tsx` - PendingInvitationsSection, NotificationsList

### Import Pattern

All imports now use the feature barrel:
```typescript
// Before
import { DeleteGroupDialog } from '@/components/SharedGroups/DeleteGroupDialog';

// After
import { DeleteGroupDialog } from '@/features/shared-groups';
```

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)
