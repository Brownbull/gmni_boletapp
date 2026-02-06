# TD-CONSOLIDATED-16: Test Output Directory Consolidation

Status: ready-for-dev

> **Tier:** 2 - Infrastructure (DO NEXT AVAILABLE)
> **Priority:** LOW
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (path changes only, no logic changes)
> **Dependencies:** None

## Story

As a **developer**,
I want **all test output (coverage reports, Playwright reports) consolidated under a single `test-results/` directory**,
So that **the project has a clean, predictable output structure and `.gitignore` is simpler**.

## Problem Statement

Test output is currently scattered across multiple root-level directories:
- `coverage/` — Vitest coverage reports (HTML, JSON, LCOV)
- `playwright-report/` — Playwright HTML test reports
- `test-results/` — already exists for E2E screenshots

All three are gitignored separately. Consolidating under `test-results/` simplifies the structure:
```
test-results/
├── coverage/           # Vitest coverage output
├── playwright-report/  # Playwright HTML report
└── *.png               # E2E screenshots (already here)
```

## Acceptance Criteria

- [ ] Vitest coverage outputs to `test-results/coverage/` instead of `coverage/`
- [ ] Playwright HTML report outputs to `test-results/playwright-report/` instead of `playwright-report/`
- [ ] `.gitignore` updated: remove `coverage/` and `playwright-report/` entries, update `test-results/` comment
- [ ] CI workflow (`test.yml`) updated: all `coverage/` paths point to `test-results/coverage/`
- [ ] Documentation updated to reflect new paths
- [ ] All tests pass after path changes
- [ ] Old `coverage/` and `playwright-report/` directories can be deleted locally

## File Specification

### Configuration Files (MUST change)

| File | Change |
|------|--------|
| `vite.config.ts` | Add `reportsDirectory: './test-results/coverage'` to coverage block |
| `tests/config/vitest.config.ci.base.ts` | `'./coverage'` → `'./test-results/coverage'` |
| `tests/config/vitest.config.ci.ts` | `'./coverage'` → `'./test-results/coverage'` |
| `tests/config/vitest.config.heavy.ts` | `'./coverage'` → `'./test-results/coverage'` |
| `playwright.config.ts` | `['html']` → `['html', { outputFolder: 'test-results/playwright-report' }]` |

### .gitignore

| File | Change |
|------|--------|
| `.gitignore` | Remove `coverage/` line, remove `playwright-report/` line, update `test-results/` comment |

### CI Workflow (~26 line changes)

| File | Change |
|------|--------|
| `.github/workflows/test.yml` | All `coverage/coverage-final.json` → `test-results/coverage/coverage-final.json` (21 shard uploads + 5 merge-step references) |

### Documentation

| File | Change |
|------|--------|
| `CONTRIBUTING.md` | `coverage/index.html` → `test-results/coverage/index.html` (3 occurrences) |
| `docs/development/local-setup.md` | Update coverage paths and directory tree |
| `docs/testing/testing-guide.md` | Update coverage paths |
| `docs/ci-cd/debugging-guide.md` | `open coverage/index.html` → `open test-results/coverage/index.html` |
| `docs/ci-cd/ci-cd-guide.md` | Update artifact upload path |

### Scripts

| File | Change |
|------|--------|
| `scripts/testing/test-local.sh` | `coverage/index.html` → `test-results/coverage/index.html` (3 lines) |

## Tasks / Subtasks

### Task 1: Update test tool configurations
- [ ] Add `reportsDirectory: './test-results/coverage'` to `vite.config.ts` coverage block
- [ ] Update `tests/config/vitest.config.ci.base.ts` reportsDirectory
- [ ] Update `tests/config/vitest.config.ci.ts` reportsDirectory
- [ ] Update `tests/config/vitest.config.heavy.ts` reportsDirectory
- [ ] Add `outputFolder` to Playwright HTML reporter in `playwright.config.ts`

### Task 2: Update .gitignore
- [ ] Remove standalone `coverage/` entry
- [ ] Remove standalone `playwright-report/` entry
- [ ] Update `test-results/` comment from "Legacy" to "Test output (coverage, Playwright reports, E2E screenshots)"

### Task 3: Update CI workflow
- [ ] Update all 21 shard upload `path:` references in `test.yml`
- [ ] Update merge-coverage job paths (mkdir, nyc merge, report, upload, coverage-check)

### Task 4: Update documentation
- [ ] Update `CONTRIBUTING.md` coverage paths
- [ ] Update `docs/development/local-setup.md` coverage paths and directory tree
- [ ] Update `docs/testing/testing-guide.md` coverage paths
- [ ] Update `docs/ci-cd/debugging-guide.md` coverage paths
- [ ] Update `docs/ci-cd/ci-cd-guide.md` artifact upload path

### Task 5: Update scripts and verify
- [ ] Update `scripts/testing/test-local.sh` coverage paths
- [ ] Run `npm run test:coverage` to verify coverage outputs to new path
- [ ] Run `npx playwright test --project=staging` to verify report outputs to new path
- [ ] Delete old `coverage/` and `playwright-report/` directories locally

## Dev Notes

- `test-results/` is already in `.gitignore` (line 72) — the new subdirectories will automatically be ignored
- E2E screenshots already write to `test-results/*.png` — this consolidation aligns coverage and Playwright reports with that existing convention
- The CI workflow has the heaviest change burden (26 lines) but all changes are identical path substitutions
- No logic changes anywhere — purely path configuration
