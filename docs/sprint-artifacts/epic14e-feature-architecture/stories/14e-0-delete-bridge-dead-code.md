# Story 14e-0: Delete Bridge Layer Dead Code

**Epic:** 14e - Feature-Based Architecture
**Points:** 1
**Status:** done
**Created:** 2026-01-24
**Pre-requisite:** Must complete before Story 14e.1

---

## User Story

As a **developer**,
I want **dead code from Epic 14d migration removed from the codebase**,
So that **the codebase is clean before introducing new architecture**.

---

## Context

### Background

Epic 14d (Scan Architecture Refactor) created a bridge layer (`useScanStateBridge`) to incrementally migrate scan state from App.tsx local state to ScanContext. The migration completed successfully:

- Story 14d-4a: Created the bridge
- Story 14d-4b: Migrated consumers to ScanContext
- Story 14d-4c-4e: Removed App.tsx state variables

**However, the bridge file was never deleted after migration completed.**

### Current State

```
src/hooks/useScanStateBridge.ts  # 17,892 bytes - EXISTS BUT NOT IMPORTED ANYWHERE
```

Verification:
- `grep -r "useScanStateBridge" src/` returns only the file itself
- Not imported in App.tsx or any other file
- This is pure dead code

### Why This Must Be Done First

1. **Clean slate**: Before restructuring to `src/features/`, dead code should be removed
2. **Validation**: Confirms 14d migration is truly complete
3. **Prevents confusion**: New developers won't wonder what the bridge does

---

## Acceptance Criteria

### AC1: Bridge File Deleted

**Given** `src/hooks/useScanStateBridge.ts` exists but is unused
**When** this story is completed
**Then:**
- [x] `src/hooks/useScanStateBridge.ts` is deleted
- [x] No other files reference `useScanStateBridge`

### AC2: No Regressions

**Given** the bridge is truly unused
**When** the file is deleted
**Then:**
- [x] `npm run build` succeeds
- [x] `npm run test` passes (all ~5,700 tests) - 5,264 tests pass
- [x] `npm run lint` passes - N/A (no lint script configured)
- [x] Smoke test: Single scan flow works - VERIFIED
- [x] Smoke test: Batch scan flow works - VERIFIED (via long-press FAB → Batch mode)

### AC3: Hooks Index Updated (if applicable)

**Given** hooks may have a barrel export
**When** the file is deleted
**Then:**
- [x] `src/hooks/index.ts` does not export `useScanStateBridge` (N/A - no barrel export exists)

---

## Technical Implementation

### Step 1: Verify Truly Unused

```bash
# Should return only the file itself, no imports
grep -r "useScanStateBridge" src/

# Should return nothing (no imports)
grep -r "from.*useScanStateBridge" src/
```

### Step 2: Delete the File

```bash
rm src/hooks/useScanStateBridge.ts
```

### Step 3: Check Barrel Export

```bash
# Check if exported from hooks index
grep "useScanStateBridge" src/hooks/index.ts
# If found, remove the export line
```

### Step 4: Verify Build

```bash
npm run build
npm run test
npm run lint
```

### Step 5: Smoke Test

1. Open app in browser
2. Start single scan → capture image → process → review → save
3. Start batch scan → capture multiple → process → review → save all
4. Verify FAB states work correctly

---

## Files to Delete

| File | Size | Reason |
|------|------|--------|
| `src/hooks/useScanStateBridge.ts` | 17,892 bytes | Dead code - not imported anywhere |

---

## Files to Potentially Modify

| File | Change |
|------|--------|
| `src/hooks/index.ts` | Remove export if present (verify first) |

---

## Definition of Done

- [x] Bridge file deleted
- [x] No TypeScript/build errors
- [x] All tests pass (5,264 tests)
- [x] Lint passes (N/A - no lint script)
- [x] Single scan flow works (manual smoke test) - VERIFIED
- [x] Batch scan flow works (manual smoke test) - VERIFIED via long-press FAB → Batch mode
- [x] Story marked as done in sprint-status.yaml

---

## Notes

- This is a **pure cleanup story** - no business logic changes
- Should take <15 minutes if the bridge is truly unused
- If any imports are found, STOP and investigate before deleting

---

## Dependencies

- **Depends on:** None (first story in epic)
- **Blocks:** 14e.1 (Directory Structure & Zustand Setup)

---

## File List

| File | Action | Lines |
|------|--------|-------|
| `src/hooks/useScanStateBridge.ts` | DELETED | 503 |
| `tests/unit/hooks/useScanStateBridge.test.ts` | DELETED | ~300 |
| `tests/config/vitest.config.ci.group-hooks-scan.ts` | MODIFIED | -1 (code review fix) |
| `tests/config/vitest.config.ci.group-hooks-other.ts` | MODIFIED | -1 (code review fix) |
| `eslint.config.security.mjs` | MODIFIED | -1 (code review fix) |

---

## Dev Agent Record

### Implementation Date
2026-01-24

### Completion Notes

**Verification performed:**
1. `grep -r "useScanStateBridge" src/` - returned only self-references within the file
2. `grep -r "from.*useScanStateBridge" src/` - returned no imports (confirmed dead code)
3. `src/hooks/index.ts` - does not exist (no barrel export to clean up)

**Files deleted:**
- `src/hooks/useScanStateBridge.ts` (17,892 bytes) - bridge layer from Epic 14d migration
- `tests/unit/hooks/useScanStateBridge.test.ts` - associated test file

**Validation:**
- Build: PASSED
- Tests: 5,264 passed, 33 skipped (212 test files)
- Lint: N/A (no lint script configured in package.json)

**Remaining for reviewer:**
- Manual smoke test: Single scan flow
- Manual smoke test: Batch scan flow

---

## Code Review Record

### Atlas-Enhanced Code Review
**Date:** 2026-01-24
**Reviewer:** Atlas Code Review Workflow

### Findings

| Severity | Issue | Status |
|----------|-------|--------|
| MEDIUM | CI config `vitest.config.ci.group-hooks-scan.ts` referenced deleted test file | ✅ FIXED |
| MEDIUM | CI config `vitest.config.ci.group-hooks-other.ts` referenced deleted test file | ✅ FIXED |
| MEDIUM | ESLint security config `eslint.config.security.mjs` ignored deleted file | ✅ FIXED |

### Atlas Validation
- **Architecture Compliance:** ✅ PASSED - Aligns with Epic 14d completion
- **Pattern Compliance:** ✅ PASSED - Test file deleted with implementation
- **Workflow Chain Impact:** ✅ NONE - Bridge was unused, no workflow affected

### Verification After Fixes
- Build: PASSED
- Tests: 5,264 passed, 33 skipped
- All stale config references removed

### Smoke Test Results
- [x] Single scan flow: PASSED
- [x] Batch scan flow (long-press FAB → Batch mode): PASSED

### Pre-existing Bug Discovered (Not a Regression)

During smoke testing, a **pre-existing bug** was discovered in the legacy batch path:

**Issue:** When selecting multiple images in single-scan mode (via file input), clicking "Procesar todas" appears to do nothing.

**Root Cause:** `BatchUploadPreview` (z-50) renders after `AppOverlays` in the DOM, so when `CreditWarningDialog` (also z-50) is shown, it appears BEHIND the still-visible BatchUploadPreview.

**Impact:** Legacy batch path is broken, but this is NOT caused by deleting `useScanStateBridge`:
- The bridge was confirmed unused (not imported anywhere)
- The proper batch flow (long-press FAB → Batch mode) works correctly
- This bug predates this story

**Recommendation:** Create a separate bug story to fix z-index layering in `handleBatchConfirmWithCreditCheck`.
