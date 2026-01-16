# Excalidraw Diagram Fix Plan

> Three-reviewer analysis results and implementation plan for diagram improvements
> **Created:** 2026-01-15
> **Reviewers:** Architect, Developer, QA/Documentation

---

## Executive Summary

All 6 Excalidraw diagrams were reviewed against their source Mermaid documentation. Each diagram has identified gaps ranging from missing architectural components to incorrect level counts. This document captures all fixes organized by priority.

**Total Issues Identified:** 42
- HIGH Priority: 12
- MEDIUM Priority: 18
- LOW Priority: 12

---

## Diagram 1: Scan State Machine

**File:** `scan-state-machine.excalidraw`
**Source:** `scan-state-machine.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 1.1 | Missing Statement Mode | Only Single and Batch shown | Add third column for Statement mode (greyed out as "Future") showing: Upload PDF → Parse statement → Review multiple → Bulk save |
| 1.2 | Missing CANCEL paths | No cancellation arrows shown | Add dashed arrows: capturing→idle, reviewing→idle (with warning note) |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 1.3 | Missing Quick Save path | Not shown after scanning | Add decision diamond after scanning phase: "Confidence ≥80%?" with YES→Direct to DB, NO→Review |
| 1.4 | Missing Dialog System | Not visualized | Add small reference section showing 8 dialog types: currency_mismatch, total_mismatch, quicksave, scan_complete, cancel_warning, batch_cancel_warning, discard_warning, batch_complete |
| 1.5 | Missing Persistence/Recovery | Not shown | Add localStorage persistence box with recovery scenarios |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 1.6 | Epic reference outdated | "Epic 14d" in footer | Update to be version-agnostic or current epic |
| 1.7 | Credit lifecycle disconnected | Placed to the side | Show integration arrows from states to credit transitions |

### Visual Changes Required

```
BEFORE:
┌─────────────────────────────────────────────────┐
│  Single Mode          │    Batch Mode           │
│  ─────────────        │    ──────────           │
│  [Capture 1]          │    [Capture 2-10]       │
│      ↓                │         ↓               │
│  [Process]            │    [Parallel Process]   │
│      ↓                │         ↓               │
│  [Review]             │    [Review Queue]       │
│      ↓                │         ↓               │
│  [Save]               │    [Save All/One]       │
└─────────────────────────────────────────────────┘

AFTER:
┌───────────────────────────────────────────────────────────────────┐
│  Single Mode       │   Batch Mode         │  Statement (Future)   │
│  ─────────────     │   ──────────         │  ─────────────────    │
│  [Capture 1]       │   [Capture 2-10]     │  [Upload PDF]         │
│      ↓             │        ↓             │       ↓               │
│  [Process]         │   [Parallel 3x]      │  [Parse Statement]    │
│      ↓             │        ↓             │       ↓               │
│  ◇Confidence?      │   [Review Queue]     │  [List View]          │
│  YES→DB  NO→Review │        ↓             │       ↓               │
│      ↓             │   [Save All/One]     │  [Bulk Save]          │
│  [Save]            │                      │                       │
├───────────────────────────────────────────────────────────────────┤
│  CANCEL PATHS: ─ ─ → (dashed lines from capturing/reviewing)      │
├───────────────────────────────────────────────────────────────────┤
│  DIALOGS: currency_mismatch | total_mismatch | quicksave | ...    │
└───────────────────────────────────────────────────────────────────┘
```

---

## Diagram 2: Transaction Lifecycle

**File:** `transaction-lifecycle.excalidraw`
**Source:** `transaction-lifecycle.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 2.1 | Missing Cascade Delete flow | Not shown | Add section showing: Delete transaction → Cloud Function trigger → Delete Storage folder (images + thumbnails) |
| 2.2 | Missing error paths | Only success paths | Add dashed red arrows for: Gemini failure, Firestore write failure, with rollback annotations |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 2.3 | Missing createdAt/updatedAt | Not in data model | Add to Transaction model: createdAt: Timestamp, updatedAt: Timestamp (auto-generated) |
| 2.4 | Quick Save dual path unclear | Shows confidence check but not both outcomes equally | Make both YES (Direct to Firestore) and NO (Review First) paths equally prominent |
| 2.5 | Field categorization missing | Flat list | Group fields visually: Core | V3 Extended | Storage | Tracking | Organization | Metadata |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 2.6 | "Primary Flow" label subjective | On Scan entry | Remove or replace with neutral "AI-powered" |
| 2.7 | Missing Trusted Merchants concept | Not shown | Add note about trustedMerchants collection |
| 2.8 | groupIds context missing | Shows field but no explanation | Add annotation: "For Shared Groups (Epic 14c)" |

### Visual Changes Required

```
ADD NEW SECTION - CASCADE DELETE:
┌─────────────────────────────────────────────────┐
│  CASCADE DELETE FLOW                            │
├─────────────────────────────────────────────────┤
│  [User deletes] → [Firestore delete]            │
│                          ↓                      │
│              [onDelete trigger fires]           │
│                          ↓                      │
│              [Cloud Function]                   │
│                          ↓                      │
│  [Delete: users/{uid}/receipts/{txId}/*]        │
│  - image-0.jpg                                  │
│  - thumbnail.jpg                                │
└─────────────────────────────────────────────────┘

ADD ERROR PATHS (dashed red):
  Cloud Function ─ ─ → [Error: AI Failed] → Show error dialog
  Firestore Write ─ ─ → [Error: Write Failed] → Retry/Cancel
```

---

## Diagram 3: Analytics Workflow

**File:** `analytics-workflow.excalidraw`
**Source:** `analytics-workflow.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 3.1 | Missing Component Architecture | Not shown | Add hierarchy: TrendsView → Navigation (TB, CB, CMT, DMT) → Display (DDG, DDC, CL, TD) → Charts (PC, BC, SC, TM) |
| 3.2 | Missing Sankey modes | Not shown | Add visualization of 2-level, 3-level (Groups), 4-level Sankey configurations |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 3.3 | Day format incorrect | Shows "Mon-Sun" | Change to "YYYY-MM-DD" (actual dates, not day names) |
| 3.4 | Missing computation functions | Generic "COMPUTE" | List specific: computeAllCategoryData, computeItemCategoryData, computeSubcategoryData, filterByPeriod |
| 3.5 | Missing Day-level constraint | Not noted | Add annotation: "Comparison mode unavailable at Day level" |
| 3.6 | Missing Reducer Actions | Not shown | Add reference to 6 actions: SET_TEMPORAL_LEVEL, SET_CATEGORY_FILTER, TOGGLE_CHART_MODE, TOGGLE_DRILLDOWN_MODE, RESET_TO_YEAR, CLEAR_CATEGORY_FILTER |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 3.7 | Treemap missing | Not in output visualizations | Add Treemap to chart outputs alongside Grid, Pie, Bar, Sankey |
| 3.8 | Tendencia colors not visual | Text description only | Use actual green/red/gray/blue colored indicators |

### Visual Changes Required

```
ADD COMPONENT ARCHITECTURE:
┌─────────────────────────────────────────────────┐
│  COMPONENT HIERARCHY                            │
├─────────────────────────────────────────────────┤
│  TrendsView (5000+ lines)                       │
│      ├── Navigation                             │
│      │   ├── TemporalBreadcrumb                 │
│      │   ├── CategoryBreadcrumb                 │
│      │   ├── ChartModeToggle                    │
│      │   └── DrillDownModeToggle                │
│      ├── Display                                │
│      │   ├── DrillDownGrid → DrillDownCard      │
│      │   ├── CategoryLegend                     │
│      │   └── TotalDisplay                       │
│      └── Charts                                 │
│          ├── SimplePieChart                     │
│          ├── GroupedBarChart                    │
│          ├── SankeyChart                        │
│          └── Treemap                            │
└─────────────────────────────────────────────────┘

ADD SANKEY MODES:
┌─────────────────────────────────────────────────┐
│  SANKEY CONFIGURATIONS                          │
├─────────────────────────────────────────────────┤
│  2-Level: [Store Cat] → [Item Cat]              │
│  3-Level: [Store Grp] → [Store Cat] → [Item Grp]│
│  4-Level: [SG] → [SC] → [IG] → [IC]             │
└─────────────────────────────────────────────────┘
```

---

## Diagram 4: Data Caching

**File:** `data-caching.excalidraw`
**Source:** `data-caching.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 4.1 | Missing Query Keys Structure | Not shown | Add hierarchical visualization: transactions[userId,appId], groups[...], mappings/{type}[...], locations/countries[], household/{id}/* |
| 4.2 | Missing Mutation/Optimistic Update flow | Not shown | Add sequence: Cancel queries → Snapshot → Optimistic update → Write → Success/Rollback |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 4.3 | Missing refetchOnReconnect config | Only 4 config options | Add 5th: refetchOnReconnect: false (Firestore handles reconnection) |
| 4.4 | Core pattern incomplete | Shows cache check but not parallel subscribe | Show that Firestore subscribe happens regardless of cache hit (in parallel) |
| 4.5 | Missing App Lifecycle States | Not shown | Add state diagram: Active (Fresh→Stale→Refreshing) / Background / Offline |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 4.6 | Missing Key Files reference | Not shown | Add footer with key files: queryClient.ts, queryKeys.ts, useFirestoreSubscription.ts, etc. |
| 4.7 | Missing Derived Data Caching | Not shown | Add note about content-hash caching for flattenTransactionItems() |

### Visual Changes Required

```
ADD QUERY KEYS STRUCTURE:
┌─────────────────────────────────────────────────┐
│  QUERY KEYS HIERARCHY                           │
├─────────────────────────────────────────────────┤
│  transactions ─── [userId, appId]               │
│  groups ───────── [userId, appId]               │
│  trustedMerchants [userId, appId]               │
│  mappings/                                      │
│    ├── all ────── [mappings, userId, appId]     │
│    ├── category ─ [mappings, category, ...]     │
│    ├── merchant ─ [mappings, merchant, ...]     │
│    └── subcategory [mappings, subcategory, ...] │
│  locations/                                     │
│    └── countries  [locations, countries]        │
│  household/ (Epic 14c)                          │
│    ├── all ────── [household, householdId]      │
│    ├── transactions [household, id, transactions]│
│    └── members ── [household, id, members]      │
└─────────────────────────────────────────────────┘

ADD MUTATION FLOW:
┌─────────────────────────────────────────────────┐
│  OPTIMISTIC UPDATE SEQUENCE                     │
├─────────────────────────────────────────────────┤
│  [updateTransaction()]                          │
│       ↓                                         │
│  [Cancel in-flight queries]                     │
│       ↓                                         │
│  [Snapshot old data]                            │
│       ↓                                         │
│  [Apply optimistic update] → Re-render          │
│       ↓                                         │
│  [Write to Firestore]                           │
│       ↓                                         │
│  ┌─────────┬─────────┐                          │
│  │ Success │  Error  │                          │
│  │    ↓    │    ↓    │                          │
│  │Invalidate│Rollback │                          │
│  │ query   │to snap  │                          │
│  └─────────┴─────────┘                          │
└─────────────────────────────────────────────────┘
```

---

## Diagram 5: Filtering System

**File:** `filtering-system.excalidraw`
**Source:** `filtering-system.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 5.1 | Temporal hierarchy shows only 5 levels | Missing "all" level | Add 6 levels: ALL → Year → Quarter → Month → Week → Day |
| 5.2 | Category hierarchy incomplete | Shows 4 levels | Show all 5: storeGroup → storeCategory → itemGroup → itemCategory → subcategory |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 5.3 | Missing Legacy vs Modern distinction | Not shown | Add note: "drillDownPath (modern) takes priority over legacy single-dimension fields" |
| 5.4 | Missing dateRange special case | Not shown | Add to temporal section: dateRange {start, end} for Reports ISO weeks |
| 5.5 | Missing Smart Label Detection | Not shown | Add: "Supermarket,Restaurant" → detects "Food & Dining" group |
| 5.6 | Missing Location filter complexity | Simplified | Show selectedCities (modern multi) vs city (legacy single) priority |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 5.7 | Group dropdown missing from UI | HistoryFilterBar shows 3 dropdowns | Add Group filter dropdown to UI section |
| 5.8 | Default state not noted | Not shown | Add annotation: "Default: Current month (not all time)" |
| 5.9 | Reducer Actions not referenced | Not shown | Add reference to 9 actions |

### Visual Changes Required

```
FIX TEMPORAL HIERARCHY (6 levels):
┌─────────────────────────────────────────────────┐
│  TEMPORAL HIERARCHY (6 Levels)                  │
├─────────────────────────────────────────────────┤
│  [ALL] → [Year] → [Quarter] → [Month] → [Week] → [Day]
│   ↑                                              │
│   Level 0: All time                              │
│                                                  │
│  Special: [dateRange] for Reports ISO weeks      │
└─────────────────────────────────────────────────┘

FIX CATEGORY HIERARCHY (5 levels):
┌─────────────────────────────────────────────────┐
│  CATEGORY HIERARCHY (5 Levels)                  │
├─────────────────────────────────────────────────┤
│  [Store Group] → [Store Category*] → [Item Group]│
│        → [Item Category*] → [Subcategory]        │
│                                                  │
│  * = supports multi-select                       │
│                                                  │
│  Modern: drillDownPath (priority)                │
│  Legacy: category, group, subcategory            │
└─────────────────────────────────────────────────┘

ADD SMART LABEL:
┌─────────────────────────────────────────────────┐
│  SMART LABEL DETECTION                          │
├─────────────────────────────────────────────────┤
│  Input: "Supermarket,Restaurant"                │
│      ↓                                          │
│  ◇ Forms known group?                           │
│  YES → "Food & Dining"                          │
│  NO  → "2 categories"                           │
└─────────────────────────────────────────────────┘
```

---

## Diagram 6: Tech Stack

**File:** `tech-stack.excalidraw`
**Source:** `tech-stack.md`

### HIGH Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 6.1 | Missing Firebase Architecture | Not shown | Add: Firestore collections (users, transactions, mappings, sharedGroups, pendingInvitations) + Cloud Functions (analyzeReceipt, onTransactionDeleted) |
| 6.2 | Missing Security Architecture | Not shown | Add layers: Client (HTTPS, CSP) → Auth (OAuth, JWT) → Firebase (Rules, Rate Limiting) |

### MEDIUM Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 6.3 | Missing Data Flow Architecture | Not shown | Add: User Actions → Processing → Cache (RQ + localStorage) → Persistence (Firestore + Storage) |
| 6.4 | Missing Prompt System | Not shown | Add V1→V2→V3 evolution with version selection logic |
| 6.5 | Missing SharedGroups (Epic 14c) | Not in Firebase section | Add sharedGroups and pendingInvitations collections |
| 6.6 | Missing sharedGroupService.ts | Not in services list | Add to services section |

### LOW Priority Fixes

| # | Issue | Current State | Fix Required |
|---|-------|---------------|--------------|
| 6.7 | File organization incomplete | Not detailed | Add src/ structure with counts: components/, contexts/, hooks/49, services/25, etc. |
| 6.8 | Bundle size warning not flagged | Shows 2.92 MB | Add note: "Needs optimization" |
| 6.9 | Missing Key Integration Points | Not shown | Add External Services connecting to Firebase services diagram |

### Visual Changes Required

```
ADD FIREBASE ARCHITECTURE:
┌─────────────────────────────────────────────────┐
│  FIREBASE ARCHITECTURE                          │
├─────────────────────────────────────────────────┤
│  Firestore Collections:                         │
│  ├── /artifacts/{appId}/users/{userId}/         │
│  │   ├── transactions/                          │
│  │   ├── categoryMappings/                      │
│  │   ├── merchantMappings/                      │
│  │   ├── groups/                                │
│  │   └── trustedMerchants/                      │
│  ├── /sharedGroups/{groupId}  (Epic 14c)        │
│  └── /pendingInvitations/{id} (Epic 14c)        │
│                                                 │
│  Cloud Functions:                               │
│  ├── analyzeReceipt (Gemini integration)        │
│  └── onTransactionDeleted (cascade delete)      │
└─────────────────────────────────────────────────┘

ADD SECURITY ARCHITECTURE:
┌─────────────────────────────────────────────────┐
│  SECURITY LAYERS                                │
├─────────────────────────────────────────────────┤
│  Client Security:                               │
│  ├── HTTPS Only                                 │
│  ├── Content Security Policy                    │
│  └── No secrets in code                         │
│                                                 │
│  Firebase Security:                             │
│  ├── Firestore Rules (user-scoped data)         │
│  ├── Storage Rules (user-scoped images)         │
│  └── Rate Limiting (Cloud Functions)            │
│                                                 │
│  Authentication:                                │
│  ├── Google OAuth 2.0                           │
│  └── Firebase JWT Tokens                        │
└─────────────────────────────────────────────────┘

ADD PROMPT SYSTEM:
┌─────────────────────────────────────────────────┐
│  PROMPT EVOLUTION                               │
├─────────────────────────────────────────────────┤
│  V1 → V2 → V3 (Current)                         │
│  │     │     └── Category standardization       │
│  │     └── Multi-currency, Receipt types        │
│  └── Original single currency                   │
│                                                 │
│  Selection: Production → V3 always              │
└─────────────────────────────────────────────────┘
```

---

## Implementation Order

### Phase 1: HIGH Priority Fixes (Critical)
1. **Scan State Machine** - Add Statement mode, CANCEL paths
2. **Transaction Lifecycle** - Add Cascade Delete, Error paths
3. **Analytics Workflow** - Add Component Architecture, Sankey modes
4. **Data Caching** - Add Query Keys, Mutation flow
5. **Filtering System** - Fix Temporal (6 levels), Category (5 levels)
6. **Tech Stack** - Add Firebase Architecture, Security Architecture

### Phase 2: MEDIUM Priority Fixes (Important)
- Quick Save paths
- Config completeness
- Missing function/action names
- Legacy vs Modern distinctions
- Data Flow Architecture

### Phase 3: LOW Priority Fixes (Polish)
- Footer updates
- Annotations and notes
- Color refinements
- File references

---

## Estimated Effort

| Diagram | HIGH | MEDIUM | LOW | Total Elements to Add/Modify |
|---------|------|--------|-----|------------------------------|
| Scan State Machine | 2 | 3 | 2 | ~15-20 elements |
| Transaction Lifecycle | 2 | 3 | 3 | ~15-20 elements |
| Analytics Workflow | 2 | 4 | 2 | ~20-25 elements |
| Data Caching | 2 | 3 | 2 | ~20-25 elements |
| Filtering System | 2 | 4 | 3 | ~15-20 elements |
| Tech Stack | 2 | 4 | 3 | ~25-30 elements |

**Total:** ~110-140 new Excalidraw elements across all diagrams

---

## Implementation Progress

**Status:** ✅ COMPLETE (6/6 diagrams completed)
**Last Updated:** 2026-01-15
**Scope:** ALL fixes (HIGH + MEDIUM + LOW)

| Diagram | Status | Date Completed | Notes |
|---------|--------|----------------|-------|
| Scan State Machine | ✅ DONE | 2026-01-15 | All 7 fixes applied: Statement mode, CANCEL paths, Quick Save, Dialog System, Persistence/Recovery, Credit lifecycle integration, footer update |
| Transaction Lifecycle | ✅ DONE | 2026-01-15 | All 8 fixes applied: Cascade Delete, Error paths, createdAt/updatedAt, Quick Save paths, Field Categories, footer update |
| Analytics Workflow | ✅ DONE | 2026-01-15 | All 8 fixes applied: Component Architecture hierarchy, Sankey modes (2/3/4 levels), Day format YYYY-MM-DD, computation functions, Day-level constraint, Reducer Actions, Treemap, colored Tendencia indicators |
| Data Caching | ✅ DONE | 2026-01-15 | All 7 fixes applied: Query Keys Structure hierarchy, Mutation/Optimistic Update flow, refetchOnReconnect config, Parallel subscribe annotation, App Lifecycle States, Key Files reference, Derived Data Caching |
| Filtering System | ✅ DONE | 2026-01-15 | All 9 fixes applied: 6-level temporal hierarchy, 5-level category hierarchy, Legacy/Modern priority, dateRange special case, Smart Label Detection, Location filter priority, Group dropdown UI, Default state annotation, 9 Reducer Actions |
| Tech Stack | ✅ DONE | 2026-01-15 | All 9 fixes applied: Firebase Architecture (collections + Cloud Functions), Security Architecture layers, Data Flow Architecture, Prompt System V1→V2→V3, SharedGroups (Epic 14c), sharedGroupService.ts, File organization with counts, Bundle size warning, Key Integration Points |

---

## Approval Checklist

- [x] Review and approve Scan State Machine fixes
- [x] Review and approve Transaction Lifecycle fixes
- [x] Review and approve Analytics Workflow fixes
- [x] Review and approve Data Caching fixes
- [x] Review and approve Filtering System fixes
- [x] Review and approve Tech Stack fixes
- [x] Confirm implementation order
- [x] Confirm scope (HIGH only, HIGH+MEDIUM, or ALL) → **ALL**

---

## Completion Summary

All 6 Excalidraw architecture diagrams have been updated with comprehensive fixes:

| Diagram | Fixes Applied |
|---------|---------------|
| scan-state-machine.excalidraw | 7 fixes |
| transaction-lifecycle.excalidraw | 8 fixes |
| analytics-workflow.excalidraw | 8 fixes |
| data-caching.excalidraw | 7 fixes |
| filtering-system.excalidraw | 9 fixes |
| tech-stack.excalidraw | 9 fixes |

**Total: 48 fixes applied across 6 diagrams**

---

*Document created from three-reviewer analysis session*
*Implementation complete - 6/6 diagrams completed on 2026-01-15*
