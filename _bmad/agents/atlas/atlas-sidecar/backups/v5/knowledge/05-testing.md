# Testing Patterns & Coverage Expectations

> Section 5 of Atlas Memory
> Last Sync: 2026-01-06
> Sources: test-strategy.md, retrospectives, CI/CD docs

## Current Metrics (Post-Epic 14 Story 14.22)

| Metric | Value |
|--------|-------|
| Total Tests | 3,118+ passing |
| Coverage | 84%+ |
| E2E Framework | Playwright configured |
| Bundle Size | 2.0 MB (**ALERT: Code splitting needed**) |

## Testing Strategy

### Test Levels

| Level | Purpose | Coverage Target | Tools |
|-------|---------|-----------------|-------|
| Unit | Isolated function/component testing | 80%+ | Vitest |
| Integration | Service and hook testing | Key flows | Vitest |
| E2E | User journey validation | Critical paths | Playwright |

### Test Priorities

| Priority | Area | Risk |
|----------|------|------|
| 1 | Authentication Flow | HIGH - Security |
| 1 | Data Isolation | HIGH - Privacy |
| 1 | Firestore Security Rules | HIGH - Security |
| 2 | Transaction CRUD | HIGH - Data integrity |
| 2 | Receipt Scanning | HIGH - Core feature |
| 3 | Analytics Accuracy | MEDIUM - User trust |

## Test File Conventions

```
tests/
├── unit/
│   ├── components/     # Component tests
│   ├── utils/          # Utility function tests
│   └── services/       # Service tests
├── integration/
│   ├── hooks/          # Hook integration tests
│   └── services/       # Service integration tests
└── e2e/
    └── *.spec.ts       # Playwright E2E tests
```

**Naming:** Match source file name (e.g., `currency.ts` → `currency.test.ts`)

## Seed Data Patterns

| Scenario | Data Required | Use Case |
|----------|--------------|----------|
| Empty User | No transactions | Onboarding, cold-start |
| Active User | 50+ transactions | Analytics, insights |
| Multi-category | Diverse categories | Filter testing |
| Learning | Pre-existing mappings | Auto-apply testing |

## Scan Test Harness (Epic 8)

<!-- Synced from: epic-8-retrospective.md -->

| Command | Purpose |
|---------|---------|
| `npm run test:scan` | Run scan accuracy tests |
| `npm run test:scan:generate` | Generate expected.json |
| `npm run test:scan:validate` | Validate test data |
| `npm run test:scan:analyze` | Analyze results |
| `npm run test:scan:compare` | A/B prompt comparison |

**Test Images:** 38+ images covering supermarkets, restaurants, gas stations, convenience stores, international receipts

## CI/CD Testing Standards

<!-- Synced from: epic-8-retrospective.md, Story 14.22/14.30 CI optimization -->

### Current Configuration (Story 14.30 - 5 Shards)

| Job | Target | Actual | Notes |
|-----|--------|--------|-------|
| gitleaks | ~8s | 8s | Parallel with setup |
| setup | ~2 min | 1m53s | Shallow clone, workspace caching |
| test-unit-1 | ~3 min | **13m52s** ⚠️ | Contains large test files |
| test-unit-2 | ~3 min | **15m16s** ⚠️ | Contains large test files |
| test-unit-3 | ~3 min | 1m11s | Fast tests |
| test-unit-4 | ~3 min | 1m17s | Fast tests |
| test-unit-5 | ~3 min | 1m22s | Fast tests |
| test-integration | ~1.5 min | 1m29s | Parallel with unit |
| test-e2e | ~3 min | 2m57s | Playwright + emulators |
| security | ~2 min | 2m1s | ESLint security rules |
| merge-coverage | ~1 min | TBD | PR-only, non-blocking |

### ⚠️ Known Issue: Shard Imbalance

**Root Cause:** 4 large test files (~1400-1700 lines each) cluster in shards 1&2:
- `useScanStateMachine.test.ts` (1680 lines)
- `Nav.test.tsx` (1623 lines)
- `insightEngineService.test.ts` (1439 lines)
- `insightGenerators.test.ts` (1432 lines)

**Vitest Limitation:** Shards by file count, not duration. Early files (alphabetically) get heavy tests.

**Potential Solutions:**
1. Duration-based sharding (requires Vitest reporter plugin)
2. Manual file assignment to shards
3. Split large test files into smaller chunks
4. Increase shard count to 8-10

### CI/CD Optimizations History

**Story 14.30 (2026-01-14):**
- **5 shards**: Expanded from 3 to 5 parallel unit test shards
- **Coverage merge**: Each shard collects coverage, merged in single job (saves ~14 min)
- **Removed test-coverage job**: Was running all tests twice
- **Dead code cleanup**: Deleted 62 stale tests from `shared/prompts/__tests__/`
- **Sub-story 14.30.5a**: Fixed 30 pre-existing test failures (HistoryViewThumbnails filter state, TopHeader translations)

**Test Fix Patterns (14.30.5a):**
- **Filter State in Tests**: Use `initialState={{ temporal: { level: 'all' } }}` in `HistoryFiltersProvider` for tests with historical dates
- **Translation Mocks**: Ensure `mockT` includes ALL keys used by components under test, especially nested components (ProfileDropdown uses `t('purchases')` not `t('transactions')`)

**Story 14.22:**
- **Gitleaks parallelized**: Now runs alongside setup instead of blocking (~30s saved)
- **Shallow clone for setup**: Only gitleaks needs full history
- **Security lint fix**: ReDoS vulnerability in sanitize.ts regex fixed

### Anti-Patterns to Avoid
- Running same tests twice
- Sequential steps that could be parallel
- Installing tools that aren't cached
- Running expensive checks (Lighthouse) on every PR
- **NEW**: Complex regex patterns with catastrophic backtracking (ReDoS)

## Mocking Patterns

### localStorage in Vitest (happy-dom)
The happy-dom environment doesn't fully support `localStorage.clear()`. Use `vi.stubGlobal()` with a mock object:

```typescript
describe('localStorageTests', () => {
  let mockStorage: Record<string, string>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockStorage = {};
    mockLocalStorage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => { mockStorage = {}; }),
      length: 0,
      key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
```

### Firebase Timestamp Mocking
For testing code that uses Firestore Timestamps:

```typescript
function createMockTimestamp(daysAgo: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
    toMillis: () => date.getTime(),
    isEqual: () => false,
    valueOf: () => '',
    toJSON: () => ({ seconds: Math.floor(date.getTime() / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp;
}
```

## Workflow Validations

### Critical User Journeys to Test
1. **Auth Flow** - Sign in → Access data → Sign out
2. **Scan Flow** - Capture → OCR → Edit → Save
3. **Learning Flow** - Edit → Prompt → Save mapping → Auto-apply
4. **Analytics Flow** - Navigate → Drill-down → Filter → View transactions

### Defensive Timestamp Testing (Story 10.1)
When testing code that reads Firestore Timestamps, add edge case tests for corrupted data:

```typescript
// Test corrupted Timestamp scenarios
it('should handle corrupted Timestamp gracefully', () => {
  const corruptedRecord = {
    insightId: 'test',
    shownAt: {
      toDate: () => { throw new Error('Corrupted'); },
    } as unknown as Timestamp,
  };
  // Should not throw - return safe default
  expect(checkCooldown('test', [corruptedRecord])).toBe(false);
});

it('should handle null Timestamp', () => {
  const nullRecord = {
    insightId: 'test',
    shownAt: null as unknown as Timestamp,
  };
  expect(checkCooldown('test', [nullRecord])).toBe(false);
});
```

---

## Sync Notes

- Test metrics updated after Story 14.22 deployment (3,118+ tests)
- Mocking patterns added for localStorage and Timestamps
- Defensive Timestamp testing pattern added (Story 10.1)
- Scan test harness from Epic 8 fully operational
- CI/CD optimized to ~6 min for PRs (Story 14.22: gitleaks parallelized)
- **Epic 14 Test Focus:** Animation timing, reduced motion, polygon calculations, donut chart drill-down
- **Security**: ReDoS vulnerability fixed in sanitize.ts (unsafe regex pattern)
