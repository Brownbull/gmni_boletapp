# Story 14c.7: Tag Transactions to Groups

Status: dev-complete

## Story

As a user with shared groups,
I want to tag my transactions to specific groups,
so that relevant expenses appear in group views for all members.

## Acceptance Criteria

1. **AC1: Group Selector in Edit View**
   - Given I am editing a transaction (new or existing)
   - When I view the edit form
   - Then I see a "Groups" field/section
   - And I can tap it to open a group selector

2. **AC2: Multi-Select Up to 5 Groups**
   - Given I open the group selector
   - When selecting groups
   - Then I can select multiple groups (up to 5)
   - And I see a checkmark on selected groups
   - And I see a count of selected groups (e.g., "2 of 5")

3. **AC3: Personal Groups Shown**
   - Given I open the group selector
   - When viewing the options
   - Then I see my personal (non-shared) custom groups
   - And they are labeled as "Personal" or have no share indicator

4. **AC4: Shared Groups with Member Indicator**
   - Given I open the group selector
   - When viewing the options
   - Then shared groups show a "Shared" badge or icon
   - And they show the member count (e.g., "3 members")
   - And they are visually distinct from personal groups

5. **AC5: Save Updates sharedGroupIds**
   - Given I select shared groups and save
   - When the transaction is saved
   - Then `sharedGroupIds[]` is updated on the transaction document
   - And the transaction appears in those groups' views
   - And `group.memberUpdates[myUserId]` timestamp is updated

## Tasks / Subtasks

- [x] Task 1: Create Group Selector Component (AC: #1, #2, #3, #4)
  - [x] 1.1 Create `src/components/SharedGroups/TransactionGroupSelector.tsx`
  - [x] 1.2 Fetch user's personal groups + shared groups
  - [x] 1.3 Implement multi-select with visual checkmarks
  - [x] 1.4 Show limit indicator (X of 5 selected)
  - [x] 1.5 Disable selection when 5 groups reached
  - [x] 1.6 Add "Shared" badge for shared groups
  - [x] 1.7 Add member count display for shared groups

- [x] Task 2: Integrate into Transaction Edit View (AC: #1)
  - [x] 2.1 Add "Groups" field to transaction editor form
  - [x] 2.2 Open selector on tap
  - [x] 2.3 Display selected groups as chips/tags
  - [x] 2.4 Support removing groups by tapping chip (opens selector)

- [x] Task 3: Update Transaction Save Logic (AC: #5)
  - [x] 3.1 Include `sharedGroupIds` in transaction save payload (via onGroupsChange callback)
  - [x] 3.2 Handle adding/removing groups (diff detection in updateMemberTimestampsForTransaction)
  - [x] 3.3 Update `memberUpdates` timestamp for affected groups
  - [x] 3.4 Use batch write for atomic updates

- [x] Task 4: Fetch Combined Groups List (AC: #3, #4)
  - [x] 4.1 Create `useAllUserGroups()` hook in `src/hooks/useAllUserGroups.ts`
  - [x] 4.2 N/A - Personal groups not yet implemented in codebase
  - [x] 4.3 Fetch shared groups from `sharedGroups` collection (via useUserSharedGroups)
  - [x] 4.4 Merge and sort alphabetically by name
  - [x] 4.5 Return with `isShared` flag per group (GroupWithMeta interface)

- [x] Task 5: UI Polish (AC: #2, #4)
  - [x] 5.1 Style group selector per design system (Tailwind + CSS custom properties)
  - [x] 5.2 Add group icons and colors
  - [x] 5.3 Style "Shared" badge (blue badge with Link2 icon)
  - [x] 5.4 Animate selection state changes (scale transform on press)

- [x] Task 6: i18n Translations
  - [x] 6.1 Add "Groups", "Shared", "Personal" strings (en + es)
  - [x] 6.2 Add "X of 5 groups" string with interpolation (uses existing "of")
  - [x] 6.3 Add accessibility labels (aria-label, aria-pressed)

- [x] Task 7: Component Tests
  - [x] 7.1 Test multi-select functionality (34 tests total)
  - [x] 7.2 Test max 5 groups limit enforcement
  - [x] 7.3 Test shared vs personal group display
  - [x] 7.4 Test useAllUserGroups hook transformations

## Dev Notes

### Bug Fixes

**Bug: Duplicate sharedGroupIds (2026-01-16)**
- **Issue**: Assigning the same group to a transaction multiple times caused duplicate entries in `sharedGroupIds[]`, inflating transaction counts in group views
- **Root cause**: No deduplication when saving group selections
- **Fix**: Added `[...new Set(groupIds)]` deduplication in:
  1. `TransactionGroupSelector.tsx` - when initializing and syncing local state
  2. `TransactionEditorView.tsx` - when calling onSelect callback

### Architecture Context

**Transaction Update Flow:**
When a user tags a transaction to shared groups, we need to:
1. Update the transaction's `sharedGroupIds[]` field
2. Update `memberUpdates[userId]` on each affected group (for cache invalidation)

This requires a batch write for atomicity.

**Group Limit Rationale:**
Max 5 groups per transaction prevents:
- Query complexity explosion
- UI clutter
- Reasonable use case coverage (most transactions belong to 1-2 groups)

### Existing Code to Leverage

**Transaction Group Selector:** May exist as `TransactionGroupSelector.tsx`
- Existing group selection UI for personal groups
- Extend to support shared groups

**Custom Group Types:** `src/types/transactionGroup.ts`
- `TransactionGroup` interface
- Group color, icon handling

**Transaction Service:** `src/services/transactionService.ts`
- Save/update transaction patterns
- Batch write patterns

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       └── TransactionGroupSelector.tsx  # Multi-select group picker
├── hooks/
│   └── useAllUserGroups.ts               # Combined personal + shared groups
```

**Files to modify:**
```
src/components/TransactionEditor.tsx       # Add groups field
src/services/transactionService.ts         # Update to handle sharedGroupIds
src/services/sharedGroupService.ts         # Add memberUpdates timestamp update
```

### Group Selector UI Design

```
┌────────────────────────────────────────┐
│  Select Groups (2 of 5)                │
├────────────────────────────────────────┤
│  SHARED GROUPS                         │
│ ┌────────────────────────────────────┐ │
│ │ ✓ [👨‍👩‍👧] Familia Martinez          │ │
│ │     🔗 Shared · 3 members          │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │   [🏠] Roommates                   │ │
│ │     🔗 Shared · 2 members          │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│  PERSONAL GROUPS                       │
│ ┌────────────────────────────────────┐ │
│ │ ✓ [🚗] Viaje Valparaiso            │ │
│ │     Personal                       │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │   [🍕] Eating Out                  │ │
│ │     Personal                       │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│          [Done]                        │
└────────────────────────────────────────┘
```

### Transaction Editor Integration

```typescript
// In TransactionEditor.tsx
function TransactionEditor({ transaction }: TransactionEditorProps) {
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
    transaction.sharedGroupIds || []
  );
  const [showGroupSelector, setShowGroupSelector] = useState(false);

  return (
    <div>
      {/* ... other fields ... */}

      {/* Groups field */}
      <div className="form-field">
        <label>{t('groups')}</label>
        <div
          className="flex flex-wrap gap-2 p-3 border rounded-lg cursor-pointer"
          onClick={() => setShowGroupSelector(true)}
        >
          {selectedGroupIds.length === 0 ? (
            <span className="text-gray-400">{t('selectGroups')}</span>
          ) : (
            selectedGroupIds.map(groupId => (
              <GroupChip
                key={groupId}
                groupId={groupId}
                onRemove={() => handleRemoveGroup(groupId)}
              />
            ))
          )}
        </div>
      </div>

      {/* Group selector modal */}
      {showGroupSelector && (
        <TransactionGroupSelector
          selectedIds={selectedGroupIds}
          onSelect={setSelectedGroupIds}
          onClose={() => setShowGroupSelector(false)}
        />
      )}
    </div>
  );
}
```

### Combined Groups Hook

```typescript
// src/hooks/useAllUserGroups.ts
interface GroupWithMeta {
  id: string;
  name: string;
  color: string;
  icon: string;
  isShared: boolean;
  memberCount?: number;
}

export function useAllUserGroups(): {
  groups: GroupWithMeta[];
  isLoading: boolean;
  error: Error | null;
} {
  const { user } = useAuth();
  const { data: personalGroups } = useUserGroups(user?.uid);
  const { data: sharedGroups } = useUserSharedGroups(user?.uid);

  const allGroups = useMemo(() => {
    const personal = (personalGroups || []).map(g => ({
      ...g,
      isShared: false,
    }));

    const shared = (sharedGroups || []).map(g => ({
      ...g,
      isShared: true,
      memberCount: g.members.length,
    }));

    // Shared first, then personal
    return [...shared, ...personal];
  }, [personalGroups, sharedGroups]);

  return { groups: allGroups, isLoading, error };
}
```

### Save Logic with memberUpdates

```typescript
// In transactionService.ts or sharedGroupService.ts
export async function saveTransactionWithGroups(
  db: Firestore,
  appId: string,
  userId: string,
  transactionId: string,
  transactionData: Partial<Transaction>,
  newGroupIds: string[],
  previousGroupIds: string[]
): Promise<void> {
  const batch = writeBatch(db);

  // 1. Update transaction
  const txRef = doc(db, `artifacts/${appId}/users/${userId}/transactions`, transactionId);
  batch.update(txRef, {
    ...transactionData,
    sharedGroupIds: newGroupIds,
    updatedAt: serverTimestamp(),
  });

  // 2. Update memberUpdates for all affected groups
  const allAffectedGroups = new Set([...newGroupIds, ...previousGroupIds]);

  for (const groupId of allAffectedGroups) {
    // Check if this is a shared group (not personal)
    const groupRef = doc(db, 'sharedGroups', groupId);
    batch.update(groupRef, {
      [`memberUpdates.${userId}`]: serverTimestamp(),
    });
  }

  await batch.commit();
}
```

### UX Considerations

**Selection Feedback:**
- Clear checkmarks on selected groups
- Running count of selections
- Visual disable at max (5 groups)

**Shared vs Personal Distinction:**
- Section headers separate shared from personal
- "Shared" badge with link icon
- Member count for shared groups

**Chips in Edit View:**
- Small, removable chips show selected groups
- Tap chip to remove
- Tap empty area to open selector

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md#multi-tag-design-decision
- [Brainstorming - Multi-Tag]: docs/analysis/brainstorming-session-2026-01-15.md#multi-tag-design-decision
- [Brainstorming - Constraints]: docs/analysis/brainstorming-session-2026-01-15.md#constraints-limits
- [Existing Group Selector]: src/components/TransactionGroupSelector.tsx

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

**Session 2026-01-16:**
- All 7 tasks completed and tested (34 tests passing)
- Bug found during testing: duplicate sharedGroupIds when assigning same group multiple times
- Bug fixed with `[...new Set(ids)]` deduplication in TransactionGroupSelector and TransactionEditorView
- Firestore data fix needed: User has 2 transactions with duplicate group IDs causing inflated counts
- Created `scripts/fix-duplicate-sharedGroupIds.ts` but needs auth - easiest fix is to open affected transactions in app, tap group selector, tap Done (dedup kicks in), then Save

**TODO for next session:**
1. Fix Firestore data (either via Firebase Console or by opening affected transactions in app)
2. Run code review workflow
3. Mark story as `done` after review passes

### File List

**New Files:**
- `src/components/SharedGroups/TransactionGroupSelector.tsx` - Multi-select group picker modal
- `src/hooks/useAllUserGroups.ts` - Hook combining personal + shared groups
- `tests/unit/components/SharedGroups/TransactionGroupSelector.test.tsx` - 23 component tests
- `tests/unit/hooks/useAllUserGroups.test.ts` - 11 hook tests
- `scripts/fix-duplicate-sharedGroupIds.ts` - One-time data fix script (needs auth)

**Modified Files:**
- `src/views/TransactionEditorView.tsx` - Added Groups field UI, selector modal integration
- `src/App.tsx` - Added availableGroups prop, onGroupsChange handler with memberUpdates
- `src/services/sharedGroupService.ts` - Added updateMemberTimestampsForTransaction()
- `src/components/SharedGroups/index.ts` - Exported TransactionGroupSelector, GroupWithMeta
- `src/utils/translations.ts` - Added selectGroups, sharedGroups, personalGroups, groups, noGroupsAvailable (en + es)

