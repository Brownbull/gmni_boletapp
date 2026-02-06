# Data Models - Boletapp

## Overview

Boletapp uses Firebase Firestore as its primary database. All data is stored in a hierarchical collection structure that ensures user data isolation and efficient querying.

## Database Architecture

### Collection Path Structure

```
/artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

**Path Parameters:**
- `appId` - Application identifier (default: 'default-app-id' or injected via environment)
- `userId` - Firebase Auth UID (automatically set on user authentication)
- `transactionId` - Auto-generated document ID by Firestore

### Why This Structure?

1. **Multi-tenancy Support** - The `artifacts/{appId}` prefix allows multiple applications to share the same Firebase project
2. **User Isolation** - Each user's data is stored under their unique `userId`
3. **Scalability** - Firestore's hierarchical structure optimizes for per-user queries
4. **Security** - Firestore security rules can easily enforce user-level access control

## Transaction Document Schema

### Complete Document Structure

```typescript
interface Transaction {
    // Required Fields
    id: string;                    // Firestore document ID (auto-generated)
    merchant: string;              // Store/business name (e.g., "Walmart", "Starbucks")
    date: string;                  // ISO 8601 date format: "YYYY-MM-DD"
    total: number;                 // Integer (no decimals) - total amount in smallest currency unit
    category: string;              // Store category from predefined list

    // Optional Fields
    alias?: string;                // User-defined nickname for merchant (e.g., "Coffee" for "Starbucks #4521")
    items?: TransactionItem[];     // Array of individual purchased items

    // Image Storage Fields (Epic 4.5 - added 2025-12-01)
    imageUrls?: string[];          // Full-size image download URLs (Firebase Storage)
    thumbnailUrl?: string;         // Thumbnail download URL (120x160, 70% JPEG quality)

    // Shared Groups (Epic 14d-v2 - added 2026-02-05)
    sharedGroupId?: string | null; // Associated shared group ID (null = personal)
    deletedAt?: Timestamp | null;  // Soft delete timestamp for shared group sync
    deletedBy?: string | null;     // UID of who deleted (audit trail for shared txns)
    version?: number;              // Optimistic concurrency version (starts at 1)
    periods?: TransactionPeriods;  // Pre-computed temporal keys for efficient filtering
    _ownerId?: string;             // Client-side only: set when merging cross-user txns

    // Timestamps
    createdAt: Timestamp;          // Firestore server timestamp (auto-generated)
    updatedAt: Timestamp;          // Firestore server timestamp (auto-updated)
}

// Pre-computed temporal keys (Epic 14d-v2, AD-5)
interface TransactionPeriods {
    day: string;     // "YYYY-MM-DD"
    week: string;    // "YYYY-Www"
    month: string;   // "YYYY-MM"
    quarter: string; // "YYYY-Qn"
    year: string;    // "YYYY"
}

interface TransactionItem {
    name: string;                  // Item description (e.g., "Organic Milk 1L")
    price: number;                 // Integer (no decimals) - item price in smallest currency unit
    category: string;              // Item group category
    subcategory?: string;          // Optional specific item type
}
```

### Field Specifications

#### `id` - Document Identifier
- **Type:** String
- **Source:** Firestore auto-generated document ID
- **Format:** Alphanumeric, 20-28 characters
- **Example:** `"abc123XYZ789def456"`
- **Immutable:** Yes (set once, never changed)

#### `merchant` - Business Name
- **Type:** String
- **Source:** Extracted by Gemini AI or manually entered
- **Validation:** Non-empty string
- **Max Length:** None enforced (recommended: 100 characters)
- **Example:** `"Target Store #1234"`
- **Default:** `"Unknown"` if extraction fails

#### `date` - Transaction Date
- **Type:** String (ISO 8601 format)
- **Format:** `"YYYY-MM-DD"`
- **Validation:** Regex `/^\d{4}-\d{2}-\d{2}$/`
- **Example:** `"2025-11-20"`
- **Default:** Current date if invalid or missing
- **Special Handling:**
  - Firestore Timestamps are converted to ISO strings on read (line 324)
  - Future dates are automatically corrected to today (line 373)
  - Multiple dates in receipt: Gemini selects closest to current date

#### `total` - Total Amount
- **Type:** Number (Integer)
- **Format:** No decimal places, no thousands separators
- **Currency Handling:**
  - CLP (Chilean Peso): Stored as-is (e.g., 15000 = $15,000 CLP)
  - USD (US Dollar): Stored in cents (e.g., 1599 = $15.99 USD)
- **Parsing:** Strips all non-numeric characters via `parseStrictNumber()` (lines 79-83)
- **Example:** `45600` (CLP) or `1299` (USD cents)
- **Validation:** Must be >= 0
- **Default:** `0` if parsing fails

#### `category` - Store Category
- **Type:** String (Enum)
- **Allowed Values:** One of the following predefined categories:
  - `Supermarket` - Grocery stores
  - `Restaurant` - Dining establishments
  - `Bakery` - Bread and pastry shops
  - `Butcher` - Meat markets
  - `Bazaar` - General goods markets
  - `Veterinary` - Animal healthcare
  - `PetShop` - Pet supplies
  - `Medical` - Healthcare services
  - `Pharmacy` - Medicine and drugstores
  - `Technology` - Electronics and gadgets
  - `StreetVendor` - Mobile/street merchants
  - `Transport` - Transportation services
  - `Services` - General services
  - `Other` - Uncategorized
- **Source:** Gemini AI classification or user selection
- **Default:** `"Other"` if not specified
- **UI Component:** Dropdown select (line 548)

#### `alias` - Merchant Nickname
- **Type:** String (Optional)
- **Purpose:** Group transactions from different locations of same merchant
- **Example:**
  - Merchant: `"Starbucks Store #4521"`
  - Alias: `"Coffee"`
- **Auto-complete:** Suggests previously used aliases (lines 548, 332-333)
- **Default:** Empty string or merchant name if not set

#### `items` - Line Items
- **Type:** Array of `TransactionItem` objects (Optional)
- **Source:** Extracted by Gemini AI from receipt image
- **Default:** Empty array `[]`
- **Usage:** Enables granular spending analysis by item category

#### `createdAt` - Creation Timestamp
- **Type:** Firestore Timestamp
- **Source:** `serverTimestamp()` function (line 397)
- **Format:** Firestore internal format (converted to Date on client)
- **Immutability:** Set once on document creation
- **Purpose:** Track when transaction was first added

#### `updatedAt` - Last Modified Timestamp
- **Type:** Firestore Timestamp
- **Source:** `serverTimestamp()` function (line 396)
- **Format:** Firestore internal format (converted to Date on client)
- **Auto-updated:** Yes, on every write operation
- **Purpose:** Track last modification for sync/conflict resolution

### TransactionItem Sub-Schema

#### `name` - Item Description
- **Type:** String
- **Source:** Gemini AI extraction or manual entry
- **Example:** `"Organic Whole Milk 1L"`
- **Validation:** Non-empty string
- **Display:** Shown in transaction detail view

#### `price` - Item Price
- **Type:** Number (Integer)
- **Format:** Same as transaction `total` (no decimals)
- **Parsing:** Uses `parseStrictNumber()` (line 326)
- **Validation:** Sum of all item prices may not equal transaction total (due to taxes, discounts)

#### `category` - Item Group
- **Type:** String
- **Common Values:**
  - `Fresh Food` - Produce, meat, dairy
  - `Pantry` - Non-perishable groceries
  - `Drinks` - Beverages
  - `Household` - Cleaning, paper goods
  - `Personal Care` - Toiletries, cosmetics
  - `Pets` - Pet food and supplies
  - `Electronics` - Tech items
  - `Apparel` - Clothing
  - `Other` - Uncategorized items
- **Purpose:** Enables drill-down analytics by item type

#### `subcategory` - Item Subcategory
- **Type:** String (Optional)
- **Purpose:** Granular classification within category
- **Examples:**
  - Category: `Fresh Food`, Subcategory: `Vegetables`
  - Category: `Pantry`, Subcategory: `Canned Goods`
- **Display:** Shown as secondary badge in UI

#### `imageUrls` - Receipt Image URLs (Epic 4.5)
- **Type:** Array of Strings (Optional)
- **Source:** Firebase Storage public URLs returned by `analyzeReceipt` Cloud Function
- **Format:** `https://storage.googleapis.com/{bucket}/users/{userId}/receipts/{transactionId}/image-{index}.jpg`
- **Max Items:** 5 (enforced by Cloud Function validation)
- **Image Specs:**
  - Max dimensions: 1200x1600 pixels
  - Format: JPEG (80% quality)
  - Typical size: 100-200KB per image
- **Example:**
  ```json
  ["https://storage.googleapis.com/boletapp-d609f.appspot.com/users/abc123/receipts/txn456/image-0.jpg"]
  ```
- **Backward Compatibility:** Undefined for transactions created before Epic 4.5
- **Cascade Delete:** Images automatically deleted when transaction is deleted (via `onTransactionDeleted` trigger)

#### `thumbnailUrl` - Thumbnail Image URL (Epic 4.5)
- **Type:** String (Optional)
- **Source:** Firebase Storage public URL generated from first image
- **Format:** `https://storage.googleapis.com/{bucket}/users/{userId}/receipts/{transactionId}/thumbnail.jpg`
- **Image Specs:**
  - Dimensions: 120x160 pixels
  - Format: JPEG (70% quality)
  - Typical size: 5-10KB
- **Purpose:** Fast loading in HistoryView transaction list
- **Example:** `"https://storage.googleapis.com/boletapp-d609f.appspot.com/users/abc123/receipts/txn456/thumbnail.jpg"`
- **Backward Compatibility:** Undefined for transactions created before Epic 4.5

## Data Validation & Sanitization

### Input Sanitization (On Write)

All data is sanitized before saving to Firestore:

1. **Numbers:** `parseStrictNumber()` strips all non-numeric characters (line 79-83)
   - Input: `"$1,234.56"` → Output: `123456`
   - Input: `"42.99"` → Output: `4299`
   - Input: `"invalid"` → Output: `0`

2. **Dates:** `getSafeDate()` ensures valid ISO format (line 85-90)
   - Input: Firestore Timestamp → Output: `"YYYY-MM-DD"`
   - Input: Invalid string → Output: Today's date
   - Input: Future date → Output: Today's date (line 373)

3. **Strings:** Trimmed and validated
   - Empty merchant names → `"Unknown"`
   - Null/undefined → Default values

### Data Repair (On Read)

The app includes automatic repair logic in the Firestore listener (lines 320-328):

```javascript
const docs = snap.docs.map(d => {
    const data = d.data();
    return {
        id: d.id,
        ...data,
        date: getSafeDate(data.date),              // Fix corrupted dates
        total: parseStrictNumber(data.total),      // Fix malformed numbers
        items: Array.isArray(data.items)           // Ensure items is always an array
            ? data.items.map(i => ({
                ...i,
                price: parseStrictNumber(i.price)  // Fix item prices
              }))
            : []
    };
});
```

This ensures the app never crashes due to malformed data.

## Data Flow

### Write Path (Creating/Updating Transaction)

1. **User Action** → Scans receipt or creates manual entry
2. **Gemini API** → Returns raw JSON data
3. **Sanitization** → `parseStrictNumber()` and `getSafeDate()` clean data
4. **State Update** → `currentTransaction` state updated
5. **Save** → `saveTransaction()` writes to Firestore (lines 393-402)
6. **Timestamp** → `serverTimestamp()` adds `createdAt` / `updatedAt`

### Read Path (Loading Transactions)

1. **Auth** → User signs in, `userId` available
2. **Subscribe** → `onSnapshot()` creates real-time listener (line 318)
3. **Transform** → Data repair applied to each document (lines 320-328)
4. **Sort** → Documents sorted by date descending (line 329)
5. **State Update** → `setTransactions()` triggers re-render

## Query Patterns

### Fetch All User Transactions

```javascript
const q = collection(
    services.db,
    'artifacts', services.appId,
    'users', user.uid,
    'transactions'
);
onSnapshot(q, (snap) => { /* ... */ });
```

**Performance:** Efficient for <10,000 transactions per user. No indexing required.

### Delete Transaction

```javascript
await deleteDoc(doc(
    services.db,
    'artifacts', services.appId,
    'users', user.uid,
    'transactions', transactionId
));
```

### Update Transaction

```javascript
const ref = doc(
    services.db,
    'artifacts', services.appId,
    'users', user.uid,
    'transactions', transactionId
);
await updateDoc(ref, updatedFields);
```

## Indexes

**No custom indexes required.** All queries are simple collection reads scoped by user ID.

## Data Constraints

### Enforced by Application Logic

- `total` and `price` values are always integers (no decimals)
- `date` is always in `YYYY-MM-DD` format
- `category` is always one of the predefined values
- `items` is always an array (never null/undefined)

### Not Enforced (Client-Side Only)

- Maximum transaction amount
- Maximum number of items per transaction
- Merchant name format/length
- Item name uniqueness

## Security Rules

### Firestore Security Rules

Firestore security rules enforce user-level access control:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/{appId}/users/{userId}/transactions/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Rule Breakdown:**
- `request.auth != null` - User must be authenticated
- `request.auth.uid == userId` - User can only access their own data
- `{document=**}` - Rule applies to all subdocuments (if any exist)

### Firebase Storage Security Rules (Epic 4.5)

Storage rules enforce user-level access for receipt images:

```text
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // User isolation: Each user can only access their own receipt images
    // Path structure: users/{userId}/receipts/{transactionId}/{filename}
    match /users/{userId}/receipts/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Deny all other paths by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Rule Breakdown:**
- User can only read/write files under their own `users/{userId}/` path
- `{allPaths=**}` allows nested paths (e.g., `receipts/txn123/image-0.jpg`)
- Default deny for any path not explicitly matched

**Storage Path Structure:**
```
users/{userId}/receipts/{transactionId}/
├── image-0.jpg        (full-size, max 1200x1600)
├── image-1.jpg        (optional, for multi-page receipts)
├── image-2.jpg        (optional, max 5 images)
└── thumbnail.jpg      (120x160 thumbnail)
```

## Data Migration

### Schema Changes

Since there's no migration system, schema changes must be backward-compatible:

1. **Add new fields** - Use optional properties with defaults
2. **Remove fields** - Leave old data intact (app ignores unknown fields)
3. **Change field types** - Use sanitization functions to handle old formats

### Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0 | 2025-11-20 | Initial schema with all fields documented |
| v2.0 | 2025-12-01 | Epic 4.5: Added `imageUrls`, `thumbnailUrl` fields, Firebase Storage rules |
| v3.0 | 2026-02-05 | Epic 14d-v2: Added `sharedGroupId`, `deletedAt`, `deletedBy`, `version`, `periods` to Transaction. Expanded SharedGroup/PendingInvitation. Added Changelog subcollection, UserGroupPreferences. |

---

---

## New Collections (Epic 14+)

### User Credits Collection

**Path:** `/artifacts/{appId}/users/{userId}/credits`

Tracks user credit balance for scanning operations.

```typescript
interface UserCredits {
    balance: number;           // Current credit balance
    updatedAt: Timestamp;      // Last update time
}
```

### Category Mappings Collection

**Path:** `/artifacts/{appId}/users/{userId}/categoryMappings`

Stores learned category associations for merchants.

```typescript
interface CategoryMapping {
    id: string;
    merchant: string;          // Merchant name pattern
    category: string;          // Assigned category
    createdAt: Timestamp;
}
```

### Merchant Mappings Collection

**Path:** `/artifacts/{appId}/users/{userId}/merchantMappings`

Stores merchant name aliases.

```typescript
interface MerchantMapping {
    id: string;
    originalName: string;      // As detected from receipt
    displayName: string;       // User's preferred name
    createdAt: Timestamp;
}
```

### Subcategory Mappings Collection

**Path:** `/artifacts/{appId}/users/{userId}/subcategoryMappings`

Stores item subcategory classifications.

```typescript
interface SubcategoryMapping {
    id: string;
    itemName: string;          // Item name pattern
    subcategory: string;       // Assigned subcategory
    createdAt: Timestamp;
}
```

### Groups Collection

**Path:** `/artifacts/{appId}/users/{userId}/groups`

Stores user-defined transaction groups (e.g., trips).

```typescript
interface Group {
    id: string;
    name: string;              // Group name
    description?: string;      // Optional description
    createdAt: Timestamp;
}
```

### Trusted Merchants Collection

**Path:** `/artifacts/{appId}/users/{userId}/trustedMerchants`

Merchants marked for automatic trust (skip review).

```typescript
interface TrustedMerchant {
    id: string;
    merchantName: string;      // Merchant name
    createdAt: Timestamp;
}
```

---

## Top-Level Collections (Epic 14d-v2: Shared Groups)

> **Note:** These collections are at the Firestore root level (NOT under `/artifacts/{appId}/users/{userId}/`) to enable cross-user access for shared household features.

### Shared Groups Collection

**Path:** `/sharedGroups/{groupId}`

Stores shared household groups that multiple users can access.

```typescript
interface SharedGroup {
    id: string;                    // Firestore document ID
    appId: string;                 // Application identifier
    name: string;                  // Group display name (e.g., "Smith Family")
    description?: string;          // Optional description
    color: string;                 // Group color (hex or named)
    icon?: string;                 // Optional emoji icon
    ownerId: string;               // UID of group creator/owner
    members: string[];             // Array of member UIDs (includes owner)
    memberProfiles?: Record<string, MemberProfile>; // Public profile info per member
    memberUpdates?: Record<string, MemberUpdate>;   // Sync state per member
    shareCode: string;             // 6-char invite code (required)
    shareCodeExpiresAt: Timestamp; // Code expiration (required)
    timezone: string;              // Group timezone
    transactionSharingEnabled: boolean; // Group-level sharing toggle
    transactionSharingLastToggleAt?: Timestamp;
    transactionSharingToggleCountToday?: number;
    transactionSharingToggleCountResetAt?: Timestamp;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

interface MemberProfile {
    displayName?: string;
    email?: string;
    photoURL?: string;
}

interface MemberUpdate {
    lastSyncAt: Timestamp;
    unreadCount?: number;
}

interface SharedGroupMember {
    id: string;
    displayName: string;
    email: string;
    photoURL?: string;
    role: 'owner' | 'member';
    joinedAt: Timestamp;
}
```

**Field Specifications:**

| Field | Type | Description |
|-------|------|-------------|
| `appId` | string | Application identifier for multi-tenancy |
| `ownerId` | string | Firebase Auth UID of the group creator. Only owner can delete or modify group settings. |
| `members` | string[] | Array of Firebase Auth UIDs. Max 10 contributors, 200 viewers. |
| `shareCode` | string | 6-character alphanumeric code for invitations |
| `shareCodeExpiresAt` | Timestamp | When the share code expires (typically 7 days) |
| `transactionSharingEnabled` | boolean | Group-level toggle for transaction sharing |

**Security Rules:**
- **Create:** User must be owner and only member initially
- **Read:** User must be in `members` array
- **Update:** Owner can update anything; non-owners can only add themselves (accepting invite)
- **Delete:** Only owner can delete

### Pending Invitations Collection

**Path:** `/pendingInvitations/{invitationId}`

Stores email-based invitations for users to join shared groups.

```typescript
interface PendingInvitation {
    id: string;                    // Firestore document ID
    groupId: string;               // Reference to sharedGroups document
    groupName: string;             // Denormalized for display
    groupColor: string;            // Denormalized group color
    groupIcon?: string;            // Denormalized group icon
    shareCode: string;             // Share code used for invitation
    invitedEmail: string;          // Lowercase email of invited user
    invitedByUserId: string;       // UID of user who sent invitation
    invitedByName: string;         // Denormalized inviter name (required)
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    createdAt: Timestamp;
    expiresAt: Timestamp;          // Expiration timestamp (required)
}
```

**Field Specifications:**

| Field | Type | Description |
|-------|------|-------------|
| `invitedEmail` | string | Always stored lowercase for case-insensitive matching |
| `status` | enum | `pending` → `accepted` or `declined` (one-way transitions) |
| `groupName` | string | Denormalized to avoid join queries when displaying invitations |

**Security Rules:**
- **Create:** Any authenticated user can create (invitedByUserId must match auth.uid)
- **Read:** Only the invited user can read (email matches auth.token.email)
- **Update:** Invited user can only change `status` field to `accepted` or `declined`
- **Delete:** Not allowed (kept for audit trail)

**Workflow:**
```
1. Owner creates invitation → pendingInvitations document created
2. Invited user logs in → sees invitation in their pending list
3. User accepts → status='accepted', user added to sharedGroups.members
4. User declines → status='declined', invitation remains for audit
```

### Changelog Subcollection (Epic 14d-v2)

**Path:** `/sharedGroups/{groupId}/changelog/{entryId}`

Stores transaction change events for shared group sync. This is the PRIMARY sync mechanism (AD-2/AD-3).

```typescript
type ChangelogEntryType = 'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED';

interface ChangelogEntry {
    id: string;                    // Deterministic: "{eventId}-{changeType}"
    type: ChangelogEntryType;
    transactionId: string;
    timestamp: Timestamp;
    actorId: string;               // UID of user who made the change
    groupId: string;
    data: Transaction | null;      // Full transaction data (null for removals)
    summary: ChangelogSummary;     // For notifications
    _ttl: Timestamp;               // Auto-expire after 30 days
}

interface ChangelogSummary {
    amount: number;
    currency: string;
    description: string;
    category: string;
}
```

**Key Design Decisions:**
- Deterministic IDs enable idempotent retries from Cloud Functions
- 30-day TTL prevents unbounded collection growth
- Written by `onTransactionWrite` and `onMemberRemoved` Cloud Functions
- Clients read changelog for sync, not direct cross-user transaction access

### User Shared Groups Preferences (Epic 14d-v2)

**Path:** `/artifacts/{appId}/users/{userId}/preferences/sharedGroups`

Per-user, per-group sharing controls with rate-limiting.

```typescript
interface UserSharedGroupsPreferences {
    groupPreferences: Record<string, UserGroupPreference>;
}

interface UserGroupPreference {
    shareMyTransactions: boolean;  // Default: false (privacy-first)
    lastToggleAt?: Timestamp;
    toggleCountToday?: number;
    toggleCountResetAt?: Timestamp;
}
```

**Rate Limits (SHARED_GROUP_LIMITS):**

| Limit | Value |
|-------|-------|
| Max contributors per group | 10 |
| Max viewers per group | 200 |
| Transaction sharing cooldown | 15 minutes |
| Transaction sharing daily limit | 3 toggles |
| User sharing cooldown | 5 minutes |
| User sharing daily limit | 3 toggles |

---

## Data Caching (Story 14.29)

### React Query Cache

All Firestore subscriptions are cached using React Query:

**Query Keys:**
```typescript
const QUERY_KEYS = {
    transactions: (userId, appId) => ['transactions', userId, appId],
    categoryMappings: (userId, appId) => ['categoryMappings', userId, appId],
    merchantMappings: (userId, appId) => ['merchantMappings', userId, appId],
    subcategoryMappings: (userId, appId) => ['subcategoryMappings', userId, appId],
    groups: (userId, appId) => ['groups', userId, appId],
    trustedMerchants: (userId, appId) => ['trustedMerchants', userId, appId],
};
```

**Cache Behavior:**
- **staleTime:** 5 minutes (data considered fresh)
- **gcTime:** 30 minutes (cache retained in memory)
- **Instant navigation:** Cached data displays immediately on view return
- **Real-time updates:** Firestore listeners update cache when data changes

**Reference:** `docs/architecture/react-query-caching.md`

---

**Generated by BMAD Document Project Workflow**
*Last Updated: 2026-01-15 (Epic 14c - Household Sharing)*
