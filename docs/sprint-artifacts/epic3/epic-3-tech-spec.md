# Epic 3 Technical Specification
# Production-Grade Quality & Testing Completion

**Epic ID:** Epic 3
**Epic Name:** Production-Grade Quality & Testing Completion
**Date Created:** 2025-11-23
**Owner:** Charlie (Senior Dev)
**Author:** Winston (Architect)

---

## Epic Goal

Complete the testing and quality infrastructure to production-grade standards by implementing real E2E workflows, accessibility testing, performance monitoring, and process improvements identified in Epic 2 retrospective. This epic closes all testing gaps from Epic 2 and establishes sustainable quality practices for future development.

---

## Background & Context

### Epic 2 Achievements
- ✅ 79.51% test coverage (exceeded 70% target)
- ✅ 71 tests implemented (14 unit + 40 integration + 17 E2E)
- ✅ Three-tier testing framework operational (Vitest, RTL, Playwright)
- ✅ Firebase emulator infrastructure
- ✅ CI/CD pipeline established (GitHub Actions)
- ✅ HIGH risk tests complete (auth, security, data isolation)
- ✅ MEDIUM risk tests complete (CRUD, scanning, analytics, validation)

### Epic 2 Gaps (To Be Addressed in Epic 3)
- ⚠️ E2E tests are skeletal placeholders (17 tests pass but don't validate real workflows)
- ⚠️ No branch protection (broken code can be pushed to main)
- ⚠️ Epic evolution document not maintained throughout epic
- ⚠️ LOW risk tests deferred (responsive design, chart rendering, navigation)
- ⚠️ No accessibility testing (WCAG compliance)
- ⚠️ No performance baselines established
- ⚠️ No coverage enforcement (70%+ not required by CI)

### Strategic Rationale

Epic 3 transforms the application from "has tests" to "production-grade quality":
- **Process Maturity:** Branch protection + epic evolution enforcement = sustainable development
- **E2E Confidence:** Real user workflow tests = regression protection
- **Accessibility:** WCAG basics = broader user access
- **Performance:** Baselines = proactive optimization
- **Quality Gates:** Coverage enforcement = prevent regressions

---

## Technical Architecture

### Current State (Post-Epic 2)

**Testing Infrastructure:**
- Vitest 4.0.13 (unit tests)
- React Testing Library 16.3.0 (integration tests)
- Playwright 1.56.1 (E2E tests)
- Firebase Emulator (local testing)
- GitHub Actions CI/CD
- Coverage: 79.51% (c8/v8)

**Test Breakdown:**
- Unit: 14 tests (gemini.test.ts, smoke.test.ts)
- Integration: 40 tests (auth-flow, data-isolation, firestore-rules, data-persistence, CRUD, analytics, form-validation)
- E2E: 17 tests (smoke, transaction-management, analytics - **skeletal**)

**Gaps:**
- E2E tests don't validate real user workflows
- No accessibility testing framework
- No performance monitoring
- No branch protection rules
- No coverage enforcement

### Target State (Post-Epic 3)

**Process Improvements:**
- ✅ Branch protection enabled (require PR + passing CI)
- ✅ Epic evolution document updated after every story
- ✅ CI/CD debugging guide published

**E2E Testing:**
- ✅ 17 real user workflow tests (replace skeletal tests)
  - Auth flow: Login → Dashboard → Logout
  - Transaction creation: Dashboard → New Transaction → Save → Verify
  - Receipt scanning: Scan → Review → Save → Verify in list
  - Analytics: View trends → Filter by date → Export CSV
  - CRUD operations: Create → Read → Update → Delete

**Accessibility Testing:**
- ✅ Keyboard navigation tests (tab order, enter/space activation)
- ✅ Screen reader tests (ARIA labels, roles, live regions)
- ✅ Color contrast validation (WCAG AA minimum)
- ✅ Focus management tests (modals, navigation)

**Performance Monitoring:**
- ✅ Lighthouse CI integration (performance score baselines)
- ✅ Bundle size tracking (warn on 10%+ increase)
- ✅ Page load time measurements (First Contentful Paint, Time to Interactive)
- ✅ Core Web Vitals monitoring (LCP, FID, CLS)

**Coverage Enforcement:**
- ✅ 70%+ coverage required for PR merge (CI gate)
- ✅ Coverage regression detection (fail if coverage drops)

---

## Implementation Approach

### Phase 1: Process Improvements (Week 1 - Days 1-2)

**Story 3.1: Process & Governance Setup**
- Configure GitHub branch protection rules
- Update story creation workflow to enforce epic evolution updates
- Create CI/CD debugging guide

**Technical Tasks:**
- GitHub settings: Protect `main` branch
- Require status checks: `Test Suite` workflow must pass
- Require pull request reviews (1 approval minimum)
- Update `.bmad/bmm/workflows/create-story/template.md` to include epic evolution AC
- Create `docs/ci-cd/debugging-guide.md` with `act` usage patterns

**Validation:**
- Attempt direct push to main → blocked
- Create PR with failing tests → cannot merge
- Create PR with passing tests → can merge
- Test story creation → epic evolution AC present

### Phase 2: Real E2E Testing (Week 1-2 - Days 3-10)

**Story 3.2: E2E Authentication & Navigation Workflow**
- Replace skeletal auth E2E tests with real workflow tests
- Test: Complete auth flow (login → dashboard → logout)
- Test: Navigation between all views (dashboard → scan → trends → history → settings)
- Test: Unauthenticated user redirect to login
- **Coverage:** 5 meaningful E2E tests (currently 3 skeletal)

**Story 3.3: E2E Transaction Management Workflow**
- Replace skeletal transaction E2E tests with real CRUD workflow
- Test: Create manual transaction → verify in list → edit → save → delete
- Test: Receipt scan → review extracted data → save → verify in list
- Test: Filter transactions by date range
- Test: Sort transactions (newest first, oldest first)
- **Coverage:** 7 meaningful E2E tests (currently 7 skeletal)

**Story 3.4: E2E Analytics & Data Export Workflow**
- Replace skeletal analytics E2E tests with real workflow
- Test: View monthly trends → verify chart renders
- Test: View category breakdown → verify percentages
- Test: Filter analytics by date range → verify recalculation
- Test: Export transactions to CSV → verify file download
- Test: Export transactions to JSON → verify file download
- **Coverage:** 7 meaningful E2E tests (currently 7 skeletal)

**Technical Approach (All E2E Stories):**
- Use Playwright's `page.waitForSelector()` for robust element waiting
- Use `page.locator()` with accessibility attributes (role, label) not fragile selectors
- Reset Firebase emulator data before each test (`npm run test:reset-data`)
- Use test-user-1 credentials for authenticated workflows
- Take screenshots on failure for debugging
- Run E2E tests in CI with headless Chromium

### Phase 3: Accessibility Testing (Week 2 - Days 11-14)

**Story 3.5: Accessibility Testing Framework & Critical Path Tests**
- Install @axe-core/playwright for automated accessibility testing
- Test keyboard navigation (tab order, enter/space, escape)
- Test screen reader labels (ARIA labels, roles, alt text)
- Test color contrast (WCAG AA minimum 4.5:1 for text)
- Test focus management (modals, dropdowns, navigation)
- **Coverage:** 10+ accessibility tests for critical user paths

**Technical Stack:**
- @axe-core/playwright 4.x (automated accessibility testing)
- Playwright keyboard API (keyboard.press('Tab'))
- Manual ARIA validation (getByRole, getByLabel)

**Validation Approach:**
- Run axe scan on each major view (dashboard, scan, trends, history, settings)
- Assert zero critical violations (color contrast, missing labels)
- Assert zero serious violations (keyboard navigation, focus management)
- Allow moderate/minor violations with documentation

### Phase 4: Performance Monitoring (Week 3 - Days 15-18)

**Story 3.6: Performance Baselines & Lighthouse CI**
- Integrate Lighthouse CI into GitHub Actions workflow
- Establish performance baselines (current scores)
- Configure performance budgets (bundle size, load time)
- Add bundle size tracking (warn on 10%+ increase)
- **Coverage:** Lighthouse scores monitored on every PR

**Technical Stack:**
- @lhci/cli 0.13.x (Lighthouse CI)
- lighthouse 11.x (performance auditing)
- bundlesize 0.18.x (bundle size tracking)

**Baselines to Establish:**
- Performance score (target: 90+)
- Accessibility score (target: 90+)
- Best Practices score (target: 90+)
- SEO score (target: 90+)
- First Contentful Paint (target: <1.5s)
- Time to Interactive (target: <3s)
- Bundle size (current: ~624KB, target: maintain or reduce)

### Phase 5: Coverage Enforcement & Quality Gates (Week 3-4 - Days 19-21)

**Story 3.7: Test Coverage Enforcement & CI Quality Gates**
- Configure CI to require 70%+ coverage for PR merge
- Add coverage regression detection (fail if coverage drops >2%)
- Configure coverage reports in PR comments (automatic visibility)
- Document coverage requirements in CONTRIBUTING.md
- **Coverage:** CI blocks PRs below quality thresholds

**Technical Approach:**
- Modify `.github/workflows/test.yml`:
  - Add coverage threshold check step
  - Fail workflow if coverage < 70%
  - Fail workflow if coverage drops >2% from main
  - Upload coverage report to PR comments (github-actions bot)
- Use vitest `--coverage.thresholds.lines=70` flag
- Use coveralls.io or codecov.io for PR comment integration (optional)

---

## Test Strategy & Prioritization

### Test Categories by Priority

**Priority 1: E2E User Workflows (Stories 3.2, 3.3, 3.4)**
- Risk Level: HIGH (regressions directly impact users)
- Current State: 17 skeletal tests (false confidence)
- Target State: 19 meaningful workflow tests
- Time Estimate: 6-8 days (2-3 stories)

**Priority 2: Accessibility Testing (Story 3.5)**
- Risk Level: MEDIUM (legal/compliance risk, UX degradation)
- Current State: No accessibility tests
- Target State: 10+ accessibility tests (critical paths)
- Time Estimate: 3-4 days (1 story)

**Priority 3: Performance Monitoring (Story 3.6)**
- Risk Level: MEDIUM (user experience, SEO impact)
- Current State: No performance baselines
- Target State: Lighthouse CI + bundle tracking
- Time Estimate: 3-4 days (1 story)

**Priority 4: Coverage Enforcement (Story 3.7)**
- Risk Level: MEDIUM (prevent test coverage regressions)
- Current State: No enforcement (manual monitoring)
- Target State: CI gates require 70%+
- Time Estimate: 2-3 days (1 story)

**Priority 5: Process Improvements (Story 3.1)**
- Risk Level: LOW (process quality, not feature quality)
- Current State: Manual process adherence
- Target State: Automated enforcement
- Time Estimate: 1-2 days (1 story)

### Recommended Execution Order

1. **Story 3.1** (Process setup) - 1-2 days
   - Enables clean workflow for remaining stories
   - Branch protection prevents broken commits
   - Epic evolution enforcement ensures documentation

2. **Story 3.2** (E2E Auth) - 2-3 days
   - Foundational user workflow (login required for all features)
   - Establishes E2E testing patterns

3. **Story 3.3** (E2E Transactions) - 2-3 days
   - Core feature workflow (most critical user path)

4. **Story 3.4** (E2E Analytics) - 2-3 days
   - Secondary feature workflow

5. **Story 3.5** (Accessibility) - 3-4 days
   - Can run in parallel with E2E work if resourced

6. **Story 3.6** (Performance) - 3-4 days
   - Requires E2E tests complete (Lighthouse scans full workflows)

7. **Story 3.7** (Coverage enforcement) - 2-3 days
   - Final quality gate establishment

---

## Success Criteria

### Epic-Level Success Criteria

1. ✅ All 19 E2E tests validate real user workflows (no skeletal tests remain)
2. ✅ Accessibility testing covers all critical user paths (10+ tests)
3. ✅ Performance baselines established (Lighthouse CI operational)
4. ✅ Branch protection prevents broken code from reaching main
5. ✅ Epic evolution document maintained throughout epic (updated after each story)
6. ✅ Test coverage maintained at 70%+ (enforced by CI)
7. ✅ Zero test coverage regressions (CI blocks drops >2%)
8. ✅ Application reaches "production-grade" quality standards

### Story-Level Success Criteria

**Story 3.1: Process Setup**
- Branch protection enabled on main
- Story template includes epic evolution AC
- CI/CD debugging guide published

**Story 3.2: E2E Auth**
- 5 auth/navigation workflow tests passing
- Tests use real user interactions (not just assertions)
- Skeletal auth tests replaced

**Story 3.3: E2E Transactions**
- 7 transaction workflow tests passing
- CRUD + scanning workflows validated end-to-end
- Skeletal transaction tests replaced

**Story 3.4: E2E Analytics**
- 7 analytics workflow tests passing
- Chart rendering + data export validated
- Skeletal analytics tests replaced

**Story 3.5: Accessibility**
- 10+ accessibility tests passing
- Zero critical axe violations
- Keyboard navigation functional

**Story 3.6: Performance**
- Lighthouse CI integrated
- Performance baselines documented
- Bundle size tracking operational

**Story 3.7: Coverage Enforcement**
- CI blocks PRs below 70% coverage
- Coverage regression detection working
- Coverage reports in PR comments

---

## Technical Risks & Mitigation

### Risk 1: E2E Test Flakiness

**Risk:** E2E tests may be flaky due to timing issues, network delays, Firebase emulator readiness

**Mitigation:**
- Use Playwright's auto-waiting (`page.waitForSelector()`)
- Increase timeout for emulator operations (already 500ms-1000ms from Epic 2)
- Use `test.describe.serial()` for dependent test steps
- Run E2E tests with `fileParallelism: false` (already configured from Story 2.4 fix)

### Risk 2: Accessibility Testing Learning Curve

**Risk:** Team has no accessibility testing experience, may miss critical issues

**Mitigation:**
- Use automated tool (@axe-core/playwright) for initial scan
- Focus on critical violations only (color contrast, missing labels, keyboard navigation)
- Document findings and fixes for future reference
- Consider external accessibility audit in Epic 4 (out of scope for Epic 3)

### Risk 3: Performance Baselines Too Strict

**Risk:** Lighthouse scores may fail in CI due to environment differences (CI vs. local)

**Mitigation:**
- Establish baselines from CI environment (not local)
- Use "warn" mode initially, not "fail" mode
- Allow 5-point score variance for flaky metrics
- Focus on regression detection, not absolute scores

### Risk 4: Coverage Enforcement Blocks Development

**Risk:** 70% coverage requirement may slow down feature development

**Mitigation:**
- Apply enforcement to main branch only (not feature branches)
- Allow coverage drops <2% (small regressions acceptable)
- Provide clear guidance on writing tests in CONTRIBUTING.md
- Epic 2 already at 79.51%, so 70% threshold has buffer

---

## Dependencies

### External Dependencies
- GitHub Actions (free tier - 2000 min/month private repos, unlimited public)
- Playwright browsers (Chromium only - ~200MB download)
- @axe-core/playwright (npm package)
- @lhci/cli (npm package)
- Firebase emulator (already installed from Epic 2)

### Internal Dependencies
- Epic 2 completed ✅ (testing infrastructure exists)
- Firebase emulator configured ✅ (Story 2.2)
- Test users and fixtures available ✅ (Story 2.2)
- CI/CD pipeline operational ✅ (Story 2.6)
- Branch `main` exists and has commits ✅

### Blocked By
- None (all dependencies satisfied)

---

## Out of Scope

### Explicitly Deferred to Future Epics

- **Visual Regression Testing** (Chromatic, Percy) - Nice-to-have, not critical for MVP
- **Load/Stress Testing** (Artillery, k6) - Low user count expected initially
- **Cross-browser Testing** (Firefox, Safari, Edge) - Chrome coverage sufficient for MVP
- **Mobile App Testing** (React Native, Capacitor) - Web-only for MVP
- **Advanced Monitoring** (Sentry, Datadog, New Relic) - Firebase Console sufficient for MVP
- **Internationalization Testing** (i18n, l10n) - Single language (Spanish) only
- **Security Penetration Testing** - External audit deferred
- **Chaos Engineering** (Chaos Monkey) - Not applicable for MVP scale

### Explicitly NOT in Epic 3

- New feature development (no application code changes beyond test infrastructure)
- UI/UX redesign
- Database schema changes
- Third-party integrations beyond testing tools
- Production deployment (already live from Epic 1)

---

## Timeline & Effort Estimation

### Story Breakdown by Effort

| Story | Description | Story Points | Days | Priority |
|-------|-------------|--------------|------|----------|
| 3.1 | Process & Governance Setup | 2 | 1-2 | P1 |
| 3.2 | E2E Auth & Navigation | 3 | 2-3 | P2 |
| 3.3 | E2E Transaction Management | 5 | 2-3 | P2 |
| 3.4 | E2E Analytics & Export | 5 | 2-3 | P2 |
| 3.5 | Accessibility Testing | 4 | 3-4 | P3 |
| 3.6 | Performance Monitoring | 3 | 3-4 | P3 |
| 3.7 | Coverage Enforcement | 2 | 2-3 | P4 |
| **Total** | **Epic 3 Complete** | **24** | **16-22** | - |

### Timeline Estimate

- **Optimistic:** 16 days (~3 weeks)
- **Realistic:** 19 days (~4 weeks)
- **Pessimistic:** 22 days (~4.5 weeks)

**Recommended Timeline:** 4 weeks with buffer for unforeseen issues

---

## Architectural Decisions

### ADR-008: Branch Protection Strategy

**Context:** Epic 2 retrospective identified that broken code was pushed to main because no enforcement mechanism existed.

**Decision:** Require pull requests + passing CI checks before merge to main

**Rationale:**
- Prevents broken code from reaching main branch
- CI runs all tests before allowing merge
- Provides code review opportunity (even for solo dev)
- Industry standard practice

**Alternatives Considered:**
- Pre-push hooks (local enforcement) - Rejected: Can be bypassed with --no-verify
- Commit message validation - Rejected: Doesn't validate code quality
- Manual testing only - Rejected: Human error, not scalable

**Consequences:**
- Slightly slower development (PR overhead)
- Better code quality
- Fewer broken commits in history

### ADR-009: E2E Test Structure

**Context:** Epic 2 created skeletal E2E tests that pass but don't validate real workflows. Need clear structure for meaningful E2E tests.

**Decision:** Organize E2E tests by user workflow, not by component

**Structure:**
```
tests/e2e/
├── auth-workflow.spec.ts          (login → dashboard → logout)
├── transaction-create.spec.ts     (dashboard → new → save → verify)
├── transaction-scan.spec.ts       (scan → review → save → verify)
├── transaction-edit.spec.ts       (list → edit → save → verify)
├── transaction-delete.spec.ts     (list → delete → verify)
├── analytics-trends.spec.ts       (trends → filter → verify chart)
├── analytics-export.spec.ts       (export CSV/JSON → verify download)
```

**Rationale:**
- User workflows are stable (less brittle than component selectors)
- Maps to real user journeys (acceptance testing)
- Easier to understand test failures (which workflow broke?)

**Alternatives Considered:**
- Component-based tests - Rejected: Too granular for E2E
- Feature-based tests - Rejected: Features span multiple workflows

**Consequences:**
- Some test duplication (auth flow repeated in each test)
- Clearer test failures
- Better regression detection

### ADR-010: Accessibility Testing Scope

**Context:** No accessibility testing exists. WCAG 2.1 has 78 criteria across A, AA, AAA levels.

**Decision:** Focus on WCAG 2.1 Level AA automated checks only (subset of 78 criteria)

**Scope:**
- Automated axe-core checks (covers ~30% of WCAG criteria)
- Keyboard navigation (Tab, Enter, Escape, Space)
- Screen reader labels (ARIA, alt text)
- Color contrast (4.5:1 for text, 3:1 for UI components)

**Out of Scope for Epic 3:**
- Manual accessibility testing (screen reader testing)
- WCAG Level AAA criteria (more stringent)
- Video/audio accessibility (not applicable - no media)
- Cognitive accessibility testing (beyond automation)

**Rationale:**
- Automated testing catches 30% of issues with zero manual effort
- Keyboard navigation + labels = 60% of user accessibility needs
- Manual testing requires specialized skills (defer to Epic 4)
- MVP focus: "good enough" accessibility, not perfection

**Alternatives Considered:**
- Full WCAG 2.1 Level AA compliance - Rejected: Requires manual testing, out of scope
- No accessibility testing - Rejected: Legal/compliance risk, poor UX
- WCAG Level A only - Rejected: Too basic, misses critical usability issues

**Consequences:**
- 30-60% accessibility coverage (automated + keyboard)
- Not fully WCAG compliant (need manual audit later)
- Better than zero accessibility testing

---

## Learnings from Epic 2

### Process Learnings Applied to Epic 3

1. **Epic Evolution Enforcement:** Story template will include mandatory AC for epic evolution updates
2. **Branch Protection:** Implemented in Story 3.1 to prevent broken commits
3. **Test Quality Over Quantity:** No skeletal/placeholder tests allowed
4. **CI Environment Testing:** Use `act` framework to test workflows locally before push
5. **Systematic Debugging:** Document failures and root causes (CI debugging guide in Story 3.1)

### Technical Learnings Applied to Epic 3

1. **Firebase Emulator Reset:** Use `npm run test:reset-data` before E2E tests for consistency
2. **Test Parallelism:** Keep `fileParallelism: false` to avoid emulator race conditions
3. **E2E Test Structure:** Focus on user workflows, not component testing
4. **Coverage Provider:** Continue using @vitest/coverage-v8 (Vitest 4.x compatible)
5. **Environment Variables:** Include all VITE_* vars in CI workflow for E2E tests

---

## Appendix A: Reference Documentation

### Related Epic Documents
- [Epic 1 Retrospective](../epic1/epic-1-retro-2025-11-21.md) - Production deployment learnings
- [Epic 2 Retrospective](../epic2/epic-2-retro-2025-11-23.md) - Testing infrastructure learnings
- [Epic 2 Tech Spec](../epic2/epic-2-tech-spec.md) - Testing framework architecture
- [Epic 2 Evolution](../epic2/epic-2-evolution.md) - Epic 2 state tracking

### Testing Documentation
- [Test Strategy & Risk Register](../../testing/test-strategy.md) - Test prioritization framework
- [Testing Guide](../../testing/testing-guide.md) - How to write tests
- [Testing Quickstart](../../testing/testing-quickstart.md) - Running tests locally
- [Test Environment](../../testing/test-environment.md) - Test users and fixtures

### CI/CD Documentation
- [CI/CD Overview](../../ci-cd/README.md) - Why CI/CD matters
- [CI/CD Setup Guide](../../ci-cd/02-setup-guide.md) - Workflow creation
- [Local Testing Guide](../../ci-cd/03-local-testing.md) - Using `act` framework
- [Reading Workflow Logs](../../ci-cd/04-reading-logs.md) - Debugging CI failures

### Architecture Documentation
- [Architecture Overview](../../architecture.md) - System design + Mermaid diagrams
- [ADR-006: Production Deployment](../../architecture.md#adr-006) - Firestore rules learning
- [ADR-007: Documentation Strategy](../../architecture.md#adr-007) - Epic evolution approach

---

## Appendix B: Epic 3 Story Checklist Template

**Every Epic 3 story MUST include:**

- [ ] Acceptance criteria clearly defined (specific, measurable, testable)
- [ ] Task breakdown with subtasks
- [ ] Explicit AC: "Update Epic 3 evolution document with story changes"
- [ ] Dependencies identified (blocked by, enables)
- [ ] Test validation plan (how to verify ACs)
- [ ] Story points estimated
- [ ] File list (files created/modified)
- [ ] Change log with dates
- [ ] Senior dev review section (post-completion)

**Epic 3 evolution document update MUST include:**

- What changed (infrastructure, tests, documentation added)
- Gaps discovered (issues emerged during implementation)
- Architectural decisions (ADRs, design choices)
- Story completion metrics (tests added, coverage achieved, files modified)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-23
**Status:** Draft → Ready for Story Breakdown
