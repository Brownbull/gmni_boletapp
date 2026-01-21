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

**Status:** 5/19 stories done | **Points:** ~54 | **Started:** 2026-01-21

### Epic Context
Epic 14c (original Household Sharing) was **REVERTED** on 2026-01-20 due to:
- Delta sync cannot detect transaction removals
- Multi-layer caching got out of sync
- Cost explosion from fallback strategies

**This Epic:** Cleans codebase before Epic 14d (Shared Groups v2)

### Story Status (Part 1: Cleanup)

| Story | Status | Description |
|-------|--------|-------------|
| 14c-refactor.1 | ✅ Done | Stub Cloud Functions |
| 14c-refactor.2 | ✅ Done | Stub Services |
| 14c-refactor.3 | ✅ Done | Stub Hooks |
| 14c-refactor.4 | ✅ Done | Clean IndexedDB Cache |
| 14c-refactor.5 | ✅ Done | Placeholder UI States |
| 14c-refactor.6 | 📋 Ready | Firestore Data Cleanup Script |
| 14c-refactor.7 | 📋 Ready | Security Rules Simplification |
| 14c-refactor.8 | 📋 Ready | Remove Dead Code (memberUpdateDetection.ts, archive scripts) |

### Story Status (Part 2: App Architecture Refactor)

| Story | Status | Description |
|-------|--------|-------------|
| **14c-refactor.9** | **📋 Ready** | **Extract Auth, Navigation, Theme, Notification, AppState contexts** |
| **14c-refactor.10** | **📋 Ready** | **Extract useAppInitialization, useDeepLinking, usePushNotifications, useOnlineStatus, useAppLifecycle** |
| **14c-refactor.11** | **📋 Ready** | **Create AppProviders, AppRoutes, AppLayout, AppErrorBoundary** |

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

### Story Created - 14c-refactor.11 - 2026-01-21

**Summary:** App.tsx Decomposition - Components - Create AppProviders, AppRoutes, AppLayout, AppErrorBoundary to make App.tsx a simple composition root (~200-300 lines)

**User Value:** App.tsx reduced from ~5100 lines to ~200-300 lines, clear separation of concerns, maintainable component architecture

**Workflow Touchpoints:**
- Auth → Scan → Save Critical Path (provider composition order)
- Scan Receipt Flow (#1) (ScanProvider placement)
- Analytics Navigation Flow (#4) (routing in AppRoutes)
- Deep Link Flow (#14c.17) (/join/ route handling in AppRoutes)
- History Filter Flow (#6) (filter clearing on navigation)

**Source:** docs/sprint-artifacts/epic14c-refactor/14c-refactor-11-app-decomposition-components.md

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

---

## Sync Notes

- **Generation 5 (2026-01-17):** Updated for Epic 14c progress
- Epic 14 and 14d marked COMPLETE
- Epic 14c at 10/11 stories (91%)
- Test count: 3,146+ unit tests
- Version: 1.0.0-beta.1
