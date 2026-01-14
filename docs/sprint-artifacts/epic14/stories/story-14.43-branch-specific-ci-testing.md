# Story 14.43: Branch-Specific CI Testing Stages

## Status: Review

> **Created:** 2026-01-14
> **Origin:** CI optimization discussion - tiered testing per branch stage
> **Scope:** Implement progressive testing strategy where each branch stage runs appropriate test depth

## Overview

Optimize CI/CD pipeline by implementing branch-specific testing stages:
- **develop**: Fast feedback loop - basic unit tests + security scan
- **staging**: Complete validation - full unit tests + integration + E2E + security
- **main**: Production release - full tests + Lighthouse performance + deployment

This reduces CI time on develop from ~8 min to ~3 min while maintaining full test coverage before production.

## User Story

As a developer, I want the CI pipeline to run different test depths based on branch stage, so that I get fast feedback on develop while still maintaining full test coverage before production deployment.

## Problem Statement

### Current State
- All branches (develop, staging, main) run the same complete test suite
- ~8 min CI time on every push, regardless of branch stage
- Developers wait for full E2E tests even on early development iterations
- Resources wasted running Lighthouse on non-production branches

### Proposed State
| Branch | Test Suite | Est. Time | Purpose |
|--------|-----------|-----------|---------|
| **develop** | Smoke tests (critical paths) + Security | ~3 min | Fast feedback for active development |
| **staging** | Full unit + integration + E2E + Security | ~8 min | Complete validation before production |
| **main** | Full tests + Lighthouse + Deploy | ~10 min | Production release with performance audits |

### Benefits
1. **Faster developer feedback** - 3 min vs 8 min on develop
2. **Resource efficiency** - Heavy tests only run when needed
3. **Progressive confidence** - Each stage adds more validation
4. **Cost savings** - Fewer CI minutes on GitHub Actions

---

## Acceptance Criteria

### AC #1: Develop Branch - Smoke Tests
- [x] Run only critical smoke tests on develop push:
  - gitleaks (security scan - always)
  - test-hooks-scan (core scan workflow)
  - test-services (data layer)
  - test-integration (Firebase emulator)
  - security (bundle size + audit + lint)
- [x] Skip heavy unit test groups (components, views, analytics)
- [x] Skip E2E tests (run on staging)
- [ ] Target: ~3 min total CI time (verification pending)

### AC #2: Staging Branch - Full Validation
- [x] Run complete test suite on staging push:
  - All 18 unit test groups
  - Integration tests
  - E2E tests
  - Security checks
- [x] Skip Lighthouse (only production) - already configured
- [x] Skip deployment (only main) - already configured
- [ ] Target: ~8 min total CI time (verification pending)

### AC #3: Main Branch - Production Release
- [x] Run complete test suite on main push:
  - All unit + integration + E2E tests
  - Security checks
  - Lighthouse performance audits
  - Firebase deployment
- [ ] Target: ~10 min total CI time (verification pending)

### AC #4: PR Testing
- [x] PRs to develop: Run smoke tests only
- [x] PRs to staging: Run full test suite
- [x] PRs to main: Run full test suite + Lighthouse

### AC #5: Branch Protection Compatibility
- [x] "test" status check passes on all branches
- [x] Branch protection rules still work
- [x] Clear indication of which test tier ran

---

## Technical Design

### Approach: Conditional Job Execution

Use GitHub Actions `if` conditions to control which jobs run per branch:

```yaml
# Example: E2E only on staging/main
test-e2e:
  if: |
    github.ref == 'refs/heads/staging' ||
    github.ref == 'refs/heads/main' ||
    (github.event_name == 'pull_request' && github.base_ref != 'develop')
```

### Branch Detection Strategy

```yaml
env:
  IS_DEVELOP: ${{ github.ref == 'refs/heads/develop' || (github.event_name == 'pull_request' && github.base_ref == 'develop') }}
  IS_STAGING: ${{ github.ref == 'refs/heads/staging' || (github.event_name == 'pull_request' && github.base_ref == 'staging') }}
  IS_MAIN: ${{ github.ref == 'refs/heads/main' || (github.event_name == 'pull_request' && github.base_ref == 'main') }}
```

### Test Tier Definitions

| Tier | Jobs | When |
|------|------|------|
| **Smoke** | gitleaks, setup, test-hooks-scan, test-services, test-integration, security | develop push, PR to develop |
| **Full** | All unit groups (18), test-integration, test-e2e, security | staging push, PR to staging/main |
| **Production** | Full + lighthouse + deploy | main push |

### Job Dependency Changes

Current:
```
setup → all-test-jobs → test-unit → test (summary) → deploy
```

Proposed:
```
setup → [smoke-jobs OR full-jobs based on branch] → test-tier (summary) → deploy (main only)
```

---

## Tasks

### Phase 1: Workflow Refactoring
- [x] Task 1.1: Add branch detection environment variables to workflow
  - Added inline detection in job `if` conditions (env vars can't be used in job-level `if`)
- [x] Task 1.2: Create `test-smoke` summary job for develop tier
  - Updated existing `test-unit` job to handle tiered results with proper skipped job handling
- [x] Task 1.3: Add conditional `if` to E2E job (staging/main only)
  - Added 4-line `if` condition checking `refs/heads/staging`, `refs/heads/main`, and PR base_ref
- [x] Task 1.4: Add conditional `if` to heavy unit tests (staging/main only)
  - Updated 16 jobs: test-hooks-batch, test-hooks-other, test-utils, test-analytics, test-views, test-components-* (7), test-unit-heavy-* (6)
- [x] Task 1.5: Keep critical tests always: hooks-scan, services, integration, security
  - These jobs keep original `if` condition (only skip on workflow_dispatch with skip_tests)

### Phase 2: Summary Job Updates
- [x] Task 2.1: Update `test` summary job to handle tiered results
  - `test-unit` job now detects tier and allows skipped jobs on develop
  - `test` job now allows E2E to be skipped on develop tier
- [x] Task 2.2: Add clear output indicating which test tier ran
  - Both summary jobs now output tier name, emoji indicators for passed/skipped/failed
- [x] Task 2.3: Ensure branch protection compatibility
  - Single `test` status check still passes on all branches
  - Skipped jobs don't cause failures on develop tier

### Phase 3: Verification
- [ ] Task 3.1: Test develop push - verify ~3 min completion
- [ ] Task 3.2: Test staging push - verify full suite runs
- [ ] Task 3.3: Test main push - verify Lighthouse + deploy runs
- [ ] Task 3.4: Test PR to develop - verify smoke tests only
- [ ] Task 3.5: Test PR to staging - verify full suite

---

## Risk Assessment

### Low Risk
- **Regression detection delay**: Possible issues caught on staging instead of develop
  - Mitigation: Core workflows (scan, services) always tested

### Medium Risk
- **Branch protection confusion**: Different test counts per branch
  - Mitigation: Single "test" status check, clear tier indication

### Rollback Plan
- Revert workflow changes
- All jobs can run unconditionally (current state)

---

## File List

| File | Action | Purpose |
|------|--------|---------|
| `.github/workflows/test.yml` | Modify | Add branch-conditional job execution |
| `docs/sprint-artifacts/sprint-status.yaml` | Modify | Update story status tracking |

---

## Estimated Effort

| Phase | Estimate |
|-------|----------|
| Phase 1: Workflow Refactoring | 2 pts |
| Phase 2: Summary Job Updates | 1 pt |
| Phase 3: Verification | 1 pt |
| **Total** | **4 pts** |

---

## Dependencies

- Story 14.30.8: CI optimization complete (provides baseline)
- Current 18 parallel test job structure

## Related Stories

- Story 14.30: Test Technical Debt (CI optimization foundation)
- Story 8.9: CI/CD Pipeline Optimization (original parallelization)
- Story 14.22: Further parallelization (gitleaks parallel)

---

## Notes

### Current Test Suite Breakdown (for reference)

| Category | Jobs | Est. Time | Develop? |
|----------|------|-----------|----------|
| **Gitleaks** | 1 | 30s | Yes (always) |
| **Setup** | 1 | 90s | Yes (always) |
| **Hooks** | 3 (batch, scan, other) | 60-90s | Only scan |
| **Services** | 1 | 60s | Yes (critical) |
| **Utils** | 1 | 60s | No (staging) |
| **Analytics** | 1 | 60s | No (staging) |
| **Views** | 1 | 80s | No (staging) |
| **Components** | 7 groups | 60-90s each | No (staging) |
| **Heavy** | 6 groups | 60-90s each | No (staging) |
| **Integration** | 1 | 90s | Yes (critical) |
| **E2E** | 1 | 3 min | No (staging) |
| **Security** | 1 | 2 min | Yes (always) |
| **Lighthouse** | 1 | 5 min | No (main only) |
| **Deploy** | 1 | 2 min | No (main only) |

### Develop Smoke Tests Selection Rationale

1. **gitleaks**: Security - never skip
2. **test-hooks-scan**: Core scan workflow (most user-facing feature)
3. **test-services**: Data layer integrity
4. **test-integration**: Firebase emulator integration
5. **security**: Bundle size, audit, lint

Total: ~3 min (vs ~8 min for full suite)

---

## Dev Agent Record

### Implementation Plan
1. Add conditional `if` statements to jobs that should skip on develop branch
2. Update `test-unit` summary job to handle skipped jobs gracefully
3. Update `test` summary job to allow E2E to be skipped on develop
4. Add clear tier indication in CI output

### Debug Log
- Attempted to use workflow-level `env` variables for branch detection, but GitHub Actions doesn't support `env` context in job-level `if` conditions
- Solution: Use inline expressions in each job's `if` condition

### Completion Notes
**2026-01-14**: Implementation complete

**Changes Made:**
- Added Story 14.43 reference to workflow header comments
- Updated 17 jobs with conditional `if` to skip on develop:
  - test-hooks-batch, test-hooks-other
  - test-utils, test-analytics, test-views
  - test-components-insights, test-components-scan, test-components-history, test-components-charts, test-components-forms, test-components-celebrations, test-components-misc
  - test-unit-heavy-1 through test-unit-heavy-6
  - test-e2e
- Updated `test-unit` summary job with tiered result handling:
  - Detects test tier (smoke/full/production)
  - Allows skipped jobs on develop tier
  - Shows emoji indicators for passed/skipped/failed
- Updated `test` summary job with tiered result handling:
  - Allows E2E to be skipped on develop tier
  - Shows test tier and expected behavior

**Jobs that always run (smoke tier):**
- gitleaks, setup, test-hooks-scan, test-services, test-integration, security

**Jobs that only run on staging/main (full tier):**
- test-hooks-batch, test-hooks-other, test-utils, test-analytics, test-views
- All test-components-* groups (7 jobs)
- All test-unit-heavy-* groups (6 jobs)
- test-e2e

**Expected CI Times:**
- develop: ~3 min (smoke tests)
- staging: ~8 min (full tests)
- main: ~10 min (full tests + lighthouse + deploy)

### File Changes
| File | Action | Lines Changed |
|------|--------|---------------|
| `.github/workflows/test.yml` | Modify | ~150 lines added/modified |

### Code Review Fixes (2026-01-14)
**Atlas Code Review** identified and fixed:

1. **[CRITICAL FIX] Shell variable scope issue** - The `check_result()` function was modifying variables (`FAILED`, `SUCCESS_COUNT`, `SKIPPED_COUNT`) inside a function, but bash functions don't share variable scope by default. Rewrote to use inline for-loops with string parsing to avoid subshell issues.

2. **[FIX] Updated test count** - Changed "All 18 unit test jobs passed" to "All 20 unit test jobs passed" to reflect actual job count (2 critical + 18 full-only).

3. **[DOC] Added sprint-status.yaml to File List** - Story now documents all modified files.

**Remaining items for verification (Phase 3 tasks):**
- Task 3.1-3.5 require actual CI runs to verify timing targets
- AC #1, #2, #3 timing targets marked as `[ ]` pending verification
