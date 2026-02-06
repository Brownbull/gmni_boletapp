# Tech Debt Story TD-14d-39: Server-Side Firestore Rule Rate Limiting

Status: backlog

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (only if abuse becomes issue)
> **Estimated Effort:** M (4-8 hours)
> **Risk:** MEDIUM (complex rule changes)

## Story

As a **security engineer**,
I want **server-side Firestore rules to enforce transaction sharing toggle rate limits**,
So that **even malicious owners cannot bypass cooldown and daily limit restrictions**.

## Problem Statement

Currently, cooldown (15 min) and daily limit (3×/day) are enforced only in client-side JavaScript. A sophisticated owner could bypass these limits by:
1. Using Firebase REST API directly
2. Resetting their own `transactionSharingToggleCountToday` field

While this only affects the owner's own group (acceptable risk), stricter enforcement may be needed for compliance or high-security scenarios.

## Acceptance Criteria

- [ ] AC1: Firestore rules validate `transactionSharingToggleCountToday` only increments (never decreases unless new day)
- [ ] AC2: Firestore rules validate `transactionSharingLastToggleAt` is `request.time` (server timestamp)
- [ ] AC3: Rules allow daily reset based on `transactionSharingToggleCountResetAt` field
- [ ] AC4: 6+ integration tests for rule edge cases
- [ ] AC5: Backward compatible with existing groups

## Tasks / Subtasks

- [ ] 1.1 Design rule helper function `isValidToggleUpdate()`
- [ ] 1.2 Implement increment-only validation for count field
- [ ] 1.3 Implement server timestamp validation for lastToggleAt
- [ ] 1.4 Handle daily reset edge case
- [ ] 1.5 Write integration tests
- [ ] 1.6 Test backward compatibility with existing groups

## Dev Notes

### Proposed Rule Addition

```javascript
// In firestore.rules
function isValidToggleUpdate() {
    let oldCount = resource.data.transactionSharingToggleCountToday;
    let newCount = request.resource.data.transactionSharingToggleCountToday;

    // Count must increment by exactly 1 (or reset to 1 on new day)
    return (newCount == oldCount + 1 || newCount == 1)
        && request.resource.data.transactionSharingLastToggleAt == request.time;
}
```

### Complexity Considerations

- Firestore rules have limited expression capabilities
- Timezone-aware daily reset is complex in rules
- May need to accept server-side UTC day boundaries

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
- [TD-14d-38](./TD-14d-38-rate-limiting-adr.md) - Related ADR
