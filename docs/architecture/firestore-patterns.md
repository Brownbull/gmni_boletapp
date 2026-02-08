# Firestore Patterns

> **Source:** Atlas Migration 2026-02-05
> **Context:** Firestore patterns extracted from Epic 14d-v2 code reviews and security reviews

---

## Core Rules

| Pattern | Rule |
|---------|------|
| Defensive timestamps | `try/catch` with `?.toDate?.()` |
| LISTENER_LIMITS | Always apply limits to real-time queries |
| Batch commit retry | `commitBatchWithRetry()` with exponential backoff |
| Cross-user queries | Cloud Function with server-side validation |
| 500-operation chunking | All `writeBatch()` operations must chunk at 500 |
| setDoc vs updateDoc | Never use dot-notation keys with `setDoc`; use nested objects or `updateDoc` |

---

## Defensive Timestamp Handling

Firestore timestamps can be `null`, `Timestamp`, or `undefined` depending on cache state. Always use optional chaining:

```typescript
// BAD: Direct access - crashes on null/undefined
const date = doc.data().createdAt.toDate();

// GOOD: Defensive with optional chaining
const data = doc.data();
const date = data?.createdAt?.toDate?.() ?? new Date();
```

This pattern prevented production errors in Epic 14c and 14d.

---

## Batch Operation Chunking

Firestore batches have a hard limit of 500 operations. Always implement chunking:

```typescript
const BATCH_SIZE = 500;

async function batchDelete(docs: QueryDocumentSnapshot[]) {
  let batch = writeBatch(db);
  let opCount = 0;

  for (const doc of docs) {
    batch.delete(doc.ref);
    if (++opCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
    }
  }

  if (opCount > 0) await batch.commit();
}
```

When one function in a file uses correct batching, verify the pattern applies to ALL batch operations in that file.

---

## TOCTOU Race Condition Prevention

Never separate authorization checks from mutations. Use transactions for atomicity:

```typescript
// BAD: Authorization separate from mutation (TOCTOU vulnerability)
const snap = await getDoc(groupRef);
if (snap.data().ownerId !== requesterId) throw new Error('Unauthorized');
await deleteDoc(groupRef); // Race: ownership could change between lines

// GOOD: Authorization + mutation in same transaction
await runTransaction(db, async (transaction) => {
  const snap = await transaction.get(groupRef);
  if (snap.data()?.ownerId !== requesterId) {
    throw new Error('Unauthorized');
  }
  transaction.delete(groupRef); // Atomic with the check
});
```

This applies to ALL authorization-before-mutation functions, not just deletion.

---

## Real-Time Query Limits

Always apply `LISTENER_LIMITS` to prevent unbounded real-time listeners:

```typescript
import { query, collection, limit, orderBy } from 'firebase/firestore';

const LISTENER_LIMIT = 100;

const q = query(
  collection(db, 'transactions'),
  orderBy('date', 'desc'),
  limit(LISTENER_LIMIT)
);
```

---

## Cross-User Data Access

Client SDK cannot query across users. Use Cloud Functions with Admin SDK:

```typescript
// Client-side: Call the Cloud Function
const result = await httpsCallable(functions, 'getSharedData')({ groupId });

// Cloud Function: Server-side validation + Admin SDK query
exports.getSharedData = onCall(async (request) => {
  const { groupId } = request.data;
  const uid = request.auth?.uid;

  // Validate membership server-side
  const group = await admin.firestore().doc(`groups/${groupId}`).get();
  if (!group.data()?.members.includes(uid)) {
    throw new HttpsError('permission-denied', 'Not a member');
  }

  // Query with Admin SDK (bypasses security rules)
  return admin.firestore()
    .collection('transactions')
    .where('groupId', '==', groupId)
    .get();
});
```

---

## Security Rules Staging

Security rules files (`firestore.rules`) are critical deployment artifacts. Always verify they are staged before review:

```bash
# Must show "M " (staged), NOT " M" (unstaged)
git status --porcelain firestore.rules
```

---

## Input Sanitization for Firestore Writes

All user input must go through `sanitizeInput()` before writing to Firestore:

```typescript
import { sanitizeInput } from '@/utils/sanitize';

const sanitizedName = sanitizeInput(input.name, { maxLength: 100 });
const sanitizedIcon = sanitizeInput(input.icon, { maxLength: 10 });

await addDoc(collection(db, 'groups'), {
  name: sanitizedName,
  icon: sanitizedIcon,
  // ...
});
```

---

## Cloud Function Type Duplication

Type duplication between client (`src/types/`) and Cloud Functions (`functions/src/types/`) is acceptable. Track synchronization as tech debt and validate in CI.

---

## setDoc vs updateDoc for Nested Fields

**Severity:** CRITICAL - Wrong API creates literal field names instead of nested paths

| Scenario | Correct API | Why |
|----------|-------------|-----|
| Create/set entire nested object | `setDoc(ref, { field: { nested: value } }, { merge: true })` | Nested object structure preserved |
| Update sub-fields via dot-notation | `updateDoc(ref, { "field.nested": value })` | Dot-notation interpreted as path |
| Delete a nested field | `updateDoc(ref, { "field.nested": deleteField() })` | `deleteField()` only works with `updateDoc` |
| Transaction create | `transaction.set(ref, { field: { nested: value } }, { merge: true })` | Same as setDoc — no dot-notation |

**The trap:** `setDoc` with `{ merge: true }` treats dot-notation keys as **literal field names**:

```typescript
// WRONG: Creates top-level field named "groupPreferences.groupId123"
setDoc(ref, { 'groupPreferences.groupId123': value }, { merge: true });

// CORRECT: Creates nested structure { groupPreferences: { groupId123: value } }
setDoc(ref, { groupPreferences: { [groupId]: value } }, { merge: true });

// ALSO CORRECT: updateDoc interprets dot-notation as nested path
updateDoc(ref, { 'groupPreferences.groupId123': value });
```

**Important:** `updateDoc` fails if the document doesn't exist. Always check existence or handle the error when switching from `setDoc` to `updateDoc`.

*Added: 2026-02-06, Story 14d-v2-1-13+14 Task 8 bugfix*

---

*Source: Atlas Migration 2026-02-05 + Story 14d-v2-1-13+14 Task 8 (setDoc bugfix 2026-02-06)*
