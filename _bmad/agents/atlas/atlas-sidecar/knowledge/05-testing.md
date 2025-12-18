# Testing Patterns & Coverage Expectations

> Section 5 of Atlas Memory
> Last Sync: 2025-12-18
> Sources: test-strategy.md, retrospectives, CI/CD docs

## Current Metrics (Post-Epic 9)

| Metric | Value |
|--------|-------|
| Unit Tests | 891+ passing |
| Integration Tests | 328+ passing |
| Total Tests | 1,219+ |
| Coverage | 84%+ |
| E2E Framework | Playwright configured |

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

<!-- Synced from: epic-8-retrospective.md -->

| Job | Target | Max Allowed |
|-----|--------|-------------|
| setup | ~2 min | 3 min |
| test-unit | ~2 min | 4 min |
| test-integration | ~2 min | 4 min |
| test-e2e | ~2.5 min | 5 min |
| security | ~2 min | 3 min |
| **Total PR** | **~4-5 min** | **7 min** |

### Anti-Patterns to Avoid
- Running same tests twice
- Sequential steps that could be parallel
- Installing tools that aren't cached
- Running expensive checks (Lighthouse) on every PR

## Workflow Validations

### Critical User Journeys to Test
1. **Auth Flow** - Sign in → Access data → Sign out
2. **Scan Flow** - Capture → OCR → Edit → Save
3. **Learning Flow** - Edit → Prompt → Save mapping → Auto-apply
4. **Analytics Flow** - Navigate → Drill-down → Filter → View transactions

---

## Sync Notes

- Test metrics from Epic 9 completion
- Scan test harness from Epic 8 fully operational
- CI/CD optimized to ~4 min for PRs (63% faster after Epic 8)
