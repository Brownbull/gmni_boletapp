# Story 14c.6: Transaction Ownership Indicators

Status: ready-for-dev

## Story

As a group member viewing shared transactions,
I want to see who added each transaction,
so that I know whose spending I'm looking at and can only edit my own.

## Acceptance Criteria

1. **AC1: Profile Icon on Transaction Cards**
   - Given I'm viewing shared group transactions
   - When a transaction belongs to another member (not me)
   - Then a small profile icon (avatar) appears in the bottom-left corner
   - And the avatar shows the owner's initial or profile picture

2. **AC2: Own Transactions No Indicator**
   - Given I'm viewing shared group transactions
   - When a transaction belongs to me
   - Then no profile indicator is shown
   - And the card appears as it would in personal mode

3. **AC3: Tapping Others' Transactions Opens View-Only**
   - Given I tap on another member's transaction
   - When the detail view opens
   - Then it opens in view-only mode
   - And I cannot edit any fields
   - And there is a clear visual indicator that this is view-only

4. **AC4: View-Only Mode Visuals**
   - Given I'm viewing another member's transaction
   - When the detail view is shown
   - Then the owner's profile icon appears in the top-left
   - And all input fields are disabled/read-only
   - And there is no "Save" or "Delete" button
   - And a "View Only" badge or label is displayed

5. **AC5: Own Transactions Remain Editable**
   - Given I tap on my own transaction in shared group view
   - When the detail view opens
   - Then it opens in normal edit mode
   - And I can edit all fields
   - And "Save" and "Delete" buttons are available

## Tasks / Subtasks

- [ ] Task 1: Add Ownership Tracking to Transaction Display (AC: #1, #2)
  - [ ] 1.1 Extend shared transaction type with `_ownerId` field (client-side only)
  - [ ] 1.2 Determine ownership comparison: `transaction._ownerId !== currentUserId`
  - [ ] 1.3 Create `ProfileIndicator.tsx` - small avatar component
  - [ ] 1.4 Fetch member profile data for avatar display

- [ ] Task 2: Update Transaction Card Component (AC: #1, #2)
  - [ ] 2.1 Modify `TransactionCard.tsx` to accept `ownerId` prop
  - [ ] 2.2 Conditionally render ProfileIndicator when not current user
  - [ ] 2.3 Position indicator in bottom-left corner per mockup
  - [ ] 2.4 Style indicator with border for visibility

- [ ] Task 3: Create View-Only Transaction Detail (AC: #3, #4)
  - [ ] 3.1 Add `viewOnly` prop to transaction detail/editor component
  - [ ] 3.2 Disable all input fields when `viewOnly={true}`
  - [ ] 3.3 Hide Save/Delete buttons in view-only mode
  - [ ] 3.4 Add "View Only" badge to header

- [ ] Task 4: Add Owner Display in Detail View (AC: #4)
  - [ ] 4.1 Show owner's avatar + name in detail view header
  - [ ] 4.2 Fetch owner's profile data (name, photo)
  - [ ] 4.3 Display "Added by [Name]" label
  - [ ] 4.4 Style owner info distinctly from transaction data

- [ ] Task 5: Implement Tap Routing Logic (AC: #3, #5)
  - [ ] 5.1 Modify transaction tap handler in shared views
  - [ ] 5.2 Check if transaction is owned by current user
  - [ ] 5.3 Route to edit mode if own transaction
  - [ ] 5.4 Route to view-only mode if other's transaction
  - [ ] 5.5 Pass `viewOnly` flag to detail component

- [ ] Task 6: Style and Polish (AC: #1, #4)
  - [ ] 6.1 Style ProfileIndicator per mockup (round, border, positioned)
  - [ ] 6.2 Style view-only badge/label
  - [ ] 6.3 Ensure dark mode compatibility
  - [ ] 6.4 Add subtle background tint for view-only mode

- [ ] Task 7: i18n Translations
  - [ ] 7.1 Add "View Only" string
  - [ ] 7.2 Add "Added by [Name]" string with interpolation
  - [ ] 7.3 Add accessibility labels for profile indicators

- [ ] Task 8: Component Tests
  - [ ] 8.1 Test ProfileIndicator renders for non-current user
  - [ ] 8.2 Test ProfileIndicator hidden for current user
  - [ ] 8.3 Test view-only mode disables inputs
  - [ ] 8.4 Test edit mode enables inputs for own transactions

## Dev Notes

### Architecture Context

**Ownership Determination:**
When transactions are fetched from multiple members in Story 14c.5, each transaction is tagged with `_ownerId` on the client side during the merge process. This allows us to compare against the current user's ID.

```typescript
// In sharedGroupTransactionService.ts (from 14c.5)
const allTransactions = snapshots.flatMap((snapshot, idx) =>
  snapshot.docs.map(doc => ({
    ...doc.data() as Transaction,
    _ownerId: members[idx],  // Track ownership
  }))
);
```

### Existing Code to Leverage

**Transaction Card:** `src/components/transactions/TransactionCard.tsx`
- Existing card layout
- Thumbnail, merchant, amount display
- Tap handling

**Transaction Editor:** `src/components/TransactionEditor.tsx` or similar
- Field editing UI
- Save/Delete functionality
- Can add `viewOnly` mode

**Avatar Components:** May exist in user profile areas
- Reuse avatar generation logic
- Initial letter fallback

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       ├── ProfileIndicator.tsx        # Small avatar for cards
│       └── ViewOnlyBanner.tsx          # "View Only" indicator
```

**Files to modify:**
```
src/components/transactions/TransactionCard.tsx  # Add ProfileIndicator
src/components/TransactionEditor.tsx             # Add viewOnly mode
src/components/views/HistoryView.tsx             # Pass ownership data
```

### ProfileIndicator Component

```typescript
// src/components/shared-groups/ProfileIndicator.tsx
interface ProfileIndicatorProps {
  userId: string;
  size?: 'small' | 'medium';  // small for cards, medium for detail
  className?: string;
}

export function ProfileIndicator({ userId, size = 'small', className }: ProfileIndicatorProps) {
  const { data: profile } = useUserProfile(userId);

  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={cn(
        'rounded-full border-2 border-white flex items-center justify-center',
        'font-semibold text-white',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: profile?.avatarColor || '#3b82f6' }}
    >
      {profile?.photoURL ? (
        <img src={profile.photoURL} alt="" className="w-full h-full rounded-full" />
      ) : (
        profile?.displayName?.[0]?.toUpperCase() || '?'
      )}
    </div>
  );
}
```

### Transaction Card with Indicator

```typescript
// In TransactionCard.tsx
interface TransactionCardProps {
  transaction: Transaction & { _ownerId?: string };
  currentUserId: string;
  onTap: () => void;
}

export function TransactionCard({ transaction, currentUserId, onTap }: TransactionCardProps) {
  const isOwnTransaction = !transaction._ownerId || transaction._ownerId === currentUserId;

  return (
    <div className="relative" onClick={onTap}>
      {/* Existing card content */}
      <div className="transaction-card">
        {/* ... thumbnail, merchant, amount ... */}
      </div>

      {/* Profile indicator for other users' transactions */}
      {!isOwnTransaction && (
        <ProfileIndicator
          userId={transaction._ownerId!}
          size="small"
          className="absolute bottom-2 left-2"
        />
      )}

      {/* View-only badge */}
      {!isOwnTransaction && (
        <span className="absolute top-2 right-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
          View only
        </span>
      )}
    </div>
  );
}
```

### View-Only Detail Mode

```typescript
// In TransactionEditor.tsx
interface TransactionEditorProps {
  transaction: Transaction;
  viewOnly?: boolean;
  ownerProfile?: UserProfile;  // For displaying "Added by"
}

export function TransactionEditor({ transaction, viewOnly = false, ownerProfile }: TransactionEditorProps) {
  return (
    <div className="transaction-editor">
      {/* View-only header */}
      {viewOnly && ownerProfile && (
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mb-4">
          <ProfileIndicator userId={ownerProfile.uid} size="medium" />
          <div>
            <p className="text-sm text-gray-500">{t('addedBy')}</p>
            <p className="font-medium">{ownerProfile.displayName}</p>
          </div>
          <span className="ml-auto px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
            {t('viewOnly')}
          </span>
        </div>
      )}

      {/* Form fields - disabled in view-only mode */}
      <input
        value={transaction.merchant}
        disabled={viewOnly}
        className={cn(viewOnly && 'bg-gray-50 cursor-not-allowed')}
      />
      {/* ... other fields ... */}

      {/* Action buttons - hidden in view-only mode */}
      {!viewOnly && (
        <div className="flex gap-2 mt-4">
          <Button onClick={handleSave}>{t('save')}</Button>
          <Button variant="destructive" onClick={handleDelete}>{t('delete')}</Button>
        </div>
      )}
    </div>
  );
}
```

### Tap Handler Routing

```typescript
// In HistoryView.tsx or wherever transactions are displayed
function handleTransactionTap(transaction: Transaction & { _ownerId?: string }) {
  const isOwn = !transaction._ownerId || transaction._ownerId === currentUser.uid;

  if (isOwn) {
    // Open in edit mode
    navigate(`/transaction/${transaction.id}/edit`);
  } else {
    // Open in view-only mode
    navigate(`/transaction/${transaction.id}/view`, {
      state: { ownerId: transaction._ownerId },
    });
  }
}
```

### UX Mockup Reference

See mockup: `docs/uxui/mockups/01_views/shared-groups.html` → "Shared Transactions" state
- Transaction cards with profile indicator in bottom-left
- "View only" badge on other users' transactions
- Clean visual distinction between own and others' transactions

### Styling Guidelines

**Profile Indicator Positioning:**
- Bottom-left corner of transaction card
- Small overlap with card edge (absolute positioning)
- White border to stand out on card background

**View-Only Styling:**
- Subtle gray background tint
- Disabled input styling (cursor: not-allowed, muted colors)
- Clear "View Only" badge visible at all times

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - Distinguish Transactions]: docs/analysis/brainstorming-session-2026-01-15.md#category-3-uiux-edge-cases
- [UX Mockup - Shared Transactions]: docs/uxui/mockups/01_views/shared-groups.html
- [Existing Transaction Card]: src/components/transactions/TransactionCard.tsx

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

