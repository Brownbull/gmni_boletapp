# Tech Debt Story TD-14d-46: Production Audit Logging for Toggle Events

Status: backlog

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (observability enhancement)
> **Estimated Effort:** L (8-16 hours)
> **Risk:** MEDIUM (requires logging infrastructure decision)

## Story

As a **security administrator**,
I want **production audit logs for transaction sharing toggle events**,
So that **I can investigate incidents and track usage patterns**.

## Problem Statement

Current audit logging is DEV-only:
```typescript
if (import.meta.env.DEV) {
    console.log('[groupService] updateTransactionSharingEnabled completed', {...});
}
```

In production, there is no record of who toggled transaction sharing and when.

## Acceptance Criteria

- [ ] AC1: Toggle events logged in production with: userId, groupId, enabled, timestamp
- [ ] AC2: Logs do not contain PII beyond userId
- [ ] AC3: Logging mechanism chosen (Firebase Analytics, Cloud Functions, or audit collection)
- [ ] AC4: Log retention policy documented

## Tasks / Subtasks

### Task 1: Choose Logging Mechanism
- [ ] 1.1 Evaluate Firebase Analytics custom events
- [ ] 1.2 Evaluate Cloud Functions triggered logging
- [ ] 1.3 Evaluate dedicated Firestore audit collection
- [ ] 1.4 Document decision in ADR

### Task 2: Implement Logging
- [ ] 2.1 Implement chosen logging mechanism
- [ ] 2.2 Add to `updateTransactionSharingEnabled` function
- [ ] 2.3 Test in staging environment

### Task 3: Documentation
- [ ] 3.1 Document log format and retention
- [ ] 3.2 Create runbook for audit log queries

## Dev Notes

### Logging Options

| Option | Pros | Cons |
|--------|------|------|
| Firebase Analytics | Free tier, easy to implement | Limited to 500 event types |
| Cloud Functions | Flexible, can write to BigQuery | Adds latency, cost |
| Firestore audit collection | Real-time, queryable | Storage cost, manual cleanup |

### Security Considerations

- Logs should only contain: groupId, userId, enabled, timestamp
- No PII (names, emails) in logs
- Consider log access controls

### Dependencies

- May require broader logging infrastructure decision
- Consider batching with other audit logging needs

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
- OWASP A09: Insufficient Logging & Monitoring
