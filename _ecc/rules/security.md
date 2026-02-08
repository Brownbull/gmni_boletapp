# Security Patterns - MUST CHECK

These patterns are mandatory. ECC code-review and security-reviewer agents enforce them.
Full reference: `_ecc/knowledge/code-review-patterns.md`

## Input Sanitization

ALL user-provided strings must pass through `sanitizeInput()` before storage or display:

```typescript
sanitizeInput(input.name, { maxLength: 100 })
```

No raw user input in Firestore writes, DOM rendering, or error messages.

## TOCTOU Prevention (Time-of-Check-to-Time-of-Use)

Authorization check and mutation MUST happen in the same Firestore transaction:

```typescript
await runTransaction(db, async (transaction) => {
  const snap = await transaction.get(ref);
  if (snap.data()?.ownerId !== requesterId) throw new Error('Unauthorized');
  transaction.delete(ref); // Same transaction = atomic
});
```

NEVER check permissions in one call then mutate in a separate call.

## Firestore Batch Chunking

ALL `writeBatch()` operations MUST chunk at 500 ops. Firestore silently fails above this limit:

```typescript
// Use commitBatchWithRetry() with exponential backoff
// If ONE function chunks, ALL batch functions in the codebase must chunk
```

## Firestore Security Rules

User isolation pattern - every user document scoped by auth UID:

```javascript
match /artifacts/{appId}/users/{userId}/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Secrets and Pre-commit

- gitleaks pre-commit hook scans for secrets automatically
- CI runs gitleaks on full history
- NEVER commit `.env` files, API keys, or credentials
- Environment variables prefixed `VITE_` are exposed to client - only put public config there

## Defense Layers

1. Pre-commit: gitleaks
2. CI: gitleaks full history + npm audit + eslint-plugin-security
3. Architecture: Cloud Functions for sensitive operations (not client-side)
4. Runtime: Firestore rules + sanitizeInput + rate limiting
