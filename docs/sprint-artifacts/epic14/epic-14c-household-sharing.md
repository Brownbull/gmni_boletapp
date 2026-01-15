# Epic 14C: Shared Groups

## Overview

Enable users to share transactions with custom groups (2-10 members) and view combined spending. Transforms from individual expense tracking to shared financial visibility with the core question: "Where is my money going - even when I'm not the one spending it?"

**Prerequisite**: Story 14.29 (React Query Migration) - ✅ **COMPLETED 2026-01-07**

> **UNBLOCKED**: This epic can now proceed. React Query infrastructure is in place with:
> - `useFirestoreSubscription` hook for real-time data + caching
> - `useFirestoreMutation` hook for mutations with optimistic updates
> - Query keys hierarchy (`src/lib/queryKeys.ts`)
> - QueryClient configured with optimal Firestore settings
> - DevTools available in development mode

## Business Value

- **User retention**: Families/couples can track expenses together
- **Competitive advantage**: Few expense trackers support multi-user sharing
- **Revenue opportunity**: Premium feature for subscription tier
- **Simplicity**: No complex permissions - just symmetric visibility

## Target Users

- Couples sharing household expenses
- Families with children learning financial responsibility
- Roommates splitting bills
- Small business partners

---

## Architecture Decisions (Brainstorming 2026-01-15)

### Core Design Principles

| Aspect | Decision |
|--------|----------|
| **Visibility** | Symmetric - everyone sees everything in the group |
| **Ownership** | Each person owns their own transactions (immutable by others) |
| **Action** | Anyone can ADD their transaction to the group (tag it) |
| **Hierarchy** | None - all members are equal peers |
| **Model** | Shared Groups = labels that multiple users can tag transactions with |

### What We're NOT Building

- No roles (admin, viewer, contributor)
- No permission levels
- No income/budget tracking in groups
- No edit permissions on others' data
- No approval workflows
- No per-transaction privacy settings

### Data Architecture: Option 4 - Hybrid Model

**Selected approach:** Shared Group Document + User Transactions

```typescript
// New top-level collection: sharedGroups/{groupId}
interface SharedGroup {
  id: string;
  ownerId: string;
  name: string;              // May include emoji
  color: string;             // Hex color
  icon: string;              // Icon identifier
  shareCode: string;         // 16-char nanoid (optional fallback)
  shareCodeExpiresAt: Timestamp; // 7-day expiry
  members: string[];         // Max 10 users, ordered by join date
  memberUpdates: {           // For smart cache invalidation
    [userId: string]: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// NEW: Email-based invitations (top-level collection)
// Path: pendingInvitations/{invitationId}
interface PendingInvitation {
  id: string;
  groupId: string;
  groupName: string;         // Denormalized for display
  groupColor: string;        // Denormalized for UI
  invitedEmail: string;      // Email to match (lowercase)
  invitedByUserId: string;
  invitedByName: string;     // Denormalized for display
  createdAt: Timestamp;
  expiresAt: Timestamp;      // 7 days from creation
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

// Updated Transaction model
interface Transaction {
  // ... existing fields
  sharedGroupIds?: string[];  // Max 5 groups
  deletedAt?: Timestamp;      // Soft delete support
}

// User profile extension (for security rules)
interface UserProfile {
  // ...existing fields
  memberOfSharedGroups: string[];  // For security rule checks
}
```

### Constraints & Limits

```typescript
export const SHARED_GROUP_LIMITS = {
  MAX_MEMBERS: 10,
  MAX_GROUPS_PER_TRANSACTION: 5,
  MAX_SHARED_GROUPS_PER_USER: 5,
  SHARE_CODE_EXPIRY_DAYS: 7,
  MAX_TIME_RANGE_MONTHS: 12,
  CACHE_MAX_RECORDS: 50_000,
};
```

### Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: React Query In-Memory Cache                   │
│  - staleTime: 5 minutes                                 │
│  - gcTime: 30 minutes                                   │
├─────────────────────────────────────────────────────────┤
│  Layer 2: IndexedDB Persistent Cache                    │
│  - Survives app close/refresh                           │
│  - Works offline                                        │
│  - LRU eviction at 50K records                          │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Firestore (Source of Truth)                   │
│  - Delta sync: where('updatedAt', '>', lastSync)        │
│  - Invalidation via memberUpdates timestamp             │
└─────────────────────────────────────────────────────────┘
```

---

## Stories (Reorganized for User Value)

**Total: ~46 points across 11 stories**

### Phase 1: Foundation (Stories 1-3) - Can Start Without Mockups

| Story | Points | Description | Key Deliverables |
|-------|--------|-------------|------------------|
| **14c.1** | 8 | Create Shared Group | Data model + security rules + create UI + invite by email |
| **14c.2** | 4 | Accept/Decline Invitation | Pending invitations UI + accept/decline flow + notification badge |
| **14c.3** | 3 | Leave/Manage Group | Soft/hard leave + ownership transfer + member removal |

### Phase 2: Core UX (Stories 4-6) - After Mockups

| Story | Points | Description | Key Deliverables |
|-------|--------|-------------|------------------|
| **14c.4** | 5 | View Mode Switcher | Logo icon tap → group selector → filter all views |
| **14c.5** | 8 | Shared Group Transactions View | Cross-member queries + caching + delta sync |
| **14c.6** | 3 | Transaction Ownership Indicators | Profile icon on cards + view-only mode |

### Phase 3: Features (Stories 7-9)

| Story | Points | Description | Key Deliverables |
|-------|--------|-------------|------------------|
| **14c.7** | 3 | Tag Transactions to Groups | Custom group selector in Edit view |
| **14c.8** | 2 | Auto-Tag on Scan | In group view, new scans auto-tagged |
| **14c.9** | 5 | Shared Group Analytics | Polygon, sparkline, insights for group data |

### Phase 4: Polish (Stories 10-11)

| Story | Points | Description | Key Deliverables |
|-------|--------|-------------|------------------|
| **14c.10** | 2 | Empty States & Loading | Skeleton UI, empty states, loading feedback |
| **14c.11** | 2 | Error Handling | User not found, network errors, quota exceeded |

---

## Story Details

### Story 14c.1: Create Shared Group (8 pts)

**Goal**: User can convert a custom group to shared and invite others by email.

**User Story**:
As a user with custom groups,
I want to make one of my groups shareable and invite family/friends by email,
so that they can see and add transactions to it.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Groups (Empty/Filled)**: Settings > Groups screen with "Make Shareable" flow
- **Make Shareable Dialog**: Confirmation modal before converting
- **Invite by Email**: Email input + "Send Invite" button
- **Share Code Display**: (Optional fallback) Code display with copy button

**Acceptance Criteria**:
- [x] AC1: New `sharedGroups` Firestore collection with security rules
- [x] AC2: Transaction model extended with `sharedGroupIds[]` and `deletedAt`
- [x] AC3: User profile extended with `memberOfSharedGroups[]`
- [x] AC4: "Make Shareable" button on custom group in Settings
- [x] AC5: Generate 16-char nanoid share code with 7-day expiry (optional fallback)
- [x] AC6: Display share code with copy-to-clipboard (optional fallback)
- [ ] AC7: **NEW** "Invite by Email" button opens email input dialog
- [ ] AC8: **NEW** `pendingInvitations` collection to store email-based invites
- [x] AC9: Security rules: members can read, owner can write
- [x] AC10: Firebase emulator tests for security rules

**Technical Notes**:
- Creates foundation data model for all subsequent stories
- Security rules use `memberOfSharedGroups` on user profile for cross-user reads
- Email invitations stored in `pendingInvitations` top-level collection
- Share codes kept as optional fallback for future use (already implemented)

---

### Story 14c.2: Accept/Decline Invitation (4 pts)

**Goal**: User can view and respond to pending group invitations.

**User Story**:
As a user who was invited to a shared group by email,
I want to see my pending invitations and accept or decline them,
so that I can join groups my family/friends created.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Groups (Filled)**: Shows pending invitations with accept/decline buttons
- **Notification Badge**: Alert icon shows pending invitation count

**Acceptance Criteria**:
- [ ] AC1: Query `pendingInvitations` where `invitedEmail == user.email`
- [ ] AC2: Show pending invitation count badge on Alerts nav icon
- [ ] AC3: Tapping Alerts badge navigates to Settings > Groups
- [ ] AC4: Pending invitations section shows group name, inviter name, expiry
- [ ] AC5: "Accept" button adds user to group.members[] and updates user profile
- [ ] AC6: "Decline" button marks invitation as declined
- [ ] AC7: Expired invitations shown grayed out with "Expired" label
- [ ] AC8: Error states: group full, already member, invitation expired

**Technical Notes**:
- Much simpler than link-based flow - all happens in-app
- User must already have account with matching email
- No URL handling or sessionStorage needed
- Use React Query for invitation list subscription

---

### Story 14c.3: Leave/Manage Group (3 pts)

**Goal**: User can leave group, transfer ownership, or remove members.

**User Story**:
As a group member,
I want to leave a shared group,
so that my transactions are no longer visible to others.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Groups (Filled)**: Shows group list with member avatars, pending invitations with accept/decline
- **Share Code Display**: Members section with owner badge, remove option (owner only)

**Acceptance Criteria**:
- [ ] AC1: "Leave Group" button for members
- [ ] AC2: Soft leave option: transactions stay in group (read-only to others)
- [ ] AC3: Hard leave option: transactions removed from group
- [ ] AC4: Owner leaving: must transfer ownership or delete group
- [ ] AC5: Owner can remove other members
- [ ] AC6: Confirmation dialog with consequences explained
- [ ] AC7: Update user profile `memberOfSharedGroups` on leave

---

### Story 14c.4: View Mode Switcher (5 pts)

**Goal**: User can switch between personal and shared group views.

**User Story**:
As a user in multiple groups,
I want to switch view modes,
so that I can see combined spending for a specific group.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Personal Mode**: Home screen with header pattern (G logo | "Gastify" | Profile avatar)
- **Logo Dropdown**: Dropdown from G logo showing Personal + all shared groups with checkmark on active
- **Group Mode**: Header shows group icon (emerald), "Viewing: [Group Name]", member avatars

**Acceptance Criteria**:
- [ ] AC1: Logo icon in top-left is tappable
- [ ] AC2: Tap shows group selector (Personal + all joined groups)
- [ ] AC3: Personal mode: Boletapp logo, default colors
- [ ] AC4: Group mode: group icon + group color
- [ ] AC5: All views (Home, Analytics, History) filter to group data
- [ ] AC6: Persist selected view mode in localStorage
- [ ] AC7: Visual indicator of active mode in header

---

### Story 14c.5: Shared Group Transactions View (8 pts)

**Goal**: User can see all transactions from group members.

**User Story**:
As a group member,
I want to see all transactions shared to the group,
so that I understand our combined spending.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Group Mode**: Transaction list with profile indicators, date groupings, combined view

**Acceptance Criteria**:
- [ ] AC1: Query each member's transactions with `array-contains` filter
- [ ] AC2: Merge results client-side, sort by date
- [ ] AC3: IndexedDB caching layer for offline support
- [ ] AC4: Delta sync using `memberUpdates` timestamp
- [ ] AC5: React Query integration for cache-first loading
- [ ] AC6: Show combined total spending
- [ ] AC7: Filter by member
- [ ] AC8: Filter by date range (max 12 months)
- [ ] AC9: LRU cache eviction at 50K records

**Technical Notes**:
- This is the most complex story - includes all caching infrastructure
- Query strategy: parallel queries per member, then merge

---

### Story 14c.6: Transaction Ownership Indicators (3 pts)

**Goal**: User can distinguish their transactions from others'.

**User Story**:
As a group member,
I want to see who added each transaction,
so that I know whose spending I'm looking at.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Group Mode**: Transaction cards with:
  - Profile indicator (colored circle with initial) in bottom-left for others' transactions
  - "View only" badge in top-right for others' transactions
  - No indicator on user's own transactions (fully editable)

**Acceptance Criteria**:
- [ ] AC1: Profile icon (avatar) in bottom-left corner of transaction cards
- [ ] AC2: Only shown for non-current-user transactions
- [ ] AC3: Tapping others' transactions opens view-only detail
- [ ] AC4: View-only mode: no edit capability, clear visual indicator
- [ ] AC5: My transactions remain fully editable

---

### Story 14c.7: Tag Transactions to Groups (3 pts)

**Goal**: User can add/remove transactions from shared groups.

**User Story**:
As a user with shared groups,
I want to tag my transactions to specific groups,
so that relevant expenses appear in group views.

**Acceptance Criteria**:
- [ ] AC1: Custom group selector in Edit view
- [ ] AC2: Multi-select up to 5 groups
- [ ] AC3: Existing custom groups shown (non-shared = personal only)
- [ ] AC4: Shared groups shown with member indicator
- [ ] AC5: Save updates `sharedGroupIds[]` on transaction

---

### Story 14c.8: Auto-Tag on Scan (2 pts)

**Goal**: New scanned receipts auto-tag to active group.

**User Story**:
As a user scanning in group view mode,
I want new transactions auto-tagged to the group,
so that I don't have to manually tag each one.

**Acceptance Criteria**:
- [ ] AC1: When in group view mode, new scans pre-tagged to active group
- [ ] AC2: User can remove tag before saving
- [ ] AC3: Works for both single and batch scans
- [ ] AC4: Indicator showing "Will be shared to [Group Name]"

---

### Story 14c.9: Shared Group Analytics (5 pts)

**Goal**: User can see analytics for shared group spending.

**User Story**:
As a group member,
I want to see spending analytics for the group,
so that I understand our collective spending patterns.

**Acceptance Criteria**:
- [ ] AC1: Polygon visualization for group categories
- [ ] AC2: Sparkline trends for group spending
- [ ] AC3: Sunburst/treemap for group breakdown
- [ ] AC4: Per-member contribution breakdown
- [ ] AC5: Insights scoped to group data
- [ ] AC6: All existing analytics components work in group mode

---

### Story 14c.10: Empty States & Loading (2 pts)

**Goal**: User sees appropriate feedback during loading.

**User Story**:
As a user viewing shared groups,
I want clear feedback during loading,
so that I know the app is working.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Groups (Empty)**: Empty state with icon, message, and "Create Group" CTA

**Acceptance Criteria**:
- [ ] AC1: Skeleton UI while IndexedDB hydrates
- [ ] AC2: Loading indicator during multi-member query
- [ ] AC3: Empty state for group with no transactions
- [ ] AC4: Empty state for new group with no members yet
- [ ] AC5: "Invite members" prompt for empty groups

---

### Story 14c.11: Error Handling (2 pts)

**Goal**: User sees clear errors for failed operations.

**User Story**:
As a user,
I want clear error messages,
so that I know what went wrong and how to fix it.

**UX Reference**: `docs/uxui/mockups/01_views/shared-groups.html`
- **Error States**: Card-based error components with:
  - Circular icon container with semantic color (error-light, warning-light, etc.)
  - SVG icons (X circle, clock, users, wifi)
  - Colored title + secondary description
  - Action buttons (Try Again, Request New Link, Retry/Cancel)
  - Follows app component patterns from TransactionConflictDialog, ScanError

**Acceptance Criteria**:
- [ ] AC1: Invalid share code error with retry option
- [ ] AC2: Expired share code error with "ask owner for new link"
- [ ] AC3: Group full error (10 members max)
- [ ] AC4: Network error with offline mode fallback
- [ ] AC5: IndexedDB quota exceeded with cleanup prompt

---

## Dependencies

### External
- `@tanstack/react-query` - Already installed (Story 14.29)
- `nanoid` - For share code generation
- `idb` - For IndexedDB wrapper (or use native API)

### Internal
- Story 14.29 (React Query Migration) - ✅ COMPLETE
- Firestore security rules update required

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Security rules complexity | High | Test in emulator before production |
| Cross-user query performance | Medium | Delta sync + IndexedDB caching |
| Cache consistency | Medium | `memberUpdates` timestamp invalidation |
| IndexedDB browser support | Low | Fallback to React Query in-memory |

---

## Success Metrics

- Groups created: >100 in first month
- Average members per group: 2.5+
- Shared transactions per group: >50/month
- User retention (group users vs solo): +20%

---

## UX Mockups

**Reference Mockup**: `docs/uxui/mockups/01_views/shared-groups.html`

All UX for Epic 14C is documented in the shared-groups mockup with theme switching (professional/mono/ninokuni), dark mode support, and font options.

### Mockup States → Stories Mapping

| Mockup State | Story | Description |
|--------------|-------|-------------|
| **Personal Mode** | 14c.4 | Home screen with tappable G logo in header |
| **Logo Dropdown** | 14c.4 | Group selector dropdown from logo tap |
| **Groups (Empty)** | 14c.1, 14c.10 | Settings > Groups with empty state |
| **Groups (Filled)** | 14c.1, 14c.3 | Settings > Groups with groups list + pending invitations |
| **Share Code Display** | 14c.1 | Share code, copy button, member list |
| **Join Confirmation** | 14c.2 | Deep link landing page with group preview |
| **Group Mode** | 14c.5, 14c.6 | Shared transactions view with profile indicators |
| **Make Shareable Dialog** | 14c.1 | Modal to convert custom group to shared |
| **Error States** | 14c.11 | Invalid code, expired, full, network errors |

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-07 | Epic created with 10-story structure | Claude Code |
| 2026-01-07 | Marked as UNBLOCKED after Story 14.29 completion | Claude Code |
| 2026-01-15 | Brainstorming session - architecture decisions finalized | Gabe + Winston |
| 2026-01-15 | Reorganized to 11-story user-value structure | Winston (Architect) |
| 2026-01-15 | UX mockup created: `docs/uxui/mockups/01_views/shared-groups.html` | Claude Code |
| 2026-01-15 | Added UX references to all stories with UI components | Claude Code |
| 2026-01-15 | **PIVOT**: Changed from link-based to email-based invitations | Gabe + Claude |
| 2026-01-15 | Story 14c.2 rewritten: "Join via Link" → "Accept/Decline Invitation" | Claude Code |
| 2026-01-15 | Added `PendingInvitation` data model for email invites | Claude Code |
