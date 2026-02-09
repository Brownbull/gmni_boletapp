# TD-CONSOLIDATED-21: Firestore Security Rules - Color Field Validation

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-7
> **Priority:** MEDIUM (defense-in-depth, write-side enforcement)
> **Estimated Effort:** 1-2 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **Firestore security rules to validate the `color` field in `sharedGroups` documents**,
So that **malicious CSS values cannot be written to the database even if client-side validation is bypassed**.

## Problem Statement

TD-CONSOLIDATED-7 added `safeCSSColor()` validation at all 23 rendering boundaries (read-side defense). However, Firestore security rules do not validate the `color` field on writes. An authenticated user could bypass client-side validation by using the Firestore REST API or Firebase Admin SDK directly, writing arbitrary strings to `group.color`.

While the read-side validation catches this at render time, adding write-side validation in Firestore rules provides defense-in-depth by preventing malicious values from being stored in the first place.

## Acceptance Criteria

- [ ] Add `isValidHexColor()` helper function to Firestore security rules
- [ ] Validate `color` field on `sharedGroups` document creates and updates
- [ ] Accept only 3-digit and 6-digit hex colors (matching client-side regex)
- [ ] Allow documents without a `color` field (backward compatibility)
- [ ] Deploy updated rules to staging and verify
- [ ] Unit test for rules validation (if Firestore rules testing is set up)

## Tasks / Subtasks

- [ ] Task 1: Add validation function to `firestore.rules`
  - [ ] Add `isValidHexColor(color)` function using `matches()` regex
  - [ ] Apply to `sharedGroups` write rules
  - [ ] Allow `color` field to be absent (optional field)
- [ ] Task 2: Test and deploy
  - [ ] Test with `npm run emulators` locally
  - [ ] Deploy to staging with `firebase deploy --only firestore:rules`
  - [ ] Verify existing groups with valid colors still work
  - [ ] Verify write with invalid color is rejected

## Dev Notes

- Source story: [TD-CONSOLIDATED-7](./TD-CONSOLIDATED-7-css-color-injection-validation.md)
- Review findings: Finding #4 (Firestore rules enforcement gap)
- Files affected: `firestore.rules`
- Pattern reference: `_ecc/knowledge/code-review-patterns.md` Section 7

### Suggested Implementation

```javascript
function isValidHexColor(color) {
  return color.matches('^#[0-9a-fA-F]{6}$') || color.matches('^#[0-9a-fA-F]{3}$');
}

// In sharedGroups rules:
allow create, update: if request.auth != null
  && (!('color' in request.resource.data) || isValidHexColor(request.resource.data.color));
```
