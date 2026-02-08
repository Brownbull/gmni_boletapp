# Tech Debt Story TD-CONSOLIDATED-20: Cloud Functions groupId Validation Alignment

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-08) on story TD-CONSOLIDATED-6
> **Priority:** MEDIUM
> **Estimated Effort:** 1 hour
> **Risk:** LOW (Cloud Functions currently receive groupIds from Firestore triggers, not user input)

## Story

As a **developer**,
I want **the Cloud Functions `isValidGroupId()` to use the same regex as the client-side `validateGroupId()`**,
So that **validation is consistent across client and server, preventing future security gaps if Cloud Functions accept user-provided groupIds**.

## Problem Statement

The Cloud Functions `isValidGroupId()` in `functions/src/changelogWriter.ts` allows any character except `/` with a 1500-char limit, while the client uses `^[a-zA-Z0-9_-]{1,128}$`. This means dots (`.`), backticks, square brackets, and other special characters pass server-side validation but are rejected client-side.

Current risk is low because Cloud Functions receive groupIds from Firestore trigger data (auto-generated IDs), not user input. However, if future Cloud Functions accept HTTP request parameters, the loose validation becomes a real vulnerability.

## Acceptance Criteria

- [ ] Update `isValidGroupId()` in `functions/src/changelogWriter.ts` to use regex `^[a-zA-Z0-9_-]{1,128}$`
- [ ] Or extract a shared validation constant/regex usable by both client and Cloud Functions
- [ ] Unit tests updated for the stricter validation
- [ ] `cd functions && npm run build` passes

## Tasks / Subtasks

- [ ] Task 1: Update `isValidGroupId()` regex in `functions/src/changelogWriter.ts`
  - [ ] 1.1: Replace loose validation with `^[a-zA-Z0-9_-]{1,128}$`
  - [ ] 1.2: Update/add unit tests for the stricter rules
  - [ ] 1.3: Verify `npm run build` in functions directory

## Dev Notes

- Source story: [TD-CONSOLIDATED-6](./TD-CONSOLIDATED-6-groupid-validation.md)
- Review finding: #4 (MEDIUM severity, Security agent)
- Files affected: `functions/src/changelogWriter.ts`
- Cloud Functions have a separate build — changes won't affect client bundle
- Consider whether a shared regex constant makes sense (client `src/` vs `functions/src/` are separate TypeScript projects)
