---
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - docs/architecture/epic-14d-requirements-and-concerns.md
  - docs/analysis/brainstorming-session-2026-01-20.md
  - docs/architecture/shared-group-sync-v2.md
lastUpdated: 2026-01-22
---

# Gastify - Epic 14d: Shared Groups v2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Epic 14d (Shared Groups v2), decomposing the requirements from the architecture document, brainstorming session, and lessons learned from Epic 14c into implementable stories.

**Context:** Epic 14c attempted real-time sync for shared group transactions and failed due to:
1. Delta sync cannot detect transaction removals (label changes)
2. Complex multi-layer caching got out of sync
3. Cost explosion from fallback full-refetch strategies
4. Multiple iteration approaches caused more harm than one committed approach

Epic 14d rebuilds with explicit constraints, user-controlled sync, and server-side change tracking.

### Key Architecture: Layered Visibility Model (Brainstorm 2026-01-22)

Epic 14d implements a **layered visibility model** that separates statistics (always shared) from transactions (conditionally shared):

```
┌─────────────────────────────────────────────────────────────────┐
│  STATISTICS (Always On)                                         │
│  - byCategory, byMember, totals, insights                       │
│  - All members' transactions contribute (anonymized)            │
│  - Non-negotiable part of group membership                      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TRANSACTIONS (Double-Gated)                                    │
│  - Gate 1: Group owner enables transactionSharingEnabled        │
│  - Gate 2: Each user opts in shareMyTransactions per group      │
│  - Both gates must be TRUE to see a user's transactions         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

This model provides:
- **Privacy control**: Users choose whether to share transaction details
- **Accurate statistics**: All members contribute to aggregates regardless of sharing preference
- **Simple mental model**: Stats = always on, Transactions = opt-in

## Requirements Inventory

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Users can tag personal transactions with shared group labels | Must Have |
| FR-2 | All group members can view transactions tagged with their group | Must Have |
| FR-3 | When transaction owner removes group label, all members stop seeing it | Must Have |
| FR-4 | When transaction is edited, all members see updated data | Must Have |
| FR-5 | When transaction is deleted, all members stop seeing it | Must Have |
| FR-6 | Users can manually trigger sync of recent transactions (90 days) | Must Have |
| FR-7 | Users can manually trigger full sync of historical transactions (2 years) | Must Have |
| FR-8 | Visual indicator shows when sync is pending (badge/dot) | Must Have |
| FR-9 | Sync buttons have cooldown to prevent abuse | Must Have |
| FR-10 | Analytics show spending by category (no merchant names) | Must Have |
| FR-11 | Analytics show spending by group member | Must Have |
| FR-12 | Analytics support weekly, monthly, quarterly, yearly views | Must Have |
| FR-13 | Analytics are computed server-side, not client-side | Must Have |
| FR-14 | Analytics recalculate within 1 hour of transaction changes | Must Have |
| FR-15 | Group owner can force immediate analytics recalculation | Should Have |
| FR-16 | All members see countdown to next analytics refresh | Should Have |
| FR-17 | Users receive push notifications when transactions affect their groups | Must Have |
| FR-18 | Notification triggers badge indicator, not automatic sync | Must Have |

#### Transaction Sharing Privacy Controls (Brainstorm 2026-01-22)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-19 | Group owner can enable/disable transaction sharing for the group | Must Have |
| FR-20 | Users can opt-in/out of sharing their transactions per group | Must Have |
| FR-21 | Toggle settings have cooldown (5-15 min) and daily limit (3×) | Must Have |
| FR-22 | Statistics always include all members' contributions (anonymized) | Must Have |
| FR-23 | byMember breakdown always visible to group members | Must Have |
| FR-24 | Clear UX communication when changing sharing settings | Must Have |
| FR-25 | Join flow prompts user to opt-in when joining group with sharing enabled | Must Have |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-1 | App open to seeing cached data | < 500ms |
| NFR-2 | 90-day sync completion | < 5 seconds |
| NFR-3 | 2-year sync completion | < 30 seconds |
| NFR-4 | Analytics page load (cached) | < 1 second |
| NFR-5 | Daily reads per active user | < 1,000 |
| NFR-6 | Monthly cost at 1,000 users | < $50 |
| NFR-7 | No unbounded queries (full table scans) | Enforced |
| NFR-8 | Sync correctness after any operation | 100% |
| NFR-9 | Recovery mechanism if sync gets corrupted | Available |
| NFR-10 | Multi-operation test coverage | Required |

### Additional Requirements

#### Business Constraints
- BC-1: Max groups per user: 5
- BC-2: Max contributors per group: 10
- BC-3: Max viewers per group: 200
- BC-4: Transaction history window: 2 years
- BC-5: Beyond 2 years: Blocked (no access to older transactions)

#### Technical Constraints (Firestore)
- TC-1: Reads cost $0.06 per 100K - every query design is a cost decision
- TC-2: Writes cost $0.18 per 100K - server-side triggers add write costs
- TC-3: `array-contains` cannot detect removals - must use explicit removal events
- TC-4: Queries are shallow (no joins) - denormalization required
- TC-5: Listeners maintain open connections - battery/data cost when active
- TC-6: Security rules are per-document - can't query across groups in single call

#### Data Model Constraints
- DM-1: Transaction owner = creator (only creator can edit/delete/change labels)
- DM-2: Ownership is permanent (cannot transfer except account deletion)
- DM-3: Group owner ≠ Transaction owner (different concepts, different permissions)
- DM-4: Group owner cannot remove others' transactions
- DM-5: Account deletion transfers ownership to next registered user
- DM-6: No remaining users = group gets deleted

#### Architecture Decisions (Locked from Brainstorming)
- AD-1: **Single `sharedGroupId` per transaction** (not array) - eliminates `array-contains` limitations
- AD-2: **Changelog as PRIMARY sync source** (not transaction query for normal sync)
- AD-3: **Full transaction data embedded in changelog entries** - 50% cost reduction
- AD-4: Timestamp-based ordering (no syncId) - sufficient for expense data
- AD-5: Poll on app open, no persistent listeners - simplicity, battery savings
- AD-6: Red dot badge only (no count) - simpler state, sufficient UX
- AD-7: Changelog as subcollection (not array) - enables TTL pruning
- AD-8: Soft delete with `deletedAt`, `updatedAt`, `version` fields
- AD-9: 30-day TTL on changelog entries (TTL only, no Cloud Function)
- AD-10: Full fetch for recovery (2-year sync) - handles >30 day offline
- AD-11: Firestore offline persistence enabled - 30-50% read reduction

#### Analytics Architecture
- AA-1: **Immediate** sum/count updates via `FieldValue.increment()`
- AA-2: **30-second debounce** for breakdowns (byCategory, byMember, min/max)
- AA-3: **30-minute cooldown** for median (no incremental formula exists)
- AA-4: Nightly reconciliation catches drift
- AA-5: Pre-computed period fields on transactions
- AA-6: Group-level timezone (not per-user)
- AA-7: No merchant/item names in analytics (privacy)

#### UX Requirements (Research-Validated)
- UX-1: Optimistic updates for writer (instant feedback)
- UX-2: "Last synced: X ago" freshness indicator
- UX-3: Offline banner: "Showing cached data"
- UX-4: Yellow tint for stale data (nice-to-have)

#### Layered Visibility Decisions (Brainstorm 2026-01-22)
- LV-1: Statistics always include ALL members' transactions (anonymized aggregation)
- LV-2: byMember breakdown always visible (core value proposition)
- LV-3: Transaction visibility requires double opt-in (group + user flags)
- LV-4: Changelog always created (filtering at read time for audit trail)
- LV-5: Eventual consistency on opt-out (next sync clears, no purge signals)
- LV-6: Default `shareMyTransactions: false` (privacy-first)
- LV-7: Toggle cooldowns prevent abuse (3×/day, 5-15 min between)
- LV-8: Join flow opt-in prompt when group has transaction sharing enabled

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR-1 | Epic 1 + Epic 2 | Tag transactions with shared group labels |
| FR-2 | Epic 2 | View transactions tagged with group |
| FR-3 | Epic 2 | Label removal syncs to all members |
| FR-4 | Epic 2 | Edits sync to all members |
| FR-5 | Epic 2 | Deletions sync to all members |
| FR-6 | Epic 2 | Manual 90-day sync |
| FR-7 | Epic 2 | Manual 2-year full sync |
| FR-8 | Epic 2 | Pending sync badge indicator |
| FR-9 | Epic 2 | Sync button cooldowns |
| FR-10 | Epic 3 | Analytics by category |
| FR-11 | Epic 3 | Analytics by member |
| FR-12 | Epic 3 | Weekly/monthly/quarterly/yearly views |
| FR-13 | Epic 3 | Server-side computation |
| FR-14 | Epic 3 | Recalculate within 1 hour |
| FR-15 | Epic 3 | Owner force recalculation |
| FR-16 | Epic 3 | Countdown to refresh |
| FR-17 | Epic 4 | Push notifications |
| FR-18 | Epic 4 | Notification triggers badge |
| FR-19 | Epic 1 | Group owner transaction sharing toggle |
| FR-20 | Epic 1 | User per-group transaction sharing toggle |
| FR-21 | Epic 1 | Toggle cooldowns and daily limits |
| FR-22 | Epic 3 | Statistics include all members |
| FR-23 | Epic 3 | byMember always visible |
| FR-24 | Epic 1 | Clear UX for sharing settings |
| FR-25 | Epic 1 | Join flow opt-in prompt |

## Epic List

### Epic 1: Data Model & Group Foundation (From Scratch)

**User Outcome:** Users can create shared groups, invite members, and the system has the new data structures that enable reliable sync.

**Approach:** Rebuild from scratch with new data model, cleaning up all legacy Epic 14c shared groups code.

**FRs covered:** Foundation for FR-1 through FR-5 (transaction sync prerequisites)

**Key deliverables:**
- **Cleanup:** Remove all legacy Epic 14c shared group code (hooks, services, components, cloud functions)
- **Transaction type:** Updated with `sharedGroupId` (single nullable string), `deletedAt`, `updatedAt`, `version`, `periods` fields
- **Group CRUD:** Create, edit, delete shared groups with new data model
- **Membership:** Invite by email/link, accept/decline, leave group, ownership transfer
- **Changelog subcollection:** `/groups/{groupId}/changelog/{changeId}` structure
- **Cloud Function triggers:** Write changelog entries on transaction add/remove/edit/delete
- **Firestore TTL policy:** 30-day auto-delete on changelog entries
- **Firestore offline persistence:** Enable for 30-50% read reduction
- **Security rules:** Changelog (read: member, create: member, update/delete: forbidden)
- **View mode switcher:** Switch between Personal and Group views (restored from 14c concept)

**Estimated points:** ~20 pts

---

### Epic 2: Changelog-Driven Sync

**User Outcome:** Users can reliably sync shared group transactions and see all changes including removals - solving the core Epic 14c bug.

**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-6, FR-7, FR-8, FR-9

**Key deliverables:**
- **Tag transactions:** Users can assign `sharedGroupId` to personal transactions
- **View transactions:** Group members see transactions tagged with their group
- **90-day sync button:** Changelog-driven sync with cooldown (1min ×3, then 15min, resets daily)
- **2-year full sync:** Settings button for recovery/historical data
- **Red dot badge:** Visual indicator when changes are pending
- **Poll on app open:** Query changelog to detect pending changes
- **"Last synced: X ago":** Freshness indicator near sync button
- **Offline banner:** "Showing cached data" when offline
- **Optimistic updates:** Writer sees instant feedback, others use sync button
- **Progress indicator:** "Syncing 24 of 253 changes..."

**Estimated points:** ~30 pts

---

### Epic 3: Server-Side Analytics

**User Outcome:** Users can view accurate spending analytics for their shared groups computed server-side with privacy protection.

**FRs covered:** FR-10, FR-11, FR-12, FR-13, FR-14, FR-15, FR-16

**Key deliverables:**
- **Analytics document structure:** `/groups/{groupId}/analytics/month_YYYY-MM`
- **Immediate updates:** Sum/count via `FieldValue.increment()` in same batch
- **30-second debounce:** For byCategory, byMember, min/max breakdowns
- **30-minute cooldown:** For median calculation (no incremental formula)
- **Nightly reconciliation:** Cloud Function to catch drift and auto-correct
- **Analytics UI - By Category:** Spending breakdown (no merchant names - privacy)
- **Analytics UI - By Member:** Spending per group member
- **Period views:** Weekly, monthly, quarterly, yearly aggregations
- **Owner force-recalculate:** Button with 3x/day limit, 5min cooldown
- **Countdown indicator:** Time until next analytics refresh

**Estimated points:** ~25 pts

---

### Epic 4: Notifications & Engagement

**User Outcome:** Users receive timely notifications about group activity and can stay informed without manual polling.

**FRs covered:** FR-17, FR-18

**Key deliverables:**
- **Push notifications:** When transactions affect user's groups (add/edit/remove)
- **Badge trigger:** Notification triggers red dot badge, NOT automatic sync
- **Notification content:** Summary of change (amount, description, actor)
- **Notification history:** In-app list of recent notifications
- **Notification settings:** User can enable/disable per group

**Estimated points:** ~10 pts

---

## Epic Summary

| Epic | Title | FRs | Points Est. |
|------|-------|-----|-------------|
| **0** | **Architecture Alignment (Pre-requisite)** | ADR-018 | **~3 pts** |
| 1 | Data Model & Group Foundation (From Scratch) | Foundation | ~50 pts (14→18 stories after 1.10 split) |
| 2 | Changelog-Driven Sync | FR-1 to FR-9 | ~45 pts |
| 3 | Server-Side Analytics | FR-10 to FR-16 | ~34 pts |
| 4 | Notifications & Engagement | FR-17 to FR-18 | ~12 pts |

**Total estimated: ~144 points** (updated 2026-02-01 after architecture alignment)

> **Note (2026-02-01):** Story 1.10 was split into 4 sub-stories (1.10a-d) per Epic 14e alignment.
> Story 1.1 estimate reduced from ~5 to ~2-3 pts per legacy inventory verification.
> See [Architecture Alignment Plan](./14d-v2-architecture-alignment-plan.md) for details.

---

## Key Architecture Decisions Summary

The core bug from Epic 14c that this epic solves:

> When Alice removes "Household" tag from her transaction:
> - Alice sees: transaction gone from Household group ✓
> - Bob and Carol see: transaction STILL in Household group ✗ (Epic 14c bug)

**Epic 14d Solution:**
1. **Single `sharedGroupId`** (not array) - eliminates `array-contains` query limitations
2. **Changelog-driven sync** - `TRANSACTION_REMOVED` is an EXPLICIT event
3. **Full transaction data in changelog** - single read per change, 50% cost reduction
4. **User-controlled sync** - manual buttons, no complex auto-sync that gets out of sync

---

## Epic 0: Architecture Alignment (Pre-requisite)

> **Added 2026-02-01:** Per Epic 14e alignment review, this story ensures Epic 14d-v2 follows established Zustand patterns.
> See [Architecture Alignment Plan](./14d-v2-architecture-alignment-plan.md) for decisions.

**Goal:** Align shared groups infrastructure with Epic 14e architecture (ADR-018: Zustand-only state management).

### Story 0: Architecture Alignment (~3 pts)

As a **developer**,
I want **the shared groups feature infrastructure aligned with Epic 14e architecture**,
So that **all Epic 14d-v2 stories can build on consistent Zustand patterns**.

**Acceptance Criteria:**

**Given** the Epic 14e Zustand-only pattern (ADR-018)
**When** Epic 14d-v2 view mode state is implemented
**Then** it uses a Zustand store at `src/shared/stores/useViewModeStore.ts`
**And** follows the same patterns as useNavigationStore

**Given** the feature directory structure from Epic 14e
**When** the shared-groups feature directory is created
**Then** it exists at `src/features/shared-groups/`
**And** includes standard subdirectories: `store/`, `handlers/`, `hooks/`, `components/`, `types.ts`

**Given** existing ViewModeContext consumers in the codebase
**When** the migration is complete
**Then** all consumers use `useViewModeStore` instead
**And** `ViewModeContext.tsx` is deleted
**And** all tests pass

**Story file:** [14d-v2-0-architecture-alignment.md](./stories/14d-v2-0-architecture-alignment.md)

---

## Epic 1: Data Model & Group Foundation (From Scratch)

**Goal:** Users can create shared groups, invite members, and the system has the new data structures that enable reliable sync.

### Story 1.1: Legacy Shared Groups Cleanup

> **Updated 2026-02-01:** Per legacy inventory verification, some files no longer exist. See [14d-v2-legacy-inventory.md](./14d-v2-legacy-inventory.md) for details. Story points reduced from ~5 to ~2-3.

As a **developer**,
I want **all Epic 14c shared group code removed from the codebase**,
So that **we have a clean foundation to build the new architecture without conflicts**.

**Acceptance Criteria:**

**Given** the codebase contains Epic 14c shared group code
**When** this story is completed
**Then** the following are removed:
- `src/hooks/useSharedGroupTransactions.ts` and `useSharedGroupTransactionsV2.ts`
- `src/services/sharedGroupTransactionService.ts`
- `src/lib/sharedGroupCache.ts` (IndexedDB layer)
- `src/components/SharedGroups/*` (all components)
- Cloud Functions related to shared groups (`memberUpdates`, `sharedGroupNotifications`)
- `sharedGroupIds` array field handling in transaction service
- `removedFromGroupIds` field handling
- View mode state in `App.tsx` related to shared groups
- All related tests
**And** the app compiles and runs without shared group features
**And** existing personal transaction functionality is unaffected

---

### Story 1.2: Transaction Type Migration

As a **user**,
I want **my transactions to support sharing with a single group**,
So that **I can tag expenses to shared groups with simpler, more reliable sync**.

**Acceptance Criteria:**

**Given** the Transaction type exists
**When** this story is completed
**Then** the Transaction type includes:
- `sharedGroupId: string | null` (single group, not array)
- `deletedAt: Timestamp | null` (soft delete)
- `deletedBy: string | null` (who deleted)
- `updatedAt: Timestamp` (update on EVERY change)
- `version: number` (optimistic concurrency)
- `periods: { day: string, week: string, month: string, quarter: string, year: string }` (pre-computed)
**And** `sharedGroupIds: string[]` array field is removed
**And** Firestore save/update functions populate `updatedAt` and `periods` automatically
**And** existing transactions without new fields are handled gracefully (default values)

---

### Story 1.3: Changelog Infrastructure

As a **developer**,
I want **a changelog subcollection structure for each group**,
So that **transaction changes can be explicitly tracked for reliable sync**.

**Acceptance Criteria:**

**Given** a shared group exists
**When** this story is completed
**Then** the following structure is defined:
- Path: `/groups/{groupId}/changelog/{changeId}`
- Document schema: `{ type, transactionId, timestamp, actorId, data, summary }`
- Types: `TRANSACTION_ADDED`, `TRANSACTION_MODIFIED`, `TRANSACTION_REMOVED`
**And** Firestore security rules allow:
- Read: group members only
- Create: group members only
- Update/Delete: forbidden (append-only)
**And** TypeScript types are defined for changelog entries
**And** a service function exists to query changelog by timestamp

---

### Story 1.4: Create Shared Group

As a **user**,
I want **to create a new shared expense group**,
So that **I can share expenses with family, roommates, or friends**.

**Acceptance Criteria:**

**Given** I am logged in
**When** I tap "Create Group" and enter a name
**Then** I see a creation flow that includes:
- Group name input
- **Transaction sharing prompt**: "Would you like to allow transaction sharing in this group?" with options:
  - [Yes, allow sharing] (Recommended) - sets `transactionSharingEnabled: true`
  - [No, statistics only] - sets `transactionSharingEnabled: false`
- Helper text explaining: "When enabled, members can choose to share their transaction details. Statistics are always shared."

**Given** I complete group creation
**When** the group is created
**Then** a new group is created with:
- Unique ID
- Name I provided
- Me as owner and first member
- `createdAt` timestamp
- Empty `members` array (just me)
- `timezone` set to my device timezone (IANA format)
- `transactionSharingEnabled` set based on my selection (default recommendation: true)
**And** I see the group in my groups list
**And** business constraint BC-1 is enforced (max 5 groups per user)

**Given** I already have 5 groups
**When** I try to create another group
**Then** I see an error message explaining the limit

---

### Story 1.5: Invite Members to Group

As a **group owner**,
I want **to invite others to my shared group by email or link**,
So that **they can join and see shared transactions**.

**Acceptance Criteria:**

**Given** I am a group owner
**When** I tap "Invite" on my group
**Then** I can:
- Enter an email address to send invitation
- Copy a shareable invite link
**And** the invitation is stored with pending status
**And** business constraint BC-2 is enforced (max 10 contributors)
**And** business constraint BC-3 is enforced (max 200 viewers)

**Given** I invite someone by email
**When** they receive the invitation
**Then** they see the group name and my name as inviter

---

### Story 1.6: Accept/Decline Group Invitation

As a **user**,
I want **to accept or decline group invitations**,
So that **I can join groups I want and ignore ones I don't**.

**Acceptance Criteria:**

**Given** I have a pending group invitation
**When** I open the app
**Then** I see a notification badge indicating pending invitations
**And** I can view the invitation details (group name, inviter)

**Given** I view a pending invitation
**When** I tap "Accept"
**Then** I become a member of the group
**And** the invitation is removed from pending
**And** other group members can see me in the member list

**Given** I view a pending invitation
**When** I tap "Decline"
**Then** the invitation is removed
**And** I do not become a member

**Given** I tap an invite link while not logged in
**When** I log in
**Then** I am prompted to accept/decline the invitation

**Given** I tap an invite link with an invalid share code (not 16-char alphanumeric)
**When** the link is processed
**Then** I see a clear error message: "This invite link is invalid or expired"
**And** I am NOT silently redirected

**And** constraint FR-26 is enforced (user-friendly error for invalid share codes)

---

### Story 1.7: Leave/Manage Group

As a **group member**,
I want **to leave a group or manage membership**,
So that **I can control my group participation**.

**Acceptance Criteria:**

**Given** I am a group member (not owner)
**When** I tap "Leave Group"
**Then** I am removed from the group
**And** my transactions remain in the group (tagged with `sharedGroupId`)
**And** other members still see my past transactions

**Given** I am a group owner
**When** I want to leave
**Then** I must first transfer ownership to another member
**And** after transfer, I can leave as a regular member

**Given** I am the only member of a group
**When** I leave
**Then** the group is deleted
**And** all transactions have `sharedGroupId` set to null (constraint DM-6)

**Given** ownership is transferred to another member
**When** the transfer completes
**Then** the new owner inherits the group's current toggle state:
  - `transactionSharingToggleCountToday` is NOT reset
  - `transactionSharingLastToggleAt` is preserved
  - Cooldown continues from where it was (no reset on transfer)

**Given** I am a group owner
**When** I tap "Delete Group"
**Then** all members are removed
**And** all transactions have `sharedGroupId` set to null
**And** the group is deleted

**Given** a member leaves the group (self or removed by owner)
**When** the Cloud Function processes the membership change
**Then** `TRANSACTION_REMOVED` changelog entries are created for all of that member's transactions
**And** other members' next sync will remove those transactions from their cache
**And** the leaving member's transactions remain tagged with `sharedGroupId` but are inaccessible to the group

**Given** I am a group owner
**When** I edit the group name, icon, or color
**Then** the changes are saved to the group document
**And** all members see the updated appearance on their next sync

**Given** I am NOT the group owner
**When** I view group settings
**Then** I can see name/icon/color but cannot edit them

---

### Story 1.8: Cloud Function - Changelog Writer

As a **system**,
I want **changelog entries automatically created when transactions change**,
So that **all group members can sync changes reliably**.

**Acceptance Criteria:**

**Given** a transaction is assigned to a group (sharedGroupId set)
**When** the transaction is saved
**Then** a `TRANSACTION_ADDED` changelog entry is created containing:
- Full transaction data (per AD-3)
- Timestamp
- Actor ID (user who made the change)

**Given** a transaction in a group is edited
**When** the edit is saved
**Then** a `TRANSACTION_MODIFIED` changelog entry is created with updated data

**Given** a transaction's `sharedGroupId` is changed to null or different group
**When** the change is saved
**Then** a `TRANSACTION_REMOVED` changelog entry is created in the OLD group
**And** if new group, a `TRANSACTION_ADDED` entry is created in the NEW group

**Given** a transaction in a group is deleted
**When** the delete is saved (soft delete via `deletedAt`)
**Then** a `TRANSACTION_REMOVED` changelog entry is created

**And** all changelog writes are batched with the transaction write (atomic)
**And** Cloud Function uses event IDs for idempotency

---

### Story 1.9: Firestore TTL & Offline Persistence

As a **system**,
I want **automatic changelog pruning and offline persistence enabled**,
So that **storage costs are controlled and app works offline**.

**Acceptance Criteria:**

**Given** changelog entries exist
**When** they are older than 30 days
**Then** Firestore TTL policy automatically deletes them

**Given** the app initializes
**When** Firestore is configured
**Then** offline persistence is enabled with `synchronizeTabs: true`
**And** cached data is served on app open (NFR-1: < 500ms)

**Given** a user is offline for >30 days
**When** they come back online
**Then** they are prompted to do a full sync (changelog pruned)

---

### Story 1.10: View Mode Switcher

> **SUPERSEDED (2026-02-01):** This story has been split into 4 sub-stories for Epic 14e Zustand alignment:
> - [14d-v2-1.10a: ViewMode Store Integration](./stories/14d-v2-1-10a-viewmode-store-integration.md)
> - [14d-v2-1.10b: ViewModeSwitcher UI](./stories/14d-v2-1-10b-viewmodeswitcher-ui.md)
> - [14d-v2-1.10c: Header Mode Indicator](./stories/14d-v2-1-10c-header-mode-indicator.md)
> - [14d-v2-1.10d: Data Filtering Integration](./stories/14d-v2-1-10d-data-filtering-integration.md)
>
> See [Architecture Alignment Plan](./14d-v2-architecture-alignment-plan.md) for decisions.

As a **user**,
I want **to switch between Personal and Group views**,
So that **I can see my own transactions or shared group transactions**.

**Acceptance Criteria:**

**Given** I am on the Home screen
**When** I tap the logo/icon in the header
**Then** a group selector appears showing:
- "Personal" option
- List of my groups

**Given** I select a group
**When** the view switches
**Then** all views (Home, History, Analytics) filter to show only that group's data
**And** the header indicates which view mode I'm in
**And** a visual indicator shows the active group

**Given** I select "Personal"
**When** the view switches
**Then** all views show only my personal transactions (no `sharedGroupId` filter)

---

### Story 1.11: Transaction Sharing Toggle (Group Level)

As a **group owner**,
I want **to enable or disable transaction sharing for my group**,
So that **I can control whether members can see each other's transaction details**.

**Acceptance Criteria:**

**Given** I am a group owner
**When** I go to Group Settings
**Then** I see a toggle: "Allow Transaction Sharing"
**And** it shows the current state (enabled/disabled)
**And** helper text explains: "When enabled, members can choose to share their transaction details with the group."

**Given** I toggle the setting
**When** the change is saved
**Then** `transactionSharingEnabled` is updated on the group document
**And** `transactionSharingLastToggleAt` is set to now
**And** `transactionSharingToggleCountToday` is incremented

**Given** I try to toggle again within 15 minutes
**When** I tap the toggle
**Then** I see: "Please wait X minutes before changing this setting"

**Given** I have toggled 3 times today
**When** I try to toggle again
**Then** I see: "Daily limit reached. Try again tomorrow."

**Given** it's a new day (midnight local)
**When** I try to toggle
**Then** my daily count has reset and I can toggle again

**And** constraint FR-19 is enforced
**And** constraint FR-21 is enforced (15 min cooldown, 3×/day limit)
**And** constraint FR-24 is enforced (clear UX communication)

**Note:** Group owner can enable/disable transaction sharing for the group, but CANNOT override individual members' `shareMyTransactions` preference. The double-gate model ensures each user retains control over their own transaction visibility.

---

### Story 1.12: User Transaction Sharing Preference

As a **group member**,
I want **to choose whether to share my transaction details with the group**,
So that **I can contribute to statistics while keeping my spending details private**.

**Acceptance Criteria:**

**Given** I am a member of a group with `transactionSharingEnabled: true`
**When** I go to Group Settings > My Sharing Preferences
**Then** I see a toggle: "Share My Transactions"
**And** helper text explains: "Your spending totals always appear in group statistics. This controls whether others see your individual transaction details."

**Given** `transactionSharingEnabled` is false for the group
**When** I view My Sharing Preferences
**Then** the toggle is disabled with text: "Transaction sharing is disabled for this group by the owner"

**Given** I toggle `shareMyTransactions` to true
**When** the change is saved
**Then** my preference is stored at `/users/{userId}/preferences/sharedGroups`
**And** `lastToggleAt` is updated
**And** `toggleCountToday` is incremented
**And** other members will see my transactions on their next sync

**Given** I toggle `shareMyTransactions` to false
**When** the change is saved
**Then** my preference is updated
**And** I see: "Your future transactions won't be shared. Existing cached data on other devices will be cleared on their next sync."

**Given** I try to toggle again within 5 minutes
**When** I tap the toggle
**Then** I see: "Please wait X minutes before changing this setting"

**Given** I have toggled 3 times today
**When** I try to toggle again
**Then** I see: "Daily limit reached. Try again tomorrow."

**And** constraint FR-20 is enforced
**And** constraint FR-21 is enforced (5 min cooldown, 3×/day limit)
**And** constraint LV-5 is enforced (eventual consistency, no purge signals)
**And** constraint LV-6 is enforced (default: false)

---

### Story 1.13: User Group Preferences Document

As a **system**,
I want **a user preferences document for per-group settings**,
So that **each user's sharing preferences are stored and retrievable**.

**Acceptance Criteria:**

**Given** a user is a member of shared groups
**When** they have group-specific preferences
**Then** preferences are stored at: `/users/{userId}/preferences/sharedGroups`

**And** the document structure is:
```typescript
{
  groupPreferences: {
    [groupId: string]: {
      shareMyTransactions: boolean;          // default: false
      lastToggleAt: Timestamp | null;
      toggleCountToday: number;
      toggleCountResetAt: Timestamp | null;
    }
  }
}
```

**Given** a user joins a new group
**When** no preference exists
**Then** `shareMyTransactions` defaults to `false` (constraint LV-6)

**Given** a user leaves a group
**When** the leave is processed
**Then** their preference entry for that group is deleted (cleanup)

**And** Firestore security rules allow:
- Read: owner only (`userId == request.auth.uid`)
- Write: owner only

---

### Story 1.14: Join Flow Transaction Sharing Opt-In

As a **user joining a group**,
I want **to be prompted about transaction sharing when I join**,
So that **I can make an informed choice about sharing my transaction details**.

**Acceptance Criteria:**

**Given** I accept a group invitation
**When** the group has `transactionSharingEnabled: true`
**Then** before completing the join, I see a dialog:
  - Title: "[Group Name] allows transaction sharing"
  - Body: "Would you like to share your transaction details with group members? Your spending totals will always be visible in group statistics."
  - Options: [Yes, share my transactions] [No, just statistics]

**Given** I tap "Yes, share my transactions"
**When** the join completes
**Then** `shareMyTransactions` is set to `true` for this group
**And** I see confirmation: "You're now a member of [Group Name]"

**Given** I tap "No, just statistics"
**When** the join completes
**Then** `shareMyTransactions` is set to `false` for this group
**And** I see confirmation: "You're now a member of [Group Name]. You can change sharing preferences in group settings."

**Given** the group has `transactionSharingEnabled: false`
**When** I accept the invitation
**Then** I do NOT see the transaction sharing prompt
**And** I join directly with `shareMyTransactions: false`

**Given** I dismiss the dialog without choosing
**When** the join completes
**Then** `shareMyTransactions` defaults to `false` (privacy-first)

**And** constraint FR-25 is enforced
**And** constraint LV-6 is enforced (default: false)
**And** constraint LV-8 is enforced (prompt on join)

---

**Epic 1 Summary:** 14 stories, ~47 points estimated

---

## Epic 2: Changelog-Driven Sync

**Goal:** Users can reliably sync shared group transactions and see all changes including removals - solving the core Epic 14c bug.

### Story 2.1: Tag Transaction to Group

As a **user**,
I want **to assign my transaction to a shared group**,
So that **group members can see my expense in the shared view**.

**Acceptance Criteria:**

**Given** I am editing a transaction I own
**When** I tap the "Shared Group" field
**Then** I see a list of groups I belong to
**And** I can select one group (or none)

**Given** I select a group and save
**When** the transaction is saved
**Then** `sharedGroupId` is set to the selected group ID
**And** a `TRANSACTION_ADDED` changelog entry is created (via Story 1.8)
**And** I see the group label on my transaction

**Given** I change the group from A to B
**When** I save
**Then** `TRANSACTION_REMOVED` is written to group A's changelog
**And** `TRANSACTION_ADDED` is written to group B's changelog

**Given** I remove the group (set to none)
**When** I save
**Then** `sharedGroupId` is set to null
**And** `TRANSACTION_REMOVED` is written to the old group's changelog

---

### Story 2.2: View Group Transactions (Double-Gate Visibility)

As a **group member**,
I want **to see transactions based on sharing permissions**,
So that **I can track shared expenses while respecting privacy settings**.

**Acceptance Criteria:**

**Given** I am in Group view mode (from Story 1.10)
**And** `transactionSharingEnabled` is `false` for the group
**When** the Home/History view loads
**Then** I see ONLY my own transactions tagged with this group
**And** I see a notice: "Transaction sharing is disabled for this group"
**And** I can still view group statistics (Story 3.6, 3.7)

**Given** `transactionSharingEnabled` is `true` for the group
**When** the Home/History view loads
**Then** I see:
  - My own transactions (always)
  - Transactions from members who have `shareMyTransactions: true`
**And** transactions from members with `shareMyTransactions: false` are NOT shown
**And** each transaction shows the owner's profile icon (constraint DM-3)
**And** transactions I don't own are read-only

**Given** the local cache is empty for this group
**When** I view the group
**Then** I see an empty state prompting me to sync
**And** a sync button is prominently displayed

**Given** I view a transaction owned by someone else
**When** I tap on it
**Then** I see the transaction details in read-only mode
**And** I cannot edit any fields (constraint DM-1)

**And** constraint LV-3 is enforced (double-gate visibility)

---

### Story 2.3: 90-Day Changelog Sync

As a **group member**,
I want **to sync recent changes from the changelog**,
So that **I see all additions, edits, and removals from the last 90 days**.

**Acceptance Criteria:**

**Given** I tap the sync button in Group view
**When** the sync starts
**Then** I see a progress indicator ("Syncing...")

**Given** the sync is running
**When** changelog entries are fetched
**Then** query: `changelog WHERE timestamp > lastSyncTime LIMIT 10,000`
**And** entries are processed IN TIMESTAMP ORDER:
- `TRANSACTION_ADDED` → add `entry.data` to local cache
- `TRANSACTION_MODIFIED` → update `entry.data` in local cache
- `TRANSACTION_REMOVED` → delete `transactionId` from local cache

**Given** sync completes
**When** all entries are processed
**Then** `lastSyncTime` is updated to now
**And** the pending changes badge is cleared
**And** I see "Sync complete" confirmation

**Given** there are >10,000 changes
**When** sync runs
**Then** I see a message suggesting full sync instead
**And** I can choose to continue with partial sync or do full sync

**And** NFR-2 is met: 90-day sync completes < 5 seconds

---

### Story 2.4: Sync Button with Cooldown

As a **user**,
I want **a sync button with smart cooldown**,
So that **I can refresh data without abusing the system**.

**Acceptance Criteria:**

**Given** I am in Group view
**When** I look at the sync button
**Then** I see a sync icon (refresh icon)
**And** if changes are pending, there's a red dot badge

**Given** I tap sync
**When** the sync completes
**Then** a 1-minute cooldown starts
**And** the button shows countdown or is disabled

**Given** I tap sync 3 times within the cooldown period
**When** the 3rd sync completes
**Then** cooldown increases to 15 minutes

**Given** it's a new day (midnight local time)
**When** I open the app
**Then** cooldown counter resets to initial state (1min ×3)

**And** constraint FR-9 is enforced

---

### Story 2.5: Pending Changes Badge

As a **user**,
I want **a visual indicator when my group has pending changes**,
So that **I know when to sync**.

**Acceptance Criteria:**

**Given** I open the app
**When** the app initializes
**Then** it polls each group's changelog: `WHERE timestamp > lastSyncTime LIMIT 1`
**And** no persistent listeners are used (AD-5)

**Given** a group has changes since my last sync
**When** the poll completes
**Then** a red dot badge appears on the sync button for that group
**And** the group shows a badge in the view mode switcher

**Given** I sync the group
**When** sync completes
**Then** the red dot badge is removed

**And** constraint AD-6 is enforced (red dot only, no count)

---

### Story 2.6: Full 2-Year Recovery Sync

As a **user**,
I want **to do a full sync of all historical transactions**,
So that **I can recover from corrupted cache or sync after long offline period**.

**Acceptance Criteria:**

**Given** I go to Settings > Shared Groups > [Group Name]
**When** I tap "Full Sync (Recovery)"
**Then** I see a warning: "This will reload all transactions for the last 2 years"

**Given** I confirm full sync
**When** the sync runs
**Then** query: `transactions WHERE sharedGroupId == groupId AND deletedAt == null AND date >= (now - 2 years)`
**And** the ENTIRE local cache for this group is REPLACED (not merged)
**And** `lastSyncTime` is updated to now

**Given** full sync completes
**When** I return to Group view
**Then** I see the complete transaction history
**And** any previously corrupted data is fixed

**And** NFR-3 is met: 2-year sync completes < 30 seconds
**And** constraint BC-4 is enforced (2-year history window)

---

### Story 2.7: Freshness Indicator

As a **user**,
I want **to see when I last synced**,
So that **I know if my data might be stale**.

**Acceptance Criteria:**

**Given** I am in Group view
**When** I look near the sync button
**Then** I see "Last synced: X ago" where X is:
- "Just now" (< 1 minute)
- "2 minutes ago" (< 1 hour, show minutes)
- "1 hour ago" (< 24 hours, show hours)
- "Yesterday" (< 48 hours)
- "3 days ago" (show days)

**Given** I have never synced this group
**When** I view the freshness indicator
**Then** I see "Never synced"

**And** constraint UX-2 is enforced

---

### Story 2.8: Offline Banner

As a **user**,
I want **to know when I'm viewing cached data while offline**,
So that **I understand my data might not be current**.

**Acceptance Criteria:**

**Given** I am offline (no network connection)
**When** I am in Group view
**Then** I see a banner: "Offline - Showing cached data"
**And** the sync button is disabled with "Offline" label

**Given** I come back online
**When** the connection is restored
**Then** the banner disappears
**And** the sync button is re-enabled

**Given** I am offline
**When** I try to sync
**Then** I see an error: "Cannot sync while offline"

**And** constraint UX-3 is enforced

---

### Story 2.9: Optimistic Updates for Writer

As a **transaction owner**,
I want **to see my changes instantly**,
So that **I get immediate feedback when adding or editing expenses**.

**Acceptance Criteria:**

**Given** I add a new transaction to a group
**When** I tap Save
**Then** the transaction appears IMMEDIATELY in my local view (optimistic)
**And** a subtle "Saving..." indicator shows
**And** the Firestore write happens in the background

**Given** the Firestore write succeeds
**When** confirmation is received
**Then** a subtle checkmark indicator shows briefly
**And** the optimistic update is confirmed

**Given** the Firestore write fails
**When** the error is received
**Then** the optimistic update is ROLLED BACK
**And** the transaction disappears from the list
**And** I see an error toast: "Failed to save. Please try again."

**And** constraint UX-1 is enforced
**And** this only applies to the WRITER - other group members still use manual sync

---

### Story 2.10: Multi-Operation Sync Tests

As a **developer**,
I want **comprehensive tests for sequential sync operations**,
So that **the Epic 14c "works first time, fails second" bug cannot recur**.

**Acceptance Criteria:**

**Given** the test suite runs
**When** multi-operation scenarios are tested
**Then** the following sequences pass:

1. **Add → Remove → Add same transaction:**
   - Alice adds tx to group
   - Bob syncs (sees tx)
   - Alice removes tx from group
   - Bob syncs (tx disappears)
   - Alice adds tx back to group
   - Bob syncs (sees tx again)

2. **Edit → Edit → Edit:**
   - Alice adds tx ($50)
   - Bob syncs
   - Alice edits to $75
   - Bob syncs (sees $75)
   - Alice edits to $100
   - Bob syncs (sees $100)

3. **Multiple users, interleaved operations:**
   - Alice adds tx1
   - Bob adds tx2
   - Carol syncs (sees both)
   - Alice removes tx1
   - Bob edits tx2
   - Carol syncs (tx1 gone, tx2 updated)

4. **Offline → Online recovery:**
   - Alice adds tx while online
   - Bob is offline for 2 days
   - Alice removes tx
   - Bob comes online and syncs
   - Bob should NOT see tx

**And** NFR-8 is enforced: 100% sync correctness
**And** NFR-10 is enforced: multi-operation test coverage required

---

### Story 2.11: Cloud Function - Transaction Visibility Filtering

As a **system**,
I want **the getSharedGroupTransactions Cloud Function to respect sharing preferences**,
So that **transaction visibility follows the double-gate model**.

**Acceptance Criteria:**

**Given** a user requests group transactions via Cloud Function
**When** `transactionSharingEnabled` is `false` for the group
**Then** return ONLY the requesting user's own transactions for that group

**Given** `transactionSharingEnabled` is `true` for the group
**When** the Cloud Function processes the request
**Then** for each group member:
  - If member == requesting user → include their transactions
  - If member has `shareMyTransactions: true` → include their transactions
  - If member has `shareMyTransactions: false` or undefined → exclude their transactions

**Given** the function returns transactions
**When** the client receives the response
**Then** the response includes ownership information for UI display

**And** constraint LV-3 is enforced (double-gate)
**And** constraint LV-4 is enforced (changelog still created for all, filtering at read)

---

### Story 2.12: Transaction Sharing Disabled Empty State

As a **group member**,
I want **clear feedback when transaction sharing is disabled**,
So that **I understand why I can only see my own transactions**.

**Acceptance Criteria:**

**Given** I am in Group view
**And** `transactionSharingEnabled` is `false`
**When** I view the transactions list
**Then** I see a banner/notice: "Transaction sharing is disabled for this group. You can view your own transactions and group statistics."

**Given** I am the group owner
**And** `transactionSharingEnabled` is `false`
**When** I view the transactions list
**Then** the banner includes: "Enable transaction sharing in group settings to let members share transactions."

**Given** transaction sharing becomes enabled
**When** I refresh/sync
**Then** the banner disappears
**And** I see transactions based on individual member preferences

**Given** I have cached transactions from other members
**And** the group owner changes `transactionSharingEnabled` from `true` to `false`
**When** I perform a sync
**Then** the Cloud Function returns only my own transactions (per double-gate logic)
**And** my local cache is updated to remove other members' transactions
**And** I see the "Transaction sharing is disabled" banner
**And** eventual consistency applies (cache cleared on next sync, no immediate purge)

**And** constraint FR-24 is enforced (clear UX communication)
**And** constraint LV-5 is enforced (eventual consistency)

---

**Epic 2 Summary:** 12 stories, ~45 points estimated

---

## Epic 3: Server-Side Analytics

**Goal:** Users can view accurate spending analytics for their shared groups computed server-side with privacy protection.

### Story 3.1: Analytics Document Structure

As a **developer**,
I want **a well-defined Firestore structure for group analytics**,
So that **analytics can be stored and queried efficiently**.

**Acceptance Criteria:**

**Given** a shared group exists
**When** analytics are computed
**Then** documents are stored at `/groups/{groupId}/analytics/{periodType}_{period}`
- Example: `/groups/abc123/analytics/month_2026-01`

**And** each document contains:
- `period`: string (e.g., "2026-01", "2026-W04", "2026-Q1", "2026")
- `periodType`: "week" | "month" | "quarter" | "year"
- `metrics`: { totalSpent, totalIncome, netBalance, transactionCount }
- `byCategory`: Record<string, number> (e.g., { food: 5000, transport: 3000 })
- `byCategoryGroup`: Record<string, number> (e.g., { essentials: 8000 })
- `byMember`: Record<string, number> (e.g., { user1Id: 8000 })
- `insights`: { highestTransaction, lowestTransaction, averageTransaction, medianTransaction }
- `lastUpdated`: Timestamp
- `needsMedianRecalc`: boolean

**And** TypeScript types are defined
**And** security rules allow read for group members only
**And** constraint AA-7 is enforced: no merchant/item names stored

---

### Story 3.2: Immediate Sum/Count Updates

As a **system**,
I want **sum and count metrics updated immediately on transaction changes**,
So that **basic analytics are always current**.

**Acceptance Criteria:**

**Given** a transaction is added to a group
**When** the Cloud Function trigger fires
**Then** in the SAME batch write:
- `metrics.totalSpent` incremented by transaction amount (if expense)
- `metrics.totalIncome` incremented by transaction amount (if income)
- `metrics.netBalance` recalculated
- `metrics.transactionCount` incremented by 1
- `lastUpdated` set to now
- `needsMedianRecalc` set to true

**Given** a transaction is removed from a group
**When** the Cloud Function trigger fires
**Then** the same fields are DECREMENTED appropriately

**Given** a transaction amount is edited
**When** the Cloud Function trigger fires
**Then** the delta (newAmount - oldAmount) is applied

**And** constraint AA-1 is enforced: use `FieldValue.increment()`
**And** updates affect ALL relevant periods (day, week, month, quarter, year)

---

### Story 3.3: Debounced Breakdown Calculation

As a **system**,
I want **category and member breakdowns calculated with a 30-second debounce**,
So that **detailed analytics are updated efficiently without excessive computation**.

**Acceptance Criteria:**

**Given** a transaction change affects a group
**When** the Cloud Function trigger fires
**Then** a Cloud Task is enqueued with 30-second delay
**And** if a task already exists for this group+period, it is NOT duplicated

**Given** the 30-second delay expires
**When** the Cloud Task executes
**Then** the following are recalculated for affected periods:
- `byCategory`: sum per category
- `byCategoryGroup`: sum per category group
- `byMember`: sum per member
- `insights.highestTransaction`: max amount
- `insights.lowestTransaction`: min amount (non-zero)
- `insights.averageTransaction`: total / count

**And** constraint AA-2 is enforced: 30-second debounce
**And** `needsMedianRecalc` remains true (median calculated separately)

---

### Story 3.4: Median Calculation with Cooldown

As a **system**,
I want **median calculated with a 30-minute cooldown**,
So that **expensive full-scan calculations are batched efficiently**.

**Acceptance Criteria:**

**Given** `needsMedianRecalc` is true for a period
**When** the first transaction change occurs
**Then** a 30-minute timer starts for that group+period

**Given** additional changes occur within the 30-minute window
**When** the timer is checked
**Then** NO new timer is started (existing timer continues)

**Given** the 30-minute timer expires
**When** the scheduled function runs
**Then** median is calculated by:
1. Query all transactions for the period
2. Sort amounts
3. Calculate median (middle value or average of two middle values)
4. Update `insights.medianTransaction`
5. Set `needsMedianRecalc` to false

**And** constraint AA-3 is enforced: 30-minute cooldown
**And** median is null until first calculation completes

---

### Story 3.5: Nightly Reconciliation

As a **system**,
I want **a nightly job that reconciles all analytics**,
So that **any drift from incremental updates is automatically corrected**.

**Acceptance Criteria:**

**Given** it is 2:00 AM (group's timezone)
**When** the scheduled Cloud Function runs
**Then** for each active group:
1. Query all transactions for current month
2. Recalculate ALL metrics from scratch
3. Compare with stored values
4. If different, update stored values
5. Log any discrepancies found

**Given** discrepancies are found
**When** they are corrected
**Then** a log entry is created showing before/after values

**And** constraint AA-4 is enforced: nightly reconciliation catches drift
**And** the job completes within reasonable time (< 5 minutes per group)

---

### Story 3.6: Analytics UI - By Category

As a **group member**,
I want **to see spending breakdown by category**,
So that **I understand where group money is going**.

**Acceptance Criteria:**

**Given** I am in Group view > Analytics
**When** I view the category breakdown
**Then** I see a chart/list showing:
- Each category with total amount
- Percentage of total spending
- Visual representation (bar/pie chart)

**And** NO merchant names are shown (constraint AA-7)
**And** NO item descriptions are shown (privacy)
**And** categories are sorted by amount (highest first)

**Given** I tap on a category
**When** the detail view opens
**Then** I see the transaction count for that category
**And** I do NOT see individual transactions (privacy)

**And** constraint FR-10 is enforced

---

### Story 3.7: Analytics UI - By Member

As a **group member**,
I want **to see spending breakdown by member**,
So that **I understand who is contributing to group expenses**.

**Acceptance Criteria:**

**Given** I am in Group view > Analytics
**When** I view the member breakdown
**Then** I see a chart/list showing:
- Each member's name/avatar
- Total amount spent by that member
- Percentage of total group spending
- Transaction count per member

**And** members are sorted by amount (highest first)
**And** my own contribution is highlighted

**Given** a member has left the group
**When** their historical transactions exist
**Then** they still appear in analytics with "(Left)" indicator

**Given** `transactionSharingEnabled` is `false` for the group
**When** I view byMember analytics
**Then** I STILL see the full byMember breakdown (all members' spending totals)
**And** this is visible regardless of transaction sharing settings

**Note:** byMember breakdown is ALWAYS visible as part of core group statistics (per FR-23 and LV-1). Only individual transaction details are gated by sharing preferences.

**And** constraint FR-11 is enforced
**And** constraint FR-23 is enforced (byMember always visible)

---

### Story 3.8: Period Views

As a **group member**,
I want **to view analytics for different time periods**,
So that **I can analyze spending trends over time**.

**Acceptance Criteria:**

**Given** I am in Group view > Analytics
**When** I select a period type
**Then** I can choose from:
- Weekly (current week, previous weeks)
- Monthly (current month, previous months)
- Quarterly (current quarter, previous quarters)
- Yearly (current year, previous years)

**Given** I select a specific period (e.g., "January 2026")
**When** the analytics load
**Then** all metrics, categories, and member breakdowns reflect that period
**And** data loads from cache first (NFR-4: < 1 second)

**Given** I navigate between periods
**When** I swipe or tap arrows
**Then** the view smoothly transitions to adjacent period

**And** constraint FR-12 is enforced
**And** constraint AA-5 is enforced: pre-computed period fields enable efficient queries

---

### Story 3.9: Owner Force Recalculate

As a **group owner**,
I want **to force an immediate analytics recalculation**,
So that **I can see accurate data without waiting for scheduled updates**.

**Acceptance Criteria:**

**Given** I am the group owner
**When** I go to Group Settings > Analytics
**Then** I see a "Force Recalculate" button

**Given** I tap "Force Recalculate"
**When** I haven't used it recently
**Then** a full recalculation starts immediately
**And** I see a progress indicator
**And** the button enters cooldown (5 minutes)

**Given** I tap "Force Recalculate"
**When** I've already used it 3 times today
**Then** I see a message: "Daily limit reached. Try again tomorrow."

**Given** recalculation completes
**When** I view analytics
**Then** all metrics are freshly calculated including median

**And** constraint FR-15 is enforced
**And** limit: 3x per day, 5-minute cooldown between uses

---

### Story 3.10: Refresh Countdown Indicator

As a **group member**,
I want **to see when analytics will next refresh**,
So that **I know if I'm viewing potentially stale data**.

**Acceptance Criteria:**

**Given** I am viewing group analytics
**When** I look at the header/footer
**Then** I see "Last updated: X ago"
**And** if `needsMedianRecalc` is true, I see "Median updating in: Y minutes"

**Given** analytics were updated < 1 hour ago
**When** I view the indicator
**Then** I see relative time: "5 minutes ago", "30 minutes ago"

**Given** analytics were updated > 1 hour ago
**When** I view the indicator
**Then** I see: "1 hour ago", "Yesterday", etc.

**Given** a recalculation is in progress
**When** I view the indicator
**Then** I see "Updating..." with a spinner

**And** constraint FR-16 is enforced

---

**Epic 3 Summary:** 10 stories, ~34 points estimated

---

## Epic 4: Notifications & Engagement

**Goal:** Users receive timely notifications about group activity and can stay informed without manual polling.

### Story 4.1: Push Notification Infrastructure

As a **system**,
I want **to send push notifications when transactions affect a group**,
So that **group members know when new expenses are added or changed**.

**Acceptance Criteria:**

**Given** a transaction is added to a group
**When** the changelog Cloud Function fires
**Then** a push notification is sent to all OTHER group members (not the actor)
**And** the notification payload includes:
- `type`: "TRANSACTION_ADDED" | "TRANSACTION_MODIFIED" | "TRANSACTION_REMOVED"
- `groupId`: the affected group
- `transactionId`: the affected transaction
- `actorName`: display name of who made the change

**Given** a transaction is edited in a group
**When** the changelog Cloud Function fires
**Then** a push notification is sent with type "TRANSACTION_MODIFIED"

**Given** a transaction is removed from a group
**When** the changelog Cloud Function fires
**Then** a push notification is sent with type "TRANSACTION_REMOVED"

**Given** the actor has `shareMyTransactions: false`
**When** they add/edit/remove a transaction
**Then** notifications are STILL sent to group members
**And** notification shows activity occurred (e.g., "[Actor] added an expense")
**And** this is consistent with statistics always reflecting all members' contributions

**Note:** Notifications are sent regardless of transaction sharing preferences. Users know activity is happening even if they can't see transaction details. This aligns with the "statistics always on" principle - if Bob can see Alice's spending total in byMember, knowing she added an expense doesn't leak additional information.

**And** constraint FR-17 is enforced
**And** notifications are NOT sent to the user who made the change

---

### Story 4.2: Notification Content & Formatting

As a **group member**,
I want **clear notification content about group changes**,
So that **I understand what changed without opening the app**.

**Acceptance Criteria:**

**Given** a TRANSACTION_ADDED notification arrives
**When** I view the notification
**Then** I see:
- Title: "[Group Name]"
- Body: "[Actor] added $[amount]: [description]"
- Example: "Alice added $45.50: Groceries"

**Given** a TRANSACTION_MODIFIED notification arrives
**When** I view the notification
**Then** I see:
- Title: "[Group Name]"
- Body: "[Actor] updated: [description]"

**Given** a TRANSACTION_REMOVED notification arrives
**When** I view the notification
**Then** I see:
- Title: "[Group Name]"
- Body: "[Actor] removed: [description]"

**And** notifications are localized to user's language
**And** amounts use user's preferred currency format

---

### Story 4.3: Badge Trigger on Notification

As a **user**,
I want **notifications to trigger a badge indicator, not automatic sync**,
So that **I control when my data updates and avoid unexpected data usage**.

**Acceptance Criteria:**

**Given** I receive a push notification for a group
**When** the notification is received (app open or closed)
**Then** the red dot badge appears on:
- The sync button for that group
- The group in the view mode switcher

**And** NO automatic sync is triggered
**And** I must manually tap sync to see the changes

**Given** I receive a notification while the app is open
**When** I'm viewing that group
**Then** I see a subtle toast: "New changes available - tap sync"

**Given** I receive a notification while the app is closed
**When** I tap the notification
**Then** the app opens to that group's view
**And** the sync button shows the red dot badge

**And** constraint FR-18 is enforced

---

### Story 4.4: Notification History View

As a **user**,
I want **to see a history of recent group notifications**,
So that **I can review what changed even if I missed the push notification**.

**Acceptance Criteria:**

**Given** I navigate to Settings > Notifications
**When** I view the notification history
**Then** I see a list of recent notifications (last 30 days)
**And** each entry shows:
- Group name
- Change type icon (add/edit/remove)
- Actor name
- Brief description
- Relative time ("2 hours ago")

**Given** I tap on a notification entry
**When** the detail opens
**Then** I see full notification details
**And** I can navigate to that group's view

**Given** I have no notifications
**When** I view the history
**Then** I see an empty state: "No recent notifications"

**And** notifications are stored locally (not in Firestore)
**And** history is limited to 100 most recent entries

---

### Story 4.5: Notification Settings

As a **user**,
I want **to control which group notifications I receive**,
So that **I'm not overwhelmed by notifications from active groups**.

**Acceptance Criteria:**

**Given** I go to Settings > Notifications
**When** I view notification settings
**Then** I see:
- Global toggle: "Enable push notifications"
- Per-group toggles for each group I belong to

**Given** I disable notifications for a specific group
**When** changes happen in that group
**Then** I do NOT receive push notifications
**And** the red dot badge still appears on app open (polling still works)

**Given** I disable all push notifications
**When** any group change happens
**Then** I receive NO push notifications
**And** badges still work via polling on app open

**Given** I re-enable notifications for a group
**When** future changes happen
**Then** I receive push notifications again

**And** settings are persisted to Firestore (user preferences)

---

**Epic 4 Summary:** 5 stories, ~12 points estimated

---

## Final Summary

### Total Stories by Epic

| Epic | Title | Stories | Points |
|------|-------|---------|--------|
| 1 | Data Model & Group Foundation | 14 | ~47 |
| 2 | Changelog-Driven Sync | 12 | ~45 |
| 3 | Server-Side Analytics | 10 | ~34 |
| 4 | Notifications & Engagement | 5 | ~12 |
| **Total** | | **41 stories** | **~138 points** |

### FR Coverage Verification

| FR | Covered By | Status |
|----|------------|--------|
| FR-1 | Story 2.1 | ✅ |
| FR-2 | Story 2.2 | ✅ |
| FR-3 | Story 2.3 | ✅ |
| FR-4 | Story 2.3 | ✅ |
| FR-5 | Story 2.3 | ✅ |
| FR-6 | Story 2.3, 2.4 | ✅ |
| FR-7 | Story 2.6 | ✅ |
| FR-8 | Story 2.5 | ✅ |
| FR-9 | Story 2.4 | ✅ |
| FR-10 | Story 3.6 | ✅ |
| FR-11 | Story 3.7 | ✅ |
| FR-12 | Story 3.8 | ✅ |
| FR-13 | Story 3.2, 3.3, 3.4 | ✅ |
| FR-14 | Story 3.3, 3.5 | ✅ |
| FR-15 | Story 3.9 | ✅ |
| FR-16 | Story 3.10 | ✅ |
| FR-17 | Story 4.1 | ✅ |
| FR-18 | Story 4.3 | ✅ |
| FR-19 | Story 1.11 | ✅ |
| FR-20 | Story 1.12 | ✅ |
| FR-21 | Story 1.11, 1.12 | ✅ |
| FR-22 | Story 3.2, 3.7 | ✅ |
| FR-23 | Story 3.7 | ✅ |
| FR-24 | Story 1.11, 1.12, 2.12 | ✅ |
| FR-25 | Story 1.14 | ✅ |
| FR-26 | Story 1.6 | ✅ |

**All 26 Functional Requirements are covered.**

### NFR Coverage Verification

| NFR | Covered By | Status |
|-----|------------|--------|
| NFR-1 | Story 1.9 | ✅ |
| NFR-2 | Story 2.3 | ✅ |
| NFR-3 | Story 2.6 | ✅ |
| NFR-4 | Story 3.8 | ✅ |
| NFR-5 | Architecture decisions | ✅ |
| NFR-6 | Architecture decisions | ✅ |
| NFR-7 | All queries use limits | ✅ |
| NFR-8 | Story 2.10 | ✅ |
| NFR-9 | Story 2.6 | ✅ |
| NFR-10 | Story 2.10 | ✅ |

**All 10 Non-Functional Requirements are covered.**
