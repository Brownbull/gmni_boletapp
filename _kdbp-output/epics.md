# BoletApp Growth Phase Epics

**Generated:** 2026-03-06
**Source:** PRD (`_kdbp-output/planning-artifacts/prd.md`) + Architecture (`_kdbp-output/architecture.md`)
**Total:** 5 epics, 37 stories, ~148 points

---

## Epic 16: Scan Workflow & Staging Deployment

**User Outcome:** User can scan receipts reliably (no gallery bug), QA the app from any device via staging URL, and the codebase is unblocked for all future scan work.

**Intent Block:**
- **WHAT WE'RE DELIVERING:** The user gets a scan workflow that never traps them (gallery bug gone), and the team gets a staging URL for QA from any device.
- **THE ANALOGY:** A factory floor where machines were wired together with a single control panel (946 lines). We're giving each machine its own controller and connecting them with a clean signal bus -- so when one jams, the others keep running.
- **CONSTRAINT BOX:** IS: scan store split + gallery fix + staging hosting | IS NOT: new scan features (statement/batch improvements) | DECIDES: shared workflow store + event bus over monolithic store
- **ONE-LINE HANDLE:** "Untangle the wires, open the test door"
- **DONE WHEN:** (1) Gallery selection works after scan failure, (2) staging URL loads app with staging data, (3) no file over 800 lines in scan feature

**FRs:** FR-1.5, FR-8.8 | **NFRs:** NFR-4.2 | **ARs:** 4a, 4b, 5a

### Stories (9 stories, ~43 points)

| # | Title | Size | Pts | Depends On | File |
|---|-------|------|-----|-----------|------|
| 16-1 | Split useScanStore into Zustand slices | LARGE | 8 | -- | `epic16/stories/16-1-split-scan-store-slices.md` |
| 16-2 | Merge overlay state into Zustand | MEDIUM | 5 | 16-1 | `epic16/stories/16-2-merge-overlay-state.md` |
| 16-3 | Fix gallery selection bug | SMALL | 1 | 16-2 | `epic16/stories/16-3-fix-gallery-bug.md` |
| 16-4 | Move scanStateMachine.ts + extract shared types | MEDIUM | 3 | -- | `epic16/stories/16-4-move-scan-types.md` |
| 16-5 | Split TransactionEditorViewInternal.tsx | MEDIUM | 5 | -- | `epic16/stories/16-5-split-transaction-editor-view.md` |
| 16-6 | Extract shared scan workflow store | LARGE | 8 | 16-4, 16-5 | `epic16/stories/16-6-extract-shared-workflow-store.md` |
| 16-7 | Replace cross-feature writes with event bus (mitt) | MEDIUM | 5 | 16-6 | `epic16/stories/16-7-event-bus.md` |
| 16-8 | Move legacy scan components into feature | MEDIUM | 3 | -- | `epic16/stories/16-8-move-legacy-scan-components.md` |
| 16-9 | Staging web deployment | MEDIUM | 5 | -- | `epic16/stories/16-9-staging-deployment.md` |

**Dependency Chains:**
- Chain A: 16-1 -> 16-2 -> 16-3 (store split -> overlay merge -> bug fix)
- Chain B: 16-4, 16-5 -> 16-6 -> 16-7 (types + view split -> shared store -> events)
- Independent: 16-8, 16-9 (can run anytime)

**Hardening:** 0 separate stories. All hardening BUILT-IN (10 tasks across 7 stories). Multiplier: 1.10x.

---

## Epic 17: Category Taxonomy Rework

**User Outcome:** User sees clear, consistent Spanish labels at every classification level -- no confusing overlaps, no English leaking through.

**Intent Block:**
- **WHAT WE'RE DELIVERING:** Every label the user reads -- in analytics, in scan results, in editing -- speaks their language with zero ambiguity.
- **THE ANALOGY:** Relabeling every shelf and aisle sign in a warehouse -- the products don't move, but workers (and the AI that sorts incoming goods) can finally read the labels without a translation dictionary.
- **CONSTRAINT BOX:** IS: 4-level Spanish naming + batch migration + prompt update | IS NOT: new categories or taxonomy restructuring | DECIDES: one-time migration over permanent read-time normalization
- **ONE-LINE HANDLE:** "Name everything in the language the user thinks in"
- **DONE WHEN:** (1) All 4 classification levels show Spanish labels, (2) AI scan categorizes using new names, (3) zero overlap between category levels

**FRs:** FR-4.3, FR-4.4 | **NFRs:** NFR-6.4 | **ARs:** 1b

### Stories (5 stories, ~17 points)

| # | Title | Size | Pts | Depends On | File |
|---|-------|------|-----|-----------|------|
| 17-1 | Design 4-level Spanish taxonomy spec | SMALL | 2 | -- | `epic17/stories/17-1-design-taxonomy.md` |
| 17-2 | Update constants, types, translations, normalizer | MEDIUM | 3 | 17-1 | `epic17/stories/17-2-update-constants-types.md` |
| 17-3 | Update AI scan prompt for new taxonomy | SMALL | 2 | 17-1 | `epic17/stories/17-3-update-ai-prompt.md` |
| 17-4 | Update all UI labels and components | MEDIUM | 5 | 17-2 | `epic17/stories/17-4-update-ui-labels.md` |
| 17-5 | Batch migration of existing data | MEDIUM | 5 | 17-2 | `epic17/stories/17-5-batch-migration.md` |

**Dependency Chains:**
- Chain A: 17-1 -> 17-2 -> 17-4 (spec -> code -> UI)
- Chain B: 17-1 -> 17-3 (spec -> prompt)
- Chain C: 17-2 -> 17-5 (types -> migration)

**Hardening:** 0 separate stories. All hardening BUILT-IN (batch chunking at 500, normalizer backward compat). Multiplier: 1.05x.

---

## Epic 18: Credit Card Statement Scanning

**User Outcome:** User uploads a credit card statement (photo or PDF) and gets all transactions extracted in one go -- reviewed and saved in batch.

**Intent Block:**
- **WHAT WE'RE DELIVERING:** The user gets a second scanning "mode" -- instead of one receipt = one transaction, they get one statement = many transactions. Covers the other half of their financial life.
- **THE ANALOGY:** Adding a bulk loading dock to a warehouse that previously only had a single-item receiving window. Same warehouse, same shelving -- just a wider intake that unpacks boxes into individual items.
- **CONSTRAINT BOX:** IS: statement mode (image + PDF), multi-txn extraction, batch review | IS NOT: recurring import or bank API integration | DECIDES: Gemini PDF direct over Cloud Run pre-processing (fallback preserved)
- **ONE-LINE HANDLE:** "One statement in, many transactions out"
- **DONE WHEN:** (1) User scans a 5-page statement and sees extracted transactions, (2) batch review works for statement results, (3) < 15s end-to-end for 50-transaction statement

**FRs:** FR-1.6, FR-1.7 | **NFRs:** NFR-1.2, NFR-5.1 | **ARs:** 3a

### Stories (6 stories, ~23 points)

| # | Title | Size | Pts | Depends On | File |
|---|-------|------|-----|-----------|------|
| 18-1 | Statement scan spike (Gemini PDF feasibility) | SMALL | 2 | -- | `epic18/stories/18-1-statement-scan-spike.md` |
| 18-2 | Statement scan mode store | MEDIUM | 3 | -- | `epic18/stories/18-2-statement-scan-mode-store.md` |
| 18-3 | Statement analysis Cloud Function | MEDIUM | 5 | 18-1 | `epic18/stories/18-3-statement-cloud-function.md` |
| 18-4 | Statement capture UI | MEDIUM | 5 | 18-2, 18-3 | `epic18/stories/18-4-statement-capture-ui.md` |
| 18-5 | Statement batch review integration | MEDIUM | 5 | 18-4 | `epic18/stories/18-5-statement-batch-review.md` |
| 18-6 | Statement scanning E2E test | MEDIUM | 3 | 18-5 | `epic18/stories/18-6-statement-e2e.md` |

**Dependency Chains:**
- Chain A: 18-1 -> 18-3 -> 18-4 -> 18-5 -> 18-6 (spike -> CF -> UI -> review -> E2E)
- Independent: 18-2 (store scaffold, can start early)

**Hardening:** 0 separate stories. All hardening BUILT-IN (error states, E2E data-testid, PDF validation). Multiplier: 1.10x.

---

## Epic 19: Shared Groups

**User Outcome:** Households can create shared expense groups, post transactions as frozen snapshots, and see group-level spending analytics.

**Intent Block:**
- **WHAT WE'RE DELIVERING:** The user goes from "where does MY money go?" to "where does OUR money go?" -- shared visibility across a household without exposing personal data.
- **THE ANALOGY:** A shared bulletin board in the kitchen. Anyone can pin a copy of their receipt -- but their wallet stays private. The building manager (admin) can take pins down within 30 days. After that, the board is the historical record.
- **CONSTRAINT BOX:** IS: copy & bucket groups, 50 members, 5 admins, 30-day deletion window | IS NOT: real-time sync, approval workflows, or shared budgets | DECIDES: frozen copies over live-linked transactions
- **ONE-LINE HANDLE:** "Pin your receipts to the shared board"
- **DONE WHEN:** (1) 3+ users post transactions to a group and see group analytics, (2) admin deletes a < 30-day transaction, (3) 30+ day transactions are immutable

**FRs:** FR-7.1-FR-7.8 | **NFRs:** NFR-2.4 | **ARs:** 1a, 2a, 2b

### Stories (10 stories, ~42 points)

| # | Title | Size | Pts | Depends On | File |
|---|-------|------|-----|-----------|------|
| 19-1 | Group data model, types, and security rules | MEDIUM | 5 | -- | `epic19/stories/19-1-group-data-model.md` |
| 19-2 | Group CRUD Cloud Functions | MEDIUM | 5 | 19-1 | `epic19/stories/19-2-group-crud-cloud-functions.md` |
| 19-3 | Post transaction to group (copy & bucket) | MEDIUM | 3 | 19-1 | `epic19/stories/19-3-post-to-group.md` |
| 19-4 | Group admin deletion (30-day window) | SMALL-MEDIUM | 3 | 19-3 | `epic19/stories/19-4-group-admin-deletion.md` |
| 19-5 | Group list and detail UI | MEDIUM | 5 | 19-2 | `epic19/stories/19-5-group-list-ui.md` |
| 19-6 | Group transaction feed and post UI | MEDIUM | 5 | 19-3, 19-5 | `epic19/stories/19-6-group-transaction-feed.md` |
| 19-7 | Group invite links | MEDIUM | 5 | 19-2 | `epic19/stories/19-7-group-invite-links.md` |
| 19-8 | Group analytics (category, member, trend) | MEDIUM | 5 | 19-6 | `epic19/stories/19-8-group-analytics.md` |
| 19-9 | Group admin panel | MEDIUM | 3 | 19-2 | `epic19/stories/19-9-group-admin-panel.md` |
| 19-10 | Shared groups E2E test | MEDIUM | 3 | 19-6 | `epic19/stories/19-10-group-e2e.md` |

**Dependency Chains:**
- Chain A: 19-1 -> 19-2 -> 19-5 -> 19-6 -> 19-8 (model -> CRUD -> UI -> feed -> analytics)
- Chain B: 19-1 -> 19-3 -> 19-4 (model -> post -> delete)
- Chain C: 19-2 -> 19-7 (CRUD -> invites)
- Chain D: 19-2 -> 19-9 (CRUD -> admin panel)
- E2E: 19-10 depends on 19-6 (needs working feed)

**Hardening:** 0 separate stories. All hardening BUILT-IN (TOCTOU in transactions, batch chunking, input sanitization, E2E data-testid). Multiplier: 1.15x.

---

## Epic 20: Subscription & Monetization

**User Outcome:** Users subscribe to unlock premium features (exports, groups, statement scanning), and new users join via invite links with controlled rollout.

**Intent Block:**
- **WHAT WE'RE DELIVERING:** The user gets a path to paid features, and the product gets a path to revenue. Controlled growth via invite-only registration.
- **THE ANALOGY:** Adding a ticket booth and VIP wristbands to a previously open venue. Everyone still gets in through the front door (invite), but some rooms (exports, groups, statements) check your wristband.
- **CONSTRAINT BOX:** IS: free/pro/max tiers, Mercado Pago, invite-link registration, feature gating | IS NOT: multiple payment providers or enterprise billing | DECIDES: server-side verification over client-only gating
- **ONE-LINE HANDLE:** "Tickets at the door, wristbands inside"
- **DONE WHEN:** (1) New user redeems invite link and registers, (2) existing user subscribes via Mercado Pago, (3) non-paying user is blocked from premium features

**FRs:** FR-8.3, FR-8.4, FR-8.5 | **NFRs:** NFR-2.9, NFR-5.3 | **ARs:** 1c, 3b

### Stories (7 stories, ~28 points)

| # | Title | Size | Pts | Depends On | File |
|---|-------|------|-----|-----------|------|
| 20-1 | Subscription data model and tier config | SMALL | 2 | -- | `epic20/stories/20-1-subscription-data-model.md` |
| 20-2 | Subscription store and client-side feature gating | MEDIUM | 5 | 20-1 | `epic20/stories/20-2-subscription-store-gating.md` |
| 20-3 | Mercado Pago payment webhook | MEDIUM | 5 | 20-1 | `epic20/stories/20-3-mercadopago-webhook.md` |
| 20-4 | Subscription checkout and upgrade UI | MEDIUM | 5 | 20-2, 20-3 | `epic20/stories/20-4-subscription-checkout-ui.md` |
| 20-5 | Invite-link registration system | MEDIUM | 5 | -- | `epic20/stories/20-5-invite-link-registration.md` |
| 20-6 | Server-side tier verification | SMALL-MEDIUM | 3 | 20-1 | `epic20/stories/20-6-server-tier-verification.md` |
| 20-7 | Subscription and monetization E2E test | SMALL-MEDIUM | 3 | 20-4, 20-5, 20-6 | `epic20/stories/20-7-subscription-e2e.md` |

**Dependency Chains:**
- Chain A: 20-1 -> 20-2 -> 20-4 (model -> store/gating -> checkout UI)
- Chain B: 20-1 -> 20-3 -> 20-4 (model -> webhook -> checkout UI)
- Chain C: 20-1 -> 20-6 (model -> server verification)
- Independent: 20-5 (invite system, no subscription dependency)
- E2E: 20-7 depends on 20-4, 20-5, 20-6 (needs all features working)

**Hardening:** 0 separate stories. All hardening BUILT-IN (TOCTOU in invites, input sanitization in webhooks/checkout, signature validation, E2E data-testid). Multiplier: 1.15x.

---

## Build Order

```
Epic 16 (Scan + Staging) --> Epic 18 (Statement Scanning)
       |                           ^ uses scan workflow store + batch review
       |
       +--> Epic 17 (Taxonomy)     [independent, but better after staging exists for QA]
       |
       +--> Epic 19 (Groups) --> Epic 20 (Subscriptions)
                                      ^ groups gated by tier
```

Recommended: 16 -> 17 (parallel-safe with 18) -> 18 -> 19 -> 20

## FR Coverage Map

| FR | Epic | Status |
|----|------|--------|
| FR-1.1-1.4 | -- | Delivered |
| FR-1.5 | Epic 16 (16-2, 16-3) | Growth |
| FR-1.6 | Epic 18 (18-3, 18-4) | Growth |
| FR-1.7 | Epic 18 (18-5) | Growth |
| FR-1.8-1.9 | -- | Delivered |
| FR-2.1-2.6 | -- | Delivered |
| FR-3.1-3.5 | -- | Delivered |
| FR-4.1-4.2 | -- | Delivered |
| FR-4.3 | Epic 17 (17-1, 17-2, 17-4) | Growth |
| FR-4.4 | Epic 17 (17-3) | Prompt update |
| FR-5.1-5.5 | -- | Delivered |
| FR-6.1-6.3 | -- | Delivered |
| FR-6.4 | -- | Partial (not scoped) |
| FR-6.5-6.6 | -- | Vision (deferred) |
| FR-7.1-7.2 | Epic 19 (19-1, 19-2) | Growth |
| FR-7.3 | Epic 19 (19-3) | Growth |
| FR-7.4-7.5 | Epic 19 (19-4) | Growth |
| FR-7.6 | Epic 19 (19-2) | Growth |
| FR-7.7 | Epic 19 (19-8) | Growth |
| FR-7.8 | Epic 19 (19-3, architecture) | Growth |
| FR-8.1-8.2 | -- | Delivered |
| FR-8.3 | Epic 20 (20-5) | Growth |
| FR-8.4 | Epic 20 (20-3, 20-4) | Growth |
| FR-8.5 | Epic 20 (20-2, 20-6) | Growth |
| FR-8.6-8.7 | -- | Delivered |
| FR-8.8 | Epic 16 (16-9) | Growth |
| FR-8.9 | -- | Vision (deferred) |
