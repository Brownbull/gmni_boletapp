# Story 8.6: Generate & Validate Commands

Status: review

## Story

As a **developer**,
I want **CLI commands to generate expected.json files and validate existing ones**,
So that **I can easily create new test cases and ensure all test data is valid**.

## Acceptance Criteria

1. **AC1: Generate Command** - `npm run test:scan:generate -- --image=file.jpg` creates an expected.json file

2. **AC2: AI Extraction Populated** - Generated file includes `aiExtraction` populated from Cloud Function response

3. **AC3: Empty Corrections** - Generated file has empty `corrections` object ready for human review

4. **AC4: Metadata Auto-Fill** - Generated file includes auto-filled metadata:
   - `testId` derived from filename
   - `storeType` derived from folder
   - `difficulty` defaults to "medium"
   - `source` defaults to "manual-collection"
   - `addedAt` set to current timestamp

5. **AC5: Validate Command** - `npm run test:scan:validate` checks all expected.json files against schema

6. **AC6: Validation Errors** - Validation errors clearly indicate which file and which field failed

7. **AC7: Folder Generate Mode** - `--folder=/path` generates expected.json for all images in folder

## Tasks / Subtasks

- [x] **Task 1: Create generate command** (AC: #1, #2, #3, #4)
  - [x] Create `scripts/scan-test/commands/generate.ts`
  - [x] Parse `--image` flag for single image path
  - [x] Call Cloud Function with image
  - [x] Create expected.json with aiExtraction from response
  - [x] Add empty corrections object
  - [x] Auto-fill metadata from context

- [x] **Task 2: Implement metadata auto-fill logic** (AC: #4)
  - [x] Extract testId from filename (remove extension)
  - [x] Extract storeType from parent directory name
  - [x] Validate storeType is valid enum value
  - [x] Set defaults for difficulty, source, addedAt

- [x] **Task 3: Implement folder generate mode** (AC: #7)
  - [x] Add `--folder` flag to generate command
  - [x] Scan folder for image files (jpg, jpeg, png)
  - [x] Skip images that already have expected.json
  - [x] Generate for each new image
  - [x] Show progress and summary

- [x] **Task 4: Create validate command** (AC: #5, #6)
  - [x] Create `scripts/scan-test/commands/validate.ts`
  - [x] Scan test-data/receipts/ for all *.expected.json files
  - [x] Validate each against TestCaseFileSchema
  - [x] Collect all errors before reporting

- [x] **Task 5: Implement validation error reporting** (AC: #6)
  - [x] Format Zod errors with file path and field path
  - [x] Show all errors, not just first one
  - [x] Color-code errors (red for invalid, green for valid)
  - [x] Return exit code 1 if any validation fails

- [x] **Task 6: Add npm scripts** (AC: #1, #5)
  - [x] Add `"test:scan:generate": "tsx scripts/scan-test/index.ts generate"`
  - [x] Add `"test:scan:validate": "tsx scripts/scan-test/index.ts validate"`
  - [x] Register commands in CLI index.ts

- [x] **Task 7: Handle edge cases** (AC: #1, #5)
  - [x] Image file not found → clear error
  - [x] Expected.json already exists → prompt to overwrite or skip
  - [x] Invalid store type folder → warn but allow with "other"
  - [x] API error during generate → show error, continue with others

- [x] **Task 8: Integration tests** (AC: #1, #5)
  - [x] Create test fixtures for generate/validate
  - [x] Test generate creates valid expected.json
  - [x] Test validate catches schema violations
  - [x] Test validate passes for valid files

## Dev Notes

### Architecture Patterns and Constraints

**Generate Command Flow:**
```
1. Developer adds receipt image to test-data/receipts/{type}/
2. Run: npm run test:scan:generate -- --image=filename.jpg
3. CLI calls Cloud Function, gets AI extraction
4. CLI creates {filename}.expected.json with:
   - metadata: { testId, storeType: (from folder), difficulty: "medium", ... }
   - aiExtraction: { ...AI result... }
   - corrections: {} (empty - human fills if needed)
5. Human reviews, fills metadata.difficulty, adds corrections for errors
6. Run: npm run test:scan:validate (checks schema)
7. Run: npm run test:scan -- --image=filename.jpg (verify pass)
```

**Expected.json Structure (Generated):**
```json
{
  "metadata": {
    "testId": "jumbo-001",
    "storeType": "supermarket",
    "difficulty": "medium",
    "region": "CL",
    "source": "manual-collection",
    "addedAt": "2025-12-11T10:30:00Z"
  },
  "aiExtraction": {
    "merchant": "JUMBO",
    "date": "2025-12-10",
    "total": 45990,
    "category": "groceries",
    "items": [...],
    "model": "gemini-1.5-flash",
    "modelVersion": "latest",
    "extractedAt": "2025-12-11T10:30:05Z"
  },
  "corrections": {}
}
```

**Validation Error Example:**
```
❌ Validation Errors Found

test-data/receipts/supermarket/jumbo-001.expected.json
  ✗ metadata.storeType: Invalid enum value. Expected 'supermarket' | 'pharmacy' | ..., received 'grocery'
  ✗ aiExtraction.total: Expected number, received string

test-data/receipts/pharmacy/cruz-verde-001.expected.json
  ✗ metadata.testId: Required field missing

Summary: 2/15 files invalid
```

### CLI Commands

```bash
# Generate for single image
npm run test:scan:generate -- --image=jumbo-001.jpg

# Generate for all images in folder
npm run test:scan:generate -- --folder=test-data/receipts/supermarket/

# Validate all expected.json files
npm run test:scan:validate
```

### File Structure

```
prompt-testing/scripts/commands/
├── run.ts        # (from Story 8.3)
├── generate.ts   # NEW
└── validate.ts   # NEW
```

### References

- [Source: docs/sprint-artifacts/epic8/tech-spec-epic-8.md#AC5-Generate-Validate-Commands]
- [Source: docs/sprint-artifacts/epic8/architecture-epic8.md#Test-Case-Creation-Flow]

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-11 | Story drafted from Epic 8 tech spec | SM Agent |
| 2025-12-11 | Story implementation completed | Dev Agent |
| 2025-12-12 | Senior Developer Review - APPROVED | Review Agent |

## Dev Agent Record

### Context Reference

- docs/sprint-artifacts/epic8/story-8.6-context.xml

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

Implementation approach:
1. Created generate.ts with Cloud Function integration, store type mapping, and metadata auto-fill
2. Created validate.ts with recursive file discovery and Zod schema validation
3. Registered commands in index.ts with commander options
4. Added npm scripts to package.json
5. Wrote 25 integration tests covering validation logic, store type mapping, and edge cases

### Completion Notes List

- **Generate command** (`npm run test:scan:generate`): Creates expected.json files by calling Cloud Function
  - Supports `--image=filename.jpg` for single image
  - Supports `--folder=/path` for batch processing
  - Supports `--force` to overwrite existing files
  - Auto-fills metadata: testId from filename, storeType from directory, defaults for difficulty/source/region
  - Maps directory names (gas-station) to enum values (gas_station)

- **Validate command** (`npm run test:scan:validate`): Validates expected.json files against schema
  - Recursively discovers all *.expected.json files
  - Validates each against TestCaseFileSchema
  - Reports all errors with file path and field path
  - Color-coded output (green checkmarks for valid, red X for invalid)
  - Exit code 1 if any validation fails

- **All 259 scan-test self-tests passing**
- **All 660 unit tests passing** (no regressions)

### File List

**Created:**
- prompt-testing/scripts/commands/generate.ts - Generate command implementation
- prompt-testing/scripts/commands/validate.ts - Validate command implementation
- prompt-testing/scripts/__tests__/generate-validate.test.ts - Integration tests (25 tests)

**Modified:**
- prompt-testing/scripts/index.ts - Registered new commands
- package.json - Added npm scripts (test:scan:generate, test:scan:validate)

---

## Senior Developer Review (AI)

### Reviewer
Gabe (via Review Agent)

### Date
2025-12-12

### Outcome
**APPROVE** ✅

All acceptance criteria have been fully implemented with evidence. All tasks marked complete have been verified. The code follows project standards and best practices.

### Summary

Story 8.6 delivers the generate and validate CLI commands for the scan testing infrastructure. The implementation is complete, well-tested, and follows architecture guidelines. The generate command correctly calls the Cloud Function, auto-fills metadata, and creates properly structured expected.json files. The validate command recursively discovers and validates all test case files against the Zod schema with detailed error reporting.

### Key Findings

**No high or medium severity issues found.**

**LOW Severity:**
- Note: File paths in story doc reference `scripts/scan-test/` but actual implementation is at `prompt-testing/scripts/`. This is a documentation discrepancy only - the implementation location matches the project's actual structure.

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC1 | Generate Command | ✅ IMPLEMENTED | [generate.ts:415-453](prompt-testing/scripts/commands/generate.ts#L415-453) - `generateCommand()` with `--image` flag |
| AC2 | AI Extraction Populated | ✅ IMPLEMENTED | [generate.ts:274-304](prompt-testing/scripts/commands/generate.ts#L274-304) - `aiExtraction` populated from `scanReceipt()` response |
| AC3 | Empty Corrections | ✅ IMPLEMENTED | [generate.ts:305](prompt-testing/scripts/commands/generate.ts#L305) - `corrections: {}` empty object |
| AC4 | Metadata Auto-Fill | ✅ IMPLEMENTED | [generate.ts:275-283](prompt-testing/scripts/commands/generate.ts#L275-283) - testId from filename, storeType from directory, difficulty="medium", source="manual-collection", addedAt timestamp |
| AC5 | Validate Command | ✅ IMPLEMENTED | [validate.ts:175-247](prompt-testing/scripts/commands/validate.ts#L175-247) - `validateCommand()` validates all expected.json against `TestCaseFileSchema` |
| AC6 | Validation Errors | ✅ IMPLEMENTED | [validate.ts:77-82](prompt-testing/scripts/commands/validate.ts#L77-82) - `formatZodErrors()` shows file path and field path; [validate.ts:152-163](prompt-testing/scripts/commands/validate.ts#L152-163) - color-coded error display |
| AC7 | Folder Generate Mode | ✅ IMPLEMENTED | [generate.ts:329-404](prompt-testing/scripts/commands/generate.ts#L329-404) - `generateForFolder()` with `--folder` flag, skips existing files, shows progress |

**Summary: 7 of 7 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create generate command | ✅ Complete | ✅ VERIFIED | [generate.ts](prompt-testing/scripts/commands/generate.ts) - Full implementation with scanner integration |
| Task 2: Metadata auto-fill logic | ✅ Complete | ✅ VERIFIED | [generate.ts:32-53](prompt-testing/scripts/commands/generate.ts#L32-53) - `DIRECTORY_TO_STORE_TYPE`, `mapStoreType()` |
| Task 3: Folder generate mode | ✅ Complete | ✅ VERIFIED | [generate.ts:329-404](prompt-testing/scripts/commands/generate.ts#L329-404) - `--folder` flag, skip existing, progress display |
| Task 4: Create validate command | ✅ Complete | ✅ VERIFIED | [validate.ts](prompt-testing/scripts/commands/validate.ts) - Full implementation with Zod validation |
| Task 5: Validation error reporting | ✅ Complete | ✅ VERIFIED | [validate.ts:77-82](prompt-testing/scripts/commands/validate.ts#L77-82), [validate.ts:135-163](prompt-testing/scripts/commands/validate.ts#L135-163) - Color-coded output with file/field paths |
| Task 6: Add npm scripts | ✅ Complete | ✅ VERIFIED | [package.json:35-36](package.json#L35-36) - `test:scan:generate`, `test:scan:validate` scripts registered |
| Task 7: Handle edge cases | ✅ Complete | ✅ VERIFIED | [generate.ts:436-443](prompt-testing/scripts/commands/generate.ts#L436-443) - Image not found; [generate.ts:225-228](prompt-testing/scripts/commands/generate.ts#L225-228) - existing file check; [generate.ts:236-238](prompt-testing/scripts/commands/generate.ts#L236-238) - invalid store type warning |
| Task 8: Integration tests | ✅ Complete | ✅ VERIFIED | [generate-validate.test.ts](prompt-testing/scripts/__tests__/generate-validate.test.ts) - 25 tests covering validation, store type mapping, edge cases |

**Summary: 8 of 8 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- **Self-tests:** 259 tests in 8 test files, all passing
- **generate-validate.test.ts:** 25 tests covering:
  - Schema validation (valid/invalid files, missing fields, enum validation)
  - File discovery (recursive search, empty directories)
  - Store type mapping (case insensitive, unknown types)
  - Metadata auto-fill (required fields, ISO timestamp)
  - Edge cases (invalid JSON, file existence)
- **Test gap:** No integration tests for actual Cloud Function calls (expected - requires credentials)

### Architectural Alignment

✅ **Tech-spec compliance:**
- Commands registered in CLI index.ts with Commander (per architecture)
- Zod schema validation (per tech-spec)
- Color-coded console output with chalk (per architecture)
- Store type enum matches CONFIG.validStoreTypes

✅ **Code organization:**
- Commands in `prompt-testing/scripts/commands/`
- Shared lib modules (`schema.ts`, `reporter.ts`)
- Types defined in `types.ts`

✅ **ADR compliance:**
- ADR-011: Corrections-based ground truth (empty corrections object ready for human review)
- ADR-012: Cost protection (generate uses production function with retry logic)

### Security Notes

✅ **No security issues identified:**
- Firebase config is public web app configuration (expected to be in code)
- Authentication uses environment variables for credentials (not hardcoded)
- File operations use proper path handling
- No command injection risks

### Best-Practices and References

- **Zod validation:** Proper use of `.safeParse()` for safe validation without throwing
- **Commander CLI:** Follows best practices with positional arguments and options
- **Error handling:** Consistent exit codes (0=success, 1=validation failures, 2=errors)
- **TypeScript:** Strong typing throughout with proper interfaces

### Action Items

**Code Changes Required:**
- None

**Advisory Notes:**
- Note: Story documentation references `scripts/scan-test/` paths but implementation is at `prompt-testing/scripts/`. Consider updating Dev Notes section for clarity (not blocking - actual code location is correct).
- Note: The generate command's input file support (`.input.json`) is a nice enhancement beyond AC requirements
