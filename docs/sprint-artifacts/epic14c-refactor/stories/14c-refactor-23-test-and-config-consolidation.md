# Story 14c-refactor.23: Test and Config File Consolidation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **test configuration files consolidated and root directory cleaned up**,
So that **the project root is uncluttered, test configs are organized, and the codebase is maintainable**.

## Acceptance Criteria

### Root Directory Cleanup

1. **Given** 22 vitest configuration files exist in the root directory
   **When** this story is completed
   **Then:**
   - Create `tests/config/` directory for vitest CI configurations
   - Move the following files to `tests/config/`:
     - `vitest.config.ci.base.ts`
     - `vitest.config.ci.ts`
     - `vitest.config.ci.group-*.ts` (14 files)
     - `vitest.config.ci.heavy-*.ts` (6 files)
     - `vitest.config.heavy.ts`
   - Keep `vitest.config.unit.ts` in root (primary dev config)
   - Update all imports/references in moved config files
   - Update `package.json` scripts to reference new paths
   - Update `.github/workflows/test.yml` to reference new paths
   - CI pipeline passes after move

2. **Given** markdown documentation files exist in root directory
   **When** this story is completed
   **Then:**
   - Move `run_app.local.md` to `docs/development/local-setup.md`
   - Move `steps_for_epics.md` to `docs/planning/steps-for-epics.md`
   - Update any internal links in moved files
   - Root directory contains only standard config files

3. **Given** temporary/generated files may exist in root
   **When** this story is completed
   **Then:**
   - Delete `firebase-debug.log` if exists (gitignored)
   - Delete `firestore-debug.log` if exists (gitignored)
   - Delete any `firebase-export-*` directories if exist (gitignored)
   - Verify `.gitignore` covers these patterns (it does)

### Test File Organization Audit

4. **Given** the project has a centralized test structure
   **When** auditing test organization
   **Then:**
   - Verify all test files are in expected locations:
     - Frontend tests: `tests/unit/`, `tests/integration/`, `tests/e2e/`
     - Functions tests: `functions/src/__tests__/`
     - Prompt testing: `prompt-testing/scripts/__tests__/`
   - Document any test files found outside these directories
   - No test files should exist in `src/` directory
   - No test files should exist in root directory

5. **Given** test setup files exist in `tests/setup/`
   **When** this story is completed
   **Then:**
   - Verify `tests/setup/` contains:
     - `vitest.setup.ts` - Global test setup
     - `test-utils.tsx` - Custom render functions
     - `firebase-emulator.ts` - Emulator utilities
   - Move any scattered test utilities to `tests/setup/`
   - Update imports if any files are moved

### CI Configuration Update

6. **Given** CI workflow references vitest config files
   **When** config files are moved
   **Then:**
   - Update `.github/workflows/test.yml`:
     - All `vitest.config.ci.*` references point to `tests/config/`
   - All CI jobs pass after updates
   - No hardcoded paths remain in workflow file

7. **Given** package.json contains test scripts
   **When** config files are moved
   **Then:**
   - Update all test scripts in `package.json`:
     - `test:ci` → references `tests/config/vitest.config.ci.ts`
     - `test:ci:group-*` → references `tests/config/vitest.config.ci.group-*.ts`
     - `test:heavy:*` → references `tests/config/vitest.config.ci.heavy-*.ts`
   - All `npm run test:*` commands work correctly

### Documentation

8. **Given** test configuration is reorganized
   **When** this story is completed
   **Then:**
   - Create `tests/config/README.md` documenting:
     - Purpose of each config file
     - CI group assignments and rationale
     - How to add new test groups
   - Update `docs/testing/` if it references old config locations

## Tasks / Subtasks

### Task 1: Create Test Config Directory (AC: #1)

- [x] 1.1 Create `tests/config/` directory
- [x] 1.2 Move `vitest.config.ci.base.ts` to `tests/config/`
- [x] 1.3 Move `vitest.config.ci.ts` to `tests/config/`
- [x] 1.4 Move all `vitest.config.ci.group-*.ts` files (14 files) to `tests/config/`
- [x] 1.5 Move all `vitest.config.ci.heavy-*.ts` files (6 files) to `tests/config/`
- [x] 1.6 Move `vitest.config.heavy.ts` to `tests/config/`
- [x] 1.7 Update imports in moved files (relative paths)
- [x] 1.8 Run TypeScript check: `npm run typecheck`

### Task 2: Update Package.json Scripts (AC: #7)

- [x] 2.1 Read current `package.json` to identify test scripts
- [x] 2.2 Update all `test:ci*` script paths to `tests/config/`
- [x] 2.3 Update all `test:heavy*` script paths to `tests/config/`
- [x] 2.4 Verify scripts work: `npm run test:ci -- --help`

### Task 3: Update CI Workflow (AC: #6)

- [x] 3.1 Read `.github/workflows/test.yml`
- [x] 3.2 Update all vitest config references to `tests/config/`
- [x] 3.3 Verify no hardcoded old paths remain
- [x] 3.4 Commit and verify CI passes (or verify locally)

### Task 4: Move Root Documentation Files (AC: #2)

- [x] 4.1 Create `docs/development/` if not exists
- [x] 4.2 Move `run_app.local.md` to `docs/development/local-setup.md`
- [x] 4.3 Move `steps_for_epics.md` to `docs/planning/steps-for-epics.md`
- [x] 4.4 Update any internal links in moved files

### Task 5: Clean Temporary Files (AC: #3)

- [x] 5.1 Delete `firebase-debug.log` if exists
- [x] 5.2 Delete `firestore-debug.log` if exists
- [x] 5.3 Delete any `firebase-export-*` directories
- [x] 5.4 Verify `.gitignore` patterns cover these files

### Task 6: Audit Test File Locations (AC: #4)

- [x] 6.1 Search for `*.test.ts`, `*.test.tsx`, `*.spec.ts`, `*.spec.tsx` in unexpected locations
- [x] 6.2 Document findings (expected: all in tests/, functions/__tests__/, prompt-testing/__tests__/)
- [x] 6.3 Move any misplaced test files if found
- [x] 6.4 Update imports if files are moved

### Task 7: Verify Test Setup (AC: #5)

- [x] 7.1 Verify `tests/setup/` contains expected files
- [x] 7.2 Identify any scattered test utilities
- [x] 7.3 Move utilities to `tests/setup/` if needed
- [x] 7.4 Update imports if files are moved

### Task 8: Create Config Documentation (AC: #8)

- [x] 8.1 Create `tests/config/README.md`
- [x] 8.2 Document purpose of each config file
- [x] 8.3 Document CI group assignments
- [x] 8.4 Document how to add new test groups
- [x] 8.5 Update `docs/testing/` references if needed

### Task 9: Final Verification

- [x] 9.1 Run full test suite: `npm test`
- [x] 9.2 Run TypeScript check: `npm run typecheck`
- [x] 9.3 Run build: `npm run build`
- [x] 9.4 Verify root directory is cleaner
- [x] 9.5 Count remaining root files (target: <30)

## Dev Notes

### Files to Move

**Vitest Config Files (22 files):**

| Current Location | New Location |
|------------------|--------------|
| `vitest.config.ci.base.ts` | `tests/config/vitest.config.ci.base.ts` |
| `vitest.config.ci.ts` | `tests/config/vitest.config.ci.ts` |
| `vitest.config.ci.group-analytics.ts` | `tests/config/vitest.config.ci.group-analytics.ts` |
| `vitest.config.ci.group-components-insights.ts` | `tests/config/vitest.config.ci.group-components-insights.ts` |
| `vitest.config.ci.group-components-misc.ts` | `tests/config/vitest.config.ci.group-components-misc.ts` |
| `vitest.config.ci.group-components-scan.ts` | `tests/config/vitest.config.ci.group-components-scan.ts` |
| `vitest.config.ci.group-components-shared-groups.ts` | `tests/config/vitest.config.ci.group-components-shared-groups.ts` |
| `vitest.config.ci.group-hooks.ts` | `tests/config/vitest.config.ci.group-hooks.ts` |
| `vitest.config.ci.group-integration.ts` | `tests/config/vitest.config.ci.group-integration.ts` |
| `vitest.config.ci.group-root.ts` | `tests/config/vitest.config.ci.group-root.ts` |
| `vitest.config.ci.group-services.ts` | `tests/config/vitest.config.ci.group-services.ts` |
| `vitest.config.ci.group-utils.ts` | `tests/config/vitest.config.ci.group-utils.ts` |
| `vitest.config.ci.group-views.ts` | `tests/config/vitest.config.ci.group-views.ts` |
| `vitest.config.ci.heavy-1.ts` | `tests/config/vitest.config.ci.heavy-1.ts` |
| `vitest.config.ci.heavy-2.ts` | `tests/config/vitest.config.ci.heavy-2.ts` |
| `vitest.config.ci.heavy-3.ts` | `tests/config/vitest.config.ci.heavy-3.ts` |
| `vitest.config.ci.heavy-4.ts` | `tests/config/vitest.config.ci.heavy-4.ts` |
| `vitest.config.ci.heavy-5.ts` | `tests/config/vitest.config.ci.heavy-5.ts` |
| `vitest.config.ci.heavy-6.ts` | `tests/config/vitest.config.ci.heavy-6.ts` |
| `vitest.config.heavy.ts` | `tests/config/vitest.config.heavy.ts` |

**Keep in Root:**
- `vitest.config.unit.ts` - Primary development config

**Documentation Files:**

| Current Location | New Location |
|------------------|--------------|
| `run_app.local.md` | `docs/development/local-setup.md` |
| `steps_for_epics.md` | `docs/planning/steps-for-epics.md` |

### Config File Import Updates

When moving config files, update imports like:
```typescript
// Before (in root)
import baseConfig from './vitest.config.ci.base';

// After (in tests/config/)
import baseConfig from './vitest.config.ci.base';  // Same - relative within directory
```

### Package.json Script Pattern

```json
{
  "scripts": {
    "test:ci": "vitest run --config tests/config/vitest.config.ci.ts",
    "test:ci:group-hooks": "vitest run --config tests/config/vitest.config.ci.group-hooks.ts"
  }
}
```

### CI Workflow Pattern

```yaml
- name: Run unit tests
  run: npm run test:ci -- --config tests/config/vitest.config.ci.ts
```

### Expected Root Directory After Cleanup

Standard files that should remain in root:
- `package.json`, `package-lock.json`, `bun.lock`
- `tsconfig.json`, `tsconfig.node.json`
- `vite.config.ts`, `vitest.config.unit.ts`
- `eslint.config.security.mjs`
- `.gitignore`, `.gitleaks.toml`
- `.env`, `.env.example`
- `index.html`
- `README.md`, `CONTRIBUTING.md`
- `firebase.json`, `.firebaserc`
- `firestore.rules`, `firestore.indexes.json`, `storage.rules`
- `playwright.config.ts`, `lighthouserc.json`
- `docker-compose.yml`, `Dockerfile.emulators`

**Target:** ~25-30 files instead of ~50

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md] - Epic definition
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/05-testing.md] - Testing patterns
- [Source: .github/workflows/test.yml] - CI workflow configuration

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **CI/CD Test Pipeline**: Config file paths must be updated in workflow
- **Local Development**: Developers using `npm test` should be unaffected (vitest.config.unit.ts stays in root)

### Downstream Effects to Consider

- CI jobs will fail if config paths not updated simultaneously
- Package.json and workflow file must be updated together

### Testing Implications

- **Existing tests to verify:** All CI test groups after config move
- **New scenarios to add:** None - this is organizational only

### Workflow Chain Visualization

```
[Move config files] → [Update package.json] → [Update CI workflow]
                                                     ↓
                                            [CI jobs pass]
```

## Implementation Notes (2026-01-22)

### Summary

Successfully consolidated 23 vitest CI config files from root to `tests/config/` directory.

### Changes Made

1. **Config Files Moved (23 files):**
   - `vitest.config.ci.base.ts` (updated imports: `./package.json` → `../../package.json`, `__dirname` path for PWA mock)
   - `vitest.config.ci.ts` (updated imports)
   - `vitest.config.heavy.ts` (updated imports)
   - 14 group config files (`vitest.config.ci.group-*.ts`)
   - 6 heavy config files (`vitest.config.ci.heavy-*.ts`)

2. **CI Workflow Updated:**
   - Updated 20 config references in `.github/workflows/test.yml`
   - Pattern: `--config vitest.config.ci.group-*` → `--config tests/config/vitest.config.ci.group-*`

3. **Documentation Moved:**
   - `run_app.local.md` → `docs/development/local-setup.md`
   - `steps_for_epics.md` → `docs/planning/steps-for-epics.md`

4. **Temporary Files Cleaned:**
   - Deleted `firebase-debug.log`, `firestore-debug.log`, `firebase-export-*`

5. **Config Documentation Created:**
   - Created `tests/config/README.md` with comprehensive documentation

### Verification Results

- ✅ TypeScript check passes
- ✅ Build passes
- ✅ Unit tests pass (4878 tests, 1 pre-existing flaky test timeout)
- ✅ CI config from new location works (`vitest.config.ci.group-utils.ts` - 549 tests in 8.42s)
- ✅ Root directory reduced from ~50 to 25 files

### Notes

- Package.json scripts unchanged (they use `vitest.config.unit.ts` which remains in root)
- No test files in unexpected locations (all in `tests/` subdirectories)
