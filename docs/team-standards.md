# Boletapp Team Standards & Knowledge Base

**Last Updated:** 2026-02-05 (Branch strategy moved to CONTRIBUTING.md, staging-only e2e policy)
**Purpose:** Single source of truth for team agreements, workflow standards, and lessons learned

---

## Table of Contents

1. [Team Agreements](#team-agreements)
2. [Workflow Standards](#workflow-standards)
3. [Testing Standards](#testing-standards)
4. [Deployment Standards](#deployment-standards)
5. [Documentation Standards](#documentation-standards)
6. [Security Standards](#security-standards)
7. [Document Index](#document-index)
8. [Lessons Learned](#lessons-learned)
9. [Known Gotchas](#known-gotchas)

---

## Team Agreements

Agreements made in retrospectives that define how we work as a team.

### Story & Review Process (Epic 4)

1. **Developers never mark stories "done"**
   - Developers mark stories as "review" only
   - Only reviewers mark stories as "done" after approval
   - Prevents false completion patterns
   - *Source: Epic 4 Retrospective*

2. **Blocked code reviews prevent bigger problems**
   - Review friction is valuable friction
   - Better to catch issues in review than in production
   - *Source: Epic 3 Retrospective*

### Deployment Process (Epics 4.5, 5)

3. **Deployment is part of the deliverable**
   - Epic is not complete until deployed and verified in production
   - Include deployment steps in story completion criteria
   - *Source: Epic 4.5 Retrospective*

4. **Branch strategy must be explicit in stories**
   - Reference `docs/branching-strategy.md` in all stories
   - Document merge flow: feature → develop → main (2-branch model)
   - *Source: Epic 4.5 Retrospective, Updated Epic 9*

5. **Firebase commands in completion criteria**
   - Stories that require deployment must include Firebase commands
   - Example: `firebase deploy --only hosting`
   - *Source: Epic 4.5 Retrospective*

6. **Every epic ends with a deployment story**
   - Final story uses standard deployment template
   - Includes branch strategy, merge steps, deployment verification
   - *Source: Epic 5 Retrospective*

7. **CI/CD must auto-deploy to Firebase**
   - No manual deployment steps for production
   - GitHub Actions deploys on merge to main
   - Implemented in Story 6.0 (Epic 6)
   - *Source: Epic 5 Retrospective*

### Documentation (Epics 1, 2, 3, 5)

8. **Epic Evolution Document maintained throughout**
   - Every story must include AC: "Update Epic Evolution document with story changes"
   - Document must track: what changed, gaps discovered, architectural decisions
   - Stories cannot be marked 'done' without evolution doc update
   - *Source: Epic 2 Retrospective*

9. **Document learnings in real-time**
   - Capture issues while they're fresh
   - Don't wait for retrospective to document problems
   - *Source: Epic 4.5 Retrospective*

10. **Team standards live in one document**
    - This document (`docs/team-standards.md`) is the single source of truth
    - Update after each retrospective with new agreements
    - *Source: Epic 5 Retrospective*

11. **Testing patterns and gotchas are documented**
    - Prevent future developers from hitting known issues
    - See [Known Gotchas](#known-gotchas) section
    - *Source: Epic 5 Retrospective*

### Testing & Quality (Epics 2, 3)

12. **Test quality over quantity**
    - No skeletal/placeholder tests
    - Every test must validate meaningful behavior
    - False confidence from hollow tests is dangerous
    - *Source: Epic 2 Retrospective*

13. **Not everything needs automation**
    - Manual testing has value for third-party integrations (e.g., Firebase Auth OAuth)
    - Document rationale for manual vs. automated testing decisions
    - *Source: Epic 3 Retrospective*

14. **Metrics without validation are just numbers**
    - Always question: What's included? How is it calculated?
    - Validate methodology before celebrating metrics
    - *Source: Epic 3 Retrospective*

### Security (Epic 4)

15. **Secrets awareness**
    - Always use pre-commit hooks (gitleaks)
    - Cloud Functions for sensitive operations
    - Never commit API keys or secrets
    - *Source: Epic 4 Retrospective*

### Architecture (Epic 1)

16. **Shared API Key Model**
    - Use shared Gemini API key for all users (standard SaaS pattern)
    - Users don't need their own API keys
    - *Source: Epic 1 Retrospective*

17. **Centralized Firestore Database**
    - User-isolated data paths: `/artifacts/{appId}/users/{userId}/**`
    - Tenant isolation via security rules
    - *Source: Epic 1 Retrospective*

### Epic Sequencing (Epic 3)

18. **Security-first approach**
    - Harden before adding features
    - Epic sequence: Security → Export → Category Learning → Subscriptions → Mobile
    - *Source: Epic 3 Retrospective*

### UX & Design (Epic 6)

19. **UX-heavy epics get formal PRD + Tech-Spec treatment**
    - No shortcuts on design work
    - Involve UX Designer persona in planning
    - *Source: Epic 6 Retrospective*

20. **Design references are gitignored but available locally**
    - Premium templates (Tailwind UI) stay local at `docs/uxui/tailwind-templates/`
    - Reference during development, don't commit to repo
    - *Source: Epic 6 Retrospective*

21. **Production verification is mandatory**
    - Automated tests necessary but not sufficient
    - Human verification catches UX issues that tests miss
    - *Source: Epic 6 Retrospective*

22. **User flow bugs require E2E test coverage**
    - Unit tests validate logic
    - Integration tests validate data flow
    - E2E tests validate user experience timing
    - All three layers needed for confidence
    - *Source: Epic 6 Retrospective*

23. **Domain terminology must be precise in stories**
    - "Item category" vs "transaction category" caused bugs in Epic 6
    - Clarify terminology before implementation
    - *Source: Epic 6 Retrospective*

24. **Test Cloud Functions build locally before pushing**
    - Run `cd functions && npm run build && ls lib/` before CI
    - Catches TypeScript output structure issues immediately
    - Saves ~10 min per failed CI run
    - *Source: Epic 8 Story 8.1 Deployment*

25. **Integration tests that assert on compiled output are fragile**
    - Tests checking `content.toContain('functionName')` break on refactors
    - Update these tests whenever renaming/restructuring functions
    - Consider testing behavior instead of implementation details
    - *Source: Epic 8 Story 8.1 Deployment*

26. **TypeScript include paths affect output directory structure**
    - Adding external dirs (e.g., `../shared`) to tsconfig `include` creates nested output
    - Use prebuild copy scripts instead: `cp -r ../shared/x src/x`
    - Add copied dirs to `.gitignore` (they're build artifacts)
    - *Source: Epic 8 Story 8.1 Deployment*

27. **Never switch to main before merging a feature branch PR**
    - Wait for PR to be merged before checking out main locally
    - Switching to main and deleting the feature branch loses all local changes
    - Proper flow: Create PR → Wait for merge → Fetch/pull main → Delete local feature branch
    - If PR is blocked, keep working on the feature branch until it's merged
    - *Source: Epic 9 Story 9.11 Deployment*

---

## Workflow Standards

### Git Branching Strategy

See [CONTRIBUTING.md](../CONTRIBUTING.md#branch-strategy-2-branch-model) for the full branch strategy (2-branch model: develop + main).

*Simplified from 3-branch to 2-branch in Epic 9 (2025-12-16). Rationale: eliminates sync branch overhead, fewer stale branches, Firebase Preview URLs replace staging branch.*

### Pull Request Process

1. Create PR with descriptive title
2. Fill out PR template (if exists)
3. Wait for CI checks to pass
4. Request review (self-review acceptable for solo dev)
5. Address review feedback
6. Merge when approved and CI green
7. Delete feature branch after merge

### Story Workflow

```
create-story → story-ready → dev-story → code-review → story-done
```

1. **create-story**: SM creates story file from epic
2. **story-ready**: Mark ready for development
3. **dev-story**: Developer implements
4. **code-review**: Senior dev reviews (may BLOCK or APPROVE)
5. **story-done**: REVIEWER marks complete (not developer!)

---

## Testing Standards

### Test Pyramid

```
        E2E (19 tests)
       /            \
      / Integration  \
     /   (48 tests)   \
    /                  \
   /    Unit Tests      \
  /      (70+ tests)     \
 /________________________\
```

### Test File Naming

- Unit tests: `tests/unit/*.test.ts`
- Integration tests: `tests/integration/*.test.tsx`
- E2E tests: `tests/e2e/*.spec.ts`

### Test Coverage Thresholds

- Lines: 45% minimum
- Branches: 30% minimum
- Functions: 25% minimum
- Statements: 40% minimum

### Testing Commands

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Reset test data
npm run test:reset-data
```

### Tiered Test Strategy (Epic 7+)

**Problem:** Full test suite (`npm run test:all`) takes 5+ minutes. Running full tests per story wastes developer time.

**Solution:** Tiered test scripts for different validation needs:

| Script | Duration | Use When |
|--------|----------|----------|
| `npm run test:quick` | ~35s | During development, per task |
| `npm run test:story` | ~2min | Before marking story as "review" |
| `npm run test:sprint` | ~5min | End of epic, before deployment |

**Script Details:**

```bash
# QUICK: TypeScript + parallel unit tests (fastest)
npm run test:quick
# Runs: type-check + unit tests with parallelization
# Use: After each significant code change

# STORY: Quick + integration tests
npm run test:story
# Runs: type-check + unit (parallel) + integration
# Use: Before marking story ready for review

# SPRINT: Full test suite (comprehensive)
npm run test:sprint
# Runs: unit + integration + E2E
# Use: End of epic, before deployment
```

**Why it works:**
- Unit tests run in parallel (6 threads) via `vitest.config.unit.ts`
- Integration tests run sequentially (Firebase emulator race conditions)
- E2E tests run ONLY against staging environment (no local/emulator e2e)
- E2E only needed for epic completion, not per-story

**Manual test targeting (for debugging):**
```bash
# Single file
npm run test:unit -- --run tests/unit/analytics/TemporalBreadcrumb.test.tsx

# Pattern match
npm run test:unit -- --run "tests/unit/analytics/*"

# Run parallel unit tests only
npm run test:unit:parallel
```

*Source: Epic 7 Story 7.7 - Test optimization*

### Hybrid Testing Strategy

For features with third-party integrations (OAuth, etc.):
- **E2E tests**: UI validation, user interactions, accessibility
- **Integration tests**: Auth state management, business logic, data persistence
- **Manual testing**: OAuth flows, third-party SDK functionality

Document rationale for manual vs. automated testing decisions.

---

## Deployment Standards

### Pre-Deployment Checklist

- [ ] All tests passing (unit, integration, E2E)
- [ ] TypeScript compiles without errors
- [ ] No secrets in code (gitleaks check)
- [ ] PR approved and merged through proper flow
- [ ] Production URL verified after deployment

### Firebase Deployment Commands

```bash
# Deploy hosting only
firebase deploy --only hosting

# Deploy functions only
firebase deploy --only functions

# Deploy everything
firebase deploy

# Deploy to staging channel
firebase hosting:channel:deploy staging
```

### Auto-Deploy (Story 6.0)

**Trigger:** Push to `main` branch after tests pass

**How it works:**
1. All tests must pass in the `test` job
2. Deploy job runs automatically on push to `main`
3. Firebase Hosting is updated with new build
4. No manual intervention required

**Required Secrets (GitHub Repository):**
- `FIREBASE_SERVICE_ACCOUNT` - Firebase service account JSON
- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID
- `VITE_GEMINI_API_KEY` - Gemini API key
- `VITE_GEMINI_MODEL` - Gemini model name

**Manual Deployment (if needed):**
```bash
firebase deploy --only hosting
```

### Post-Deployment Verification

1. Visit production URL: https://boletapp-d609f.web.app
2. Test critical user flows:
   - Authentication (sign in/out)
   - Receipt scanning
   - Transaction CRUD
   - Data export
3. Check browser console for errors
4. Verify Firebase console for function errors

---

## Documentation Standards

### Required Documentation Per Story

1. **Dev Notes**: Technical approach, architecture constraints
2. **Completion Notes**: What was implemented, any deviations
3. **Code Review Notes**: Review outcome, findings, action items
4. **File List**: Files created/modified

### Epic Evolution Document

Location: `docs/sprint-artifacts/epic{N}/epic-{N}-evolution.md`

Must include:
- Before State (at epic start)
- After State (updated per story)
- Story-by-Story changes
- Gaps discovered
- Architectural decisions

### ADR (Architecture Decision Records)

Location: `docs/architecture.md` or `docs/adr/`

Format:
- Context
- Decision
- Rationale
- Consequences

---

## Security Standards

### Defense in Depth Layers

1. **Layer 1**: Pre-commit hook (gitleaks) - prevents secrets from entering git
2. **Layer 2**: CI scanning (gitleaks full history) - catches anything missed
3. **Layer 3**: Architecture pattern (Cloud Functions for sensitive operations)
4. **Layer 4**: Dependency scanning (npm audit + eslint-plugin-security)

### Secrets Management

- **Never** commit API keys, passwords, or secrets
- Use environment variables for sensitive configuration
- Cloud Functions handle sensitive API calls (Gemini)
- Firebase security rules enforce tenant isolation

### Pre-Commit Hook Setup

```bash
# Install gitleaks
brew install gitleaks  # macOS
# or download from https://github.com/gitleaks/gitleaks

# Pre-commit hook is configured in .husky/pre-commit
```

---

## Document Index

### Core Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Team Standards | `docs/team-standards.md` | This document - team agreements and standards |
| Architecture | `docs/architecture.md` | System architecture, ADRs, diagrams |
| PRD | `docs/prd.md` | Product requirements |
| Epics | `docs/epics.md` | Epic definitions and story breakdowns |
| Branching Strategy | `docs/branching-strategy.md` | Git workflow |

### Sprint Artifacts

| Document | Location | Purpose |
|----------|----------|---------|
| Sprint Status | `docs/sprint-artifacts/sprint-status.yaml` | Epic/story status tracking |
| Story Files | `docs/sprint-artifacts/epic{N}/` | Individual story details |
| Retrospectives | `docs/sprint-artifacts/epic{N}/epic-{N}-retro-*.md` | Epic retrospective notes |

### Business Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Pricing Model | `docs/business/pricing-model.md` | 4-tier subscription structure |
| Cost Analysis | `docs/business/cost-analysis.md` | Infrastructure costs |
| Revenue Projections | `docs/business/revenue-projections.md` | Business scenarios |

### Testing Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Testing Guide | `docs/testing-guide.md` | Comprehensive testing documentation |
| Test Strategy | `docs/test-strategy.md` | Risk-based test prioritization |
| Test Environment | `docs/test-environment.md` | Test users, fixtures, setup |

### Security Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| Security README | `docs/security/README.md` | Security overview |
| OWASP Checklist | `docs/security/owasp-checklist.md` | OWASP Top 10 validation |
| Incident Response | `docs/security/incident-response.md` | Security incident procedures |

### Templates

| Template | Location | Purpose |
|----------|----------|---------|
| Deployment Story | `docs/templates/deployment-story-template.md` | Final epic story template |
| Epic Evolution | `docs/templates/epic-evolution-template.md` | Epic tracking template |

### Retrospective Documents

| Epic | Date | Location |
|------|------|----------|
| Epic 1 | 2025-11-21 | `docs/sprint-artifacts/epic1/epic-1-retro-2025-11-21.md` |
| Epic 2 | 2025-11-23 | `docs/sprint-artifacts/epic2/epic-2-retro-2025-11-23.md` |
| Epic 3 | 2025-11-26 | `docs/sprint-artifacts/epic3/epic-3-retro-2025-11-26.md` |
| Epic 4 | 2025-11-29 | `docs/sprint-artifacts/epic4/epic-4-retro-2025-11-29.md` |
| Epic 4.5 | 2025-12-02 | `docs/sprint-artifacts/epic4-5/epic-4-5-retro-2025-12-02.md` |
| Epic 5 | 2025-12-03 | `docs/sprint-artifacts/epic5/epic-5-retro-2025-12-03.md` |
| Epic 6 | 2025-12-04 | `docs/sprint-artifacts/epic6/epic-6-retro-2025-12-04.md` |

### Design References

| Resource | Location | Notes |
|----------|----------|-------|
| Tailwind UI Templates | `docs/uxui/tailwind-templates/tailwind_templates/` | Premium (gitignored) |

---

## Lessons Learned

Key insights from retrospectives that improved our process.

### Technical Lessons

1. **Testing infrastructure is a velocity multiplier** (Epic 5)
   - Investment in Epics 2-3 enabled 5 stories in 2 days
   - Can move fast AND be confident nothing breaks

2. **Foundation-first architecture pays off** (Epic 5)
   - CSV utilities in Story 5.1 enabled rapid development of 5.2, 5.4, 5.5
   - Generic, reusable code beats copy-paste

3. **Firestore requires security rules for data persistence** (Epic 1)
   - Without rules, Firestore denies all access by default
   - User isolation pattern: `/artifacts/{appId}/users/{userId}/**`

4. **Phased extraction prevents integration issues** (Epic 1)
   - Start with lowest-risk, no-dependency code (utilities)
   - Build up incrementally (services → hooks → components → views)

5. **CI environment differs from local** (Epic 2)
   - First-time CI setup requires debugging iteration
   - Document specific configurations that work

6. **Hybrid testing strategy works** (Epic 3)
   - E2E for UI, integration for business logic
   - Combined coverage exceeds either alone

### Process Lessons

7. **Process enforcement works** (Epic 3)
   - If it's not in the AC, it doesn't get done
   - Explicit requirements beat implicit expectations

8. **Action item follow-through enables success** (Epic 2)
   - 100% completion of previous retro items enabled Epic 2 success
   - Follow-through matters more than quantity

9. **Iterative code review improves solutions** (Epic 4)
   - First review identifies improvements
   - Second review validates implementation
   - Better solutions emerge through iteration

10. **Deployment is part of the deliverable** (Epic 4.5)
    - Not complete until deployed and verified
    - Include deployment steps in acceptance criteria

11. **CI/CD auto-deploy enables rapid bug fixing** (Epic 6)
    - Same-day bug fixes only possible with auto-deploy
    - Manual deployment would have delayed resolution
    - Investment in infrastructure pays immediate dividends

12. **User flow bugs need E2E tests** (Epic 6)
    - Unit tests validate logic
    - Integration tests validate data flow
    - E2E tests validate user experience timing
    - All three layers needed for full confidence

13. **Domain confusion causes bugs** (Epic 6)
    - "Item category" vs "transaction category" caused 3 bugs
    - Precise domain language matters
    - Clarify terminology in stories before implementation

14. **Tiered testing saves significant time** (Epic 7)
    - Full test suite per story wastes 5+ minutes each time
    - Parallel unit tests complete in ~35s vs ~3min sequential
    - Reserve full suite for epic completion, use quick/story tiers during dev
    - *Source: Epic 7 Story 7.7*

15. **Keep local branch in sync during PR deployment** (Epic 9)
    - When deploying a feature branch via PR, don't switch to main locally
    - Switching branches before merge loses all uncommitted/unpushed work
    - Correct flow: push feature branch → create PR → wait for merge → fetch main → delete local feature branch
    - This ensures local state matches deployed state
    - *Source: Epic 9 Story 9.11*

16. **Sync branches when main gets ahead** (Epic 9)
    - If PRs are merged directly to main (hotfixes, urgent changes), develop/staging get out of sync
    - Before deploying new features, create sync PR: main → develop
    - Then create feature branch from synced develop
    - Prevention: always prefer the full flow (feature → develop → staging → main)
    - Check divergence before starting: `git fetch && git log develop..main`
    - *Source: Epic 9 Story 9.15 Deployment*

---

## Known Gotchas

Technical issues and their solutions that future developers should know about.

### Vitest Module State Contamination (Epic 5)

**Problem:** Cross-test spy assertions can fail due to vitest module state contamination.

**Symptoms:**
- Spy on a function in one test
- Assertion fails in another test even though the function was called
- Tests pass individually but fail when run together

**Solution:**
- Avoid cross-test spy assertions
- Reset mocks between tests: `vi.resetAllMocks()` in `beforeEach`
- Use isolated test contexts where possible

**Example:**
```typescript
// DON'T: Rely on spy state across tests
const spy = vi.spyOn(module, 'function');
// ... later in another test
expect(spy).toHaveBeenCalled(); // May fail due to module state

// DO: Reset mocks between tests
beforeEach(() => {
  vi.resetAllMocks();
});
```

*Source: Epic 5 Story 5.5*

### Firebase Auth OAuth in Headless CI (Epic 3)

**Problem:** Firebase Auth OAuth popup cannot be automated in headless CI.

**Solution:** Hybrid testing strategy:
- E2E tests: UI validation without full OAuth flow
- Integration tests: Auth state management with mocked auth
- Manual testing: Full OAuth flow in browser

**Test Authentication Bypass:**
```typescript
// For E2E testing, use signInWithTestCredentials pattern
// See tests/e2e/auth-workflow.spec.ts for implementation
```

*Source: Epic 3 Retrospective*

### Firestore Offline Persistence Hanging (Epic 1)

**Problem:** Firestore's offline persistence can make `addDoc` hang if there are network issues.

**Solution:** Fire-and-forget pattern for optimistic UI updates:
```typescript
// Don't await if you want optimistic UI
addDoc(collection, data); // Fire and forget

// Or handle the promise separately
addDoc(collection, data).catch(handleError);
```

*Source: Epic 1 Story 1.2*

### ESLint 9 Flat Config (Epic 4)

**Problem:** ESLint 9 uses flat config format (`eslint.config.mjs`), not legacy `.eslintrc.json`.

**Solution:** Use flat config format:
```javascript
// eslint.config.mjs
export default [
  // ... configuration
];
```

*Source: Epic 4 Story 4.3*

### Coverage Including Test Files (Epic 3)

**Problem:** Vitest coverage reporter was including test files in coverage calculation, inflating numbers.

**Solution:** Exclude test files from coverage:
```typescript
// vite.config.ts
coverage: {
  exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts']
}
```

*Source: Epic 3 Story 3.7*

### Category Learning Prompt Timing (Epic 6)

**Problem:** Category learning prompt doesn't appear when expected.

**Symptoms:**
- User changes category on an item
- Clicks save
- Navigates away without seeing prompt
- Mapping never saved

**Root Cause:** `onSave()` navigated away before modal could render.

**Solution:** Show prompt BEFORE calling save, then call save after user responds:
```typescript
// DON'T: Navigate immediately
const handleSave = () => {
  saveTransaction();
  navigate('/history'); // Prompt never shows!
};

// DO: Wait for user response
const handleSave = () => {
  if (hasChanges) {
    setShowLearningPrompt(true); // Show prompt first
    // Save happens in prompt callback
  } else {
    saveTransaction();
    navigate('/history');
  }
};
```

*Source: Epic 6 Story 6.6*

### Item Category vs Transaction Category (Epic 6)

**Problem:** Confusion between item-level and transaction-level categories.

**Context:**
- `transaction.category` - Category for the overall transaction (e.g., "Shopping")
- `item.category` - Category for each line item (e.g., "Groceries", "Household")

**Symptoms:**
- Category learning tracked wrong field
- Mappings saved for transaction category instead of item category
- Auto-apply didn't work as expected

**Solution:** Be explicit in variable naming and comments:
```typescript
// DON'T: Ambiguous naming
const originalCategory = transaction.category;

// DO: Explicit naming
const originalItemCategories = transaction.items.map(i => i.category);
const originalTransactionCategory = transaction.category;
```

*Source: Epic 6 Story 6.6*

---

## Maintenance

This document should be updated:
- After each retrospective with new agreements
- When new gotchas are discovered
- When standards change
- When new documentation is created

**Last updated by:** Cleanup session 2026-02-05 - Branch strategy consolidated to CONTRIBUTING.md, staging-only e2e policy
