# Story 8.3: Test Harness Core CLI

Status: done

## Story

As a **developer**,
I want **a CLI tool to run scan tests against the Cloud Function**,
So that **I can measure receipt scanning accuracy with various filtering options**.

## Acceptance Criteria

1. **AC1: CLI Execution** - `npm run test:scan` executes without errors and produces output

2. **AC2: Default Limit** - Default limit of 5 tests applied when no `--limit` flag provided (ADR-012 cost protection)

3. **AC3: Single Image Test** - `--image=filename.jpg` runs a single specific test case

4. **AC4: Store Type Filter** - `--type=supermarket` filters tests to only that store type

5. **AC5: Limit Override** - `--limit=N` overrides the default limit; `--limit=all` runs all tests

6. **AC6: Verbose Output** - `--verbose` shows detailed per-test output including field comparisons

7. **AC7: Dry Run Mode** - `--dry-run` shows what would run without making API calls

8. **AC8: Exit Codes** - Exit code 0 for all pass, 1 for test failures, 2 for errors

9. **AC9: Cloud Function Connection** - CLI successfully calls the `analyzeReceipt` Cloud Function with proper authentication

## Tasks / Subtasks

- [x] **Task 1: Create CLI scaffold with Commander** (AC: #1)
  - [x] Create `scripts/scan-test/index.ts` as CLI entry point
  - [x] Set up Commander with `run` as default command
  - [x] Add npm script: `"test:scan": "tsx scripts/scan-test/index.ts run"`
  - [x] Create `scripts/scan-test/commands/run.ts` for run command logic

- [x] **Task 2: Implement CLI flags** (AC: #2, #3, #4, #5, #6, #7)
  - [x] Add `--image` flag for single image test
  - [x] Add `--type` flag for store type filter (enum validation)
  - [x] Add `--limit` flag with default of 5, support for 'all'
  - [x] Add `--verbose` flag for detailed output
  - [x] Add `--dry-run` flag to skip API calls
  - [x] Add `--folder` flag for custom test data location

- [x] **Task 3: Create config.ts** (AC: #2)
  - [x] Create `scripts/scan-test/config.ts`
  - [x] Define `CONFIG` object with testDataDir, resultsDir, defaultLimit
  - [x] Define accuracy thresholds (total, date, merchant, itemsCount, itemPrices)
  - [x] Add estimatedCostPerScan constant

- [x] **Task 4: Implement test case discovery** (AC: #3, #4)
  - [x] Create `scripts/scan-test/lib/discovery.ts`
  - [x] Implement `discoverTestCases(options)` function
  - [x] Scan `test-data/receipts/` for image + expected.json pairs
  - [x] Apply `--type` filter if specified
  - [x] Apply `--image` filter for single test mode
  - [x] Return array of test case paths

- [x] **Task 5: Implement Cloud Function scanner** (AC: #9)
  - [x] Create `scripts/scan-test/lib/scanner.ts`
  - [x] Implement `scanReceipt(imageBuffer: Buffer): Promise<ScanResult>`
  - [x] Get Cloud Function URL from firebase.json or environment
  - [x] Get auth token (user token for local, service account for CI)
  - [x] Handle API errors with retry logic
  - [x] Handle rate limiting (wait 30s and retry)

- [x] **Task 6: Implement run command flow** (AC: #1, #2, #7, #8)
  - [x] Load and validate test cases
  - [x] Apply limit (default 5)
  - [x] If dry-run: display plan and exit
  - [x] For each test: load image, call scanner (if not dry-run)
  - [x] Collect results into array
  - [x] Set appropriate exit code

- [x] **Task 7: Implement basic console output** (AC: #1, #6)
  - [x] Create `scripts/scan-test/lib/reporter.ts` (basic version)
  - [x] Implement progress display during test run
  - [x] Implement summary output (tests run, passed, failed)
  - [x] Implement verbose output with per-test details
  - [x] Use chalk for colored output (✓ green, ✗ red, ⚠ yellow)

- [x] **Task 8: Add npm scripts to package.json** (AC: #1)
  - [x] Add `"test:scan": "tsx scripts/scan-test/index.ts run"`
  - [x] Verify tsx is installed (should be in devDependencies)
  - [x] Add commander dependency if not present

- [x] **Task 9: CLI integration tests** (AC: #1, #7, #8)
  - [x] Create `scripts/scan-test/__tests__/cli.test.ts`
  - [x] Test `--dry-run` mode produces expected output
  - [x] Test `--limit` flag is respected
  - [x] Test `--type` filter works correctly
  - [x] Test exit code 2 for invalid arguments

## Dev Notes

### Architecture Patterns and Constraints

**ADR-012: Default Test Limit of 5** (from architecture-epic8.md)
- Each test costs ~$0.01 API call; prevent accidental cost spikes
- Override available with `--limit=N` or `--limit=all`

**CLI Command Structure:**
```bash
npm run test:scan                           # Default: 5 tests, active prompt
npm run test:scan -- --image=jumbo-001.jpg  # Single test
npm run test:scan -- --type=supermarket     # Filter by store type
npm run test:scan -- --limit=20             # Override limit
npm run test:scan -- --limit=all            # All tests
npm run test:scan -- --verbose              # Detailed output
npm run test:scan -- --dry-run              # No API calls
```

**File Structure:**
```
scripts/scan-test/
├── index.ts              # CLI entry (Commander setup)
├── config.ts             # Configuration constants
├── commands/
│   └── run.ts            # Run command implementation
└── lib/
    ├── scanner.ts        # Cloud Function caller
    ├── discovery.ts      # Test case finder
    └── reporter.ts       # Console output (basic)
```

### Authentication Flow

```typescript
async function getAuthToken(): Promise<string> {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return getServiceAccountToken(); // CI
  }
  return getUserToken(); // Local: firebase login
}
```

### Dependencies

**New dependencies to add:**
- `commander` - CLI argument parsing (or `yargs`)
- `string-similarity` - For merchant fuzzy matching (used in later stories)
- `chalk` - Colored console output

**Existing dependencies used:**
- `tsx` - Run TypeScript directly
- `firebase-admin` - Service account auth

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All tests passed |
| 1 | One or more test failures |
| 2 | Error (invalid args, API error, etc.) |

### Console Output Example

```
🔬 Scan Test Harness
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Running 5 tests (limit: 5, type: all)

● [1/5] supermarket/jumbo-001.jpg
● [2/5] supermarket/lider-001.jpg
✓ [3/5] pharmacy/cruz-verde-001.jpg
✗ [4/5] restaurant/dominos-001.jpg
● [5/5] gas-station/copec-001.jpg

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Summary: 4/5 passed (80%)

Failed tests:
  ✗ restaurant/dominos-001.jpg
    - total: expected 15990, got 13440
```

### References

- [Source: docs/sprint-artifacts/epic8/architecture-epic8.md#CLI-Commands]
- [Source: docs/sprint-artifacts/epic8/tech-spec-epic-8.md#AC3-CLI-Scaffold-Run-Command]
- [Source: docs/sprint-artifacts/epic8/architecture-epic8.md#ADR-012-Default-Test-Limit]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted from Epic 8 tech spec | SM Agent |
| 2025-12-11 | Senior Developer Review notes appended - APPROVED | Gabe |

## Dev Agent Record

### Context Reference

- `docs/sprint-artifacts/epic8/story-8.3-context.xml`

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- All 660 existing tests pass (`npm run test:quick`)
- 48 new CLI tests pass (`npm run test:scan:self-test`)
- CLI help works: `npm run test:scan -- --help`
- Dry-run mode works: `npm run test:scan -- --dry-run`

### Completion Notes List

1. Created CLI scaffold using Commander with `run` as default command
2. Implemented all CLI flags: --image, --type, --limit, --verbose, --dry-run, --folder
3. Created config.ts with thresholds from PRD (total 98%, date 95%, merchant 90%, etc.)
4. Implemented test case discovery with store type filtering and sorting
5. Implemented Cloud Function scanner with Firebase Auth integration
6. Implemented run command flow with dry-run support
7. Created reporter.ts with chalk-colored console output
8. Added npm scripts: test:scan and test:scan:self-test
9. Created 19 CLI integration tests covering discovery, config, exit codes

### File List

**New Files Created:**
- `scripts/scan-test/index.ts` - CLI entry point with Commander
- `scripts/scan-test/config.ts` - Configuration and thresholds
- `scripts/scan-test/commands/run.ts` - Run command implementation
- `scripts/scan-test/lib/discovery.ts` - Test case discovery
- `scripts/scan-test/lib/scanner.ts` - Cloud Function caller
- `scripts/scan-test/lib/reporter.ts` - Console output utilities
- `scripts/scan-test/__tests__/cli.test.ts` - CLI integration tests

**Modified Files:**
- `package.json` - Added npm scripts and dependencies (commander, chalk)

---

## Senior Developer Review (AI)

### Reviewer
Gabe

### Date
2025-12-11

### Outcome
**APPROVE** - All acceptance criteria implemented with evidence, all tasks verified complete, no blocking issues.

### Summary
Story 8.3 successfully implements a comprehensive CLI test harness for receipt scanning evaluation. The implementation follows Epic 8 architecture patterns (ADR-010, ADR-011, ADR-012), includes 48 new tests, and maintains full type safety with TypeScript and Zod schema validation.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

**LOW Severity (Advisory):**
- Hardcoded Firebase config in scanner.ts is acceptable for CLI tooling but could be extracted to config in future

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | CLI Execution | IMPLEMENTED | `scripts/scan-test/index.ts:19-45`, `package.json:35` |
| AC2 | Default Limit of 5 | IMPLEMENTED | `scripts/scan-test/config.ts:49` - `defaultLimit: 5` |
| AC3 | Single Image Test | IMPLEMENTED | `scripts/scan-test/index.ts:30`, `scripts/scan-test/lib/discovery.ts:131-139` |
| AC4 | Store Type Filter | IMPLEMENTED | `scripts/scan-test/index.ts:31`, `scripts/scan-test/lib/discovery.ts:105-108` |
| AC5 | Limit Override | IMPLEMENTED | `scripts/scan-test/commands/run.ts:145-158` |
| AC6 | Verbose Output | IMPLEMENTED | `scripts/scan-test/lib/reporter.ts:158-162` |
| AC7 | Dry Run Mode | IMPLEMENTED | `scripts/scan-test/commands/run.ts:95-98` |
| AC8 | Exit Codes | IMPLEMENTED | `scripts/scan-test/config.ts:152-156` |
| AC9 | Cloud Function Connection | IMPLEMENTED | `scripts/scan-test/lib/scanner.ts:181-246` |

**Summary: 9 of 9 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: CLI scaffold | Complete | VERIFIED | `index.ts`, `run.ts` created |
| Task 2: CLI flags | Complete | VERIFIED | All 6 flags in `index.ts:30-35` |
| Task 3: config.ts | Complete | VERIFIED | 157 lines with thresholds |
| Task 4: Discovery | Complete | VERIFIED | `discovery.ts` 229 lines |
| Task 5: Scanner | Complete | VERIFIED | `scanner.ts` 293 lines |
| Task 6: Run command | Complete | VERIFIED | `run.ts` 517 lines |
| Task 7: Reporter | Complete | VERIFIED | `reporter.ts` 249 lines |
| Task 8: npm scripts | Complete | VERIFIED | `package.json:35-36` |
| Task 9: CLI tests | Complete | VERIFIED | `cli.test.ts` 311 lines |

**Summary: 9 of 9 completed tasks verified, 0 falsely marked complete**

### Test Coverage and Gaps

- **48 new tests** for CLI infrastructure (all passing)
- **660 existing tests** still passing
- **Type-check** passes
- Coverage includes: discovery, schema validation, config, exit codes, limit application

### Architectural Alignment

- ADR-010 (Shared Prompts): CLI designed to work with `ACTIVE_PROMPT`
- ADR-011 (Corrections-Based Ground Truth): Schema fully implements aiExtraction + corrections pattern
- ADR-012 (Default Test Limit): `defaultLimit: 5` correctly implemented

**No architecture violations detected.**

### Security Notes

- Firebase Auth with environment variables for credentials
- No secrets exposed (Firebase web config is public)
- Proper credential handling via `SCAN_TEST_EMAIL` and `SCAN_TEST_PASSWORD`

### Best-Practices and References

- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Chalk v5 ESM Migration](https://github.com/chalk/chalk)
- [Zod Schema Validation](https://zod.dev/)

### Action Items

**Code Changes Required:**
- None required

**Advisory Notes:**
- Note: Consider extracting Firebase config to shared config file in future stories
- Note: The `test:scan:self-test` script is correctly implemented - tests pass
