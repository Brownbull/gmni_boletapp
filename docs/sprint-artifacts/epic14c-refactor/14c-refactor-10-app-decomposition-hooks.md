# Story 14c-refactor.10: App.tsx Decomposition - Hooks (Non-Scan)

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **non-scan App.tsx initialization and effect logic extracted into custom hooks**,
So that **App.tsx is declarative and logic is reusable, reducing the file from ~3800 lines toward ~300 lines**.

## Acceptance Criteria

### Core Functionality

1. **Given** App.tsx contains complex useEffect chains beyond scan functionality
   **When** this story is completed
   **Then:**
   - Create `src/hooks/app/` directory with:
     - `useAppInitialization.ts` - Firebase init, auth state restoration, first-load logic
     - `useDeepLinking.ts` - URL handling, deep link routing (non-scan)
     - `usePushNotifications.ts` - FCM registration, general notification handling
     - `useOnlineStatus.ts` - Network connectivity monitoring
     - `useAppLifecycle.ts` - Foreground/background state, beforeunload handling
   - Each hook is self-contained with its own effects and cleanup
   - **Scan-related hooks remain unchanged** - do NOT modify or duplicate

2. **Given** the extracted hooks are created
   **When** App.tsx uses these hooks
   **Then:**
   - App.tsx reduced by ~300-500 additional lines (non-scan portions)
   - Deep linking continues to work (test with `/join/abc123` share links)
   - Push notifications continue to work (test FCM registration)
   - All existing functionality preserved
   - No regressions in auth, navigation, or lifecycle behavior

3. **Given** the hooks follow the existing codebase patterns
   **When** examining the implementation
   **Then:**
   - Each hook exports a clean interface with well-typed return values
   - useEffect dependencies are minimal and stable (avoid infinite loops)
   - Refs used for functions to prevent dependency churn (see queryClient pattern)
   - JSDoc comments explain hook purpose and usage

### Atlas Workflow Impact Requirements

4. **Given** `useAppInitialization` handles auth state restoration
   **When** the app loads
   **Then:**
   - Auth context must complete initialization BEFORE ScanContext accesses user state
   - Firebase Auth listener must be set up before any authenticated API calls
   - Persisted scan state restoration occurs AFTER auth is confirmed (to get correct userId)

5. **Given** `useOnlineStatus` monitors network connectivity
   **When** the network status changes
   **Then:**
   - Online/offline status must propagate to components that need it
   - React Query cache behavior should respect online status for refetch decisions
   - Toast notifications for offline/online transitions (existing behavior preserved)

6. **Given** `useDeepLinking` handles URL-based navigation
   **When** an unauthenticated user opens a `/join/shareCode` link
   **Then:**
   - Share code must be stored in sessionStorage (existing pattern from Story 14c.17)
   - After login, pending join code must be processed
   - JoinGroupDialog shows "Coming soon" message (current stubbed behavior)

7. **Given** `usePushNotifications` handles FCM registration
   **When** the app is running in development with HMR
   **Then:**
   - FCM registration must survive hot module reload without duplicate registrations
   - Service worker registration must be idempotent

### Exclusions (Already Done in Epic 14d-old)

The following are **NOT in scope** - they were already extracted to ScanContext:
- `useScanStateMachine` - scan state machine
- `useBatchProcessing` - batch processing logic
- `useBatchCapture` - batch image capture
- `useBatchReview` - batch review queue
- Scan-related useEffects (persistence, navigation blocking)
- processScan() logic (moved to ScanContext)
- handleBatchProcess() logic (moved to ScanContext)

## Tasks / Subtasks

### Task 1: Create `src/hooks/app/` Directory Structure (AC: #1, #3)

- [ ] 1.1 Create `src/hooks/app/` directory
- [ ] 1.2 Create `index.ts` barrel file for exports
- [ ] 1.3 Add TypeScript types file `types.ts` if needed for shared types

### Task 2: Extract `useAppInitialization` Hook (AC: #1, #4)

- [ ] 2.1 Identify initialization logic in App.tsx:
  - Firebase services ready check
  - Auth state listener setup
  - Initial data loading triggers
  - Error state for init failures
- [ ] 2.2 Create `src/hooks/app/useAppInitialization.ts`
- [ ] 2.3 Define return type interface:
  ```typescript
  interface UseAppInitializationResult {
    isInitialized: boolean;
    initError: string | null;
    services: FirebaseServices | null;
  }
  ```
- [ ] 2.4 Move related useEffect chains from App.tsx
- [ ] 2.5 Update App.tsx to use the hook
- [ ] 2.6 Add unit tests

### Task 3: Extract `useDeepLinking` Hook (AC: #1, #6)

- [ ] 3.1 Identify deep linking logic in App.tsx:
  - URL parsing on load
  - `/join/:shareCode` route handling
  - History API interactions
  - sessionStorage for pending join codes
- [ ] 3.2 Create `src/hooks/app/useDeepLinking.ts`
- [ ] 3.3 Define return type interface:
  ```typescript
  interface UseDeepLinkingResult {
    pendingJoinCode: string | null;
    clearPendingJoinCode: () => void;
  }
  ```
- [ ] 3.4 Move `useJoinLinkHandler` coordination logic
- [ ] 3.5 Update App.tsx to use the hook
- [ ] 3.6 Add unit tests
- [ ] 3.7 Manual test: Open `/join/abc123` in incognito, verify flow

### Task 4: Extract `usePushNotifications` Hook (AC: #1, #7)

- [ ] 4.1 Identify push notification logic in App.tsx:
  - FCM/VAPID registration
  - Service worker setup
  - Notification permission request
  - Token refresh handling
- [ ] 4.2 Create `src/hooks/app/usePushNotifications.ts`
- [ ] 4.3 Define return type interface:
  ```typescript
  interface UsePushNotificationsResult {
    isRegistered: boolean;
    hasPermission: boolean;
    requestPermission: () => Promise<void>;
  }
  ```
- [ ] 4.4 Move related useEffect chains from App.tsx
- [ ] 4.5 Add idempotency guard for HMR (development)
- [ ] 4.6 Update App.tsx to use the hook
- [ ] 4.7 Add unit tests

### Task 5: Extract `useOnlineStatus` Hook (AC: #1, #5)

- [ ] 5.1 Identify online/offline logic in App.tsx:
  - Navigator.onLine check
  - Online/offline event listeners
  - Toast notifications for status changes
- [ ] 5.2 Create `src/hooks/app/useOnlineStatus.ts`
- [ ] 5.3 Define return type interface:
  ```typescript
  interface UseOnlineStatusResult {
    isOnline: boolean;
    wasOffline: boolean; // For "back online" detection
  }
  ```
- [ ] 5.4 Move related useEffect chains from App.tsx
- [ ] 5.5 Update App.tsx to use the hook
- [ ] 5.6 Add unit tests

### Task 6: Extract `useAppLifecycle` Hook (AC: #1)

- [ ] 6.1 Identify lifecycle logic in App.tsx:
  - `beforeunload` event handling
  - Visibility change (foreground/background)
  - Focus/blur events
  - Page hide for PWA
- [ ] 6.2 Create `src/hooks/app/useAppLifecycle.ts`
- [ ] 6.3 Define return type interface:
  ```typescript
  interface UseAppLifecycleResult {
    isInForeground: boolean;
    registerBeforeUnloadGuard: (condition: () => boolean) => void;
    unregisterBeforeUnloadGuard: () => void;
  }
  ```
- [ ] 6.4 Move `beforeunload` handler (NOTE: Scan-related guard stays in ScanContext)
- [ ] 6.5 Update App.tsx to use the hook
- [ ] 6.6 Add unit tests

### Task 7: Update App.tsx (AC: #2)

- [ ] 7.1 Import all new hooks from `src/hooks/app/`
- [ ] 7.2 Replace inline effects with hook calls
- [ ] 7.3 Remove dead code after extraction
- [ ] 7.4 Verify no duplicate logic remains
- [ ] 7.5 Run TypeScript compiler - no errors

### Task 8: Testing and Verification (AC: #2, #4, #5, #6, #7)

- [ ] 8.1 Run full test suite: `npm test`
- [ ] 8.2 Run build: `npm run build`
- [ ] 8.3 Manual smoke test checklist:
  - [ ] App loads without errors
  - [ ] Login/logout works
  - [ ] Deep link `/join/abc123` shows "Coming soon"
  - [ ] Network disconnect/reconnect shows toasts
  - [ ] Tab switch (background/foreground) works
  - [ ] Browser refresh with active scan shows warning
- [ ] 8.4 Verify no console errors
- [ ] 8.5 Count lines in App.tsx - should be reduced by ~300-500

## Dev Notes

### Current App.tsx useEffect Chains to Extract

Based on analysis of App.tsx (lines 830-1100+):

| Lines (approx) | Purpose | Target Hook |
|----------------|---------|-------------|
| 842-847 | Toast auto-dismiss | Keep in App.tsx (simple) |
| 851-855 | Personal records check | Keep in App.tsx (feature-specific) |
| 858-870 | Theme/font persistence | Keep in App.tsx (settings-specific) |
| 875-945 | **Persisted scan state load** | **KEEP - ScanContext owns this** |
| 951-976 | **Scan state save** | **KEEP - ScanContext owns this** |
| 986-1008 | **beforeunload for scan** | **KEEP - ScanContext owns this** |
| 1018-1022 | Sync scanCurrency with prefs | Keep in App.tsx (simple) |
| 1031-1057 | Filter clearing on nav | Keep in App.tsx (view-specific) |

**Key Finding:** Many useEffect chains in App.tsx are already feature-specific (scan, filters, settings). The hooks to extract are:
1. **Initialization** - Currently handled by `useAuth` hook, may need composition
2. **Deep linking** - `useJoinLinkHandler` exists, needs coordination hook
3. **Push notifications** - Currently in `useInAppNotifications`, may need extraction
4. **Online status** - Currently inline, needs extraction
5. **Lifecycle** - Currently inline, needs extraction

### Hooks Directory Structure

```
src/hooks/app/
├── index.ts                    # Barrel exports
├── types.ts                    # Shared types (if needed)
├── useAppInitialization.ts     # Firebase init, auth state
├── useDeepLinking.ts           # URL handling, join codes
├── usePushNotifications.ts     # FCM registration
├── useOnlineStatus.ts          # Network connectivity
└── useAppLifecycle.ts          # Foreground/background, unload
```

### Existing Hooks to Preserve (NOT Touch)

These are scan-related and MUST NOT be modified:
- `src/hooks/useScanStateMachine.ts` (Story 14d.1)
- `src/hooks/useBatchProcessing.ts` (Story 12.2)
- `src/hooks/useBatchCapture.ts` (Story 12.1)
- `src/hooks/useBatchReview.ts` (Story 12.3)
- `src/contexts/ScanContext.tsx` (Story 14d.2)

### Testing Standards

- Unit tests for each new hook
- Mock browser APIs (navigator.onLine, service worker, etc.)
- Use `vi.fn()` for callbacks
- Test cleanup functions (useEffect returns)
- Minimum 80% coverage for new code

### Dependencies

- **Depends on:** Story 14c-refactor.9 (Contexts must be extracted first)
- **Blocks:** Story 14c-refactor.11 (Components need hooks ready)

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md#Part-2] - Architecture spec
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.10] - Story definition
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md#Scan-State-Machine] - ScanContext patterns
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Workflow dependencies

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Auth → Scan → Save Critical Path**: Auth initialization timing is critical - ScanContext needs user ID for persistence
- **Push Notification Flow**: FCM registration flow feeds into notification system (currently stubbed for shared groups)
- **Deep Link Flow**: `/join/` route handling for share codes (shows "Coming soon" per current stub)
- **Scan Receipt Flow (#1)**: Depends on Firebase init completing before scanning

### Downstream Effects to Consider

- `useAppInitialization` MUST complete before ScanContext accesses `user.uid` for scan persistence
- Online status changes affect React Query cache freshness decisions
- Deep link handler must preserve sessionStorage pattern for unauthenticated join codes
- Push notification registration must be idempotent for HMR compatibility

### Testing Implications

- **Existing tests to verify:** Auth flow tests, deep link tests from Story 14c.17
- **New scenarios to add:** Hook isolation tests, initialization order tests, HMR idempotency tests

### Workflow Chain Visualization

```
Firebase Init → [useAppInitialization] → Auth Ready
                         ↓
                   [ScanContext] → Can access user.uid
                         ↓
                   [useDeepLinking] → Process pending join codes
                         ↓
                   [usePushNotifications] → Register FCM token
                         ↓
                   App Ready for User Interaction
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**To Create:**
- `src/hooks/app/index.ts`
- `src/hooks/app/useAppInitialization.ts`
- `src/hooks/app/useDeepLinking.ts`
- `src/hooks/app/usePushNotifications.ts`
- `src/hooks/app/useOnlineStatus.ts`
- `src/hooks/app/useAppLifecycle.ts`
- `tests/unit/hooks/app/useAppInitialization.test.ts`
- `tests/unit/hooks/app/useDeepLinking.test.ts`
- `tests/unit/hooks/app/usePushNotifications.test.ts`
- `tests/unit/hooks/app/useOnlineStatus.test.ts`
- `tests/unit/hooks/app/useAppLifecycle.test.ts`

**To Modify:**
- `src/App.tsx` - Import and use new hooks, remove extracted logic
