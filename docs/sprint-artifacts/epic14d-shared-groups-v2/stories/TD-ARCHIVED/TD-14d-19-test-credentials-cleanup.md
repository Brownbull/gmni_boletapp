# Tech Debt Story TD-14d-19: Remove Test Credential Fallbacks from Production Code

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-9
> **Priority:** MEDIUM (security hygiene)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW (environment variable refactoring)

## Story

As a **developer**,
I want **test credential fallback values removed from production code**,
So that **no credential-like strings are embedded in the client-side JavaScript bundle**.

## Problem Statement

The `signInWithTestCredentials` function in AuthContext.tsx contains hardcoded fallback credentials:

```typescript
// src/contexts/AuthContext.tsx:184-185
async (
    email: string = import.meta.env.VITE_TEST_USER_EMAIL || 'test@example.com',
    password: string = import.meta.env.VITE_TEST_USER_PASSWORD || 'testpassword'
)
```

**Current Mitigations:**
- Environment check (line 195-198) throws error in production
- Firebase Auth would reject invalid credentials anyway

**Security Concern:**
- Fallback credentials are visible in client-side JavaScript bundle
- Could be misleading if environment checks fail or are bypassed
- Violates principle of least privilege

## Acceptance Criteria

### AC1: No Fallback Credentials in Code
Given the AuthContext.tsx file,
When compiled for production,
Then no credential-like strings should be embedded in the bundle.

### AC2: Explicit Environment Variable Requirement
Given the signInWithTestCredentials function,
When environment variables are not set,
Then the function throws a clear error message.

### AC3: Test Compatibility
Given the E2E and integration tests,
When using test credentials,
Then they continue to work with environment variables properly set.

## Tasks / Subtasks

### Task 1: Remove Fallbacks (AC: 1, 2)

- [ ] 1.1 Remove default parameter values from signInWithTestCredentials
- [ ] 1.2 Add explicit check for environment variables
- [ ] 1.3 Throw descriptive error if credentials not configured

### Task 2: Update Tests (AC: 3)

- [ ] 2.1 Ensure `.env.test` has test credentials defined
- [ ] 2.2 Update any tests that relied on fallback values
- [ ] 2.3 Verify E2E tests pass with explicit env vars

### Task 3: Documentation

- [ ] 3.1 Update .env.example with required test credential variables
- [ ] 3.2 Add comment explaining the explicit requirement

## Dev Notes

### Suggested Fix

```typescript
const signInWithTestCredentials = useCallback(
    async (email?: string, password?: string) => {
        if (!services) {
            if (import.meta.env.DEV) {
                console.error('[AuthContext] No services available for test login');
            }
            return;
        }

        // Allow in dev environments OR when VITE_ENABLE_TEST_LOGIN is set
        const isDev = import.meta.env.DEV || window.location.hostname === 'localhost';
        const testLoginEnabled = import.meta.env.VITE_ENABLE_TEST_LOGIN === 'true';

        if (!isDev && !testLoginEnabled) {
            throw new Error('Test authentication is only available in development/test environments');
        }

        // Require explicit credentials - no fallbacks
        const finalEmail = email || import.meta.env.VITE_TEST_USER_EMAIL;
        const finalPassword = password || import.meta.env.VITE_TEST_USER_PASSWORD;

        if (!finalEmail || !finalPassword) {
            throw new Error(
                'Test credentials not configured. Set VITE_TEST_USER_EMAIL and VITE_TEST_USER_PASSWORD in your .env file.'
            );
        }

        try {
            await signInWithEmailAndPassword(services.auth, finalEmail, finalPassword);
        } catch (e: unknown) {
            const error = e as Error & { code?: string };
            if (import.meta.env.DEV) {
                console.error('[AuthContext] Test login failed:', error.code, error.message);
            }
            alert('Test Login Failed: ' + error.message);
        }
    },
    [services]
);
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Merge conflict risk** | Low | Low |
| **Security impact** | Immediate improvement | Minor risk continues |
| **Sprint capacity** | 1-2 hours | Scheduled later |
| **Breaking changes** | May affect CI if env not set | None |

**Recommendation:** DEFER - Current mitigations are adequate. Can be done in next sprint.

### References

- [14d-v2-1-9-firestore-ttl-offline.md](./14d-v2-1-9-firestore-ttl-offline.md) - Source of this tech debt item
- ECC Security Review item: M1 (MEDIUM)
