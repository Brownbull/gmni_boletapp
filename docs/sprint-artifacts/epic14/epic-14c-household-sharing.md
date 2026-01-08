# Epic 14c: Household Sharing

## Overview
Enable household members (2-10 users) to share transactions and view combined spending. Uses React Query (introduced in Story 14.29) for intelligent caching, optimistic updates, and real-time sync between users.

**Prerequisite**: Story 14.29 (React Query Migration) - ✅ **COMPLETED 2026-01-07**

> **UNBLOCKED**: This epic can now proceed. React Query infrastructure is in place with:
> - `useFirestoreSubscription` hook for real-time data + caching
> - `useFirestoreMutation` hook for mutations with optimistic updates
> - Query keys hierarchy (`src/lib/queryKeys.ts`)
> - QueryClient configured with optimal Firestore settings
> - DevTools available in development mode

## Business Value
- **User retention**: Families can track expenses together
- **Competitive advantage**: Few expense trackers support multi-user households
- **Revenue opportunity**: Premium feature for subscription tier

## Target Users
- Couples sharing household expenses
- Families with children learning financial responsibility
- Roommates splitting bills
- Small business partners

---

## Feature Scope

### In Scope
- Create/join households (invite via code)
- Share transactions with household
- Combined spending view (all members)
- Per-member spending breakdown
- Shared categories (customizable by household)
- React Query for all data fetching
- Real-time updates when any member adds transactions

### Out of Scope (Future)
- Bill splitting calculations
- Payment tracking between members
- Shared budgets/goals
- Role-based permissions (admin vs member)

---

## Architecture Decision: React Query

### Why React Query for This Feature

| Challenge | Without React Query | With React Query |
|-----------|--------------------|--------------------|
| Cache invalidation when other user adds tx | Manual `onSnapshot` + state management | `queryClient.invalidateQueries()` |
| Optimistic updates with rollback | Build from scratch | Built-in `onMutate`, `onError` |
| Loading/error states | Manual per-component | Automatic via hooks |
| Stale data handling | Manual refresh logic | `staleTime`, `refetchOnFocus` |
| Multi-query coordination | Complex state management | Query keys, `useQueries` |

### Migration Strategy
1. **Story 14.29**: Migrates existing hooks to React Query (PREREQUISITE)
2. **This epic**: Builds household features using established RQ patterns
3. **Firestore listeners**: Hybrid approach (RQ + `onSnapshot` for invalidation)

---

## Data Model

### Firestore Structure

```
artifacts/{appId}/
├── households/
│   └── {householdId}/
│       ├── metadata (name, createdBy, inviteCode)
│       ├── members/ (subcollection)
│       │   └── {userId} (role, joinedAt)
│       └── shared_transactions/ (subcollection)
│           └── {transactionId} (copy with addedBy field)
│
└── users/{userId}/
    └── household_membership (householdId, role)
```

### Key Types

```typescript
interface Household {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  inviteCode: string; // 6-char code for joining
  memberCount: number;
}

interface HouseholdMember {
  userId: string;
  displayName: string;
  email: string;
  role: 'owner' | 'member';
  joinedAt: Timestamp;
}

interface SharedTransaction extends Transaction {
  addedBy: string; // userId who added this
  addedByName: string; // display name
  sharedAt: Timestamp;
}
```

---

## Stories

**Prerequisite**: Story 14.29 (React Query Migration) - ✅ COMPLETED

### Foundation (Infrastructure)

| Story | Points | Description |
|-------|--------|-------------|
| **14c.1** | 3 | Household CRUD Service |
| **14c.2** | 3 | Membership Service (invite/join/leave) |

### Core Features

| Story | Points | Description |
|-------|--------|-------------|
| **14c.3** | 5 | Create Household UI |
| **14c.4** | 3 | Join Household UI (invite code) |
| **14c.5** | 5 | Share Transaction to Household |
| **14c.6** | 5 | Household Transactions View |
| **14c.7** | 3 | Member Spending Breakdown |

### Real-time & Polish

| Story | Points | Description |
|-------|--------|-------------|
| **14c.8** | 3 | Real-time Sync (other members' changes) |
| **14c.9** | 2 | Leave/Delete Household |
| **14c.10** | 2 | Household Settings UI |

**Total: ~34 points** (excludes 14.29 prerequisite)

---

## Story Details

> **Note**: Story 14.29 (React Query Migration) handles React Query setup.
> These stories assume React Query is already installed and configured.

### Story 14c.1: Household CRUD Service

**Goal**: Create Firestore service for household management.

**Acceptance Criteria**:
- [ ] `createHousehold(name, userId)` - creates household, adds user as owner
- [ ] `getHousehold(householdId)` - fetch household metadata
- [ ] `updateHousehold(householdId, updates)` - update name, settings
- [ ] `deleteHousehold(householdId)` - delete household and all data
- [ ] Generate unique 6-character invite codes

**Firestore Rules**:
```javascript
match /households/{householdId} {
  allow read: if isMember(householdId);
  allow create: if isAuthenticated();
  allow update, delete: if isOwner(householdId);
}
```

---

### Story 14c.2: Membership Service

**Goal**: Handle joining, leaving, and member management.

**Acceptance Criteria**:
- [ ] `joinHousehold(inviteCode, userId)` - validate code, add member
- [ ] `leaveHousehold(householdId, userId)` - remove self from household
- [ ] `removeMember(householdId, userId)` - owner removes member
- [ ] `getMembers(householdId)` - list all members with details
- [ ] `getUserHousehold(userId)` - get user's current household (if any)
- [ ] Limit: max 10 members per household

---

### Story 14c.3: Create Household UI

**Goal**: UI flow to create a new household.

**Acceptance Criteria**:
- [ ] "Create Household" button in Settings
- [ ] Modal/form for household name
- [ ] Show generated invite code after creation
- [ ] Copy invite code to clipboard
- [ ] Navigate to household view after creation

**UI Location**: Settings > Cuenta > Hogar

---

### Story 14c.4: Join Household UI

**Goal**: UI flow to join existing household.

**Acceptance Criteria**:
- [ ] "Join Household" option in Settings
- [ ] 6-character code input
- [ ] Validate code, show household name before confirming
- [ ] Error handling (invalid code, household full, already member)
- [ ] Success confirmation with household details

---

### Story 14c.5: Share Transaction to Household

**Goal**: Allow users to share individual transactions.

**Acceptance Criteria**:
- [ ] "Share to Household" option in transaction actions
- [ ] Bulk share from selection mode
- [ ] Auto-share toggle in settings (new transactions auto-shared)
- [ ] Shared indicator on transaction card
- [ ] Optimistic UI with React Query mutation

**React Query Pattern**:
```typescript
const shareTransaction = useMutation({
  mutationFn: (txId) => shareToHousehold(txId, householdId),
  onMutate: async (txId) => {
    // Optimistic update
    queryClient.setQueryData(['transactions'], (old) =>
      old.map(tx => tx.id === txId ? { ...tx, shared: true } : tx)
    );
  },
  onSettled: () => {
    queryClient.invalidateQueries(['household', householdId, 'transactions']);
  },
});
```

---

### Story 14c.6: Household Transactions View

**Goal**: View all shared transactions from household members.

**Acceptance Criteria**:
- [ ] New view: "Hogar" in navigation
- [ ] List all shared transactions from all members
- [ ] Filter by member
- [ ] Filter by date range
- [ ] Show who added each transaction
- [ ] Combined total spending

**React Query**:
```typescript
const { data: householdTransactions } = useQuery({
  queryKey: ['household', householdId, 'transactions'],
  queryFn: () => getHouseholdTransactions(householdId),
});
```

---

### Story 14c.7: Member Spending Breakdown

**Goal**: Show spending breakdown per household member.

**Acceptance Criteria**:
- [ ] Pie chart / bar chart of spending by member
- [ ] List view with member totals
- [ ] Percentage contribution
- [ ] Category breakdown per member (optional)

---

### Story 14c.8: Real-time Sync

**Goal**: Update UI when other members add/modify transactions.

**Acceptance Criteria**:
- [ ] Firestore listener on household transactions
- [ ] Invalidate React Query cache on changes
- [ ] Show subtle notification ("Maria added a transaction")
- [ ] No page reload required

**Implementation**:
```typescript
// Hybrid: React Query + Firestore listener
useEffect(() => {
  if (!householdId) return;

  const unsubscribe = onSnapshot(
    collection(db, `households/${householdId}/shared_transactions`),
    () => {
      // Just invalidate - React Query handles refetch
      queryClient.invalidateQueries(['household', householdId, 'transactions']);
    }
  );

  return unsubscribe;
}, [householdId]);
```

---

### Story 14c.9: Leave/Delete Household

**Goal**: Allow users to leave or owners to delete household.

**Acceptance Criteria**:
- [ ] "Leave Household" button for members
- [ ] "Delete Household" button for owners
- [ ] Confirmation dialog with consequences
- [ ] Owner leaving transfers ownership or deletes if last member
- [ ] Remove user's household_membership document

---

### Story 14c.10: Household Settings UI

**Goal**: Settings page for household management.

**Acceptance Criteria**:
- [ ] View/edit household name
- [ ] View invite code (with regenerate option)
- [ ] List members with roles
- [ ] Owner: remove members
- [ ] Member: leave household

---

## Dependencies

### External
- `@tanstack/react-query` (~13KB)
- `@tanstack/react-query-devtools` (dev only)

### Internal
- Story 14.28 (App-Level Preferences) - establishes context pattern
- Firestore security rules update

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Query learning curve | Medium | Start with simple queries, add complexity |
| Data consistency (multi-user) | High | Use Firestore transactions for atomic ops |
| Bundle size increase | Low | Tree-shaking, lazy load household features |
| Migration complexity | Medium | New features only, don't migrate existing |

---

## Success Metrics

- Households created: >100 in first month
- Average members per household: 2.5+
- Shared transactions per household: >50/month
- User retention (household users vs solo): +20%

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-07 | Epic created | Claude Code |
| 2026-01-07 | Marked as UNBLOCKED after Story 14.29 completion | Claude Code |
