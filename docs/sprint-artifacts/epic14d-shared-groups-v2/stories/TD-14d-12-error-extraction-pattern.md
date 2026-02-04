# Tech Debt Story TD-14d-12: Standardize Error Extraction Pattern Across Cloud Functions

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-03) on story 14d-v2-1-8a
> **Priority:** LOW (edge case, no observed bugs)
> **Estimated Effort:** Small (1-2 hours)
> **Risk:** LOW (current pattern works in most cases)

## Story

As a **developer**,
I want **a robust error extraction pattern across all Cloud Functions**,
So that **error logging is reliable regardless of error source or module boundary**.

## Problem Statement

The current error extraction pattern uses `instanceof Error`:

```typescript
// functions/src/changelogWriter.ts:190, 455
error: error instanceof Error ? error.message : String(error),
```

`instanceof Error` can fail when:
1. Errors cross module boundaries (different realms)
2. Errors come from external packages with custom error classes
3. Errors are from different JavaScript contexts (rare in Cloud Functions)

### Current Usage Across Cloud Functions

| File | Pattern Used |
|------|--------------|
| `changelogWriter.ts` | `instanceof Error` |
| `analyzeReceipt.ts` | `instanceof Error` |
| `cleanupCrossUserFcmToken.ts` | `instanceof Error` |
| `webPushService.ts` | `instanceof Error` |
| `triggers/onMemberRemoved.ts` | `instanceof Error` |

All Cloud Functions use the same pattern, so this is a codebase-wide improvement.

## Acceptance Criteria

1. **Given** an error is caught in a Cloud Function
   **When** the error has a `message` property
   **Then** the message is extracted regardless of prototype chain

2. **Given** an error is caught in a Cloud Function
   **When** the error is a plain object without `message`
   **Then** the error is converted to string safely

3. **Given** all Cloud Functions
   **When** error extraction is needed
   **Then** they use the shared helper function

## Tasks / Subtasks

- [ ] **Task 1: Create Error Extraction Helper**
  - [ ] 1.1: Create `functions/src/utils/errorUtils.ts`
  - [ ] 1.2: Implement `getErrorMessage(error: unknown): string`
  - [ ] 1.3: Add unit tests for various error types

- [ ] **Task 2: Update All Cloud Functions**
  - [ ] 2.1: Update `changelogWriter.ts` to use helper
  - [ ] 2.2: Update `analyzeReceipt.ts` to use helper
  - [ ] 2.3: Update `cleanupCrossUserFcmToken.ts` to use helper
  - [ ] 2.4: Update `webPushService.ts` to use helper
  - [ ] 2.5: Update `triggers/onMemberRemoved.ts` to use helper

- [ ] **Task 3: Add ESLint Rule (Optional)**
  - [ ] 3.1: Configure eslint rule to warn on `instanceof Error` pattern
  - [ ] 3.2: Document the preferred pattern in CONTRIBUTING.md

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Bug risk | Minimal - edge case | Same |
| Consistency | Improves codebase | Technical debt |
| Effort | ~2 hours | Same |
| Accumulation risk | None | Grows with more functions |

**Recommendation:** Defer - Can be batched with next Cloud Function work

### Implementation

```typescript
// functions/src/utils/errorUtils.ts

/**
 * Extracts error message safely from any error type.
 * Handles cross-module errors, custom error classes, and plain objects.
 */
export function getErrorMessage(error: unknown): string {
  // Handle Error objects (including cross-realm)
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Fallback to string conversion
  return String(error);
}

/**
 * Creates a structured error log object.
 */
export function createErrorLog(error: unknown): Record<string, unknown> {
  const base = { message: getErrorMessage(error) };

  if (error && typeof error === 'object') {
    if ('code' in error) base.code = (error as { code: unknown }).code;
    if ('name' in error) base.name = (error as { name: unknown }).name;
  }

  return base;
}
```

### Usage After Implementation

```typescript
// Before
error: error instanceof Error ? error.message : String(error),

// After
error: getErrorMessage(error),
```

### Files Affected

| File | Action |
|------|--------|
| `functions/src/utils/errorUtils.ts` | CREATE |
| `functions/src/__tests__/utils/errorUtils.test.ts` | CREATE |
| `functions/src/changelogWriter.ts` | MODIFY |
| `functions/src/analyzeReceipt.ts` | MODIFY |
| `functions/src/cleanupCrossUserFcmToken.ts` | MODIFY |
| `functions/src/webPushService.ts` | MODIFY |
| `functions/src/triggers/onMemberRemoved.ts` | MODIFY |

### References

- [14d-v2-1-8a](./14d-v2-1-8a-changelog-writer-foundation.md) - Source of this tech debt item
- [MDN instanceof](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/instanceof) - Limitations documentation
