# Epic Technical Specification: Production Deployment Readiness

Date: 2025-11-20
Author: Gabe
Epic ID: epic-1
Status: Draft

---

## Overview

This epic transforms the Boletapp single-file prototype (621 lines in main.tsx) into a production-ready application with proper modular architecture, version control, and automated deployment. The refactoring maintains 100% feature parity while establishing sustainable development practices through modern tooling (Vite, TypeScript), proper dependency management, and Firebase Hosting deployment with HTTPS.

The epic addresses the current technical debt identified in ADR-001 and ADR-004 of the architecture document, which acknowledged that the single-file architecture is appropriate for MVP but requires refactoring before reaching the 1000-line complexity threshold. At 621 lines, now is the optimal time to restructure before adding new features.

## Objectives and Scope

**In Scope:**
- Refactor main.tsx into modular component structure (components/, utils/, hooks/, services/)
- Establish Vite 5.x build pipeline with TypeScript 5.3.3 configuration
- Configure environment variables (.env) for Firebase and Gemini API credentials
- Initialize Git repository and push to https://github.com/Brownbull/gmni_boletapp
- Configure Firebase Hosting with deployment automation
- Deploy application to production with HTTPS enabled
- Update all project documentation to reflect new architecture
- Verify all existing features work identically in production

**Out of Scope:**
- New features or functionality changes (pure refactoring only)
- UI/UX redesign or visual modifications
- Database schema modifications
- Automated testing framework implementation (deferred to future epic)
- Multi-environment setup (staging/prod separation)
- Custom domain configuration beyond Firebase default
- Performance optimizations beyond build improvements

## System Architecture Alignment

**Current State (ADR-001, ADR-004):**
- Single-file SPA pattern with no build step
- All code in main.tsx running directly via browser
- Tailwind CSS via CDN
- Hardcoded API keys in source

**Target State (Aligns with "Future Architecture Improvements" § Medium-Term):**
- Multi-file architecture with logical separation (components/, utils/, hooks/, services/)
- Vite build pipeline enabling TypeScript checking, tree-shaking, and optimization
- Environment variable externalization per security recommendations
- Git version control enabling collaboration
- Firebase Hosting deployment per existing deployment architecture section

**Preserved Architectural Decisions:**
- Firebase as backend (ADR-002): No changes to auth or Firestore integration
- Gemini AI for OCR (ADR-003): No changes to AI integration
- React 18 with Hooks state management: No state library introduction yet
- Component hierarchy and data flow patterns: Maintained during extraction

**Infrastructure Components:**
- Frontend: React 18 SPA served via Firebase Hosting CDN
- Authentication: Firebase Auth (Google OAuth) - no changes
- Database: Cloud Firestore - no changes
- AI: Google Gemini 2.5 Flash - no changes
- Build: Vite 5.x (new) for development server and production builds
- Version Control: Git/GitHub (new)
- Deployment: Firebase Hosting (new automation)

## Detailed Design

### Services and Modules

The refactoring will extract code from main.tsx (lines 1-621) into the following module structure:

| Module Path | Responsibility | Source Lines | Inputs | Outputs | Owner |
|-------------|---------------|--------------|--------|---------|-------|
| `src/config/firebase.ts` | Firebase configuration object | 30-37 | Environment variables | Firebase config object | Story 1.2 |
| `src/config/gemini.ts` | Gemini API configuration | 39-41 | Environment variables | API key, model name | Story 1.2 |
| `src/config/constants.ts` | App constants (categories, pagination) | 44-50 | None | Constant exports | Story 1.1 |
| `src/utils/currency.ts` | Currency formatting utilities | 92-96 | amount, currency code | Formatted string | Story 1.1 |
| `src/utils/date.ts` | Date parsing and formatting | 85-90, 98-104 | Date strings/objects | Safe date strings | Story 1.1 |
| `src/utils/validation.ts` | Number parsing and validation | 79-83 | Raw input values | Sanitized integers | Story 1.1 |
| `src/utils/json.ts` | JSON cleaning utilities | 72-77 | Raw text | Clean JSON string | Story 1.1 |
| `src/utils/csv.ts` | CSV export functionality | 105-120 | Transaction array | CSV string | Story 1.1 |
| `src/utils/colors.ts` | Color generation for charts | 180-195 | Category name, theme | Hex color code | Story 1.1 |
| `src/services/gemini.ts` | Gemini API integration | 136-250 | Images, currency, lang | Transaction object | Story 1.1 |
| `src/services/firestore.ts` | Firestore CRUD operations | Inline ops | Transaction data | Promise results | Story 1.1 |
| `src/hooks/useAuth.ts` | Firebase auth state management | 280-285 | None | user, services | Story 1.1 |
| `src/hooks/useTransactions.ts` | Firestore real-time sync | 290-310 | user, services | transactions array | Story 1.1 |
| `src/components/ErrorBoundary.tsx` | React error boundary | 52-69 | children | Error UI or children | Story 1.1 |
| `src/components/charts/SimplePieChart.tsx` | Pie chart visualization | 370-420 | data, theme, onClick | SVG chart | Story 1.1 |
| `src/components/charts/GroupedBarChart.tsx` | Bar chart visualization | 480-540 | data, theme | SVG chart | Story 1.1 |
| `src/components/CategoryBadge.tsx` | Category display badge | Inline JSX | category | Badge element | Story 1.1 |
| `src/components/Nav.tsx` | Bottom navigation bar | 560-590 | view, setView | Nav UI | Story 1.1 |
| `src/views/LoginScreen.tsx` | Authentication view | 320-340 | signIn callback | Login UI | Story 1.1 |
| `src/views/DashboardView.tsx` | Dashboard summary view | 350-380 | transactions, handlers | Dashboard UI | Story 1.1 |
| `src/views/ScanView.tsx` | Receipt scanning view | 390-430 | scan state, handlers | Scan UI | Story 1.1 |
| `src/views/EditView.tsx` | Transaction edit view | 440-500 | transaction, handlers | Edit form UI | Story 1.1 |
| `src/views/TrendsView.tsx` | Analytics and charts view | 510-570 | transactions, settings | Trends UI | Story 1.1 |
| `src/views/HistoryView.tsx` | Transaction history view | 575-600 | transactions, handlers | History list UI | Story 1.1 |
| `src/views/SettingsView.tsx` | Settings view | 605-615 | settings state, handlers | Settings UI | Story 1.1 |
| `src/App.tsx` | Root app component | 251-621 | None | Composed app | Story 1.1 |
| `src/main.tsx` | Vite entry point | New | None | ReactDOM render | Story 1.1 |

**Extraction Strategy:**
1. **Phase 1:** Utilities and constants (lowest risk, no dependencies)
2. **Phase 2:** Services (Gemini API, Firestore operations)
3. **Phase 3:** Hooks (auth, transactions sync)
4. **Phase 4:** Components (charts, badges, nav)
5. **Phase 5:** Views (page-level components)
6. **Phase 6:** Main App component orchestration

### Data Models and Contracts

No database schema changes. All existing Firestore data models preserved:

**Transaction Document (Firestore):**
```typescript
interface Transaction {
  id: string;                    // Firestore document ID
  date: string;                  // ISO date string (YYYY-MM-DD)
  storeName: string;             // Merchant name
  storeCategory: string;         // One of STORE_CATEGORIES
  total: number;                 // Integer (no decimals)
  items: Array<{
    name: string;                // Item description
    qty: number;                 // Quantity (integer)
    price: number;               // Price per unit (integer)
  }>;
  createdAt: Timestamp;          // Firestore serverTimestamp
  userId: string;                // Firebase Auth UID (indexed)
}
```

**Firestore Path Structure (unchanged):**
```
/artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

**Type Definitions (new TypeScript files):**
```typescript
// src/types/transaction.ts
export type StoreCategory =
  | 'Supermarket' | 'Restaurant' | 'Bakery' | 'Butcher' | 'Bazaar'
  | 'Veterinary' | 'PetShop' | 'Medical' | 'Pharmacy' | 'Technology'
  | 'StreetVendor' | 'Transport' | 'Services' | 'Other';

export interface TransactionItem {
  name: string;
  qty: number;
  price: number;
}

export interface Transaction {
  id: string;
  date: string;
  storeName: string;
  storeCategory: StoreCategory;
  total: number;
  items: TransactionItem[];
  createdAt: FirebaseTimestamp;
}

// src/types/settings.ts
export type Currency = 'CLP' | 'USD' | 'EUR';
export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';

export interface AppSettings {
  lang: Language;
  currency: Currency;
  theme: Theme;
}
```

### APIs and Interfaces

**Firebase Authentication API (no changes):**
```typescript
// src/services/auth.ts
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

export async function signInWithGoogle(auth: Auth): Promise<UserCredential> {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function logOut(auth: Auth): Promise<void> {
  return signOut(auth);
}
```

**Firestore CRUD API (extracted to service):**
```typescript
// src/services/firestore.ts
export async function addTransaction(
  db: Firestore,
  userId: string,
  appId: string,
  transaction: Omit<Transaction, 'id' | 'createdAt'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, 'artifacts', appId, 'users', userId, 'transactions'),
    { ...transaction, createdAt: serverTimestamp() }
  );
  return docRef.id;
}

export async function updateTransaction(
  db: Firestore,
  userId: string,
  appId: string,
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> {
  const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId);
  return updateDoc(docRef, updates);
}

export async function deleteTransaction(
  db: Firestore,
  userId: string,
  appId: string,
  transactionId: string
): Promise<void> {
  const docRef = doc(db, 'artifacts', appId, 'users', userId, 'transactions', transactionId);
  return deleteDoc(docRef);
}

export function subscribeToTransactions(
  db: Firestore,
  userId: string,
  appId: string,
  callback: (transactions: Transaction[]) => void
): () => void {
  const q = collection(db, 'artifacts', appId, 'users', userId, 'transactions');
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Transaction));
    callback(txs);
  });
}
```

**Gemini AI API (extracted to service):**
```typescript
// src/services/gemini.ts
export async function analyzeReceipt(
  images: string[],         // Base64 encoded images
  currency: Currency,
  lang: Language
): Promise<Transaction> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: buildPrompt(currency, lang) },
          ...images.map(img => ({
            inlineData: { mimeType: 'image/jpeg', data: img }
          }))
        ]
      }]
    })
  });

  // Parse and validate response...
  return parsedTransaction;
}
```

**Environment Variables Interface (.env):**
```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.5-flash-preview-09-2025
```

### Workflows and Sequencing

**Refactoring Workflow (Story 1.1):**
```
1. Initialize Vite Project
   ├─ npm create vite@latest . -- --template react-ts
   ├─ npm install (base dependencies)
   └─ Configure tsconfig.json, vite.config.ts

2. Extract Utilities (Phase 1)
   ├─ Create src/utils/*.ts files
   ├─ Copy utility functions from main.tsx
   ├─ Test utilities individually
   └─ Verify dev server runs

3. Extract Services (Phase 2)
   ├─ Create src/services/gemini.ts
   ├─ Create src/services/firestore.ts
   ├─ Move API integration logic
   └─ Test API calls work

4. Extract Hooks (Phase 3)
   ├─ Create src/hooks/useAuth.ts
   ├─ Create src/hooks/useTransactions.ts
   └─ Verify state management works

5. Extract Components (Phase 4)
   ├─ Create src/components/charts/*.tsx
   ├─ Create src/components/ErrorBoundary.tsx
   ├─ Create src/components/Nav.tsx
   └─ Test component rendering

6. Extract Views (Phase 5)
   ├─ Create src/views/*.tsx files
   ├─ Move view logic from main.tsx
   └─ Test all views render correctly

7. Create Main App (Phase 6)
   ├─ Create src/App.tsx
   ├─ Compose all views and components
   ├─ Create src/main.tsx entry point
   └─ Delete original main.tsx

8. Validation
   ├─ Test all features (auth, scan, CRUD, charts)
   ├─ Check console for errors
   ├─ Verify hot module replacement works
   └─ Confirm TypeScript compilation succeeds
```

**Build & Deployment Workflow (Stories 1.2-1.5):**
```
Story 1.2: Environment Configuration
├─ Create .env file with credentials
├─ Create .env.example template
├─ Update config files to read from import.meta.env
├─ Test production build (npm run build)
└─ Test preview server (npm run preview)

Story 1.3: Git Setup
├─ git init
├─ Create .gitignore (exclude .env, node_modules, dist)
├─ git add .
├─ git commit -m "Initial commit: Modular architecture"
├─ git remote add origin https://github.com/Brownbull/gmni_boletapp
└─ git push -u origin main

Story 1.4: Firebase Hosting
├─ npm install -g firebase-tools
├─ firebase login
├─ firebase init hosting
│  ├─ Select public directory: dist
│  ├─ Configure as single-page app: Yes
│  └─ Set up automatic builds: No (manual for now)
├─ Configure firebase.json caching headers
└─ firebase deploy --only hosting (staging test)

Story 1.5: Production Deployment
├─ npm run build (final production build)
├─ firebase deploy --only hosting --project production
├─ Test live URL (all features)
├─ Verify Firebase Console logs
└─ Document production URL in README.md
```

**Sequence Diagram - Refactoring Flow:**
```
Developer → Vite CLI: Create project
Vite CLI → Project: Generate template
Developer → main.tsx: Extract utilities
Developer → src/utils/: Create utility modules
Developer → Vite: Test dev server
Vite → Browser: Hot reload ✓
Developer → main.tsx: Extract services
Developer → src/services/: Create service modules
Developer → Vite: Test API calls
Services → Firebase/Gemini: API calls work ✓
Developer → main.tsx: Extract components
Developer → src/components/: Create React components
Developer → Vite: Test rendering
Browser: All components render ✓
Developer → main.tsx: Extract App
Developer → src/App.tsx: Compose application
Developer → src/main.tsx: Create entry point
Developer → main.tsx: Delete original file
Developer → Vite: Run production build
Vite → dist/: Optimized bundle ✓
```

## Non-Functional Requirements

### Performance

**Target Metrics (must match or exceed current performance):**
- Initial page load: ≤2 seconds (same as current single-file approach)
- Time to interactive: ≤3 seconds
- Hot module replacement: <500ms (new capability)
- Production build time: <30 seconds (new process)
- Bundle size: ≤300KB gzipped (target, current is ~200KB via CDN)

**Source (Architecture Document § Performance Optimizations):**
- Current implementation uses single HTTP request pattern (621-line file)
- No heavy dependencies (native SVG charts, no charting library)
- Real-time Firestore subscriptions already optimized

**Performance Requirements:**
1. Vite build must tree-shake unused code to maintain small bundle
2. Code splitting not required (app is still small enough for single bundle)
3. Preserve lazy data computation patterns (getTrendsData only runs when needed)
4. Maintain real-time subscription efficiency (no polling)
5. Static assets must be cached with proper headers (Story 1.4)

**Constraints:**
- No performance regressions allowed during refactoring
- All existing optimizations must be preserved
- New build process should not add significant overhead

### Security

**Authentication (no changes required):**
- Firebase Auth with Google OAuth (ADR Security Model)
- Token-based sessions with automatic refresh
- Session persistence via IndexedDB

**Authorization (must preserve existing rules):**
- Firestore security rules enforce user isolation: `request.auth.uid == userId`
- All queries scoped by user ID
- No cross-user data access possible

**API Key Security (CRITICAL IMPROVEMENT):**
- **Current Risk (Architecture § API Key Security):** Keys hardcoded in source, visible in browser devtools
- **Epic Mitigation:** Environment variables externalized to .env file (Story 1.2)
- **Requirements:**
  1. .env file MUST be git-ignored
  2. .env.example template provided with placeholder values
  3. All config must read from `import.meta.env.VITE_*` variables
  4. No hardcoded keys in any source file
  5. Build process validates all required env vars present

**Firestore Rules (no changes, but verify):**
```javascript
match /artifacts/{appId}/users/{userId}/transactions/{document=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Deployment Security:**
- HTTPS enforced via Firebase Hosting (automatic)
- API keys restricted to authorized domains in Google Cloud Console
- Firebase App Check recommended (deferred to future epic)

### Reliability/Availability

**Availability Target:** 99.9% (delegated to Firebase Hosting SLA)

**Error Handling (must preserve existing patterns):**
- React ErrorBoundary catches rendering errors
- Try-catch blocks around all async operations (Firebase, Gemini)
- Graceful degradation: Manual entry available if Gemini fails
- Data validation prevents malformed data (parseStrictNumber, getSafeDate)

**Build Reliability:**
- `npm run build` must succeed without errors
- TypeScript compilation must pass (no type errors allowed)
- All imports must resolve correctly
- Production build must be testable via `npm run preview`

**Deployment Reliability:**
- Firebase Hosting provides automatic rollback capability
- Deployment must be atomic (all-or-nothing)
- Pre-deployment validation required (Story 1.5 AC#1)

**Failure Recovery:**
- Firebase SDK auto-retries on network errors
- Firestore offline cache enables degraded operation
- Error boundary allows app reload without data loss

### Observability

**Development Observability:**
- Vite dev server provides detailed error messages
- Hot module replacement shows compilation errors in browser
- React DevTools compatible (component inspection)
- TypeScript provides compile-time error detection

**Production Observability (via Firebase Console):**
- Firebase Hosting: Request logs, bandwidth usage, deployment history
- Firebase Auth: Sign-in metrics, user counts
- Firestore: Read/write counts, query performance
- No custom logging required (rely on Firebase built-ins)

**Build Observability:**
- Vite build output shows bundle sizes
- Tree-shaking statistics visible in build logs
- Dependency analysis available via `vite-bundle-visualizer` (optional)

**Error Tracking:**
- Browser console errors (preserved from current implementation)
- Firebase Console logs for backend errors
- ErrorBoundary catches and displays React errors
- No third-party error tracking service required (future enhancement)

**Required Metrics (Story 1.5 validation):**
- Verify no errors in Firebase Console after deployment
- Verify no console errors in browser during regression testing
- Confirm Firebase Hosting shows active traffic

## Dependencies and Integrations

**Current State:** No package.json (single-file app loads dependencies via CDN and browser imports)

**Target State:** npm-managed dependencies with package.json

### Production Dependencies

All versions from Architecture Document § Technology Stack:

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `react` | ^18.3.1 | UI framework | Existing, no changes |
| `react-dom` | ^18.3.1 | React rendering | Existing, no changes |
| `firebase` | ^10.x | Auth + Firestore SDK | Existing, specific to current Firebase config |
| `lucide-react` | ^0.460.0 | Icon library | Existing, no changes |

### Development Dependencies

New dependencies for build tooling:

| Package | Version | Purpose | Required For |
|---------|---------|---------|--------------|
| `vite` | ^5.4.0 | Build tool and dev server | Stories 1.1, 1.2 |
| `@vitejs/plugin-react` | ^4.3.0 | React HMR and JSX transform | Story 1.1 |
| `typescript` | ^5.3.3 | Type checking | Story 1.1 |
| `@types/react` | ^18.3.0 | React type definitions | Story 1.1 |
| `@types/react-dom` | ^18.3.0 | ReactDOM type definitions | Story 1.1 |

### Optional Development Dependencies

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `eslint` | ^8.57.0 | Linting | Optional, not blocking |
| `@typescript-eslint/parser` | ^6.21.0 | TypeScript linting | Optional |
| `@typescript-eslint/eslint-plugin` | ^6.21.0 | TypeScript rules | Optional |

### Global Dependencies

| Tool | Purpose | Installation | Required For |
|------|---------|--------------|--------------|
| `firebase-tools` | Deployment CLI | `npm install -g firebase-tools` | Story 1.4, 1.5 |
| `node` | Runtime | v18+ required | All stories |
| `npm` | Package manager | v9+ required | All stories |

### External Service Integrations

**Firebase Services (no changes to configuration):**
- **Firebase Authentication:** Google OAuth provider already configured
- **Cloud Firestore:** Database instance already provisioned
- **Firebase Hosting:** To be configured in Story 1.4
- **Configuration:** Credentials externalized to .env (Story 1.2)

**Google Cloud APIs (no changes):**
- **Gemini AI API:** `gemini-2.5-flash-preview-09-2025` model
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/`
- **Configuration:** API key externalized to .env (Story 1.2)

### Integration Points

**Vite Integration:**
- Entry point: `src/main.tsx` imports `src/App.tsx`
- Dev server: Port 5173 (default)
- Build output: `dist/` directory
- Environment variables: Via `import.meta.env` interface

**Firebase SDK Integration:**
- Firebase config loaded from environment variables
- Initialized once in `src/services/firebase.ts` (or similar)
- Exported instances used throughout app

**TypeScript Integration:**
- `tsconfig.json` configured for React + Vite
- Strict mode enabled (recommended)
- Type definitions for all modules

### Version Constraints

**Constraint:** Firebase SDK version must match existing Firebase project configuration
**Constraint:** React 18.x required (hooks API, concurrent features)
**Constraint:** Vite 5.x for optimal React support
**Constraint:** TypeScript 5.3.3 for latest type safety features
**Constraint:** Node.js 18+ for Vite compatibility

### Dependency Installation Commands

```bash
# Story 1.1 - Initial project setup
npm create vite@latest . -- --template react-ts
npm install firebase lucide-react

# Story 1.4 - Firebase deployment tools
npm install -g firebase-tools
```

### Repository Dependencies

**Git Repository:** https://github.com/Brownbull/gmni_boletapp
- **Status:** Repository created, awaiting initial push (Story 1.3)
- **Branch Strategy:** Single main branch (simple project)
- **Required Files:** `.gitignore` must exclude `.env`, `node_modules`, `dist`

### Build Pipeline Dependencies

**No CI/CD initially:**
- Manual builds via `npm run build`
- Manual deployments via `firebase deploy`
- Automated pipelines deferred to future epic

### Configuration Files Required

| File | Purpose | Created In | Contains |
|------|---------|-----------|----------|
| `package.json` | Dependency manifest | Story 1.1 | Scripts, dependencies |
| `vite.config.ts` | Vite configuration | Story 1.1 | React plugin, build settings |
| `tsconfig.json` | TypeScript config | Story 1.1 | Compiler options |
| `.env` | Environment variables | Story 1.2 | API keys (git-ignored) |
| `.env.example` | Env template | Story 1.2 | Placeholder values |
| `.gitignore` | Git exclusions | Story 1.3 | .env, node_modules, dist |
| `firebase.json` | Firebase Hosting config | Story 1.4 | Public dir, rewrites, headers |
| `.firebaserc` | Firebase project ID | Story 1.4 | Project alias |

## Acceptance Criteria (Authoritative)

All acceptance criteria extracted from Epic 1 in epics.md:

**Epic-Level Criteria:**

1. **AC-E1:** Application successfully refactored from single-file to modular structure with no feature regressions
2. **AC-E2:** Code tracked in Git repository at https://github.com/Brownbull/gmni_boletapp
3. **AC-E3:** Production build process functional (`npm run build` succeeds)
4. **AC-E4:** Application deployed and accessible via Firebase Hosting URL with HTTPS
5. **AC-E5:** All existing features work identically in deployed production environment
6. **AC-E6:** Environment variables externalized (no hardcoded API keys in source)
7. **AC-E7:** Documentation updated to reflect new architecture and deployment process

**Story 1.1 Criteria (Refactor to Modular Architecture):**

1. **AC-1.1.1:** All code from main.tsx extracted into logical modules (components/, utils/, hooks/, services/)
2. **AC-1.1.2:** Vite development server runs successfully with hot module replacement
3. **AC-1.1.3:** TypeScript compilation succeeds with no errors
4. **AC-1.1.4:** All existing features work identically to original main.tsx
5. **AC-1.1.5:** No console errors in browser devtools during normal operation

**Story 1.2 Criteria (Production Build Configuration):**

6. **AC-1.2.1:** .env file configured with all Firebase and Gemini credentials (git-ignored)
7. **AC-1.2.2:** .env.example template created and documented
8. **AC-1.2.3:** `npm run build` completes successfully producing optimized dist/ folder
9. **AC-1.2.4:** `npm run preview` serves production build locally with all features functional
10. **AC-1.2.5:** No hardcoded API keys remain in source code

**Story 1.3 Criteria (Git Repository Setup):**

11. **AC-1.3.1:** Git repository initialized with proper .gitignore
12. **AC-1.3.2:** Initial commit includes all source code (excluding node_modules, .env, dist)
13. **AC-1.3.3:** Repository pushed to https://github.com/Brownbull/gmni_boletapp
14. **AC-1.3.4:** README.md updated with new project structure and setup instructions
15. **AC-1.3.5:** Repository is accessible and viewable on GitHub web interface

**Story 1.4 Criteria (Firebase Deployment Infrastructure):**

16. **AC-1.4.1:** Firebase CLI installed and authenticated
17. **AC-1.4.2:** `firebase init hosting` completed with correct settings (public: dist, SPA config)
18. **AC-1.4.3:** firebase.json includes caching headers for optimized asset delivery
19. **AC-1.4.4:** Staging deployment tested successfully
20. **AC-1.4.5:** Deployment process documented in README.md

**Story 1.5 Criteria (Production Deployment & Verification):**

21. **AC-1.5.1:** Production build created and tested locally
22. **AC-1.5.2:** `firebase deploy --only hosting` succeeds without errors
23. **AC-1.5.3:** Application accessible via Firebase Hosting URL with HTTPS enabled
24. **AC-1.5.4:** All features (auth, scanning, CRUD, analytics) work in production environment
25. **AC-1.5.5:** No errors in Firebase Console logs after deployment
26. **AC-1.5.6:** Production URL documented and shared

## Traceability Mapping

Mapping acceptance criteria to technical specification sections and implementation components:

| AC ID | Epic AC | Spec Section(s) | Component(s)/API(s) | Test Verification |
|-------|---------|----------------|---------------------|-------------------|
| AC-E1 | Refactored modular structure | § Detailed Design - Services and Modules | All src/* modules | Manual regression test: All features work |
| AC-E2 | Git repository created | § Dependencies - Repository Dependencies | .git/, .gitignore, README.md | Verify GitHub URL accessible |
| AC-E3 | Production build works | § Dependencies - Build Pipeline | package.json scripts, vite.config.ts | Run `npm run build`, verify dist/ |
| AC-E4 | Firebase deployment live | § System Architecture Alignment - Infrastructure | firebase.json, Firebase Hosting | Open production URL, verify HTTPS |
| AC-E5 | Features work in production | § Non-Functional Requirements - Reliability | All application code | Full regression in production |
| AC-E6 | Env vars externalized | § Security - API Key Security | .env, .env.example, config files | Grep source for hardcoded keys |
| AC-E7 | Documentation updated | N/A | README.md, architecture docs | Review documentation completeness |
| AC-1.1.1 | Code extracted to modules | § Detailed Design - Services and Modules | utils/, services/, hooks/, components/, views/ | Verify all modules exist and export correctly |
| AC-1.1.2 | Vite dev server works | § Dependencies - Vite Integration | vite.config.ts, package.json | Run `npm run dev`, test HMR |
| AC-1.1.3 | TypeScript compiles | § Dependencies - TypeScript Integration | tsconfig.json, *.ts/*.tsx files | Run `tsc --noEmit` |
| AC-1.1.4 | Features work identically | § Workflows and Sequencing - Validation | All views and components | Test auth, scan, CRUD, charts |
| AC-1.1.5 | No console errors | § Non-Functional Requirements - Observability | ErrorBoundary, error handling | Open devtools, navigate all views |
| AC-1.2.1 | .env configured | § APIs and Interfaces - Environment Variables | .env file | Verify all VITE_* vars present |
| AC-1.2.2 | .env.example created | § Dependencies - Configuration Files | .env.example | Verify template has placeholders |
| AC-1.2.3 | Production build succeeds | § Non-Functional Requirements - Build Reliability | Vite build pipeline | Run build, check exit code 0 |
| AC-1.2.4 | Preview server works | § Workflows and Sequencing - Build & Deployment | npm scripts | Run preview, test all features |
| AC-1.2.5 | No hardcoded keys | § Security - API Key Security | src/config/* files | grep -r "AIza" "YOUR_" in src/ |
| AC-1.3.1 | Git initialized | § Dependencies - Repository Dependencies | .git/, .gitignore | Run `git status` |
| AC-1.3.2 | Initial commit made | § Workflows - Git Setup | Git history | Run `git log` |
| AC-1.3.3 | Pushed to GitHub | § Dependencies - Repository Dependencies | Remote repository | Check GitHub web interface |
| AC-1.3.4 | README updated | N/A | README.md | Review README for accuracy |
| AC-1.3.5 | Repository accessible | N/A | GitHub repository | Open URL, verify public/accessible |
| AC-1.4.1 | Firebase CLI ready | § Dependencies - Global Dependencies | firebase-tools | Run `firebase --version` |
| AC-1.4.2 | Hosting initialized | § Dependencies - Configuration Files | firebase.json, .firebaserc | Verify files exist with correct settings |
| AC-1.4.3 | Caching headers configured | § Non-Functional Requirements - Performance | firebase.json headers section | Review firebase.json config |
| AC-1.4.4 | Staging deployment tested | § Workflows - Firebase Hosting | Firebase Console | Deploy, test staging URL |
| AC-1.4.5 | Deployment documented | N/A | README.md deployment section | Review deployment instructions |
| AC-1.5.1 | Production build tested | § Workflows - Production Deployment | dist/ output | Test locally via preview |
| AC-1.5.2 | Deployment succeeds | § Non-Functional Requirements - Deployment Reliability | Firebase Hosting | Check deploy command output |
| AC-1.5.3 | HTTPS URL accessible | § Security - Deployment Security | Firebase Hosting SSL | Open URL, verify padlock icon |
| AC-1.5.4 | All features work | § Overview - Epic Goals | All application features | Regression test: auth, scan, CRUD, analytics |
| AC-1.5.5 | No Firebase errors | § Non-Functional Requirements - Observability | Firebase Console logs | Check Console for errors |
| AC-1.5.6 | Production URL documented | N/A | README.md | Verify URL is documented |

**Traceability Notes:**
- Every AC maps to at least one spec section or component
- Critical path: AC-1.1.* → AC-1.2.* → AC-1.3/1.4 → AC-1.5.*
- Epic-level criteria (AC-E*) are composite checks spanning multiple stories
- Testing strategy focuses on feature parity (AC-E1, AC-E5, AC-1.1.4, AC-1.5.4) at multiple checkpoints

## Risks, Assumptions, Open Questions

### Risks

**R1: Feature Regression During Refactoring (HIGH)**
- **Impact:** Users unable to use critical features (auth, scanning, CRUD)
- **Probability:** Medium (manual refactoring of 621 lines)
- **Mitigation:**
  - Phased extraction approach (utilities first, then components)
  - Test each phase before moving to next
  - Maintain original main.tsx until full extraction validated
  - Comprehensive regression testing at multiple checkpoints (AC-1.1.4, AC-1.2.4, AC-1.5.4)

**R2: Environment Variable Misconfiguration (MEDIUM)**
- **Impact:** Production deployment fails or exposes incorrect Firebase/Gemini instances
- **Probability:** Medium (new .env pattern)
- **Mitigation:**
  - .env.example template with clear documentation
  - Validation that all required VITE_* vars are present before build
  - Test production build locally via preview server before deployment
  - Document exact Firebase project IDs and API key sources

**R3: Firebase Hosting Configuration Errors (MEDIUM)**
- **Impact:** Deployment fails, or SPA routing breaks (404s on refresh)
- **Probability:** Low-Medium (standard configuration, but first time)
- **Mitigation:**
  - Follow Firebase Hosting SPA configuration guide exactly
  - Test staging deployment before production
  - Verify rewrites configuration for client-side routing
  - Document rollback procedure using Firebase Console

**R4: TypeScript Migration Complexity (LOW)**
- **Impact:** Compilation errors, type mismatches, longer development time
- **Probability:** Low (simple types, no complex generics)
- **Mitigation:**
  - Start with loose TypeScript config if needed
  - Use `any` types temporarily for complex sections
  - Gradually tighten type safety in future iterations
  - Prioritize functional correctness over perfect types

**R5: Git Repository Data Exposure (LOW)**
- **Impact:** Accidental commit of .env with real credentials
- **Probability:** Low (if .gitignore set up correctly)
- **Mitigation:**
  - Create .gitignore BEFORE git init
  - Verify .env is listed in .gitignore before any commit
  - Use `git status` to verify no sensitive files staged
  - Document credential rotation procedure if exposure occurs

**R6: Dependency Version Conflicts (LOW)**
- **Impact:** Build failures, runtime errors, incompatible APIs
- **Probability:** Low (stable ecosystem, LTS versions)
- **Mitigation:**
  - Use exact versions from architecture document
  - Lock versions in package.json with ^ prefix
  - Test full build pipeline after dependency installation
  - Document Node.js and npm version requirements

### Assumptions

**A1: Firebase Project Already Configured**
- Current Firebase Auth and Firestore are fully operational
- Google OAuth provider is enabled
- Firestore security rules are already deployed
- Firebase project ID matches configuration in main.tsx

**A2: GitHub Repository Created**
- Repository https://github.com/Brownbull/gmni_boletapp exists
- User has push access to repository
- Repository can be public or private (no constraint)

**A3: Gemini API Key Available**
- Existing Gemini API key is valid and has sufficient quota
- API key has access to `gemini-2.5-flash-preview-09-2025` model
- No billing issues or quota limitations

**A4: Node.js Environment Ready**
- Node.js 18+ and npm 9+ installed on development machine
- No conflicting global npm packages
- Sufficient disk space for node_modules (~200MB)

**A5: Single Developer Workflow**
- No parallel development requiring branching strategy
- No need for code review process (single developer)
- Sequential story execution (not parallelized)

**A6: No Breaking Changes in Dependencies**
- React 18.3.1 API stable (no deprecations)
- Firebase 10.x API matches existing code usage
- Vite 5.x stable with React TypeScript template
- Lucide React icons maintain current API

### Open Questions

**Q1: Tailwind CSS Integration**
- **Question:** Current app uses Tailwind via CDN. Should we migrate to PostCSS + Tailwind CLI, or keep CDN?
- **Options:**
  1. Keep CDN (simplest, no changes needed)
  2. Migrate to PostCSS (better tree-shaking, smaller bundle)
- **Recommendation:** Keep CDN for this epic (out of scope), revisit in future optimization epic
- **Decision Needed By:** Story 1.1 (affects package.json)

**Q2: Firebase Project Environment**
- **Question:** Are there separate Firebase projects for dev/staging/prod, or single project?
- **Assumption:** Single Firebase project (simplest for MVP)
- **Impact:** If multiple projects exist, need separate .env files and deployment targets
- **Decision Needed By:** Story 1.2 (affects .env structure)

**Q3: Automated Testing Framework**
- **Question:** Should we add Jest/Vitest during refactoring to catch regressions?
- **Epic Scope:** Explicitly out of scope (deferred)
- **Justification:** Adds complexity and time; manual testing sufficient for 5 stories
- **Future Work:** Next epic can add testing framework to modular codebase

**Q4: Code Formatting and Linting**
- **Question:** Should we configure Prettier and ESLint during setup?
- **Recommendation:** Optional (listed as optional dependencies)
- **Decision:** Up to developer preference, not blocking for epic completion
- **Decision Needed By:** Story 1.1 (optional dev dependency)

**Q5: Git Commit Message Conventions**
- **Question:** Use conventional commits (feat:, fix:, etc.) or freeform?
- **Recommendation:** Freeform for simplicity (single developer)
- **Future:** Can add commitlint if team grows
- **Decision Needed By:** Story 1.3

**Q6: Firebase Hosting Custom Domain**
- **Question:** Will a custom domain be configured, or use default Firebase domain?
- **Epic Scope:** Explicitly out of scope
- **Assumption:** Use default Firebase Hosting URL (*.web.app or *.firebaseapp.com)
- **Future Work:** Custom domain configuration in future epic if needed

## Test Strategy Summary

### Testing Approach

**Manual Testing Focus:** No automated tests for this epic (per Architecture § Testing Strategy and epic out-of-scope)

**Test Levels:**

1. **Unit-Level Validation (Informal)**
   - Test utility functions individually in browser console or dev server
   - Verify formatCurrency, parseStrictNumber, getSafeDate with sample inputs
   - Validate color generation functions produce consistent outputs

2. **Integration Testing (Manual)**
   - Test Gemini API integration with sample receipt images
   - Verify Firestore CRUD operations (create, read, update, delete)
   - Confirm Firebase Auth flow (sign-in, sign-out, session persistence)

3. **Component Testing (Visual)**
   - Render each extracted component in isolation
   - Verify props are correctly consumed
   - Check responsive behavior and styling

4. **End-to-End Testing (Full Regression)**
   - **Critical User Flows:**
     1. User authentication (Google sign-in)
     2. Receipt scanning workflow (image upload → Gemini processing → edit view)
     3. Transaction CRUD (create, edit, delete)
     4. Analytics visualization (trends view, charts, filtering)
     5. Settings persistence (language, currency, theme)
   - **Test Checkpoints:**
     - After Story 1.1: Full regression on dev server
     - After Story 1.2: Full regression on production build (preview)
     - After Story 1.5: Full regression on deployed production URL

### Test Environments

| Environment | Story | Purpose | URL/Access |
|-------------|-------|---------|------------|
| Development | 1.1 | Hot reloading, rapid iteration | localhost:5173 |
| Production Build (Local) | 1.2 | Validate optimized bundle | localhost:4173 (preview) |
| Staging | 1.4 | Pre-production verification | Firebase Hosting staging URL |
| Production | 1.5 | Live deployment | Firebase Hosting production URL |

### Test Data

**Existing Data:**
- Use real Firebase Auth account for testing
- Use existing Firestore transactions (if any)
- Preserve all data during refactoring (read-only operations)

**Test Receipts:**
- Prepare 2-3 sample receipt images for scanning tests
- Vary complexity (single item, multiple items, different categories)
- Test both Spanish and English receipt formats

### Success Criteria for Testing

**Definition of Done (Testing):**
- [ ] All 5 stories pass their acceptance criteria
- [ ] Full regression test completed at 3 checkpoints (dev, preview, production)
- [ ] No console errors during normal operation
- [ ] All existing features work identically to original main.tsx
- [ ] Firebase Console shows no errors after deployment
- [ ] Performance metrics meet or exceed baselines (§ NFR Performance)

### Test Coverage (Functional)

**Must Cover:**
1. Authentication: Sign-in, sign-out, session persistence across refresh
2. Scanning: Upload images, process with Gemini, handle errors, manual fallback
3. CRUD: Create transaction, edit transaction, delete transaction, real-time sync
4. Analytics: Pie chart rendering, bar chart rendering, category filtering, date filtering
5. Settings: Language switch, currency switch, theme toggle, CSV export
6. Navigation: All view transitions, bottom nav, back buttons
7. Responsive Design: Mobile viewport (primary), desktop viewport (bonus)

**Edge Cases:**
- Empty transaction list (first-time user)
- Network offline (Firestore cache behavior)
- Invalid receipt image (Gemini error handling)
- Malformed data (validation and auto-repair logic)
- Session expiration (re-authentication prompt)

### Test Execution Plan

**Story 1.1 Testing:**
- Run dev server: `npm run dev`
- Navigate to all 7 views (login, dashboard, scan, edit, trends, history, settings)
- Test one complete user flow (sign-in → scan → save → view in history)
- Check browser console for errors
- Verify TypeScript compilation: `tsc --noEmit`

**Story 1.2 Testing:**
- Build production: `npm run build`
- Verify dist/ folder created with optimized files
- Run preview: `npm run preview`
- Repeat full regression test on preview server
- Verify no hardcoded keys: `grep -r "AIza\|YOUR_" src/`

**Story 1.3 Testing:**
- Verify repository pushed: Open GitHub URL
- Check README is updated and accurate
- Verify .gitignore excludes .env, node_modules, dist
- Clone repo in separate directory and verify setup works

**Story 1.4 Testing:**
- Deploy to staging: `firebase deploy --only hosting`
- Test staging URL with full regression
- Verify HTTPS enabled (padlock in browser)
- Check Firebase Console for deployment logs

**Story 1.5 Testing:**
- Deploy to production: `firebase deploy --only hosting --project production`
- Run full regression test on production URL
- Test from multiple devices (mobile, desktop)
- Verify Firebase Console shows no errors
- Share production URL and document

### Regression Test Checklist

**Feature Parity Validation (Use for AC-1.1.4, AC-1.2.4, AC-1.5.4):**

```markdown
## Regression Test Checklist

### Authentication
- [ ] Sign in with Google works
- [ ] User name/email displayed correctly
- [ ] Sign out works
- [ ] Session persists after page refresh

### Receipt Scanning
- [ ] Camera/file upload works
- [ ] Multiple images can be added
- [ ] Image preview displays
- [ ] Gemini processing succeeds
- [ ] Data extracted correctly (store, items, total)
- [ ] Editing after scan works
- [ ] Manual entry fallback available

### Transaction Management
- [ ] Create transaction from scan
- [ ] Create transaction manually
- [ ] Edit existing transaction
- [ ] Delete transaction (with confirmation)
- [ ] Real-time sync (changes reflect immediately)

### Analytics & Trends
- [ ] Pie chart renders with correct data
- [ ] Bar chart renders with correct data
- [ ] Category filtering works
- [ ] Date range filtering works
- [ ] Drill-down (category → transactions) works
- [ ] Totals calculated correctly

### History View
- [ ] Transactions list displays
- [ ] Pagination works (20 items per page)
- [ ] Edit button opens edit view
- [ ] Delete button removes transaction
- [ ] Empty state shown when no transactions

### Settings
- [ ] Language switch updates UI
- [ ] Currency switch updates formatting
- [ ] Theme toggle changes colors
- [ ] CSV export downloads file
- [ ] Factory reset clears data (test carefully)

### Navigation
- [ ] Bottom nav switches views
- [ ] Active view highlighted
- [ ] Back buttons work correctly
- [ ] No broken navigation states

### Visual/UX
- [ ] No console errors
- [ ] No visual glitches
- [ ] Responsive on mobile
- [ ] Icons render correctly
- [ ] Loading states display
```

### Test Responsibilities

**Developer:** Execute all tests, validate acceptance criteria, document issues
**User (Gabe):** Final acceptance of production deployment, real-world usage validation
