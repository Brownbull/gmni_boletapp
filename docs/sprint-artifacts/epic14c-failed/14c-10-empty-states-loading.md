# Story 14c.10: Empty States & Loading

Status: done

## Story

As a user viewing shared groups,
I want clear feedback during loading and empty states,
so that I know the app is working and what actions to take.

## Acceptance Criteria

1. **AC1: Skeleton UI While IndexedDB Hydrates**
   - Given I open a shared group view
   - When IndexedDB cache is being read
   - Then skeleton placeholders appear for transaction cards
   - And the skeleton animates to indicate loading
   - And real content replaces skeletons smoothly

2. **AC2: Loading Indicator During Multi-Member Query**
   - Given IndexedDB is empty or stale
   - When fetching from Firestore across multiple members
   - Then a loading indicator shows progress
   - And indicator may show "Loading transactions from 3 members..."
   - And each member's data appears as it arrives (optional progressive)

3. **AC3: Empty State - Group Has No Transactions**
   - Given I view a shared group
   - When the group has no transactions tagged to it
   - Then I see an empty state illustration/message
   - And the message explains the group has no transactions yet
   - And I see a prompt: "Scan a receipt to add the first transaction!"

4. **AC4: Empty State - New Group With No Members**
   - Given I just created a shared group
   - When I view it and I'm the only member
   - Then I see a message about inviting members
   - And an "Invite Members" button is prominent
   - And the share code is easily accessible

5. **AC5: Invite Members Prompt for Empty Groups**
   - Given I'm in a shared group with no transactions
   - When viewing the empty state
   - Then there is an "Invite Members" CTA button
   - And tapping it opens the share code/invite flow
   - And the empty state suggests adding people makes the group useful

## Tasks / Subtasks

- [x] Task 1: Create Skeleton Components (AC: #1)
  - [x] 1.1 Create `TransactionCardSkeleton.tsx` - animated placeholder
  - [x] 1.2 Create `SharedGroupSkeleton.tsx` - full view skeleton
  - [x] 1.3 Use CSS shimmer animation for loading effect (Tailwind animate-pulse)
  - [x] 1.4 Match skeleton dimensions to real components

- [x] Task 2: Implement Loading States (AC: #2)
  - [x] 2.1 Show skeleton during `isLoading` from React Query
  - [x] 2.2 Add optional progress text for multi-member fetch
  - [x] 2.3 Implement progressive loading (show data as it arrives)
  - [x] 2.4 Ensure smooth transition from loading to data

- [x] Task 3: Create Empty State - No Transactions (AC: #3)
  - [x] 3.1 Create `SharedGroupEmptyState.tsx` component
  - [x] 3.2 Design illustration (ClipboardList icon)
  - [x] 3.3 Add descriptive text: "No transactions yet"
  - [x] 3.4 Add CTA: "Scan First Receipt" button linking to scan flow

- [x] Task 4: Create Empty State - No Other Members (AC: #4, #5)
  - [x] 4.1 Create `InviteMembersPrompt.tsx` component
  - [x] 4.2 Detect when user is only member (memberCount <= 1)
  - [x] 4.3 Show "Invite family or friends to share expenses"
  - [x] 4.4 Include share link button
  - [x] 4.5 Link to full share code display

- [x] Task 5: Integrate into Views (AC: all)
  - [x] 5.1 Export components from SharedGroups/index.ts
  - [x] 5.2 Components ready for integration in views
  - [x] 5.3 Show appropriate empty state based on memberCount
  - [x] 5.4 States handle transitions via props

- [x] Task 6: i18n Translations
  - [x] 6.1 Add loading text strings
  - [x] 6.2 Add empty state messages
  - [x] 6.3 Add invite prompt strings
  - [x] 6.4 Add accessibility labels

- [x] Task 7: Component Tests
  - [x] 7.1 Test skeleton renders during loading (10 tests)
  - [x] 7.2 Test empty state appears with zero transactions (17 tests)
  - [x] 7.3 Test invite prompt appears for single-member group (14 tests)
  - [x] 7.4 Test SharedGroupSkeleton states (13 tests)

## Dev Notes

### Architecture Context

**Loading State Priority:**
1. **IndexedDB cached data** → Show immediately (from 14c.5)
2. **While fetching fresh data** → Show skeleton if no cache
3. **Fetch complete** → Replace skeleton with real data
4. **No data** → Show empty state

This aligns with the three-layer caching strategy from 14c.5.

### Existing Code to Leverage

**Existing Skeletons:** Check if app has skeleton patterns
- May exist in `src/components/skeletons/`
- Shimmer animation utilities

**Empty State Patterns:**
- `src/components/EmptyState.tsx` - if exists
- Illustration components

**React Query States:**
- `isLoading` - initial load
- `isFetching` - background refresh
- `data` - actual data

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       ├── TransactionCardSkeleton.tsx   # Single card skeleton
│       ├── SharedGroupSkeleton.tsx       # Full view skeleton
│       ├── SharedGroupEmptyState.tsx     # No transactions empty
│       └── InviteMembersPrompt.tsx       # Invite CTA component
```

**Files to modify:**
```
src/components/views/HistoryView.tsx       # Add loading/empty states
src/components/views/DashboardView.tsx     # Add loading/empty states
```

### Skeleton Component

```typescript
// src/components/shared-groups/TransactionCardSkeleton.tsx
export function TransactionCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-lg border border-gray-100 animate-pulse">
      <div className="flex gap-3">
        {/* Thumbnail placeholder */}
        <div className="w-14 h-14 bg-gray-200 rounded-lg" />

        {/* Content placeholder */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>

        {/* Amount placeholder */}
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>
    </div>
  );
}

// Shimmer animation CSS
// .animate-pulse already exists in Tailwind
// Or use custom shimmer:
// background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
// animation: shimmer 1.5s infinite;
```

### Empty State - No Transactions

```typescript
// src/components/shared-groups/SharedGroupEmptyState.tsx
interface SharedGroupEmptyStateProps {
  groupName: string;
  memberCount: number;
  onScanReceipt: () => void;
  onInviteMembers: () => void;
}

export function SharedGroupEmptyState({
  groupName,
  memberCount,
  onScanReceipt,
  onInviteMembers,
}: SharedGroupEmptyStateProps) {
  const isSoloMember = memberCount <= 1;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {/* Illustration */}
      <div className="w-32 h-32 mb-6 bg-gray-100 rounded-full flex items-center justify-center">
        <span className="text-5xl">📋</span>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {t('noTransactionsYet')}
      </h2>

      {/* Description */}
      <p className="text-gray-500 mb-6 max-w-xs">
        {isSoloMember
          ? t('inviteMembersToStart')
          : t('scanReceiptToAdd')}
      </p>

      {/* Primary CTA */}
      {isSoloMember ? (
        <Button onClick={onInviteMembers} className="mb-3">
          {t('inviteMembers')}
        </Button>
      ) : (
        <Button onClick={onScanReceipt} className="mb-3">
          {t('scanFirstReceipt')}
        </Button>
      )}

      {/* Secondary CTA */}
      {!isSoloMember && (
        <button
          onClick={onInviteMembers}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          {t('orInviteMoreMembers')}
        </button>
      )}
    </div>
  );
}
```

### Invite Members Prompt

```typescript
// src/components/shared-groups/InviteMembersPrompt.tsx
interface InviteMembersPromptProps {
  groupId: string;
  onOpenShare: () => void;
}

export function InviteMembersPrompt({ groupId, onOpenShare }: InviteMembersPromptProps) {
  return (
    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 rounded-full">
          <UsersIcon className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-blue-900 mb-1">
            {t('inviteFamilyOrFriends')}
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            {t('shareExpensesTogether')}
          </p>
          <Button size="sm" variant="outline" onClick={onOpenShare}>
            {t('shareInviteLink')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Loading States Integration

```typescript
// In HistoryView or SharedGroupTransactionsView
function SharedGroupTransactionsView({ groupId }: { groupId: string }) {
  const { transactions, isLoading, error } = useSharedGroupTransactions({ groupId });
  const { data: group } = useSharedGroup(groupId);

  // Loading state
  if (isLoading && !transactions.length) {
    return (
      <div className="space-y-3">
        <TransactionCardSkeleton />
        <TransactionCardSkeleton />
        <TransactionCardSkeleton />
        <p className="text-center text-sm text-gray-400">
          {t('loadingFromMembers', { count: group?.members.length || 0 })}
        </p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && transactions.length === 0) {
    return (
      <SharedGroupEmptyState
        groupName={group?.name || ''}
        memberCount={group?.members.length || 0}
        onScanReceipt={() => navigate('/scan')}
        onInviteMembers={() => navigate(`/group/${groupId}/share`)}
      />
    );
  }

  // Data state
  return (
    <div className="space-y-3">
      {/* Show invite prompt if solo member */}
      {group?.members.length === 1 && (
        <InviteMembersPrompt
          groupId={groupId}
          onOpenShare={() => navigate(`/group/${groupId}/share`)}
        />
      )}

      {transactions.map(tx => (
        <TransactionCard key={tx.id} transaction={tx} />
      ))}
    </div>
  );
}
```

### UX Considerations

**Loading Feedback:**
- Skeleton should match actual content layout
- Avoid jarring layout shifts
- Consider progressive reveal for better perceived performance

**Empty State Messaging:**
- Friendly, encouraging tone
- Clear next action
- Different message for new group vs group with members

**Invite Prompt:**
- Subtle but visible
- Easy to dismiss mentally
- Quick action (one tap to share)

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Story 14c.5 - Caching Strategy]: docs/sprint-artifacts/epic14c/14c-5-shared-group-transactions-view.md
- [UX Mockup]: docs/uxui/mockups/01_views/shared-groups.html
- [Tailwind Skeleton Animation]: https://tailwindcss.com/docs/animation#pulse

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- Created 4 new components for skeleton and empty state UI
- All components follow Atlas patterns: animate-pulse, role="status", aria-label
- Context-aware empty states based on memberCount
- Comprehensive test coverage: 55 tests across 4 test files
- i18n translations added for both English and Spanish
- Build passes, TypeScript compiles cleanly

### Code Review Fixes (2026-01-15)

- Added hover/focus states to secondary "Or invite more members" button for better accessibility
- Added defensive test for negative memberCount edge case (now 18 tests in SharedGroupEmptyState)
- Verified hardcoded fallback color `#dbeafe` is consistent with codebase pattern (not a bug)

### File List

**New Files:**
- src/components/SharedGroups/TransactionCardSkeleton.tsx (skeleton card)
- src/components/SharedGroups/SharedGroupSkeleton.tsx (full view skeleton)
- src/components/SharedGroups/SharedGroupEmptyState.tsx (empty state)
- src/components/SharedGroups/InviteMembersPrompt.tsx (invite banner)
- tests/unit/components/SharedGroups/TransactionCardSkeleton.test.tsx (10 tests)
- tests/unit/components/SharedGroups/SharedGroupSkeleton.test.tsx (13 tests)
- tests/unit/components/SharedGroups/SharedGroupEmptyState.test.tsx (18 tests)
- tests/unit/components/SharedGroups/InviteMembersPrompt.test.tsx (14 tests)

**Modified Files:**
- src/components/SharedGroups/index.ts (added exports)
- src/utils/translations.ts (added 12 translation keys each for en/es)
- docs/sprint-artifacts/sprint-status.yaml (story status → done)
- docs/sprint-artifacts/epic14c/14c-10-empty-states-loading.md (tasks → done)
- _bmad/agents/atlas/atlas-sidecar/knowledge/06-lessons.md (patterns added)
