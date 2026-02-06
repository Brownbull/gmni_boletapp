# Tech Debt Story TD-14d-9: Cloud Function Type Synchronization Validation

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-03) on story 14d-v2-1-8a
> **Priority:** LOW (no immediate bugs, preventive measure)
> **Estimated Effort:** Small (1-2 hours)
> **Risk:** LOW (types currently match, drift is theoretical)

## Story

As a **developer**,
I want **a mechanism to detect type drift between Cloud Functions and client-side code**,
So that **duplicated types stay synchronized and bugs from mismatches are prevented**.

## Problem Statement

Cloud Functions have an isolated build environment and cannot reliably import from the client-side `src/` directory. This requires duplicating types in both locations:

- `functions/src/changelogWriter.ts` (lines 69-112): `ChangelogEntryType`, `ChangelogSummary`, `ChangelogEntryData`
- `src/types/changelog.ts`: Same types for client-side use

Currently, there is no mechanism to detect if these types diverge over time. A developer modifying one file may forget to update the other.

## Acceptance Criteria

1. **Given** a type definition exists in both `functions/src/` and `src/types/`
   **When** the types have structural differences
   **Then** CI fails with a clear error message indicating which types diverged

2. **Given** the `CHANGELOG_TTL_MS` constant is defined in both locations
   **When** the values differ
   **Then** CI fails with a clear error message

3. **Given** types are synchronized
   **When** CI runs
   **Then** validation passes silently

## Tasks / Subtasks

- [ ] **Task 1: Document type duplication locations**
  - [ ] 1.1: Create `docs/architecture/type-duplication.md` listing all duplicated types
  - [ ] 1.2: Document the rationale for duplication (Cloud Functions isolation)

- [ ] **Task 2: Implement type comparison utility**
  - [ ] 2.1: Create `scripts/check-type-sync.ts` script
  - [ ] 2.2: Parse both files and compare type structures
  - [ ] 2.3: Compare constant values (`CHANGELOG_TTL_MS`)
  - [ ] 2.4: Output clear diff on mismatch

- [ ] **Task 3: Add CI integration**
  - [ ] 3.1: Add `npm run check:type-sync` script to package.json
  - [ ] 3.2: Add step to CI workflow (can run in parallel with lint)

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Context window fit | Fits easily | Clean separation |
| Sprint capacity | Uses ~2 hours | Scheduled for later |
| Accumulation risk | Prevents future bugs | May compound if more types duplicated |
| Dependency risk | None | None |

**Recommendation:** Defer to batch with other Cloud Function improvements

### Alternative Approaches

1. **Shared package**: Create `packages/shared-types/` monorepo structure
   - Pro: Single source of truth
   - Con: Significant architecture change, Firebase Functions deployment complexity

2. **Build-time copy**: Copy types from `src/` to `functions/` during build
   - Pro: Single source of truth
   - Con: Build complexity, potential stale copies

3. **CI validation** (recommended): Compare types at CI time
   - Pro: Simple, catches drift early
   - Con: Requires manual sync when types change

### Files Affected

| File | Action |
|------|--------|
| `scripts/check-type-sync.ts` | CREATE |
| `docs/architecture/type-duplication.md` | CREATE |
| `package.json` | MODIFY (add script) |
| `.github/workflows/ci.yml` | MODIFY (add step) |

### References

- [14d-v2-1-8a](./14d-v2-1-8a-changelog-writer-foundation.md) - Source of this tech debt item
- `functions/src/changelogWriter.ts:54-59` - Comment explaining duplication rationale
