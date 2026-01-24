# Story 14e-0: Delete Bridge Layer Dead Code

**Epic:** 14e - Feature-Based Architecture
**Points:** 1
**Status:** ready-for-dev
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
- [ ] `src/hooks/useScanStateBridge.ts` is deleted
- [ ] No other files reference `useScanStateBridge`

### AC2: No Regressions

**Given** the bridge is truly unused
**When** the file is deleted
**Then:**
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (all ~5,700 tests)
- [ ] `npm run lint` passes
- [ ] Smoke test: Single scan flow works
- [ ] Smoke test: Batch scan flow works

### AC3: Hooks Index Updated (if applicable)

**Given** hooks may have a barrel export
**When** the file is deleted
**Then:**
- [ ] `src/hooks/index.ts` does not export `useScanStateBridge` (verify or remove if present)

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

- [ ] Bridge file deleted
- [ ] No TypeScript/build errors
- [ ] All tests pass
- [ ] Lint passes
- [ ] Single scan flow works (manual smoke test)
- [ ] Batch scan flow works (manual smoke test)
- [ ] Story marked as done in sprint-status.yaml

---

## Notes

- This is a **pure cleanup story** - no business logic changes
- Should take <15 minutes if the bridge is truly unused
- If any imports are found, STOP and investigate before deleting

---

## Dependencies

- **Depends on:** None (first story in epic)
- **Blocks:** 14e.1 (Directory Structure & Zustand Setup)
