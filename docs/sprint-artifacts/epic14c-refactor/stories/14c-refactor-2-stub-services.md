# Story 14c-refactor.2: Stub Services

Status: done

## Story

As a **developer**,
I want **shared group services replaced with stub implementations**,
So that **the app compiles but shared group operations return placeholder responses**.

## Acceptance Criteria

1. **Given** `sharedGroupService.ts` and `sharedGroupTransactionService.ts` have full implementations
   **When** this story is completed
   **Then:**
   - `src/services/sharedGroupService.ts` functions return stub responses:
     - `createSharedGroup()` → throws "Feature temporarily unavailable"
     - `joinByShareCode()` → throws "Feature temporarily unavailable"
     - `leaveGroupSoft()` / `leaveGroupHard()` → throws "Feature temporarily unavailable"
     - `getSharedGroupsForUser()` → returns empty array `[]`
     - `subscribeToSharedGroups()` → immediately calls callback with `[]`, returns no-op unsubscribe
     - All other mutating functions → throw "Feature temporarily unavailable"
   - `src/services/sharedGroupTransactionService.ts` is stubbed (~720 lines → ~122 lines)
     - *(Originally planned for deletion, but runtime import dependencies require stub)*
     - All functions return empty/default values (no network calls)
     - `SharedGroupTransaction` type preserved for backwards compatibility
   - `src/lib/sharedGroupErrors.ts` is retained (deferred to Story 14c-refactor.5)
     - *(Used by UI components in `src/components/SharedGroups/`)*
   - App compiles and runs without errors
   - Existing imports don't break (stubs satisfy type contracts)

## Tasks / Subtasks

- [x] Task 1: Stub sharedGroupTransactionService.ts (AC: #1) ✅
  - [x] Replace full implementation with stub (~720 lines → ~122 lines)
  - [x] Preserve `SharedGroupTransaction` type for backwards compatibility
  - [x] All functions return empty/default values (no network calls)

- [x] Task 2: Stub sharedGroupService.ts (AC: #1) ✅
  - [x] Replace `createSharedGroup` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `joinByShareCode` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `getSharedGroupByShareCode` with: `return null`
  - [x] Replace `getSharedGroupPreview` with: `return null`
  - [x] Replace `acceptInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `declineInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `createPendingInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `leaveGroupSoft` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `leaveGroupHard` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `transferOwnership` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `removeMember` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `deleteSharedGroupWithCleanup` with: `throw new Error('Feature temporarily unavailable')`
  - [x] Replace `getSharedGroupsForUser` with: `return []`
  - [x] Replace `subscribeToSharedGroups` with: stub that calls callback with `[]` immediately
  - [x] Replace `subscribeToSharedGroup` with: stub that calls callback with `null` immediately
  - [x] Replace `updateMemberTimestampsForTransaction` with: no-op `return`
  - [x] Keep utility functions that don't make network calls: `generateShareCode`, `getShareLink`, `isShareCodeExpired`

- [x] Task 3: Delete sharedGroupErrors.ts (AC: #1) ⏭️ SKIPPED
  - Per DEV NOTES: "keep sharedGroupErrors.ts (used by UI components - will be handled by Story 14c-refactor.5)"
  - File retained for UI component compatibility

- [x] Task 4: Verify build success (AC: #1) ✅
  - [x] Run `npm run build` - SUCCESS
  - [x] App runs locally without 404 errors
  - [x] All service stubs compile and satisfy type contracts

## Dev Notes

### Files Stubbed (Actual Outcome)
- `src/services/sharedGroupTransactionService.ts` (~720 lines → ~122 lines stub) - Runtime imports required stub
- `src/services/sharedGroupService.ts` (~1325 lines → ~405 lines stub) - All functions stubbed with JSDoc

### Files Retained (Deferred)
- `src/lib/sharedGroupErrors.ts` (~413 lines) - Deferred to Story 14c-refactor.5 (UI dependency)

### Stub Implementation Pattern

```typescript
// Example stub for createSharedGroup
export async function createSharedGroup(
    _db: Firestore,
    _userId: string,
    _appId: string,
    _input: CreateSharedGroupInput,
    _ownerProfile?: { displayName?: string; email?: string; photoURL?: string }
): Promise<SharedGroup> {
    throw new Error('Feature temporarily unavailable');
}

// Example stub for subscribeToSharedGroups
export function subscribeToSharedGroups(
    _db: Firestore,
    _userId: string,
    onUpdate: (groups: SharedGroup[]) => void,
    _onError?: (error: Error) => void
): Unsubscribe {
    // Immediately call with empty array
    onUpdate([]);
    // Return no-op unsubscribe
    return () => {};
}

// Example stub for getSharedGroupsForUser
export async function getSharedGroupsForUser(
    _db: Firestore,
    _userId: string
): Promise<SharedGroup[]> {
    return [];
}
```

### Type Exports to Preserve

Keep these exports in sharedGroupService.ts for type compatibility:
- `JoinError` type
- `InvitationError` type
- `LeaveGroupError` type
- Re-export `SharedGroup`, `CreateSharedGroupInput`, etc. from types if needed

### Architecture Context

From Epic 14c Retrospective:
> Services should return stub responses that satisfy their type contracts without making any network calls. This allows the app to compile and run while shared group features are disabled.

### Testing Standards

- Run `npm run build` to verify compilation
- Run `npm test` to check for broken imports (some tests may fail - that's expected, handled in Story 14c-refactor.17)
- Manual smoke test: App should load without errors

### Project Structure Notes

- Services directory: `src/services/`
- Lib directory: `src/lib/`
- This story modifies services - hooks that call these services (Story 14c-refactor.3) may need updates

### Dependencies

- **Depends on:** Story 14c-refactor.1 (Cloud Functions must be removed first)
- **Blocks:** Story 14c-refactor.3 (Hooks depend on services)

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective documenting the failure
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.2] - Story definition
- [Source: src/services/sharedGroupService.ts] - Current service implementation

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Household Sharing Flow (#10)**: All CRUD operations for shared groups will throw errors
- **Learning Flow**: Transaction tagging to groups (`updateMemberTimestampsForTransaction`) becomes no-op

### Downstream Effects to Consider

- Hooks calling these services will receive errors or empty results
- UI components will need to handle "Feature unavailable" errors gracefully
- Any toast notifications showing shared group errors will need i18n keys

### Important Note

**These effects are intentional.** Story 14c-refactor.3 (Stub Hooks) and Story 14c-refactor.5 (Placeholder UI) will handle the downstream effects, ensuring graceful degradation.

### Testing Implications

- **Existing tests to delete:** Tests for `sharedGroupTransactionService.ts` and `sharedGroupErrors.ts` (Story 14c-refactor.17)
- **New test scenarios:** Verify stubs return expected values without network calls

### Workflow Chain Visualization

```
[STUB: sharedGroupService] → Hooks → Components
[STUB: sharedGroupTransactionService] → useSharedGroupTransactions (deletion deferred to Story 14c-refactor.3)
[RETAINED: sharedGroupErrors] → UI components (handled in Story 14c-refactor.5)
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation was straightforward.

### Completion Notes List

1. **Task 1 Revised**: Stubbed `src/services/sharedGroupTransactionService.ts` (~720 lines → ~122 lines)
   - Initially deleted, but runtime errors required a stub file to exist
   - Provides `SharedGroupTransaction` type for backwards compatibility
   - All functions return empty arrays/0/empty maps
   - TODO comment added: "Delete this file in Story 14c-refactor.3 when hooks are stubbed"

2. **Task 2 Complete**: Stubbed `src/services/sharedGroupService.ts` (~1325 lines → ~405 lines)
   - All mutating functions throw "Feature temporarily unavailable"
   - `getSharedGroupsForUser()` returns `[]`
   - `subscribeToSharedGroups()` immediately calls callback with `[]`
   - `subscribeToSharedGroup()` immediately calls callback with `null`
   - `updateMemberTimestampsForTransaction()` is no-op
   - Preserved utility functions: `generateShareCode`, `getShareLink`, `isShareCodeExpired`
   - Preserved type exports: `JoinError`, `InvitationError`, `LeaveGroupError`

3. **Task 3 Skipped**: `sharedGroupErrors.ts` retained per DEV NOTES
   - File is used by UI components in `src/components/SharedGroups/`
   - Will be handled in Story 14c-refactor.5 (Placeholder UI States)

4. **Task 4 Complete**: Build passes, app runs locally
   - `npm run build` ✅ SUCCESS
   - `npm run dev` ✅ App loads without 404 errors

### Build Status

```
npm run build → SUCCESS (all modules transformed, 157 precache entries)
```

### File List

**Stubbed:**
- `src/services/sharedGroupTransactionService.ts` (~720 lines → ~122 lines stub)
- `src/services/sharedGroupService.ts` (~1325 lines → ~405 lines stub)

**Retained (per DEV NOTES):**
- `src/lib/sharedGroupErrors.ts` (needed by UI components until Story 14c-refactor.5)

## Code Review Record

### Review Date
2026-01-21

### Reviewer
Atlas-Enhanced Code Review (Claude Opus 4.5)

### Review Type
Adversarial + Atlas Validation

### Findings Summary

| Severity | Count | Resolution |
|----------|-------|------------|
| HIGH | 1 | AC text updated to match actual implementation |
| MEDIUM | 2 | Documentation clarified (line counts, file retention) |
| LOW | 2 | Acknowledged (bundle size, naming conventions) |

### AC Verification

| Requirement | Status |
|-------------|--------|
| sharedGroupService.ts stubbed | ✅ PASS |
| sharedGroupTransactionService.ts stubbed | ✅ PASS (revised from delete) |
| sharedGroupErrors.ts retained | ✅ PASS (deferred to 14c-refactor.5) |
| App compiles | ✅ PASS |
| Imports preserved | ✅ PASS |

### Atlas Validation

| Dimension | Status |
|-----------|--------|
| Architecture Compliance | ✅ PASS |
| Pattern Compliance | ✅ PASS |
| Workflow Chain Impact | ✅ Documented (intentional degradation) |

### Fixes Applied
1. Updated AC #1 to reflect actual stub vs delete outcome
2. Updated Dev Notes "Files to Delete" → "Files Stubbed (Actual Outcome)"
3. Updated Workflow Chain Visualization

### Recommendation
**APPROVED** - Story ready for deployment
