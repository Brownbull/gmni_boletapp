# Feature Inventory + Intent

> Section 2 of Atlas Memory
> Last Sync: 2026-01-17
> Last Optimized: 2026-01-17 (Generation 5)
> Sources: sprint-status.yaml, epics.md, PRD documents

## Core Features (Implemented)

| Feature | Purpose | Epic |
|---------|---------|------|
| Receipt Scanning | AI-powered OCR extracts transaction data | Epic 1 |
| Transaction Management | CRUD operations for transactions | Epic 1 |
| Category System | Hierarchical: Store Category → Item Group → Subcategory | Epic 9 |
| Smart Category Learning | Auto-applies learned preferences on future scans | Epic 6 |
| Merchant Learning | Fuzzy matching for merchant suggestions | Epic 9 |
| Analytics Dashboard | Dual-axis navigation (temporal + category) | Epic 7 |
| History Filters | Filter by time, category, location, groups | Epic 9, 14 |
| Data Export | CSV export for transactions and aggregated items | Epic 5, 14 |
| PWA Installation | Add to Home Screen, push notifications | Epic 9 |
| Theme System | Light/Dark modes, Normal/Professional/Mono themes | Epic 7, 14 |
| Insight Engine | 12 generators, phase-based selection | Epic 10 |
| Quick Save | 85% confidence threshold, weighted scoring | Epic 11 |
| Trust Merchant | Auto-categorization for trusted merchants | Epic 11 |
| Batch Processing | Multi-receipt capture, parallel API calls | Epic 12 |
| **Household Sharing** | Multi-user groups with transaction tagging | Epic 14c |

## Completed Epics Summary

| Epic | Stories | Deployed | Key Deliverables |
|------|---------|----------|------------------|
| Epic 10 | 9 | 2025-12-19 | InsightEngine, 12 generators, ADRs 015-017 |
| Epic 10a | 5 | 2025-12-21 | Home+History merged, Insights tab |
| Epic 11 | 7 | 2025-12-22 | QuickSaveCard, trust merchants, PWA viewport |
| Epic 12 | 6 | 2025-12-23 | Batch capture, parallel processing, 2799 tests |
| Epic 13 | 15 | 2025-12-31 | 10 HTML mockups, design system, motion system |
| **Epic 14** | **50+** | **2026-01-15** | Animation, polygon, analytics, React Query |
| **Epic 14d** | **11** | **2026-01-12** | Scan state machine, navigation blocking |

---

## Current Development: Epic 14c-refactor (Codebase Cleanup)

**Status:** 12/21 stories done | **Points:** ~65 (includes 14c-refactor.20-22) | **Started:** 2026-01-21

### Epic Context
Epic 14c (original Household Sharing) was **REVERTED** on 2026-01-20 due to:
- Delta sync cannot detect transaction removals
- Multi-layer caching got out of sync
- Cost explosion from fallback strategies

**This Epic:** Cleans codebase before Epic 14d (Shared Groups v2)

### Story Status (Part 1: Cleanup) - ALL DONE ✅

| Story | Status | Description |
|-------|--------|-------------|
| 14c-refactor.1 | ✅ Done | Stub Cloud Functions |
| 14c-refactor.2 | ✅ Done | Stub Services |
| 14c-refactor.3 | ✅ Done | Stub Hooks |
| 14c-refactor.4 | ✅ Done | Clean IndexedDB Cache |
| 14c-refactor.5 | ✅ Done | Placeholder UI States |
| 14c-refactor.6 | ✅ Done | Firestore Data Cleanup Script |
| 14c-refactor.7 | ✅ Done | Security Rules Simplification |
| 14c-refactor.8 | ✅ Done | Remove Dead Code |

### Story Status (Part 2: App Architecture Refactor)

| Story | Status | Description |
|-------|--------|-------------|
| 14c-refactor.9 | ✅ Done | Extract Auth, Navigation, Theme, Notification, AppState contexts |
| 14c-refactor.10 | ✅ Done | Extract useAppInitialization, useDeepLinking, usePushNotifications, useOnlineStatus, useAppLifecycle |
| 14c-refactor.11 | ✅ Done | Create AppProviders, AppRoutes, AppLayout, AppErrorBoundary (106 tests) |
| 14c-refactor.12 | 📋 Ready | Verify React Query cache, remove dead query keys |
| 14c-refactor.13 | 📋 Ready | View Mode State Unification |

### Story Status (Part 5: App.tsx Full Decomposition) - NEW (3 stories, 11 pts)

| Story | Status | Description |
|-------|--------|-------------|
| **14c-refactor.20** | **📋 Ready** | **Extract transaction + scan handlers (3 pts)** |
| **14c-refactor.21** | **📋 Ready** | **Extract navigation + dialog handlers (3 pts)** |
| **14c-refactor.22** | **📥 Backlog** | **JSX into AppRoutes + final cleanup to ~200-300 lines (5 pts)** |

### Story Created - 14c-refactor.9 - 2026-01-21

**Summary:** App.tsx Decomposition - Contexts (Non-Scan) - Extract 5 context providers for Auth, Navigation, Theme, Notification, and AppState

**User Value:** Cleaner codebase architecture, smaller App.tsx (~500-700 lines reduced), better separation of concerns, maintainability

**Workflow Touchpoints:**
- Auth → Scan → Save Critical Path (auth timing)
- Scan Request Lifecycle (ScanContext preserved)
- Analytics Navigation Flow (view switching)
- Trust Merchant Flow (user.uid dependency)

**Source:** docs/sprint-artifacts/epic14c-refactor/14c-refactor-9-app-decomposition-contexts.md

### Story Created - 14c-refactor.10 - 2026-01-21

**Summary:** App.tsx Decomposition - Hooks (Non-Scan) - Extract 5 custom hooks for initialization, deep linking, push notifications, online status, and app lifecycle

**User Value:** Cleaner codebase architecture, smaller App.tsx (~300-500 lines reduced), better separation of concerns

**Workflow Touchpoints:**
- Auth → Scan → Save Critical Path (initialization timing)
- Push Notification Flow (FCM registration)
- Deep Link Flow (/join/ route handling)
- Scan Receipt Flow (depends on Firebase init)

**Source:** docs/sprint-artifacts/epic14c-refactor/14c-refactor-10-app-decomposition-hooks.md

### Story Completed - 14c-refactor.11 - 2026-01-21

**Summary:** App.tsx Decomposition - Components - Created AppProviders, AppRoutes, AppLayout, AppErrorBoundary, AppMainContent, and types module

**Outcome:**
- 6 components created in `src/components/App/`
- 106 unit tests (5 test files)
- AppLayout + AppErrorBoundary integrated
- **Partial integration:** Full line reduction (200-300 lines) deferred to 14c-refactor.20

**Key Learnings (Atlas Code Review 2026-01-21):**
1. **Scope creep detection:** Original AC#2 (~200-300 lines) was too aggressive for single story - split into follow-up
2. **Provider scoping decision:** AnalyticsProvider/HistoryFiltersProvider intentionally kept view-scoped (prevent re-renders)
3. **Test coverage:** Comprehensive testing (106 tests) validates component contracts before full integration

**Workflow Touchpoints:**
- Auth → Scan → Save Critical Path (provider composition order) ✅
- Scan Receipt Flow (#1) (ScanProvider in main.tsx) ✅
- Analytics Navigation Flow (#4) (AnalyticsProvider view-scoped) ✅

**Source:** docs/sprint-artifacts/epic14c-refactor/14c-refactor-11-app-decomposition-components.md

### Stories Created - 14c-refactor.20-22 - 2026-01-21

**Split Decision:** Original 8pt story split into 3 granular stories (11 pts total) for better risk isolation and review cadence.

| Story | Points | Scope |
|-------|--------|-------|
| 14c-refactor.20 | 3 pts | Transaction + Scan handlers (useTransactionHandlers, useScanHandlers) |
| 14c-refactor.21 | 3 pts | Navigation + Dialog handlers (useNavigationHandlers, useDialogHandlers) |
| 14c-refactor.22 | 5 pts | JSX into AppRoutes, AppProviders integration, final cleanup to ~200-300 lines |

**Dependency Chain:**
```
14c-refactor.11 → 14c-refactor.20 → 14c-refactor.21 → 14c-refactor.22
   (components)      (tx/scan)         (nav/dialog)      (JSX/cleanup)
```

**Sources:**
- docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-20-app-handler-extraction.md
- docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-21-app-navigation-dialog-handlers.md
- docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-22-app-jsx-extraction-final-cleanup.md

### Story Created - 14c-refactor.13 - 2026-01-21

**Summary:** View Mode State Unification - Simplify view mode to React Context only, remove localStorage and Firestore persistence

**User Value:** Eliminates synchronization bugs between three state sources, cleaner codebase, simpler architecture

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - no group auto-tagging
- History Filter Flow (#6) - always personal data
- Analytics Navigation Flow (#4) - always personal mode

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-13-view-mode-state-unification.md

### Story Marked Ready - 14c-refactor.25 - 2026-01-22

**Summary:** ViewHandlersContext for Handler Passing - Create React Context to pass handlers (transaction, scan, navigation, dialog) to views without prop drilling

**User Value:** Cleaner view prop interfaces, reduced coupling, maintainable codebase, completes handler extraction pattern

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - TransactionEditorView save handlers via context
- Quick Save Flow (#2) - QuickSaveCard scan handlers timing critical
- Batch Processing Flow (#3) - BatchReviewView scan handlers
- Analytics Navigation Flow (#4) - TrendsView navigation handlers for drill-down
- History Filter Flow (#6) - HistoryView navigation handlers, filter clearing

**Atlas-Suggested ACs Added:**
- AC #5: Memoization verification (no spurious re-renders)
- AC #6: Critical path smoke test (Auth → Scan → Save)

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-25-view-handlers-context.md

### Story Created - 14c-refactor.15 - 2026-01-21

**Summary:** Cloud Functions Audit - Inventory, document, and consolidate all Cloud Functions with criticality levels

**User Value:** Clean, documented Cloud Functions infrastructure ready for future maintenance and Epic 14d

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - `analyzeReceipt` is core OCR function
- Batch Processing Flow (#3) - uses `analyzeReceipt` for parallel processing
- Scan Request Lifecycle (#9) - relies on `analyzeReceipt` response format

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-15-cloud-functions-audit.md

### Story Created - 14c-refactor.16 - 2026-01-21

**Summary:** Firestore Cost Monitoring Setup - Budget alerts + Cloud Monitoring dashboard for cost visibility

**User Value:** Proactive cost detection before Epic 14d launch, prevents cost explosions like Epic 14c ($19/week spike)

**Workflow Touchpoints:**
- None (infrastructure/observability story)

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-16-firestore-cost-monitoring.md

### Story Created - 14c-refactor.17 - 2026-01-21

**Summary:** Test Suite Cleanup - Delete tests for removed shared group files, update stub tests, add context/hook tests

**User Value:** Test suite accurately reflects refactored codebase, maintains 80%+ coverage, CI reliability

**Workflow Touchpoints:**
- CI/CD Test Pipeline (explicit test groups, shard balance)
- Auth → Scan → Save Critical Path (context test coverage)
- Firestore Security Rules (deny-all tests)

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-17-test-suite-cleanup.md

### Key Approach
- **Shell & Stub:** Keep UI components as disabled placeholders
- **React Query only:** Remove IndexedDB/localStorage caching
- **Preserve ScanContext:** Epic 14d-old already refactored scan state

---

## Epic 14d: Scan Architecture Refactor (COMPLETE)

**Status:** 11/11 stories done (2026-01-12) | **Points:** ~45

### Key Deliverables
- State machine hook (`useScanStateMachine`)
- ScanContext provider (single source of truth)
- Hybrid navigation blocking
- Mode selector popup (long-press FAB)
- FAB visual states (phase-based colors)
- Unified persistence (no expiration)

### Key Decisions (ADR-020)
| Decision | Choice |
|----------|--------|
| Request Precedence | Active request blocks ALL new requests |
| Persistence | No expiration, survives logout/app close |
| Batch State | ScanContext owns all (no dual-sync) |

**Spec:** `docs/sprint-artifacts/epic14d/scan-request-lifecycle.md`

---

## Future Roadmap (Epics 15-18)

| Epic | Name | Focus | Status |
|------|------|-------|--------|
| 14E | Codebase Refactoring | Bundle optimization, modularization | Planning |
| 14F | Invite-Only Access | Controlled beta rollout | Planning |
| 15 | Advanced Features | Goals/GPS, learned thresholds | Backlog |
| 16 | Onboarding | <60 second time-to-value | Backlog |
| 17 | Tags & Grouping | User-defined tags for project/trip tracking | Backlog |
| 18 | Achievements | Ethical gamification, milestones | Backlog |

---

## Feature Dependencies

### Scan Flow
```
Camera → Gemini OCR → Merchant Mapping → Category Mapping → EditView → Save
```

### Learning System
```
User Edit → Learning Prompt → Mapping Saved → Future Scans Auto-Apply
```

### Analytics
```
Transactions → FilteringService → AnalyticsContext → Charts → Drill-down
```

### Household Sharing (Epic 14c)
```
Create Group → Share Code → Accept Invite → View Mode Switch → Merged Feed
```

### Story Marked Ready - 14c-refactor.20 - 2026-01-21

**Summary:** App.tsx Handler Extraction - Transaction & Scan Handlers - Extract ~585 lines of handler code into `useTransactionHandlers` and `useScanHandlers` custom hooks

**User Value:** Modularized and testable handler logic, improved maintainability, reduced coupling in App.tsx

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - `processScan` must maintain exact state machine event ordering
- Quick Save Flow (#2) - Save handlers tightly coupled to quick save eligibility, timing critical for trust merchant prompts
- Batch Processing Flow (#3) - Uses same `handleSaveTransaction` path as single scan
- Auth → Scan → Save Critical Path - `user.uid` must be accessible in hook closure

**Key Implementation Notes:**
- Credit atomicity pattern: Deduct BEFORE API call, refund on error ONLY
- Transaction handlers: Pass UI callbacks as props
- Scan handlers: Access ScanContext internally (already tightly coupled)
- All handlers use `useCallback` for stable references

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-20-app-handler-extraction.md

### Story Marked Ready - 14c-refactor.21 - 2026-01-21

**Summary:** App.tsx Handler Extraction - Navigation & Dialog - Extract navigation handlers (navigateToView, navigateBack) and dialog handlers into custom hooks

**User Value:** Modularized navigation logic, testable handlers, reduced App.tsx complexity, completion of handler extraction phase

**Workflow Touchpoints:**
- History Filter Flow (#6) - filter clearing logic on navigation
- Analytics Navigation Flow (#4) - drill-down state passing (pendingHistoryFilters, pendingDistributionView)
- Scan Receipt Flow (#1) - dialog dismissal on navigation
- Quick Save Flow (#2) - QuickSave dialog dismissal timing

**Key Implementation Notes:**
- Filter persistence: Clear filters when navigating from unrelated views, preserve from related views (history/items/transaction-editor/trends/dashboard)
- Scroll position management: Save/restore via refs (scrollPositionsRef, mainRef)
- ScanContext integration: Navigation dismisses QuickSave dialog via `dismissScanDialog`
- All handlers use `useCallback` for stable references

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-21-app-navigation-dialog-handlers.md

### Story Marked Ready - 14c-refactor.22 - 2026-01-21

**Summary:** App.tsx JSX Extraction & Final Cleanup - Move ~3,200 lines of view rendering JSX into AppRoutes, integrate AppProviders, reduce App.tsx from 5,079 lines to ~200-300 lines

**User Value:** Clean composition root architecture, better separation of concerns, maintainable codebase, completes App.tsx decomposition goal from Epic 14c-refactor

**Workflow Touchpoints:**
- Auth → Scan → Save Critical Path (#1) - Provider order must preserve AuthProvider→ScanProvider
- Scan Receipt Flow (#1) - All scan views receive props from App.tsx, must maintain state machine integration
- Quick Save Flow (#2) - QuickSaveCard overlay timing critical during scan flow
- Analytics Navigation Flow (#4) - AnalyticsProvider must remain view-scoped (NOT moved to AppProviders)
- History Filter Flow (#6) - HistoryFiltersProvider must remain view-scoped
- Batch Processing Flow (#3) - BatchCaptureView/BatchReviewView receive batch state from App.tsx

**Key Implementation Notes:**
- View-scoped providers: AnalyticsProvider and HistoryFiltersProvider stay wrapping only their views
- Overlay z-index: 15+ overlays must render at correct z-index (NavigationBlocker=60, dialogs=50, cards=40)
- Scroll position: mainRef and scrollPositionsRef must be accessible in extracted JSX
- Handler passing: Render props pattern (Option A) recommended over ViewHandlersContext
- Provider order: main.tsx (QueryClient→Auth→ViewMode→Scan), App.tsx (Theme→Nav→AppState→Notification)

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-22-app-jsx-extraction-final-cleanup.md

---

## Epic 14d-v2: Shared Groups v2 (NEW - 2026-01-22)

**Status:** 11/41 stories ready | **Points:** ~138 total | **Started:** 2026-01-22

### Epic Context
Rebuild shared groups from scratch with lessons learned from Epic 14c failure:
- Single `sharedGroupId` (not array) - eliminates `array-contains` limitations
- Changelog-driven sync - explicit removal events
- Double-gate privacy model - group + user opt-in
- Manual sync buttons - no complex auto-sync

### Story Created - 14d-v2-1-2 - 2026-01-22

**Summary:** Transaction Type Migration - Add `sharedGroupId` (single), `deletedAt`, `deletedBy`, `updatedAt`, `version`, `periods` fields; remove `sharedGroupIds` array

**User Value:** Simpler data model enables reliable changelog-driven sync for Epic 14d-v2 Shared Groups

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - save path auto-populates new fields
- Quick Save Flow (#2) - same save path impact
- Batch Processing Flow (#3) - same save path impact
- Learning Flow (#5) - edits increment version
- History Filter Flow (#6) - periods enable efficient queries

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-2-transaction-type-migration.md

### Story Created - 14d-v2-1-3 - 2026-01-22

**Summary:** Changelog Infrastructure - Define TypeScript types, security rules, and query service for `/groups/{groupId}/changelog/{changeId}` subcollection

**User Value:** Foundation for reliable changelog-driven sync (AD-2, AD-3) that enables Epic 14c's core bug fix (transaction removal detection)

**Workflow Touchpoints:**
- None (foundation infrastructure story)

**Downstream Dependencies:**
- Story 1.8 (Cloud Function - Changelog Writer)
- Stories 2.1-2.10 (Sync stories)
- Story 4.1 (Push notifications)

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-3-changelog-infrastructure.md

### Story Created - 14d-v2-1-4 - 2026-01-22

**Summary:** Create Shared Group - Users can create shared expense groups with transaction sharing privacy controls (Layered Visibility Model)

**User Value:** Enable expense sharing with family, roommates, or friends

**Workflow Touchpoints:**
- Settings Flow (entry point for group creation)
- Navigation Flow (post-creation navigation to new group)
- View Mode Switcher (groups list populated from created groups)
- Future Analytics (#4) (group analytics will filter by sharedGroupId)

**Downstream Dependencies:**
- Story 1.5 (Invite Members) - needs group to exist
- Story 1.10 (View Mode Switcher) - needs groups to display
- Story 1.11 (Transaction Sharing Toggle) - needs owner permissions
- Story 2.1 (Tag Transactions) - needs groups to tag to

**Key Architecture Decisions:**
- BC-1: Max 5 groups per user
- AD-6: Group-level timezone (IANA format)
- LV-1: Stats always include all members
- FR-19: Owner controls group transaction sharing toggle

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-4-create-shared-group.md

### Story Created - 14d-v2-1-5 - 2026-01-22

**Summary:** Invite Members to Group - Email and share link invitations with business constraints (BC-2: max 10 contributors, BC-3: max 200 viewers)

**User Value:** Group owners can grow their shared expense groups by inviting family, roommates, or friends via email or shareable link

**Workflow Touchpoints:**
- Auth Critical Path (invitation creation requires authentication)
- Deep Link Flow (`/join/{shareCode}` routes for share links)
- Security Rules (new `/pendingInvitations` collection)
- Settings Flow (entry point for invitation UI)

**Downstream Dependencies:**
- Story 1.6 (Accept/Decline Invitation) - consumes invitation data
- Story 1.14 (Join Flow Opt-In) - depends on invitation acceptance
- Epic 4.1 (Push Notifications) - will trigger on invitation events

**Key Technical Decisions:**
- 16+ char cryptographically random URL-safe share codes
- 7-day invitation expiration (TTL)
- BC-2/BC-3 enforcement with clear error messaging
- Duplicate invitation prevention

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-5-invite-members.md

### Story Created - 14d-v2-1-6 - 2026-01-22

**Summary:** Accept/Decline Group Invitation - Users can accept or decline group invitations with deep link support and transaction sharing opt-in

**User Value:** Join shared expense groups seamlessly with privacy-first opt-in flow

**Workflow Touchpoints:**
- Auth Critical Path (deep link + login flow for unauthenticated users)
- Deep Link Flow (`/join/{shareCode}` URL handling, persists through login)
- Navigation Flow (post-accept navigation to newly joined group)
- View Mode Switcher (new group appears immediately after accept)
- Push Notification Flow (pending invitations badge)

**Key Implementation Notes:**
- Deep link must persist share code through login flow (localStorage)
- FR-25: Transaction sharing opt-in prompt for sharing-enabled groups
- FR-26: Invalid share codes display user-friendly error messages
- LV-6: Default `shareMyTransactions: false` (privacy-first)
- 15 acceptance criteria covering deep link, opt-in, error handling

**Downstream Dependencies:**
- Story 1.7 (Leave/Manage) - creates membership that 1.7 allows leaving
- Story 1.10 (View Mode Switcher) - groups list shows joined groups
- Story 2.1 (Tag Transactions) - requires group membership
- Epic 4.1 (Push Notifications) - notifies group of new member

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-6-accept-decline-invitation.md

### Story Created - 14d-v2-1-8 - 2026-01-22

**Summary:** Cloud Function Changelog Writer - Firestore trigger that automatically creates changelog entries when transactions change

**User Value:** Enables reliable sync across group members by creating explicit ADDED/MODIFIED/REMOVED events (fixes Epic 14c core bug)

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - triggers TRANSACTION_ADDED when saving with sharedGroupId
- Learning Flow (#5) - triggers TRANSACTION_MODIFIED when editing category/merchant in shared transaction
- Trust Merchant Flow (#8) - triggers TRANSACTION_ADDED if trusted merchant auto-saves to group

**Key Implementation Notes:**
- Idempotency via event ID as changelog document ID (prevents duplicate entries on retries)
- Full transaction data in changelog entry (`data` field) per AD-3
- 30-day TTL field (`_ttl`) for Firestore auto-cleanup
- Change detection matrix: null→group (ADDED), group→null (REMOVED), same group data changed (MODIFIED), group A→group B (REMOVED+ADDED)
- Validates group existence before writing (graceful skip for deleted groups)

**Downstream Dependencies:**
- Story 2.3 (90-Day Changelog Sync) - consumes changelog entries
- Story 4.1 (Push Notifications) - uses summary field from changelog
- Epic 3 (Server-Side Analytics) - may be batched with changelog writes

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-8-cloud-function-changelog-writer.md

### Story Created - 14d-v2-1-10 - 2026-01-22

**Summary:** View Mode Switcher - Personal/Group view toggle with header indicator

**User Value:** Switch between personal and shared group views to see filtered transaction data

**Workflow Touchpoints:**
- Analytics Navigation Flow (#4) - Group-filtered analytics
- History Filter Flow (#6) - Group-filtered transaction list
- Scan Receipt Flow (#1) - No auto-tag (explicit tagging in Story 2.1)
- Insight Generation Flow (#7) - Personal-mode only

**Key Technical Decisions:**
- Session-only persistence (no localStorage/Firestore)
- Filter clear on mode switch (prevents stale context)
- Re-activates stubbed ViewModeContext and ViewModeSwitcher

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-10-view-mode-switcher.md

### Story Created - 14d-v2-1-11 - 2026-01-22

**Summary:** Transaction Sharing Toggle (Group Level) - Group owner can enable/disable transaction sharing with cooldowns (15 min, 3x/day limit)

**User Value:** Privacy control allowing group owners to decide whether members can see each other's transaction details (Gate 1 of double-gate model)

**Workflow Touchpoints:**
- Settings Flow (entry point for toggle UI)
- View Mode Switcher (sharing status indicator)
- Group Management Flow (owner settings)
- Transaction Visibility Flow (Gate 1 of double-gate model)

**Downstream Dependencies:**
- Story 2.2 (View Group Transactions) - uses toggle for visibility filtering
- Story 2.11 (Cloud Function Visibility Filtering) - server-side double-gate enforcement
- Story 2.12 (Sharing Disabled Empty State) - shows UX when toggle is off
- Story 1.12 (User Transaction Sharing Preference) - gated by this toggle

**Key Technical Decisions:**
- FR-19: Owner controls group transaction sharing toggle
- FR-21: 15 min cooldown, 3×/day limit
- LV-3: Transaction visibility requires double opt-in (group + user)
- Ownership transfer preserves cooldown state

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-11-transaction-sharing-toggle-group.md

### Story Created - 14d-v2-1-13 - 2026-01-22

**Summary:** User Group Preferences Document - Firestore schema for per-user, per-group sharing preferences

**User Value:** Enables Story 1.12 (User Transaction Sharing Preference) UI and double-gate visibility filtering (Gate 2 data model)

**Workflow Touchpoints:**
- None (foundation infrastructure story)

**Downstream Dependencies:**
- Story 1.12 (User Transaction Sharing Preference) - primary consumer for preference UI
- Story 1.14 (Join Flow Opt-In) - initializes preference entry when user joins
- Story 1.7 (Leave/Manage Group) - cleanup of preference on leave
- Story 2.2 (View Group Transactions) - reads `shareMyTransactions` for visibility
- Story 2.11 (Cloud Function Visibility Filtering) - server-side double-gate enforcement

**Key Technical Decisions:**
- LV-6: Default `shareMyTransactions: false` (privacy-first)
- Firestore path: `/users/{userId}/preferences/sharedGroups`
- Lazy document creation (on first write, not read)
- Owner-only security rules

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-13-user-group-preferences-document.md

### Story Created - 14d-v2-1-12 - 2026-01-22

**Summary:** User Transaction Sharing Preference (Gate 2) - Per-user opt-in toggle with 5-min cooldown, 3×/day limit, stored at `/users/{userId}/preferences/sharedGroups`

**User Value:** Privacy control allowing users to contribute to group statistics while optionally hiding individual transaction details

**Workflow Touchpoints:**
- Transaction Visibility Flow (Gate 2 of double-gate model)
- Settings Flow (My Sharing Preferences section)
- Sync Flow (affects visibility filtering in Stories 2.2, 2.11)
- Join Flow (Story 1.14 sets initial preference)
- Leave Flow (Story 1.7 cleans up preference)

**Key Decisions:**
- 5 min cooldown (vs 15 min group-level in Story 1.11)
- Default: false (privacy-first per LV-6)
- 18 acceptance criteria including 5 Atlas-suggested
- Firestore path: `/users/{userId}/preferences/sharedGroups` (defined by Story 1.13)

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-12-user-transaction-sharing-preference.md

### Story Created - 14d-v2-1-14 - 2026-01-22

**Summary:** Join Flow Transaction Sharing Opt-In - Privacy-first prompt when joining sharing-enabled groups to set initial `shareMyTransactions` preference

**User Value:** Clear consent and informed choice about transaction visibility when joining groups with sharing enabled (FR-25, LV-8)

**Workflow Touchpoints:**
- Accept/Decline Flow (Story 1.6) - Adds intermediate opt-in dialog step between Accept and Join
- Deep Link Flow - Share code handling must preserve state through opt-in dialog
- User Group Preferences (Story 1.13) - Initializes `shareMyTransactions` at join time
- View Mode Switcher (Story 1.10) - New group appears after join

**Downstream Dependencies:**
- Story 2.2 (View Group Transactions) - Uses `shareMyTransactions` set here for visibility
- Story 2.11 (Cloud Function Visibility Filtering) - Server-side double-gate reads this preference
- Story 2.12 (Sharing Disabled Empty State) - UX based on preference
- Story 1.12 (User Transaction Sharing Preference) - Allows changing the preference set at join

**Key Technical Decisions:**
- LV-6: Default `shareMyTransactions: false` (privacy-first, including on dismiss)
- FR-25: Join flow prompts opt-in when group has `transactionSharingEnabled: true`
- LV-8: Prompt appears on join for sharing-enabled groups
- Skip dialog if `transactionSharingEnabled: false` (join directly with false)

**Source:** docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-14-join-flow-opt-in.md

### Story Created - 14c-refactor.26 - 2026-01-22

**Summary:** View-Specific Prop Composition Hooks - Create `useTransactionEditorViewProps`, `useTrendsViewProps`, `useHistoryViewProps`, `useBatchReviewViewProps` hooks to compose all props for complex views

**User Value:** Enables App.tsx reduction from ~2,000 to ~800-1,000 lines by encapsulating view prop assembly into testable hooks

**Workflow Touchpoints:**
- Scan Receipt Flow (#1) - TransactionEditorView is PRIMARY view, prop composition must preserve scan state machine
- Quick Save Flow (#2) - QuickSaveCard dialog handling timing critical
- Batch Processing Flow (#3) - BatchReviewView batch state composition
- Analytics Navigation Flow (#4) - TrendsView drill-down filter preservation
- History Filter Flow (#6) - HistoryView pagination and filter state

**Atlas-Suggested ACs Added:**
- AC #6: Memoization stability (no spurious re-renders)
- AC #7: Critical path smoke test

**Dependencies:**
- Requires: 14c-refactor.25 (ViewHandlersContext)
- Enables: Final App.tsx cleanup, easier view testing

**Source:** docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-26-view-prop-composition-hooks.md

---

## Sync Notes

- **Generation 20 (2026-01-22):** Added Story 14c-refactor.26 ready-for-dev (View-Specific Prop Composition Hooks with Atlas workflow chain analysis for 5 workflows, 7 ACs)
- **Generation 19 (2026-01-22):** Added Story 14d-v2-1-14 ready-for-dev (Join Flow Transaction Sharing Opt-In - FR-25/LV-8 consent prompt with Atlas workflow chain analysis, 15 ACs, overlaps with Story 1.6 tasks)
- **Generation 18 (2026-01-22):** Added Story 14d-v2-1-12 ready-for-dev (User Transaction Sharing Preference - Gate 2 of double-gate model with 5-min cooldown, 18 ACs including Atlas suggestions)
- **Generation 17 (2026-01-22):** Added Story 14d-v2-1-13 ready-for-dev (User Group Preferences Document - Firestore schema for per-user, per-group sharing preferences - Gate 2 data model)
- **Generation 16 (2026-01-22):** Added Story 14d-v2-1-11 ready-for-dev (Transaction Sharing Toggle - Gate 1 of double-gate model with cooldowns)
- **Generation 15 (2026-01-22):** Added Story 14d-v2-1-10 ready-for-dev (View Mode Switcher with Atlas workflow chain analysis)
- **Generation 14 (2026-01-22):** Added Story 14d-v2-1-8 ready-for-dev (Cloud Function Changelog Writer with idempotency pattern)
- **Generation 13 (2026-01-22):** Added Story 14d-v2-1-6 ready-for-dev (Accept/Decline Invitation with deep link + opt-in)
- **Generation 12 (2026-01-22):** Added Story 14d-v2-1-4 ready-for-dev (Create Shared Group with Layered Visibility Model)
- **Generation 11 (2026-01-22):** Added Story 14d-v2-1-3 ready-for-dev (Changelog Infrastructure)
- **Generation 10 (2026-01-22):** Added Epic 14d-v2 section, Story 14d-v2-1-2 ready-for-dev (Transaction Type Migration)
- **Generation 9 (2026-01-21):** Updated for Story 14c-refactor.22 marked ready-for-dev (final App.tsx decomposition story)
- **Generation 8 (2026-01-21):** Updated for Story 14c-refactor.21 marked ready-for-dev
- **Generation 7 (2026-01-21):** Updated for Story 14c-refactor.20 marked ready-for-dev
- Epic 14c-refactor at 12/22 stories - Part 1 COMPLETE, Part 2 in progress, Part 5 stories ready
- Story 14c-refactor.11 DONE (106 tests, smoke tests pass), follow-up 14c-refactor.20-22 created
- Story 14c-refactor.20, .21, .22 ready-for-dev with Atlas workflow chain analysis
- Key pattern: Provider scoping (Analytics/HistoryFilters view-scoped vs app-scoped)
- Key pattern: Credit atomicity (deduct before API, refund on error only)
- Test count: 3,252+ unit tests
- Version: 1.0.0-beta.1
