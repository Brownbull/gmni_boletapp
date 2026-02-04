# Tech Debt Story TD-14d-20: Error Message i18n and Sanitization

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-9
> **Priority:** LOW (UX polish and security hardening)
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (isolated UI changes)

## Story

As a **user**,
I want **error messages in my preferred language that don't expose internal details**,
So that **I can understand issues without seeing technical jargon or potential security information**.

## Problem Statement

### Issue 1: Hardcoded English in Rate Limit Message

The rate limit error in RecoverySyncPrompt is hardcoded in English:

```typescript
// src/features/shared-groups/components/RecoverySyncPrompt.tsx:169
setSyncError(`Please wait ${remainingSeconds}s before retrying`);
```

Other UI text supports both English and Spanish via the `t()` function and `lang` prop.

### Issue 2: Raw Error Messages Displayed to Users

Sync operation errors are displayed directly without sanitization:

```typescript
// src/features/shared-groups/components/RecoverySyncPrompt.tsx:181
const message = e instanceof Error ? e.message : 'Sync failed';
setSyncError(message);
```

**Risks:**
- Internal error messages (Firebase SDK errors, stack traces) could leak
- Error messages may be excessively long or contain technical details
- Inconsistent UX between languages

## Acceptance Criteria

### AC1: Rate Limit Message i18n
Given a user in cooldown state,
When they see the rate limit error,
Then the message is displayed in their selected language (en/es).

### AC2: Error Message Sanitization
Given a sync operation fails,
When the error is displayed,
Then the message is:
- Truncated if over 100 characters
- User-friendly (no stack traces)
- In the user's selected language

### AC3: Consistent Error Display
Given any error in shared-groups dialogs,
When displayed to users,
Then the same sanitization rules apply.

## Tasks / Subtasks

### Task 1: i18n for Rate Limit (AC: 1)

- [ ] 1.1 Add translation keys to `translations.ts`:
  - `recoverySyncRateLimited`: "Please wait {seconds}s before retrying"
  - `recoverySyncRateLimited_es`: "Por favor espera {seconds}s antes de reintentar"
- [ ] 1.2 Update RecoverySyncPrompt to use `t()` for rate limit message
- [ ] 1.3 Add test for Spanish rate limit message

### Task 2: Error Sanitization (AC: 2)

- [ ] 2.1 Create `sanitizeErrorMessage(error: unknown, lang: 'en' | 'es'): string` utility
- [ ] 2.2 Implement rules:
  - Max length 100 characters (truncate with "...")
  - Remove stack traces
  - Provide fallback message if too technical
- [ ] 2.3 Apply to RecoverySyncPrompt sync errors
- [ ] 2.4 Write unit tests for sanitizer

### Task 3: Audit Other Dialogs (AC: 3)

- [ ] 3.1 Check CreateGroupDialog for error handling
- [ ] 3.2 Check InviteMembersDialog for error handling
- [ ] 3.3 Check AcceptInvitationDialog for error handling
- [ ] 3.4 Apply sanitizeErrorMessage where needed

## Dev Notes

### Suggested Implementation

**Error Sanitizer:**
```typescript
// src/utils/errorUtils.ts
const GENERIC_ERRORS = {
  en: 'An error occurred. Please try again.',
  es: 'Ocurrió un error. Por favor intenta de nuevo.',
};

export function sanitizeErrorMessage(
  error: unknown,
  lang: 'en' | 'es' = 'en',
  maxLength = 100
): string {
  // Handle non-Error types
  if (!error) return GENERIC_ERRORS[lang];

  const message = error instanceof Error ? error.message : String(error);

  // Check for technical patterns that shouldn't be shown
  const technicalPatterns = [
    /stack trace/i,
    /at\s+\w+\s+\(/,  // Stack trace lines
    /firebase-internal/i,
    /permission-denied/i,  // Show generic instead
  ];

  if (technicalPatterns.some(p => p.test(message))) {
    return GENERIC_ERRORS[lang];
  }

  // Truncate if too long
  if (message.length > maxLength) {
    return message.substring(0, maxLength - 3) + '...';
  }

  return message;
}
```

**Rate Limit i18n:**
```typescript
// In RecoverySyncPrompt.tsx
const texts = {
  // ... existing translations
  rateLimited: t('recoverySyncRateLimited') || (lang === 'es'
    ? `Por favor espera ${remainingSeconds}s antes de reintentar`
    : `Please wait ${remainingSeconds}s before retrying`),
};
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **User impact** | Immediate UX improvement | Minor annoyance |
| **Security impact** | Prevents info leakage | Low risk |
| **Sprint capacity** | 2-3 hours | Scheduled later |
| **Batch opportunity** | Can do with other i18n work | Yes |

**Recommendation:** DEFER - Low priority, can be batched with other i18n improvements.

### References

- [14d-v2-1-9-firestore-ttl-offline.md](./14d-v2-1-9-firestore-ttl-offline.md) - Source of this tech debt item
- ECC Code Review item: L3 (LOW)
- ECC Security Review item: L1 (LOW)
