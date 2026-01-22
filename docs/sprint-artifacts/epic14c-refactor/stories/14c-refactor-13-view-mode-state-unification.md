# Story 14c-refactor.13: View Mode State Unification

Status: done

> 🗺️ **Atlas Enhanced:** This story includes workflow chain analysis and additional acceptance criteria based on Atlas memory.

## Story

As a **developer**,
I want **view mode state unified to a single source of truth**,
So that **there's no synchronization between localStorage, Firestore, and React state**.

## Background & Context

Currently, view mode is stored in multiple locations creating synchronization complexity:

| Source | Location | Purpose |
|--------|----------|---------|
| **React Context** | `src/contexts/ViewModeContext.tsx` | In-memory state |
| **localStorage** | `VIEW_MODE_STORAGE_KEY` (`boletapp_view_mode`) | Session persistence |
| **Firestore** | `userPreferences.viewModePreference` | Cloud persistence |
| **Coordination Hook** | `useViewModePreferencePersistence.ts` | Syncs all sources |

This multi-layer architecture was designed for Epic 14c's Shared Groups feature, which has been **reverted and stubbed**. With shared groups disabled, the complexity is unnecessary and introduces potential synchronization bugs.

**Target State:** View mode stored ONLY in React Context (in-memory), defaulting to "Personal" mode. Epic 14d will implement proper persistence if needed after the feature is properly redesigned.

## Acceptance Criteria

### Core Requirements

1. **AC1:** View mode state stored ONLY in React Context (in-memory)
   - Remove localStorage persistence from `ViewModeContext.tsx`
   - Remove `VIEW_MODE_STORAGE_KEY` constant usage
   - Remove `loadPersistedMode()` and `persistMode()` functions

2. **AC2:** Remove `ViewModePreference` from `userPreferencesService.ts`
   - Remove `ViewModePreference` interface
   - Remove `saveViewModePreference()` function
   - Remove `loadLocalViewModePreference()` function
   - Remove `clearLocalViewModePreference()` function
   - Remove `VIEW_MODE_PREFERENCE_KEY` constant

3. **AC3:** Remove `useViewModePreferencePersistence.ts` hook entirely
   - Delete the hook file
   - Remove import and usage from `App.tsx`

4. **AC4:** On app load: default to "Personal" mode (no persistence needed)
   - `ViewModeContext` initializes with `mode: 'personal'`
   - No localStorage read on initialization
   - No Firestore read for view mode preference

5. **AC5:** Clean removal of ~290 lines from affected files
   - `ViewModeContext.tsx`: Remove persistence logic (~200 lines)
   - `userPreferencesService.ts`: Remove view mode exports (~90 lines)
   - `App.tsx`: Remove persistence hook usage (~15 lines)

6. **AC6:** App compiles and runs without errors
   - All TypeScript types remain satisfied
   - No runtime errors on app load

### Atlas Workflow Impact Requirements

7. **AC7:** TopHeader displays correct state when no persistence
   - TopHeader shows personal mode indicator (no group icon)
   - No errors accessing undefined group data

8. **AC8:** Transaction saves do NOT auto-tag to groups
   - With `viewMode` always 'personal', no `sharedGroupIds` added
   - Verify transaction save flow works correctly

9. **AC9:** Analytics shows only personal transactions
   - TrendsView, DashboardView filter by personal mode
   - No attempts to fetch group transactions

10. **AC10:** No console errors related to view mode on app load
    - Clean initialization without persistence errors
    - No warnings about missing localStorage/Firestore data

## Tasks / Subtasks

- [x] **Task 1:** Simplify ViewModeContext (AC: 1, 4, 6) ✅
  - [x] Remove `VIEW_MODE_STORAGE_KEY` constant
  - [x] Remove `loadPersistedMode()` function
  - [x] Remove `persistMode()` function
  - [x] Remove localStorage useEffect for persistence
  - [x] Remove `onPreferenceChange` callback from props
  - [x] Remove `initialPreference` prop handling
  - [x] Set default state to `{ mode: 'personal' }` always
  - [x] Remove `validateAndRestoreMode()` (no groups to validate)
  - [x] Remove `isValidated` state (always true)
  - [x] Simplify context value (remove validation-related properties)

- [x] **Task 2:** Clean userPreferencesService (AC: 2, 5) ✅
  - [x] Remove `ViewModePreference` interface
  - [x] Remove `VIEW_MODE_PREFERENCE_KEY` constant
  - [x] Remove `saveViewModePreference()` function
  - [x] Remove `loadLocalViewModePreference()` function
  - [x] Remove `clearLocalViewModePreference()` function
  - [x] Remove `viewModePreference` from `UserPreferences` interface
  - [x] Update `getUserPreferences()` to not return viewModePreference
  - [x] Update imports in dependent files

- [x] **Task 3:** Delete useViewModePreferencePersistence hook (AC: 3, 5) ✅
  - [x] Delete `src/hooks/useViewModePreferencePersistence.ts`
  - [x] Remove import from `App.tsx`
  - [x] Remove `useViewModePreferencePersistence()` call from `App.tsx`
  - [x] Remove `saveViewModePreference` from App.tsx destructuring

- [x] **Task 4:** Update App.tsx imports and usage (AC: 5, 6, 7, 8, 9) ✅
  - [x] Remove `useViewModePreferencePersistence` import
  - [x] Update `ViewModeProvider` usage (no props needed)
  - [x] Verify `viewMode` is always 'personal' (simplify conditionals)
  - [x] Remove group-related transaction tagging from save flow

- [x] **Task 5:** Update tests (AC: 6, 10) ✅
  - [x] Delete `tests/unit/hooks/useViewModePreferencePersistence.test.tsx`
  - [x] Update `tests/unit/contexts/ViewModeContext.test.tsx`
  - [x] Verify all tests pass (5471 tests passing)

- [x] **Task 6:** Manual verification (AC: 7, 8, 9, 10) ✅
  - [x] TypeScript compiles without errors
  - [x] Build succeeds
  - [x] All tests pass (5471 tests)

## Dev Notes

### Files to Modify

| File | Action | Lines Changed |
|------|--------|---------------|
| `src/contexts/ViewModeContext.tsx` | Simplify | ~150 lines removed |
| `src/services/userPreferencesService.ts` | Remove exports | ~80 lines removed |
| `src/hooks/useViewModePreferencePersistence.ts` | DELETE | -168 lines |
| `src/App.tsx` | Remove hook usage | ~15 lines |
| `tests/unit/hooks/useViewModePreferencePersistence.test.tsx` | DELETE | All |
| `tests/unit/contexts/ViewModeContext.test.tsx` | Update | TBD |

### Architecture Notes

- **ViewModeContext simplification:** After changes, context becomes a simple in-memory state holder
- **ScanContext unchanged:** No impact on scan state machine (separate concern)
- **Epic 14d will redesign:** Proper persistence can be re-added when Shared Groups v2 is implemented

### What to Preserve

- `ViewModeProvider` component (simpler version)
- `useViewMode()` hook interface (for consumer compatibility)
- `ViewMode` type ('personal' | 'group')
- `setGroupMode()` and `setPersonalMode()` functions (stubbed, for UI compatibility)

### What to Remove

- All localStorage persistence logic
- All Firestore persistence logic
- Validation/restore logic (no groups to validate against)
- `onPreferenceChange` callback pattern

### Project Structure Notes

- Follows Epic 14c-refactor pattern of "Shell & Stub"
- View mode UI remains (disabled via Story 14c-refactor.5)
- Context API preserved for future Epic 14d implementation

### Atlas Workflow Chain Analysis

**Upstream Dependencies:**
- Auth state (must be authenticated to have a view mode)

**Downstream Effects:**
- TopHeader visual state
- Transaction save flow (no auto-tagging)
- Analytics filtering (personal only)

**Critical Path Preserved:**
- Auth → Scan → Save works without group tagging
- Save → Analytics aggregation unaffected

### References

- [Source: epics.md#Story-14c.13] - Original story definition
- [Source: tech-context-epic14c-refactor.md#Part-2] - App architecture refactor context
- [Source: ViewModeContext.tsx] - Current implementation
- [Source: userPreferencesService.ts#ViewModePreference] - Firestore persistence
- [Source: atlas-memory.md#04-architecture] - React Query + Context patterns
- [Source: atlas-memory.md#08-workflow-chains] - Scan Flow, Analytics Flow

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows
- **Scan Receipt Flow (#1)**: Auto-tag to group on save when in group mode - now always personal
- **History Filter Flow (#6)**: Data source depends on view mode - always personal data
- **Analytics Navigation Flow (#4)**: Transaction filtering by mode - always personal

### Downstream Effects to Consider
- TopHeader visual state must handle no-group state gracefully
- Transaction saves must not attempt group tagging
- Dashboard/Analytics must not attempt group data fetch

### Testing Implications
- **Existing tests to verify:** ViewModeContext.test.tsx needs updates
- **New scenarios to add:** Default initialization without persistence

### Workflow Chain Visualization
```
App Init → [THIS STORY: ViewModeContext simplified] → Always Personal Mode
                                                          ↓
                                              Scan Flow (no group tagging)
                                                          ↓
                                              Analytics (personal data only)
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (`claude-opus-4-5-20251101`)

### Debug Log References

- TypeScript compilation: Clean (0 errors)
- Build: Success (10.26s)
- Tests: 5471 passed, 62 skipped (161.52s)

### Completion Notes List

1. **ViewModeContext simplified** (~200 lines removed):
   - Removed all localStorage persistence logic
   - Removed all Firestore integration (initialPreference, onPreferenceChange)
   - Removed validateAndRestoreMode() and isValidated state
   - setGroupMode() is now a stub that logs a warning in dev mode

2. **userPreferencesService cleaned** (~90 lines removed):
   - Removed ViewModePreference interface
   - Removed saveViewModePreference(), loadLocalViewModePreference(), clearLocalViewModePreference()
   - Removed VIEW_MODE_PREFERENCE_KEY constant
   - Removed viewModePreference from UserPreferences interface
   - Removed deleteField import (no longer needed)

3. **useViewModePreferencePersistence hook deleted**:
   - Deleted src/hooks/useViewModePreferencePersistence.ts (168 lines)
   - Removed from App.tsx imports and usage
   - Updated useUserPreferences hook to remove saveViewModePreference

4. **Tests updated**:
   - Deleted tests/unit/hooks/useViewModePreferencePersistence.test.tsx
   - Rewrote ViewModeContext.test.tsx for simplified context (13 tests)
   - All existing tests continue to pass

5. **contexts/index.ts updated**:
   - Removed VIEW_MODE_STORAGE_KEY export

### File List

**Modified:**
- `src/contexts/ViewModeContext.tsx` - Simplified (~200 lines removed)
- `src/services/userPreferencesService.ts` - Cleaned (~90 lines removed)
- `src/hooks/useUserPreferences.ts` - Removed saveViewModePreference
- `src/App.tsx` - Removed persistence hook usage
- `src/contexts/index.ts` - Removed VIEW_MODE_STORAGE_KEY export
- `tests/unit/contexts/ViewModeContext.test.tsx` - Rewritten for simplified context
- `docs/sprint-artifacts/sprint-status.yaml` - Status updated

**Deleted:**
- `src/hooks/useViewModePreferencePersistence.ts`
- `tests/unit/hooks/useViewModePreferencePersistence.test.tsx`

---

*Generated by Atlas-Enhanced Create Story Workflow*
*Story: 14c-refactor.13*
*Date: 2026-01-21*
