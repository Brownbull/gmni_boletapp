# Tech Debt Story TD-14d-52: Replace E2E waitForTimeout with Proper Waits

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** MEDIUM (test reliability)
> **Estimated Effort:** S (1-2 hours)
> **Risk:** LOW (test improvement)

## Story

As a **developer**,
I want **E2E tests to use state-based waits instead of hardcoded timeouts**,
So that **tests are more reliable and don't flake in CI**.

## Problem Statement

The `transaction-sharing-toggle.spec.ts` E2E test uses multiple `waitForTimeout()` calls which are a flaky pattern:

**Current Code (multiple locations):**
```typescript
await page.waitForTimeout(500);   // line 76
await page.waitForTimeout(1000);  // line 97
await page.waitForTimeout(500);   // line 103
await page.waitForTimeout(1500);  // line 118
// ... and more
```

Hardcoded timeouts are unreliable because:
- Network latency varies
- CI environments may be slower
- Tests become flaky under load

## Acceptance Criteria

- [ ] AC1: Replace `waitForTimeout` calls with `waitForSelector` where waiting for UI element
- [ ] AC2: Replace `waitForTimeout` calls with `waitForResponse` where waiting for API
- [ ] AC3: Tests pass reliably (run 5x to verify no flakes)
- [ ] AC4: Test execution time not significantly increased

## Tasks / Subtasks

- [ ] 1.1 Identify each `waitForTimeout` and determine what it's waiting for
- [ ] 1.2 Replace UI waits with `waitForSelector('[data-testid="..."]')`
- [ ] 1.3 Replace API waits with `waitForResponse` or `waitForLoadState`
- [ ] 1.4 Run tests multiple times to verify stability
- [ ] 1.5 Update any remaining necessary waits with comments explaining why

## Dev Notes

### Timeout Analysis

| Line | Current | What It's Waiting For | Replacement |
|------|---------|----------------------|-------------|
| 76 | 500ms | Test user login complete | `waitForSelector('[data-testid="profile-avatar"]')` |
| 97 | 1000ms | Navigation complete | `waitForLoadState('networkidle')` |
| 103 | 500ms | Settings menu rendered | `waitForSelector('[data-testid="settings-menu-grupos"]')` |
| 118 | 1500ms | Group card loaded | `waitForSelector('[data-testid^="group-card-"]')` |
| 149 | 500ms | Toggle state change | `waitForSelector('[aria-checked="true"]')` |

### Example Refactor

```typescript
// Before
await page.click('[data-testid="test-user-alice"]');
await page.waitForTimeout(1000);

// After
await page.click('[data-testid="test-user-alice"]');
await page.waitForSelector('[data-testid="profile-avatar"]', { state: 'visible' });
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| CI reliability | Improved | Flaky tests possible |
| Effort | 1-2 hours | Accumulates with more E2E tests |

**Recommendation:** Address before adding more E2E tests to establish good patterns

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
- [E2E-TEST-CONVENTIONS.md](../../../../tests/e2e/E2E-TEST-CONVENTIONS.md) - E2E conventions
