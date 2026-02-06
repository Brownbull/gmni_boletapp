# TD-CONSOLIDATED-7: CSS Color Injection Validation

Status: ready-for-dev

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

- [ ] Add `validateCSSColor()` utility
- [ ] Validate against allowlist of hex colors or CSS named colors
- [ ] Apply validation in HeaderModeIndicator and group display components
- [ ] Fallback to default color on invalid values
- [ ] Unit tests for validation

## Cross-References

- **Original story:** [TD-14d-28](TD-ARCHIVED/TD-14d-28-css-color-injection-validation.md)
- **Source:** ECC Parallel Review (2026-02-04) on story 14d-v2-1-10c
