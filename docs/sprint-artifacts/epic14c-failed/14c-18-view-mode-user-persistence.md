# Story 14c.18: View Mode User Persistence

Status: done

## Story

As a shared group member,
I want my view mode preference (personal vs shared group) to be saved to my account,
so that when I log in from any device or after app restart, I automatically see the view I last selected.

## Problem Statement

The current view mode persistence has a **race condition bug** that causes data/UI mismatch:

1. **Current implementation** persists `viewMode` and `groupId` to **localStorage** only
2. **On app load**, the mode is restored from localStorage **before** group data loads from Firestore
3. **Race condition**: UI shows "group mode" header/styling but `activeTransactions` shows personal data
4. **User experience**: User sees shared group UI but personal transactions, causing confusion
5. **Multi-device issue**: Mode preference is device-local, doesn't sync across devices

Additionally:
- If a user is removed from a group, restoring that group ID causes errors
- localStorage can be cleared by the browser, losing preferences unexpectedly

## Acceptance Criteria

1. **AC1: Firestore Persistence** - Save view mode preference to Firestore at `users/{userId}/preferences/settings.viewModePreference`
2. **AC2: Preference Schema** - Store `{ mode: 'personal' | 'group', groupId?: string }` structure
3. **AC3: Load on Auth** - When user authenticates, load preference from Firestore before rendering views
4. **AC4: Validate Active Group** - Before restoring group mode, verify the user is still a member of that group
5. **AC5: Fallback to Personal** - If persisted group is invalid (deleted, user removed), fallback to personal mode
6. **AC6: Sync on Change** - When user changes mode, save to Firestore (debounced 1 second to avoid excessive writes)
7. **AC7: Offline Support** - Keep localStorage as fallback for offline scenarios; sync to Firestore when online
8. **AC8: Cross-Device Sync** - Mode changes on one device should be reflected on another after refresh

## Tasks / Subtasks

- [x] Task 1: Extend user preferences schema (AC: #1, #2)
  - [x] 1.1: Add `viewModePreference` field to `UserPreferences` type
  - [x] 1.2: Firestore security rules already allow preference writes (existing rule covers it)
  - [x] 1.3: New users default to personal mode (backward compatible)

- [x] Task 2: Create preference persistence service (AC: #1, #6, #7)
  - [x] 2.1: Add `saveViewModePreference()` function to `useUserPreferences` hook
  - [x] 2.2: Implement debounced save (1 second delay)
  - [x] 2.3: Handle offline scenarios with localStorage fallback

- [x] Task 3: Update ViewModeContext (AC: #3, #4, #5)
  - [x] 3.1: Accept initial preference from props (loaded from Firestore)
  - [x] 3.2: Add `validateAndRestoreMode()` function
  - [x] 3.3: Check group membership before restoring group mode
  - [x] 3.4: Emit preference changes for persistence via callback

- [x] Task 4: Integrate with auth flow (AC: #3)
  - [x] 4.1: Load `viewModePreference` in `useUserPreferences` hook
  - [x] 4.2: Create `useViewModePreferencePersistence` hook to connect context with Firestore
  - [x] 4.3: Validate group mode after groups load to fix race condition

- [x] Task 5: Add mode change listener (AC: #6, #8)
  - [x] 5.1: Mode changes trigger `onPreferenceChange` callback in ViewModeProvider
  - [x] 5.2: Callback connected to debounced Firestore save via hook
  - [x] 5.3: Skip initial render persistence to prevent loops

- [x] Task 6: Testing (AC: All)
  - [x] 6.1: Unit tests for `validateAndRestoreMode()` function (32 tests in ViewModeContext.test.tsx)
  - [x] 6.2: Unit tests for group validation on restore (AC4, AC5)
  - [x] 6.3: Unit tests for `onPreferenceChange` callback (AC6)
  - [x] 6.4: Integration tests for `useViewModePreferencePersistence` hook (6 tests)
  - [x] 6.5: Tests for `initialPreference` prop behavior (AC3)

## Implementation Summary

### Files Created
- `src/hooks/useViewModePreferencePersistence.ts` - Hook connecting ViewModeContext to Firestore persistence
- `tests/unit/hooks/useViewModePreferencePersistence.test.tsx` - Integration tests for persistence hook

### Files Modified
- `src/services/userPreferencesService.ts` - Added `ViewModePreference` type and save/load functions
- `src/hooks/useUserPreferences.ts` - Added `saveViewModePreference` function with debouncing
- `src/contexts/ViewModeContext.tsx` - Added `initialPreference`, `onPreferenceChange`, `validateAndRestoreMode()`, `isValidated`
- `src/App.tsx` - Integrated `useViewModePreferencePersistence` hook
- `tests/unit/contexts/ViewModeContext.test.tsx` - Added Story 14c.18 test sections

### Architecture

```
User Login → Load Preferences (Firestore) → Load Groups → validateAndRestoreMode() → Apply Mode → Render
                                                        ↳ (if invalid) → Fallback to Personal → Save Fallback

Mode Change → Update Context State → onPreferenceChange callback →
              → localStorage (immediate) → Firestore (debounced 1s)
```

### Key Implementation Details

1. **ViewModePreference type** stored in UserPreferences:
```typescript
interface ViewModePreference {
  mode: 'personal' | 'group';
  groupId?: string;
  updatedAt?: Timestamp;
}
```

2. **validateAndRestoreMode()** ensures group exists before restoring:
- If user is member of persisted group → restore with full group data
- If group not found or user removed → fallback to personal mode
- Sets `isValidated` flag to true after validation

3. **useViewModePreferencePersistence** hook orchestrates:
- Waits for both preferences and groups to load
- Calls `validateAndRestoreMode` once both are ready
- Persists mode changes to Firestore (debounced)

4. **Debouncing** prevents excessive writes:
- localStorage updated immediately (offline support)
- Firestore save debounced 1 second
- Only saves if mode actually changed

### Test Coverage

- 32 tests in ViewModeContext.test.tsx (including 12 new Story 14c.18 tests)
- 6 tests in useViewModePreferencePersistence.test.tsx
- All tests passing

## Story Points

**Estimate:** 5 points

- Firestore schema and rules: 0.5 points ✓
- Preference persistence service: 1.5 points ✓
- ViewModeContext updates: 1 point ✓
- Auth flow integration: 1 point ✓
- Testing: 1 point ✓
