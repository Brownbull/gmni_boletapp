# Tech Debt Story TD-14d-10: Evaluate Changelog Data Sanitization Policy

Status: ready-for-dev

> **Source:** ECC Security Review (2026-02-03) on story 14d-v2-1-8a
> **Priority:** MEDIUM (data privacy consideration)
> **Estimated Effort:** Medium (requires product decision + implementation)
> **Risk:** MEDIUM (receipt images may contain personal information)

## Story

As a **product owner**,
I want **to evaluate what transaction data should be included in changelog entries**,
So that **shared group members see appropriate data without unnecessary privacy exposure**.

## Problem Statement

The changelog writer (story 14d-v2-1-8a) implements AD-3 which specifies "full transaction data in changelog" for sync efficiency. However, this includes:

- `imageUrls`: Direct URLs to receipt images in Firebase Storage
- `thumbnailUrl`: Direct URL to receipt thumbnail
- All other transaction fields

Receipt images may contain sensitive information:
- Partial credit card numbers
- Customer names/addresses
- Loyalty card numbers

Group members can read the full changelog data, including these URLs.

### Current Implementation

```typescript
// functions/src/changelogWriter.ts:260
data: transactionData ? { ...transactionData } : null,
```

## Acceptance Criteria

1. **Given** a product decision on data exposure policy
   **When** the decision is "sanitize"
   **Then** changelog entries exclude `imageUrls` and `thumbnailUrl` fields

2. **Given** a product decision on data exposure policy
   **When** the decision is "keep full data"
   **Then** document the privacy implications in user-facing terms

3. **Given** changelog entries with sanitized data
   **When** a group member views a shared transaction
   **Then** they can still see amount, merchant, category, date (core sync data)

## Tasks / Subtasks

- [ ] **Task 1: Product Decision**
  - [ ] 1.1: Document current data exposure in changelog
  - [ ] 1.2: List privacy implications for receipt images
  - [ ] 1.3: Get product owner decision: sanitize vs keep

- [ ] **Task 2: If Sanitize - Implementation**
  - [ ] 2.1: Create `sanitizeTransactionData()` helper function
  - [ ] 2.2: Exclude `imageUrls`, `thumbnailUrl` from changelog data
  - [ ] 2.3: Update tests to verify sanitization
  - [ ] 2.4: Consider if summary field needs any restrictions

- [ ] **Task 3: If Keep - Documentation**
  - [ ] 3.1: Add privacy notice to shared groups feature
  - [ ] 3.2: Update terms of service if needed
  - [ ] 3.3: Document in architecture why full data is kept

## Dev Notes

### Tradeoff Analysis

| Factor | Sanitize Data | Keep Full Data |
|--------|---------------|----------------|
| Privacy | Better - no image URLs shared | Worse - receipts visible to group |
| Sync efficiency | Same - core fields still present | Same |
| Feature richness | Less - can't show receipt images | More - can show receipt images |
| AD-3 compliance | Partial - "full data" interpretation | Full compliance |
| Implementation | ~2 hours | ~30 min (documentation only) |

### Architecture Decision Context

**AD-3 states:** "Full transaction data in changelog (50% cost reduction - single read per change)"

The "50% cost reduction" comes from not needing to fetch the original transaction. If we sanitize `imageUrls`, members would need a separate read to view receipt images - but this may be acceptable for privacy.

**Recommendation:** Sanitize by default, allow opt-in image sharing per group setting (future feature).

### Files Affected

| File | Action |
|------|--------|
| `functions/src/changelogWriter.ts` | MODIFY (add sanitization) |
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (add tests) |

### References

- [14d-v2-1-8a](./14d-v2-1-8a-changelog-writer-foundation.md) - Source of this tech debt item
- [Epic 14d-v2 AD-3](../epics.md) - Architecture decision on full transaction data
