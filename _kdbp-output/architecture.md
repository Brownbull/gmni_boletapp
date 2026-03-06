---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7]
lastStep: 7
status: 'complete'
completedAt: '2026-03-05'
inputDocuments:
  - _kdbp-output/planning-artifacts/prd.md
  - docs/architecture/architecture.md
  - docs/architecture/project-overview.md
  - docs/architecture/data-models.md
  - docs/architecture/state-management.md
  - docs/architecture/firestore-patterns.md
  - docs/architecture/component-patterns.md
  - docs/architecture/cloud-functions.md
  - docs/architecture/api-contracts.md
  - docs/architecture/react-query-caching.md
  - docs/architecture/proposals/SCAN-WORKFLOW-RESTRUCTURING-PROPOSAL.md
workflowType: 'architecture'
project_name: 'BoletApp'
user_name: 'Gabe'
date: '2026-03-05'
---

# Architecture Decision Document — BoletApp

_Single source of truth for AI agent implementation. Every developer and AI agent should read this before writing code for growth-phase features._

## Project Context Analysis

**Requirements:** 47 FRs | 28 NFRs | 6 technical constraints
**Scale:** Medium-High
**Domain:** Personal Finance / Fintech-lite (expense tracking & awareness, not money movement)
**Context:** Brownfield — production app, ~610 modules, Feature-Sliced Design architecture

### Functional Requirements (47 FRs across 8 areas)

| Area | Count | Status Summary |
|------|-------|----------------|
| Receipt Capture & Processing | 9 | 5 delivered, 1 needs verification, 3 growth |
| Transaction Management | 6 | All delivered |
| Smart Data Learning | 5 | All delivered |
| Category Taxonomy | 4 | 3 delivered, 1 growth (Spanish naming) |
| Spending Analytics | 5 | All delivered |
| Insight Engine | 6 | 3 delivered, 1 partial, 2 vision |
| Shared Groups | 8 | All growth (copy & bucket model) |
| User Management & Platform | 9 | 4 delivered, 3 growth, 1 vision |

### Non-Functional Requirements (28 NFRs across 6 areas)

- **Performance (7):** <8s receipt scan, <15s statement scan, <2s app load, <500ms analytics transitions
- **Security (9):** User data isolation, TLS, TOCTOU prevention, input sanitization, server-side tier verification
- **Accessibility (5):** WCAG 2.1 AA target (not yet audited)
- **Reliability (5):** Offline browsing, atomic saves, clean scan failure recovery
- **Integration (5):** Graceful degradation for Gemini/payment provider outages, timeout limits
- **Internationalization (4):** Spanish primary, CLP/USD, locale-aware formatting

### Technical Constraints

1. **Brownfield codebase:** 610+ modules, Feature-Sliced Design, zero circular dependencies — must preserve
2. **Solo developer:** Aggressive automation, strict story sizing (8 tasks max), no over-engineering
3. **Firebase ecosystem:** Auth, Firestore, Storage, Hosting, Functions — multi-tenancy within Firestore rules
4. **AI dependency (Gemini):** Receipt + statement scanning pipeline, credit system for throttling
5. **Scan store blocker:** `useScanStore.ts` at 946 lines — exceeds 800-line hook, must split first
6. **PDF parsing uncertainty:** Statement scanning may need Cloud Run for PDF-to-image conversion

### Key Cross-Cutting Concerns

- **Multi-tenancy:** Personal data isolation + group-scoped access (two distinct Firestore rule sets)
- **Subscription gating:** Server-side tier verification, client-side feature gating backed by server
- **AI pipeline:** Receipt + statement scanning, Cloud Function pipeline, potential Cloud Run expansion
- **Category taxonomy:** 4-level hierarchy, Spanish naming, cross-cutting migration (AI prompts, UI, analytics, stored data)
- **Offline capability:** PWA service worker + Firestore offline persistence
- **i18n:** Spanish primary, English secondary, CLP integer math

## Starter Template Evaluation (Brownfield)

**Primary Technology Domain:** Web App (PWA)

### Existing Stack (locked in — production deployed)

| Category | Choice | Version | Status |
|----------|--------|---------|--------|
| Language | TypeScript | 5.3.3 | Locked |
| Frontend | React | 18.3.1 | Locked |
| Build | Vite | 5.4.0 | Locked |
| Styling | Tailwind CSS | 3.x (CDN) | Locked |
| Client State | Zustand | 5.x | Locked |
| Server State | TanStack Query | Latest | Locked |
| Icons | Lucide React | 0.460.0 | Locked |
| Charts | Custom SVG | N/A | Locked |
| Auth | Firebase Auth (Google OAuth) | 10.14.1 | Locked |
| Database | Firestore | 10.14.1 | Locked |
| Storage | Firebase Storage | 10.14.1 | Locked |
| Hosting | Firebase Hosting | N/A | Locked |
| Functions | Firebase Cloud Functions | N/A | Locked |
| AI | Google Gemini | 2.5 Flash | Locked |
| Testing | Vitest + RTL + Playwright (E2E) | Latest | Locked |
| Architecture | Feature-Sliced Design | N/A | Locked |

### Growth-Phase Technology Decisions (open)

| Decision | Options | When Needed |
|----------|---------|-------------|
| PDF parsing | Gemini direct vs. Cloud Run pre-processing | Growth #3 (statement scanning) |
| Payment provider | Mercado Pago, Flow, dLocalGo — evaluate at Growth #5 | Growth #5 (subscriptions) |
| Group data model | Subcollection vs. top-level collection | Growth #4 (shared groups) |
| Staging hosting | Firebase preview channels vs. dedicated project | Growth #1 |

**Note:** Payment provider is an open decision. Three candidates identified: Mercado Pago (market incumbent), Flow (Chilean-focused), and dLocalGo (https://dlocalgo.com/ — Latin American cross-border). Evaluation deferred to Growth #5 when subscription architecture is designed.

## Core Architectural Decisions

### Decision Priority Analysis

| Priority | Decision | Blocks |
|----------|----------|--------|
| Critical | Scan store decomposition (4a) | Growth #1 (all scan work) |
| Critical | Cross-feature communication (4b) | Growth #1 (cycle breaking) |
| Critical | Group data model (1a) | Growth #4 (shared groups) |
| Critical | Group authorization (2a) | Growth #4 (security rules) |
| Important | Category taxonomy migration (1b) | Growth #2 (data migration) |
| Important | Statement scanning pipeline (3a) | Growth #3 |
| Important | Staging deployment (5a) | Growth #1 (QA infrastructure) |
| Deferrable | Subscription data model (1c) | Growth #5 |
| Deferrable | Invite link mechanism (2b) | Growth #5 |
| Deferrable | Payment webhook (3b) | Growth #5 |
| Deferrable | Monitoring (5b) | Post-Growth |

### 1. Data Architecture

#### Decision 1a: Group Data Model — Subcollection with "Copy & Bucket" Model

**Decision:** Firestore subcollection. Group transactions are **frozen copies** — no approval workflow.

**IMPORTANT — PRD Revision:** The shared group model is NOT "post and approve" as originally described in the PRD. It is a **"copy and bucket"** model:

- Any member posts a transaction to the group — it appears **immediately** (no approval queue)
- The transaction is **copied** (snapshot) at post time — a frozen duplicate lives in the group bucket
- The personal copy remains fully editable/deletable by the user — changes do NOT propagate to the group copy
- Admin can **delete** group transactions that are **less than 30 days old**
- After 30 days, group transactions are **immutable** — no one can modify or delete them
- Group must always have at least 1 admin. Admin leaving must assign another admin first.
- Last member (who is also the only admin) leaving = group is deleted

**Data model:**

```
/artifacts/{appId}/groups/{groupId}
  ├── (group doc)
  │     name: string
  │     admins: string[]          // userId array, 1-5 admins
  │     members: string[]         // userId array, up to 50
  │     createdAt: Timestamp
  │     createdBy: string         // userId of creator (first admin)
  │
  └── /transactions/{txnId}
        merchant: string
        date: string              // YYYY-MM-DD
        total: number
        items: TransactionItem[]
        currency: string
        category: string
        postedBy: string          // userId who posted
        postedAt: Timestamp       // 30-day deletion clock starts here
        sourceTransactionId: string // reference to original (informational, no live link)
```

**Firestore security rules:**
- **Create:** `auth.uid` in `group.members[]`
- **Read:** `auth.uid` in `group.members[]`
- **Delete:** `auth.uid` in `group.admins[]` AND `postedAt > now - 30 days`
- **Update:** DENIED — group transactions are frozen copies, never modified

**Rationale:** Simpler than approval model. No pending/rejected states, no approval queue, no status field. The 30-day deletion window gives admins a correction period while ensuring long-term data integrity. Learned from Epic 14c failure — simplicity over real-time sync complexity.

#### Decision 1b: Category Taxonomy Migration — Full Batch Migration

**Decision:** Full batch migration via Cloud Function. No dual data coexistence.

- Cloud Function reads all user transactions, rewrites category fields to new Spanish naming standard
- Read-time normalizer runs as temporary safety net during migration window
- After migration completes and is verified, remove old normalizer entries
- Same pattern as Epic 14d-v2 `periods` field migration (proven approach)

**Rationale:** Clean data is better than permanent normalization overhead. One-time migration cost vs. forever-growing normalizer.

#### Decision 1c: Subscription Tier Data Model — Separate Collection

**Decision:** Dedicated subscription document per user.

```
/artifacts/{appId}/users/{userId}/subscription
  tier: 'free' | 'pro' | 'max'
  tierExpiry: Timestamp | null
  paymentProvider: string        // 'mercadopago' | 'flow' | 'dlocalgo'
  externalSubscriptionId: string // provider's subscription ID
  updatedAt: Timestamp
```

**Rationale:** Payment state is security-critical (NFR-2.9). Separate collection keeps payment webhook writes isolated from profile data. TanStack Query caches it — extra read is negligible.

### 2. Authentication & Security

#### Decision 2a: Group Authorization Model — Three-Layer

**Decision:**
- **Firestore Security Rules** (primary): `auth.uid` membership checks for reads/writes, admin checks for deletions, timestamp check for 30-day window
- **Cloud Functions** (secondary): Membership changes (add/remove members), admin transfer enforcement (must have 1+ admin), group deletion cascade, invite code redemption
- **Client-side** (UX only): Show/hide admin actions based on cached role — never trusted for security

**Rationale:** Matches existing security pattern. Firestore rules are the authoritative layer. Cloud Functions handle complex multi-step operations that can't be expressed in rules alone.

#### Decision 2b: Invite Link Mechanism — Custom Codes in Firestore

**Decision:** Short invite codes stored in Firestore.

```
/artifacts/{appId}/invites/{code}
  groupId: string | null          // null = app-level invite (registration)
  createdBy: string               // userId
  expiresAt: Timestamp
  usesRemaining: number
  type: 'group' | 'registration'
```

Cloud Function validates on redemption: check expiry, decrement uses, add member to group.

**Rationale:** Simplest approach, no external dependencies, full control over caps and expiration. Firebase Dynamic Links deprecated.

### 3. API & Communication

#### Decision 3a: Statement Scanning Pipeline — Gemini PDF Direct

**Decision:** Send PDF directly to Gemini API (supports PDF input natively since 2025). Only build Cloud Run pre-processing if spike reveals Gemini can't handle Chilean bank PDF formats reliably.

**Rationale:** "Boring technology" principle — don't add infrastructure until proven necessary. Typical statement is 1-5 pages, well within Gemini token limits. Cloud Run remains a fallback option.

#### Decision 3b: Payment Webhook — Cloud Function HTTP Trigger

**Decision:** Cloud Function HTTP trigger (not callable). Payment provider POSTs to webhook URL, Cloud Function validates signature, updates subscription doc.

**Rationale:** Keeps everything in Firebase. No new infrastructure. Standard webhook pattern used across all three payment provider candidates.

### 4. Frontend Architecture

#### Decision 4a: Scan Store Decomposition — Shared Workflow Store + Separate Mode Stores

**Decision:** Central workflow store for mode/phase/mutual exclusion + separate stores per scan mode.

**Scan mode requirements:**
- Three modes: normal (1 image), batch (up to 10 images), statement (up to 5 images)
- One FAB button — icon changes based on active scan mode
- Scan persists across navigation (FAB stays in active-mode icon)
- **Mutual exclusion:** cannot start a new scan while one is active
- Cancel or finish = only way to return to idle state

**Store architecture:**

```typescript
// The "brain" — owns phase, mode, mutual exclusion
// Location: src/shared/stores/useScanWorkflowStore.ts
useScanWorkflowStore = {
  mode: null | 'normal' | 'batch' | 'statement',
  phase: 'idle' | 'capturing' | 'processing' | 'reviewing',
  isActive: boolean,
  startScan: (mode) => boolean,  // atomic check-and-set, returns success
  cancelScan: () => void,        // resets to idle
  finishScan: () => void,        // resets to idle
}

// Mode-specific stores — handle their own processing logic
// Location: src/features/scan/stores/
useNormalScanStore    // 1 image capture + processing
useBatchScanStore     // up to 10 images, queue management
useStatementScanStore // up to 5 images or PDF, multi-transaction extraction
```

**State machine:**
```
IDLE → startScan('normal')    → CAPTURING → PROCESSING → REVIEWING → finishScan() → IDLE
IDLE → startScan('batch')     → CAPTURING → PROCESSING → REVIEWING → finishScan() → IDLE
IDLE → startScan('statement') → CAPTURING → PROCESSING → REVIEWING → finishScan() → IDLE
     → cancelScan() from any active phase → IDLE
```

**Rationale:** Mutual exclusion is explicit and centralized in the workflow store. FAB reads one store (`mode` + `isActive`). Mode stores are small and independently testable. Adding a 4th scan mode = add one store, register with workflow. Avoids the 800-line problem by keeping each store focused.

#### Decision 4b: Cross-Feature Communication — Shared Store + Event Bus

**Decision:** Hybrid approach.

- **Shared workflow store** (`src/shared/stores/useScanWorkflowStore.ts`): State that multiple features read (mode, phase, isActive)
- **Event bus** (lightweight, e.g., `mitt`): One-way notifications for cross-feature handoffs:
  - `scan:completed` → batch review picks up results
  - `review:saved` → transaction editor receives new transaction IDs
  - `scan:cancelled` → cleanup across features

**Rationale:** Explicit state for the important stuff (mode, phase), loose coupling for notifications. No circular imports — features subscribe to events, don't import each other's stores. The workflow store lives in `src/shared/`, mode stores in `src/features/scan/`.

### 5. Infrastructure & Deployment

#### Decision 5a: Staging Web Deployment — Dedicated Site in Staging Project

**Decision:** Add Firebase Hosting to the existing staging Firebase project. Persistent staging URL. Auth lockdown via Firestore security rules (whitelist of test email addresses, block new registration).

**Rationale:** Staging backend already exists (`npm run dev:staging`). Just need frontend hosting in the same project. Stable URL for QA from any device.

#### Decision 5b: Monitoring & Observability — Deferred

**Decision:** Defer. Firebase console + GitHub Actions CI sufficient at current scale. Re-evaluate when external users exist.

### Decision Impact Analysis

| Decision | Impacts | Reversibility |
|----------|---------|---------------|
| Group subcollection + copy & bucket | Security rules, group deletion, all group queries, no approval workflow | Low (data model change is expensive) |
| Category batch migration | All stored data, normalizer, AI prompts, analytics | Medium (can fall back to read-time normalization) |
| Subscription separate collection | Payment webhooks, feature gating, security rules | Medium (can merge into user doc later) |
| Gemini PDF direct | Statement scanning pipeline, Cloud Function code | High (easy to add Cloud Run later) |
| Shared workflow store + mode stores | All scan features, FAB behavior, test structure | Medium (refactor, not rewrite) |
| Shared store + event bus | Feature boundaries, import graph, cycle breaking | Medium (can swap event implementation) |
| Staging dedicated site | CI/CD pipeline, E2E test config | High (easy to change) |

## Implementation Patterns & Consistency Rules

_Adversarial review applied: 10 issues identified and fixed before finalization._

### 1. Naming Conventions

**Pattern: Firestore Collection Names**
**Rule:** Lowercase singular nouns for collections, camelCase for document fields.

```
CORRECT:
/artifacts/{appId}/groups/{groupId}/transactions/{txnId}
/artifacts/{appId}/users/{userId}/subscription
/artifacts/{appId}/invites/{code}
Fields: postedBy, postedAt, sourceTransactionId, expiresAt, usesRemaining

INCORRECT:
/artifacts/{appId}/shared-groups/{groupId}/group_transactions/{txnId}
/artifacts/{appId}/users/{userId}/Subscriptions/{subId}
Fields: posted_by, PostedAt, source_transaction_id
```

**Pattern: Zustand Store Names**
**Rule:** `use[Domain][Scope]Store` — domain is the feature, scope is the concern.

```
CORRECT:
useScanWorkflowStore     // src/shared/stores/
useNormalScanStore       // src/features/scan/stores/
useBatchScanStore        // src/features/scan/stores/
useStatementScanStore    // src/features/scan/stores/

INCORRECT:
useScanStore             // too broad (the 946-line problem)
useWorkflowStore         // too generic (which workflow?)
useScanningStore         // gerund form
```

**Pattern: Event Bus Event Names + Type Safety**
**Rule:** `feature:action` format, lowercase, colon-separated. Past tense for completed events. All events MUST be defined in a typed event map.

```typescript
// CORRECT — typed event map (src/shared/events/eventTypes.ts)
type AppEvents = {
  'scan:completed': { transactionIds: string[] }
  'scan:cancelled': { mode: ScanMode }
  'review:saved': { transactionIds: string[] }
  'group:transaction-posted': { groupId: string; txnId: string }
}
// Compiler catches typos: emitter.emit('scan:complete', ...) // ERROR

// INCORRECT:
emitter.emit('SCAN_COMPLETE', data)          // screaming snake, not in type map
emitter.emit('onScanDone', data)             // handler-style naming
emitter.emit('scanCompleted', data)          // camelCase, not feature:action
```

**Pattern: Scan Mode Type Literals**
**Rule:** Lowercase string literals.

```typescript
type ScanMode = 'normal' | 'batch' | 'statement'
type ScanPhase = 'idle' | 'capturing' | 'processing' | 'reviewing'
```

### 2. Structural Conventions

**Pattern: Feature Module Location**
**Rule:** New features follow Feature-Sliced Design. Shared stores in `src/shared/stores/`.

```
CORRECT:
src/features/scan/stores/useNormalScanStore.ts
src/features/groups/stores/useGroupStore.ts
src/features/subscription/stores/useSubscriptionStore.ts
src/shared/stores/useScanWorkflowStore.ts
src/shared/events/eventBus.ts
src/shared/events/eventTypes.ts

INCORRECT:
src/stores/useScanWorkflowStore.ts        // not in shared/
src/features/scan/useScanWorkflowStore.ts  // workflow store is shared
src/utils/events.ts                        // too generic
```

**Pattern: Group Feature Boundaries**
**Rule:** Group transactions are a concern of `src/features/groups/`, NOT the transaction feature. Entity layer provides types only.

```
CORRECT:
src/features/groups/handlers/useGroupTransactions.ts
src/entities/transaction/types.ts  // GroupTransaction type here

INCORRECT:
src/features/transaction-editor/handlers/useGroupPost.ts  // wrong feature
```

**Pattern: Test File Location**
**Rule:** Unit tests in `tests/unit/` mirroring `src/`. Integration in `tests/integration/`. E2E in `tests/e2e/`.

### 3. Format Conventions

**Pattern: Group Transaction Copy Structure**
**Rule:** Copy specific fields, deep clone items. No extra fields.

```typescript
// CORRECT — frozen snapshot, items deep-cloned
const groupTransaction = {
  merchant: sourceTxn.merchant,
  date: sourceTxn.date,
  total: sourceTxn.total,
  items: structuredClone(sourceTxn.items),  // deep copy
  currency: sourceTxn.currency,
  category: sourceTxn.category,
  postedBy: currentUser.uid,
  postedAt: serverTimestamp(),
  sourceTransactionId: sourceTxn.id,
}

// INCORRECT — do NOT include:
// ...sourceTxn (never spread full source)
// alias (personal), imageUrls (user-scoped paths), periods (computed)
// items: sourceTxn.items (reference, not deep copy)
```

**Pattern: API Error Response Structure**
**Rule:** Consistent error shape for all Cloud Functions.

```typescript
{ success: false, error: { code: 'GROUP_MEMBER_LIMIT', message: '...' } }
{ success: true, data: { groupId, transactionId } }
```

**Pattern: Cloud Function Error Handling (Client Side)**
**Rule:** Show error toast. No automatic retry. Never silently fail.

**Pattern: Date and Timestamp Handling**
**Rule:** 30-day deletion window uses `postedAt` Timestamp, NOT `date` string.

### 4. Communication Patterns

**Pattern: Scan Workflow — Atomic Mutual Exclusion**
**Rule:** `startScan` is a single atomic check-and-set returning boolean success.

```typescript
// CORRECT
startScan: (mode: ScanMode) => {
  const state = get()
  if (state.isActive) return false
  set({ mode, phase: 'capturing', isActive: true })
  return true
},

// INCORRECT — separate check then set (race window)
if (store.canStart()) { store.startScan('normal') }
```

**Note:** Read-only `canStart` may exist for UI disabling only. Not used for guarding `startScan`.

**Pattern: Event Bus Usage**
**Rule:** Fire-and-forget notifications. IDs only, never full objects. Subscriptions MUST return cleanup.

```typescript
// CORRECT
useEffect(() => {
  const unsub = scanEvents.on('scan:completed', handleScanComplete)
  return () => unsub()
}, [])

// INCORRECT — no cleanup (leaks on unmount)
useEffect(() => { scanEvents.on('scan:completed', handler) }, [])
```

**Pattern: Subscription Tier Gating**
**Rule:** Client checks for UX, server verifies before execution. Subscription uses `onSnapshot` for real-time updates.

**Pattern: Group Operations — Read vs Write Routing**
**Rule:** Reads direct to Firestore (security rules). Writes through Cloud Functions.

```
READS (direct Firestore):
  - List group transactions → onSnapshot
  - Get group details → getDoc

WRITES (Cloud Functions):
  - postToGroup, deleteGroupTransaction, manageGroupMember
  - transferGroupAdmin, deleteGroup
```

### 5. Process Patterns

**Pattern: Group Transaction Posting**
**Rule:** Single Cloud Function call — reads source, validates, deep clones, writes atomically.

**Pattern: Group Admin Role Enforcement**
**Rule:** Cloud Function validates 1+ admin remains. Last admin+member leaving = delete group. Group deletion batches subcollection deletes at 500.

**Pattern: Scan Mode Mutual Exclusion**
**Rule:** FAB driven by `useScanWorkflowStore`. Active = show mode icon + navigate. Idle = show camera icon + open selector.

**Pattern: Category Migration Safety**
**Rule:** Idempotent Cloud Function. Check before migrate. Batch at 500.

**Pattern: Group Analytics**
**Rule:** Client-side computation from group transaction list. Same approach as personal analytics. No server-side aggregation needed at 50-member scale.

### 6. Accepted Risks

| Risk | Severity | Rationale |
|------|----------|-----------|
| `sourceTransactionId` exposes personal txn ID to group members | Low | Firestore rules block access to the document. ID alone reveals nothing at trusted group scale. |

### Enforcement Guidelines

| Pattern | Enforced By | When |
|---------|-------------|------|
| File size (<800 lines) | Pre-edit hook | Every edit |
| No console.log / `: any` | Pre-edit hook | Every edit |
| Feature boundaries + naming | Code review (ECC) | Every story |
| Typed event map | TypeScript compiler | Build time |
| Event bus cleanup | Code review (ECC) | Growth #1+ |
| Scan mutual exclusion | Unit tests | Growth #1 |
| Group security rules | Firestore rules tests | Growth #4 |
| Group batch deletion (500) | Integration tests | Growth #4 |
| Subscription server-side check | Integration tests | Growth #5 |
| Subscription real-time listener | Integration tests | Growth #5 |

## Project Structure & Boundaries

### Growth Feature Directory Map

```
src/
├── shared/
│   ├── stores/
│   │   ├── useScanWorkflowStore.ts       ← NEW: mode/phase/mutual exclusion
│   │   └── (existing stores...)
│   ├── events/
│   │   ├── eventBus.ts                   ← NEW: mitt instance, typed emitter
│   │   └── eventTypes.ts                 ← NEW: AppEvents type map
│   └── (existing shared/...)
│
├── features/
│   ├── scan/                             ← EXISTS: restructured internals
│   │   ├── stores/
│   │   │   ├── useNormalScanStore.ts      ← NEW
│   │   │   ├── useBatchScanStore.ts       ← NEW
│   │   │   └── useStatementScanStore.ts   ← NEW (Growth #3)
│   │   ├── components/
│   │   │   ├── ScanFAB.tsx               ← NEW: mode-aware FAB
│   │   │   ├── ModeSelectorSheet.tsx     ← NEW
│   │   │   └── (existing scan components moved here)
│   │   └── index.ts
│   │
│   ├── groups/                           ← NEW (Growth #4)
│   │   ├── stores/useGroupStore.ts
│   │   ├── handlers/
│   │   │   ├── useGroupTransactions.ts
│   │   │   └── useGroupAdmin.ts
│   │   ├── components/
│   │   │   ├── GroupList.tsx
│   │   │   ├── GroupDetail.tsx
│   │   │   ├── GroupTransactionFeed.tsx
│   │   │   └── GroupAdminPanel.tsx
│   │   └── index.ts
│   │
│   ├── subscription/                     ← NEW (Growth #5)
│   │   ├── stores/useSubscriptionStore.ts
│   │   ├── handlers/useSubscriptionGating.ts
│   │   ├── components/
│   │   │   ├── SubscriptionBanner.tsx
│   │   │   └── UpgradePrompt.tsx
│   │   └── index.ts
│   │
│   └── (existing features unchanged...)
│
├── entities/transaction/
│   └── types.ts                          ← MODIFIED: add GroupTransaction type
│
functions/src/
├── (existing functions...)
├── postToGroup.ts                        ← NEW (Growth #4)
├── deleteGroupTransaction.ts             ← NEW (Growth #4)
├── manageGroupMember.ts                  ← NEW (Growth #4)
├── transferGroupAdmin.ts                 ← NEW (Growth #4)
├── deleteGroup.ts                        ← NEW (Growth #4)
├── redeemInvite.ts                       ← NEW (Growth #5)
├── paymentWebhook.ts                     ← NEW (Growth #5)
└── migrateCategories.ts                  ← NEW (Growth #2, one-time)
```

### Architectural Boundaries

**Feature Isolation:**
```
src/features/X/ → imports from: src/shared/, src/entities/
NEVER: feature → feature (cross-feature imports)
Cross-feature: event bus (src/shared/events/) ONLY
```

**Data Ownership:**
```
Personal transactions  → src/features/transaction-editor/
Group transactions     → src/features/groups/
Scan workflow state    → src/shared/stores/useScanWorkflowStore.ts
Scan mode state        → src/features/scan/stores/use[Mode]ScanStore.ts
Subscription state     → src/features/subscription/
Event types            → src/shared/events/eventTypes.ts
```

**Client ↔ Server Split:**
```
Client (Firestore direct): reads (transactions, groups, subscription)
Server (Cloud Functions):  group writes, invites, payments, scanning, migration
```

**Firestore Security Rule Scopes:**
```
Personal:  /artifacts/{appId}/users/{userId}/**   → auth.uid == userId
Group:     /artifacts/{appId}/groups/{groupId}/**  → auth.uid in group.members[]
Invite:    /artifacts/{appId}/invites/{code}       → read: authenticated; write: CF only
```

## Validation Results

| Check | Status |
|-------|--------|
| **Coherence** | PASS — no contradictions between decisions, patterns, or structure |
| **Requirements** | 44/47 FRs covered, 25/28 NFRs covered (3 Vision FRs + WCAG audit deferred by design) |
| **Readiness** | PASS — all growth-phase decisions, paths, and patterns specified |

### Gaps

| Gap | Severity | Resolution |
|-----|----------|------------|
| PRD says "post and approve" but architecture says "copy & bucket" | Critical | Update PRD FR-7.x before epic creation |
| WCAG 2.1 AA — no audit plan for new components | Important | Add accessibility checklist to code review. Defer full audit post-Growth. |
| Vision features (FR-6.5, FR-6.6) have no architecture | Deferrable | By design — defined when those epics are scoped |
