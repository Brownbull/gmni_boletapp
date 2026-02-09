# Story: TD-CONSOLIDATED-14: Cloud Function Type Sync CI

## Status: ready-for-dev
## Epic: Epic 14d-v2 Shared Groups (Tech Debt - Tier 5)

> **Consolidated from:** TD-14d-9
> **Priority:** LOW (nice to have)
> **Estimated Effort:** 1-2 hours
> **Story Points:** 1 (XS)
> **Risk:** LOW
> **Dependencies:** None

## Overview

As a **developer**,
I want **CI validation that Cloud Function types stay synchronized with client types**,
So that **type mismatches between client and server are caught before deployment**.

### Problem Statement

Cloud Functions and the client app share TypeScript types (changelog entries, group structures, TTL constants) through two mechanisms:

| Mechanism | Status | Files |
|-----------|--------|-------|
| `shared/schema/` prebuild copy | Working but unvalidated | `categories.ts`, `currencies.ts`, `index.ts` |
| Manual inline duplication | No sync mechanism | Types in `changelogWriter.ts`, `onMemberRemoved.ts` |

**Key finding:** There is no `functions/src/types/` directory. Types are duplicated inline in function files with comments like "This interface is intentionally duplicated from src/types/sharedGroup.ts."

**Duplicated types inventory:**

| Client Source | Functions Location | Match? |
|---------------|-------------------|--------|
| `ChangelogEntryType` (`src/types/changelog.ts`) | `changelogWriter.ts:83-86` | Identical union |
| `ChangelogSummary` (`src/types/changelog.ts`) | `changelogWriter.ts:91-96` | Identical |
| `CHANGELOG_TTL_MS` (`src/types/changelog.ts`) | `changelogWriter.ts:64`, `onMemberRemoved.ts:50` | Identical constant |
| `ChangelogEntry` (`src/types/changelog.ts`) | `changelogWriter.ts:101-111` | DIVERGED (server adds `processedAt`, uses `FieldValue`) |
| `SharedGroup` (`src/types/sharedGroup.ts`) | `onMemberRemoved.ts:80-84` | Intentional subset (3 of 20+ fields) |
| `Transaction` (`src/types/transaction.ts`) | `changelogWriter.ts:116-126`, `onMemberRemoved.ts:92-101` | Intentional subsets (differ from each other too) |

**Divergences are intentional** where they exist: Cloud Functions use `firebase-admin` SDK types (`FieldValue`, `FirebaseFirestore.Timestamp`) while client uses `firebase/firestore` SDK (`Timestamp`). Functions also use deliberate subsets since they only need specific fields from Firestore documents.

**Real risks if sync breaks:**
1. `CHANGELOG_TTL_MS` changes in client but not functions -> silent TTL mismatch
2. `ChangelogEntryType` adds new value in client but not functions -> functions can't emit it
3. `ChangelogSummary` adds required field -> functions write incomplete entries
4. `shared/schema/` prebuild copy fails silently -> functions compile with stale schema

### Approach

Lightweight bash script that validates specific semantic contracts (constants match, union values match, shared schema files identical). NOT a shared types package or monorepo -- the `ESNext` vs `commonjs` module incompatibility and `Timestamp` type mismatch make shared packages impractical for 3-4 duplicated types.

## Functional Acceptance Criteria

- [ ] AC-1: Running `npm run check:type-sync` locally produces a clear pass/fail report for all defined contracts
- [ ] AC-2: Script fails with actionable error when `ChangelogEntryType` union values diverge
- [ ] AC-3: Script fails with actionable error when `CHANGELOG_TTL_MS` constant values diverge
- [ ] AC-4: Script fails when `shared/schema/` files differ from `functions/src/shared/schema/` copies (broken prebuild)
- [ ] AC-5: CI `setup` job includes the type sync check after Cloud Functions build; failure blocks downstream test jobs
- [ ] AC-6: Script completes in under 5 seconds on CI
- [ ] AC-7: All existing tests pass (`npm run test:story`)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] AC-ARCH-LOC-1: Validation script at `scripts/ci/check-type-sync.sh` (following `check-bundle-size.sh` convention)
- [ ] AC-ARCH-LOC-2: `check:type-sync` script added to root `package.json`
- [ ] AC-ARCH-LOC-3: CI step added to `.github/workflows/test.yml` in `setup` job after Cloud Functions build step

### Pattern Requirements

- [ ] AC-ARCH-PATTERN-1: Script uses bash (not TypeScript) — matches existing `scripts/ci/` convention and avoids `tsx` startup overhead
- [ ] AC-ARCH-PATTERN-2: Script is POSIX-compatible for macOS + Linux portability (no GNU-only flags)
- [ ] AC-ARCH-PATTERN-3: Script is read-only and idempotent — no side effects, no file modifications
- [ ] AC-ARCH-PATTERN-4: Each check produces independent pass/fail output — one failing check does not prevent others from running
- [ ] AC-ARCH-PATTERN-5: Exit code 0 on all pass, 1 on any failure
- [ ] AC-ARCH-PATTERN-6: Contract definitions (what to check) are separated from validation logic (how to check) — either via structured comments, a companion data file, or clearly delineated sections

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] AC-ARCH-NO-1: Must NOT create a shared TypeScript package or monorepo tooling — Timestamp type incompatibility makes this impractical for 3-4 types
- [ ] AC-ARCH-NO-2: Must NOT modify the Cloud Functions build pipeline or `prebuild` script — the CI check validates it, not replaces it
- [ ] AC-ARCH-NO-3: Must NOT import client types from Cloud Functions or vice versa — module system incompatibility (`ESNext` vs `commonjs`)
- [ ] AC-ARCH-NO-4: Must NOT add a separate CI job — the check runs in under 5s and belongs in `setup` for fail-fast behavior
- [ ] AC-ARCH-NO-5: Must NOT validate server-only fields (`processedAt`, `FieldValue` timestamps, index signatures) — these are intentional divergences
- [ ] AC-ARCH-NO-6: Must NOT add new npm dependencies to either `package.json` or `functions/package.json`

## File Specification

| File/Component | Exact Path | Pattern | AC Reference |
|----------------|------------|---------|--------------|
| Sync validation script | `scripts/ci/check-type-sync.sh` | Bash CI script | AC-1 through AC-6, AC-ARCH-LOC-1, AC-ARCH-PATTERN-1/2/3/4/5/6 |
| Root package.json | `package.json` | Script addition | AC-ARCH-LOC-2 |
| CI workflow | `.github/workflows/test.yml` | Step addition in `setup` job | AC-5, AC-ARCH-LOC-3, AC-ARCH-NO-4 |

## Tasks / Subtasks

### Task 1: Create Sync Validation Script

**File:** `scripts/ci/check-type-sync.sh`

- [ ] 1.1 Create script skeleton with usage header, color output (respecting `NO_COLOR`/`CI`), pass/fail counter
- [ ] 1.2 Implement `file_identical` checks: compare `shared/schema/categories.ts`, `currencies.ts`, `index.ts` against their `functions/src/shared/schema/` copies using `diff`
- [ ] 1.3 Implement `constant_value` check: extract `CHANGELOG_TTL_MS` numeric expression from `src/types/changelog.ts`, `functions/src/changelogWriter.ts`, `functions/src/triggers/onMemberRemoved.ts`; verify all match
- [ ] 1.4 Implement `string_union` check: extract `ChangelogEntryType` union members from `src/types/changelog.ts` and `functions/src/changelogWriter.ts`; verify functions' values are a subset of client's values
- [ ] 1.5 Make script executable (`chmod +x`)
- [ ] 1.6 Test locally: verify script passes on current codebase

### Task 2: CI Integration + Package Script

**Files:** `package.json`, `.github/workflows/test.yml`

- [ ] 2.1 Add `"check:type-sync": "bash scripts/ci/check-type-sync.sh"` to root `package.json` scripts
- [ ] 2.2 Add CI step in `.github/workflows/test.yml` `setup` job after Cloud Functions build: `bash scripts/ci/check-type-sync.sh`
- [ ] 2.3 Run `npm run check:type-sync` to verify it works via npm

### Task 3: Verification

- [ ] 3.1 Temporarily modify `CHANGELOG_TTL_MS` in `src/types/changelog.ts` and verify script catches it; revert
- [ ] 3.2 Temporarily modify `ChangelogEntryType` union and verify script catches it; revert
- [ ] 3.3 Run `npm run test:story` to verify no regressions

## Dev Notes

### Architecture Guidance

**Why bash and not TypeScript:**
Existing CI validation scripts in this project use bash (e.g., `check-bundle-size.sh`). TypeScript would require `tsx` runtime and adds 200ms+ startup overhead for what is essentially file comparison. The script reads files, extracts patterns with `grep`/`sed`, and compares strings — all native bash operations.

**Extraction patterns:**

For `CHANGELOG_TTL_MS`:
```bash
grep -oP 'CHANGELOG_TTL_MS\s*=\s*\K[^;]+' "$file" | tr -d ' '
```

For `ChangelogEntryType` union members:
```bash
sed -n '/type ChangelogEntryType/,/;/p' "$file" | grep -oP "'[^']+'"
```

**CI placement rationale:**
The check goes in the `setup` job after Cloud Functions build (the `prebuild` script runs as part of `npm run build` in functions dir, populating `functions/src/shared/schema/`). Failing in `setup` prevents all downstream test jobs from running, saving CI minutes on a fundamentally broken build.

**Intentional divergences (DO NOT validate):**
- `ChangelogEntryData` vs `ChangelogEntry` — different by design (`FieldValue` vs `Timestamp`)
- `SharedGroupData` (3 fields) vs `SharedGroup` (20+ fields) — intentional subset
- `TransactionData` subsets — functions only need specific fields
- `processedAt` server-only field
- `[key: string]: unknown` index signature in changelogWriter's `TransactionData`

**Future evolution:**
If the project moves to monorepo or adds many more Cloud Functions with shared types, replace this script with a proper shared types package. The script's contract definitions serve as documentation of what would go into that package.

### Technical Notes

No specialized technical review required — straightforward CI validation script.

### E2E Testing

Not applicable — this is a CI infrastructure change with no runtime behavior.

## ECC Analysis Summary

- **Risk Level:** LOW
- **Complexity:** Low
- **Sizing:** XS (1 pt) — 3 tasks, 9 subtasks, 3 files
- **Agents consulted:** Planner, Architect

## Cross-References

- **Original story:** [TD-14d-9](TD-ARCHIVED/TD-14d-9-type-sync-validation.md) - Type sync validation
- **Related:** `docs/architecture/firestore-patterns.md` (Cloud Function Type Duplication section)
- **Existing mechanism:** `shared/schema/` + `functions/package.json` prebuild copy
- **Sources:** ECC Parallel Review (2026-02-03) on story 14d-v2-1-8a
