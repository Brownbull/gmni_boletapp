# Story 14c.14: Tech Debt - Migrate functions.config() to Environment Variables

**Status**: backlog
**Points**: 2
**Priority**: Medium
**Dependencies**: None
**Deadline**: Before March 2026

---

## Story

As a developer,
I want to migrate from `functions.config()` to environment variables,
so that Cloud Functions continue to deploy after the March 2026 deprecation.

---

## Background

Firebase announced deprecation of `functions.config()` API (Cloud Runtime Configuration):
- **Deadline**: March 2026
- **Impact**: `firebase deploy` will fail for functions using this API after the deadline
- **Affected file**: `functions/src/analyzeReceipt.ts` line 16

Current usage:
```typescript
const apiKey = functions.config().gemini?.api_key || process.env.GEMINI_API_KEY
```

Migration options (per Firebase docs):
1. **Parameterized configuration** (recommended for secrets)
2. **Environment variables** via `.env` files
3. **Secret Manager** for sensitive values

Reference: https://firebase.google.com/docs/functions/config-env#migrate-to-dotenv

---

## Acceptance Criteria

### AC1: Remove functions.config() Usage
- Given the `analyzeReceipt.ts` file
- When I search for `functions.config()`
- Then no matches are found

### AC2: Use Environment Variables or Secret Manager
- Given the Gemini API key is needed
- When the function executes
- Then it reads from `process.env.GEMINI_API_KEY` or Secret Manager

### AC3: Local Development Works
- Given a developer runs the functions emulator
- When they have a `.env` file or `.secret.local` configured
- Then the function works with the API key

### AC4: Production Deployment Works
- Given the API key is configured in Firebase/GCP
- When `firebase deploy --only functions` runs
- Then the function deploys and works correctly

### AC5: Tests Updated
- Given the test file `analyzeReceipt.test.ts`
- When tests run
- Then they pass without mocking `functions.config()`

---

## Tasks / Subtasks

### Task 1: Migrate to Environment Variables

- [ ] 1.1 Create `functions/.env` file (add to `.gitignore` if not already)
- [ ] 1.2 Add `GEMINI_API_KEY` to `.env` for local development
- [ ] 1.3 Update `analyzeReceipt.ts` to use only `process.env.GEMINI_API_KEY`
- [ ] 1.4 Remove `functions.config()` import if no longer needed

### Task 2: Configure Production Secrets

- [ ] 2.1 Set environment variable in Firebase: `firebase functions:secrets:set GEMINI_API_KEY`
- [ ] 2.2 Or use `firebase functions:config:export` to migrate existing config
- [ ] 2.3 Verify secret is accessible in deployed function

### Task 3: Update Tests

- [ ] 3.1 Remove `functions.config()` mock from `analyzeReceipt.test.ts`
- [ ] 3.2 Update test setup to use `process.env` mock instead
- [ ] 3.3 Verify all tests pass

### Task 4: Documentation

- [ ] 4.1 Update any setup documentation for local development
- [ ] 4.2 Document how to configure secrets for new developers

---

## Definition of Done

- [ ] No `functions.config()` usage in codebase
- [ ] Functions deploy successfully
- [ ] `analyzeReceipt` function works in production
- [ ] Tests pass
- [ ] Local development documented

---

## Dev Notes

### 2026-01-17 - Story Created

This story was created during Story 14c.12 implementation when Firebase CLI showed deprecation warning during `firebase deploy --only functions`.

**Files affected:**
- `functions/src/analyzeReceipt.ts` (line 16)
- `functions/src/__tests__/analyzeReceipt.test.ts` (line 30)

**Current config value location:**
Run `firebase functions:config:get` to see current stored value.
