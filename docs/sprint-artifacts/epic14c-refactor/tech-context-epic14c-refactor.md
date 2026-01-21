# Epic 14c-refactor: Technical Context - Codebase Cleanup Before Shared Groups V2

> **Epic Status:** In Progress
> **Generated:** 2026-01-21
> **Atlas Enabled:** Yes
> **Prior Art:** Epic 14d-old (Scan Architecture Refactor) - COMPLETED

---

## Overview

Epic 14c-refactor prepares a clean foundation before Epic 14d (Shared Groups v2) by:
1. Removing broken shared groups sync implementation (~16,361 lines)
2. Refactoring App.tsx (non-scan portions only) per retrospective requirements
3. Simplifying transaction caching to React Query only
4. Unifying view mode state
5. Auditing and optimizing Firebase infrastructure

**Context:** Epic 14c (original Shared Groups) was reverted on 2026-01-20 after failing due to:
- Delta sync cannot detect transaction removals
- Multi-layer caching (React Query + IndexedDB + Firestore) got out of sync
- Cost explosion from fallback full-refetch strategies
- State staleness after first operation (works→fails→works pattern)

---

## Atlas Architectural Context

### Relevant ADRs

| ADR | Decision | Relevance |
|-----|----------|-----------|
| ADR-015 | Client-Side Insight Engine | Keep - not affected by cleanup |
| ADR-020 | Scan State Machine | **PRESERVE** - ScanContext fully implemented |
| ADR-016 | Hybrid Insight Storage | Keep - not affected by cleanup |

### Architectural Constraints

1. **ScanContext MUST be preserved** - Epic 14d-old (completed) migrated 31 state variables
2. **React Query is single cache layer** - Remove all IndexedDB/localStorage transaction caching
3. **Security rules deny shared group access** - Until Epic 14d redesigns properly
4. **Firebase listener limits** - `LISTENER_LIMITS` constant applies to all queries

### Features Affected

| Feature | Current Status | After Cleanup |
|---------|----------------|---------------|
| Shared Groups | Broken/Reverted | Stubbed (Coming Soon) |
| Cross-User Transactions | Broken | Disabled |
| Group Analytics | Broken | Stubbed |
| Push Notifications (VAPID) | Working | Preserve code, disable for groups |

---

## Objectives and Scope

### In Scope

| Part | Focus | Stories | Points |
|------|-------|---------|--------|
| 1 | Shared Groups Stub & Cleanup | 14c.1-14c.8 | 18 |
| 2 | App Architecture Refactor (Non-Scan) | 14c.9-14c.13 | 21 |
| 3 | Firebase & Infrastructure | 14c.14-14c.16 | 7 |
| 4 | Quality & Validation | 14c.17-14c.19 | 8 |

### Out of Scope

- **ScanContext modification** - Already complete in Epic 14d-old
- **Scan state machine changes** - Preserved from Epic 14d-old
- **Batch processing refactor** - Already done
- **New feature development** - Cleanup only
- **Epic 14d implementation** - Blocked by this epic

---

## System Architecture Alignment

### Current App.tsx State (~3800 lines)

From retrospective requirements, App.tsx contains:

| Category | State/Logic | Status |
|----------|-------------|--------|
| **Scan** | ScanContext, useScanStateMachine | ✅ DONE (Epic 14d-old) |
| **Auth** | Authentication state, Firebase Auth | ❌ To extract (14c.9) |
| **Navigation** | Active routes, view switching | ❌ To extract (14c.9) |
| **Theme** | Dark mode, theme preferences | ❌ To extract (14c.9) |
| **App State** | Online/offline, lifecycle | ❌ To extract (14c.9) |
| **Shared Groups** | View mode, group selection | ❌ To stub (14c.1-14c.8) |
| **Notifications** | Push notification state | ❌ To extract (14c.9) |

### Target Architecture

```
App.tsx (~300 lines)
├── AppProviders.tsx (context composition)
│   ├── QueryClientProvider (React Query)
│   ├── AuthProvider (new)
│   ├── ThemeProvider (new)
│   ├── ScanProvider (EXISTING - preserve)
│   ├── NavigationProvider (new)
│   └── AppStateProvider (new)
├── AppRoutes.tsx (routing)
├── AppLayout.tsx (header, content, nav)
└── AppErrorBoundary.tsx (error handling)
```

---

## Detailed Design

### Part 1: Shared Groups Stub & Cleanup

#### Services to Stub/Delete

| Service | Action | Rationale |
|---------|--------|-----------|
| `sharedGroupService.ts` | Stub all functions | Return empty/throw "Coming Soon" |
| `sharedGroupTransactionService.ts` | DELETE | Not needed for stub |
| `sharedGroupCache.ts` | DELETE | IndexedDB caching removed |

**Stub Pattern:**
```typescript
// sharedGroupService.ts stub
export const createSharedGroup = async () => {
  throw new Error('Feature temporarily unavailable. Coming soon!');
};

export const getSharedGroups = async (): Promise<SharedGroup[]> => {
  return []; // Return empty, no network call
};
```

#### Hooks to Stub

| Hook | Stub Behavior |
|------|---------------|
| `useSharedGroups` | `{ groups: [], isLoading: false }` |
| `useUserSharedGroups` | `{ groups: [], isLoading: false }` |
| `useSharedGroupTransactions` | DELETE entirely |

#### Cloud Functions to Remove

| Function | File | Action |
|----------|------|--------|
| `getSharedGroupTransactions` | `functions/src/getSharedGroupTransactions.ts` | Delete + undeploy |
| `sendSharedGroupNotification` | `functions/src/sendSharedGroupNotification.ts` | Delete + undeploy |

**Undeploy Commands:**
```bash
firebase functions:delete getSharedGroupTransactions --project boletapp-production
firebase functions:delete sendSharedGroupNotification --project boletapp-production
```

#### Security Rules Simplification

```javascript
// firestore.rules - simplified
match /sharedGroups/{groupId} {
  allow read, write: if false; // Disabled until Epic 14d
}

match /pendingInvitations/{invitationId} {
  allow read, write: if false; // Disabled until Epic 14d
}
```

#### Firestore Data Cleanup Script

Location: `scripts/cleanup-shared-groups.ts`

Actions:
1. Delete all documents in `sharedGroups` collection
2. Delete all documents in `pendingInvitations` collection
3. For all transactions: set `sharedGroupIds` to empty array `[]`
4. Keep `sharedGroupIds` field (for Epic 14d reuse)

---

### Part 2: App Architecture Refactor

#### Context Extraction (Story 14c.9)

| Context | Responsibilities | Location |
|---------|------------------|----------|
| `AuthContext` | Auth state, user, login/logout | `src/contexts/AuthContext.tsx` |
| `NavigationContext` | Active view, navigation state | `src/contexts/NavigationContext.tsx` |
| `ThemeContext` | Theme mode, preferences | `src/contexts/ThemeContext.tsx` |
| `NotificationContext` | Push notification state | `src/contexts/NotificationContext.tsx` |
| `AppStateContext` | Online/offline, lifecycle | `src/contexts/AppStateContext.tsx` |

**CRITICAL:** ScanContext remains unchanged at `src/contexts/ScanContext.tsx`

#### Hook Extraction (Story 14c.10)

| Hook | Responsibilities | Location |
|------|------------------|----------|
| `useAppInitialization` | Firebase init, auth restore | `src/hooks/app/useAppInitialization.ts` |
| `useDeepLinking` | URL handling, deep links | `src/hooks/app/useDeepLinking.ts` |
| `usePushNotifications` | FCM registration | `src/hooks/app/usePushNotifications.ts` |
| `useOnlineStatus` | Network monitoring | `src/hooks/app/useOnlineStatus.ts` |
| `useAppLifecycle` | Foreground/background | `src/hooks/app/useAppLifecycle.ts` |

**PRESERVE:** `useScanStateMachine`, `useBatchProcessing`, `useBatchCapture`, `useBatchReview`

#### Transaction Service Simplification (Story 14c.12)

Current state: React Query + IndexedDB + localStorage + Firestore
Target state: React Query + Firestore only

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 minutes
      cacheTime: 30 * 60 * 1000,  // 30 minutes
    },
  },
});
```

---

### Part 3: Firebase & Infrastructure

#### Indexes to Remove

Any index containing `sharedGroupIds` field:
- Check `firestore.indexes.json` for composite indexes
- Remove and redeploy: `firebase deploy --only firestore:indexes`

#### Cloud Functions Audit

Inventory existing functions and document in `docs/architecture/cloud-functions.md`:
- `analyzeReceipt` - Keep (receipt OCR)
- `onTransactionDeleted` - Keep (cascade delete images)
- Any shared group functions - Delete

#### Cost Monitoring Setup

Firebase Console configuration:
- 50% budget alert
- 80% budget alert
- 100% budget alert

Google Cloud Monitoring dashboard:
- Daily reads/writes/deletes
- Storage usage

---

## Non-Functional Requirements

### Performance

| Metric | Target |
|--------|--------|
| Cached data access | < 500ms |
| App load time | No regression from baseline |
| Bundle size | No increase (ideally decrease) |

### Security

- All shared group access denied via security rules
- No cross-user data access possible
- Existing personal transaction rules unchanged

### Reliability

- Stub services never make network calls
- UI shows consistent "Coming Soon" state
- No crashes when navigating to shared group areas

### Observability

- Remove console.log statements for shared groups
- Keep error logging for debugging

---

## Dependencies and Integrations

### Internal Dependencies

| Component | Impact | Action |
|-----------|--------|--------|
| `ViewModeSwitcher` | Uses shared groups | Disable group options |
| `TransactionGroupSelector` | Tags to groups | Disable with tooltip |
| `JoinGroupDialog` | Join flow | Show "Coming Soon" message |
| `GroupMembersManager` | Member management | Show empty state |

### External Dependencies

| Dependency | Current Version | Notes |
|------------|-----------------|-------|
| Firebase | 10.x | No changes needed |
| React Query | 5.x | Keep current config |
| Vite | 5.x | No changes needed |

---

## Acceptance Criteria and Traceability

### Epic-Level Acceptance Criteria

| # | Criteria | Stories |
|---|----------|---------|
| 1 | All shared group backend code removed or stubbed | 14c.1-14c.3, 14c.8 |
| 2 | App.tsx reduced from ~3800 to ~300 lines | 14c.9-14c.11 |
| 3 | Single caching layer (React Query only) | 14c.4, 14c.12 |
| 4 | View mode state unified | 14c.13 |
| 5 | All tests passing | 14c.17 |
| 6 | No console errors in production build | 14c.18 |
| 7 | Firestore cost monitoring active | 14c.16 |
| 8 | Documentation updated | 14c.19 |
| 9 | Clean foundation ready for Epic 14d | All |

### Feature Traceability

| Feature | Status After Epic |
|---------|-------------------|
| Personal transactions | ✅ Fully working |
| Receipt scanning | ✅ Fully working |
| Analytics | ✅ Fully working |
| Insights | ✅ Fully working |
| Shared groups | ⏸️ Coming Soon (stubbed) |

---

## Risks and Assumptions

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing functionality | Medium | High | Comprehensive smoke testing (14c.18) |
| Missing dead code references | Low | Medium | TypeScript compiler will catch |
| Context extraction regression | Medium | Medium | Incremental extraction with testing |
| Firebase rules deployment issue | Low | High | Test in staging first |

### Assumptions

1. ScanContext implementation from Epic 14d-old is stable and complete
2. No users are actively using shared groups (reverted)
3. Test coverage is sufficient to catch regressions
4. Firebase emulator available for local testing

---

## Test Strategy

### Unit Tests

- Delete tests for removed files
- Update tests for stubbed services
- Add tests for new contexts and hooks
- Minimum 70% coverage

### Integration Tests

- Full app smoke test checklist
- All major flows exercised
- Shared groups show disabled state

### Firebase Tests

- Security rules tests updated
- Cloud Functions deployment verified
- Indexes deployment verified

---

## Atlas Historical Lessons Applied

From `06-lessons.md`:

| Lesson | Application |
|--------|-------------|
| Refactor Before Extending | This epic IS the refactor before 14d |
| Delta Sync Cannot Detect Deletions | Documented for 14d planning |
| Full Refetch = Cost Bomb | Why we're simplifying caching |
| Large File Sprawl | App.tsx decomposition |
| Cost Monitoring Gap | Story 14c.16 addresses this |
| Legacy Code Extension | Not extending - cleaning up |

---

## References

- [Epic 14c Retrospective](../epic-14c-retro-2026-01-20.md)
- [Brainstorming Session 2026-01-21](../../analysis/brainstorming-session-2026-01-21.md)
- [Epic 14d Definition (Shared Groups v2)](../epic14d-shared-groups-v2/epics.md)
- [Epic 14d-old (Scan Refactor)](../epic14d-refactor-old/epic-14d-scan-architecture-refactor.md)
- [Atlas Architecture Knowledge](../../_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md)
- [Atlas Lessons](../../_bmad/agents/atlas/atlas-sidecar/knowledge/06-lessons.md)

---

*Generated by Atlas Epic Tech Context Workflow*
*Epic: 14c-refactor*
*Date: 2026-01-21*
