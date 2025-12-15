# Story 9.4: Merchant Mapping Infrastructure

**Epic:** Epic 9 - Scan Enhancement & Merchant Learning
**Status:** done
**Story Points:** 3
**Dependencies:** None (can run parallel to 9.1)

---

## User Story

As a **developer**,
I want **merchant mapping types and Firestore service**,
So that **merchant name corrections can be stored and retrieved**.

---

## Acceptance Criteria

- [x] **AC #1:** `MerchantMapping` interface defined in `src/types/merchantMapping.ts`
- [x] **AC #2:** `merchantMappingService.ts` created following categoryMappingService pattern
- [x] **AC #3:** Firestore security rules added for `merchant_mappings` collection
- [x] **AC #4:** `normalizeMerchantName()` function normalizes merchant names for matching
- [x] **AC #5:** Upsert behavior prevents duplicate mappings for same normalizedMerchant
- [x] **AC #6:** Unit tests for merchantMappingService
- [x] **AC #7:** Integration tests for Firestore operations

---

## Tasks / Subtasks

- [x] Create `src/types/merchantMapping.ts` (AC: #1)
  - [x] Define `MerchantMapping` interface (simplified, no merchantPattern)
  - [x] Define `NewMerchantMapping` type
  - [x] Define `MerchantMatchResult` interface
- [x] Create `src/services/merchantMappingService.ts` (AC: #2, #4, #5)
  - [x] Implement `normalizeMerchantName()` function
  - [x] Implement `saveMerchantMapping()` with upsert behavior
  - [x] Implement `getMerchantMappings()`
  - [x] Implement `subscribeToMerchantMappings()`
  - [x] Implement `deleteMerchantMapping()`
  - [x] Implement `incrementMerchantMappingUsage()`
- [x] Verify `firestore.rules` covers merchant_mappings (AC: #3) - wildcard rule already covers it
- [x] Create `src/hooks/useMerchantMappings.ts` hook
- [x] Create `tests/unit/merchantMappingService.test.ts` (AC: #6)
  - [x] Test `normalizeMerchantName()` edge cases (20 tests)
  - [x] Test CRUD operations
  - [x] Test upsert behavior (AC: #5)
- [x] Create `tests/integration/merchantMappingService.test.ts` (AC: #7)
- [x] Run all tests and verify passing

---

## Technical Summary

This story establishes the data foundation for Merchant Learning:

1. **TypeScript Types:** Simplified `MerchantMapping` interface (no `merchantPattern` field)
2. **Service Layer:** CRUD operations following `categoryMappingService.ts` pattern
3. **Security:** Firestore rules ensuring per-user data isolation
4. **React Hook:** `useMerchantMappings` for component integration

**Key Difference from CategoryMapping:**
- No `merchantPattern` field (simpler model per ADR-1)
- Source is always 'user' (no AI suggestions for MVP)

---

## Project Structure Notes

- **Files to create:**
  - `src/types/merchantMapping.ts`
  - `src/services/merchantMappingService.ts`
  - `src/hooks/useMerchantMappings.ts`
  - `tests/unit/merchantMappingService.test.ts`
  - `tests/integration/merchantMapping.test.ts`
- **Files to modify:**
  - `firestore.rules`
- **Expected test locations:** `tests/unit/`, `tests/integration/`
- **Prerequisites:** None (foundation story)

---

## Key Code References

**Architecture Reference:**
- [architecture-epic9.md](./architecture-epic9.md) - ADR-1: Simplified MerchantMapping Model

**Existing Patterns:**
- `src/types/categoryMapping.ts` - Pattern to follow (but simplified)
- `src/services/categoryMappingService.ts` - Service pattern
- `src/hooks/useCategoryMappings.ts` - Hook pattern
- `firestore.rules` - Existing security rules

**Collection Path:**
```
artifacts/{appId}/users/{userId}/merchant_mappings/{mappingId}
```

**Type Definition:**
```typescript
// src/types/merchantMapping.ts
export interface MerchantMapping {
  id?: string;
  originalMerchant: string;      // For dialog display
  normalizedMerchant: string;    // For fuzzy matching
  targetMerchant: string;        // User's preferred name
  confidence: number;            // Always 1.0 for user
  source: 'user';                // Always 'user' for MVP
  createdAt: Timestamp;
  updatedAt: Timestamp;
  usageCount: number;
}

export type NewMerchantMapping = Omit<MerchantMapping, 'id' | 'createdAt' | 'updatedAt'>;

export interface MerchantMatchResult {
  mapping: MerchantMapping;
  score: number;
  confidence: number;
}
```

**Normalization Function:**
```typescript
export function normalizeMerchantName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/gi, '')
    .replace(/\s+/g, ' ');
}
```

---

## Context References

**Tech-Spec:** [tech-spec-epic-9.md](./tech-spec-epic-9.md)
**Architecture:** [architecture-epic9.md](./architecture-epic9.md)

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Implemented merchant mapping infrastructure following the existing categoryMappingService pattern:

1. **Types (AC #1):** Created `MerchantMapping`, `NewMerchantMapping`, and `MerchantMatchResult` interfaces with simplified model (no merchantPattern field per ADR-1, source always 'user' for MVP)

2. **Service (AC #2, #4, #5):** Created merchantMappingService with:
   - `normalizeMerchantName()` - lowercase, trim, remove special chars, collapse spaces
   - `saveMerchantMapping()` - with upsert behavior (queries by normalizedMerchant)
   - `getMerchantMappings()` - fetch all user mappings
   - `subscribeToMerchantMappings()` - real-time subscription
   - `deleteMerchantMapping()` - remove mapping
   - `incrementMerchantMappingUsage()` - track auto-application count

3. **Security (AC #3):** Verified existing wildcard rule `match /artifacts/{appId}/users/{userId}/{document=**}` already covers merchant_mappings collection - no changes needed

4. **Hook:** Created `useMerchantMappings` hook with real-time subscription, saveMapping, deleteMapping, and findMatch (basic exact-match, fuzzy matching in Story 9.5)

5. **Tests (AC #6, #7):**
   - Unit tests: 20 tests for normalizeMerchantName covering lowercase, trim, special chars, unicode, numbers, edge cases, and real-world examples
   - Integration tests: 11 tests for CRUD operations, upsert behavior, user isolation, and security rules

### Files Created
- `src/types/merchantMapping.ts` - Type definitions
- `src/services/merchantMappingService.ts` - Firestore service
- `src/hooks/useMerchantMappings.ts` - React hook
- `tests/unit/merchantMappingService.test.ts` - Unit tests (20 tests)
- `tests/integration/merchantMappingService.test.ts` - Integration tests (11 tests)

### Files Modified
- None (firestore.rules already has wildcard coverage)

### Test Results
- Unit tests: 20/20 passed
- Integration tests: 11/11 passed
- Full test suite: 1496/1496 passed (no regressions)
- TypeScript compilation: No errors

---

## Review Notes
<!-- Will be populated during code review -->

---

## Senior Developer Review (AI)

### Reviewer
Gabe

### Date
2025-12-13

### Outcome
**APPROVE** - All acceptance criteria fully implemented with evidence. Code follows established patterns, comprehensive test coverage, and adheres to architecture decisions.

### Summary
Story 9.4 establishes the data foundation for Merchant Learning with a well-implemented merchant mapping infrastructure. The implementation correctly follows the categoryMappingService pattern (per Epic 6) while applying ADR-1's simplified model (no merchantPattern field). All service functions are properly implemented with upsert behavior, real-time subscriptions, and atomic usage tracking. Firestore security rules are correctly covered by the existing wildcard rule. Test coverage is comprehensive with 31 tests total.

### Key Findings

**HIGH Severity:** None

**MEDIUM Severity:** None

**LOW Severity:** None

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| #1 | `MerchantMapping` interface defined in `src/types/merchantMapping.ts` | IMPLEMENTED | `src/types/merchantMapping.ts:9-28` |
| #2 | `merchantMappingService.ts` created following categoryMappingService pattern | IMPLEMENTED | `src/services/merchantMappingService.ts:1-145` |
| #3 | Firestore security rules added for `merchant_mappings` collection | IMPLEMENTED | `firestore.rules:6-8` (wildcard rule covers) |
| #4 | `normalizeMerchantName()` function normalizes merchant names | IMPLEMENTED | `src/services/merchantMappingService.ts:32-38` |
| #5 | Upsert behavior prevents duplicate mappings | IMPLEMENTED | `src/services/merchantMappingService.ts:44-74` |
| #6 | Unit tests for merchantMappingService | IMPLEMENTED | `tests/unit/merchantMappingService.test.ts` (20 tests) |
| #7 | Integration tests for Firestore operations | IMPLEMENTED | `tests/integration/merchantMappingService.test.ts` (11 tests) |

**Summary:** 7 of 7 acceptance criteria fully implemented

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Create `src/types/merchantMapping.ts` | Complete | VERIFIED | File exists, 46 lines |
| Define MerchantMapping interface | Complete | VERIFIED | Lines 9-28 |
| Define NewMerchantMapping type | Complete | VERIFIED | Line 33 |
| Define MerchantMatchResult interface | Complete | VERIFIED | Lines 38-45 |
| Create merchantMappingService.ts | Complete | VERIFIED | File exists, 145 lines |
| Implement normalizeMerchantName() | Complete | VERIFIED | Lines 32-38 |
| Implement saveMerchantMapping() with upsert | Complete | VERIFIED | Lines 44-74 |
| Implement getMerchantMappings() | Complete | VERIFIED | Lines 79-92 |
| Implement subscribeToMerchantMappings() | Complete | VERIFIED | Lines 97-113 |
| Implement deleteMerchantMapping() | Complete | VERIFIED | Lines 118-127 |
| Implement incrementMerchantMappingUsage() | Complete | VERIFIED | Lines 132-144 |
| Verify firestore.rules coverage | Complete | VERIFIED | Wildcard rule at lines 6-8 |
| Create useMerchantMappings.ts hook | Complete | VERIFIED | File exists, 157 lines |
| Create unit tests (20 tests) | Complete | VERIFIED | 20/20 pass |
| Create integration tests (11 tests) | Complete | VERIFIED | 11/11 pass |
| Run all tests and verify passing | Complete | VERIFIED | Unit: 680/680, Integration: 328/328 |

**Summary:** 16 of 16 completed tasks verified, 0 questionable, 0 false completions

### Test Coverage and Gaps
- **Unit Tests:** 20 tests covering normalizeMerchantName() with comprehensive edge cases (lowercase, trim, special chars, unicode, numbers, real-world examples)
- **Integration Tests:** 11 tests covering CRUD operations, upsert behavior, user isolation, and unauthenticated access blocking
- **Type Safety:** TypeScript compilation passes with no errors
- **No gaps identified** - all critical paths covered

### Architectural Alignment
- Follows ADR-1: Simplified MerchantMapping Model (no merchantPattern field)
- Uses user-scoped subcollection pattern (ADR-4)
- Service pattern matches categoryMappingService.ts exactly
- Hook pattern matches useCategoryMappings.ts exactly
- Security rules properly scoped per architecture spec

### Security Notes
- User isolation enforced via Firestore wildcard rule
- Authentication required for all operations
- No sensitive data exposure in types or services
- Atomic operations using Firebase increment()
- Integration tests verify cross-user access blocked

### Best-Practices and References
- [Firebase Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started) - Wildcard rules pattern
- [React useCallback/useMemo](https://react.dev/reference/react/useCallback) - Proper memoization
- [Vitest Testing](https://vitest.dev/) - Test framework for unit/integration tests

### Action Items

**Code Changes Required:**
None - all criteria met

**Advisory Notes:**
- Note: Consider adding error boundary in components that use useMerchantMappings hook for better UX
- Note: Future Story 9.5 will add Fuse.js fuzzy matching (findMatch is currently exact-match only)

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-12 | 1.0 | Story drafted |
| 2025-12-13 | 1.1 | Implementation complete - all ACs satisfied, 31 tests passing |
| 2025-12-13 | 1.2 | Senior Developer Review - APPROVED |
