# Story 15-TD-8: Input Validation Hardening

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** LOW
**Status:** done

## Description

Connect the existing `validateAppId()` function at the path builder boundary and tighten the `data:` URI sanitizer pattern to avoid stripping legitimate text.

## Source Tech Debt Items

- **TD-22:** `validateAppId` defined in `validation.ts` but never called — connect at `firestorePaths` boundary
- **TD-23:** `data:` URI pattern in sanitizer is overly broad (strips legitimate "data:" text)

## Acceptance Criteria

- [x] **AC1:** `validateAppId()` called in `firestorePaths.ts` path builder functions (or a centralized entry point)
- [x] **AC2:** Invalid appId values throw descriptive error instead of constructing malformed paths
- [x] **AC3:** `data:` URI pattern in `sanitize.ts` tightened to match only URI contexts (e.g., `data:text/html`, `data:application/javascript`) not bare "data:" text
- [x] **AC4:** Existing sanitization tests updated; new tests added for tightened pattern
- [x] **AC5:** All tests pass (6526 tests, 272 files green)

## Tasks

- [x] **Task 1:** Connect `validateAppId` at path builder boundary
  - [x] Add `assertValidAppId(appId)` call at the top of all 14 path builder functions in `firestorePaths.ts`
  - [x] Format validation via regex `/^[a-zA-Z0-9_-]+$/` (prevents path traversal)
  - [x] Ensure the error message is clear (simplified to "Invalid appId format" per code review)
- [x] **Task 2:** Tighten `data:` URI sanitizer pattern
  - [x] Replace `/data:/gi` with `/data:\s*(\w+\/\w+|[;,])/gi` to match MIME types + MIME-less variants
  - [x] Created `tests/unit/utils/sanitize.test.ts` with 21 tests for tightened pattern
  - [x] Verify `data:text/html,<script>alert(1)</script>` IS still stripped

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestorePaths.ts` | MODIFY | Add validateAppId call |
| `src/utils/sanitize.ts` | MODIFY | Tighten data: URI regex |
| `tests/unit/utils/sanitize.test.ts` | MODIFY | Add tests for tightened pattern |
| `tests/unit/lib/firestorePaths.test.ts` | MODIFY | Add validation error test |

## Dev Notes

- `assertValidAppId` in `firestorePaths.ts` uses regex `/^[a-zA-Z0-9_-]+$/` for format validation (prevents path traversal)
- Separate from `validateAppId` in `validation.ts` which uses allowlist check (`['boletapp']`) for business logic
- Both serve different purposes: format safety (path layer) vs identity (app layer)
- The `data:` pattern `/data:\s*(\w+\/\w+|[;,])/gi` matches:
  - MIME-type URIs: `data:text/html`, `data:image/png`
  - MIME-less variants: `data:;base64,...`, `data:,payload`
  - Does NOT match: "Big Data: Solutions", "Updated data: 2026", "data: 123"
- Security review deferred items (follow-up stories):
  - userId/transactionId/notificationId validation at path builder boundary — tracked in [15-TD-18](./15-TD-18-path-parameter-validation.md)
  - Multi-pass sanitization to prevent pattern reconstruction bypass — tracked in [15-TD-19](./15-TD-19-sanitizer-defense-depth.md)
  - Sanitizer length truncation before regex processing — tracked in [15-TD-19](./15-TD-19-sanitizer-defense-depth.md)
- Code review quick fixes applied (2026-02-12):
  - Added max-length constraint (64 chars) to `assertValidAppId`
  - Simplified error message (removed regex from message)
  - Added case-variation + bare `data:;` test cases (4 new tests)
  - Deleted leftover temp file
  - Fixed comment reference (TD-23 → 15-TD-8)

### Tech Debt Stories Created

| TD Story | Description | Priority | Action |
|----------|-------------|----------|--------|
| [15-TD-18](./15-TD-18-path-parameter-validation.md) | userId/transactionId format validation + dead validateAppId | MEDIUM | CREATED |
| [15-TD-19](./15-TD-19-sanitizer-defense-depth.md) | Multi-pass sanitization + URL decode + pre-truncation | LOW | CREATED |

### Senior Developer Review (ECC)

- **Review date:** 2026-02-12
- **Classification:** STANDARD
- **ECC agents:** code-reviewer, security-reviewer
- **Outcome:** APPROVE — all ACs met, 6 quick fixes applied, 5 complex items deferred to 2 new TD stories
- **Tests:** 6531 passed, 272 files green (all quick fixes verified)
