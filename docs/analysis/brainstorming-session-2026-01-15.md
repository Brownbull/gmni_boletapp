---
stepsCompleted: [1, 2, 3, 4]
inputDocuments: []
session_topic: 'Epic 14C: Shared Groups - Rearchitecting household sharing to a simpler group-based sharing model'
session_goals: 'Simple sharing model, NoSQL-friendly, minimal permissions, view mode switching'
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Constraint Mapping', 'Question Storming']
ideas_generated: [
  'Shared Custom Groups model',
  'Multi-tag transactions (max 5 groups)',
  'View mode switching via logo icon',
  'Hybrid data architecture (Option 4)',
  'Delta sync with memberUpdates timestamp',
  'IndexedDB caching with React Query',
  'Soft delete for transaction removal',
  'LRU cache eviction at 50K records',
  'memberOfSharedGroups security rule approach',
  'Deep link share codes with 7-day expiry'
]
context_file: 'docs/sprint-artifacts/epic12-13-14-retro-2026-01-15.md'
status: 'COMPLETE'
---

# Brainstorming Session Results

**Facilitator:** Gabe
**Date:** 2026-01-15

## Session Overview

**Topic:** Epic 14C: Shared Groups - Rearchitecting household sharing to a simpler group-based sharing model

**Goals:**
- Simple sharing model (no complex permissions)
- NoSQL/Firebase-friendly data structure
- Minimal permissions overhead
- View mode switching (Personal vs Shared Group)

### Context Guidance

From the Epic 12/13/14 Retrospective:
- Epic 14C was originally scoped as "Household Sharing" (~34 points)
- Needed brainstorming to rethink the sharing model
- Topics identified: Share individual vs all, household model, privacy controls, invitation flow

### Initial Vision (Pre-Brainstorm)

Gabe's simplified concept:
- **Sharing Unit:** Custom Groups (not users/households)
- **What's Shared:** View all transactions in group + Add new transactions
- **Ownership:** Transactions stay owned by original user (read-only to others)
- **Access Control:** Link-based invitation
- **View Modes:** Personal (default) vs Shared Group view (via top-left icon)
- **Analytics:** Re-render based on selected view mode

## Technique Selection

**Approach:** AI-Recommended Techniques
**Analysis Context:** Architecture redesign with focus on simplicity and Firebase constraints

**Recommended Techniques:**

1. **First Principles Thinking:** Strip away assumptions about "sharing" to rebuild from fundamentals
2. **Constraint Mapping:** Map Firebase/Firestore, UX, and existing system constraints
3. **Question Storming:** Generate edge cases and scenarios to stress-test the model

---

## Technique 1: First Principles Thinking

### Core Fundamental Truth

> **"Where is my money going - even when I'm not the one spending it?"**

This is fundamentally about **visibility and awareness across a shared financial pool**, not about collaboration or permission management.

### Key Design Principles Established

| Aspect | Design Decision |
|--------|-----------------|
| **Visibility** | Symmetric - everyone sees everything in the group |
| **Ownership** | Each person owns their own transactions (immutable by others) |
| **Action** | Anyone can ADD their transaction to the group (label it) |
| **Focus** | Spending tracking, not income tracking |
| **Hierarchy** | None - all members are equal peers |

### What We're NOT Building

- No roles (admin, viewer, contributor)
- No permission levels
- No income/budget tracking
- No edit permissions on others' data
- No approval workflows
- No privacy settings per transaction

### What We ARE Building

```
SHARED GROUP = A label that multiple users can tag their transactions with
             + A view mode that shows all transactions with that label
             + Analytics computed on that combined dataset
```

### Multi-Tag Design Decision

Transactions can belong to multiple groups (max 3-5):

```typescript
Transaction {
  ...existing fields...
  sharedGroupIds: string[]  // max 3-5 group IDs
}
```

Custom groups are just *another dimension of filtering* - like categories or merchants, but with the added capability of being **shared across users**.

### View Mode Switching

```
┌─────────────────────────────────────────┐
│  [Logo Icon] ← Changes to group icon    │
│   │                                     │
│   ├── Default: Personal View            │
│   │   (Boletapp logo, default colors)   │
│   │                                     │
│   └── Tap → Select Shared Group         │
│       (Group icon + group color)        │
└─────────────────────────────────────────┘
```

When in "Shared Group View":
- Logo changes to group's icon and color
- ALL screens show filtered data for that group
- Analytics recalculate for group transactions
- Latest transactions = group transactions
- Polygon, charts, insights = all based on group data

---

## Technique 2: Constraint Mapping

### Current Firestore Structure

```
artifacts/{appId}/users/{userId}/
├── transactions/           ← Per-user transactions
├── transaction_groups/     ← Per-user custom groups
└── ...
```

**Current Transaction Model:**
```typescript
Transaction {
  groupId?: string          // Single group reference
  groupName?: string        // Denormalized
  groupColor?: string       // Denormalized
  ...
}
```

**Current Security Rules:**
```javascript
// Strict user isolation
match /artifacts/{appId}/users/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}
```

### Architecture Decision: Option 4 - Hybrid Model

**Selected approach:** Shared Group Document + User Transactions

#### New Data Structures

```typescript
// New top-level collection: sharedGroups/{groupId}
interface SharedGroup {
  id: string;
  ownerId: string;
  name: string;              // May include emoji
  color: string;             // Hex color
  icon: string;              // Icon identifier
  shareCode: string;         // For invite links (long, expiring)
  members: string[];         // Max 10 users, ordered by join date
  memberUpdates: {           // For smart cache invalidation
    [userId: string]: Timestamp;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Updated Transaction model
interface Transaction {
  // ... existing fields
  sharedGroupIds?: string[];  // NEW: Max 5 groups
  deletedAt?: Timestamp;      // NEW: Soft delete support
}
```

#### Why Option 4 (Hybrid)

| Benefit | Description |
|---------|-------------|
| **Firestore-native** | Uses `array-contains` for filtering (standard pattern) |
| **No document size limits** | Group doc stays small (no transaction refs) |
| **Multi-group natural** | `sharedGroupIds: string[]` built for it |
| **Simpler sync** | Tag/untag just updates transaction field |
| **No data duplication** | Transactions stay in user collections |

### Constraints & Limits

```typescript
export const SHARED_GROUP_LIMITS = {
  MAX_MEMBERS: 10,
  MAX_GROUPS_PER_TRANSACTION: 5,
  MAX_SHARED_GROUPS_PER_USER: 5,  // Can only join 5 shared groups
  TRANSACTIONS_PER_MEMBER_QUERY: 50,
  MAX_TIME_RANGE: 12,  // months
};
```

### Query Strategy

For each member, query their transactions:
```typescript
const q = query(
  collection(db, `artifacts/${appId}/users/${memberId}/transactions`),
  where('sharedGroupIds', 'array-contains', groupId),
  orderBy('date', 'desc'),
  limit(50)
);
```

Then merge results client-side.

### Caching Strategy: Approach C - Metadata Listener + On-Demand Fetch

```
┌─────────────────────────────────────────────────────────┐
│  Layer 1: React Query In-Memory Cache                   │
│  - staleTime: 5 minutes                                 │
│  - gcTime: 30 minutes                                   │
├─────────────────────────────────────────────────────────┤
│  Layer 2: IndexedDB Persistent Cache                    │
│  - Survives app close/refresh                           │
│  - Works offline                                        │
│  - Stores transactions + sync metadata                  │
├─────────────────────────────────────────────────────────┤
│  Layer 3: Firestore (Source of Truth)                   │
│  - Only queried for changes since last sync             │
│  - Delta sync: where('updatedAt', '>', lastSync)        │
└─────────────────────────────────────────────────────────┘
```

**Invalidation Trigger:** `group.memberUpdates[userId]` timestamp changes

**Delta Sync Flow:**
1. First load: Full fetch (expensive, one-time)
2. Subsequent loads: Only fetch `updatedAt > lastSyncTimestamp`
3. Real-time: Listen to group doc, invalidate on `memberUpdates` change

### Data Fetching by View

```typescript
const SHARED_GROUP_DATA_STRATEGY = {
  HOME_VIEW: {
    timeRange: 'currentMonth',
    limitPerMember: 100,
  },
  INSIGHTS_VIEW: {
    timeRange: 'last90Days',
    limitPerMember: 150,
  },
  HISTORY_VIEW: {
    timeRange: 'last12Months',
    paginated: true,
    pageSize: 50,
  },
  ANALYTICS_VIEW: {
    timeRange: 'last12Months',
    limitPerMember: null,  // No count limit
    hardCap: 1000,         // Safety cap per member
  },
};
```

### Security Rules (Conceptual)

```javascript
// Shared groups - members can read, owner can write
match /sharedGroups/{groupId} {
  allow read: if request.auth.uid in resource.data.members;
  allow create: if request.auth.uid == request.resource.data.ownerId;
  allow update, delete: if request.auth.uid == resource.data.ownerId;
}

// User transactions - allow shared group members to read
match /artifacts/{appId}/users/{userId}/transactions/{txId} {
  allow read, write: if request.auth.uid == userId;
  allow read: if isSharedGroupMember(resource.data.sharedGroupIds);
}
```

---

## Technique 3: Question Storming

### Decisions Made

#### Category 1: Data & Sync Edge Cases

| Question | Decision |
|----------|----------|
| User removed from group - cached data? | Depends on leave mode: Soft leave = transactions remain; Hard leave = transactions removed on next update |
| Transaction ages out of 12-month window? | Cache cleanup - no transactions older than 12 months in shared groups |
| Device offline 30 days, stale cache? | Full update on reconnect - first load longer/costly, then up to date |

#### Category 2: Membership & Access

| Question | Decision |
|----------|----------|
| Owner deletes account? | Ownership transfers to next member in array (ordered by join date) |
| New user joins via link (never used app)? | Must login via Google first, then after initial setup sees accept/decline screen for group |
| Owner leaving group? | Must transfer ownership first (available in Settings > Custom Groups) or delete group |

#### Category 3: UI/UX Edge Cases

| Question | Decision |
|----------|----------|
| Group has no transactions? | Show group mode with default empty-state messages in all sections |
| Scan receipts in shared group view? | Normal scan flow, but auto-assigns to active custom group. Add custom group selector to Edit view (permanent, works in personal mode too) |
| Distinguish my vs others' transactions? | Profile icon in bottom-left corner of transaction cards for non-current-user transactions. In detail view: icon top-left, view-only mode (no edit) |
| Access settings in shared group view? | Yes, all app views remain same. Only restriction: can only edit own transactions |

#### Category 4: Analytics Edge Cases

| Question | Decision |
|----------|----------|
| Mixed currencies in shared group? | Platform-wide solution: all currencies convert to USD via API (TBD) |
| Insights/celebrations for shared data? | Yes, but only considering transactions in the custom group |

#### Category 5: Security & Privacy

| Question | Decision |
|----------|----------|
| Brute-force share codes? | Mitigated by: max 5 shared groups per user + long expiring codes |
| User leaves group - see cached data? | No - leaving means total exclusion, including historical cached data |

### Technical Decisions - FINALIZED

#### Q27: IndexedDB Full or Disabled - Fallback

**Decision:** Option A + C - React Query in-memory fallback + warning to user

```typescript
const useStorageStrategy = () => {
  const [storageAvailable, setStorageAvailable] = useState<'indexeddb' | 'memory' | null>(null);

  useEffect(() => {
    const checkStorage = async () => {
      try {
        const db = await openDB('test', 1);
        db.close();
        await deleteDB('test');
        setStorageAvailable('indexeddb');
      } catch {
        setStorageAvailable('memory');
        toast.warn('Offline mode unavailable - data will not persist between sessions');
      }
    };
    checkStorage();
  }, []);

  return storageAvailable;
};
```

#### Q28: Maximum Cache Size

**Decision:** Option C - LRU eviction at 50,000 records

```typescript
const CACHE_CONFIG = {
  MAX_RECORDS: 50_000,
  EVICTION_BATCH: 5_000,  // Remove 5K oldest when limit hit
};

const evictOldestRecords = async (db: IDBPDatabase) => {
  const count = await db.count('sharedGroupTransactions');
  if (count > CACHE_CONFIG.MAX_RECORDS) {
    const oldest = await db.getAllFromIndex(
      'sharedGroupTransactions',
      'by-cached-at',
      undefined,
      CACHE_CONFIG.EVICTION_BATCH
    );
    const tx = db.transaction('sharedGroupTransactions', 'readwrite');
    for (const record of oldest) {
      await tx.store.delete(record.id);
    }
  }
};
```

#### Q29: Firestore Security Rules

**Decision:** Option B - store `memberOfSharedGroups` on user profile

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Shared Groups collection
    match /sharedGroups/{groupId} {
      allow read: if request.auth.uid in resource.data.members;
      allow create: if request.auth.uid == request.resource.data.ownerId
                    && request.auth.uid in request.resource.data.members;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }

    // User profile
    match /artifacts/{appId}/users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // User transactions - allow shared group access
    match /artifacts/{appId}/users/{userId}/transactions/{txId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if canReadSharedTransaction(request.auth.uid, resource.data);
    }

    function canReadSharedTransaction(requesterId, txData) {
      let sharedGroupIds = txData.get('sharedGroupIds', []);
      if (sharedGroupIds.size() == 0) {
        return false;
      }

      let requesterProfile = get(/databases/$(database)/documents/artifacts/$(appId)/users/$(requesterId));
      let requesterGroups = requesterProfile.data.get('memberOfSharedGroups', []);

      return sharedGroupIds[0] in requesterGroups
          || (sharedGroupIds.size() > 1 && sharedGroupIds[1] in requesterGroups)
          || (sharedGroupIds.size() > 2 && sharedGroupIds[2] in requesterGroups)
          || (sharedGroupIds.size() > 3 && sharedGroupIds[3] in requesterGroups)
          || (sharedGroupIds.size() > 4 && sharedGroupIds[4] in requesterGroups);
    }
  }
}
```

**Profile update on join/leave:**
```typescript
// When user joins a group
await updateDoc(userProfileRef, {
  memberOfSharedGroups: arrayUnion(groupId)
});

// When user leaves a group
await updateDoc(userProfileRef, {
  memberOfSharedGroups: arrayRemove(groupId)
});
```

#### Q30: Share Link Deep Linking

**Decision:** Firebase Hosting rewrite + React Router + sessionStorage for pending invites

**Share code generation:**
```typescript
const generateShareCode = () => {
  const code = nanoid(16);  // 16-char alphanumeric
  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
  );
  return { code, expiresAt };
};
```

**Firebase Hosting config:**
```json
// firebase.json
{
  "hosting": {
    "rewrites": [
      {
        "source": "/join/**",
        "destination": "/index.html"
      }
    ]
  }
}
```

**Deep link flow:**
```
1. Owner clicks "Share" in Settings > Custom Groups > [Group]
2. App generates: https://boletapp.web.app/join/{shareCode}
3. Owner shares link via WhatsApp/SMS/etc.

4. Recipient clicks link:
   ├── If logged in:
   │   └── Show "Join [Group Name]?" confirmation screen
   │       └── On accept: Add to group, redirect to home in group view
   │
   └── If not logged in:
       └── Store shareCode in sessionStorage
       └── Redirect to login
       └── After login + setup: Show "Join [Group Name]?" confirmation
```

**React Router handling:**
```typescript
// Route
<Route path="/join/:shareCode" element={<JoinGroupPage />} />

// JoinGroupPage component
const JoinGroupPage = () => {
  const { shareCode } = useParams();
  const { user } = useAuth();

  const { data: group } = useQuery({
    queryKey: ['sharedGroup', 'byCode', shareCode],
    queryFn: () => findGroupByShareCode(shareCode),
    enabled: !!shareCode && !!user,
  });

  if (!user) {
    sessionStorage.setItem('pendingShareCode', shareCode);
    return <Navigate to="/login" />;
  }

  if (group?.members.includes(user.uid)) {
    return <AlreadyMemberView group={group} />;
  }

  if (group?.members.length >= 10) {
    return <GroupFullView />;
  }

  return <JoinConfirmationView group={group} shareCode={shareCode} />;
};
```

---

## Summary: Final Architecture

### Data Model

```typescript
// sharedGroups/{groupId}
interface SharedGroup {
  id: string;
  ownerId: string;
  name: string;
  color: string;
  icon: string;
  shareCode: string;
  shareCodeExpiresAt: Timestamp;
  members: string[];  // Max 10, ordered by join date
  memberUpdates: { [userId: string]: Timestamp };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// On user profile (for security rules)
interface UserProfile {
  // ...existing fields
  memberOfSharedGroups: string[];  // For security rule checks
}

// Updated Transaction
interface Transaction {
  // ...existing fields
  sharedGroupIds?: string[];  // Max 5
  deletedAt?: Timestamp;      // Soft delete
}
```

### Key Architectural Decisions

| Aspect | Decision |
|--------|----------|
| **Sharing model** | Symmetric visibility, individual ownership |
| **Data architecture** | Option 4: Hybrid (shared group doc + user transactions) |
| **Multi-tag** | Transactions can be in up to 5 shared groups |
| **Max members** | 10 per group |
| **Max groups per user** | 5 shared groups |
| **Caching** | IndexedDB + React Query with delta sync |
| **Invalidation** | `memberUpdates` timestamp on group doc |
| **Time range** | Hard cap at 12 months |
| **Deleted transactions** | Soft delete with `deletedAt` field |
| **Leave group** | Soft (transactions stay) or Hard (transactions removed) - user choice |
| **Owner leaves** | Must transfer ownership or delete group |
| **Currency handling** | Platform-wide USD conversion (TBD) |
| **View mode** | Logo icon changes to group icon/color |
| **Scanning in group mode** | Auto-tags to active group |
| **Other user's transactions** | View-only with profile icon indicator |

### Remaining Open Items

1. **Currency conversion API** - research options (platform-wide feature, can be separate epic)

---

## Next Steps

1. **Create Epic 14C stories** based on these decisions
2. **Architecture review** with Architect agent to validate security rules approach
3. **UX mockups** for:
   - View mode switcher (logo icon in top-left)
   - Shared group transaction cards (profile icon indicator)
   - Transaction detail view-only mode
   - Join group confirmation screen
   - Settings > Custom Groups > Share flow
4. **Security rules prototype** - test in Firebase emulator

---

## Implementation Story Candidates

Based on this brainstorming session, here are potential stories for Epic 14C:

### Foundation Stories
1. **Data model updates** - Add `sharedGroupIds`, `deletedAt` to Transaction; create SharedGroup type
2. **Firestore security rules** - Implement shared group access rules with `memberOfSharedGroups`
3. **User profile updates** - Add `memberOfSharedGroups` field, sync on join/leave

### Core Features
4. **Create shared group** - Convert existing custom group to shared, generate share code
5. **Join group via link** - Deep link handling, confirmation flow
6. **Leave group** - Soft/hard leave options, ownership transfer
7. **View mode switcher** - Logo icon tap → group selector → filter all views

### Data & Caching
8. **Shared group data fetching** - Query per member, merge client-side
9. **IndexedDB caching layer** - Persistent cache with sync metadata
10. **Delta sync implementation** - `memberUpdates` listener, incremental fetches
11. **LRU cache eviction** - 50K record limit with cleanup

### UI/UX
12. **Transaction card indicators** - Profile icon for other users' transactions
13. **View-only transaction detail** - Read-only mode for others' transactions
14. **Custom group selector in Edit view** - Tag transactions to groups
15. **Auto-tag on scan** - In group view, new scans auto-tagged
16. **Empty state for shared groups** - Default messages when no transactions

### Analytics
17. **Shared group analytics** - Polygon, sparkline, sunburst for group data
18. **Shared group insights** - Celebrations/insights scoped to group

---

*Generated by BMAD Brainstorming Workflow*
*Session Date: 2026-01-15*
*Status: COMPLETE - All technical decisions finalized*
