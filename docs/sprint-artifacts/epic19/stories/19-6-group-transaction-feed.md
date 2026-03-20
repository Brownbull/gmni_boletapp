# Story 19-6: Auto-Copy Integration, Batch Assignment, and Group Transaction Feed

## Status: ready-for-dev

## Intent
**Epic Handle:** "Pin your receipts to the shared board"
**Story Handle:** "Build the auto-pinning, bulk-pinning, and the board view — every new receipt auto-copies, you can pin a batch, and you see what everyone shared"

## Story
As a group member, I want my transactions to automatically copy to groups with auto-copy enabled, batch-assign existing transactions to a group, and view the group transaction feed when in group view, so that sharing is effortless.

## Acceptance Criteria

### Functional
- **AC-1:** Given auto-copy toggle is ON for a group (from 19-5), when user saves a new personal transaction (after scan review, manual entry, or any save path), then the transaction is automatically copied to that group via `postToGroup` Cloud Function
- **AC-2:** Given auto-copy is ON for multiple groups, when user saves a transaction, then it is copied to all toggled groups
- **AC-3:** Given auto-copy triggers and the copy fails (network error, group deleted, duplicate), then the personal transaction save is NOT affected — auto-copy is best-effort with a toast notification on failure
- **AC-4:** Given batch selection on Home or Transactions screen, when user selects transactions and taps "Add to Group", then a group selector appears and `batchPostToGroup` Cloud Function is called. Result toast shows "Added X transactions, Y already in group"
- **AC-5:** Given the group view is active (from 19-5 context store), when user views Home/Transactions, then transaction list shows group transactions (from group subcollection, sorted by postedAt desc)
- **AC-6:** Given group view, when user views a group transaction card, then it shows: poster name (postedByName), merchant, amount, date. Personal data (alias, images) is NOT visible.
- **AC-7:** Given admin viewing a < 60-day group transaction, when they tap delete, then confirmation dialog appears and `deleteGroupTransaction` Cloud Function is called
- **AC-8:** Given a >= 60-day group transaction, when anyone views it, then no delete option is shown (immutable)

### Architectural
- **AC-ARCH-LOC-1:** Auto-copy handler at `src/features/groups/handlers/useAutoCopy.ts`
- **AC-ARCH-LOC-2:** Batch assignment at `src/features/groups/components/BatchGroupAssign.tsx`
- **AC-ARCH-LOC-3:** Group transaction feed at `src/features/groups/components/GroupTransactionFeed.tsx`
- **AC-ARCH-PATTERN-1:** Auto-copy is fire-and-forget — NEVER blocks the personal transaction save path
- **AC-ARCH-PATTERN-2:** TanStack Query for group transaction subscription in group view

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Auto-copy handler | `src/features/groups/handlers/useAutoCopy.ts` | Feature hook | NEW |
| Batch group assign | `src/features/groups/components/BatchGroupAssign.tsx` | FSD component | NEW |
| Group selector sheet | `src/features/groups/components/GroupSelectorSheet.tsx` | FSD component | NEW |
| Group transaction feed | `src/features/groups/components/GroupTransactionFeed.tsx` | FSD component | NEW |
| Group transaction card | `src/features/groups/components/GroupTransactionCard.tsx` | FSD component | NEW |
| Group transaction hook | `src/features/groups/hooks/useGroupTransactions.ts` | TanStack Query | NEW |
| Transaction save integration | `src/features/scan/` or save handler | Existing save path | MODIFIED |
| Batch selection integration | `src/features/transactions/` or batch handler | Existing batch path | MODIFIED |
| Tests | `tests/unit/features/groups/` | Vitest/RTL | NEW |

## Tasks

### Task 1: Auto-Copy Handler (3 subtasks)
- [ ] 1.1: Create `useAutoCopy.ts` — reads auto-copy store (from 19-5 `useGroupAutoCopyStore`), exposes `triggerAutoCopy(transactionId)` function that calls `postToGroup` CF for each toggled group
- [ ] 1.2: Fire-and-forget: auto-copy runs AFTER personal save completes successfully. If any copy fails (network, duplicate, group deleted), show toast "Could not copy to [group name]" — NEVER block or fail the personal save.
- [ ] 1.3: Integrate into existing transaction save flow — call `triggerAutoCopy(savedTransactionId)` after successful save in scan review, manual entry, and any other save paths

### Task 2: Batch Group Assignment (3 subtasks)
- [ ] 2.1: Create `GroupSelectorSheet.tsx` — bottom sheet showing user's groups (name + icon), select one group to assign to
- [ ] 2.2: Create `BatchGroupAssign.tsx` — adds "Add to Group" action to batch selection toolbar on Home and Transactions screens (alongside existing "Delete" option)
- [ ] 2.3: On confirm: call `batchPostToGroup` CF with selected transaction IDs and group ID. Show result toast: "Added X transactions, Y already in group"

### Task 3: Group Transaction Feed (3 subtasks)
- [ ] 3.1: Create `useGroupTransactions.ts` — TanStack Query hook for group transactions (Firestore onSnapshot on group's transactions subcollection, sorted by postedAt desc, paginated at 20)
- [ ] 3.2: Create `GroupTransactionFeed.tsx` — list of group transaction cards, renders when activeGroupId is set (from 19-5 context store). Replaces personal transaction list when in group view.
- [ ] 3.3: Create `GroupTransactionCard.tsx` — poster name (postedByName), merchant, amount, date. Admin delete button (visible to admins only, for < 60-day transactions). Visual indicator for transactions within deletion window.

### Task 4: Admin Deletion UI (2 subtasks)
- [ ] 4.1: Delete button on group transaction card — visible to admins only, for < 60-day transactions
- [ ] 4.2: Confirmation dialog before deletion — calls `deleteGroupTransaction` Cloud Function

### Task 5: Tests and Verification (2 subtasks)
- [ ] 5.1: Unit tests: auto-copy handler (fires on save, handles failure gracefully, copies to multiple groups), batch assignment (group selector, result handling), group transaction feed rendering, admin delete visibility (admin vs non-admin, within vs beyond 60-day window)
- [ ] 5.2: Run `npm run test:quick`

## Sizing
- **Points:** 8 (LARGE)
- **Tasks:** 5
- **Subtasks:** 13
- **Files:** ~9

## Dependencies
- **19-3** (postToGroup and batchPostToGroup CFs), **19-4** (deleteGroupTransaction CF), **19-5** (group context store, auto-copy store, group view mode)

## Risk Flags
- DATA_PIPELINE (auto-copy reliability)
- PURE_COMPONENT (empty feed, loading state)
- E2E_TESTING (data-testid on all elements)

## Dev Notes
- Auto-copy is the primary sharing mechanism — users toggle it ON in the group switcher dropdown and forget about it. Every transaction they save automatically appears in the group.
- Auto-copy trigger point: AFTER personal transaction save succeeds. The integration point is in the existing transaction save flow (scan review save, manual entry save, batch save, edit save).
- Batch assignment is the secondary mechanism — for existing transactions that weren't auto-copied. Available from batch selection on Home and Transactions screens.
- In group view, the transaction list replaces the personal transaction list. The existing Home/Transactions views should check `useGroupContextStore.activeGroupId` and render `GroupTransactionFeed` when a group is active.
- 60-day calculation on client: compare `postedAt` with current time. This is UX-only (show/hide delete button) — security rules and CF enforce server-side.
- **Offline note:** Auto-copy and batch assignment require internet. Auto-copy silently skips when offline (with toast). Batch assignment shows "Requires internet" toast and disables button. Group transaction feed shows cached data when offline (Firestore offline persistence).
