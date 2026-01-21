# Story 14c-refactor.2: Stub Services

Status: ready-for-dev

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
   - `src/services/sharedGroupTransactionService.ts` is deleted entirely
   - `src/lib/sharedGroupErrors.ts` is deleted (no longer needed)
   - App compiles and runs without errors
   - Existing imports don't break (stubs satisfy type contracts)

## Tasks / Subtasks

- [ ] Task 1: Delete sharedGroupTransactionService.ts entirely (AC: #1)
  - [ ] Delete `src/services/sharedGroupTransactionService.ts`
  - [ ] Find all imports and update them (will be handled in Task 2 or Story 14c-refactor.3)

- [ ] Task 2: Stub sharedGroupService.ts (AC: #1)
  - [ ] Replace `createSharedGroup` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `joinByShareCode` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `getSharedGroupByShareCode` with: `return null`
  - [ ] Replace `getSharedGroupPreview` with: `return null`
  - [ ] Replace `acceptInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `declineInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `createPendingInvitation` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `leaveGroupSoft` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `leaveGroupHard` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `transferOwnership` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `removeMember` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `deleteSharedGroupWithCleanup` with: `throw new Error('Feature temporarily unavailable')`
  - [ ] Replace `getSharedGroupsForUser` with: `return []`
  - [ ] Replace `subscribeToSharedGroups` with: stub that calls callback with `[]` immediately
  - [ ] Replace `subscribeToSharedGroup` with: stub that calls callback with `null` immediately
  - [ ] Replace `updateMemberTimestampsForTransaction` with: no-op `return`
  - [ ] Keep utility functions that don't make network calls: `generateShareCode`, `getShareLink`, `isShareCodeExpired`

- [ ] Task 3: Delete sharedGroupErrors.ts (AC: #1)
  - [ ] Delete `src/lib/sharedGroupErrors.ts`
  - [ ] Find any imports and remove them

- [ ] Task 4: Verify build success (AC: #1)
  - [ ] Run `npm run build`
  - [ ] Fix any TypeScript compilation errors
  - [ ] Ensure no remaining references to deleted services

## Dev Notes

### Files to Delete
- `src/services/sharedGroupTransactionService.ts` (~720 lines) - Cross-user transaction queries
- `src/lib/sharedGroupErrors.ts` (~413 lines) - Error classification utilities

### Files to Modify
- `src/services/sharedGroupService.ts` - Replace implementations with stubs (~1325 lines → ~150 lines)

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
[DELETE: sharedGroupTransactionService] → useSharedGroupTransactions (Story 14c-refactor.3)
[DELETE: sharedGroupErrors] → Error handling removed
```

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation - files modified/deleted)
