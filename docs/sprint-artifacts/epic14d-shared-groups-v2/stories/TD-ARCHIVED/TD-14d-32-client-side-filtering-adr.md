# Tech Debt Story TD-14d-32: Document Client-Side Filtering Architecture Decision

Status: ready-for-dev

> **Source:** ECC Parallel Code Review (2026-02-04) on story 14d-v2-1-10d
> **Priority:** MEDIUM (Security architecture documentation)
> **Estimated Effort:** 1-2 hours
> **Risk:** Low (documentation only)

## Story

As a **developer or security reviewer**,
I want **the client-side filtering architecture decision formally documented**,
So that **the security model is clearly understood and defense-in-depth is verified**.

## Problem Statement

The ECC Security Review identified that view mode filtering relies on client-side filtering with Firestore rules as the security boundary:

1. **MEDIUM Finding:** `filterTransactionsByViewMode()` performs filtering purely on the client side
2. **Defense-in-Depth:** Firestore rules enforce that users can only access their own transactions
3. **Acceptable for Current Model:** `sharedGroupId` is a client-side annotation, not a true access control mechanism

This architectural decision should be formally documented as an ADR (Architecture Decision Record) to:
- Explain why client-side filtering was chosen
- Document the security boundaries
- Guide future developers when the model may change

## Acceptance Criteria

1. **Given** the architecture documentation
   **When** a developer reviews it
   **Then** they understand why client-side filtering is used for view mode

2. **Given** the ADR
   **When** shared groups evolve to true cross-user data
   **Then** there's clear guidance on required security changes

3. **Given** the security model documentation
   **When** a security reviewer audits the system
   **Then** they can verify defense-in-depth is in place

## Tasks / Subtasks

- [ ] Task 1: Create ADR for client-side filtering
  - [ ] Create `docs/architecture/decisions/ADR-021-view-mode-client-side-filtering.md`
  - [ ] Document context and decision drivers
  - [ ] Explain current security model
  - [ ] Note consequences and future considerations

- [ ] Task 2: Update Atlas knowledge
  - [ ] Add reference to ADR in `_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md`
  - [ ] Add to ADR table

- [ ] Task 3: Add inline documentation
  - [ ] Add security note to `filterTransactionsByViewMode` JSDoc
  - [ ] Reference ADR from the function comment

## Dev Notes

### Proposed ADR Content

```markdown
# ADR-021: View Mode Client-Side Filtering

## Status
Accepted (2026-02-04)

## Context
Story 14d-v2-1-10d implements view mode filtering to show Personal vs Group transactions.
The filtering must determine which transactions to display based on `sharedGroupId`.

Options considered:
1. **Firestore `where` clause** - Filter at query time
2. **Client-side filtering** - Filter after data retrieval

## Decision
Use **client-side filtering** for view mode transaction filtering.

### Rationale
1. **Consistency with soft-delete pattern** - The codebase already uses client-side filtering
   for soft-deleted transactions (filtering after normalization)
2. **Legacy transaction support** - Older transactions lack `sharedGroupId` field;
   Firestore `where('sharedGroupId', '==', null)` fails for documents without the field
3. **No compound index required** - Avoids adding another index to Firestore
4. **Single subscription** - One listener handles all views, reducing Firestore costs

### Security Model
- **Client-side filtering is NOT a security boundary**
- **Firestore rules enforce data isolation**: Users can only read their own transactions
  (rule: `request.auth.uid == userId`)
- `sharedGroupId` is a **UI organization annotation**, not an access control field
- Even if client-side filtering is bypassed, users only see their own data

## Consequences

### Positive
- Consistent with existing patterns
- No migration required for legacy data
- Lower Firestore costs (single subscription)

### Negative
- Slightly higher client memory usage (all transactions loaded)
- If shared groups evolve to cross-user data, architecture must change

### Future Considerations
If implementing true cross-user shared transactions (Phase 3+):
- Server-side filtering MUST be added
- Firestore rules must validate group membership for reads
- Consider Cloud Functions for aggregation
```

### Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `docs/architecture/decisions/ADR-021-view-mode-client-side-filtering.md` | Create | Formal ADR |
| `_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md` | Modify | Add ADR reference |
| `src/utils/viewModeFilterUtils.ts` | Modify | Add security note to JSDoc |

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| **Security clarity** | Documented immediately | May be forgotten |
| **Merge conflict risk** | None | None |
| **Knowledge preservation** | Captured while fresh | May be lost |
| **Sprint capacity** | 1-2 hrs | Scheduled later |

**Recommendation:** Medium priority - Document while the decision context is fresh.

### References

- [14d-v2-1-10d-data-filtering-integration.md](./14d-v2-1-10d-data-filtering-integration.md) - Source story
- ECC Parallel Code Review 2026-02-04 - Security Reviewer agent
- [firestore.rules](../../firestore.rules) - Security rules reference
