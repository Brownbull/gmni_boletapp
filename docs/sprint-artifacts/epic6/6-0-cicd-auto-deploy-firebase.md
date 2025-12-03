# Story 6.0: CI/CD Auto-Deploy to Firebase

**Epic:** Epic 6 - Smart Category Learning (Infrastructure Pre-requisite)
**Type:** Infrastructure Story
**Status:** done
**Priority:** HIGH - Must complete before Epic 6 feature work

---

## Story Description

As a **developer merging to main**,
I want **GitHub Actions to automatically deploy to Firebase Hosting**,
So that **production deployments happen automatically without manual intervention**.

---

## Context

This story addresses a gap identified in the Epic 5 retrospective:
- Tests pass in CI, but deployment requires manual `firebase deploy` command
- Manual steps are forgotten steps
- Auto-deploy ensures every merge to main reaches production

**Team Agreement (Epic 5 Retro):**
> "CI/CD must auto-deploy to Firebase - no manual deployment steps"

---

## Acceptance Criteria

### GitHub Actions Configuration

- [x] **AC #1:** New deployment job added to `.github/workflows/test.yml`
- [x] **AC #2:** Deployment only triggers on push to `main` branch (not PRs, not staging/develop)
- [x] **AC #3:** Deployment only runs after all tests pass (job dependency)
- [ ] **AC #4:** `FIREBASE_SERVICE_ACCOUNT` secret configured in GitHub repository *(manual step required)*

### Deployment Behavior

- [ ] **AC #5:** Firebase Hosting deployment completes successfully *(requires merge to main)*
- [x] **AC #6:** Deployment uses service account authentication (not interactive token)
- [ ] **AC #7:** Production URL verified accessible after deployment: https://boletapp-d609f.web.app *(requires deployment)*

### Documentation

- [x] **AC #8:** `docs/team-standards.md` updated with auto-deploy information
- [x] **AC #9:** `docs/ci-cd/README.md` updated with deployment job documentation

---

## Technical Implementation

### Step 1: Create Firebase Service Account

1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key for Firebase Admin SDK
3. Download JSON file (do not commit!)

### Step 2: Add GitHub Secret

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Create new repository secret:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Contents of the service account JSON file

### Step 3: Update GitHub Actions Workflow

Add new deployment job to `.github/workflows/test.yml`:

```yaml
  # Deployment job - only runs on main branch after tests pass
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build for production
        run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_GEMINI_MODEL: ${{ secrets.VITE_GEMINI_MODEL }}

      - name: Deploy to Firebase Hosting
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
          channelId: live
          projectId: boletapp-d609f
```

### Step 4: Add Environment Secrets

Add these secrets to GitHub repository (if not already present):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_GEMINI_API_KEY`
- `VITE_GEMINI_MODEL`
- `FIREBASE_SERVICE_ACCOUNT`

---

## Testing Plan

### Automated Tests
- No new automated tests needed (this is infrastructure)

### Manual Verification
1. Create a test PR to develop
2. Merge develop → staging → main
3. Verify GitHub Actions runs deployment job on main merge
4. Verify https://boletapp-d609f.web.app is updated

---

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Service account key exposure | Store as GitHub secret, never commit |
| Deployment failure leaves site down | Firebase keeps previous version, manual rollback available |
| Wrong branch triggers deploy | `if` condition checks for `main` branch and `push` event |

---

## Definition of Done

- [x] GitHub Actions workflow updated with deploy job
- [ ] Firebase service account secret configured *(manual step required)*
- [ ] Environment variable secrets configured *(manual step required)*
- [ ] Test deployment succeeds on merge to main *(requires merge)*
- [ ] Production URL verified working *(requires deployment)*
- [x] Documentation updated
- [x] Code review approved

---

## Dev Notes

**Implementation Notes:**
<!-- Add implementation notes here -->

---

## Code Review Notes

**Reviewer:** Claude (AI Senior Developer)
**Review Date:** 2025-12-03
**Status:** APPROVED

### Review Checklist
- [x] Workflow syntax is correct
- [x] Conditions properly restrict deployment to main branch
- [x] Secrets are not exposed in logs
- [x] Documentation is updated

### Review Outcome
- [x] APPROVED
- [ ] CHANGES REQUESTED

---

## Senior Developer Review (AI)

**Reviewer:** Gabe (via Claude)
**Date:** 2025-12-03
**Outcome:** APPROVED ✅

### Summary

Story 6.0 CI/CD Auto-Deploy implementation is complete and correct. The deploy job is properly configured with:
- Job dependency on `test` job (tests must pass first)
- Branch restriction (`main` only, `push` events only)
- Service account authentication (not interactive token)
- All required environment secrets for production build

### Key Findings

**No issues found.** Implementation follows all best practices:
- ✅ Valid GitHub Actions YAML syntax
- ✅ Proper secret usage (no hardcoded values)
- ✅ Clear job naming and step comments
- ✅ Deployment notification with timestamp
- ✅ Uses official Firebase GitHub Action

### Acceptance Criteria Coverage

| AC# | Description | Status | Evidence |
|-----|-------------|--------|----------|
| AC #1 | Deploy job added | ✅ IMPLEMENTED | `.github/workflows/test.yml:267-325` |
| AC #2 | Main branch only | ✅ IMPLEMENTED | `.github/workflows/test.yml:272` |
| AC #3 | Runs after tests pass | ✅ IMPLEMENTED | `.github/workflows/test.yml:269` |
| AC #4 | Secret configured | ⚠️ MANUAL STEP | User must configure in GitHub Settings |
| AC #5 | Deployment succeeds | ⚠️ MANUAL VERIFY | Requires merge to main |
| AC #6 | Service account auth | ✅ IMPLEMENTED | `.github/workflows/test.yml:316` |
| AC #7 | URL verified | ⚠️ MANUAL VERIFY | Requires deployment |
| AC #8 | team-standards.md | ✅ IMPLEMENTED | `docs/team-standards.md:277-312` |
| AC #9 | ci-cd/README.md | ✅ IMPLEMENTED | `docs/ci-cd/README.md:132-157` |

**Summary:** 6 of 9 ACs implemented in code, 3 require manual verification after secrets configured.

### Test Coverage and Gaps

- No automated tests needed (infrastructure story)
- Manual verification required: merge to main and check deployment

### Architectural Alignment

✅ Aligns with team standards:
- Auto-deploy on main (Epic 5 Retrospective agreement)
- No manual deployment steps
- Uses official Firebase GitHub Action

### Security Notes

- ✅ Secrets stored in GitHub repository secrets (not in code)
- ✅ Service account JSON never exposed in logs
- ✅ `${{ secrets.* }}` syntax hides values in workflow output

### Best-Practices and References

- [Firebase GitHub Action](https://github.com/FirebaseExtended/action-hosting-deploy) - v0 used
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)

### Action Items

**Manual Steps Required:**

- [ ] **[User Action]** Configure `FIREBASE_SERVICE_ACCOUNT` secret in GitHub repository
- [ ] **[User Action]** Configure all `VITE_*` secrets if not already present
- [ ] **[User Action]** Merge to main branch to trigger first auto-deploy
- [ ] **[User Action]** Verify https://boletapp-d609f.web.app is updated after deployment

**Advisory Notes:**
- Note: Consider adding Slack/Discord notification for deployment status (future enhancement)
- Note: Firebase keeps previous deployments for rollback if needed

---

## Completion Notes

**Completed By:** Claude (AI Developer)
**Completion Date:** 2025-12-03

**Summary:**
Implemented CI/CD auto-deploy to Firebase Hosting. The deploy job runs automatically when code is merged to `main` branch, after all tests pass. Uses Firebase service account for authentication. Documentation updated in `docs/team-standards.md` and `docs/ci-cd/README.md`.

**Files Modified:**
- `.github/workflows/test.yml` - Added deploy job (lines 261-326)
- `docs/team-standards.md` - Added Auto-Deploy section
- `docs/ci-cd/README.md` - Added Deploy Job documentation
