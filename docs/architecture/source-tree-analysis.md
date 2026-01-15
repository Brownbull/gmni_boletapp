# Source Tree Analysis: Boletapp

**Last Updated:** 2026-01-07 (Post-Epic 14 - React Query Migration)

## Executive Summary

Boletapp has evolved from a **single-file application** (621 lines) to a **modular architecture** with **100+ TypeScript files** organized into multiple logical layers. This transformation (Epic 1-14) enables better testability, maintainability, and collaboration while maintaining the application's core functionality.

**Architecture Pattern:** Modular PWA (React + TypeScript + Vite + React Query)
**Total Source Files:** 200+ TypeScript files
**Total Lines of Code:** ~25,000+ LOC
**Build Tool:** Vite 5.4.0 with HMR
**Caching:** @tanstack/react-query for instant navigation
**Production URL:** https://boletapp-d609f.web.app
**Cloud Functions:** 2 functions (analyzeReceipt, onTransactionDeleted)

---

## Directory Structure

```
boletapp/                                    # Project root
├── src/                                    # 🎯 APPLICATION SOURCE CODE (31 files)
│   ├── config/                             # Configuration & initialization (3 files)
│   │   ├── constants.ts                    # App constants (categories, pagination)
│   │   ├── firebase.ts                     # Firebase initialization
│   │   └── gemini.ts                       # Gemini AI configuration
│   │
│   ├── types/                              # TypeScript type definitions (2 files)
│   │   ├── settings.ts                     # Language, currency, theme types
│   │   └── transaction.ts                  # Transaction and item interfaces
│   │
│   ├── services/                           # Business logic & API integrations (25 files)
│   │   ├── firestore.ts                    # Firestore CRUD operations
│   │   ├── gemini.ts                       # Gemini AI receipt analysis
│   │   ├── sharedGroupService.ts           # Shared groups CRUD (Epic 14c)
│   │   ├── creditService.ts                # User credits management
│   │   ├── insightEngineService.ts         # AI-powered insights
│   │   ├── batchProcessingService.ts       # Batch receipt processing
│   │   ├── merchantTrustService.ts         # Trusted merchant logic
│   │   ├── categoryMappingService.ts       # Category learning
│   │   ├── merchantMappingService.ts       # Merchant aliases
│   │   ├── locationService.ts              # Location resolution
│   │   └── ... (15 more services)
│   │
│   ├── hooks/                              # Custom React hooks (49 files)
│   │   ├── useAuth.ts                      # Authentication state management
│   │   ├── useTransactions.ts              # Firestore real-time data sync (React Query)
│   │   ├── useFirestoreSubscription.ts     # Core RQ + Firestore subscription hook
│   │   ├── useFirestoreQuery.ts            # One-time fetch hook
│   │   ├── useFirestoreMutation.ts         # Mutation hook with cache invalidation
│   │   ├── useCategoryMappings.ts          # Category learning data
│   │   ├── useMerchantMappings.ts          # Merchant aliases
│   │   ├── useSubcategoryMappings.ts       # Item subcategories
│   │   ├── useGroups.ts                    # Transaction groups
│   │   ├── useTrustedMerchants.ts          # Auto-trust merchants
│   │   ├── useUserCredits.ts               # Credit balance
│   │   ├── useUserPreferences.ts           # User settings
│   │   ├── useSharedGroups.ts              # Shared groups (Epic 14c)
│   │   ├── usePendingInvitations.ts        # Group invitations (Epic 14c)
│   │   ├── useScanStateMachine.ts          # Scan state machine (Epic 14d)
│   │   ├── useBatchProcessing.ts           # Batch receipt processing
│   │   ├── useInsightProfile.ts            # AI insights profile
│   │   └── ... (31 more hooks)
│   │
│   ├── lib/                                # Library utilities (2 files)
│   │   ├── queryClient.ts                  # React Query client configuration
│   │   └── queryKeys.ts                    # Query key constants
│   │
│   ├── utils/                              # Pure utility functions (7 files)
│   │   ├── colors.ts                       # Color palette for categories
│   │   ├── csv.ts                          # CSV export functionality
│   │   ├── currency.ts                     # Currency formatting (Intl)
│   │   ├── date.ts                         # Date formatting and parsing
│   │   ├── json.ts                         # JSON parsing utilities
│   │   ├── translations.ts                 # i18n strings (Spanish/English)
│   │   └── validation.ts                   # Input parsing and validation
│   │
│   ├── components/                         # Reusable UI components (5 files)
│   │   ├── CategoryBadge.tsx               # Category display badge
│   │   ├── ErrorBoundary.tsx               # Error handling wrapper
│   │   ├── Nav.tsx                         # Bottom navigation component
│   │   └── charts/
│   │       ├── SimplePieChart.tsx          # Pie chart visualization
│   │       └── GroupedBarChart.tsx         # Grouped bar chart
│   │
│   ├── views/                              # Page-level view components (7 files)
│   │   ├── LoginScreen.tsx                 # Google OAuth sign-in
│   │   ├── DashboardView.tsx               # Summary stats and shortcuts
│   │   ├── ScanView.tsx                    # Receipt camera/upload interface
│   │   ├── EditView.tsx                    # Transaction creation/editing
│   │   ├── TrendsView.tsx                  # Analytics and charts
│   │   ├── HistoryView.tsx                 # Transaction list with pagination
│   │   └── SettingsView.tsx                # App preferences
│   │
│   ├── App.tsx                             # Main application orchestrator
│   └── main.tsx                            # React DOM root entry point
│
├── public/                                 # Static assets
│   └── index.html                          # HTML template
│
├── docs/                                   # 📚 Comprehensive documentation (8+ files)
│   ├── index.md                            # Master documentation index
│   ├── architecture.md                     # Architecture + 3 Mermaid diagrams + 7 ADRs
│   ├── source-tree-analysis.md             # This file (source code structure)
│   ├── project-overview.md                 # Project summary
│   ├── component-inventory.md              # UI component catalog
│   ├── development-guide.md                # Setup and dev instructions
│   ├── data-models.md                      # Firestore schema
│   ├── api-contracts.md                    # Firebase & Gemini API integrations
│   ├── deployment-guide.md                 # Firebase Hosting deployment
│   ├── test-strategy.md                    # Test risk register (17 categories)
│   ├── templates/                          # Documentation templates
│   │   └── epic-evolution-template.md      # Epic state tracking template
│   └── sprint-artifacts/                   # Epic and story tracking
│       ├── sprint-status.yaml              # Story status tracking
│       ├── epic1/                          # Epic 1: Production Deployment (COMPLETE)
│       │   ├── 1-1-refactor-to-modular-architecture.md
│       │   ├── 1-2-production-build-configuration.md
│       │   ├── 1-3-git-repository-setup.md
│       │   ├── 1-4-firebase-deployment-infrastructure.md
│       │   ├── 1-5-production-deployment-verification.md
│       │   ├── epic-1-retro-2025-11-21.md
│       │   └── tech-spec-epic-1.md
│       └── epic2/                          # Epic 2: Testing & Documentation (IN PROGRESS)
│           ├── 2-1-documentation-epic-evolution.md
│           ├── epic-2-evolution.md         # Before/After state tracking
│           └── epic-2-tech-spec.md
│
├── functions/                              # ☁️ Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts                        # Function exports entry point
│   │   ├── analyzeReceipt.ts               # Receipt OCR via Gemini AI
│   │   ├── deleteTransactionImages.ts      # Cascade delete trigger
│   │   ├── imageProcessing.ts              # Sharp-based image processing
│   │   ├── storageService.ts               # Firebase Storage operations
│   │   └── prompts/                        # AI prompt library (V1, V2, V3)
│   │       ├── index.ts                    # Prompt registry
│   │       ├── v1-original.ts              # Legacy prompt
│   │       ├── v2-multi-currency-receipt-types.ts
│   │       └── v3-category-standardization.ts  # Current production prompt
│   ├── package.json                        # Functions dependencies
│   └── tsconfig.json                       # Functions TypeScript config
│
├── .bmad/                                  # ⚙️ BMAD framework (AI-assisted dev methodology)
│   ├── core/                               # Core BMAD modules
│   ├── bmb/                                # BMAD Builder module
│   ├── bmm/                                # BMAD Method module (project workflows)
│   ├── cis/                                # Creative & Innovation module
│   └── _cfg/                               # Configuration and agent definitions
│
├── .github/                                # 🔧 GitHub configuration
│   └── chatmodes/                          # BMAD agent chat mode definitions
│
├── .claude/                                # 🤖 Claude Code slash commands
│   └── commands/                           # BMAD workflow commands
│
├── .vscode/                                # 🛠️ VSCode editor settings
│
├── package.json                            # NPM dependencies and scripts
├── tsconfig.json                           # TypeScript configuration
├── vite.config.ts                          # Vite build configuration
├── firebase.json                           # Firebase Hosting configuration
├── firestore.rules                         # Firestore security rules
└── .env                                    # Environment variables (git-ignored)
```

---

## Source Code Organization (src/)

### Layer 1: Configuration (`src/config/`)

**Purpose:** Centralized configuration and API initialization

#### **constants.ts**
- **Size:** ~30 lines
- **Exports:**
  - `STORE_CATEGORIES` - Available transaction categories
  - `ITEMS_PER_PAGE` - Pagination limit
  - `APP_ID` - Firebase collection namespace
- **Usage:** Imported by views and components for consistent constants

#### **firebase.ts**
- **Size:** ~45 lines
- **Exports:**
  - `app` - Initialized Firebase app instance
  - `auth` - Firebase Auth instance
  - `db` - Firestore instance
- **Dependencies:** `firebase/app`, `firebase/auth`, `firebase/firestore`
- **Environment:** Reads from `import.meta.env.VITE_FIREBASE_*`

#### **gemini.ts**
- **Size:** ~25 lines
- **Exports:**
  - `GEMINI_API_KEY` - API key from environment
  - `GEMINI_MODEL` - Model name (gemini-2.0-flash-preview-exp)
  - `GEMINI_API_URL` - API endpoint URL
- **Environment:** Reads from `import.meta.env.VITE_GEMINI_API_KEY`

---

### Layer 2: Types (`src/types/`)

**Purpose:** TypeScript type definitions and interfaces

#### **transaction.ts**
- **Size:** ~40 lines
- **Exports:**
  - `Transaction` interface - Full transaction structure
  - `TransactionItem` interface - Line item structure
  - `Category` type - Union of valid categories
- **Usage:** Imported throughout app for type safety

#### **settings.ts**
- **Size:** ~20 lines
- **Exports:**
  - `Language` type - 'en' | 'es'
  - `Currency` type - Currency codes
  - `Theme` type - 'light' | 'dark' (future use)
- **Usage:** Settings configuration and i18n

---

### Layer 3: Services (`src/services/`)

**Purpose:** External API integration and business logic

#### **firestore.ts**
- **Size:** ~120 lines
- **Exports:**
  - `addTransaction(user, services, transaction)` - Create transaction
  - `updateTransaction(user, services, id, updates)` - Update transaction
  - `deleteTransaction(user, services, id)` - Delete transaction
  - `wipeAllTransactions(user, services)` - Delete all user data
- **Dependencies:** `firebase/firestore`
- **Collection Path:** `/artifacts/{appId}/users/{userId}/transactions`
- **Security:** User isolation via Firestore rules

#### **gemini.ts**
- **Size:** ~95 lines
- **Exports:**
  - `analyzeReceipt(images, currency)` - Receipt OCR and data extraction
- **Dependencies:** Gemini AI REST API
- **Input:** Base64-encoded images
- **Output:** Structured JSON (merchant, date, total, items)
- **Error Handling:** Returns null on failure, caller handles gracefully

---

### Layer 4: Hooks (`src/hooks/`)

**Purpose:** Custom React hooks for state management

#### **useAuth.ts**
- **Size:** ~65 lines
- **Exports:** `useAuth()` hook
- **Returns:**
  - `user` - Current user object or null
  - `loading` - Initial auth check in progress
  - `signIn()` - Google OAuth popup sign-in
  - `signOut()` - Sign out current user
- **Dependencies:** `firebase/auth`
- **Pattern:** Firebase `onAuthStateChanged` listener

#### **useTransactions.ts**
- **Size:** ~80 lines
- **Exports:** `useTransactions(user, services)` hook
- **Returns:**
  - `transactions` - Array of user's transactions
  - `loading` - Data fetch in progress
  - `error` - Error message if fetch failed
- **Dependencies:** `firebase/firestore`
- **Pattern:** Real-time Firestore `onSnapshot` listener
- **Cleanup:** Unsubscribes on unmount

---

### Layer 5: Utilities (`src/utils/`)

**Purpose:** Pure functions with no side effects

#### **colors.ts**
- **Size:** ~45 lines
- **Exports:**
  - `stringToColor(str)` - Deterministic color from string
  - `getColor(category)` - Category-specific color palette
- **Usage:** CategoryBadge, charts

#### **csv.ts**
- **Size:** ~60 lines
- **Exports:**
  - `exportToCSV(transactions, filename)` - Generate and download CSV
- **Format:** RFC 4180 compliant (escapes commas, quotes)
- **Columns:** Date, Merchant, Category, Total, Items

#### **currency.ts**
- **Size:** ~25 lines
- **Exports:**
  - `formatCurrency(amount, currency)` - Intl.NumberFormat wrapper
- **Locales:** Auto-detects browser locale
- **Default:** USD with $ symbol

#### **date.ts**
- **Size:** ~50 lines
- **Exports:**
  - `formatDate(dateString)` - Localized date display
  - `getSafeDate(input)` - Parse various date formats to ISO string
- **Formats:** Supports ISO, locale strings, timestamps

#### **json.ts**
- **Size:** ~35 lines
- **Exports:**
  - `cleanJson(text)` - Extract JSON from markdown code blocks
  - `safeParseJson(text)` - Try-catch wrapper for JSON.parse
- **Usage:** Parsing Gemini AI responses (often wrapped in ```json blocks)

#### **translations.ts**
- **Size:** ~120 lines
- **Exports:**
  - `t(key, language)` - i18n translation function
  - Translation keys for all UI strings
- **Languages:** English (default), Spanish
- **Usage:** All view components for display text

#### **validation.ts**
- **Size:** ~40 lines
- **Exports:**
  - `parseStrictNumber(value)` - Sanitize numeric input
  - `validateTransaction(transaction)` - Required field validation
- **Usage:** Forms and data entry

---

### Layer 6: Components (`src/components/`)

**Purpose:** Reusable UI components

#### **CategoryBadge.tsx**
- **Size:** ~35 lines
- **Props:** `category: string`
- **Rendering:** Pill-shaped badge with category-specific color
- **Usage:** Transaction lists, analytics

#### **ErrorBoundary.tsx**
- **Size:** ~55 lines
- **Props:** `children: ReactNode`
- **Pattern:** React Error Boundary class component
- **Fallback:** User-friendly error message + reload button
- **Usage:** Wraps entire App

#### **Nav.tsx**
- **Size:** ~85 lines
- **Props:**
  - `activeView: string`
  - `onNavigate: (view: string) => void`
  - `unreadNotifications: number` (optional)
- **Rendering:** Bottom navigation bar with icons
- **Tabs:** Dashboard, Scan, History, Trends, Settings
- **Icons:** Lucide React icons

#### **charts/SimplePieChart.tsx**
- **Size:** ~120 lines
- **Props:**
  - `data: Array<{label: string, value: number, color: string}>`
  - `width?: number`
  - `height?: number`
- **Rendering:** SVG pie chart with percentage labels
- **Interactivity:** Hover highlights, click to filter
- **Usage:** TrendsView category breakdown

#### **charts/GroupedBarChart.tsx**
- **Size:** ~140 lines
- **Props:**
  - `data: Array<{month: string, categories: Record<string, number>}>`
  - `width?: number`
  - `height?: number`
- **Rendering:** Stacked bar chart for monthly category totals
- **Interactivity:** Hover tooltips, responsive scaling
- **Usage:** TrendsView time-series analysis

---

### Layer 7: Views (`src/views/`)

**Purpose:** Page-level components representing app screens

#### **LoginScreen.tsx**
- **Size:** ~55 lines
- **Props:**
  - `onSignIn: () => Promise<void>`
  - `loading: boolean`
- **Rendering:** Centered login card with Google sign-in button
- **Features:** App logo, feature bullets, loading state

#### **DashboardView.tsx**
- **Size:** ~110 lines
- **Props:**
  - `transactions: Transaction[]`
  - `onNavigate: (view: string) => void`
  - `currency: string`
- **Rendering:**
  - Summary stats (total spent, transaction count, avg per transaction)
  - Quick action buttons (Scan, Add Manual, Export CSV)
  - Recent transactions preview (last 5)
- **Usage:** Default landing view after login

#### **ScanView.tsx**
- **Size:** ~180 lines
- **Props:**
  - `onAnalyze: (images: File[]) => Promise<Transaction | null>`
  - `onNavigate: (view: string, data?: Transaction) => void`
- **Rendering:**
  - Camera capture button
  - File upload dropzone
  - Multi-image preview
  - Loading state during AI analysis
- **Features:**
  - Accepts multiple images
  - Base64 encoding for Gemini API
  - Error handling for failed scans

#### **EditView.tsx**
- **Size:** ~220 lines
- **Props:**
  - `transaction?: Transaction`
  - `onSave: (transaction: Transaction) => Promise<void>`
  - `onCancel: () => void`
  - `currency: string`
- **Rendering:**
  - Merchant input
  - Date picker
  - Category dropdown
  - Total amount input
  - Item list editor (add/remove line items)
  - Save/Cancel buttons
- **Validation:** Required fields, numeric amounts
- **Usage:** Create new or edit existing transaction

#### **HistoryView.tsx**
- **Size:** ~160 lines
- **Props:**
  - `transactions: Transaction[]`
  - `onEdit: (transaction: Transaction) => void`
  - `onDelete: (id: string) => void`
  - `currency: string`
- **Rendering:**
  - Search/filter bar (by merchant, category, date range)
  - Paginated transaction list (20 per page)
  - Edit/Delete actions per row
  - Empty state for no transactions
- **Features:**
  - Client-side filtering
  - Sort by date (newest first)
  - Infinite scroll or pagination

#### **TrendsView.tsx**
- **Size:** ~190 lines
- **Props:**
  - `transactions: Transaction[]`
  - `currency: string`
- **Rendering:**
  - Date range selector (month, quarter, year)
  - Category breakdown pie chart
  - Monthly spending bar chart
  - Top merchants list
  - Spending insights (avg per day, highest category)
- **Features:**
  - Dynamic chart updates on filter change
  - Export chart data to CSV
  - Responsive charts

#### **SettingsView.tsx**
- **Size:** ~105 lines
- **Props:**
  - `settings: Settings`
  - `onUpdate: (settings: Settings) => void`
  - `onSignOut: () => void`
- **Rendering:**
  - Language selector (English/Spanish)
  - Currency selector
  - Theme toggle (light/dark - future)
  - Data management (wipe all transactions)
  - Sign out button
- **Persistence:** localStorage for settings

---

### Layer 8: Application Root

#### **App.tsx**
- **Size:** ~320 lines
- **Purpose:** Main application orchestrator
- **State Management:**
  - 20+ state variables (view, currentTransaction, settings, analytics filters)
  - Uses custom hooks: `useAuth()`, `useTransactions()`
- **Responsibilities:**
  - View routing (conditional rendering based on `view` state)
  - Transaction CRUD operations (calls services)
  - Settings management (localStorage persistence)
  - Gemini API coordination (scan workflow)
  - Props drilling to child views
- **Rendering:**
  ```tsx
  <ErrorBoundary>
    {!user ? (
      <LoginScreen onSignIn={signIn} loading={loading} />
    ) : (
      <>
        {view === 'dashboard' && <DashboardView {...} />}
        {view === 'scan' && <ScanView {...} />}
        {view === 'edit' && <EditView {...} />}
        {view === 'history' && <HistoryView {...} />}
        {view === 'trends' && <TrendsView {...} />}
        {view === 'settings' && <SettingsView {...} />}
        <Nav activeView={view} onNavigate={setView} />
      </>
    )}
  </ErrorBoundary>
  ```

#### **main.tsx**
- **Size:** ~15 lines
- **Purpose:** React DOM entry point
- **Code:**
  ```tsx
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import App from './App'

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  ```

---

## Key Integration Points

### Firebase Integration

**Entry Point:** `src/config/firebase.ts`
**Services Used:**
- Firebase Auth (Google OAuth 2.0)
- Cloud Firestore (Real-time NoSQL database)

**Data Flow:**
1. `firebase.ts` initializes Firebase app with config
2. `useAuth` hook subscribes to auth state changes
3. `useTransactions` hook subscribes to Firestore collection
4. `services/firestore.ts` provides CRUD operations
5. Real-time listeners trigger React re-renders on data changes

**Collection Path:** `/artifacts/{appId}/users/{userId}/transactions/{transactionId}`

**Security:** User isolation via Firestore security rules (deployed)

### Gemini AI Integration

**Entry Point:** `src/services/gemini.ts`
**API:** Google Generative Language API
**Model:** `gemini-2.0-flash-preview-exp`

**Receipt Scanning Flow:**
1. User uploads image(s) in `ScanView`
2. Images converted to base64 in browser
3. `analyzeReceipt()` sends POST to Gemini API with prompt
4. Gemini returns structured JSON (merchant, date, total, items)
5. Response parsed by `utils/json.ts`
6. Transaction object populated in `EditView` for user review
7. User confirms → saved to Firestore via `services/firestore.ts`

**Error Handling:** Graceful fallback to manual entry if AI fails

### State Management

**Pattern:** React Hooks + Props Drilling
**No Redux/Zustand:** Complexity doesn't justify global state library yet

**State Distribution:**
- **App.tsx:** View navigation, current transaction, settings, analytics filters
- **useAuth:** Authentication state (user, loading, sign-in/out functions)
- **useTransactions:** Transaction data (real-time sync from Firestore)
- **View Components:** Local UI state (form inputs, modals, loading states)

**Data Flow:**
```
User Action
  → View Component (event handler)
  → App.tsx (callback prop)
  → Service Function (API call)
  → Firestore Update
  → Real-time Listener (useTransactions hook)
  → State Update
  → Re-render
```

---

## Build & Deployment

### Development Workflow

```bash
npm run dev          # Vite dev server with HMR (http://localhost:5173)
npm run build        # TypeScript check + Vite build → dist/
npm run preview      # Preview production build (http://localhost:4175)
npm run type-check   # TypeScript validation only
```

**Hot Module Replacement (HMR):** Instant code updates without page reload

### Production Build Process

**Command:** `npm run build`

**Steps:**
1. TypeScript compilation (`tsc --noEmit`) - validates types
2. Vite bundles:
   - Tree-shaking removes unused code
   - Minification and compression
   - Asset optimization
   - Output to `dist/` folder

**Build Output:**
```
dist/
├── index.html         # HTML entry point
├── assets/
│   ├── index-[hash].js    # Bundled JS (with content hash for caching)
│   └── index-[hash].css   # Extracted CSS
└── vite.svg           # Static assets
```

**Bundle Size:** ~624KB (before gzip)

### Deployment to Firebase Hosting

**Configuration:** `firebase.json`
**Production URL:** https://boletapp-d609f.web.app

**Deployment Steps:**
1. `npm run build` - Create production build
2. `firebase deploy --only hosting` - Deploy static files to CDN
3. `firebase deploy --only firestore:rules` - Deploy security rules
4. Verify at production URL

**Rollback:** Firebase Console > Hosting > Previous deployment > "Rollback"

---

## File Navigation Guide

### For New Developers

**Start Here:**
1. [docs/index.md](./index.md) - Documentation master index
2. [docs/architecture.md](./architecture.md) - System architecture + 3 Mermaid diagrams
3. [docs/development-guide.md](./development-guide.md) - Setup instructions

**Understand the Code:**
4. [src/main.tsx](../src/main.tsx) - React entry point
5. [src/App.tsx](../src/App.tsx) - Main orchestrator (start here for app logic)
6. [src/config/](../src/config/) - Configuration files
7. [src/types/](../src/types/) - TypeScript interfaces
8. [src/services/](../src/services/) - API integrations

**Add Features:**
9. [src/views/](../src/views/) - Page components (add new views here)
10. [src/components/](../src/components/) - Reusable UI (add shared components here)
11. [src/utils/](../src/utils/) - Pure functions (add utilities here)

### For AI Assistants

**Code Organization:**
- **Configuration:** [src/config/](../src/config/)
- **Type Definitions:** [src/types/](../src/types/)
- **API Services:** [src/services/](../src/services/)
- **React Hooks:** [src/hooks/](../src/hooks/)
- **Utilities:** [src/utils/](../src/utils/)
- **UI Components:** [src/components/](../src/components/)
- **Views:** [src/views/](../src/views/)

**Documentation:**
- **Architecture:** [docs/architecture.md](./architecture.md) ⭐ **START HERE**
- **API Contracts:** [docs/api-contracts.md](./api-contracts.md)
- **Data Models:** [docs/data-models.md](./data-models.md)
- **Components:** [docs/component-inventory.md](./component-inventory.md)

---

## Architecture Evolution

### Pre-Epic 1 (Single-File SPA)
- **Structure:** One file (`main.tsx`, 621 lines)
- **Build:** No build step, direct browser rendering
- **Maintainability:** ❌ Difficult to test, modify, and collaborate

### Post-Epic 1 (Modular Architecture)
- **Structure:** 31 files across 7 logical layers
- **Build:** Vite 5.4.0 with TypeScript, HMR, and optimized production builds
- **Maintainability:** ✅ Testable, scalable, collaboration-ready

**Migration:** Epic 1, Story 1.1 (Refactor to Modular Architecture)
**Date:** 2025-11-20
**Impact:** Zero functional changes, pure refactoring for quality

---

---

## Key Additions (Epic 14)

### React Query Integration

**New Files:**
- `src/lib/queryClient.ts` - QueryClient with Firestore-optimized defaults
- `src/lib/queryKeys.ts` - Hierarchical query key constants
- `src/hooks/useFirestoreSubscription.ts` - Core hook combining RQ + Firestore

**Pattern:**
```typescript
// Components use hooks that return cached + real-time data
const transactions = useTransactions(user, services);
// Instant on navigation (from cache), real-time updates (from Firestore)
```

**DevTools:**
- React Query DevTools available in development mode
- TanStack logo appears in bottom-right corner (dev only)
- Guarded by `import.meta.env.DEV` - excluded from production builds

**Reference:** `docs/architecture/react-query-caching.md`

---

*Document Version: 4.0*
*Last Updated: 2026-01-15*
*Generated by: BMAD Document Project Workflow (Epic 14c - Household Sharing)*
