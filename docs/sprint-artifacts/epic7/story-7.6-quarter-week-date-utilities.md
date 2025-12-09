# Story 7.6: Quarter & Week Date Utilities

Status: done

## Story

As a **developer**,
I want **utilities for quarter and week calculations**,
so that **temporal navigation works correctly with consistent edge-case handling**.

## Acceptance Criteria

1. **AC #1:** Given a year (e.g., 2024), when `getQuartersInYear(2024)` is called, then it returns an array of 4 quarter objects with label and months (e.g., `[{ label: 'Q1', months: ['2024-01', '2024-02', '2024-03'] }, ...]`)
2. **AC #2:** Given a month string (e.g., "2024-10"), when `getWeeksInMonth('2024-10')` is called, then it returns month-aligned week chunks with labels and date ranges (e.g., `[{ label: 'Oct 1-7', start: '2024-10-01', end: '2024-10-07' }, ...]`)
3. **AC #3:** Given October 2024 (31 days), when `getWeeksInMonth('2024-10')` is called, then the last week is "Oct 29-31" (partial weeks included)
4. **AC #4:** Given February 2024 (leap year), when `getWeeksInMonth('2024-02')` is called, then the last day is Feb 29
5. **AC #5:** Given a quarter string (e.g., "Q4") and year, when `getMonthsInQuarter(2024, 'Q4')` is called, then it returns `['2024-10', '2024-11', '2024-12']`
6. **AC #6:** Given a month string (e.g., "2024-10"), when `getQuarterFromMonth('2024-10')` is called, then it returns 'Q4'
7. **AC #7:** Given a week start and end date with locale 'en', when `formatWeekLabel('2024-10-01', '2024-10-07', 'en')` is called, then it returns "Oct 1-7"
8. **AC #8:** Given a week start and end date with locale 'es', when `formatWeekLabel('2024-10-01', '2024-10-07', 'es')` is called, then it returns "oct 1-7" or "1-7 oct" (locale-appropriate)
9. **AC #9:** All date utility functions handle edge cases: year transitions (December to January), February boundary (28 vs 29 days), short months (April, June, September, November)
10. **AC #10:** No external date libraries required - uses native JavaScript Date and Intl.DateTimeFormat

## Tasks / Subtasks

- [x] Task 1: Create quarter utility functions (AC: #1, #5, #6)
  - [x] Create `getQuartersInYear(year: number): Quarter[]` function
    - Return array of 4 quarter objects: `{ label: 'Q1', months: ['YYYY-01', 'YYYY-02', 'YYYY-03'] }`
    - Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
  - [x] Create `getMonthsInQuarter(year: number, quarter: string): string[]` function
    - Map Q1→['YYYY-01', 'YYYY-02', 'YYYY-03'], Q2→['YYYY-04'...], etc.
  - [x] Create `getQuarterFromMonth(month: string): string` function
    - Parse month (e.g., '2024-10'), extract month number, map to Q1-Q4

- [x] Task 2: Create week utility functions (AC: #2, #3, #4, #7, #8)
  - [x] Create `getWeeksInMonth(month: string): WeekRange[]` function
    - Parse year and month from 'YYYY-MM' format
    - Calculate first and last day of month
    - Divide into 7-day chunks (month-aligned per ADR-012)
    - Last week may be shorter (e.g., Oct 29-31 for October)
    - Return array: `[{ label: string, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }, ...]`
  - [x] Create `formatWeekLabel(start: string, end: string, locale: string): string` function
    - Use `Intl.DateTimeFormat` for locale-aware month abbreviation
    - Format: "Oct 1-7" (English) or locale-appropriate for Spanish
    - Handle cross-month week labels if needed

- [x] Task 3: Create type definitions
  - [x] Add interfaces to `src/utils/date.ts`:
    ```typescript
    interface Quarter {
      label: 'Q1' | 'Q2' | 'Q3' | 'Q4';
      months: [string, string, string]; // YYYY-MM format
    }

    interface WeekRange {
      label: string;
      start: string; // YYYY-MM-DD
      end: string;   // YYYY-MM-DD
      weekNumber: number; // 1-5 within month
    }
    ```

- [x] Task 4: Handle edge cases (AC: #9)
  - [x] February leap year: 2024 has 29 days, 2025 has 28 days
  - [x] Short months: April, June, September, November have 30 days
  - [x] Year transitions: Handle Q4 of one year correctly
  - [x] Month boundary: Week starting Dec 25 doesn't extend to January

- [x] Task 5: Write unit tests for quarter functions (AC: #1, #5, #6)
  - [x] Create `tests/unit/date.test.ts` (or extend existing)
  - [x] Test `getQuartersInYear(2024)` returns 4 quarters with correct months
  - [x] Test `getQuartersInYear(2025)` uses correct year in month strings
  - [x] Test `getMonthsInQuarter(2024, 'Q1')` returns Jan/Feb/Mar
  - [x] Test `getMonthsInQuarter(2024, 'Q4')` returns Oct/Nov/Dec
  - [x] Test `getQuarterFromMonth('2024-01')` returns 'Q1'
  - [x] Test `getQuarterFromMonth('2024-04')` returns 'Q2'
  - [x] Test `getQuarterFromMonth('2024-07')` returns 'Q3'
  - [x] Test `getQuarterFromMonth('2024-10')` returns 'Q4'

- [x] Task 6: Write unit tests for week functions (AC: #2, #3, #4)
  - [x] Test October 2024 (31 days) returns 5 weeks with correct ranges
  - [x] Test October 2024 last week is "Oct 29-31" (3 days)
  - [x] Test February 2024 (leap year) ends on Feb 29
  - [x] Test February 2025 (non-leap year) ends on Feb 28
  - [x] Test April 2024 (30 days) has correct week boundaries
  - [x] Test week labels are properly formatted

- [x] Task 7: Write unit tests for locale formatting (AC: #7, #8)
  - [x] Test `formatWeekLabel` with 'en' locale
  - [x] Test `formatWeekLabel` with 'es' locale
  - [x] Test edge case: same day week (Feb 29 only)

- [x] Task 8: Verify and document (AC: All)
  - [x] Run targeted test suite: `npm run test:unit -- --run "tests/unit/date.test.ts"`
  - [x] Run full test suite before marking complete
  - [x] Verify TypeScript compiles without errors (`npx tsc --noEmit`)
  - [x] Update story file with completion notes and file list

## Dev Notes

### Architecture Alignment

This story extends `src/utils/date.ts` with quarter and week utility functions as specified in [docs/sprint-artifacts/epic7/tech-spec-epic-7.md](docs/sprint-artifacts/epic7/tech-spec-epic-7.md):

- **ADR-012: Month-Aligned Week Chunks** - Weeks are NOT ISO weeks, they are month-aligned (Oct 1-7, 8-14, etc.)
- **Pattern:** Pure utility functions with no side effects, suitable for unit testing
- **Integration:** Functions will be used by DrillDownGrid (Story 7.5), chartModeRegistry (Story 7.4), and TrendsView (Story 7.7)

### Key Implementation Details

**Month-Aligned Weeks (ADR-012):**
```typescript
// For October 2024:
// Week 1: "Oct 1-7"   (7 days)
// Week 2: "Oct 8-14"  (7 days)
// Week 3: "Oct 15-21" (7 days)
// Week 4: "Oct 22-28" (7 days)
// Week 5: "Oct 29-31" (3 days - partial week)

// NOT ISO weeks like:
// Week 40: Sep 30 - Oct 6 (crosses month boundary - AVOID)
```

This aligns with Chilean user mental model where "the first week of October" means Oct 1-7, not whatever ISO week contains Oct 1.

**Quarter Mapping:**
| Quarter | Months | Spanish Label |
|---------|--------|---------------|
| Q1 | Jan, Feb, Mar | T1 (Trimestre 1) |
| Q2 | Apr, May, Jun | T2 |
| Q3 | Jul, Aug, Sep | T3 |
| Q4 | Oct, Nov, Dec | T4 |

**Locale-Aware Formatting:**
```typescript
// Use Intl.DateTimeFormat for month abbreviations
const formatter = new Intl.DateTimeFormat(locale, { month: 'short' });
// 'en' → "Oct", 'es' → "oct"
```

### FR/AC Mapping

| FR | Description | AC |
|----|-------------|-----|
| FR6 | Users can view analytics at Quarter level | AC #1, #5, #6 |
| FR8 | Users can view analytics at Week level with date range labels | AC #2, #3, #4, #7, #8 |
| FR57 | Date formatting respects user's language setting | AC #7, #8 |

### Tech Spec AC Mapping

| Tech Spec AC | Story AC |
|--------------|----------|
| AC5-AC10 | All (quarter/week utilities) |

### Dependency on Previous Stories

**No dependencies** - This story provides foundational utilities and can be developed in parallel with Stories 7.1-7.5.

**Story 7.4 (DONE) - Reference:**
- `src/utils/chartModeRegistry.ts` already has inline week calculation logic
- Story 7.6 utilities should REPLACE that inline logic for consistency
- Pattern: `getComparisonLabels: (temporal, locale) => getWeeksInMonth(temporal.year, temporal.month!, locale)`

**Stories 7.5, 7.7 (PENDING) - Consumers:**
- DrillDownGrid will use `getWeeksInMonth()` for temporal drill-down cards
- TrendsView integration will use all utilities for navigation

### Project Structure Notes

**File to Modify:**
- `src/utils/date.ts` - Extend with new functions

**New Test File:**
- `tests/unit/date.test.ts` - Unit tests for all date utilities

**Alignment with unified project structure:**
- Utilities belong in `src/utils/` directory
- Follows existing pattern of `formatDate()` in same file
- No new directories needed

### Testing Pattern

From team-standards.md (Fast Verification Strategy):
```bash
# During development, use targeted testing:
npx tsc --noEmit  # TypeScript check first
npm run test:unit -- --run tests/unit/date.test.ts

# Full suite only before marking as "review"
npm run test:all
```

### References

- [Source: docs/sprint-artifacts/epic7/tech-spec-epic-7.md#Services and Modules](docs/sprint-artifacts/epic7/tech-spec-epic-7.md)
- [Source: docs/sprint-artifacts/epic7/tech-spec-epic-7.md#ADR-012](docs/sprint-artifacts/epic7/tech-spec-epic-7.md)
- [Source: docs/epics.md#Story 7.6](docs/epics.md)
- [Source: docs/architecture-epic7.md#Week Calculation](docs/architecture-epic7.md)
- [Source: docs/team-standards.md#Fast Verification Strategy](docs/team-standards.md)

### Learnings from Previous Stories

**From Story 7.4 (Status: done) - Chart Mode Toggle & Registry:**

- **Existing week calculation in chartModeRegistry.ts:**
  - File already has `getWeeksInMonth()` inline implementation (lines 216-219)
  - After Story 7.6, this should be refactored to use the new utility function
  - Pattern to follow for locale-aware formatting established

- **Test coverage:**
  - 462 unit tests, 293 integration tests all passing
  - Tests cover week/quarter labels for comparison mode
  - `tests/unit/analytics/chartModeRegistry.test.ts` has test cases to reference

- **Key insight:**
  - Centralizing date utilities in `src/utils/date.ts` prevents duplication
  - chartModeRegistry.ts can import from date.ts after Story 7.6 completes

[Source: docs/sprint-artifacts/epic7/story-7.4-chart-mode-toggle-registry.md#Completion Notes]

**From Story 7.2 (Status: done) - Temporal Breadcrumb:**

- **Locale handling pattern:**
  - Use `Intl.DateTimeFormat` for locale-aware formatting
  - Support 'en' and 'es' locales consistently
  - Test both locales in unit tests

[Source: docs/sprint-artifacts/epic7/story-7.2-temporal-breadcrumb-component.md#Dev Agent Record]

## Dev Agent Record

### Context Reference

- [7-6-quarter-week-date-utilities.context.xml](7-6-quarter-week-date-utilities.context.xml)

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Plan: Implemented Tasks 1-4 together as a cohesive unit, then Tasks 5-7 for tests
- Decision: Used `Intl.DateTimeFormat` for locale-aware month abbreviations (native JS, no external libs)
- Decision: Week chunks are month-aligned per ADR-012, not ISO weeks
- Validation: TypeScript compiles clean, 65 new tests, 913 total tests passing

### Completion Notes List

- **Quarter utilities implemented:** `getQuartersInYear()`, `getMonthsInQuarter()`, `getQuarterFromMonth()` - all with proper typing and exports
- **Week utilities implemented:** `getWeeksInMonth()`, `formatWeekLabel()` - uses month-aligned chunks per ADR-012
- **Type definitions added:** `Quarter` and `WeekRange` interfaces exported for consumers
- **Edge cases handled:** Leap years (2024 Feb 29), short months (30 days), year transitions, month boundaries
- **Locale support:** English ('en') and Spanish ('es') via `Intl.DateTimeFormat`
- **Test coverage:** 65 new unit tests covering all ACs including edge cases
- **Refactoring opportunity:** `chartModeRegistry.ts` has inline implementations that can now be replaced with imports from `date.ts` (Story 7.7 or 7.8)

### File List

**Modified:**
- `src/utils/date.ts` - Extended with quarter and week utility functions (from 7 lines to 219 lines)

**Created:**
- `tests/unit/date.test.ts` - 65 new unit tests for date utilities (350+ lines)

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-12-07 | Story drafted from create-story workflow | SM Agent |
| 2025-12-07 | Implementation complete: quarter/week utilities, 65 tests, all ACs satisfied | Dev Agent (Claude Opus 4.5) |
| 2025-12-07 | Senior Developer Review: APPROVED | Code Review Agent (Claude Opus 4.5) |

## Senior Developer Review (AI)

### Reviewer
Gabe (via Code Review Agent)

### Date
2025-12-07

### Outcome
**APPROVE** - All acceptance criteria implemented, all tasks verified complete, no blocking issues.

### Summary
Story 7.6 delivers a complete, well-tested implementation of quarter and week date utilities. The implementation correctly follows ADR-012 (month-aligned week chunks), handles all edge cases including leap years and short months, and provides locale-aware formatting for English and Spanish. Code quality is excellent with comprehensive JSDoc documentation and 65 unit tests providing full coverage.

### Key Findings

**No HIGH or MEDIUM severity issues found.**

| Severity | Finding | Location |
|----------|---------|----------|
| LOW | `getMonthsInQuarter` silently defaults to Q1 for invalid quarter input | src/utils/date.ts:87 |
| LOW | `getQuarterFromMonth` doesn't validate YYYY-MM input format | src/utils/date.ts:102 |

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | `getQuartersInYear()` returns 4 quarters | IMPLEMENTED | src/utils/date.ts:54-61 |
| AC #2 | `getWeeksInMonth()` returns month-aligned chunks | IMPLEMENTED | src/utils/date.ts:138-172 |
| AC #3 | October 2024 last week is "Oct 29-31" | IMPLEMENTED | src/utils/date.ts:151, tests/unit/date.test.ts:210-217 |
| AC #4 | February 2024 leap year ends on Feb 29 | IMPLEMENTED | src/utils/date.ts:144, tests/unit/date.test.ts:250-281 |
| AC #5 | `getMonthsInQuarter()` returns correct months | IMPLEMENTED | src/utils/date.ts:75-89 |
| AC #6 | `getQuarterFromMonth()` returns correct quarter | IMPLEMENTED | src/utils/date.ts:101-108 |
| AC #7 | `formatWeekLabel()` works with 'en' locale | IMPLEMENTED | src/utils/date.ts:190-207, tests/unit/date.test.ts:331-365 |
| AC #8 | `formatWeekLabel()` works with 'es' locale | IMPLEMENTED | src/utils/date.ts:199-201, tests/unit/date.test.ts:372-399 |
| AC #9 | Edge cases handled | IMPLEMENTED | tests/unit/date.test.ts:287-324 |
| AC #10 | Uses native JavaScript (no external libs) | IMPLEMENTED | No moment/date-fns imports in date.ts |

**Summary: 10 of 10 acceptance criteria fully implemented**

### Task Completion Validation

| Task | Marked As | Verified As | Evidence |
|------|-----------|-------------|----------|
| Task 1: Quarter utility functions | [x] | VERIFIED | src/utils/date.ts:54-108 |
| Task 2: Week utility functions | [x] | VERIFIED | src/utils/date.ts:138-207 |
| Task 3: Type definitions | [x] | VERIFIED | src/utils/date.ts:18-33 |
| Task 4: Edge cases | [x] | VERIFIED | src/utils/date.ts:144, 151 |
| Task 5: Unit tests for quarter functions | [x] | VERIFIED | tests/unit/date.test.ts:26-188 |
| Task 6: Unit tests for week functions | [x] | VERIFIED | tests/unit/date.test.ts:193-324 |
| Task 7: Unit tests for locale formatting | [x] | VERIFIED | tests/unit/date.test.ts:329-399 |
| Task 8: Verify and document | [x] | VERIFIED | 65 tests pass, TypeScript clean |

**Summary: 13 of 13 completed tasks verified, 0 questionable, 0 falsely marked complete**

### Test Coverage and Gaps

- **Unit Tests:** 65 new tests in tests/unit/date.test.ts
- **Coverage:** All ACs have corresponding test cases
- **Edge Cases Tested:** Leap years (2024, 2020, 2000, 1900), short months (30-day), year transitions
- **Locale Tests:** Both 'en' and 'es' locales verified
- **No test gaps identified**

### Architectural Alignment

- **ADR-012 Compliance:** Implementation uses month-aligned weeks (Oct 1-7, 8-14, etc.), NOT ISO weeks
- **Pure Functions:** All utilities are side-effect free
- **Location:** Correctly placed in src/utils/date.ts
- **Types:** Quarter and WeekRange interfaces exported for consumers
- **No architecture violations**

### Security Notes

- No security vulnerabilities identified
- Pure utility functions with no user input handling
- Uses `parseInt` with radix 10 (good practice)
- No DOM manipulation, network calls, or file system access

### Best-Practices and References

- [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- [ADR-012: Month-Aligned Week Chunks](docs/architecture-epic7.md#ADR-012)
- [TypeScript Handbook: Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html)

### Action Items

**Advisory Notes:**
- Note: Consider adding input validation warning for `getMonthsInQuarter` invalid quarter (currently silently defaults to Q1)
- Note: Story 7.7 or 7.8 can refactor `chartModeRegistry.ts` to use these centralized utilities instead of inline implementations
