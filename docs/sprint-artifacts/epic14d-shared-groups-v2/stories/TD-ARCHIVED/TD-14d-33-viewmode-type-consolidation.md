# Tech Debt Story TD-14d-33: Consolidate ViewMode Type to Single Source

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** MEDIUM (DRY violation, type duplication)
> **Estimated Effort:** 30 min - 1 hour
> **Risk:** Low (refactoring with TypeScript safety)

## Story

As a **developer**,
I want **the ViewMode type defined in a single location**,
So that **type changes are made in one place and inconsistencies are prevented**.

## Problem Statement

The ECC Architecture Review identified type duplication:

**ViewMode type defined in:**
1. `src/utils/viewModeFilterUtils.ts:22` - `export type ViewMode = 'personal' | 'group';`
2. `src/shared/stores/useViewModeStore.ts:32` - `type ViewMode = 'personal' | 'group';`

This violates DRY and creates risk of the types diverging if one is updated but not the other.

## Acceptance Criteria

1. **Given** the ViewMode type
   **When** I search the codebase
   **Then** it is defined in exactly one location

2. **Given** all files using ViewMode
   **When** they need the type
   **Then** they import from the single source

3. **Given** a TypeScript build
   **When** ViewMode is used incorrectly
   **Then** compile errors are caught

## Tasks / Subtasks

- [ ] Task 1: Decide on canonical location
  - [ ] Option A: Keep in store, export from store
  - [ ] Option B: Move to `src/types/viewMode.ts`
  - [ ] Option C: Keep in utils (already exported)
  - [ ] **Recommended:** Option C - utils already exports it, store should import

- [ ] Task 2: Update useViewModeStore to import ViewMode
  - [ ] Remove local `type ViewMode` definition
  - [ ] Add `import type { ViewMode } from '@/utils/viewModeFilterUtils'`
  - [ ] Verify TypeScript compiles

- [ ] Task 3: Verify no other duplications exist
  - [ ] Search: `grep -r "type ViewMode" src/`
  - [ ] Ensure only one definition remains

## Dev Notes

### Current State

```typescript
// src/utils/viewModeFilterUtils.ts:22
export type ViewMode = 'personal' | 'group';

// src/shared/stores/useViewModeStore.ts:32
type ViewMode = 'personal' | 'group';  // Duplicate!
```

### Recommended Change

```typescript
// src/shared/stores/useViewModeStore.ts
import type { ViewMode } from '@/utils/viewModeFilterUtils';

// Remove the local type definition
```

### Alternative: Move to Types Directory

If more type sharing is anticipated:

```typescript
// src/types/viewMode.ts
export type ViewMode = 'personal' | 'group';

// Both files import from here
import type { ViewMode } from '@/types/viewMode';
```

### Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/shared/stores/useViewModeStore.ts` | Modify | Import instead of define |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Type safety** | Single source of truth | May diverge |
| **Merge conflict risk** | Low | Low |
| **Context window fit** | Trivial | Trivial |
| **Sprint capacity** | 30 min | Scheduled later |

**Recommendation:** Low priority - Quick fix, do when touching either file.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Architect agent
