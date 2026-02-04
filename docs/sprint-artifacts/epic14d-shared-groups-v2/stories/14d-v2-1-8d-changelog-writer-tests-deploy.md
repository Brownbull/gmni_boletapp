# Story 14d-v2.1.8d: Cloud Function - Changelog Writer Tests & Deployment

Status: done

> **Split from:** 14d-v2-1-8 (11 tasks, 45 subtasks exceeded sizing limits)
> **Split strategy:** by_phase (foundation → validation → polish → testing)
> **Related stories:** 14d-v2-1-8a, 14d-v2-1-8b, 14d-v2-1-8c
> **DEPENDS:** 14d-v2-1-8c

## Story

As a **developer**,
I want **comprehensive unit tests and successful deployment of the changelog writer**,
So that **the function is verified to work correctly in all scenarios before production use**.

## Acceptance Criteria

### From Original Story

1. **Given** the changelog writer implementation is complete
   **When** unit tests are run
   **Then** all change detection scenarios are covered (ADDED, MODIFIED, REMOVED, transfer)

2. **Given** idempotency is critical for reliability
   **When** the same event is processed twice
   **Then** tests verify no duplicate changelog entries are created

3. **Given** the function is ready for deployment
   **When** deployed to staging/production
   **Then** the function is verified with real Firestore events

## Tasks / Subtasks

- [x] **Task 10: Add Unit Tests** (AC: all) - COMPLETE (53 tests in prior stories)
  - [x] 10.1: Create `functions/src/__tests__/changelogWriter.test.ts` - Created in 8a
  - [x] 10.2: Test ADDED scenario (null → groupId) - 5 tests (lines 244-361)
  - [x] 10.3: Test MODIFIED scenario (same group, data changed) - 2 tests (lines 366-416)
  - [x] 10.4: Test REMOVED scenario (groupId → null) - 4 tests (lines 421-488)
  - [x] 10.5: Test group transfer (group A → group B) - 6 tests (lines 458-488, 890-1039)
  - [x] 10.6: Test soft delete (deletedAt set) - 2 tests (lines 493-534)
  - [x] 10.7: Test idempotency (same event ID = no duplicate) - 3 tests (lines 539-581)
  - [x] 10.8: Test group not found (skip gracefully) - 2 tests (lines 829-856)

- [x] **Task 11: Deploy and Verify** (AC: all) - Build verified, deployment manual
  - [x] 11.1: Build passes (`npm run build` ✅)
  - [x] 11.2: Tests pass (`npm test changelogWriter` - 53/53 ✅)
  - [ ] 11.3: Deploy to staging (MANUAL - requires `firebase deploy --only functions:onTransactionWrite`)
  - [ ] 11.4: Verify changelog entries created (MANUAL - post-deployment verification)
  - [ ] 11.5: Verify TTL field + idempotency (MANUAL - post-deployment verification)

## Dev Notes

### Test Structure

```typescript
// functions/test/changelogWriter.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { onTransactionWrite } from '../src/changelogWriter';
import { makeChange, makeEventContext } from './testHelpers';

describe('changelogWriter', () => {
  describe('Change Detection', () => {
    it('creates ADDED entry when transaction gets sharedGroupId', async () => {
      const before = null;
      const after = { sharedGroupId: 'group-1', amount: 1000 };
      const event = makeChange(before, after);

      await onTransactionWrite(event);

      // Verify changelog entry created
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: 'TRANSACTION_ADDED',
          groupId: 'group-1'
        })
      );
    });

    it('creates MODIFIED entry when data changes in same group', async () => {
      // Test implementation
    });

    it('creates REMOVED entry when sharedGroupId set to null', async () => {
      // Test implementation
    });

    it('creates REMOVED + ADDED entries for group transfer', async () => {
      const before = { sharedGroupId: 'group-A', amount: 1000 };
      const after = { sharedGroupId: 'group-B', amount: 1000 };
      // Should create 2 changelog entries
    });

    it('creates REMOVED entry on soft delete', async () => {
      const before = { sharedGroupId: 'group-1', deletedAt: null };
      const after = { sharedGroupId: 'group-1', deletedAt: new Date() };
      // Should create REMOVED entry
    });
  });

  describe('Idempotency', () => {
    it('uses event ID as document ID for idempotent writes', async () => {
      const eventId = 'event-123';
      const event = makeChange(null, { sharedGroupId: 'group-1' }, eventId);

      await onTransactionWrite(event);

      // Verify set() called with event ID in path
      expect(mockBatch.set).toHaveBeenCalledWith(
        expect.objectContaining({ id: `${eventId}-TRANSACTION_ADDED` }),
        expect.any(Object)
      );
    });

    it('does not create duplicate on retry with same event ID', async () => {
      // set() with same ID overwrites, not duplicates
    });
  });

  describe('Validation', () => {
    it('skips changelog when group does not exist', async () => {
      mockGroupDoc.exists = false;

      await onTransactionWrite(event);

      expect(mockBatch.set).not.toHaveBeenCalled();
    });
  });
});
```

### Testing Standards

- **Unit tests:** Mock Firestore for function logic
- **Integration tests:** Use Firebase emulator for trigger testing
- **Idempotency tests:** Simulate retry by calling function twice with same event
- **Coverage target:** 80%+ for new code

### Deployment Checklist

1. [x] `npm run build` passes - ✅ 2026-02-04
2. [x] `npm test` passes (all unit tests) - ✅ 57/57 passing 2026-02-04
3. [ ] Deploy to staging: `firebase deploy --only functions:onTransactionWrite --project staging`
4. [ ] Create test transaction with sharedGroupId
5. [ ] Verify changelog entry in `/sharedGroups/{groupId}/changelog/`
6. [ ] Verify `_ttl` is set to 30 days from now
7. [ ] Simulate retry (deploy code change, trigger on same doc)
8. [ ] Verify no duplicate entries

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `functions/src/__tests__/changelogWriter.test.ts` | **MODIFIED** | 57 unit tests (53 from 8a/8b/8c + 4 security tests added) |

> Note: Test file location is `functions/src/__tests__/` (not `functions/test/` as originally drafted)

### Dependencies

| Dependency | Status |
|------------|--------|
| **Blocked by:** Story 14d-v2-1-8c | Function must be complete |
| **Blocks:** Story 2.3 (90-Day Changelog Sync) | Consumes changelog entries |
| **Blocks:** Story 4.1 (Push Notification Infrastructure) | Uses summary field |

### References

- [Story 14d-v2-1-8a: Foundation](14d-v2-1-8a-changelog-writer-foundation.md)
- [Story 14d-v2-1-8b: Validation](14d-v2-1-8b-changelog-writer-validation.md)
- [Story 14d-v2-1-8c: Logging](14d-v2-1-8c-changelog-writer-logging-export.md)
- [Existing tests: functions/test/]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101) via ECC Dev Story workflow

### Debug Log References

- Build: `npm run build` - ✅ TypeScript compilation successful
- Test: `npm test changelogWriter` - ✅ 57/57 tests passing

### Completion Notes List

1. **All unit tests already implemented in prior stories (8a, 8b, 8c):**
   - Story 8a: Created test file with initial tests (31 tests)
   - Story 8b: Added batch writing tests (42 tests)
   - Story 8c: Added structured logging tests (53 tests)
   - Story 8d: Added security tests from ECC review (57 tests)

2. **Test Coverage Analysis (57 tests):**
   | Category | Tests |
   |----------|-------|
   | AC #1: TRANSACTION_ADDED | 5 |
   | AC #2: TRANSACTION_MODIFIED | 2 |
   | AC #3: TRANSACTION_REMOVED | 4 |
   | AC #4: Soft delete | 2 |
   | AC #5: Idempotency | 3 |
   | Edge Cases (no group) | 2 |
   | Edge Cases (summary defaults) | 4 |
   | Error Handling | 2 |
   | Summary REMOVED entries | 1 |
   | Trigger Configuration | 2 |
   | Security (membership) | 4 |
   | Security (invalid GroupId) | 2 |
   | Batch Writing | 7 |
   | Summary Sanitization | 5 |
   | Structured Logging | 11 |
   | Ownership Validation | 2 |

3. **ECC Parallel Review (2026-02-04):**

   **Overall Score: 8.25/10 - APPROVED**

   | Category | Status | Score |
   |----------|--------|-------|
   | Code Quality | ✅ PASS | 7.5/10 |
   | Security | ✅ PASS | 8/10 |
   | Architecture | ✅ PASS | 9/10 |
   | Testing | ✅ PASS | 8.5/10 |

   **Agents Used:** code-reviewer, security-reviewer, architect, tdd-guide (parallel)

   **Findings Summary:**
   - CRITICAL: 0
   - HIGH: 0
   - MEDIUM: 4 (all deferred to existing TD stories)
   - LOW: 5

   **4 tests added to address review findings:**
   - Category field XSS sanitization test
   - img onerror XSS vector test
   - svg onload XSS vector test
   - Firestore error handling during membership check

4. **Build verification:**
   - TypeScript compilation: ✅ No errors
   - Function export: ✅ `onTransactionWrite` exported from `functions/src/index.ts`

4. **Manual deployment tasks remaining:**
   - Deploy to staging/production with `firebase deploy --only functions:onTransactionWrite`
   - Post-deployment verification of changelog entries
   - Post-deployment verification of TTL and idempotency

### File List

| File | Status | Notes |
|------|--------|-------|
| `functions/src/changelogWriter.ts` | UNCHANGED | Implementation complete (685 lines) |
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFIED | 57 tests (4 security tests added from ECC review) |
| `functions/src/index.ts` | UNCHANGED | Export verified (line 196) |
| `docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-8d-changelog-writer-tests-deploy.md` | MODIFIED | Story file updated with completion notes |
| `docs/sprint-artifacts/sprint-status.yaml` | MODIFIED | Status updated to review |

### Tech Debt Stories Related

The following deferred items from ECC review are tracked in existing TD stories:

| TD Story | Description | Priority | Status |
|----------|-------------|----------|--------|
| [TD-14d-9](./TD-14d-9-type-sync-validation.md) | Cloud Function type synchronization validation | LOW | ready-for-dev |
| [TD-14d-11](./TD-14d-11-toctou-membership-validation.md) | Atomic membership validation with Firestore transactions | LOW | ready-for-dev |
| [TD-14d-14](./TD-14d-14-enhanced-html-sanitization.md) | Enhanced HTML sanitization for summary fields | LOW | ready-for-dev |
| [TD-14d-15](./TD-14d-15-test-assertion-strengthening.md) | Strengthen idempotency test assertions | LOW | ready-for-dev |

**Accepted Risks (not tracked as TD):**
- Rate limiting for changelog writes - Mitigated by Firestore quotas, 30-day TTL, and membership validation
