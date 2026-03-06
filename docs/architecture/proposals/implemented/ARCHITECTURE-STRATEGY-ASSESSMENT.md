# Architecture Strategy Assessment: Should BoletApp Migrate?

> **Date:** 2026-02-07
> **Status:** PROPOSAL - Decision pending
> **Scope:** Full platform architecture evaluation

---

## The Question

BoletApp started as a "scan, categorize, save" expense tracker. It has grown into a financial awareness platform with AI receipt scanning, real-time shared group expense tracking, multi-level analytics with Sankey/treemap/donut visualizations, insight generation, batch processing, and a celebration system. The codebase is 138K lines of TypeScript + 65K lines of tests.

**Should we stay with React SPA + Firebase, or migrate to a different architecture?**

---

## Current Architecture Snapshot

```
React 18 SPA (Vite 5.4)  →  Firebase Hosting (static)
├── Zustand (client state)     ├── Firestore (NoSQL database)
├── TanStack Query (cache)     ├── Firebase Auth (Google OAuth)
├── ECharts (visualizations)   ├── Cloud Storage (receipt images)
└── PWA (service worker)       ├── Cloud Functions (8 functions, Node 20)
                               └── Gemini 2.0 Flash (AI extraction)
```

**Key metrics:**
- Main JS bundle: 3.7 MB (931 KB gzipped)
- Firebase coupling: 9/10 (direct SDK calls in 50+ files)
- Cloud Functions: 8 deployed (receipt AI, changelog sync, push notifications)
- Firestore security rules: 210 lines
- All analytics/aggregation: client-side
- Real-time sync: Firestore onSnapshot listeners
- Offline: Firestore persistence + PWA service worker

---

## Options Evaluated

### Option A: Stay with React SPA + Firebase (Refactor Only)
### Option B: Migrate to Next.js + Firebase
### Option C: Migrate to Next.js + Supabase (PostgreSQL)
### Option D: Stay React SPA + Add API Layer (Cloud Run / Express)
### Option E: Migrate to React Native / Expo (Mobile-First)

---

## Option A: Stay with React SPA + Firebase

**What changes:** Internal code organization only (the refactor analysis). No platform migration.

### What You Keep
- Zero migration cost
- Firestore real-time sync (core to shared groups)
- Firestore offline-first persistence
- Firebase Auth (Google OAuth, session management)
- Cloud Functions serverless model (no servers to manage)
- PWA with service worker
- Firebase Hosting CDN
- Firebase emulators for local dev
- Existing test infrastructure (5,787 tests)

### What You Fix (via Refactor Analysis)
- 23 files over 800 lines → all under 800
- Feature-Sliced Design from 30% → 100%
- 1,500 lines of duplicated services eliminated
- State management aligned (contexts → Zustand)
- Normalization bug (Spanish accents) fixed
- Dead code removed

### What Remains Painful
- Client-side aggregation for analytics (loads all transactions to memory)
- 3.7 MB bundle (no server components to reduce it)
- No SEO (irrelevant for a logged-in app)
- Vendor lock-in to Firebase
- In-memory rate limiting in Cloud Functions (not distributed)
- Complex Firestore queries limited by NoSQL model

### Cost Profile (Firebase Blaze Plan)

| Item | Free Tier | At 1K Users | At 10K Users |
|------|-----------|-------------|--------------|
| Firestore reads | 50K/day | ~$5-15/mo | ~$50-150/mo |
| Firestore writes | 20K/day | ~$2-5/mo | ~$20-50/mo |
| Cloud Functions | 2M invocations/mo | ~$1-3/mo | ~$10-30/mo |
| Cloud Storage | 5 GB | ~$1/mo | ~$5-10/mo |
| Hosting | 10 GB/mo | ~$0/mo | ~$0-5/mo |
| Gemini API | Pay-per-call | ~$5-15/mo | ~$50-100/mo |
| **Total estimate** | **$0** | **~$15-40/mo** | **~$135-345/mo** |

**Note:** The $19/week cost spike was resolved by adding listener limits (98% reduction). Current production costs are low.

---

## Option B: Next.js + Firebase

**What changes:** Replace Vite SPA with Next.js App Router. Keep Firebase as backend.

### What You Gain
- Server Components reduce client JS bundle (potentially 40-60% reduction)
- API Routes can replace some Cloud Functions
- Better code splitting out of the box
- Server-side data fetching (aggregation could move to server)
- Image optimization built-in
- Potential for landing page SEO (marketing pages)

### What You Lose
- 8-12 weeks of migration effort
- PWA service worker complexity increases with SSR
- Firebase real-time listeners need careful handling with Server Components
- Deployment complexity: Firebase Hosting doesn't natively support Next.js SSR (needs Cloud Run adapter or Vercel)
- All 5,787 tests need adaptation
- Vite → Next.js build system migration (different config, plugins)

### What Stays the Same
- Firebase Auth, Firestore, Storage, Functions all stay
- Data model unchanged
- Security rules unchanged

### Cost Profile

| Item | Cost Delta vs Option A |
|------|----------------------|
| Hosting (Vercel) | +$20/mo (Pro plan for production) |
| OR Cloud Run adapter | +$5-15/mo |
| Firebase costs | Same |
| Development time | **8-12 weeks of zero feature work** |
| Test rewrite | **2-4 weeks** |
| **Total migration cost** | ~$0-20/mo ongoing + **10-16 weeks labor** |

### Migration Effort

| Task | Weeks |
|------|-------|
| Next.js scaffolding + routing | 1 |
| Page-by-page migration (20+ views) | 4-6 |
| Server Components refactor | 2-3 |
| PWA adaptation | 1 |
| Test migration (vitest → jest/next-test) | 2-3 |
| CI/CD pipeline changes | 0.5 |
| Performance testing + bug fixes | 1-2 |
| **Total** | **10-16 weeks** |

---

## Option C: Next.js + Supabase (PostgreSQL)

**What changes:** Full platform migration to Next.js + Supabase.

### What You Gain
- SQL queries for analytics (proper JOINs, GROUP BY, window functions)
- Row-Level Security (RLS) — PostgreSQL-native, more expressive than Firestore rules
- Real-time via PostgreSQL subscriptions (similar to Firestore)
- Server-side aggregation natively
- Edge Functions (Deno) for serverless compute
- Better scaling economics at high volume
- Open-source, self-hostable (no vendor lock-in)
- PostgREST API auto-generated from schema

### What You Lose
- **12-20 weeks of migration effort**
- Firestore's offline-first persistence (Supabase has basic offline, not as mature)
- Firestore's document model flexibility (schema migrations needed in SQL)
- Data migration required (all existing Firestore data → PostgreSQL)
- User account migration (Firebase Auth → Supabase Auth)
- Cloud Functions → Edge Functions rewrite
- All Firestore security rules → RLS policies rewrite
- Shared groups changelog architecture needs complete redesign
- All 5,787 tests need rewrite

### Cost Profile

| Item | Supabase Free | At 1K Users | At 10K Users |
|------|--------------|-------------|--------------|
| Supabase | $0 | $25/mo (Pro) | $25-75/mo |
| Vercel | $0 | $20/mo (Pro) | $20-40/mo |
| AI API (Gemini) | Same | ~$5-15/mo | ~$50-100/mo |
| Storage | Included | Included | +$10-20/mo |
| **Total** | **$0** | **~$50-60/mo** | **~$105-235/mo** |

### Migration Effort

| Task | Weeks |
|------|-------|
| Schema design (Firestore → PostgreSQL) | 2 |
| Data migration scripts | 2 |
| Auth migration (Firebase → Supabase) | 2 |
| Next.js scaffolding + routing | 1 |
| Service layer rewrite (40+ queries) | 4-6 |
| Cloud Functions → Edge Functions | 2 |
| Security rules → RLS policies | 1 |
| Real-time sync redesign | 2-3 |
| Frontend integration | 3-4 |
| Test rewrite | 3-4 |
| **Total** | **22-28 weeks** |

---

## Option D: Stay React SPA + Add API Layer (Cloud Run)

**What changes:** Keep current frontend, add a Node.js/Express API on Cloud Run for server-side operations.

### What You Gain
- Server-side aggregation for analytics (relieve client memory)
- Distributed rate limiting (Redis/Memorystore)
- Custom middleware (logging, error tracking, request validation)
- Could gradually move logic from Cloud Functions to API
- Easier to add complex business logic (reporting, PDF generation, etc.)
- Could add PostgreSQL alongside Firestore for analytics-only

### What You Lose
- 4-6 weeks of API development
- Two systems to maintain (Firebase + Cloud Run)
- New deployment pipeline
- Increased complexity

### Cost Profile

| Item | Cost Delta vs Option A |
|------|----------------------|
| Cloud Run (API server) | +$5-30/mo (min instances) |
| Redis (rate limiting) | +$5-15/mo (if needed) |
| Firebase costs | Same (or slightly reduced) |
| Development time | **4-6 weeks** |

---

## Option E: React Native / Expo (Mobile-First)

**What changes:** Rewrite as a mobile app using React Native.

### Assessment
This is the **wrong move right now**. The PWA works well for the current user base, and React Native would mean:
- Complete UI rewrite (all 20+ views)
- No code sharing between web and mobile (different navigation, gestures)
- App store approval process
- 16-24 weeks minimum

**Verdict:** Future epic (F4 in roadmap), NOT a current priority. If mobile becomes critical, consider a hybrid approach (Capacitor wrapper for the PWA) as an interim step.

---

## Decision Matrix

| Criterion | Weight | A: Refactor Only | B: Next.js+Firebase | C: Next.js+Supabase | D: +API Layer |
|-----------|--------|-------------------|---------------------|---------------------|---------------|
| Migration risk | 25% | **10** (none) | 5 | 2 | 7 |
| Feature velocity impact | 20% | **10** (0 weeks lost) | 3 (12 wks lost) | 1 (24 wks lost) | 6 (5 wks lost) |
| Architecture fitness (now) | 15% | 7 | 8 | 9 | 8 |
| Architecture fitness (2yr) | 15% | 5 | 7 | **9** | 7 |
| Monthly cost (1K users) | 10% | **9** (~$25/mo) | 7 (~$45/mo) | 6 (~$55/mo) | 7 (~$45/mo) |
| Scalability (10K users) | 10% | 5 | 7 | **9** | 7 |
| Developer experience | 5% | 7 | 8 | 8 | 6 |
| **Weighted Score** | | **8.0** | **5.9** | **4.9** | **6.9** |

---

## Recommendation: Option A (Stay + Refactor) with Option D Prepared

### The Core Argument

**BoletApp's problems are code organization, not platform choice.**

The mega-files (TrendsView 5,960 lines), duplicated services (4 copy-paste mapping services), and incomplete Feature-Sliced Design are the actual blockers. These exist regardless of whether the app runs on Firebase, Supabase, or Next.js.

Migrating platforms would cost 10-24 weeks and produce **zero user-facing features**. The refactoring (Option A) produces the same code quality improvement in **4-6 weeks** while maintaining full feature velocity for shared groups (Epic 14d-v2) and future epics.

### Why Firebase Is Still Right

1. **Real-time sync is core to shared groups** — Firestore's `onSnapshot` is the foundation. Replacing it with PostgreSQL subscriptions or WebSocket layers adds complexity without benefit at current scale.

2. **Offline-first matters for a mobile-targeting PWA** — Firestore's offline persistence is production-grade. Supabase's is not.

3. **Serverless = zero ops** — No servers to manage, no scaling to configure. The team is one developer. Operations overhead matters.

4. **Cost is appropriate** — At 1K users, Firebase costs ~$25/mo. Even at 10K users, it's $135-345/mo. This is reasonable for a B2C app before monetization kicks in.

5. **SEO is irrelevant** — This is a logged-in expense tracker. There's nothing to index. SSR adds zero value for the core use case.

6. **The bundle size (931 KB gzipped) is fine for a PWA** — Service worker caches it after first load. Subsequent visits are instant.

### When to Reassess (Trigger Points)

Add Option D (API layer) **when any of these become true:**

| Trigger | Why | What to Add |
|---------|-----|-------------|
| Analytics queries take >3s on 2000+ transactions | Client-side aggregation hitting memory limits | Cloud Run API with server-side aggregation |
| Shared group sync costs exceed $100/mo | Changelog reads scaling with users × groups | Server-side sync coordinator |
| Card statement scanning (Epic F3) launches | Needs server-side PDF parsing, batch processing | Cloud Run API for document processing |
| B2B features requested | Multi-tenant data isolation, admin dashboards | Full backend API |
| Firestore costs exceed $500/mo | NoSQL at scale is expensive for analytics | PostgreSQL for analytics alongside Firestore |

### What to Do NOW

Execute the refactoring analysis (CODEBASE-REFACTOR-ANALYSIS.md) in this order:

**Phase 1 (2-3 weeks): Foundation cleanup**
- Generic mapping service (eliminate 800 lines of duplication)
- Centralize normalization (fix Spanish accent bug)
- Delete dead services
- Extract baseDuplicateDetection

**Phase 2 (3-4 weeks): Feature modules**
- Create analytics, history, insights, reports, dashboard, settings features
- Move scattered files to feature directories

**Phase 3 (4-6 weeks): Mega-view decomposition**
- TrendsView 5,960 → 800 lines
- DashboardView 3,473 → 800 lines
- TransactionEditorViewInternal 2,751 → 800 lines

**Phase 4 (2-3 weeks): State alignment**
- Migrate remaining contexts to Zustand
- Separate client/server state in mixed hooks

### What to Prepare for Option D (Zero-Cost Now)

While doing the refactoring, introduce a **Data Access Layer (DAL)** abstraction:

```typescript
// Instead of direct Firestore calls scattered everywhere:
const q = query(collection(db, 'artifacts', appId, 'users', userId, 'transactions'), ...);

// Create a repository interface:
interface TransactionRepository {
  getPage(userId: string, cursor?: string, limit?: number): Promise<TransactionPage>;
  getById(userId: string, id: string): Promise<Transaction>;
  create(userId: string, tx: CreateTransactionInput): Promise<string>;
  update(userId: string, id: string, data: Partial<Transaction>): Promise<void>;
  delete(userId: string, id: string): Promise<void>;
  subscribe(userId: string, callback: (txs: Transaction[]) => void): Unsubscribe;
}

// Current implementation:
class FirestoreTransactionRepository implements TransactionRepository { ... }

// Future (if trigger hit):
class ApiTransactionRepository implements TransactionRepository { ... }
```

This costs ~1-2 days during the service layer refactoring (Phase 1) and makes a future API layer migration trivial.

---

## Cost Summary

| Scenario | Migration Cost | Monthly (1K users) | Monthly (10K users) | Time to Feature Parity |
|----------|---------------|-------------------|--------------------|-----------------------|
| **A: Refactor (recommended)** | 0 weeks | ~$25/mo | ~$250/mo | Already there |
| B: Next.js + Firebase | 10-16 weeks | ~$45/mo | ~$300/mo | 10-16 weeks |
| C: Next.js + Supabase | 22-28 weeks | ~$55/mo | ~$200/mo | 22-28 weeks |
| D: + API Layer | 4-6 weeks | ~$45/mo | ~$280/mo | 4-6 weeks |

**Bottom line:** Spend the next 12-16 weeks on code quality (refactoring) and feature delivery (shared groups, tech debt). Prepare the escape hatch (DAL abstraction). Pull the trigger on Option D only when Firebase costs or query limitations become measurable problems.

---

## Appendix: Firebase vs Supabase for This Use Case

| Feature | Firebase | Supabase | Winner for BoletApp |
|---------|----------|----------|-------------------|
| Real-time sync | Native (onSnapshot) | Native (PostgreSQL) | **Firebase** (more mature offline) |
| Offline persistence | First-class | Basic | **Firebase** |
| Complex queries | Limited (NoSQL) | Full SQL | **Supabase** |
| Aggregation | Client-side only | Server-side SQL | **Supabase** |
| Security rules | Firestore rules | Row-Level Security | **Supabase** (more expressive) |
| Serverless functions | Cloud Functions | Edge Functions | **Firebase** (more mature) |
| AI integration | Gemini native | Manual API | **Firebase** |
| Free tier | Very generous | Generous | **Firebase** (higher limits) |
| Vendor lock-in | High | Low (open source) | **Supabase** |
| Migration effort | N/A | 22-28 weeks | **Firebase** (already there) |
| Chilean market | Good latency (us-central1) | Good (AWS sa-east-1) | Tie |
