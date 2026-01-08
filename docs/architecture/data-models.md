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

    // Timestamps
    createdAt: Timestamp;          // Firestore server timestamp (auto-generated)
    updatedAt: Timestamp;          // Firestore server timestamp (auto-updated)
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
*Last Updated: 2026-01-07 (Epic 14 - React Query Migration)*
