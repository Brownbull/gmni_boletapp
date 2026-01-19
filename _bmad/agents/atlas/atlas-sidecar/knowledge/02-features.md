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

## Current Development: Epic 14c (Household Sharing)

**Status:** 10/11 stories done | **Points:** ~55 | **Started:** 2026-01-15

### Core Features Delivered
- **Shared Groups:** Create, join via share code, manage members
- **View Mode Switcher:** Toggle between personal/shared group views
- **Transaction Tagging:** Tag transactions to groups manually or auto-tag on scan
- **Ownership Indicators:** Visual display of transaction owners with avatars
- **Member Filtering:** Filter shared group transactions by member
- **Empty States:** Context-aware empty states and loading skeletons

### Story Status

| Story | Status | Description |
|-------|--------|-------------|
| 14c.1 | ✅ Done | Create Shared Group (top-level collection, share codes) |
| 14c.2 | ✅ Done | Accept/Decline Invitation (email-based workflow) |
| 14c.3 | ✅ Done | Leave/Manage Group (member management, owner transfer) |
| 14c.4 | ✅ Done | View Mode Switcher (personal/group toggle) |
| 14c.5 | ✅ Done | Shared Group Transactions View (merged feed) |
| 14c.6 | ✅ Done | Transaction Ownership Indicators (avatars, colors) |
| 14c.7 | ✅ Done | Tag Transactions to Groups (manual assignment) |
| 14c.8 | ✅ Done | Auto-Tag on Scan (default group assignment) |
| 14c.9 | ✅ Done | Member Filter Bar (filter by household member) |
| 14c.10 | ✅ Done | Empty States & Loading (skeleton + context CTAs) |
| 14c.11 | 📋 Ready | Real-time Sync (onSnapshot listeners) |

### Key Architecture (ADR-011)
- **Top-level collections:** `/sharedGroups/{groupId}`, `/pendingInvitations/{invitationId}`
- **Security helpers:** `isGroupMember()`, `isGroupOwner()`, `isJoiningGroup()`
- **Query pattern:** Collection group queries with auth-only + limit rules

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
