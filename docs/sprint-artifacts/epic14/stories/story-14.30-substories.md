# Story 14.30 Sub-Stories: Testing Technical Debt Optimization

> **Created:** 2026-01-14
> **Updated:** 2026-01-14
> **Status:** P0 Items Implemented
> **Parent:** Story 14.30 (Test Technical Debt Cleanup)
> **Session:** Atlas + Architect + TEA collaborative analysis

---

## Context Summary

A comprehensive testing analysis was conducted involving:
- **Atlas** - Project Intelligence Guardian (testing documentation)
- **Winston (Architect)** - Architectural recommendations
- **Murat (TEA)** - Test architecture optimization

### Key Findings

| Issue | Impact | Root Cause |
|-------|--------|------------|
| Shard 2 timeout (15 min) | CI failures | Unbalanced test distribution |
| Coverage job redundancy | +14 min waste | Runs all 3,000+ tests twice |
| 6 emulator restarts | +3 min waste | Per-job emulator startup |
| npm ci slow | +60s | Could use Bun |

### Current CI Pipeline Timing

| Job | Actual | Target |
|-----|--------|--------|
| Shard 1 | 9 min | 3 min |
| Shard 2 | 15 min ⚠️ TIMEOUT | 3 min |
| Shard 3 | 1.3 min | 3 min |
| Coverage | 14 min | REMOVE |
| **Total** | ~20 min | ~6-8 min |

---

## Sub-Story 14.30.1: Remove Coverage Redundancy

**Priority:** P0 (Critical)
**Effort:** Small (1 point)
**Risk:** Low
**Status:** IMPLEMENTED

### Problem
The `test-coverage` job runs ALL 3,000+ tests again just to collect coverage, adding 14 minutes to CI.

### Solution
Merge coverage reports from existing shards instead of running tests twice.

### Tasks
- [x] Add `--coverage` flag to each shard job
- [x] Add coverage artifact upload to each shard
- [x] Create `merge-coverage` job that combines shard coverage
- [x] Remove standalone `test-coverage` job
- [x] Update PR coverage reporting to use merged data

### Implementation Notes
```yaml
# Each shard adds:
- run: vitest --coverage --shard=1/5
- uses: actions/upload-artifact@v4
  with:
    name: coverage-shard-1
    path: coverage/coverage-final.json

# New merge job:
merge-coverage:
  needs: [test-unit-1, test-unit-2, ...]
  steps:
    - uses: actions/download-artifact@v4
    - run: npx nyc merge coverage-shard-* merged-coverage.json
```

### Acceptance Criteria
- [x] Coverage data collected from shards
- [x] Single merged coverage report generated
- [x] PR coverage comment works with merged data
- [x] test-coverage job removed
- [x] CI time reduced by 10-14 minutes

---

## Sub-Story 14.30.2: Rebalance Test Shards

**Priority:** P0 (Critical)
**Effort:** Medium (2 points)
**Risk:** Low
**Status:** IMPLEMENTED

### Problem
Current 3 shards are severely imbalanced:
- Shard 1: 9 min
- Shard 2: 15 min (TIMEOUT)
- Shard 3: 1.3 min

### Solution
Increase to 5 balanced shards, each targeting ~3 minutes.

### Tasks
- [x] Increase shard count from 3 to 5
- [x] Update workflow to use 5 parallel shard jobs
- [x] Update test-unit aggregator for 5 shards
- [ ] Collect test timing data with `--reporter=json` (post-implementation)
- [ ] Analyze which test files are heaviest (post-implementation)
- [ ] Verify balanced distribution (post-implementation)

### Implementation Notes
```yaml
# Change from --shard=1/3 to --shard=1/5
# Add two more shard jobs (test-unit-4, test-unit-5)
# Update test-unit needs: [test-unit-1..5]
```

### Acceptance Criteria
- [x] 5 shard jobs configured
- [ ] Each shard completes in ~3 minutes (verify after CI run)
- [ ] No shard exceeds 5 minutes (verify after CI run)
- [ ] Total unit test time reduced to ~5 min (parallel)

---

## Sub-Story 14.30.3: Bun Package Installation

**Priority:** P1 (High)
**Effort:** Small (1 point)
**Risk:** Low

### Problem
`npm ci` takes ~60 seconds. Bun install is 10-20x faster.

### Solution
Replace `npm ci` with `bun install` in CI setup job.

### Tasks
- [ ] Add `setup-bun` action to workflow
- [ ] Replace `npm ci` with `bun install`
- [ ] Keep `npm` for running scripts (compatibility)
- [ ] Verify all dependencies install correctly
- [ ] Update cache key for bun.lockb

### Implementation Notes
```yaml
- uses: oven-sh/setup-bun@v1
- run: bun install --frozen-lockfile
# Scripts still use npm run (safer)
```

### Acceptance Criteria
- [ ] Bun installs dependencies successfully
- [ ] All tests still pass
- [ ] Setup job reduced by 30-60 seconds
- [ ] No changes to package.json scripts

---

## Sub-Story 14.30.4: Split Pure vs Firebase Unit Tests

**Priority:** P2 (Medium)
**Effort:** Medium (3 points)
**Risk:** Medium

### Problem
All unit tests require Firebase emulator startup, even pure function tests.

### Solution
Split unit tests into two categories:
1. **Pure tests** - No emulator needed (utils, formatters, calculations)
2. **Firebase tests** - Needs emulator (services, some hooks)

### Tasks
- [ ] Audit unit tests to identify Firebase dependencies
- [ ] Create `tests/unit-pure/` directory
- [ ] Move pure tests to new directory
- [ ] Create `vitest.config.pure.ts` (no emulator setup)
- [ ] Add `test-unit-pure` CI job (no emulator, fast)
- [ ] Update existing unit test config to only run Firebase tests

### Identification Command
```bash
grep -l "firebase\|firestore\|FIRESTORE_EMULATOR" tests/unit/**/*.test.ts
```

### Expected Split
- **Pure tests:** ~50% of tests (utils, formatters, types)
- **Firebase tests:** ~50% of tests (services, hooks with Firestore)

### Acceptance Criteria
- [ ] Pure tests run without emulator
- [ ] Firebase tests run with emulator
- [ ] Local dev: `npm run test:pure` runs in <30s
- [ ] CI: Pure tests complete in ~1 min
- [ ] All tests still pass

---

## Sub-Story 14.30.5: Prompt Test Consolidation

**Priority:** P3 (Low)
**Effort:** Small (1 point)
**Risk:** Low
**Status:** PARTIALLY IMPLEMENTED

### Problem
Prompt tests existed in 3 locations:
1. `shared/prompts/__tests__/` (62 tests) - **STALE/DEAD CODE**
2. `prompt-testing/prompts/__tests__/` (72 tests) - **SOURCE OF TRUTH**
3. `functions/src/prompts/__tests__/` (skipped due to module resolution)

### Analysis Results (2026-01-14)

**Key Discovery:** `shared/prompts/` is entirely dead code!
- Production uses `PROMPT_V3` from `functions/src/prompts/`
- `functions/prebuild` copies from `prompt-testing/prompts/` NOT `shared/prompts/`
- `shared/prompts/` still had `ACTIVE_PROMPT = PROMPT_V1` (stale)
- No code anywhere imports from `shared/prompts/`

**Architecture:**
```
prompt-testing/prompts/  →  (prebuild copy)  →  functions/src/prompts/
     V1, V2, V3                                    V1, V2, V3
     72 tests                                      (skipped tests)

shared/prompts/  ← DEAD CODE - not used anywhere
     V1, V2 only
     62 tests (DELETED)
```

### Tasks Completed
- [x] Analyzed overlap between test locations
- [x] Discovered `shared/prompts/` is dead code
- [x] Deleted `shared/prompts/__tests__/` (62 duplicate tests)

### Tasks Remaining
- [ ] Consider deleting entire `shared/prompts/` directory
- [ ] Fix `functions/src/prompts/__tests__/` module resolution (optional)
- [ ] Update documentation referencing `shared/prompts/`

### Acceptance Criteria
- [x] Duplicate tests removed (62 tests from shared/prompts/__tests__/)
- [x] Single prompt test location identified (`prompt-testing/prompts/__tests__/`)
- [x] All prompt versions covered (V1, V2, V3 in prompt-testing)
- [ ] Dead code cleanup (shared/prompts/ directory)

---

## Implementation Order

```
Phase 1 (Immediate - unblock CI):
├── 14.30.1 Remove coverage redundancy
└── 14.30.2 Rebalance to 5 shards

Phase 2 (Quick wins):
└── 14.30.3 Bun package installation

Phase 3 (Optimization):
├── 14.30.4 Split pure vs Firebase tests
└── 14.30.5 Prompt test consolidation
```

---

## References

- [Testing Architecture Documentation](../../architecture/testing-architecture.md)
- [CI/CD Pipeline Diagram](../../excalidraw-diagrams/ci-cd-testing-architecture.excalidraw)
- [Current CI Workflow](.github/workflows/test.yml)

---

## Session Notes

### TEA (Murat) Key Recommendations
1. **Kill coverage job** - "Testing theater" running tests twice
2. **Shard imbalance is a symptom** - Vitest sharding doesn't account for file weight
3. **Bun install: Yes, Bun test: No** - Install is safe, test runner migration is risky

### Architect (Winston) Key Recommendations
1. **Emulator problem is architectural** - Coupling test architecture to infrastructure
2. **Two-tier unit test architecture** - Pure vs Firebase separation
3. **Boring technology principle** - Simple solutions that work

### Risk Assessment

| Action | Risk | Notes |
|--------|------|-------|
| Remove coverage job | LOW | Same tests, different collection method |
| Increase shards to 5 | LOW | More parallelism, same tests |
| Bun install | LOW | Proven at Anthropic scale |
| Split pure/firebase | MEDIUM | Requires test file migration |
| Bun test runner | HIGH | Not recommended - keep Vitest |
