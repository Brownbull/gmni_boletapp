# TD-CONSOLIDATED-7: CSS Color Injection Validation

Status: done

> **Tier:** 2 - Security (SHOULD DO)
> **Consolidated from:** TD-14d-28
> **Priority:** MEDIUM (CSS injection prevention)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **group.color validated before CSS injection**,
So that **malicious CSS values cannot be injected through group color settings**.

## Problem Statement

Group color values from Firestore are used directly in CSS styles without validation. While the risk is limited (requires authenticated user to set malicious value), proper validation prevents CSS injection.

## Acceptance Criteria

- [x] Add `validateCSSColor()` utility
- [x] Validate against hex color regex (`/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/`)
- [x] Apply validation in HeaderModeIndicator and ALL 19 group display components (defense-in-depth)
- [x] Fallback to default color on invalid values (`safeCSSColor()` with `#10b981` default)
- [x] Unit tests for validation (27 new tests, 91 total in validationUtils.test.ts)

## ECC Code Review (2026-02-08)

**Classification:** COMPLEX (23 files, security keywords)
**Agents:** code-reviewer, security-reviewer, architect, tdd-guide
**Score:** 8.7/10 - APPROVE with minor changes
**Triage:** Quick + Defer (7 quick fixes applied, 1 TD story deferred)

### Quick Fixes Applied
1. **(HIGH)** Added JSDoc warning to `safeCSSColor()` fallback parameter — fallback is NOT validated
2. **(MEDIUM)** Added `safeCSSColor()` to `ColorPicker.tsx` trigger button and `EditGroupDialog.tsx` color preview
3. **(MEDIUM)** Removed double sanitization in `GruposViewDialogs.tsx` (4 locations) and `GroupMembersManager.tsx` (3 locations) — child dialogs already validate at rendering boundary
4. **(MEDIUM)** Added CSS Color Injection pattern (#7) to `_ecc/knowledge/code-review-patterns.md`
5. **(LOW)** Added security documentation test for unvalidated fallback
6. **(LOW)** Extracted `GROUP_COLORS` to shared const in test file
7. **(LOW)** Added comment to `Nav.tsx` hex-opacity concatenation pattern

### Tech Debt Stories Created
- [TD-CONSOLIDATED-21](./TD-CONSOLIDATED-21-firestore-color-field-validation.md) — Firestore security rules color field validation (write-side defense-in-depth)

### Verification
- 92 tests in `validationUtils.test.ts` pass
- 8206 tests across 309 files pass
- TypeScript compiles clean

## Cross-References

- **Original story:** [TD-14d-28](TD-ARCHIVED/TD-14d-28-css-color-injection-validation.md)
- **Source:** ECC Parallel Review (2026-02-04) on story 14d-v2-1-10c
