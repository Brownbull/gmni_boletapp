# Story 14c.99: Epic Release & Deployment

Status: ready-for-dev

## Story

As a developer completing Epic 14C,
I want to deploy all shared groups functionality to production,
so that users can start using multi-user expense sharing.

## Acceptance Criteria

1. **AC1: Version Bump**
   - Given the current version is 1.0.0-beta.X
   - When preparing for release
   - Then version is bumped to next minor beta (e.g., 1.1.0-beta.1)
   - And CHANGELOG.md is updated with Epic 14C features
   - And version appears correctly in app footer/settings

2. **AC2: CI/CD Pipeline Passes**
   - Given all Epic 14C code is merged to develop
   - When CI/CD pipeline runs
   - Then all unit tests pass
   - And all integration tests pass
   - And Lighthouse CI passes
   - And security scans pass
   - And build completes successfully

3. **AC3: Staging Deployment Verification**
   - Given code is merged to staging branch
   - When deployed to staging environment
   - Then all shared group features work end-to-end
   - And Firebase security rules are deployed and tested
   - And IndexedDB caching works correctly
   - And no console errors in production build

4. **AC4: Production Deployment**
   - Given staging verification passes
   - When merging staging to main
   - Then production deployment completes successfully
   - And Firebase Hosting serves new version
   - And Firestore security rules are active
   - And no service disruption occurs

5. **AC5: Post-Deployment Verification**
   - Given production deployment completes
   - When testing in production
   - Then can create a shared group
   - And can join via share link
   - And can view shared transactions
   - And analytics work in group mode
   - And version number displays correctly

6. **AC6: Rollback Plan Ready**
   - Given deployment may have issues
   - When problems are detected
   - Then rollback procedure is documented
   - And previous version can be restored quickly
   - And Firestore rules can be reverted if needed

## Tasks / Subtasks

- [ ] Task 1: Version Bump & Changelog (AC: #1)
  - [ ] 1.1 Update version in `package.json` to next minor beta
  - [ ] 1.2 Update version in `vite.config.ts` if hardcoded
  - [ ] 1.3 Update CHANGELOG.md with Epic 14C features summary
  - [ ] 1.4 Verify version displays in app Settings

- [ ] Task 2: Pre-Deployment Testing (AC: #2)
  - [ ] 2.1 Run full test suite locally: `npm run test`
  - [ ] 2.2 Run E2E tests if available
  - [ ] 2.3 Run Lighthouse CI locally
  - [ ] 2.4 Verify no TypeScript errors: `npm run type-check`
  - [ ] 2.5 Verify no lint errors: `npm run lint`

- [ ] Task 3: Security Rules Deployment (AC: #3, #4)
  - [ ] 3.1 Deploy Firestore rules to staging: `firebase deploy --only firestore:rules`
  - [ ] 3.2 Test security rules in staging emulator
  - [ ] 3.3 Verify shared group read/write permissions
  - [ ] 3.4 Verify cross-user transaction read permissions

- [ ] Task 4: Staging Deployment & Testing (AC: #3)
  - [ ] 4.1 Merge develop → staging via PR
  - [ ] 4.2 Verify staging deployment completes
  - [ ] 4.3 Manual E2E test: Create shared group flow
  - [ ] 4.4 Manual E2E test: Join group via link flow
  - [ ] 4.5 Manual E2E test: View mode switching
  - [ ] 4.6 Manual E2E test: Tag transactions to groups
  - [ ] 4.7 Manual E2E test: Group analytics
  - [ ] 4.8 Check browser console for errors
  - [ ] 4.9 Test on mobile device (PWA)

- [ ] Task 5: Production Deployment (AC: #4)
  - [ ] 5.1 Create PR: staging → main
  - [ ] 5.2 Review PR with deployment checklist
  - [ ] 5.3 Merge and monitor deployment
  - [ ] 5.4 Verify Firebase Hosting deployment success
  - [ ] 5.5 Verify Firestore rules active in production

- [ ] Task 6: Post-Deployment Verification (AC: #5)
  - [ ] 6.1 Test create shared group in production
  - [ ] 6.2 Test join group flow in production
  - [ ] 6.3 Test shared transactions view
  - [ ] 6.4 Test group analytics
  - [ ] 6.5 Verify version number in footer/settings
  - [ ] 6.6 Check Firestore usage dashboard for anomalies

- [ ] Task 7: Documentation & Rollback (AC: #6)
  - [ ] 7.1 Document rollback procedure if not exists
  - [ ] 7.2 Note previous version for quick revert
  - [ ] 7.3 Keep Firestore rules backup
  - [ ] 7.4 Monitor error tracking (if configured)

## Dev Notes

### Version Numbering

**Current Pattern:** `1.0.0-beta.X`
**Epic 14C Release:** `1.1.0-beta.1` (minor version bump for new feature)

```json
// package.json
{
  "version": "1.1.0-beta.1"
}
```

### Changelog Entry Template

```markdown
## [1.1.0-beta.1] - 2026-XX-XX

### Added - Epic 14C: Shared Groups
- **Shared Groups**: Create shareable expense groups with up to 10 members
- **Join via Link**: Share invite links that work even for new users
- **View Mode Switching**: Toggle between personal and group views via header
- **Cross-User Transactions**: See all group members' tagged transactions
- **Group Analytics**: Polygon, trends, and breakdowns for group spending
- **Transaction Tagging**: Tag transactions to multiple groups (up to 5)
- **Auto-Tag on Scan**: New scans auto-tag to active group
- **Member Contributions**: See who spent what in the group

### Technical
- IndexedDB caching for offline group transactions
- Delta sync with memberUpdates timestamps
- Firebase security rules for cross-user reads
- LRU cache eviction at 50K records
```

### Deployment Pipeline

```
develop → staging → main → production
    │         │        │
    │         │        └── Firebase Hosting auto-deploy
    │         └── Manual verification
    └── CI/CD tests
```

### Security Rules Deployment

```bash
# Deploy only security rules (not hosting)
firebase deploy --only firestore:rules --project boletapp

# Verify rules are active
firebase firestore:indexes --project boletapp
```

### Staging Verification Checklist

| Feature | Test | Status |
|---------|------|--------|
| Create Group | Settings → Custom Groups → Make Shareable | ☐ |
| Share Code | Copy link, share via native share | ☐ |
| Join Group | Open link, see preview, join | ☐ |
| View Mode | Tap logo, switch to group | ☐ |
| Shared Txns | See other members' transactions | ☐ |
| Ownership | Profile icon on others' txns | ☐ |
| View-Only | Can't edit others' transactions | ☐ |
| Tag Txn | Add transaction to group | ☐ |
| Auto-Tag | Scan in group mode, auto-tagged | ☐ |
| Analytics | Polygon shows group data | ☐ |
| Empty State | New group shows invite prompt | ☐ |
| Error States | Invalid code shows error | ☐ |
| Leave Group | Leave with soft/hard options | ☐ |
| Offline | Cached data available offline | ☐ |

### Rollback Procedure

1. **Hosting Rollback:**
   ```bash
   # List recent deployments
   firebase hosting:channel:list --project boletapp

   # Rollback to previous version
   firebase hosting:clone SOURCE_SITE:SOURCE_CHANNEL TARGET_SITE:live
   ```

2. **Security Rules Rollback:**
   - Keep backup of previous `firestore.rules` file
   - Re-deploy previous version if needed

3. **Database Rollback:**
   - SharedGroups collection is additive (no schema migration)
   - Transaction `sharedGroupIds` field is backward compatible
   - No destructive changes to existing data

### Monitoring Post-Deploy

- **Firestore Usage:** Check reads/writes aren't spiking unexpectedly
- **Error Tracking:** Monitor for new error patterns
- **Performance:** Check Lighthouse scores haven't degraded
- **User Reports:** Watch for bug reports in first 24-48 hours

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [CI/CD Pipeline]: .github/workflows/
- [Firebase Hosting Config]: firebase.json
- [Firestore Rules]: firestore.rules
- [Previous Deployment Story]: docs/sprint-artifacts/epic14/14-42-version-upgrade-auto-update.md

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List

