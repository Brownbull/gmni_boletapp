# Firebase Standards: Security, Data Modeling & Patterns

## Official Documentation

- **Firestore Best Practices**: https://firebase.google.com/docs/firestore/best-practices
- **Firestore Data Modeling**: https://firebase.google.com/docs/firestore/data-model
- **Security Rules**: https://firebase.google.com/docs/rules
- **Security Rules Testing**: https://firebase.google.com/docs/firestore/security/test-rules-emulator
- **Firebase Emulator**: https://firebase.google.com/docs/emulator-suite
- **Custom Claims (RBAC)**: https://firebase.google.com/docs/auth/admin/custom-claims
- **Cloud Functions**: https://firebase.google.com/docs/functions

## Data Modeling Principles

### Design for Queries, Not Normalization

Firestore is NOT a relational database. Design your schema around how you'll query the data.

```
❌ Relational Thinking:
- "I need to normalize to avoid duplication"
- "I'll join tables at query time"

✅ Firestore Thinking:
- "What queries will my app make?"
- "Duplicate data to avoid joins"
- "Structure for read performance"
```

### Gastify Data Model

```
firestore/
├── artifacts/
│   └── {appId}/
│       └── users/
│           └── {userId}/
│               ├── transactions/
│               │   └── {transactionId}
│               ├── settings/
│               │   └── preferences
│               └── merchants/
│                   └── {merchantId}
│
├── sharedGroups/
│   └── {groupId}
│
└── pendingInvitations/
    └── {invitationId}
```

### Transaction Document

```typescript
// /artifacts/{appId}/users/{userId}/transactions/{transactionId}
interface TransactionDocument {
  // Core fields
  id: string                    // Auto-generated
  merchant: string              // "Líder"
  alias?: string                // User-defined name
  date: string                  // "2025-01-20" (ISO date)
  total: number                 // Integer CLP: 45990
  category: string              // "Supermercado"
  
  // Items (denormalized)
  items: Array<{
    name: string
    price: number               // Integer CLP
    quantity?: number
    category?: string
  }>
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Receipt images (Epic 4.5)
  imageUrls?: string[]          // Firebase Storage URLs
  thumbnailUrl?: string
  
  // Shared groups (Epic 14c)
  sharedGroupIds?: string[]     // Max 5 groups
  
  // Scan metadata
  promptVersion?: string        // "3.0.0"
  merchantSource?: 'scan' | 'manual'
  currency?: string             // "CLP"
  country?: string              // "CL"
}
```

### User Settings Document

```typescript
// /artifacts/{appId}/users/{userId}/settings/preferences
interface UserPreferences {
  language: 'es' | 'en'
  currency: 'CLP' | 'USD' | 'COP' | 'MXN' | 'ARS'
  theme: 'light' | 'dark' | 'system'
  
  notifications: {
    push: boolean
    email: boolean
    weeklyReport: boolean
  }
  
  // Trusted merchants for Quick Save
  trustedMerchants: string[]
  
  updatedAt: Timestamp
}
```

### Shared Group Document

```typescript
// /sharedGroups/{groupId}
interface SharedGroupDocument {
  id: string
  name: string                  // "Casa Familia González"
  description?: string
  
  // Membership
  ownerId: string               // Creator's UID
  memberIds: string[]           // All member UIDs (including owner)
  
  // Roles (optional, for future)
  roles?: Record<string, 'owner' | 'contributor' | 'viewer'>
  
  // Invitation
  shareCode?: string            // For link-based invites
  shareCodeExpiresAt?: Timestamp
  
  // Metadata
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // Limits
  maxMembers: number            // Default: 10
}
```

## Security Rules

### Core Pattern: User Isolation

```javascript
// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidTimestamp(field) {
      return field is timestamp;
    }
    
    // ============================================
    // USER DATA (ISOLATED)
    // ============================================
    
    match /artifacts/{appId}/users/{userId} {
      // User can only access their own data
      allow read, write: if isOwner(userId);
      
      // Transactions subcollection
      match /transactions/{transactionId} {
        allow read: if isOwner(userId);
        
        allow create: if isOwner(userId)
          && request.resource.data.merchant is string
          && request.resource.data.total is number
          && request.resource.data.total > 0
          && request.resource.data.date is string;
        
        allow update: if isOwner(userId)
          && request.resource.data.total > 0;
        
        allow delete: if isOwner(userId);
      }
      
      // Settings subcollection
      match /settings/{document} {
        allow read, write: if isOwner(userId);
      }
      
      // Merchants subcollection
      match /merchants/{merchantId} {
        allow read, write: if isOwner(userId);
      }
    }
    
    // ============================================
    // SHARED GROUPS (CROSS-USER)
    // ============================================
    
    match /sharedGroups/{groupId} {
      function isGroupMember() {
        return isAuthenticated() 
          && request.auth.uid in resource.data.memberIds;
      }
      
      function isGroupOwner() {
        return isAuthenticated() 
          && request.auth.uid == resource.data.ownerId;
      }
      
      function isValidNewGroup() {
        return isAuthenticated()
          && request.resource.data.ownerId == request.auth.uid
          && request.resource.data.memberIds.hasOnly([request.auth.uid])
          && request.resource.data.name is string
          && request.resource.data.name.size() > 0
          && request.resource.data.name.size() <= 100;
      }
      
      function isJoiningGroup() {
        // User adding themselves via share code
        return isAuthenticated()
          && resource.data.shareCode != null
          && request.resource.data.memberIds.hasAll(resource.data.memberIds)
          && request.resource.data.memberIds.size() == resource.data.memberIds.size() + 1
          && request.auth.uid in request.resource.data.memberIds;
      }
      
      // Create: Only owner can create
      allow create: if isValidNewGroup();
      
      // Read: Members can read, or anyone with share code
      allow read: if isGroupMember() 
        || (isAuthenticated() && resource.data.shareCode != null);
      
      // Update: Owner can update, or users joining via code
      allow update: if isGroupOwner() || isJoiningGroup();
      
      // Delete: Only owner
      allow delete: if isGroupOwner();
    }
    
    // ============================================
    // PENDING INVITATIONS
    // ============================================
    
    match /pendingInvitations/{invitationId} {
      function isInviter() {
        return isAuthenticated() 
          && request.auth.uid == resource.data.invitedByUserId;
      }
      
      function isInvitee() {
        return isAuthenticated()
          && request.auth.token.email.lower() == resource.data.invitedEmail.lower();
      }
      
      // Create: Authenticated user inviting someone
      allow create: if isAuthenticated()
        && request.resource.data.invitedByUserId == request.auth.uid
        && request.resource.data.invitedEmail is string
        && request.resource.data.status == 'pending';
      
      // Read: Inviter or invitee
      allow read: if isInviter() || isInvitee();
      
      // Update: Only invitee can accept/decline
      allow update: if isInvitee()
        && request.resource.data.status in ['accepted', 'declined']
        && resource.data.status == 'pending';
      
      // Delete: Never (audit trail)
      allow delete: if false;
    }
    
    // ============================================
    // DENY ALL OTHER PATHS
    // ============================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules

```javascript
// storage.rules
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    
    // User receipt images
    match /users/{userId}/receipts/{transactionId}/{fileName} {
      // Only owner can read/write
      allow read, write: if request.auth != null 
        && request.auth.uid == userId;
      
      // File size limit: 10MB
      allow write: if request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Testing Security Rules

### Setup Emulator

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Initialize emulators
firebase init emulators

# Start emulators
firebase emulators:start
```

### Test with @firebase/rules-unit-testing

```typescript
// tests/firestore.rules.test.ts
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gastify-test',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

describe('Transaction Rules', () => {
  const userId = 'user123'
  const transactionPath = `artifacts/boletapp/users/${userId}/transactions/tx1`

  it('allows user to read own transactions', async () => {
    const context = testEnv.authenticatedContext(userId)
    const db = context.firestore()
    
    await assertSucceeds(
      getDoc(doc(db, transactionPath))
    )
  })

  it('denies other users from reading transactions', async () => {
    const context = testEnv.authenticatedContext('otherUser')
    const db = context.firestore()
    
    await assertFails(
      getDoc(doc(db, transactionPath))
    )
  })

  it('denies unauthenticated access', async () => {
    const context = testEnv.unauthenticatedContext()
    const db = context.firestore()
    
    await assertFails(
      getDoc(doc(db, transactionPath))
    )
  })

  it('validates transaction data on create', async () => {
    const context = testEnv.authenticatedContext(userId)
    const db = context.firestore()
    
    // Valid transaction
    await assertSucceeds(
      setDoc(doc(db, transactionPath), {
        merchant: 'Líder',
        total: 45990,
        date: '2025-01-20',
        category: 'Supermercado',
      })
    )
    
    // Invalid: negative total
    await assertFails(
      setDoc(doc(db, `${transactionPath}2`), {
        merchant: 'Líder',
        total: -100,
        date: '2025-01-20',
      })
    )
  })
})

describe('Shared Group Rules', () => {
  const ownerId = 'owner123'
  const memberId = 'member456'
  const groupPath = 'sharedGroups/group1'

  it('allows owner to create group', async () => {
    const context = testEnv.authenticatedContext(ownerId)
    const db = context.firestore()
    
    await assertSucceeds(
      setDoc(doc(db, groupPath), {
        name: 'Mi Familia',
        ownerId: ownerId,
        memberIds: [ownerId],
      })
    )
  })

  it('denies creating group as different owner', async () => {
    const context = testEnv.authenticatedContext(ownerId)
    const db = context.firestore()
    
    await assertFails(
      setDoc(doc(db, groupPath), {
        name: 'Fake Group',
        ownerId: 'someoneElse',  // Trying to set different owner
        memberIds: [ownerId],
      })
    )
  })
})
```

## Cloud Functions Patterns

### Secure API Proxy (Gemini)

```typescript
// functions/src/analyzeReceipt.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Rate limiting (simple in-memory)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10  // requests per minute

export const analyzeReceipt = onCall(async (request) => {
  // 1. Require authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión')
  }
  
  const userId = request.auth.uid
  
  // 2. Rate limiting
  const now = Date.now()
  const userLimit = rateLimits.get(userId)
  
  if (userLimit) {
    if (now < userLimit.resetAt) {
      if (userLimit.count >= RATE_LIMIT) {
        throw new HttpsError(
          'resource-exhausted',
          'Demasiadas solicitudes. Espera un momento.'
        )
      }
      userLimit.count++
    } else {
      rateLimits.set(userId, { count: 1, resetAt: now + 60000 })
    }
  } else {
    rateLimits.set(userId, { count: 1, resetAt: now + 60000 })
  }
  
  // 3. Validate input
  const { images } = request.data
  
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new HttpsError('invalid-argument', 'Se requiere al menos una imagen')
  }
  
  if (images.length > 5) {
    throw new HttpsError('invalid-argument', 'Máximo 5 imágenes')
  }
  
  // 4. Call Gemini API
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: images[0],  // Base64
        },
      },
      'Analiza esta boleta y extrae: merchant, date, total, items...',
    ])
    
    const response = await result.response
    return JSON.parse(response.text())
    
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new HttpsError('internal', 'Error al analizar la boleta')
  }
})
```

### Firestore Trigger: Cascade Delete

```typescript
// functions/src/onTransactionDeleted.ts
import { onDocumentDeleted } from 'firebase-functions/v2/firestore'
import { getStorage } from 'firebase-admin/storage'

export const onTransactionDeleted = onDocumentDeleted(
  'artifacts/{appId}/users/{userId}/transactions/{transactionId}',
  async (event) => {
    const { userId, transactionId } = event.params
    
    // Delete associated images from Storage
    const bucket = getStorage().bucket()
    const folderPath = `users/${userId}/receipts/${transactionId}/`
    
    try {
      const [files] = await bucket.getFiles({ prefix: folderPath })
      
      if (files.length > 0) {
        await Promise.all(files.map(file => file.delete()))
        console.log(`Deleted ${files.length} images for transaction ${transactionId}`)
      }
    } catch (error) {
      console.error('Error deleting images:', error)
      // Don't throw - transaction is already deleted
    }
  }
)
```

### Scheduled Function: Analytics Aggregation

```typescript
// functions/src/aggregateAnalytics.ts
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getFirestore } from 'firebase-admin/firestore'

export const aggregateWeeklyAnalytics = onSchedule(
  'every monday 03:00',  // 3 AM every Monday
  async () => {
    const db = getFirestore()
    
    // Get all users
    const usersSnapshot = await db
      .collectionGroup('transactions')
      .where('date', '>=', getLastWeekStart())
      .where('date', '<=', getLastWeekEnd())
      .get()
    
    // Aggregate by user...
    // Store in analytics collection...
  }
)
```

## Query Patterns

### Efficient Queries

```typescript
// ✅ Good: Indexed query
const q = query(
  transactionsRef,
  where('category', '==', 'Supermercado'),
  orderBy('date', 'desc'),
  limit(20)
)

// ✅ Good: Compound query (requires composite index)
const q = query(
  transactionsRef,
  where('date', '>=', '2025-01-01'),
  where('date', '<=', '2025-01-31'),
  orderBy('date', 'desc')
)

// ❌ Bad: Inequality on different fields (not supported)
const q = query(
  transactionsRef,
  where('total', '>', 10000),
  where('date', '>', '2025-01-01')  // Can't do this!
)
```

### Pagination

```typescript
// Initial query
const firstPage = query(
  transactionsRef,
  orderBy('date', 'desc'),
  limit(20)
)

// Next page (using last document as cursor)
const nextPage = query(
  transactionsRef,
  orderBy('date', 'desc'),
  startAfter(lastVisibleDoc),
  limit(20)
)
```

### Real-time Listeners

```typescript
// Set up listener
const unsubscribe = onSnapshot(
  query(transactionsRef, orderBy('date', 'desc'), limit(50)),
  (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        console.log('New transaction:', change.doc.data())
      }
      if (change.type === 'modified') {
        console.log('Modified:', change.doc.data())
      }
      if (change.type === 'removed') {
        console.log('Removed:', change.doc.id)
      }
    })
  },
  (error) => {
    console.error('Listener error:', error)
  }
)

// Clean up on unmount
useEffect(() => {
  return () => unsubscribe()
}, [])
```

## Cost Optimization

### Firestore Pricing (as of 2025)

| Operation | Cost |
|-----------|------|
| Document reads | $0.06 per 100K |
| Document writes | $0.18 per 100K |
| Document deletes | $0.02 per 100K |
| Storage | $0.18 per GB/month |

### Cost Reduction Strategies

```typescript
// 1. Use projections (read only needed fields)
// Note: Firestore doesn't support field projections natively
// But you can structure data to minimize document size

// 2. Cache aggressively with TanStack Query
const { data } = useQuery({
  queryKey: ['transactions', userId],
  queryFn: fetchTransactions,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  gcTime: 30 * 60 * 1000,    // 30 minutes cache
})

// 3. Limit listener scope
// ❌ Bad: Listen to ALL transactions
onSnapshot(collection(db, 'transactions'), ...)

// ✅ Good: Listen to recent only
onSnapshot(
  query(
    collection(db, 'transactions'),
    where('date', '>=', thirtyDaysAgo),
    orderBy('date', 'desc'),
    limit(100)
  ),
  ...
)

// 4. Batch writes
const batch = writeBatch(db)
items.forEach(item => {
  batch.set(doc(collection(db, 'items')), item)
})
await batch.commit()  // Single write operation
```

## Best Practices Summary

| Do | Don't |
|----|-------|
| Design schema around queries | Normalize like SQL |
| Test security rules with emulator | Deploy untested rules |
| Use composite indexes for complex queries | Query without indexes |
| Limit listener scope | Listen to entire collections |
| Batch related writes | Individual writes in loops |
| Use Cloud Functions for sensitive operations | Expose API keys in client |
| Implement rate limiting | Allow unlimited API calls |
| Store CLP as integers | Store with decimals |
| Use Timestamps for dates | Use string dates for comparisons |
| Paginate large result sets | Fetch unlimited documents |
