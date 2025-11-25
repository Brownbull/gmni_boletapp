# Story 3.1: Process & Governance Setup

Status: ready-for-dev

## Story

As a DevOps engineer,
I want branch protection and process enforcement mechanisms in place,
So that code quality is maintained through automated guardrails.

## Requirements Context

**Epic:** Production-Grade Quality & Testing Completion (Epic 3)

**Story Scope:**
This story establishes process governance and documentation infrastructure that will support all subsequent stories in Epic 3. It configures GitHub branch protection to prevent direct pushes to main, creates the CI/CD debugging guide for development workflow documentation, and ensures epic evolution tracking is properly enforced. This is the foundation story that enables clean PR workflows for all remaining stories.

**Key Requirements:**
- Establish multi-branch strategy: `main` (production), `staging` (QA/UAT), `develop` (development)
- Enable GitHub branch protection on all three branches with appropriate rules
- Create CI/CD debugging guide documenting `act` framework usage for local testing
- Verify branch protection is working (direct push blocked, failing PR cannot merge)
- Update Epic 3 evolution document with Story 3.1 completion

**Priority:** This is the first story in Epic 3 and must complete before other stories to enable proper PR-based workflows.

[Source: docs/sprint-artifacts/tech-spec-epic-3.md § Story 3.1: Process & Governance Setup]
[Source: docs/planning/epics.md § Story 3.1]

## Acceptance Criteria

**AC #1:** Multi-branch strategy established
- Verification: Three branches exist: `main` (production), `staging` (QA/UAT), `develop` (development)
- Branches created from current main with proper initial state
- Source: User requirement for production-like structure

**AC #2:** GitHub branch protection enabled on `main` (production)
- Verification: Direct push to main is blocked; PR from `staging` only is required
- Config requirements: Require PR reviews (can be 0 for solo dev), require ALL status checks to pass
- Strictest protection level - production deployments only
- Source: Tech Spec § Acceptance Criteria 3.1.1

**AC #3:** GitHub branch protection enabled on `staging` (QA/UAT)
- Verification: Direct push to staging is blocked; PR from `develop` or hotfix branches required
- Config requirements: Require PR, require status checks to pass
- Integration testing branch - validates features before production
- Source: User requirement for QA/UAT environment

**AC #4:** GitHub branch protection enabled on `develop` (development)
- Verification: Direct push to develop is blocked; PR from feature branches required
- Config requirements: Require PR, require status checks to pass (can be less strict)
- Active development branch - all feature work merges here first
- Source: User requirement for development environment

**AC #5:** CI status checks required before merge on all protected branches
- Verification: PR with failing tests cannot merge on any protected branch
- Source: Tech Spec § Acceptance Criteria 3.1.2

**AC #6:** Branching workflow documented
- Verification: `docs/branching-strategy.md` exists with clear workflow documentation
- Content: Branch purposes, merge flow diagram, naming conventions
- Source: User requirement for production-like structure

**AC #7:** CI/CD debugging guide created
- Verification: `docs/ci-cd/debugging-guide.md` exists with comprehensive content
- Content requirements: Document `act` framework usage, common CI failures, troubleshooting steps
- Source: Tech Spec § Acceptance Criteria 3.1.4

**AC #8:** Epic 3 evolution document updated
- Verification: Story 3.1 section in `docs/sprint-artifacts/epic3/epic-3-evolution.md` completed
- Source: Tech Spec § Acceptance Criteria 3.1.5

## Tasks / Subtasks

### Task 1: Create Multi-Branch Structure (AC: #1)
- [ ] Ensure current `main` branch is up to date and stable
- [ ] Create `staging` branch from `main`:
  ```bash
  git checkout main
  git pull origin main
  git checkout -b staging
  git push -u origin staging
  ```
- [ ] Create `develop` branch from `main`:
  ```bash
  git checkout main
  git checkout -b develop
  git push -u origin develop
  ```
- [ ] Verify all three branches exist on GitHub remote
- [ ] Set `develop` as the default branch for new PRs (optional, recommended)

### Task 2: Configure Branch Protection for `main` (Production) (AC: #2, #5)
- [ ] Navigate to GitHub repository settings (Settings → Branches)
- [ ] Add branch protection rule for `main` branch
- [ ] Configure STRICT production rules:
  - [ ] Require a pull request before merging: Enabled
  - [ ] Require approvals: 0 (solo dev) or 1+ (team mode)
  - [ ] Dismiss stale PR approvals when new commits pushed: Enabled
  - [ ] Require status checks to pass before merging: Enabled
  - [ ] Require branches to be up to date before merging: Enabled
  - [ ] Select required status checks: `test` (from .github/workflows/test.yml)
  - [ ] Require conversation resolution before merging: Enabled
  - [ ] Do not allow bypassing the above settings: Enabled
  - [ ] Restrict who can push: Only allow merges from `staging` (via PR)
  - [ ] Allow force pushes: Disabled
  - [ ] Allow deletions: Disabled
- [ ] Save branch protection rule

### Task 3: Configure Branch Protection for `staging` (QA/UAT) (AC: #3, #5)
- [ ] Add branch protection rule for `staging` branch
- [ ] Configure QA/UAT rules:
  - [ ] Require a pull request before merging: Enabled
  - [ ] Require approvals: 0 (solo dev)
  - [ ] Require status checks to pass before merging: Enabled
  - [ ] Select required status checks: `test`
  - [ ] Do not allow bypassing the above settings: Enabled
  - [ ] Allow force pushes: Disabled
  - [ ] Allow deletions: Disabled
- [ ] Save branch protection rule

### Task 4: Configure Branch Protection for `develop` (Development) (AC: #4, #5)
- [ ] Add branch protection rule for `develop` branch
- [ ] Configure development rules (slightly less strict):
  - [ ] Require a pull request before merging: Enabled
  - [ ] Require approvals: 0 (solo dev)
  - [ ] Require status checks to pass before merging: Enabled
  - [ ] Select required status checks: `test`
  - [ ] Do not allow bypassing the above settings: Enabled (or can disable for emergencies)
  - [ ] Allow force pushes: Disabled
  - [ ] Allow deletions: Disabled
- [ ] Save branch protection rule

### Task 5: Verify Branch Protection (AC: #2, #3, #4, #5)
- [ ] Test 1: Attempt direct push to `main` - verify blocked
- [ ] Test 2: Attempt direct push to `staging` - verify blocked
- [ ] Test 3: Attempt direct push to `develop` - verify blocked
- [ ] Test 4: Create feature branch, open PR to `develop` with failing test - verify merge blocked
- [ ] Test 5: Fix test, verify PR can now merge to `develop`
- [ ] Test 6: Open PR from `develop` to `staging` - verify workflow works
- [ ] Test 7: Open PR from `staging` to `main` - verify workflow works
- [ ] Document test results

### Task 6: Create Branching Strategy Documentation (AC: #6)
- [ ] Create `docs/branching-strategy.md`
- [ ] Document branch purposes:
  - [ ] `main` - Production branch, deployed to https://boletapp-d609f.web.app
  - [ ] `staging` - QA/UAT branch, for integration testing before production
  - [ ] `develop` - Development branch, active development work
- [ ] Document merge flow with Mermaid diagram:
  ```
  feature/* → develop → staging → main
  hotfix/*  → staging → main (+ cherry-pick to develop)
  ```
- [ ] Document branch naming conventions:
  - [ ] `feature/description` - New features
  - [ ] `bugfix/description` - Bug fixes
  - [ ] `hotfix/description` - Production hotfixes
  - [ ] `chore/description` - Maintenance tasks
- [ ] Document PR requirements for each branch
- [ ] Document deployment triggers (future: auto-deploy from main)

### Task 7: Create CI/CD Debugging Guide (AC: #7)
- [ ] Create `docs/ci-cd/debugging-guide.md` if not exists
- [ ] Document the `act` framework:
  - [ ] What is `act` - GitHub Actions local runner
  - [ ] Installation instructions (brew, npm, etc.)
  - [ ] Basic usage: `act push`, `act pull_request`
  - [ ] Common flags: `-j job_name`, `--secret-file`, `--verbose`
  - [ ] Limitations of `act` vs real GitHub Actions
- [ ] Document common CI failures and solutions:
  - [ ] Node.js version mismatch (v18 vs v20)
  - [ ] Firebase emulator startup failures
  - [ ] Playwright browser installation issues
  - [ ] Environment variable missing errors
  - [ ] Port conflicts (5173 vs 5174)
  - [ ] Coverage provider compatibility
- [ ] Document workflow debugging techniques:
  - [ ] Reading GitHub Actions logs
  - [ ] Using `gh run view` CLI command
  - [ ] Enabling debug logging with `ACTIONS_STEP_DEBUG`
- [ ] Reference existing CI/CD documentation in `docs/ci-cd/`

### Task 8: Update Epic 3 Evolution Document (AC: #8)
- [ ] Update `docs/sprint-artifacts/epic3/epic-3-evolution.md`
- [ ] Complete Story 3.1 section:
  - [ ] Change status from `backlog` to `completed`
  - [ ] Document "What Changed" section (multi-branch strategy established)
  - [ ] Document "Files Added/Modified" section
  - [ ] Document "Architecture Impact" section (branching strategy ADR)
  - [ ] Document "Discoveries" section
  - [ ] Complete "Before → After Snapshot" diff

### Task 9: Final Validation (AC: All)
- [ ] Verify all acceptance criteria are met
- [ ] Ensure all documentation is cross-linked
- [ ] Update story status to `review`

## Dev Notes

### Multi-Branch Strategy Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRANCHING STRATEGY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  feature/*  ──────┐                                              │
│  bugfix/*   ──────┼──► develop ──► staging ──► main             │
│  chore/*    ──────┘       │          │          │               │
│                           │          │          │               │
│                     Development   QA/UAT    Production          │
│                      (active)    (testing)  (deployed)          │
│                                                                  │
│  hotfix/*  ─────────────────────► staging ──► main              │
│                                      │                           │
│                            (cherry-pick back to develop)         │
└─────────────────────────────────────────────────────────────────┘
```

**Branch Purposes:**

| Branch | Purpose | Deploys To | Protection Level |
|--------|---------|------------|------------------|
| `main` | Production releases | https://boletapp-d609f.web.app | STRICT (highest) |
| `staging` | QA/UAT testing | (future: staging URL) | MODERATE |
| `develop` | Active development | Local only | STANDARD |

**Workflow:**
1. Developer creates `feature/my-feature` from `develop`
2. PR to `develop` → CI runs → Merge when green
3. PR from `develop` to `staging` → QA testing
4. PR from `staging` to `main` → Production deployment

### GitHub Branch Protection Configuration

**`main` (Production) - STRICTEST:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Require pull request | Yes | Only staging can merge to main |
| Required approvals | 0 (solo) / 1+ (team) | Enforce review for production |
| Dismiss stale approvals | Yes | New commits require re-approval |
| Require status checks | Yes | All tests must pass |
| Require up-to-date branch | Yes | No stale merges to production |
| Require conversation resolution | Yes | All comments addressed |
| Allow bypassing | No | No exceptions for production |
| Allow force pushes | No | Never rewrite production history |
| Allow deletions | No | Protect production branch |

**`staging` (QA/UAT) - MODERATE:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Require pull request | Yes | Develop or hotfix branches only |
| Required approvals | 0 | Solo dev can self-approve |
| Require status checks | Yes | Tests must pass |
| Allow bypassing | No | Maintain QA integrity |
| Allow force pushes | No | Protect QA history |

**`develop` (Development) - STANDARD:**

| Setting | Value | Rationale |
|---------|-------|-----------|
| Require pull request | Yes | Feature branches only |
| Required approvals | 0 | Fast iteration |
| Require status checks | Yes | Tests must pass |
| Allow bypassing | Optional | Can enable for emergencies |
| Allow force pushes | No | Protect shared history |

**Team Mode Upgrades:**
- Increase required approvals on `main` to 1+
- Add CODEOWNERS file for automatic reviewer assignment
- Enable required linear history for cleaner git log

### CI/CD Debugging with `act`

**Overview:**
`act` is a tool that runs GitHub Actions locally using Docker containers. It allows testing workflow changes without pushing to GitHub.

**Installation:**
```bash
# macOS
brew install act

# npm (cross-platform)
npm install -g @nektos/act

# Linux (using script)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

**Key Limitations:**
- Requires Docker to be running
- Some GitHub Actions features not fully supported (e.g., cache, upload-artifact)
- Environment may differ from real GitHub runners
- Firebase emulator may require additional configuration

**When to Use `act` vs Push to GitHub:**
- Use `act` for: Syntax validation, step ordering, basic workflow testing
- Use GitHub for: Full integration testing, artifact uploads, badge updates

### Project Structure Notes

**Files to Create:**
- `docs/branching-strategy.md` - Multi-branch workflow documentation with Mermaid diagrams
- `docs/ci-cd/debugging-guide.md` - Comprehensive CI debugging documentation

**Files to Modify:**
- `docs/sprint-artifacts/epic3/epic-3-evolution.md` - Update Story 3.1 section

**Branches to Create:**
- `staging` - QA/UAT branch (from main)
- `develop` - Development branch (from main)

**GitHub Settings to Configure:**
- Repository Settings → Branches → Default branch → `develop` (recommended)
- Repository Settings → Branches → Branch protection rules → `main`
- Repository Settings → Branches → Branch protection rules → `staging`
- Repository Settings → Branches → Branch protection rules → `develop`

### References

- [Source: docs/sprint-artifacts/tech-spec-epic-3.md § Story 3.1]
- [Source: docs/planning/epics.md § Story 3.1: Process & Governance Setup]
- [Source: docs/ci-cd/README.md - Existing CI/CD documentation index]
- [Source: docs/ci-cd/03-local-testing.md - Existing local testing guide]
- [GitHub Docs: Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [act Documentation](https://nektosact.com/)

### Learnings from Previous Story

**From Story 2.6 (CI/CD Pipeline & Coverage Baseline) - Status: done**

- **Workflow Structure Established**: 15-step GitHub Actions workflow operational
  - Use the existing workflow structure as reference for branch protection checks
  - `test` job name is the status check to require in branch protection

- **Key CI Challenges Resolved**:
  - Node.js version: Must use v20 (not v18) for @vitest/coverage-v8 compatibility
  - Port conflicts: Dev server uses port 5174 to avoid conflicts with other apps
  - Environment variables: All VITE_* vars required for Playwright E2E tests
  - Firebase emulators: Health checks with 30-second timeout for startup

- **Optimization Decisions**:
  - `npm ci` for deterministic installs
  - Sequential test execution prevents emulator port conflicts
  - Single Playwright worker in CI for stability

- **Files Created**: `.github/workflows/test.yml`
- **Files Modified**: `README.md` (coverage section)

[Source: docs/sprint-artifacts/epic2/2-6-cicd-pipeline-coverage-baseline.md#Dev-Agent-Record]

## Story Dependencies

**Prerequisites:**
- Epic 2 completed (CI/CD pipeline operational)
- GitHub repository access with admin permissions
- Existing CI workflow (`.github/workflows/test.yml`)

**Enables:**
- All subsequent Epic 3 stories (clean PR workflow)
- Story 3.2, 3.3, 3.4: E2E workflow tests
- Story 3.5: Accessibility tests
- Story 3.6: Performance monitoring
- Story 3.7: Coverage enforcement

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/3-1-process-governance-setup.context.xml](../3-1-process-governance-setup.context.xml)

### Agent Model Used

<!-- Will be filled by dev agent -->

### Debug Log References

<!-- Will be filled by dev agent -->

### Completion Notes List

<!-- Will be filled by dev agent -->

### File List

<!-- Will be filled by dev agent upon completion -->

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-25 | Story drafted from Epic 3 planning | SM Agent (Create Story Workflow) |
| 2025-11-25 | Added multi-branch strategy (main/staging/develop), expanded ACs from 5 to 8, added Tasks 1-6 for branch setup, increased story points from 2 to 3 | User/SM Agent |
| 2025-11-25 | Story context generated, status updated to ready-for-dev | Story Context Workflow |

---

**Story Points:** 3 (increased from 2 due to multi-branch strategy scope)
**Epic:** Production-Grade Quality & Testing Completion (Epic 3)
**Status:** ready-for-dev
