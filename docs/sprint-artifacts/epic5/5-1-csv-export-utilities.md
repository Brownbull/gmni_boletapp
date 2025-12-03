# Story 5.1: CSV Export Utilities

**Status:** done

---

## User Story

As a **developer**,
I want **reusable CSV generation utilities with proper formatting**,
So that **all export features have consistent, Excel-compatible output**.

---

## Acceptance Criteria

**AC #1: CSV Generation Function**
- **Given** an array of transaction or statistics data
- **When** `generateCSV(data, columns)` is called
- **Then** output is comma-separated with proper quoting for strings containing commas
- **And** strings with embedded quotes are escaped with double quotes per RFC 4180

**AC #2: Header Row**
- **Given** column configuration with key/header mapping
- **When** CSV is generated
- **Then** first row contains column header names in order
- **And** subsequent rows contain data values in matching order

**AC #3: Date Formatting**
- **Given** transaction data with date fields
- **When** CSV is generated
- **Then** dates are formatted as YYYY-MM-DD (ISO 8601, Excel-compatible)

**AC #4: Currency Formatting**
- **Given** transaction data with numeric currency values
- **When** CSV is generated
- **Then** values are raw numbers without symbols (e.g., `1234.56` not `$1,234.56`)
- **And** numbers are suitable for spreadsheet formulas

**AC #5: UTF-8 Encoding with BOM**
- **Given** transaction data with international characters (Spanish, etc.)
- **When** CSV is generated
- **Then** file is UTF-8 encoded
- **And** includes UTF-8 BOM (`\ufeff`) for Excel compatibility

**AC #6: File Download Function**
- **Given** CSV content string and filename
- **When** `downloadCSV(content, filename)` is called
- **Then** browser triggers file download
- **And** downloaded file has correct filename pattern: `boletapp-{type}-{date}.csv`
- **And** Blob is cleaned up after download (URL.revokeObjectURL)

**AC #7: CSV Injection Prevention**
- **Given** data that could contain formula injection characters (`=`, `+`, `-`, `@`)
- **When** CSV is generated
- **Then** leading formula characters are escaped with single quote prefix
- **And** exported data is safe for Excel/Google Sheets

**AC #8: Unit Tests**
- **Given** the csvExport module
- **When** tests are run
- **Then** all utility functions have unit test coverage
- **And** tests cover: null handling, comma escaping, quote escaping, BOM presence, injection prevention

---

## Implementation Details

### Tasks / Subtasks

- [x] **Task 1: Create csvExport.ts module** (AC: #1, #2)
  - [x] Create `/src/utils/csvExport.ts`
  - [x] Implement `escapeCSVValue(value: any): string` - handles null, quotes, commas
  - [x] Implement `generateCSV<T>(data: T[], columns: Column[]): string`
  - [x] Add TypeScript interface `Column = { key: keyof T; header: string }`
  - [x] Add JSDoc documentation for all exported functions

- [x] **Task 2: Implement download functionality** (AC: #6)
  - [x] Implement `downloadCSV(content: string, filename: string): void`
  - [x] Use Browser Blob API with `type: 'text/csv;charset=utf-8;'`
  - [x] Create temporary anchor element for download trigger
  - [x] Clean up object URL after download

- [x] **Task 3: Add security and encoding** (AC: #5, #7)
  - [x] Add UTF-8 BOM prefix (`\ufeff`) to generated CSV
  - [x] Implement `sanitizeCSVValue(value: string): string` for injection prevention
  - [x] Escape leading `=`, `+`, `-`, `@`, `\t`, `\r` with single quote

- [x] **Task 4: Create export convenience functions** (AC: #3, #4)
  - [x] Implement `downloadBasicData(transactions: Transaction[]): void`
  - [x] Implement `downloadTransactions(transactions: Transaction[], year: string, month: string): void`
  - [x] Implement `downloadStatistics(transactions: Transaction[], year: string): void`
  - [x] Ensure date formatting uses YYYY-MM-DD
  - [x] Ensure numbers exported without currency symbols

- [x] **Task 5: Write unit tests** (AC: #8)
  - [x] Create `/tests/unit/csvExport.test.ts`
  - [x] Test `escapeCSVValue` with null, undefined, empty string
  - [x] Test `escapeCSVValue` with commas, quotes, newlines
  - [x] Test `generateCSV` produces header row
  - [x] Test `generateCSV` includes UTF-8 BOM
  - [x] Test `sanitizeCSVValue` escapes formula characters
  - [x] Test date formatting is YYYY-MM-DD
  - [x] Test currency values are numbers only

---

## Dev Notes

### Technical Approach

**CSV Generation Pattern (from tech-spec):**
```typescript
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Quote if contains comma, newline, or quote
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateCSV<T>(data: T[], columns: Column[]): string {
  const header = columns.map(c => c.header).join(',');
  const rows = data.map(row =>
    columns.map(c => escapeCSVValue(row[c.key])).join(',')
  );
  // UTF-8 BOM for Excel compatibility
  return '\ufeff' + [header, ...rows].join('\n');
}
```

**Download Trigger Pattern:**
```typescript
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Clean up
}
```

### Architecture Constraints

- **Client-side only:** No Cloud Functions required (ADR-010 from tech-spec)
- **No external libraries:** Use native Browser APIs only
- **Reusability:** Functions designed for use by Stories 5.2, 5.4, and 5.5
- **Type safety:** Full TypeScript generics for data arrays

### Project Structure Notes

**Files to create:**
- `/src/utils/csvExport.ts` - Main CSV export utility module
- `/tests/unit/csvExport.test.ts` - Unit tests

**Existing patterns to follow:**
- `/src/utils/csv.ts` - Existing CSV utility (may need to consolidate or extend)
- `/src/utils/date.ts` - Date formatting patterns
- `/src/utils/currency.ts` - Currency formatting patterns

**Testing standards (from Epic 2):**
- Use Vitest for unit tests
- Tests in `/tests/unit/` directory
- Run with `npm run test:unit`

### References

- [Source: docs/sprint-artifacts/epic5/tech-spec.md#CSV-Generation-Pattern] - RFC 4180 compliant implementation
- [Source: docs/sprint-artifacts/epic5/tech-spec.md#API-Contracts] - Function signatures
- [Source: docs/epics.md#Story-5.1] - Story definition and acceptance criteria
- [Source: docs/prd.md#FR24-FR28] - Functional requirements for CSV generation
- [Source: docs/architecture/architecture.md#ADR-001] - Modular architecture pattern

### Learnings from Previous Story

**From Story 4-5-4 (Status: done)**

This is the first story of Epic 5, coming after Epic 4.5 (Receipt Image Storage). Key context:

- **No direct code dependencies:** Epic 5 is a new feature area, not extending Epic 4.5
- **CI/CD patterns established:** Use existing test infrastructure from Epic 2-4
- **Existing CSV utility:** Check `/src/utils/csv.ts` for existing patterns - may need to extend or consolidate
- **Testing pattern:** Follow integration test patterns from `/tests/integration/` and unit test patterns from `/tests/unit/`

**Deployment learnings from 4-5-4:**
- CI needs Cloud Functions build step before integration tests
- Skip OAuth-dependent E2E tests in CI with `test.skip(isCI, ...)`
- Always follow branch flow: `feature/* → develop → staging → main`

[Source: docs/sprint-artifacts/epic4-5/4-5-4-cascade-delete-documentation.md#Deployment-Learnings]

---

## Dev Agent Record

### Context Reference

- [5-1-csv-export-utilities.context.xml](docs/sprint-artifacts/epic5/5-1-csv-export-utilities.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- 2025-12-02: Story implementation started - created csvExport.ts module with all utility functions
- 2025-12-02: Added 51 unit tests covering all acceptance criteria

### Completion Notes List

- **Implementation approach:** Created a comprehensive CSV export module following RFC 4180 standard with TypeScript generics
- **Security:** Implemented CSV injection prevention by escaping leading formula characters (=, +, -, @, \t, \r) with single quote prefix
- **Excel compatibility:** Added UTF-8 BOM (\ufeff) for proper character encoding in Excel
- **Reusability:** Functions designed for use by Stories 5.2, 5.4, and 5.5 with generic type support
- **Testing:** 51 new unit tests covering null handling, escaping, BOM, injection prevention, date formatting, and currency values
- **No external dependencies:** Pure TypeScript/Browser APIs as per ADR-010 constraint

### File List

**Added:**
- `src/utils/csvExport.ts` - CSV export utility module (260 lines)
- `tests/unit/csvExport.test.ts` - Comprehensive unit tests (430 lines)

**Not Modified:**
- `src/utils/csv.ts` - Existing CSV utility left intact for backward compatibility (Stories 5.2+ may consolidate)

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2025-12-02 | 1.0 | Initial story draft created by SM workflow |
| 2025-12-02 | 1.1 | Story context generated, status changed to ready-for-dev |
| 2025-12-02 | 1.2 | Implementation complete - all tasks done, 51 unit tests passing, status changed to review |
| 2025-12-02 | 1.3 | Senior Developer Review (AI) - APPROVED, status changed to done |

---

## Senior Developer Review (AI)

### Reviewer
Gabe (AI-assisted)

### Date
2025-12-02

### Outcome
**APPROVE** ✅

All 8 acceptance criteria are fully implemented with evidence. All 5 tasks and 23 subtasks verified complete. Code quality is excellent with high test coverage and no security issues.

### Summary

Story 5.1 implements a comprehensive CSV export utility module that:
- Follows RFC 4180 CSV specification for proper formatting
- Includes CSV injection prevention (escaping =, +, -, @, \t, \r)
- Adds UTF-8 BOM for Excel compatibility with international characters
- Provides type-safe generic functions for reuse in Stories 5.2, 5.4, 5.5
- Has 94.2% statement coverage and 100% function coverage
- Uses only native Browser APIs (no external dependencies per ADR-010)

### Key Findings

No HIGH or MEDIUM severity findings.

**LOW Severity:**
- Note: Lines 143-148 in `formatDateForCSV` have lower branch coverage (fallback case when date parsing fails). This is acceptable defensive code.

### Acceptance Criteria Coverage

| AC # | Description | Status | Evidence |
|------|-------------|--------|----------|
| AC #1 | CSV Generation Function | ✅ IMPLEMENTED | [csvExport.ts:63-77](src/utils/csvExport.ts#L63-L77), [csvExport.ts:97-105](src/utils/csvExport.ts#L97-L105) |
| AC #2 | Header Row | ✅ IMPLEMENTED | [csvExport.ts:98](src/utils/csvExport.ts#L98), [csvExport.ts:104](src/utils/csvExport.ts#L104) |
| AC #3 | Date Formatting | ✅ IMPLEMENTED | [csvExport.ts:136-149](src/utils/csvExport.ts#L136-L149), [csvExport.ts:197-200](src/utils/csvExport.ts#L197-L200) |
| AC #4 | Currency Formatting | ✅ IMPLEMENTED | [csvExport.ts:169](src/utils/csvExport.ts#L169) (raw total field) |
| AC #5 | UTF-8 Encoding with BOM | ✅ IMPLEMENTED | [csvExport.ts:25](src/utils/csvExport.ts#L25), [csvExport.ts:104](src/utils/csvExport.ts#L104), [csvExport.ts:118](src/utils/csvExport.ts#L118) |
| AC #6 | File Download Function | ✅ IMPLEMENTED | [csvExport.ts:117-127](src/utils/csvExport.ts#L117-L127), [csvExport.ts:158-161](src/utils/csvExport.ts#L158-L161) |
| AC #7 | CSV Injection Prevention | ✅ IMPLEMENTED | [csvExport.ts:28](src/utils/csvExport.ts#L28), [csvExport.ts:41-49](src/utils/csvExport.ts#L41-L49) |
| AC #8 | Unit Tests | ✅ IMPLEMENTED | [csvExport.test.ts](tests/unit/csvExport.test.ts) - 51 tests passing |

**Summary:** 8 of 8 acceptance criteria fully implemented ✅

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Create csvExport.ts module | ✅ Complete | ✅ VERIFIED | File exists with all functions |
| Task 1.1: Create file | ✅ Complete | ✅ VERIFIED | src/utils/csvExport.ts (311 lines) |
| Task 1.2: escapeCSVValue | ✅ Complete | ✅ VERIFIED | Lines 63-77 |
| Task 1.3: generateCSV<T> | ✅ Complete | ✅ VERIFIED | Lines 97-105 |
| Task 1.4: Column interface | ✅ Complete | ✅ VERIFIED | Lines 17-22 |
| Task 1.5: JSDoc documentation | ✅ Complete | ✅ VERIFIED | All exported functions documented |
| Task 2: Download functionality | ✅ Complete | ✅ VERIFIED | Lines 117-127 |
| Task 2.1: downloadCSV function | ✅ Complete | ✅ VERIFIED | Lines 117-127 |
| Task 2.2: Blob API | ✅ Complete | ✅ VERIFIED | Line 118 |
| Task 2.3: Anchor element | ✅ Complete | ✅ VERIFIED | Lines 120-124 |
| Task 2.4: URL cleanup | ✅ Complete | ✅ VERIFIED | Line 126 |
| Task 3: Security and encoding | ✅ Complete | ✅ VERIFIED | Lines 25-49 |
| Task 3.1: UTF-8 BOM | ✅ Complete | ✅ VERIFIED | Lines 25, 104 |
| Task 3.2: sanitizeCSVValue | ✅ Complete | ✅ VERIFIED | Lines 41-49 |
| Task 3.3: Formula char escape | ✅ Complete | ✅ VERIFIED | Lines 28, 44-46 |
| Task 4: Export convenience functions | ✅ Complete | ✅ VERIFIED | Lines 191-310 |
| Task 4.1: downloadBasicData | ✅ Complete | ✅ VERIFIED | Lines 191-205 |
| Task 4.2: downloadTransactions | ✅ Complete | ✅ VERIFIED | Lines 219-237 |
| Task 4.3: downloadStatistics | ✅ Complete | ✅ VERIFIED | Lines 268-310 |
| Task 4.4: Date formatting | ✅ Complete | ✅ VERIFIED | Lines 136-149 |
| Task 4.5: Numbers without symbols | ✅ Complete | ✅ VERIFIED | Column definitions |
| Task 5: Write unit tests | ✅ Complete | ✅ VERIFIED | 51 tests in test file |
| Task 5.1-5.8: All test subtasks | ✅ Complete | ✅ VERIFIED | Tests at lines 24-559 |

**Summary:** 5 of 5 tasks verified, 23 of 23 subtasks verified, 0 falsely marked complete ✅

### Test Coverage and Gaps

**Coverage Results (csvExport.ts):**
- Statements: 94.2%
- Branches: 89.18%
- Functions: 100%
- Lines: 93.54%

**Uncovered Lines:** 143-148 (date parsing fallback - defensive code)

**Test Quality:**
- 51 comprehensive tests
- Covers all acceptance criteria
- Tests edge cases (null, commas, quotes, formula injection)
- Uses proper mocking for browser APIs

### Architectural Alignment

✅ **ADR-010 Compliant:** Client-side only, no Cloud Functions
✅ **Tech-spec Pattern:** Implementation matches RFC 4180 CSV pattern from tech-spec
✅ **Type Safety:** Full TypeScript generics as specified
✅ **No External Dependencies:** Uses native Browser APIs only
✅ **Modular Architecture:** Functions designed for reuse in Stories 5.2, 5.4, 5.5

### Security Notes

✅ **CSV Injection Prevention:** Implemented and tested (escaping =, +, -, @, \t, \r)
✅ **No Security Lint Warnings:** ESLint security plugin reports 0 issues for csvExport.ts
✅ **Clean Type Checking:** TypeScript compiles without errors

### Best-Practices and References

- [RFC 4180 - Common Format and MIME Type for CSV Files](https://tools.ietf.org/html/rfc4180)
- [OWASP CSV Injection Prevention](https://owasp.org/www-community/attacks/CSV_Injection)
- UTF-8 BOM for Excel compatibility: `\ufeff` prefix

### Action Items

**Code Changes Required:**
None - all acceptance criteria met.

**Advisory Notes:**
- Note: Consider consolidating with existing `src/utils/csv.ts` in Story 5.2 or later
- Note: Lines 143-148 fallback case could add test for malformed date strings (very low priority)
