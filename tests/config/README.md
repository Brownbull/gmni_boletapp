# Test Configuration Files

This directory contains Vitest configuration files for CI/CD parallel test execution.

## Overview

Story 14.30.8 introduced explicit test groups to replace automatic Vitest sharding. This approach provides predictable, debuggable CI runs by explicitly defining which tests run in each parallel job.

## Configuration Files

### Base Configuration

| File | Purpose |
|------|---------|
| `vitest.config.ci.base.ts` | Shared base configuration with memory-safe execution settings. Provides `createGroupConfig()` and `createHeavyGroupConfig()` helpers. |
| `vitest.config.ci.ts` | Legacy CI config (kept for reference) |
| `vitest.config.heavy.ts` | Configuration for heavy test files (not used directly in CI) |

### Test Group Configurations

These configs define explicit test groups for parallel CI execution:

| File | Test Group | Description |
|------|------------|-------------|
| `vitest.config.ci.group-hooks-batch.ts` | hooks-batch | Batch processing hooks |
| `vitest.config.ci.group-hooks-scan.ts` | hooks-scan | Scan flow hooks |
| `vitest.config.ci.group-hooks-other.ts` | hooks-other | All other hooks (~5,400 lines) |
| `vitest.config.ci.group-services.ts` | services | Service layer tests |
| `vitest.config.ci.group-utils.ts` | utils | Utility function tests |
| `vitest.config.ci.group-analytics.ts` | analytics | Analytics component tests |
| `vitest.config.ci.group-views.ts` | views | View component tests |
| `vitest.config.ci.group-components-insights.ts` | components-insights | Insight components |
| `vitest.config.ci.group-components-scan.ts` | components-scan | Scan flow components |
| `vitest.config.ci.group-components-history.ts` | components-history | History view components |
| `vitest.config.ci.group-components-charts.ts` | components-charts | Chart components |
| `vitest.config.ci.group-components-forms.ts` | components-forms | Form components |
| `vitest.config.ci.group-components-celebrations.ts` | components-celebrations | Celebration/animation components |
| `vitest.config.ci.group-components-misc.ts` | components-misc | Remaining components |

### Heavy Test Configurations

Large test files (>500 lines) are isolated into dedicated CI jobs:

| File | Contents | Total Lines |
|------|----------|-------------|
| `vitest.config.ci.heavy-1.ts` | useScanStateMachine, useBatchReview | ~2,272 |
| `vitest.config.ci.heavy-2.ts` | Nav, insightEngineService | ~3,062 |
| `vitest.config.ci.heavy-3.ts` | insightGenerators, DrillDownCard, DrillDownGrid | ~3,133 |
| `vitest.config.ci.heavy-4.ts` | csvExport, SessionComplete, pendingScanStorage | ~2,646 |
| `vitest.config.ci.heavy-5.ts` | CategoryBreadcrumb, useBatchProcessing | ~1,418 |
| `vitest.config.ci.heavy-6.ts` | (Additional heavy files as needed) | Variable |

## How It Works

1. **Base Config**: `vitest.config.ci.base.ts` defines memory-safe execution settings:
   - `fileParallelism: false` - Prevents module cache bloat
   - `pool: 'forks'` - Isolates each test file
   - `maxWorkers: 2` - Balanced parallelism
   - Excludes all heavy test files

2. **Group Configs**: Each `vitest.config.ci.group-*.ts` uses `createGroupConfig()` to:
   - Include specific test patterns
   - Inherit heavy file exclusions
   - Optionally exclude overlapping tests

3. **Heavy Configs**: Each `vitest.config.ci.heavy-*.ts` uses `createHeavyGroupConfig()` to:
   - Include only specified heavy files
   - Run with `maxWorkers: 1` for memory safety
   - Skip the heavy file exclusion list

## Adding a New Test Group

1. Create a new config file:
   ```typescript
   import { defineConfig } from 'vitest/config'
   import { createGroupConfig } from './vitest.config.ci.base'

   export default defineConfig(createGroupConfig('my-group', [
     'tests/unit/my-module/**/*.test.{ts,tsx}',
   ]))
   ```

2. Add the new job to `.github/workflows/test.yml`:
   ```yaml
   test-my-group:
     needs: setup
     runs-on: ubuntu-latest
     steps:
       - name: Run my-group tests
         run: node --max-old-space-size=6144 node_modules/vitest/vitest.mjs run --config tests/config/vitest.config.ci.group-my-group.ts --coverage
   ```

3. Add the job to the dependency chain for `merge-coverage`

## CI Group Assignment Rationale

- **Hooks**: Split into batch, scan, and other to balance execution time
- **Components**: Split by functional area to isolate failures
- **Heavy files**: Isolated to prevent timeout and enable easy identification of slow tests

## Memory Optimization

The base config includes memory optimizations from Story 14.30.7:

- `fileParallelism: false` prevents Vitest parent process from accumulating ~4.5GB memory
- `pool: 'forks'` isolates each test file in separate process
- Heavy tests run with single worker to minimize memory overhead

Target: ~3-5 min per test group, total CI time ~6-8 min with 18 parallel jobs.

## References

- Story 14.30.8: Explicit test groups
- Story 14.30.7: Memory accumulation fix
- Story 14.30.6: Heavy test isolation
- Story 14c-refactor.23: Config file consolidation
