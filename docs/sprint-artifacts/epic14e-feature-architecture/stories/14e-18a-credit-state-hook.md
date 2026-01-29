# Story 14e-18a: Credit Feature Structure & State Hook

Status: done

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Split from 14e-18: Part 1 of 3 -->

## Story

As a **developer**,
I want **the credit feature directory structure created and useCreditState hook implemented**,
So that **credit state management is colocated in the feature module**.

## Acceptance Criteria

1. **AC1**: `src/features/credit/` directory structure complete with:
   - `index.ts` barrel export (update from stub)
   - `state/useCreditState.ts` wrapper hook
   - `state/` directory created
   - `handlers/` directory created (for 14e-18b)

2. **AC2**: `useCreditState` hook wraps existing `useUserCredits` hook:
   - Exposes: `credits`, `loading`, `hasReservedCredits`
   - Exposes: `deductCredits`, `deductSuperCredits`, `addCredits`, `addSuperCredits`
   - Exposes: `reserveCredits`, `confirmReservedCredits`, `refundReservedCredits`
   - Exposes: `refreshCredits`
   - Unified interface for feature consumers

3. **AC3**: Path alias `@features/credit` resolves correctly

4. **AC4**: Unit tests verify wrapper hook passthrough behavior

5. **AC5**: Existing credit tests continue to pass (no breaking changes)

## Tasks / Subtasks

- [x] **Task 1: Create Feature Directory Structure** (AC: #1, #3)
  - [x] 1.1: Update `src/features/credit/index.ts` (currently stub) with proper exports
  - [x] 1.2: Create `src/features/credit/state/` directory
  - [x] 1.3: Create `src/features/credit/handlers/` directory (placeholder for 14e-18b)
  - [x] 1.4: Verify path alias `@features/credit` works in imports

- [x] **Task 2: Create useCreditState Hook** (AC: #2, #4, #5)
  - [x] 2.1: Analyze existing `useUserCredits` hook interface (src/hooks/useUserCredits.ts)
  - [x] 2.2: Create `src/features/credit/state/useCreditState.ts`
  - [x] 2.3: Implement wrapper that delegates to `useUserCredits`:
    ```typescript
    export function useCreditState(user: User | null, services: FirebaseServices | null) {
      const credits = useUserCredits(user, services);
      return useMemo(() => credits, [credits]);
    }
    ```
  - [x] 2.4: Export from `src/features/credit/index.ts`
  - [x] 2.5: Add unit tests for wrapper hook (verify all functions pass through correctly)

## Dev Notes

### Hook Wrapper Pattern

```typescript
// src/features/credit/state/useCreditState.ts
import { useMemo } from 'react';
import { User } from 'firebase/auth';
import { useUserCredits } from '../../../hooks/useUserCredits';

interface FirebaseServices {
  db: any;
  appId: string;
}

/**
 * Credit state wrapper hook for the credit feature module.
 * Delegates to useUserCredits - provides consistent interface for feature consumers.
 */
export function useCreditState(user: User | null, services: FirebaseServices | null) {
  const creditsResult = useUserCredits(user, services);

  // Stable reference for consumers
  return useMemo(() => creditsResult, [
    creditsResult.credits,
    creditsResult.loading,
    creditsResult.hasReservedCredits,
    // Functions are stable via useCallback in useUserCredits
  ]);
}

export type UseCreditStateResult = ReturnType<typeof useCreditState>;
```

### Testing Strategy

```typescript
// tests/unit/features/credit/useCreditState.test.ts
describe('useCreditState', () => {
  it('should delegate to useUserCredits', () => {
    // Verify wrapper passes through all properties
  });

  it('should expose all credit operations', () => {
    // Test: deductCredits, addCredits, reserveCredits, etc.
  });

  it('should maintain stable references', () => {
    // Test: useMemo prevents unnecessary re-renders
  });
});
```

### Files to Create

- `src/features/credit/state/useCreditState.ts`
- `tests/unit/features/credit/useCreditState.test.ts`

### Files to Modify

- `src/features/credit/index.ts` (update exports)

### Dependencies

- Story 14e-1 MUST be complete (directory structure exists)
- `src/hooks/useUserCredits.ts` (source hook - DO NOT MODIFY)

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.18]
- [Source: src/hooks/useUserCredits.ts - Story 14.24 reserve pattern]
- [Pattern: Epic 14c-refactor.27 - hook wrapper pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- None required - implementation was straightforward

### Completion Notes List

1. Created feature directory structure: `src/features/credit/state/` and `src/features/credit/handlers/`
2. Created `useCreditState` wrapper hook following hook wrapper pattern from Epic 14c-refactor.27
3. Hook exposes all 11 properties/functions from `useUserCredits`: credits, loading, hasReservedCredits, deductCredits, deductSuperCredits, addCredits, addSuperCredits, refreshCredits, reserveCredits, confirmReservedCredits, refundReservedCredits
4. Added `CreditFirebaseServices` interface for type safety
5. useMemo wraps result with all dependencies for stable references
6. 22 unit tests covering: delegation, state exposure, operations, reference stability, default state, type exports
7. All 5,779 existing tests continue to pass (AC5 verified)
8. TypeScript compilation successful - path alias `@features/credit` works correctly

### File List

**Created:**
- `src/features/credit/state/index.ts` - State barrel exports
- `src/features/credit/state/useCreditState.ts` - Wrapper hook (65 lines)
- `src/features/credit/handlers/index.ts` - Handler placeholder for 14e-18b
- `tests/unit/features/credit/state/useCreditState.test.ts` - 22 unit tests

**Modified:**
- `src/features/credit/index.ts` - Updated from stub to proper exports
