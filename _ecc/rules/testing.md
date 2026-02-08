# Testing Conventions

## Test Tiers - Use the Right Command

| Command | Duration | When |
|---------|----------|------|
| `npm run test:quick` | ~35s | After each task during development |
| `npm run test:story` | ~2min | Before marking story as "review" |
| `npm run test:sprint` | ~5min | End of epic, before deployment |

Always run the lightest sufficient tier. Prefer `npx vitest run <path>` for a single file.

## CI-Enforced Coverage Thresholds

Lines: 45% | Branches: 30% | Functions: 25% | Statements: 40%

New code should meet or exceed these. Do not lower thresholds.

## File Layout

- Unit: `tests/unit/**/*.test.ts(x)` - mirrors `src/` structure
- Integration: `tests/integration/**/*.test.ts(x)` - requires Firebase emulators (`npm run emulators`)
- E2E: `tests/e2e/staging/**/*.spec.ts` - staging environment ONLY

## E2E Testing - Staging Only

IMPORTANT: E2E tests run ONLY against the staging environment. No local/emulator E2E testing.

**How to run E2E tests:**
1. Start local dev server pointing to staging backend: `npm run dev:staging`
2. Run tests: `npm run test:e2e:staging`
3. Or a single spec: `npx playwright test tests/e2e/staging/your-test.spec.ts --project=staging`
4. Headed mode (see browser): add `--headed`

**Playwright projects:**
- `staging` - standalone tests using TestUserMenu for auth (main E2E workflow)
- `multi-user` - multi-user tests with independent auth contexts (`npm run test:e2e:multi-user`)
- `authenticated` / `unauthenticated` - legacy projects using global setup

**Test users (staging):** alice, bob, charlie, diana - authenticate via `[data-testid="test-login-button"]` -> `[data-testid="test-user-{name}"]`

**E2E conventions:**
- Mobile viewport: `{ width: 360, height: 780 }` always
- Timeout: 60-120s for journeys, 180s for cleanup-heavy tests
- Screenshots at each step: `fullPage: true`, saved to `test-results/{spec-name}/{step}-{description}.png` (each spec gets its own persistent subfolder — re-running one spec only overwrites its folder, not others)
- Playwright auto-artifacts (traces, failure screenshots, videos) go to `playwright-artifacts/` (cleaned per run) — do NOT save manual screenshots there
- ALWAYS cleanup test data at end of spec
- After creating data in one view and testing in another, force `page.reload()` for data refresh
- See `tests/e2e/E2E-TEST-CONVENTIONS.md` for full guide, test IDs, and patterns

## E2E Pre-Flight Checklist (MANDATORY)

Before writing any E2E test interactions, complete these steps:

### Step 1: Component TestId Map
For EVERY component the test will interact with:
- **Preferred (if playwright-cli available):** Use `playwright-cli -s=session snapshot` to capture accessible element refs automatically — returns roles, labels, text, and data-testid in one shot (~93% fewer tokens than manual reading)
- **Fallback:** Read the component's `.tsx` source file manually
- Extract all `data-testid` attributes (grep for `data-testid`)
- Record actual button/label text from `translations.ts`
- Note dialog open/close mechanics (backdrop testid, dismiss behavior)
- Note any loading states or optimistic placeholders in hooks

### Step 2: Data Flow Analysis
For EVERY mutation the test will trigger:
- Read the service function (e.g., `groupService.ts`) to understand the write
- Read the hook (e.g., `useGroups.ts`) to find optimistic update patterns
- Search for: `PENDING`, `temp-`, `loading`, `optimistic` in hook code
- If optimistic updates exist: plan polling/retry logic BEFORE writing test

### Step 3: Environment Readiness
For staging-dependent features:
- Read `firestore.rules` for the collections the feature accesses
- Verify rules allow the test's cross-user operations (e.g., non-member reads)
- Check if any Cloud Functions are required and deployed to staging

### Step 4: Cleanup Strategy
- Plan `try/finally` cleanup from the start
- For shared staging: add pre-test cleanup of residual E2E data
- For multi-user: plan bidirectional cleanup (non-owner leaves, then owner deletes)
- Name test data with `E2E` prefix + `Date.now()` suffix for cleanup targeting

### E2E Selector Priority
Always use this priority order: `data-testid` > `getByRole` > scoped locator > bare text (last resort)

### E2E Wait Strategy
- Use `element.waitFor({ state: 'hidden/visible' })` for state changes
- Use `waitForTimeout` ONLY for settling (< 1000ms)
- NEVER use `waitForTimeout(2000+)` for async operations
- NEVER use `waitForLoadState('networkidle')` with Firebase (WebSocket keeps connection alive)

## What NOT to Test

- React rendering alone (React tests itself)
- Firebase mock implementations (use emulator for integration tests)
- TypeScript compilation (tsc handles this)
- Constants and trivial values
- Implementation details - prefer `toHaveBeenCalledWith(expected)` over bare `toHaveBeenCalled`

## Common Test Pitfalls

- Default array/object params as hook dependencies cause infinite loops (`[] !== []` on each render)
- `setTimeout` in components: use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`
- `useMemo` value in `useEffect` dependency array causes loops
- Vitest module state contamination: always reset mocks between tests with `vi.resetAllMocks()`
- Post-edit hook flags `toHaveBeenCalled` without `toHaveBeenCalledWith` - prefer the specific form
