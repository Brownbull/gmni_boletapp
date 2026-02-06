# Story {{epic_num}}.X: Deployment & Release

**Epic:** Epic {{epic_num}} - {{epic_name}}
**Type:** Deployment/Release Story
**Status:** drafted

---

## Story Description

As a **developer completing Epic {{epic_num}}**,
I want **to deploy all changes to production following our standard workflow**,
So that **users can access the new features and the epic is properly closed**.

---

## Acceptance Criteria

### Pre-Deployment Verification

- [ ] **AC #1:** All epic stories are marked "done" with approved code reviews
- [ ] **AC #2:** All tests pass locally (`npm test`)
- [ ] **AC #3:** TypeScript compiles without errors (`npm run build`)
- [ ] **AC #4:** No secrets in code (gitleaks pre-commit hook passing)

### Branch Workflow

- [ ] **AC #5:** Feature branch merged to `develop` via PR (CI green)
- [ ] **AC #6:** `develop` merged to `staging` via PR (CI green)
- [ ] **AC #7:** Staging environment tested (if applicable)
- [ ] **AC #8:** `staging` merged to `main` via PR (CI green)

### Deployment

- [ ] **AC #9:** Firebase deployment completed successfully
  - For hosting: `firebase deploy --only hosting`
  - For functions: `firebase deploy --only functions`
  - For full deploy: `firebase deploy`
- [ ] **AC #10:** Production URL verified: https://boletapp-d609f.web.app

### Post-Deployment Verification

- [ ] **AC #11:** Critical user flows tested in production:
  - [ ] Authentication (sign in/sign out)
  - [ ] Core feature from this epic: {{primary_feature}}
  - [ ] No console errors
- [ ] **AC #12:** Sprint status updated (`epic-{{epic_num}}-retrospective: completed`)

---

## Branch Strategy Reference

```
feature/epic-{{epic_num}}-* → develop → staging → main
                                                    ↓
                                            Firebase Deploy
                                                    ↓
                                            Production Live
```

**Documentation:** See [docs/branching-strategy.md](../branching-strategy.md)

---

## Deployment Commands

```bash
# 1. Ensure you're on the correct branch
git checkout main
git pull origin main

# 2. Build the project
npm run build

# 3. Deploy to Firebase
firebase deploy --only hosting

# For Cloud Functions (if applicable):
firebase deploy --only functions

# For full deployment:
firebase deploy

# 4. Verify deployment
# Visit: https://boletapp-d609f.web.app
```

---

## Merge Conflict Resolution

If merge conflicts occur during branch merges:

1. **Identify conflicts:** `git diff --name-only --diff-filter=U`
2. **Resolve each file:** Edit to keep correct changes
3. **Stage resolved files:** `git add <resolved-files>`
4. **Complete merge:** `git commit`
5. **Push and create PR:** `git push`

**Common conflict files:**
- `src/utils/translations.ts` - Translation keys
- `docs/sprint-artifacts/sprint-status.yaml` - Status updates
- Configuration files

---

## CI/CD Pipeline Status

The following CI checks must pass before merge:

1. **Step 1-3:** Security scans (gitleaks, npm audit)
2. **Step 4-8:** Test execution (unit, integration, E2E)
3. **Step 9-11:** Build verification
4. **Step 12-14:** Performance checks (Lighthouse, bundle size)
5. **Step 15-17:** Coverage enforcement

**Auto-Deploy (Epic 6+):**
- On merge to `main`, GitHub Actions automatically deploys to Firebase
- Manual deployment only needed if auto-deploy fails

---

## Rollback Plan

If deployment causes production issues:

```bash
# Option 1: Revert to previous Firebase version
firebase hosting:rollback

# Option 2: Revert commit and redeploy
git revert HEAD
git push origin main
firebase deploy --only hosting

# Option 3: Deploy previous working commit
git checkout <previous-commit>
firebase deploy --only hosting
git checkout main
```

---

## Story Completion Checklist

Before marking this story as "review":

- [ ] All acceptance criteria met
- [ ] Production deployment verified
- [ ] No console errors in production
- [ ] Sprint status file updated
- [ ] Retrospective can be scheduled

---

## Dev Notes

**Implementation Notes:**
<!-- Add notes about deployment here -->

**Deployment Date:** {{date}}

**Deployment Method:**
- [ ] Manual (`firebase deploy`)
- [ ] Auto-deploy (GitHub Actions on merge to main)

**Issues Encountered:**
<!-- Document any issues during deployment -->

---

## Code Review Notes

**Reviewer:**
**Review Date:**
**Status:**

### Pre-Review Checklist
- [ ] All tests passing
- [ ] Production deployed
- [ ] Production verified working

### Review Outcome
- [ ] APPROVED - Ready to mark as done
- [ ] CHANGES REQUESTED - See comments

---

## Completion Notes

**Completed By:**
**Completion Date:**

**Summary:**
<!-- Final summary of deployment -->

**Files Modified:**
<!-- List files changed for deployment -->

**Retrospective Items:**
<!-- Any items to discuss in retrospective -->
