# Story 15-TD-8: Input Validation Hardening

**Epic:** 15 - Codebase Refactoring
**Points:** 2
**Priority:** LOW
**Status:** ready-for-dev

## Description

Connect the existing `validateAppId()` function at the path builder boundary and tighten the `data:` URI sanitizer pattern to avoid stripping legitimate text.

## Source Tech Debt Items

- **TD-22:** `validateAppId` defined in `validation.ts` but never called — connect at `firestorePaths` boundary
- **TD-23:** `data:` URI pattern in sanitizer is overly broad (strips legitimate "data:" text)

## Acceptance Criteria

- [ ] **AC1:** `validateAppId()` called in `firestorePaths.ts` path builder functions (or a centralized entry point)
- [ ] **AC2:** Invalid appId values throw descriptive error instead of constructing malformed paths
- [ ] **AC3:** `data:` URI pattern in `sanitize.ts` tightened to match only URI contexts (e.g., `data:text/html`, `data:application/javascript`) not bare "data:" text
- [ ] **AC4:** Existing sanitization tests updated; new tests added for tightened pattern
- [ ] **AC5:** All tests pass

## Tasks

- [ ] **Task 1:** Connect `validateAppId` at path builder boundary
  - [ ] Add `validateAppId(appId)` call at the top of path builder functions in `firestorePaths.ts`
  - [ ] Or: add a one-time validation when `appId` is first resolved in the app
  - [ ] Ensure the error message is clear: "Invalid appId: must match pattern /^[a-zA-Z0-9_-]+$/"
- [ ] **Task 2:** Tighten `data:` URI sanitizer pattern
  - [ ] Replace `/data:/gi` with `/data:\s*\w+\/\w+/gi` to match `data:text/html`, `data:image/png` etc.
  - [ ] Update tests in `sanitize.test.ts` to verify "Big Data: Solutions" is NOT stripped
  - [ ] Verify `data:text/html,<script>alert(1)</script>` IS still stripped

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/lib/firestorePaths.ts` | MODIFY | Add validateAppId call |
| `src/utils/sanitize.ts` | MODIFY | Tighten data: URI regex |
| `tests/unit/utils/sanitize.test.ts` | MODIFY | Add tests for tightened pattern |
| `tests/unit/lib/firestorePaths.test.ts` | MODIFY | Add validation error test |

## Dev Notes

- `validateAppId` uses regex `/^[a-zA-Z0-9_-]+$/` — simple allowlist check
- For `firestorePaths.ts`, call validation in each public function. Throwing on invalid appId is acceptable since it indicates a programming error, not a user input issue.
- The `data:` pattern `/data:\s*\w+\/\w+/gi` matches MIME-type patterns like `data:text/html` but NOT bare "data:" followed by non-MIME text
- Test edge cases: "data:application/json;base64,..." should be caught, "Updated data: 2026" should NOT be caught
