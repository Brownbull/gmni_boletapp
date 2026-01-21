---
stepsCompleted: [1]
inputDocuments:
  - docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md
session_topic: 'Epic 14c Refactor & Cleanup - Clean up failed shared groups implementation before Epic 14d'
session_goals: 'Architect analysis of current codebase state, identify all legacy shared groups code, create comprehensive refactor/cleanup epic plan'
selected_approach: 'AI-Recommended with Architect Analysis'
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** Gabe
**Date:** 2026-01-21

## Session Overview

**Topic:** Epic 14c Refactor & Cleanup - Clean up failed shared groups implementation before Epic 14d

**Goals:**
- Architect analysis of current codebase state
- Identify ALL legacy shared groups code (hooks, services, components, cloud functions)
- Assess technical debt and complexity
- Create comprehensive refactor/cleanup epic plan
- Ensure clean foundation for Epic 14d (Shared Groups v2)

### Context

Epic 14c (original) attempted real-time sync for shared group transactions and failed due to:
1. Delta sync cannot detect transaction removals (label changes)
2. Complex multi-layer caching got out of sync
3. Cost explosion from fallback full-refetch strategies
4. Multiple iteration approaches caused more harm than one committed approach

**New Epic 14c** will be a dedicated cleanup/refactor epic to remove all this failed code before starting Epic 14d.

---

## Architect Analysis: Codebase State Assessment

### Executive Summary

Epic 14c (original Shared Groups/Household Sharing) was the initial implementation of real-time sync for shared group transactions. It **FAILED** due to:
- Delta sync couldn't detect removals (soft deletes didn't sync properly)
- Multi-layer caching (React Query + IndexedDB + Firestore) got out of sync
- Cost explosion from excessive Firestore queries
- Multiple iteration approaches added technical debt

**Scope of cleanup:** ~16,361 lines of legacy code across services, components, hooks, cloud functions, and tests.

---

### Detailed File Inventory

#### A. Core Services & Libraries (5,506 lines)

| File | Lines | Purpose | Risk Level |
|------|-------|---------|------------|
| `src/services/sharedGroupService.ts` | 1,324 | Main CRUD service for shared groups | **HIGH** |
| `src/services/sharedGroupTransactionService.ts` | 720 | Fetches transactions; delta sync logic | **CRITICAL** |
| `src/lib/sharedGroupCache.ts` | 755 | IndexedDB caching layer (LRU eviction) | **HIGH** |
| `src/lib/sharedGroupErrors.ts` | 412 | Error handling system | **MEDIUM** |
| `src/types/sharedGroup.ts` | 332 | TypeScript interfaces | **CRITICAL** |
| `src/hooks/useSharedGroupTransactions.ts` | 687 | React Query + cache-first strategy | **CRITICAL** |
| `src/hooks/useSharedGroups.ts` | 82 | Subscribe to user's shared groups | **MEDIUM** |
| `src/hooks/useUserSharedGroups.ts` | 144 | Fetch user's shared groups | **MEDIUM** |
| `src/utils/memberUpdateDetection.ts` | 177 | Member update detection (failed) | **HIGH** |

#### B. Cloud Functions (873 lines)

| File | Lines | Purpose | Risk Level |
|------|-------|---------|------------|
| `functions/src/getSharedGroupTransactions.ts` | 288 | Cloud Function for group transactions | **CRITICAL** |
| `functions/src/sendSharedGroupNotification.ts` | 585 | FCM/Web Push notifications | **HIGH** |

#### C. UI Components (6,565 lines - 27 files)

**Directory:** `src/components/SharedGroups/`

Key components:
- `ViewModeSwitcher.tsx` (291 lines) - **CRITICAL** - pervasive throughout app
- `TransactionGroupSelector.tsx` (341 lines) - transaction tagging
- `GroupMembersManager.tsx` (390 lines) - member management
- `JoinGroupDialog.tsx` (384 lines) - join by share code
- `LeaveGroupDialog.tsx` (388 lines) - leave group
- `NotificationsList.tsx` (506 lines) - notifications UI
- Plus 21 more component files

#### D. Tests (3,383 lines)

- Service tests: sharedGroupService, sharedGroupTransactionService
- Hook tests: useSharedGroups, useUserSharedGroups, useSharedGroupTransactions
- Component tests for 27 SharedGroup components
- Firestore rules tests (632 lines)

#### E. Migration Scripts (264 lines)

- `scripts/add-sharedGroupIds-field.ts`
- `scripts/fix-duplicate-sharedGroupIds.ts`

#### F. Firestore Security Rules (217 lines)

- Cross-user transaction read access via sharedGroupIds
- SharedGroups collection rules
- PendingInvitations collection rules

---

### Entangled Code in Non-Shared-Group Files

#### Transaction Type Extensions
**File:** `src/types/transaction.ts`
- `sharedGroupIds?: string[]` - array of group IDs
- `deletedAt?: any` - soft delete timestamp

#### View Mode State Management
- `src/services/userPreferencesService.ts` - ViewModePreference functions
- `src/views/DashboardView.tsx` - view mode switcher, auto-tag, group colors
- `src/views/HistoryView.tsx` - view mode, batch tagging, group filtering
- `src/views/RecentScansView.tsx` - group color lookup
- `src/views/TransactionEditorView.tsx` - TransactionGroupSelector
- `src/App.tsx` - activeGroup state, viewMode logic, auto-tagging

---

### Cleanup Dependency Order (8 Phases)

**Phase 1: Foundation (No Dependencies)**
- Migration scripts (archive)
- Dead code (memberUpdateDetection.ts, disabled emulator code)

**Phase 2: Leaf Services**
- sharedGroupErrors.ts
- sendSharedGroupNotification.ts (Cloud Function)

**Phase 3: Core Services**
- sharedGroupCache.ts (IndexedDB layer)
- sharedGroupTransactionService.ts

**Phase 4: Main Services**
- sharedGroupService.ts
- getSharedGroupTransactions.ts (Cloud Function)

**Phase 5: Hooks**
- useSharedGroups.ts
- useUserSharedGroups.ts
- useSharedGroupTransactions.ts

**Phase 6: UI Components**
- All 27 files in `src/components/SharedGroups/`

**Phase 7: State Management**
- ViewModePreference in userPreferencesService.ts
- View mode state from App.tsx

**Phase 8: Types & Models**
- sharedGroup.ts types
- sharedGroupIds field on Transaction type

---

### Total Lines of Code to Remove

| Category | Lines | Risk |
|----------|-------|------|
| Services (5 files) | 3,854 | HIGH |
| Cloud Functions (2 files) | 873 | HIGH |
| Components (27 files) | 6,565 | MEDIUM |
| Hooks (3 files) | 913 | HIGH |
| Types & Models (1 file) | 332 | CRITICAL |
| Utilities (1 file) | 177 | MEDIUM |
| Tests (10+ files) | 3,383 | MEDIUM |
| Migration Scripts (2 files) | 264 | LOW |
| **TOTAL** | **~16,361** | **CRITICAL** |

---

### Firebase/Backend Changes Required

**Firestore Collections to Delete:**
- `sharedGroups/{groupId}` - entire collection
- `pendingInvitations/{invitationId}` - entire collection

**Security Rules to Remove:**
- SharedGroup rules (lines 76-166)
- PendingInvitation rules (lines 168-209)
- sharedGroupIds cross-user read rule (lines 6-44)

**Cloud Functions to Delete:**
- `getSharedGroupTransactions`
- `sendSharedGroupNotification`

**Transaction Data Cleanup:**
- Remove `sharedGroupIds` field from all documents
- Remove `deletedAt` field from all documents

---

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Breaking transaction model | **CRITICAL** | Careful `sharedGroupIds` removal |
| View mode state stuck | **HIGH** | Remove ViewModeSwitcher, reset state |
| Orphaned notification code | **MEDIUM** | Delete Cloud Function first |
| Test failures cascading | **HIGH** | Run full test suite after each phase |
| Users seeing stale references | **MEDIUM** | Clear localStorage, force reload |

**Estimated Effort:** 40-60 developer hours
**Recommended Approach:** Sequential 8-phase cleanup with testing after each phase

---

## Brainstorming Decisions

### Key Decisions Made

**Q1: Keep shared groups functionality working during cleanup?**
> **Decision:** Frontend interfaces remain with **placeholders**. Backend implementation gets fully cleaned up. Epic 14d will implement real functionality into the placeholder shells.

**Q2: Archive or delete Firestore data?**
> **Decision:** **Delete collections** (sharedGroups, pendingInvitations) BUT **keep field structures empty** on transactions (sharedGroupIds will be emptied, not removed). Epic 14d will reuse these fields.

**Q3: What about existing users with shared groups?**
> **Decision:** After this epic, functionality becomes **placeholder-only**. Users will see the UI shells but no working sync. Epic 14d will restore full functionality with the new architecture.

### Cleanup Strategy Summary

| Layer | Action | Rationale |
|-------|--------|-----------|
| **UI Components** | Keep as placeholders | Reuse in 14d |
| **Services** | Delete implementation | Replace in 14d |
| **Cloud Functions** | Delete | Replace in 14d |
| **Hooks** | Delete or stub | Replace in 14d |
| **Types** | Keep structure | Reuse in 14d |
| **Firestore Data** | Delete collections | Start fresh in 14d |
| **Transaction Fields** | Empty, don't remove | Reuse in 14d |
| **Security Rules** | Simplify (deny access) | Rebuild in 14d |

---

## Epic 14c Structure: Placeholder Architecture

### Approach: "Shell & Stub"

Instead of 8 removal phases, we'll use a **Shell & Stub** approach:
1. **Stub backend** - Replace implementations with placeholder returns
2. **Stub hooks** - Return empty/loading states
3. **Keep UI shells** - Components render but show "Coming Soon" states
4. **Clean data** - Delete Firestore data, empty transaction fields
5. **Simplify rules** - Deny access to shared group collections

This approach:
- Preserves component structure for 14d
- Eliminates broken sync logic
- Provides clean slate for new architecture
- Lower risk than full deletion

---

## Final Epic 14c Structure (Aligned with Retrospective)

### Retrospective Alignment Check

| Retro Requirement | Coverage | Story |
|-------------------|----------|-------|
| App.tsx - Break down ~3800 lines into contexts/hooks | ✅ | 14c.9, 14c.10, 14c.11 |
| Transaction Service - Consolidate/simplify caching layers | ✅ | 14c.12 |
| View Mode State - Unify localStorage/Firestore/Context | ✅ | 14c.13 |
| Cloud Functions - Audit, cleanup, consolidate | ✅ | 14c.1, 14c.15 |
| Firebase Indexes - Audit and optimize | ✅ | 14c.14 |
| Shared Group Cleanup - Remove dead code, reset fields | ✅ | 14c.2-14c.8 |
| Firestore Cost Monitoring | ✅ | 14c.16 |

### Epic Summary

| Part | Focus | Stories | Points |
|------|-------|---------|--------|
| 1 | Shared Groups Stub & Cleanup | 8 | 18 |
| 2 | App Architecture Refactor | 5 | 21 |
| 3 | Firebase & Infrastructure | 3 | 7 |
| 4 | Quality & Validation | 3 | 8 |
| **Total** | | **19** | **~54** |

### Story List

**Part 1: Shared Groups Stub & Cleanup**
- 14c.1: Stub Cloud Functions (2 pts)
- 14c.2: Stub Services (3 pts)
- 14c.3: Stub Hooks (2 pts)
- 14c.4: Clean IndexedDB Cache (2 pts)
- 14c.5: Placeholder UI States (3 pts)
- 14c.6: Firestore Data Cleanup Script (3 pts)
- 14c.7: Security Rules Simplification (1 pt)
- 14c.8: Remove Dead Code & Migration Scripts (2 pts)

**Part 2: App Architecture Refactor**
- 14c.9: App.tsx Decomposition - Contexts (5 pts)
- 14c.10: App.tsx Decomposition - Hooks (5 pts)
- 14c.11: App.tsx Decomposition - Components (3 pts)
- 14c.12: Transaction Service Simplification (5 pts)
- 14c.13: View Mode State Unification (3 pts)

**Part 3: Firebase & Infrastructure**
- 14c.14: Firebase Indexes Audit (2 pts)
- 14c.15: Cloud Functions Audit (3 pts)
- 14c.16: Firestore Cost Monitoring Setup (2 pts)

**Part 4: Quality & Validation**
- 14c.17: Test Suite Cleanup (3 pts)
- 14c.18: Integration Testing (3 pts)
- 14c.19: Documentation Update (2 pts)

---

---

## Prior Art Discovery: Epic 14d-old (Scan Architecture Refactor)

During this session, we discovered that a previous Epic 14d (now at `docs/sprint-artifacts/epic14d-refactor-old/`) had already completed significant App.tsx refactoring:

### Already Completed (PRESERVE):

| Component | Status | Notes |
|-----------|--------|-------|
| `ScanContext` | ✅ DONE | `src/contexts/ScanContext.tsx` |
| `useScanStateMachine` | ✅ DONE | State machine for scan flows |
| Single scan migration | ✅ DONE | Uses ScanContext |
| Batch scan migration | ✅ DONE | Uses ScanContext |
| Scan dialogs unified | ✅ DONE | Currency, Total, QuickSave |
| FAB visual states | ✅ DONE | Color + icon + shine |

**31 scan-related state variables** were already migrated from App.tsx to ScanContext.

### Impact on Epic 14c:

Stories 14c.9-14c.11 (App.tsx Decomposition) have been updated to:
- **Focus on non-scan contexts only** (Auth, Navigation, Theme, AppState)
- **Preserve ScanContext** and all scan-related hooks
- **Exclude scan functionality** from scope (already done)

This reduces the App.tsx decomposition scope but ensures we don't duplicate or break existing work.

---

## Session Output

**Epic Document Created:** [docs/sprint-artifacts/epic14c-refactor/epics.md](../sprint-artifacts/epic14c-refactor/epics.md)

**Prior Art Referenced:** [docs/sprint-artifacts/epic14d-refactor-old/](../sprint-artifacts/epic14d-refactor-old/)

**Session Status:** Complete

