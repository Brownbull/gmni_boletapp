# Tech Debt Story TD-14d-21: Production Monitoring for IndexedDB Clearing

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-9
> **Priority:** LOW (observability improvement)
> **Estimated Effort:** 2-4 hours
> **Risk:** LOW (logging addition only)

## Story

As a **developer**,
I want **visibility into IndexedDB clearing failures in production**,
So that **I can detect if user data is being left behind on shared devices**.

## Problem Statement

The IndexedDB clearing on logout (OWASP A3 fix) silently catches errors:

```typescript
// src/contexts/AuthContext.tsx:228-234
} catch {
    // Don't block sign-out if cache clearing fails
    if (import.meta.env.DEV) {
        console.warn('[AuthContext] Could not clear IndexedDB persistence');
    }
}
```

**Current Behavior:**
- In DEV: Warning logged to console
- In PROD: Failure is completely silent

**Concern:**
- If IndexedDB clearing fails consistently, user data could remain on shared devices
- No way to detect systematic failures without user reports
- Security fix (C1) effectiveness cannot be measured

## Acceptance Criteria

### AC1: Production Logging for Failures
Given IndexedDB clearing fails in production,
When the error is caught,
Then it is logged to the monitoring service (if configured).

### AC2: No User Impact
Given IndexedDB clearing fails,
When the error is logged,
Then the sign-out process still completes successfully.

### AC3: Error Context Captured
Given an IndexedDB clearing failure is logged,
When reviewing logs,
Then the error includes:
- Error message
- Error code (if available)
- Timestamp
- User agent (for browser debugging)

## Tasks / Subtasks

### Task 1: Add Monitoring Hook (AC: 1, 3)

- [ ] 1.1 Create `logSecurityEvent(event: string, metadata: object)` utility
- [ ] 1.2 Integrate with existing analytics/monitoring (if any)
- [ ] 1.3 Add fallback to console.error in production (better than nothing)

### Task 2: Update AuthContext (AC: 1, 2)

- [ ] 2.1 Call monitoring hook on IndexedDB clearing failure
- [ ] 2.2 Ensure sign-out is not blocked
- [ ] 2.3 Include relevant error context

### Task 3: Documentation

- [ ] 3.1 Document the security event in monitoring docs
- [ ] 3.2 Create alert/dashboard recommendation (if using monitoring service)

## Dev Notes

### Suggested Implementation

```typescript
// src/utils/securityLogging.ts
interface SecurityEventMetadata {
  error?: string;
  errorCode?: string;
  userAgent?: string;
  timestamp: string;
  [key: string]: unknown;
}

export function logSecurityEvent(
  event: string,
  metadata: Partial<SecurityEventMetadata> = {}
): void {
  const fullMetadata: SecurityEventMetadata = {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...metadata,
  };

  // If using a monitoring service (e.g., Sentry, DataDog, Firebase Analytics)
  // sendToMonitoring('security_event', { event, ...fullMetadata });

  // Fallback: log to console in production (still better than silent)
  if (!import.meta.env.DEV) {
    console.error(`[Security Event] ${event}`, fullMetadata);
  }
}
```

**Updated AuthContext:**
```typescript
// src/contexts/AuthContext.tsx
import { logSecurityEvent } from '@/utils/securityLogging';

// In handleSignOut:
} catch (error) {
    // Log to monitoring for security visibility
    logSecurityEvent('indexeddb_clear_failed', {
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as { code?: string })?.code,
    });

    // Don't block sign-out
    if (import.meta.env.DEV) {
        console.warn('[AuthContext] Could not clear IndexedDB persistence');
    }
}
```

### Integration Options

| Option | Effort | Visibility |
|--------|--------|------------|
| Console.error fallback | Low | Requires user to report |
| Firebase Analytics custom event | Medium | Dashboard available |
| Sentry/DataDog integration | Medium-High | Full alerting |
| Custom logging endpoint | High | Full control |

**Recommendation:** Start with console.error fallback, upgrade when monitoring service is chosen.

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Security visibility** | Immediate | Unknown failure rate |
| **Sprint capacity** | 2-4 hours | Scheduled later |
| **Monitoring service decision** | May force premature choice | Time to evaluate |
| **Breaking changes** | None | None |

**Recommendation:** DEFER - Low priority. The security fix (C1) is in place; monitoring is observability improvement.

### References

- [14d-v2-1-9-firestore-ttl-offline.md](./14d-v2-1-9-firestore-ttl-offline.md) - Source of this tech debt item
- ECC Security Review item: L2 (LOW)
- C1 fix: IndexedDB clearing on logout (CRITICAL - already implemented)
