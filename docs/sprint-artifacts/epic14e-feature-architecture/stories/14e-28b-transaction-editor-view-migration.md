# Story 14e.28b: TransactionEditorView Internal Hook Migration

Status: done

**Epic:** 14e - Feature-Based Architecture (Follow-up)
**Points:** 2
**Created:** 2026-01-28
**Author:** Claude (via 14e-28 implementation)
**Depends:** 14e-28

---

## Story

As a **developer**,
I want **TransactionEditorView to call useTransactionEditorData and useTransactionEditorHandlers internally**,
So that **the view is fully self-contained and useTransactionEditorViewProps can be deleted**.

---

## Context

### Current State (After 14e-28)

Story 14e-28 extracted handlers to `useTransactionEditorHandlers` hook but:
- App.tsx still calls the hook and passes handlers to `useTransactionEditorViewProps`
- `useTransactionEditorViewProps` still exists as an intermediary
- TransactionEditorView receives all data via props

### Target State

Following the pattern from HistoryView, TrendsView, DashboardView, SettingsView:
- TransactionEditorView calls `useTransactionEditorData()` internally
- TransactionEditorView calls `useTransactionEditorHandlers()` internally
- App.tsx only passes minimal `_testOverrides` for state coordination
- `useTransactionEditorViewProps` is deleted

### Files Ready for Migration

Created in 14e-28:
- `src/views/TransactionEditorView/useTransactionEditorHandlers.ts` - All handlers
- `src/views/TransactionEditorView/useTransactionEditorData.ts` - All data composition
- `src/views/TransactionEditorView/index.ts` - Barrel exports

To be deleted:
- `src/hooks/app/useTransactionEditorViewProps.ts` (~590 lines)
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`

---

## Acceptance Criteria

### AC1: TransactionEditorView Uses Internal Hooks

**Given** the hooks created in 14e-28
**When** migrating the view
**Then:**
- [x] TransactionEditorView calls `useTransactionEditorData()` for all data
- [x] TransactionEditorView calls `useTransactionEditorHandlers()` for all handlers
- [x] Props interface reduced to minimal `_testOverrides` pattern
- [x] View file moved to `src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx` (wrapper pattern)

### AC2: Delete useTransactionEditorViewProps

**Given** the view now owns its data
**When** cleanup is complete
**Then:**
- [x] `src/hooks/app/useTransactionEditorViewProps.ts` deleted
- [x] Export removed from `src/hooks/app/index.ts`
- [x] Test file `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts` deleted
- [x] App.tsx import removed

### AC3: App.tsx Integration

**Given** TransactionEditorView is self-contained
**When** rendered from App.tsx
**Then:**
- [x] App.tsx passes minimal `_testOverrides` (like HistoryView pattern)
- [x] App.tsx handler hook call removed
- [x] ~50 lines removed from App.tsx

### AC4: Tests & Verification

**Given** the migration is complete
**When** verification runs
**Then:**
- [x] All existing tests pass (6761 tests)
- [ ] New tests for useTransactionEditorData (deferred - see Tasks 14)
- [ ] New tests for useTransactionEditorHandlers (deferred - see Tasks 13)
- [x] TypeScript compiles cleanly
- [x] Production build succeeds
- [ ] No UI/UX changes (visual regression) - needs manual verification

---

## Technical Notes

### _testOverrides Pattern

```typescript
// App.tsx renders with minimal props
<TransactionEditorView
    _testOverrides={{
        currentTransaction,
        transactionEditorMode,
        isViewingReadOnly,
        transactionNavigationList,
        setCurrentTransaction,
        setTransactionEditorMode,
        // ... App-level state coordination
    }}
/>
```

### State Coordination

These values need App.tsx coordination (cannot be in view-owned stores):
- `currentTransaction` / `setCurrentTransaction` - Used by multiple views
- `transactionEditorMode` / `setTransactionEditorMode` - Used by navigation
- `isViewingReadOnly` - Set from HistoryView navigation
- `transactionNavigationList` - Set from ItemsView navigation

### Risk: Large File Migration

TransactionEditorView is ~125KB. The migration should:
1. Update imports at top of file
2. Call hooks at start of component
3. Remove props and use hook returns
4. Test thoroughly

---

## Tasks

1. [x] Update TransactionEditorView to call useTransactionEditorData
2. [x] Update TransactionEditorView to call useTransactionEditorHandlers
3. [x] Reduce props interface to _testOverrides pattern
4. [x] Move TransactionEditorView.tsx into directory (created wrapper pattern)
5. [x] Update barrel export in index.ts
6. [x] Update App.tsx to use minimal props
7. [x] Delete useTransactionEditorViewProps.ts
8. [x] Delete useTransactionEditorViewProps.test.ts
9. [x] Update hooks/app/index.ts exports
10. [x] Run all tests (6761 passed)
11. [x] Verify build
12. [ ] Manual UI verification (user responsibility)

### From 14e-28 Archie Review (Deferred Items)

> 🚒 See 14e-28 story "Review Follow-ups (Archie)" section for full details.

13. [ ] **[🔴 HIGH]** Create `useTransactionEditorHandlers.test.ts` (critical business logic)
14. [ ] **[🔴 HIGH]** Create `useTransactionEditorData.test.ts` (data composition)
15. [x] **[🟡 MEDIUM]** Extract duplicated helpers (`deriveScanButtonState`, `computeBatchContext`) to `src/shared/utils/scanHelpers.ts` ✅ DONE

---

## Implementation Notes (2026-01-28)

### Wrapper Pattern Used

Due to the complexity of the original TransactionEditorView (~125KB), a **wrapper pattern** was used instead of modifying the original file:

1. **Original file renamed**: `TransactionEditorView.tsx` → `TransactionEditorViewInternal.tsx`
2. **Wrapper created**: `TransactionEditorViewWrapper.tsx` that:
   - Accepts `_testOverrides` prop
   - Calls `useTransactionEditorData()` to get all data
   - Calls `useTransactionEditorHandlers()` to get all handlers
   - Maps hook returns to the internal component's prop interface
3. **Barrel export updated**: Exports wrapper as `TransactionEditorView`

This pattern:
- Avoids modifying a large, complex file
- Maintains full functionality of the original component
- Allows the wrapper to be tested independently
- Can be refactored later to merge wrapper into internal component

### App.tsx Changes

- Removed `useTransactionEditorViewProps` import and call (~60 lines)
- Removed `useTransactionEditorHandlers` call from App.tsx
- Created `transactionEditorOverrides` useMemo object
- Updated render to pass `_testOverrides` instead of spreading props
- Cleaned up unused variables: `STORE_CATEGORIES`, `saveMapping`, etc.

---

## Review Follow-ups (Atlas Code Review - 2026-01-28)

> 🔥 **BLOCKING:** Story marked code-complete but has critical staging issues.
> These must be resolved before commit.

### 🔴 CRITICAL - Git Staging Issues (BLOCKING)

16. [x] **[🔴 CRITICAL]** Stage TransactionEditorViewWrapper.tsx - UNTRACKED (`??`) ✅ DONE
    - File: `src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx`
    - Fix: `git add src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx`

17. [x] **[🔴 CRITICAL]** Stage TransactionEditorViewInternal.tsx - UNTRACKED (`??`) ✅ DONE
    - File: `src/views/TransactionEditorViewInternal.tsx`
    - Fix: `git add src/views/TransactionEditorViewInternal.tsx`

18. [x] **[🔴 CRITICAL]** Stage story file itself - UNTRACKED (`??`) ✅ DONE
    - File: `docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-28b-transaction-editor-view-migration.md`
    - Fix: `git add docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-28b-transaction-editor-view-migration.md`

19. [x] **[🔴 CRITICAL]** Stage test file deletion - only unstaged (` D`) ✅ DONE
    - File: `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`
    - Fix: `git add tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`

### 🟡 MEDIUM - Mixed Staging Status

20. [x] **[🟡 MEDIUM]** Re-stage App.tsx - has unstaged changes (`MM`) ✅ DONE
    - File: `src/App.tsx`
    - Fix: `git add src/App.tsx`

21. [x] **[🟡 MEDIUM]** Re-stage hooks/app/index.ts - has unstaged changes (`MM`) ✅ DONE
    - File: `src/hooks/app/index.ts`
    - Fix: `git add src/hooks/app/index.ts`

22. [x] **[🟡 MEDIUM]** Resolve useTransactionEditorViewProps.ts deletion status (`MD`) ✅ DONE
    - File: `src/hooks/app/useTransactionEditorViewProps.ts`
    - Issue: Staged modification + unstaged deletion is ambiguous
    - Fix: `git add src/hooks/app/useTransactionEditorViewProps.ts`

### Quick Fix Command

```bash
# Stage all critical files in one command:
git add \
  src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx \
  src/views/TransactionEditorViewInternal.tsx \
  docs/sprint-artifacts/epic14e-feature-architecture/stories/14e-28b-transaction-editor-view-migration.md \
  tests/unit/hooks/app/useTransactionEditorViewProps.test.ts \
  src/App.tsx \
  src/hooks/app/index.ts \
  src/hooks/app/useTransactionEditorViewProps.ts
```

### Atlas Validation Summary

| Validation | Status |
|------------|--------|
| Architecture (Section 4) | ✅ Wrapper pattern follows documented standard |
| Testing Patterns (Section 5) | ⚠️ Missing tests for new hooks (deferred Tasks 13-14) |
| Historical Lessons (Section 6) | ✅ All files staged (2026-01-28 20:00) |

---

## Review Follow-ups (Archie - 2026-01-28)

> 🚒 **VERDICT: APPROVED WITH NOTES** - Story ready to proceed after staging issues resolved.
> Test debt already documented in Tasks 13-14.

### Pattern Compliance Summary

| Area | Status |
|------|--------|
| FSD Layer Rules | ✅ Hooks in view directory - proper layer ownership |
| State Management Boundaries | ✅ Zustand + _testOverrides pattern correct |
| Wrapper Pattern | ✅ Matches HistoryView, TrendsView, etc. |
| Shared Utilities | ✅ scanHelpers.ts extracted to eliminate duplication |
| Testing Standards | ⚠️ Deferred to Tasks 13-14 |

### New Findings

23. [x] **[🟢 LOW]** Fix `as any` type cast in useTransactionEditorData ✅ DONE
    - Location: `src/views/TransactionEditorView/useTransactionEditorData.ts:199`
    - Issue: `targetCategory as any` bypasses type safety
    - Fix: Imported `ItemCategory` type and updated parameter typing

### Already Tracked

- **[🔴 HIGH]** Missing useTransactionEditorHandlers.test.ts → Already Task 13
- **[🔴 HIGH]** Missing useTransactionEditorData.test.ts → Already Task 14
- **[🟡 MEDIUM]** Helper extraction → Task 15 COMPLETE (scanHelpers.ts exists)

---

## Dev Agent Record

### File List

**Created:**
- `src/views/TransactionEditorView/TransactionEditorViewWrapper.tsx` (~200 lines)
- `src/views/TransactionEditorViewInternal.tsx` (renamed from TransactionEditorView.tsx)

**Modified:**
- `src/views/TransactionEditorView/index.ts` - Updated barrel exports
- `src/views/TransactionEditorView/useTransactionEditorData.ts` - Fixed type cast (ItemCategory)
- `src/App.tsx` - Removed hook calls, minimal props pattern

**Deleted:**
- `src/hooks/app/useTransactionEditorViewProps.ts` (~590 lines)
- `tests/unit/hooks/app/useTransactionEditorViewProps.test.ts`

### Change Log

| Timestamp | Action | Files |
|-----------|--------|-------|
| 2026-01-28 20:15 | Atlas Code Review V2 | 1 HIGH fixed (MD→R rename), story APPROVED |
| 2026-01-28 20:00 | Resolved all review follow-ups | 8 staging issues fixed, type cast fixed |
| 2026-01-28 19:45 | Archie Feature Review | APPROVED WITH NOTES - 1 LOW finding added |
| 2026-01-28 19:29 | Created wrapper component | TransactionEditorViewWrapper.tsx |
| 2026-01-28 19:29 | Renamed original to Internal | TransactionEditorViewInternal.tsx |
| 2026-01-28 19:28 | Updated barrel exports | index.ts |
| 2026-01-28 19:28 | Atlas Code Review | Found 4 CRITICAL staging issues |
