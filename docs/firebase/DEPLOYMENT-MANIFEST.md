# Firebase Deployment Manifest

> **Single source of truth** for all Firebase deployable artifacts across environments.
>
> Last Updated: 2026-02-07

---

## Environments

| Alias | Project ID | Purpose | Console |
|-------|-----------|---------|---------|
| `default` | `boletapp-d609f` | **Production** | [Console](https://console.firebase.google.com/project/boletapp-d609f) |
| `staging` | `boletapp-staging` | Staging / E2E testing | [Console](https://console.firebase.google.com/project/boletapp-staging) |

Aliases are defined in `.firebaserc`. Use `--project <alias>` or `--project <id>` with all `firebase` commands.

---

## Deployable Artifacts

### 1. Firestore Security Rules

| | Details |
|---|---|
| **Source file** | `firestore.rules` (project root) |
| **Deploy command** | `firebase deploy --only firestore:rules --project <id>` |
| **Auto-deploys on merge to main?** | **NO** — manual deployment required |
| **Affects** | All Firestore read/write permissions |

**What to watch for:** Helper functions (`isUserLeaving`, `isValidStatusUpdate`, `isUserJoining`, etc.) must match the service functions that call them. Missing a rule helper = users get "permission denied" at runtime.

### 2. Firestore Composite Indexes

| | Details |
|---|---|
| **Source file** | `firestore.indexes.json` (project root) |
| **Deploy command** | `firebase deploy --only firestore:indexes --project <id>` |
| **Auto-deploys on merge to main?** | **NO** — manual deployment required |
| **Build time** | Indexes may take minutes to hours to build for large collections |

**Current indexes (3 composite):**

| Collection | Fields | Query Location |
|------------|--------|---------------|
| `pendingInvitations` | shareCode + status | `invitationService.ts` → `getInvitationByShareCode` |
| `pendingInvitations` | groupId + invitedEmail + status | `invitationService.ts` → `checkDuplicateInvitation` |
| `pendingInvitations` | invitedEmail + status | `invitationService.ts` → `getInvitationsForEmail` |

**Field overrides (2):**

| Collection | Field | Purpose |
|------------|-------|---------|
| `fcmTokens` | `token` | FCM token lookup (collection + collection_group) |
| `pushSubscriptions` | `endpoint` | Web Push subscription lookup (collection + collection_group) |

### 3. Cloud Functions

| | Details |
|---|---|
| **Source directory** | `functions/` |
| **Build command** | `cd functions && npm run build` |
| **Deploy all** | `firebase deploy --only functions --project <id>` |
| **Deploy one** | `firebase deploy --only functions:<name> --project <id>` |
| **Auto-deploys on merge to main?** | **NO** — manual deployment required |

**Function inventory (12 total):**

| Function | Gen | Trigger | Criticality | Source File |
|----------|-----|---------|-------------|-------------|
| `analyzeReceipt` | v1 | callable | CRITICAL | `analyzeReceipt.ts` |
| `onTransactionDeleted` | v1 | document.delete | CRITICAL | `deleteTransactionImages.ts` |
| `onTransactionWrite` | **v2** | document.written | CRITICAL | `changelogWriter.ts` |
| `onMemberRemoved` | v1 | document.update | CRITICAL | `triggers/onMemberRemoved.ts` |
| `cleanupStaleFcmTokens` | v1 | scheduled | MAINTENANCE | `cleanupStaleFcmTokens.ts` |
| `cleanupCrossUserFcmToken` | v1 | callable | FEATURE | `cleanupCrossUserFcmToken.ts` |
| `saveWebPushSubscription` | v1 | callable | FEATURE | `webPushService.ts` |
| `deleteWebPushSubscription` | v1 | callable | FEATURE | `webPushService.ts` |
| `getVapidPublicKey` | v1 | https | FEATURE | `webPushService.ts` |
| `adminCleanupUserTokens` | v1 | https | ADMIN | `cleanupCrossUserFcmToken.ts` |
| `adminSendTestNotification` | v1 | https | ADMIN | `cleanupCrossUserFcmToken.ts` |
| `adminTestWebPush` | v1 | https | ADMIN | `webPushService.ts` |

**v2 function note:** `onTransactionWrite` uses Eventarc (2nd gen). First deployment to a project requires Eventarc Service Agent permissions to propagate (~2-5 minutes). Retry if it fails.

### 4. Storage Security Rules

| | Details |
|---|---|
| **Source file** | `storage.rules` (project root) |
| **Deploy command** | `firebase deploy --only storage --project <id>` |
| **Auto-deploys on merge to main?** | **NO** — manual deployment required |
| **Prerequisite** | Firebase Storage must be initialized in the project console first |

### 5. Hosting (Frontend)

| | Details |
|---|---|
| **Source directory** | `dist/` (built by `npm run build`) |
| **Deploy command** | `firebase deploy --only hosting --project <id>` |
| **Auto-deploys on merge to main?** | **YES** — GitHub Actions deploys hosting on merge to main |
| **Build required** | `npm run build` before manual deploy |

### 6. Manual Console Configuration (NOT deployable via CLI)

These settings require manual setup in Firebase Console and cannot be automated:

| Setting | Location | Status |
|---------|----------|--------|
| **Changelog TTL policy** | Firestore > Time-to-live policies | Collection: `changelog`, Field: `_ttl` |
| **Firebase Storage init** | Storage > Get Started | Must be done before deploying storage rules |
| **Cloud Functions API** | Google Cloud Console > APIs | Must be enabled before deploying functions |
| **Eventarc API** | Google Cloud Console > APIs | Required for v2 functions |

**TTL setup steps:** Console > Firestore > Time-to-live policies > Create > Collection group: `changelog`, Timestamp field: `_ttl`

---

## Environment Parity Status

> Update this table whenever you deploy. Format: date or "N/A" if not applicable.

| Artifact | Production (`boletapp-d609f`) | Staging (`boletapp-staging`) |
|----------|-------------------------------|------------------------------|
| Firestore rules | 2026-02-07 | 2026-02-07 |
| Firestore indexes | 2026-02-07 | 2026-02-07 |
| Cloud Functions (12) | 2026-02-07 | N/A (API not enabled) |
| Storage rules | 2026-02-07 | N/A (Storage not initialized) |
| Hosting | Auto-deploy on merge | Auto-deploy on merge |
| Changelog TTL policy | Active | Not configured |

**Known staging gaps:**
- Cloud Functions API not enabled — functions cannot be deployed
- Firebase Storage not initialized — storage rules cannot be deployed
- Changelog TTL policy not configured — old entries won't auto-delete

These gaps are acceptable for E2E testing (tests use staging Firestore + Auth, not Functions or Storage directly). If staging Cloud Functions become needed, enable the API in Google Cloud Console first.

---

## Deploy Commands Quick Reference

```bash
# Deploy everything (rarely needed — prefer targeted deploys)
firebase deploy --project boletapp-d609f

# Firestore rules only
firebase deploy --only firestore:rules --project boletapp-d609f

# Firestore indexes only
firebase deploy --only firestore:indexes --project boletapp-d609f

# All Cloud Functions (build first!)
cd functions && npm run build && cd ..
firebase deploy --only functions --project boletapp-d609f

# Single Cloud Function
firebase deploy --only functions:onTransactionWrite --project boletapp-d609f

# Storage rules only
firebase deploy --only storage --project boletapp-d609f

# Hosting only (build first!)
npm run build
firebase deploy --only hosting --project boletapp-d609f

# Deploy to BOTH environments (rules + indexes)
firebase deploy --only firestore:rules,firestore:indexes --project boletapp-d609f
firebase deploy --only firestore:rules,firestore:indexes --project boletapp-staging
```

---

## Which Stories Need Backend Deployment?

A story needs manual Firebase deployment if it modifies ANY of these files:

| File Pattern | Artifact | Deploy Target |
|-------------|----------|---------------|
| `firestore.rules` | Firestore rules | `firestore:rules` |
| `firestore.indexes.json` | Firestore indexes | `firestore:indexes` |
| `storage.rules` | Storage rules | `storage` |
| `functions/src/**` | Cloud Functions | `functions` (build first) |

**Detection command:**
```bash
# Check if current branch touches Firebase backend files
git diff develop --name-only | grep -E '^(firestore\.(rules|indexes\.json)|storage\.rules|functions/src/)'
```

If the command returns results, the story requires Firebase backend deployment after merge to main.

---

## Deployment Checklist (for stories with backend changes)

After the PR merges to main:

1. [ ] `cd functions && npm run build` (if functions changed)
2. [ ] `firebase deploy --only <targets> --project boletapp-d609f`
3. [ ] Verify in Firebase Console (functions list, rules, indexes)
4. [ ] `firebase deploy --only firestore:rules,firestore:indexes --project boletapp-staging` (keep staging in sync)
5. [ ] Update "Environment Parity Status" table above with today's date

---

## Related Documentation

- [Cloud Functions Architecture](../architecture/cloud-functions.md) — detailed function inventory
- [Firestore Indexes](../architecture/firestore-indexes.md) — index design and TTL policies
- [Deployment Guide](../ci-cd/deployment-guide.md) — general deployment procedures
- [Firestore Patterns](../architecture/firestore-patterns.md) — data model and security patterns
- Source config: `firebase.json`, `.firebaserc`
