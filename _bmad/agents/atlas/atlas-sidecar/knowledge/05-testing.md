# Testing Patterns & Coverage Expectations

> Section 5 of Atlas Memory
> Last Sync: 2026-01-17
> Last Optimized: 2026-01-17 (Generation 5)
> Sources: test-strategy.md, retrospectives, CI/CD docs

## Current Metrics (2026-01-17)

| Metric | Value |
|--------|-------|
| Total Tests | 3,146+ passing |
| Coverage | 84%+ |
| E2E Framework | Playwright configured |
| Bundle Size | 2.92 MB (**ALERT: Code splitting needed**) |
| CI Time | ~5 min (18 parallel jobs) |

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
│   ├── hooks/          # Hook tests
│   └── services/       # Service tests
├── integration/
│   ├── hooks/          # Hook integration tests
│   └── services/       # Service integration tests
└── e2e/
    └── *.spec.ts       # Playwright E2E tests
```

**Naming:** Match source file name (e.g., `currency.ts` → `currency.test.ts`)

---

## CI/CD Configuration (Story 14.30.8 - Explicit Test Groups)

### Current Setup (18 Parallel Jobs)

| Job Group | Module | Config File |
|-----------|--------|-------------|
| test-unit-1 | hooks | `vitest.config.ci.group-hooks.ts` |
| test-unit-2 | services | `vitest.config.ci.group-services.ts` |
| test-unit-3 | utils | `vitest.config.ci.group-utils.ts` |
| test-unit-4 | analytics | `vitest.config.ci.group-analytics.ts` |
| test-unit-5 | views + root | `vitest.config.ci.group-views.ts` |
| test-unit-6 | components/insights | `vitest.config.ci.group-insights.ts` |
| test-unit-7 | components/scan | `vitest.config.ci.group-scan.ts` |
| test-unit-8 | components/other | `vitest.config.ci.group-other.ts` |
| heavy-1 to heavy-4 | Large test files | Individual configs |

### Why Explicit Groups (Not Vitest --shard)

- Vitest shards by file count, not duration
- Large files (>1400 lines) cause shard imbalance
- Explicit groups = predictable CI times
- Easy to identify and optimize slow groups

### Key Patterns

| Pattern | Rule |
|---------|------|
| `createGroupConfig()` | Helper for module-specific include patterns |
| Base config inheritance | `vitest.config.ci.base.ts` for shared settings |
| Target 1,500-3,000 lines per group | Prevents timeout (~3-5 min per group) |
| Heavy file isolation | Files >800 lines get dedicated CI jobs |

---

## Mocking Patterns

### localStorage in Vitest (happy-dom)

```typescript
let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

beforeEach(() => {
  mockStorage = {};
  mockLocalStorage = {
    getItem: vi.fn((key) => mockStorage[key] || null),
    setItem: vi.fn((key, value) => { mockStorage[key] = value; }),
    removeItem: vi.fn((key) => { delete mockStorage[key]; }),
    clear: vi.fn(() => { mockStorage = {}; }),
    length: 0,
    key: vi.fn(() => null),
  };
  vi.stubGlobal('localStorage', mockLocalStorage);
});
```

### Firebase Timestamp Mocking

```typescript
function createMockTimestamp(daysAgo: number): Timestamp {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return {
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  } as unknown as Timestamp;
}
```

### Cloud Functions Testing (Jest)

```typescript
// Mock firebase-admin BEFORE imports
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: [],
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: mockGet,
        set: mockSet,
        collection: jest.fn(() => ({ doc: jest.fn() })),
      })),
    })),
    batch: jest.fn(() => ({
      set: mockBatchSet,
      commit: mockBatchCommit,
    })),
  })),
}));

// Mock firebase-functions/v2/firestore
jest.mock('firebase-functions/v2/firestore', () => ({
  onDocumentWritten: mockOnDocumentWritten,
}));

// Extract handler from mock after import
const [, handler] = mockOnDocumentWritten.mock.calls[0];
```

**Key Pattern:** Control group membership via `mockGroupMembers` object for security tests.

### Filter State for Historical Dates

```typescript
// Tests with old transaction dates need this
<HistoryFiltersProvider initialState={{ temporal: { level: 'all' } }}>
  <ComponentUnderTest />
</HistoryFiltersProvider>
```

---

## Workflow Validations

### Critical User Journeys to Test
1. **Auth Flow** - Sign in → Access data → Sign out
2. **Scan Flow** - Capture → OCR → Edit → Save
3. **Learning Flow** - Edit → Prompt → Save mapping → Auto-apply
4. **Analytics Flow** - Navigate → Drill-down → Filter → View transactions
5. **Sharing Flow** - Create group → Share code → Accept → View merged

### Defensive Timestamp Testing

```typescript
it('should handle corrupted Timestamp gracefully', () => {
  const corruptedRecord = {
    shownAt: { toDate: () => { throw new Error('Corrupted'); } },
  };
  expect(checkCooldown('test', [corruptedRecord])).toBe(false);
});
```

---

## Test Scan Harness (Epic 8)

| Command | Purpose |
|---------|---------|
| `npm run test:scan` | Run scan accuracy tests |
| `npm run test:scan:generate` | Generate expected.json |
| `npm run test:scan:validate` | Validate test data |
| `npm run test:scan:analyze` | Analyze results |
| `npm run test:scan:compare` | A/B prompt comparison |

**Test Images:** 38+ images covering supermarkets, restaurants, gas stations, convenience stores, international receipts

---

## Anti-Patterns to Avoid

| Anti-Pattern | Solution |
|--------------|----------|
| Running tests twice in CI | Single coverage collection per shard |
| Sequential steps that could parallelize | Use matrix jobs |
| Complex regex in code | Simple non-greedy patterns (ReDoS prevention) |
| useMemo results in useEffect deps | Use refs to track source data changes |
| Default array params `{ items = [] }` | Module-level constant: `const EMPTY = []` |
| Portal components tested with container | Use `document.body.querySelectorAll()` |

---

## Sync Notes

- **Generation 5 (2026-01-17):** Updated test count to 3,146+, added CI explicit groups
- CI optimized from ~15 min timeout to ~5 min with 18 parallel jobs
- Story 14.30.8: Explicit test groups replace automatic sharding
- Vitest memory OOM fixed with `fileParallelism: false`
- Epic 14c added 18+ new component test files
