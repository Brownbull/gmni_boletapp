# TD Story Consolidation Plan - Epic 14d-v2

> **Status:** APPROVED - Executed 2026-02-05
> **Created:** 2026-02-05
> **Purpose:** Consolidate 57+ TD stories into actionable, prioritized work items

---

## Summary

**Original TD Stories:** 57+
**After Consolidation:** 15 actionable items
**Deleted/Archived:** 42+ (low-value polish items)

---

## Consolidated TD Stories (Priority Order)

### TIER 1: Code Bloat Prevention (MUST DO)

These prevent another 5,000-line file situation.

| New ID | Original IDs | Title | Est. Hours | Dependencies |
|--------|--------------|-------|------------|--------------|
| **TD-CONSOLIDATED-1** | TD-14d-4 | **groupService Modularization** - Split 1,367 LOC into groupService, groupDeletionService, groupMemberService | 4-6 | None |
| **TD-CONSOLIDATED-2** | TD-14d-3 | **GruposView Dialog Extraction** - Extract dialog rendering (lines 654-782) to GruposViewDialogs.tsx | 2-3 | TD-CONSOLIDATED-1 |
| **TD-CONSOLIDATED-3** | TD-14d-30, TD-14d-33, TD-14d-34 | **DRY Utilities Extraction** - Transaction merge, ViewMode type consolidation, shared test factory | 3-4 | None |
| **TD-CONSOLIDATED-4** | TD-14d-48 (cooldown core) | **Cooldown Core Extraction** - Extract ~80% duplicated cooldown logic to cooldownCore.ts | 2-3 | None |

**Total Tier 1:** 11-16 hours

---

### TIER 2: Security (SHOULD DO)

Real security improvements, not theoretical.

| New ID | Original IDs | Title | Est. Hours | Dependencies |
|--------|--------------|-------|------------|--------------|
| **TD-CONSOLIDATED-5** | TD-14d-5 | **Invitation Read Restriction** - Restrict pendingInvitations read to email match query | 2-3 | None |
| **TD-CONSOLIDATED-6** | TD-14d-55 | **GroupId Validation** - Validate groupId before use in Firestore field paths (path injection prevention) | 1-2 | None |
| **TD-CONSOLIDATED-7** | TD-14d-28 | **CSS Color Injection Validation** - Validate group.color before CSS injection | 1-2 | None |

**Total Tier 2:** 4-7 hours

---

### TIER 3: Test Quality (DO WHEN TOUCHING)

Fix inline when working on related code.

| New ID | Original IDs | Title | Est. Hours | Dependencies |
|--------|--------------|-------|------------|--------------|
| **TD-CONSOLIDATED-8** | TD-14d-8, TD-14d-31, TD-14d-34, TD-14d-35, TD-14d-37, TD-14d-49 | **Test Infrastructure Cleanup** - DRY test helpers, type safety, naming conventions | 4-6 | None |

**Total Tier 3:** 4-6 hours

---

### TIER 4: Documentation (DO WHEN NEEDED)

Write documentation when the decision is questioned.

| New ID | Original IDs | Title | Est. Hours | Dependencies |
|--------|--------------|-------|------------|--------------|
| **TD-CONSOLIDATED-9** | TD-14d-32, TD-14d-38 | **ADR Documentation** - Client-side filtering ADR-021, Rate limiting ADR | 2-3 | None |

**Total Tier 4:** 2-3 hours

---

### TIER 5: Technical Improvements (BACKLOG)

Nice to have, do if time permits.

| New ID | Original IDs | Title | Est. Hours | Dependencies |
|--------|--------------|-------|------------|--------------|
| **TD-CONSOLIDATED-10** | TD-14d-11 | **TOCTOU Atomic Transactions** - Wrap membership validation in Firestore transaction | 2-3 | None |
| **TD-CONSOLIDATED-11** | TD-14d-6, TD-14d-39 | **Server-Side Rate Limiting** - Add rate limiting for destructive operations | 3-4 | None |
| **TD-CONSOLIDATED-12** | TD-14d-47 | **React Query Cache Staleness** - Fix optimistic cache update | 2-3 | None |
| **TD-CONSOLIDATED-13** | TD-14d-17, TD-14d-18 | **Dialog Focus Management** - Consistent focus cleanup across dialogs | 2-3 | None |
| **TD-CONSOLIDATED-14** | TD-14d-9 | **Cloud Function Type Sync CI** - CI validation for type synchronization | 1-2 | None |
| **TD-CONSOLIDATED-15** | TD-14d-7 | **Dependency Vulnerability Tracking** - npm audit remediation | 1-2 | None |

**Total Tier 5:** 12-17 hours (optional)

---

## ARCHIVED (Deleted from Tracking)

These items are too small to track formally. Fix inline if encountered.

| Original ID | Reason for Archive |
|-------------|-------------------|
| TD-14d-23 | 30 min - React act() warning (fix inline) |
| TD-14d-35 | 30 min - Test override naming (fix inline) |
| TD-14d-41 | XS - DEFAULT_TIMEZONE constant (fix inline) |
| TD-14d-42 | XS - Network error test (fix inline) |
| TD-14d-43 | XS - JSDoc @see references (fix inline) |
| TD-14d-44 | XS - Same-value toggle test (fix inline) |
| TD-14d-45 | XS - Runtime boolean validation (fix inline) |
| TD-14d-48 (pluralization) | XS - "1 minute" vs "1 minutes" (fix inline) |
| TD-14d-50 | XS - Test unused lang prop (fix inline) |
| TD-14d-51 | XS - Error color CSS variable (fix inline) |
| TD-14d-52 | XS - E2E waitForTimeout cleanup (fix inline) |
| TD-14d-53 | XS - Centralized logging utility (fix inline) |
| TD-14d-54 | XS - Barrel export type completeness (fix inline) |
| TD-14d-56 | XS - Read function validation (fix inline) |
| TD-14d-57 | XS - Validation DRY extraction (fix inline) |
| TD-14d-10 | Deferred - Changelog data sanitization (low risk) |
| TD-14d-12 | Deferred - Error extraction pattern (low impact) |
| TD-14d-13 | Deferred - N+1 query optimization (rare operation) |
| TD-14d-14 | Deferred - Enhanced HTML sanitization (client escapes) |
| TD-14d-15 | Deferred - Test assertion strengthening (low impact) |
| TD-14d-16 | Deferred - Additional test coverage (see testing guidelines) |
| TD-14d-19 | Deferred - Test credentials cleanup (security theater) |
| TD-14d-20 | Deferred - Error i18n sanitization (low impact) |
| TD-14d-21 | Deferred - IndexedDB monitoring (nice to have) |
| TD-14d-22 | Deferred - updateGroupData validation (fix inline) |
| TD-14d-24 | Deferred - ViewModeSwitcher code quality (low impact) |
| TD-14d-25 | Deferred - ViewModeSwitcher test quality (see testing guidelines) |
| TD-14d-26 | Deferred - ViewModeSwitcher performance (premature) |
| TD-14d-27 | Deferred - HeaderModeIndicator test quality (see testing guidelines) |
| TD-14d-29 | Deferred - HeaderModeIndicator perf cleanup (premature) |
| TD-14d-36 | Deferred - Cooldown reason type enum (covered in TD-CONSOLIDATED-4) |
| TD-14d-40 | Deferred - Error message reset time (low impact) |
| TD-14d-46 | Backlog - Production audit logging (post-MVP) |
| TD-7d-5 | Deferred - Hard leave mode (depends on cloud function) |
| TD-7d-6 | Deferred - Member selector loading (fix inline) |

---

## Implementation Order

### Sprint N (Current)

1. **TD-CONSOLIDATED-1** - groupService modularization (blocks TD-2)
2. **TD-CONSOLIDATED-3** - DRY utilities (parallel)
3. **TD-CONSOLIDATED-4** - Cooldown core extraction (parallel)

### Sprint N+1

1. **TD-CONSOLIDATED-2** - GruposView dialog extraction (after TD-1)
2. **TD-CONSOLIDATED-5** - Invitation read restriction
3. **TD-CONSOLIDATED-6** - GroupId validation
4. **TD-CONSOLIDATED-8** - Test infrastructure (ongoing with test reduction)

### Ongoing / As-Needed

- **TD-CONSOLIDATED-7** - CSS color validation (when touching group styling)
- **TD-CONSOLIDATED-9** - ADR documentation (when decisions questioned)
- **TD-CONSOLIDATED-10-15** - Backlog items

---

## Acceptance Criteria for Consolidation

- [x] Sprint-status.yaml updated to remove individual TD-14d-* entries
- [x] Consolidated stories added with new TD-CONSOLIDATED-* IDs
- [x] Archived items removed from tracking (documented in this file)
- [x] This plan approved before sprint-status changes

---

## Execution Log

1. ~~Review and approve this consolidation plan~~ - DONE 2026-02-05
2. ~~Update sprint-status.yaml with new consolidated IDs~~ - DONE 2026-02-05
3. ~~Archive individual story files to stories/TD-ARCHIVED/~~ - DONE 2026-02-05 (55 files moved)
4. ~~Create new story files for TD-CONSOLIDATED-* items~~ - DONE 2026-02-05 (15 files created)

---

## Mapping Reference

For auditing, here's the complete mapping:

```
TD-CONSOLIDATED-1 ← TD-14d-4
TD-CONSOLIDATED-2 ← TD-14d-3
TD-CONSOLIDATED-3 ← TD-14d-30 + TD-14d-33 + TD-14d-34
TD-CONSOLIDATED-4 ← TD-14d-48 (cooldown core, not pluralization)
TD-CONSOLIDATED-5 ← TD-14d-5
TD-CONSOLIDATED-6 ← TD-14d-55
TD-CONSOLIDATED-7 ← TD-14d-28
TD-CONSOLIDATED-8 ← TD-14d-8 + TD-14d-31 + TD-14d-34 + TD-14d-35 + TD-14d-37 + TD-14d-49
TD-CONSOLIDATED-9 ← TD-14d-32 + TD-14d-38
TD-CONSOLIDATED-10 ← TD-14d-11
TD-CONSOLIDATED-11 ← TD-14d-6 + TD-14d-39
TD-CONSOLIDATED-12 ← TD-14d-47
TD-CONSOLIDATED-13 ← TD-14d-17 + TD-14d-18
TD-CONSOLIDATED-14 ← TD-14d-9
TD-CONSOLIDATED-15 ← TD-14d-7
```
