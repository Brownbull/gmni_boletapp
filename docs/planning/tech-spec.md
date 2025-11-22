# boletapp - Technical Specification

**Author:** Gabe
**Date:** 2025-11-20
**Project Level:** Quick Flow
**Change Type:** Refactoring + Infrastructure Setup + Deployment
**Development Context:** Brownfield (existing single-file application)

---

## Context

### Available Documents

**Loaded Documents:**
- ✅ **Brownfield Documentation:** Complete project documentation from document-project workflow
  - [Project Overview](./project-overview.md) - Executive summary, tech stack, features
  - [Architecture Document](./architecture.md) - Single-file SPA architecture, data flow, integrations
  - [Development Guide](./development-guide.md) - Setup instructions, development workflow
  - [Component Inventory](./component-inventory.md) - React component catalog
  - [Data Models](./data-models.md) - Firestore schema
  - [API Contracts](./api-contracts.md) - Firebase Auth, Firestore, Gemini AI integration

**Product Brief:** Not found (quick-flow project)
**Research Documents:** Not found (quick-flow project)

### Project Stack

**Current Implementation (Brownfield):**

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.x | UI framework (loaded via CDN) |
| | TypeScript/JSX | ES6+ | Component syntax |
| | Lucide React | Latest | Icon library (via CDN) |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS (via CDN) |
| **State Management** | React Hooks | Built-in | useState, useEffect, useRef |
| **Authentication** | Firebase Auth | 10.x | Google OAuth 2.0 |
| **Database** | Cloud Firestore | 10.x | NoSQL document store |
| **AI/ML** | Google Gemini | 2.5-flash | Multimodal vision API |
| **Deployment** | None | N/A | Currently undeployed |
| **Build Tool** | None | N/A | No build step - runs directly in browser |

**Key Characteristics:**
- **Single-File Architecture:** Entire app in `main.tsx` (621 lines)
- **No Dependencies Management:** All libraries loaded via CDN at runtime
- **No Build Process:** Direct browser execution with ES6+ modules
- **Serverless Backend:** Firebase handles all backend operations
- **AI Integration:** Google Gemini API for receipt OCR

### Existing Codebase Structure

**Current File Structure:**
```
boletapp/
├── main.tsx                    # Single-file application (621 lines)
├── main_ORIGINAL_GEMINI.tsx    # Backup copy
├── gemini_instructions.md      # Firebase & Gemini setup guide
├── gemini_summary.md           # Application overview
├── docs/                       # Generated documentation (8 files)
├── .bmad/                      # BMAD framework
├── .github/                    # GitHub configuration
├── .claude/                    # Claude Code commands
└── .vscode/                    # VSCode settings
```

**main.tsx Structure (621 lines):**

| Lines | Section | Description |
|-------|---------|-------------|
| 1-50 | Configuration | Imports, Firebase config, Gemini API, constants |
| 52-69 | Error Boundary | Global error handling component |
| 71-135 | Utilities | Currency, date, CSV, color utilities |
| 136-250 | AI Integration | Gemini API integration |
| 251-621 | Application | Main App component with all views |

**Component Architecture:**
- **Pattern:** Single-file SPA with functional components
- **State Management:** React Hooks (20+ useState variables in MainApp)
- **Component Count:** ~15 components (all inline)
- **Views:** Dashboard, Scan, Edit, Trends, History, Settings
- **Reusable Components:** SimplePieChart, GroupedBarChart, CategoryBadge

**Key Application Features:**
1. AI Receipt Scanning (Gemini API)
2. Smart Data Entry (alias system, duplicate detection)
3. Deep Analytics (hierarchical drill-down with charts)
4. History & Management (paginated transaction list)

---

## The Change

### Problem Statement

The current Boletapp implementation is a functional MVP built as a single-file application (main.tsx, 621 lines). While this approach enabled rapid prototyping, it creates several production readiness challenges:

1. **Architectural Limitations:** All code in one file makes maintenance, testing, and collaboration difficult
2. **No Version Control:** Code exists locally but is not tracked in the GitHub repository (https://github.com/Brownbull/gmni_boletapp)
3. **No Deployment Infrastructure:** Application cannot be deployed to production without proper build and hosting setup
4. **Scalability Concerns:** Single-file architecture is hitting the documented 1000-line threshold where refactoring becomes critical

The application needs to evolve from prototype to production-ready while maintaining all existing functionality.

### Proposed Solution

Transform the single-file application into a production-ready, modular architecture with proper deployment infrastructure:

1. **Refactor to Modular Structure:** Break main.tsx into logical component files, utilities, hooks, and services while preserving all functionality
2. **Establish Modern Build Pipeline:** Implement Vite as the build tool for fast development and optimized production builds
3. **Initialize Git Repository:** Set up proper version control and push to GitHub (https://github.com/Brownbull/gmni_boletapp)
4. **Configure Firebase Deployment:** Set up Firebase Hosting with automated deployment pipeline
5. **Deploy to Production:** Launch the application with proper monitoring and rollback capabilities

This approach maintains the simplicity and serverless architecture while establishing professional development and deployment practices.

### Scope

**In Scope:**

- Refactor main.tsx into modular file structure (components/, utils/, hooks/, services/)
- Implement Vite build configuration with TypeScript support
- Set up proper dependency management (package.json with explicit versions)
- Initialize Git repository with proper .gitignore
- Configure Firebase Hosting and deployment
- Create deployment scripts and documentation
- Environment variable management (.env files)
- Basic CI/CD setup for automated deployment
- Update all documentation to reflect new structure

**Out of Scope:**

- New features or functionality changes
- UI/UX redesign
- Database schema modifications
- Testing framework implementation (deferred to future story)
- Performance optimizations beyond build improvements
- Multi-environment setup (staging, production) - start with production only
- Custom domain configuration
- Analytics or monitoring tools beyond Firebase basics

---

## Implementation Details

### Source Tree Changes

**New Project Structure:**

```
boletapp/
├── src/
│   ├── main.tsx                    # CREATE - Application entry point
│   ├── App.tsx                     # CREATE - Root App component
│   ├── components/
│   │   ├── ErrorBoundary.tsx       # CREATE - Error boundary component
│   │   ├── common/
│   │   │   ├── CategoryBadge.tsx   # CREATE - Reusable badge component
│   │   │   └── Nav.tsx             # CREATE - Navigation component
│   │   ├── views/
│   │   │   ├── LoginScreen.tsx     # CREATE - Authentication view
│   │   │   ├── DashboardView.tsx   # CREATE - Dashboard view
│   │   │   ├── ScanView.tsx        # CREATE - Receipt scanning view
│   │   │   ├── EditView.tsx        # CREATE - Transaction editing view
│   │   │   ├── TrendsView.tsx      # CREATE - Analytics view
│   │   │   ├── HistoryView.tsx     # CREATE - Transaction history view
│   │   │   └── SettingsView.tsx    # CREATE - Settings view
│   │   └── charts/
│   │       ├── SimplePieChart.tsx  # CREATE - Pie chart component
│   │       └── GroupedBarChart.tsx # CREATE - Bar chart component
│   ├── hooks/
│   │   ├── useAuth.ts              # CREATE - Authentication hook
│   │   └── useTransactions.ts      # CREATE - Firestore data hook
│   ├── services/
│   │   ├── firebase.ts             # CREATE - Firebase initialization
│   │   ├── gemini.ts               # CREATE - Gemini AI service
│   │   └── firestore.ts            # CREATE - Firestore operations
│   ├── utils/
│   │   ├── currency.ts             # CREATE - Currency formatting utilities
│   │   ├── date.ts                 # CREATE - Date handling utilities
│   │   ├── csv.ts                  # CREATE - CSV export utilities
│   │   ├── color.ts                # CREATE - Color generation utilities
│   │   └── validation.ts           # CREATE - Data validation utilities
│   ├── types/
│   │   └── index.ts                # CREATE - TypeScript type definitions
│   └── config/
│       └── constants.ts            # CREATE - Application constants
├── public/
│   ├── index.html                  # CREATE - HTML template
│   └── favicon.ico                 # CREATE - App icon
├── package.json                    # CREATE - Dependency management
├── tsconfig.json                   # CREATE - TypeScript configuration
├── vite.config.ts                  # CREATE - Vite build configuration
├── .env.example                    # CREATE - Environment variable template
├── .env                            # CREATE - Environment variables (git-ignored)
├── .gitignore                      # CREATE - Git ignore rules
├── firebase.json                   # CREATE - Firebase configuration
├── .firebaserc                     # CREATE - Firebase project settings
├── README.md                       # MODIFY - Update with new structure
├── main.tsx                        # PRESERVE - Keep as backup reference
├── main_ORIGINAL_GEMINI.tsx        # PRESERVE - Original backup
└── docs/                           # MODIFY - Update all documentation
```

**Files to Create:** 28 new files
**Files to Modify:** 9 documentation files + README.md
**Files to Preserve:** 2 backup files (main.tsx, main_ORIGINAL_GEMINI.tsx)

### Technical Approach

**1. Build System: Vite 5.x**

Use Vite as the modern build tool:
- **Fast Development:** Hot Module Replacement (HMR) for instant feedback
- **Optimized Builds:** Tree-shaking and code-splitting out of the box
- **TypeScript Support:** Native TypeScript compilation
- **React Plugin:** Official @vitejs/plugin-react for JSX transformation

**2. Dependency Management Strategy**

Convert from CDN imports to npm packages with explicit versions:

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "firebase": "^10.7.1",
    "lucide-react": "^0.294.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.8"
  }
}
```

**3. Refactoring Strategy: Incremental Extraction**

Follow this extraction order to minimize risk:

**Phase 1 - Extract Pure Functions (Low Risk):**
- Utilities (currency, date, csv, color, validation)
- Constants (STORE_CATEGORIES, ITEMS_PER_PAGE)
- Type definitions

**Phase 2 - Extract Services (Medium Risk):**
- Firebase initialization
- Gemini AI service
- Firestore operations wrapper

**Phase 3 - Extract Custom Hooks (Medium Risk):**
- useAuth (authentication state)
- useTransactions (Firestore data sync)

**Phase 4 - Extract Components (Higher Risk):**
- Start with presentational components (charts, badges)
- Then view components (LoginScreen, DashboardView, etc.)
- Finally container components (App, ErrorBoundary)

**4. Environment Variable Management**

Move hardcoded config to environment variables:

```bash
# .env (git-ignored)
VITE_FIREBASE_API_KEY=actual_key_here
VITE_FIREBASE_AUTH_DOMAIN=project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=project-id
VITE_FIREBASE_STORAGE_BUCKET=project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abc123
VITE_GEMINI_API_KEY=actual_gemini_key
```

Access via `import.meta.env.VITE_*` in code.

**5. Git Repository Setup**

Initialize repository with proper structure:
- Create .gitignore (exclude .env, node_modules, dist)
- Initial commit with modular structure
- Push to https://github.com/Brownbull/gmni_boletapp
- Set up main branch protection (optional)

**6. Firebase Deployment Configuration**

Use Firebase Hosting with optimized settings:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

**7. Deployment Pipeline**

Simple deployment workflow:
1. `npm run build` - Creates optimized production build in dist/
2. `firebase deploy --only hosting` - Deploys to Firebase Hosting
3. Verify deployment at Firebase-provided URL
4. Monitor via Firebase Console

### Existing Patterns to Follow

**Current Code Patterns (from main.tsx):**

1. **Component Structure:**
   - Functional components with TypeScript/JSX
   - Props destructuring in function parameters
   - Early returns for loading/error states
   ```tsx
   const ComponentName = ({ prop1, prop2 }: Props) => {
       if (!prop1) return null;
       return <div>...</div>;
   };
   ```

2. **State Management:**
   - useState for local state
   - useEffect for side effects and data fetching
   - useRef for DOM references
   ```tsx
   const [state, setState] = useState(initialValue);
   useEffect(() => { /* effect */ }, [dependencies]);
   ```

3. **Error Handling:**
   - Try-catch blocks for async operations
   - Error messages stored in state
   - User-friendly error display
   ```tsx
   try {
       await operation();
   } catch (e) {
       setError(e.message);
   }
   ```

4. **Data Validation:**
   - Strict number parsing (parseInt with regex)
   - Safe date handling with fallbacks
   - Array.isArray() checks before iteration

5. **Styling:**
   - Tailwind CSS utility classes
   - Responsive design (mobile-first)
   - Dark mode support via theme state
   ```tsx
   className="bg-white dark:bg-gray-800 p-4 rounded-lg"
   ```

6. **Firebase Operations:**
   - Collection references scoped by user ID
   - onSnapshot for real-time listeners
   - serverTimestamp() for timestamp fields
   ```tsx
   const colRef = collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');
   ```

**Patterns to Maintain in Refactored Code:**
- All existing patterns above
- Component prop interfaces
- Async/await for promises
- Optional chaining (?.) and nullish coalescing (??)
- Consistent naming (camelCase for variables, PascalCase for components)

### Integration Points

**1. Firebase Authentication:**
- **Interface:** Firebase Auth SDK
- **Integration:** onAuthStateChanged listener in useAuth hook
- **Data Flow:** Auth state → App component → Protected routes
- **Error Handling:** Display sign-in errors to user

**2. Cloud Firestore:**
- **Interface:** Firebase Firestore SDK
- **Integration:** Real-time onSnapshot listeners in useTransactions hook
- **Data Path:** `/artifacts/{appId}/users/{userId}/transactions/{transactionId}`
- **Operations:** CRUD via service layer (services/firestore.ts)

**3. Google Gemini AI:**
- **Interface:** REST API (fetch)
- **Integration:** services/gemini.ts wrapper function
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- **Data Flow:** Image upload → API call → JSON parsing → Transaction object

**4. Browser APIs:**
- **File Input:** For image selection
- **IndexedDB:** Firebase SDK persistence
- **LocalStorage:** Future settings persistence (out of scope for this story)

**5. Component Communication:**
- **Pattern:** Props down, callbacks up
- **State Lifting:** Shared state in App component
- **Context:** Not used currently (may add in future)

---

## Development Context

### Relevant Existing Code

**Key Functions and Components to Reference:**

1. **main.tsx lines 71-135: Utility Functions**
   - `cleanJson()` - JSON extraction from Gemini responses
   - `parseStrictNumber()` - Number validation and parsing
   - `getSafeDate()` - Date validation with fallbacks
   - `formatCurrency()` - Intl.NumberFormat wrapper
   - `formatDate()` - Date formatting based on locale
   - `exportToCSV()` - CSV file generation
   - `generateColor()` - Consistent color generation for categories

2. **main.tsx lines 136-250: Gemini AI Integration**
   - `analyzeWithGemini()` - Main AI service function
   - Image to base64 conversion logic
   - JSON response parsing and validation
   - Error handling patterns

3. **main.tsx lines 251-621: Application Components**
   - MainApp component (container)
   - View components (LoginScreen, DashboardView, ScanView, etc.)
   - Chart components (SimplePieChart, GroupedBarChart)
   - Nav component with bottom navigation

4. **Firebase Initialization (lines 304-308):**
   - initializeApp() with config
   - getAuth() setup
   - getFirestore() setup
   - onAuthStateChanged listener

5. **Firestore Operations (lines 316-402):**
   - Real-time listener setup with onSnapshot
   - Transaction CRUD operations
   - Data transformation logic
   - Error handling and data repair

### Dependencies

**Framework/Libraries:**

**Production Dependencies:**
- `react@^18.2.0` - UI framework
- `react-dom@^18.2.0` - React DOM rendering
- `firebase@^10.7.1` - Backend services (Auth + Firestore)
- `lucide-react@^0.294.0` - Icon library

**Development Dependencies:**
- `@types/react@^18.2.43` - React TypeScript definitions
- `@types/react-dom@^18.2.17` - React DOM TypeScript definitions
- `@vitejs/plugin-react@^4.2.1` - Vite React plugin
- `typescript@^5.3.3` - TypeScript compiler
- `vite@^5.0.8` - Build tool and dev server
- `firebase-tools@^13.0.0` - Firebase CLI for deployment

**Internal Modules:**

After refactoring, these internal module dependencies will exist:

**Services Layer:**
- `services/firebase` - Firebase initialization
- `services/gemini` - Gemini AI API wrapper
- `services/firestore` - Firestore CRUD operations

**Utils Layer:**
- `utils/currency` - Currency formatting
- `utils/date` - Date handling
- `utils/csv` - CSV export
- `utils/color` - Color generation
- `utils/validation` - Data validation

**Hooks Layer:**
- `hooks/useAuth` - Authentication state management
- `hooks/useTransactions` - Firestore data sync

**Types Layer:**
- `types/index` - Shared TypeScript interfaces and types

### Configuration Changes

**New Configuration Files:**

1. **package.json** - Dependency and script management
2. **tsconfig.json** - TypeScript compiler configuration
3. **vite.config.ts** - Vite build settings
4. **.env** - Environment variables (git-ignored)
5. **.env.example** - Environment variable template
6. **firebase.json** - Firebase Hosting configuration
7. **.firebaserc** - Firebase project selection
8. **.gitignore** - Git exclusion rules

**Environment Variables to Configure:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

**Scripts to Add (package.json):**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

### Existing Conventions (Brownfield)

**Code Style (from main.tsx):**
- **Language:** TypeScript with JSX
- **Semicolons:** Yes (used consistently)
- **Quotes:** Single quotes for strings, double for JSX attributes
- **Indentation:** 4 spaces
- **Line Length:** ~100-120 characters (no strict limit)
- **Import Order:** External libraries first, then local imports

**Naming Conventions:**
- **Components:** PascalCase (e.g., `DashboardView`, `SimplePieChart`)
- **Functions:** camelCase (e.g., `formatCurrency`, `analyzeWithGemini`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `STORE_CATEGORIES`, `ITEMS_PER_PAGE`)
- **Interfaces/Types:** PascalCase with descriptive names
- **State Variables:** camelCase (e.g., `user`, `transactions`, `currentView`)

**Error Handling:**
- Try-catch blocks for async operations
- Error state variables for user-facing errors
- Console.error for debugging
- User-friendly error messages (no stack traces)

**Component Organization:**
- Props destructured in function parameters
- Early returns for loading/error states
- Event handlers defined before render
- JSX return statement last

**Firebase Patterns:**
- User-scoped data paths (`/artifacts/{appId}/users/{userId}/...`)
- Real-time listeners with cleanup
- serverTimestamp() for all timestamps
- Document IDs auto-generated by Firestore

### Test Framework & Standards

**Current State:**
- **No automated testing** - Manual browser testing only
- **No test framework** configured
- **No test files** exist

**Future Testing (Deferred to Separate Story):**
- Framework: Jest + React Testing Library (recommended)
- Test files: `*.test.tsx` or `*.spec.tsx` alongside components
- Coverage target: 70%+ for utils and services
- E2E testing: Playwright or Cypress (for critical flows)

**Manual Testing Checklist (Current Approach):**
- Authentication flow (sign in, sign out, persistence)
- Receipt scanning (image upload, AI processing, error handling)
- Transaction CRUD (create, read, update, delete)
- Analytics (charts, filters, drill-down, CSV export)
- Cross-browser testing (Chrome, Firefox, Safari)

---

## Implementation Stack

**Complete Technology Stack with Versions:**

**Runtime:**
- Node.js 18.x or higher (for development)
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**Frontend Framework:**
- React 18.2.0 - Component-based UI library
- React DOM 18.2.0 - DOM rendering

**Build Tools:**
- Vite 5.0.8 - Next-generation frontend tooling
- @vitejs/plugin-react 4.2.1 - React support for Vite
- TypeScript 5.3.3 - Type-safe JavaScript

**Backend Services:**
- Firebase Authentication 10.7.1 - User auth with Google OAuth
- Cloud Firestore 10.7.1 - NoSQL real-time database
- Firebase Hosting - Static file CDN hosting
- Firebase CLI 13.0.0 - Deployment tool

**AI/ML:**
- Google Gemini AI 2.5-flash-preview - Multimodal vision API (REST)

**UI Libraries:**
- Lucide React 0.294.0 - Icon library
- Tailwind CSS 3.x - Utility-first CSS (inline in HTML)

**Development Tools:**
- @types/react 18.2.43 - React type definitions
- @types/react-dom 18.2.17 - React DOM type definitions
- Git - Version control
- GitHub - Repository hosting

**Deployment Platform:**
- Firebase Hosting - Global CDN with HTTPS

---

## Technical Details

**Architecture Migration:**

**From:** Single-file SPA (main.tsx, 621 lines)
**To:** Modular Vite-based application with proper separation of concerns

**Key Technical Decisions:**

1. **Vite over Create React App or Next.js**
   - **Why:** Faster dev server, simpler configuration, better TypeScript support
   - **Trade-off:** Less opinionated than CRA, but more flexibility
   - **Alternative Considered:** CRA (too slow), Next.js (overkill for static app)

2. **Keep Firebase over Building Custom Backend**
   - **Why:** Already integrated, serverless, real-time sync works well
   - **Trade-off:** Vendor lock-in, but migration path exists if needed
   - **Alternative Considered:** Custom Node.js backend (unnecessary complexity)

3. **Custom Hooks Pattern for State Management**
   - **Why:** Simple, built-in, sufficient for current scale
   - **Trade-off:** No time-travel debugging or complex middleware
   - **Alternative Considered:** Redux (overkill), Zustand (unnecessary for current needs)

4. **Environment Variables for Config**
   - **Why:** Security best practice, enables multi-environment support later
   - **Trade-off:** Extra setup step for developers
   - **Alternative Considered:** Hardcoded config (insecure)

**Refactoring Approach - Component Extraction:**

Each component will be extracted following this template:

```tsx
// src/components/views/DashboardView.tsx
import React from 'react';
import { Transaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils';

interface DashboardViewProps {
    user: any;
    transactions: Transaction[];
    onScanClick: () => void;
    onAddClick: () => void;
    // ... other props
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    user,
    transactions,
    onScanClick,
    onAddClick
}) => {
    // Component logic extracted from main.tsx
    return (
        <div>
            {/* JSX extracted from main.tsx */}
        </div>
    );
};
```

**Data Flow Architecture:**

```
User Action
    ↓
Event Handler (View Component)
    ↓
Callback to App.tsx
    ↓
Service Layer (firebase/gemini)
    ↓
Hook Updates (useAuth/useTransactions)
    ↓
State Update in App.tsx
    ↓
Props to Child Components
    ↓
Re-render
```

**File Size Guidelines:**
- Utility files: < 100 lines each
- Service files: < 150 lines each
- Hook files: < 100 lines each
- View components: < 300 lines each
- Chart components: < 200 lines each

**TypeScript Type Definitions:**

```tsx
// src/types/index.ts
export interface Transaction {
    id?: string;
    merchant: string;
    alias?: string;
    category: string;
    date: string; // YYYY-MM-DD
    total: number;
    currency: 'CLP' | 'USD';
    items: TransactionItem[];
    timestamp?: any; // Firestore Timestamp
}

export interface TransactionItem {
    name: string;
    price: number;
    group: string;
    subcat: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'history' | 'settings';
export type Currency = 'CLP' | 'USD';
export type Language = 'es' | 'en';
export type Theme = 'light' | 'dark';
```

**Security Considerations:**

1. **API Key Protection:**
   - Move keys from source code to .env file
   - Add .env to .gitignore
   - Document key setup in .env.example
   - Future: Proxy Gemini calls through Cloud Function

2. **Firebase Security:**
   - Firestore rules already enforce user isolation
   - Auth domain restrictions in Firebase Console
   - API key restrictions by domain

3. **Build Output:**
   - Environment variables embedded at build time via Vite
   - Keys still visible in browser (acceptable for Firebase)
   - Monitor usage via Firebase Console quotas

**Performance Optimizations:**

1. **Build Optimizations (Vite Automatic):**
   - Tree-shaking removes unused code
   - Code splitting (if we add lazy loading later)
   - Minification and compression
   - Asset optimization

2. **Maintained Optimizations:**
   - Pagination (20 items per page)
   - Real-time sync (no polling)
   - Native SVG charts (no heavy library)

3. **Future Optimizations (Out of Scope):**
   - React.memo for chart components
   - Lazy loading for views
   - Service worker for offline support

---

## Development Setup

**Prerequisites:**
- Node.js 18.x or higher installed
- npm 9.x or higher (comes with Node.js)
- Git installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- GitHub account access to https://github.com/Brownbull/gmni_boletapp
- Firebase project credentials
- Google Gemini API key

**Initial Setup Steps:**

1. **Clone or navigate to project directory:**
   ```bash
   cd /home/khujta/projects/bmad/boletapp
   ```

2. **Install dependencies (after refactoring creates package.json):**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase and Gemini credentials
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Application will be available at `http://localhost:5173`

5. **Build for production:**
   ```bash
   npm run build
   ```
   Production build created in `dist/` directory

6. **Preview production build locally:**
   ```bash
   npm run preview
   ```

7. **Deploy to Firebase:**
   ```bash
   npm run deploy
   ```

**Environment Configuration:**

Create `.env` file in project root with:
```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

---

## Implementation Guide

### Setup Steps

**Pre-Implementation Checklist:**

1. ✅ **Backup existing code:**
   - main.tsx already backed up as main_ORIGINAL_GEMINI.tsx
   - Create additional backup: `cp main.tsx main_BEFORE_REFACTOR.tsx`

2. ✅ **Verify existing functionality:**
   - Open main.tsx in browser and test all features
   - Document any existing bugs or issues
   - Take screenshots of current UI

3. ✅ **Create Git repository:**
   - Initialize: `git init` (if not already initialized)
   - Add remote: `git remote add origin https://github.com/Brownbull/gmni_boletapp.git`

4. ✅ **Install Node.js and tools:**
   - Verify Node.js 18+: `node --version`
   - Install Firebase CLI: `npm install -g firebase-tools`
   - Login to Firebase: `firebase login`

5. ✅ **Gather credentials:**
   - Firebase config from Firebase Console
   - Gemini API key from Google AI Studio
   - GitHub repository access confirmed

### Implementation Steps

**Story 1: Refactor to Modular Structure**

1. Create new project structure (directories)
2. Initialize package.json and install dependencies
3. Configure TypeScript (tsconfig.json)
4. Configure Vite (vite.config.ts)
5. Extract utilities to src/utils/ (lowest risk)
6. Extract constants to src/config/constants.ts
7. Extract types to src/types/index.ts
8. Extract services (firebase, gemini, firestore)
9. Extract custom hooks (useAuth, useTransactions)
10. Create public/index.html template
11. Extract presentational components (charts, badges)
12. Extract view components (all views)
13. Create App.tsx (main container)
14. Create src/main.tsx (entry point)
15. Test refactored application thoroughly
16. Fix any import or runtime errors

**Story 2: Production-Ready Build Setup**

1. Create .env.example template
2. Create .env with actual credentials (git-ignored)
3. Create .gitignore file
4. Update services to use environment variables
5. Test build process: `npm run build`
6. Test production preview: `npm run preview`
7. Verify all features work in production build
8. Document build process in README.md

**Story 3: Git Repository Setup**

1. Review .gitignore (ensure .env, node_modules, dist excluded)
2. Stage all files: `git add .`
3. Create initial commit: `git commit -m "feat: refactor to modular structure with Vite"`
4. Set up main branch: `git branch -M main`
5. Push to GitHub: `git push -u origin main`
6. Verify code on GitHub web interface
7. Add repository description and README on GitHub

**Story 4: Firebase Deployment Infrastructure**

1. Initialize Firebase: `firebase init hosting`
   - Select existing Firebase project
   - Set public directory to: `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: No (manual for now)
2. Test deployment to staging: `firebase hosting:channel:deploy staging`
3. Verify staging deployment works
4. Review firebase.json configuration
5. Document deployment process

**Story 5: Deploy to Production**

1. Run final production build: `npm run build`
2. Test production build locally: `npm run preview`
3. Deploy to Firebase: `firebase deploy --only hosting`
4. Verify deployment URL from Firebase CLI output
5. Test deployed application thoroughly
6. Check Firebase Console for hosting details
7. Monitor for errors in Firebase Console
8. Document production URL and access instructions

### Testing Strategy

**Manual Testing Approach (No Automated Tests Yet):**

**After Each Story Completion:**

1. **Smoke Test:**
   - Application loads without errors
   - No console errors in browser devtools
   - All views navigate correctly

2. **Feature Testing:**
   - **Authentication:** Sign in, sign out, persistence across refresh
   - **Receipt Scanning:** Upload image, Gemini API processes correctly, data populates
   - **Transaction CRUD:** Create, edit, delete transactions
   - **Analytics:** Charts render, filters work, drill-down functions
   - **History:** Pagination works, search/filter functions
   - **Settings:** Language, currency, theme changes persist during session

3. **Cross-Browser Testing:**
   - Chrome/Edge (Chromium)
   - Firefox
   - Safari (if available)
   - Mobile browsers (Chrome Android, Safari iOS)

4. **Error Scenarios:**
   - Network offline (does app handle gracefully?)
   - Invalid API key (error message displays?)
   - Firestore permission denied (appropriate error?)
   - Gemini API failure (fallback to manual entry?)

**Regression Testing:**

After refactoring (Story 1), verify that **every feature** from original main.tsx still works:
- Create side-by-side comparison checklist
- Test old version, test new version
- Document any differences or bugs

**Performance Checks:**

- Page load time < 3 seconds
- Receipt scanning < 5 seconds
- Chart rendering instant
- No memory leaks (check devtools memory tab)

### Acceptance Criteria

**Story 1 - Refactor to Modular Structure:**
- ✅ All code from main.tsx extracted to modular structure
- ✅ src/ directory with proper folder organization (components, utils, hooks, services)
- ✅ No more single-file application
- ✅ TypeScript compilation succeeds with no errors
- ✅ Vite dev server runs successfully
- ✅ All existing functionality preserved (no feature regressions)
- ✅ Application runs identically to original main.tsx version
- ✅ No console errors in browser devtools
- ✅ Code is more maintainable (smaller files, clear responsibilities)

**Story 2 - Production-Ready Build:**
- ✅ package.json with all dependencies and scripts created
- ✅ Environment variables externalized to .env file
- ✅ .env.example template created and documented
- ✅ .gitignore properly excludes sensitive files
- ✅ `npm run build` completes successfully
- ✅ Production build in dist/ directory is optimized (minified, tree-shaken)
- ✅ `npm run preview` serves production build locally
- ✅ All features work in production build mode
- ✅ No hardcoded API keys in source code

**Story 3 - Git Repository Setup:**
- ✅ Git repository initialized
- ✅ .gitignore excludes node_modules, .env, dist, and build artifacts
- ✅ Initial commit includes all source code (not node_modules or .env)
- ✅ Repository pushed to https://github.com/Brownbull/gmni_boletapp
- ✅ README.md updated with new project structure and setup instructions
- ✅ Repository is accessible and viewable on GitHub
- ✅ Commit history is clean and meaningful

**Story 4 - Firebase Deployment Infrastructure:**
- ✅ Firebase CLI installed and authenticated
- ✅ `firebase init hosting` completed successfully
- ✅ firebase.json configured with correct settings (public: dist, SPA rewrites)
- ✅ .firebaserc created with project ID
- ✅ Staging deployment tested successfully
- ✅ Hosting configuration includes caching headers for assets
- ✅ Deployment process documented in README.md or DEPLOYMENT.md

**Story 5 - Deploy to Production:**
- ✅ Production build created and tested locally
- ✅ `firebase deploy --only hosting` succeeds
- ✅ Application accessible via Firebase Hosting URL
- ✅ All features work in deployed production environment
- ✅ HTTPS enabled automatically (Firebase default)
- ✅ Firebase Console shows hosting activity
- ✅ No errors in Firebase Console logs
- ✅ Production URL documented and shared with stakeholders
- ✅ Rollback procedure documented (in case of issues)

**Overall Epic Completion Criteria:**
- ✅ Application transformed from single-file prototype to production-ready modular app
- ✅ Code is maintainable, testable, and follows modern best practices
- ✅ Source code tracked in version control on GitHub
- ✅ Application deployed and accessible via Firebase Hosting
- ✅ Deployment pipeline established for future updates
- ✅ All documentation updated to reflect new architecture
- ✅ Zero feature regressions - all original functionality preserved

---

## Developer Resources

### File Paths Reference

**Complete List of All Files After Refactoring:**

**Configuration Files (Project Root):**
- `/package.json` - Dependencies and scripts
- `/tsconfig.json` - TypeScript configuration
- `/vite.config.ts` - Vite build configuration
- `/firebase.json` - Firebase Hosting configuration
- `/.firebaserc` - Firebase project settings
- `/.gitignore` - Git exclusion rules
- `/.env` - Environment variables (git-ignored)
- `/.env.example` - Environment variable template
- `/README.md` - Project documentation

**Source Code (src/):**
- `/src/main.tsx` - Application entry point
- `/src/App.tsx` - Root application component

**Components:**
- `/src/components/ErrorBoundary.tsx` - Error boundary wrapper
- `/src/components/common/CategoryBadge.tsx` - Category badge component
- `/src/components/common/Nav.tsx` - Bottom navigation
- `/src/components/views/LoginScreen.tsx` - Authentication view
- `/src/components/views/DashboardView.tsx` - Main dashboard
- `/src/components/views/ScanView.tsx` - Receipt scanning view
- `/src/components/views/EditView.tsx` - Transaction editor
- `/src/components/views/TrendsView.tsx` - Analytics/trends view
- `/src/components/views/HistoryView.tsx` - Transaction history
- `/src/components/views/SettingsView.tsx` - App settings
- `/src/components/charts/SimplePieChart.tsx` - Pie chart component
- `/src/components/charts/GroupedBarChart.tsx` - Bar chart component

**Hooks:**
- `/src/hooks/useAuth.ts` - Authentication hook
- `/src/hooks/useTransactions.ts` - Firestore data hook

**Services:**
- `/src/services/firebase.ts` - Firebase initialization
- `/src/services/gemini.ts` - Gemini AI service
- `/src/services/firestore.ts` - Firestore operations

**Utilities:**
- `/src/utils/currency.ts` - Currency formatting
- `/src/utils/date.ts` - Date utilities
- `/src/utils/csv.ts` - CSV export
- `/src/utils/color.ts` - Color generation
- `/src/utils/validation.ts` - Data validation

**Types:**
- `/src/types/index.ts` - TypeScript definitions

**Config:**
- `/src/config/constants.ts` - Application constants

**Public Assets:**
- `/public/index.html` - HTML template
- `/public/favicon.ico` - App icon

**Documentation (docs/):**
- `/docs/tech-spec.md` - This file
- `/docs/architecture.md` - Architecture documentation
- `/docs/project-overview.md` - Project overview
- `/docs/development-guide.md` - Development guide
- `/docs/component-inventory.md` - Component catalog
- `/docs/data-models.md` - Data models
- `/docs/api-contracts.md` - API documentation
- `/docs/deployment-guide.md` - Deployment guide

**Backup Files (Preserved):**
- `/main.tsx` - Original single-file app (reference)
- `/main_ORIGINAL_GEMINI.tsx` - Original backup

### Key Code Locations

**After Refactoring:**

**Authentication Logic:**
- Hook: `src/hooks/useAuth.ts` (Firebase Auth state management)
- Service: `src/services/firebase.ts:initializeAuth()` (Auth initialization)
- View: `src/components/views/LoginScreen.tsx` (Sign-in UI)

**Receipt Scanning:**
- Service: `src/services/gemini.ts:analyzeWithGemini()` (Gemini API call)
- View: `src/components/views/ScanView.tsx` (Image upload UI)
- Utility: `src/utils/validation.ts:cleanJson()` (JSON parsing)

**Transaction Management:**
- Service: `src/services/firestore.ts` (CRUD operations)
- Hook: `src/hooks/useTransactions.ts` (Real-time sync)
- View: `src/components/views/EditView.tsx` (Transaction editor)
- View: `src/components/views/HistoryView.tsx` (Transaction list)

**Analytics/Charts:**
- View: `src/components/views/TrendsView.tsx` (Analytics logic)
- Component: `src/components/charts/SimplePieChart.tsx` (Pie chart)
- Component: `src/components/charts/GroupedBarChart.tsx` (Bar chart)
- Utility: `src/utils/csv.ts:exportToCSV()` (CSV export)

**Data Formatting:**
- Utility: `src/utils/currency.ts:formatCurrency()` (Intl.NumberFormat)
- Utility: `src/utils/date.ts:formatDate()` (Date formatting)
- Utility: `src/utils/date.ts:getSafeDate()` (Date validation)

**Constants:**
- Config: `src/config/constants.ts` (STORE_CATEGORIES, ITEMS_PER_PAGE)

**Type Definitions:**
- Types: `src/types/index.ts` (Transaction, TransactionItem, etc.)

### Testing Locations

**Current State (No Test Files):**
- No test files exist yet
- Testing deferred to future story

**Future Test Structure (Recommended):**
```
src/
├── utils/
│   ├── currency.ts
│   └── currency.test.ts          # Unit tests for currency utils
├── services/
│   ├── gemini.ts
│   └── gemini.test.ts            # Unit tests for Gemini service
├── hooks/
│   ├── useAuth.ts
│   └── useAuth.test.ts           # Hook tests
├── components/
│   ├── charts/
│   │   ├── SimplePieChart.tsx
│   │   └── SimplePieChart.test.tsx  # Component tests
```

**Manual Testing:**
- Test in browser at `http://localhost:5173` (dev)
- Test production build via `npm run preview`
- Test deployed app via Firebase Hosting URL

### Documentation to Update

**Files to Update After Refactoring:**

1. **README.md** - Primary project documentation
   - Update with new project structure
   - Add setup instructions for Vite
   - Document npm scripts
   - Add deployment instructions

2. **docs/architecture.md**
   - Update from single-file to modular architecture
   - Document new folder structure
   - Update ADRs with new decisions

3. **docs/development-guide.md**
   - Update build process section
   - Add Vite development server instructions
   - Update testing approach

4. **docs/component-inventory.md**
   - Update file paths for all components
   - Add new custom hooks section

5. **docs/deployment-guide.md**
   - Add Vite build process
   - Update Firebase deployment steps
   - Document environment variable setup

6. **docs/source-tree-analysis.md** (if exists)
   - Complete rewrite for new structure

7. **docs/project-overview.md**
   - Update architecture pattern section
   - Update repository structure diagram

8. **docs/api-contracts.md**
   - Update code examples with new import paths

**New Documentation to Create:**

1. **DEPLOYMENT.md** (optional)
   - Step-by-step deployment guide
   - Rollback procedures
   - Troubleshooting

2. **CONTRIBUTING.md** (optional, future)
   - Code style guide
   - PR process
   - Development workflow

---

## UX/UI Considerations

**No UI/UX Changes:**

This refactoring is **purely structural** - no user-facing changes.

**User Experience Impact:**
- **Visual:** Zero changes - UI looks identical
- **Functionality:** Zero changes - all features work the same
- **Performance:** Potentially improved (Vite optimizations)
- **Loading:** May be slightly faster due to code splitting and optimization

**Development Experience Improvements:**
- Easier to find and modify specific components
- Better IDE support (autocomplete, go-to-definition)
- Clearer code organization
- Faster development with Vite HMR

**Accessibility:**
- No changes - existing accessibility preserved
- Future: Easier to add accessibility features with modular structure

**Responsive Design:**
- No changes - existing responsive design preserved
- Tailwind CSS classes maintained

**Browser Compatibility:**
- No changes - same browser support as before
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)

---

## Testing Approach

**Manual Testing (Primary Approach):**

**Regression Testing Checklist:**

After refactoring, test every feature against original main.tsx:

1. **Authentication:**
   - [ ] Sign in with Google works
   - [ ] User state persists across page refresh
   - [ ] Sign out clears user data
   - [ ] Protected routes redirect to login when not authenticated

2. **Receipt Scanning:**
   - [ ] Camera/file upload button works
   - [ ] Multiple images can be selected
   - [ ] Images preview correctly
   - [ ] Gemini API processes images
   - [ ] Extracted data populates transaction form
   - [ ] Error handling shows user-friendly messages

3. **Transaction CRUD:**
   - [ ] Create new transaction manually
   - [ ] Edit existing transaction
   - [ ] Delete transaction
   - [ ] All fields save correctly to Firestore
   - [ ] Real-time sync updates UI

4. **Item Management:**
   - [ ] Add items to transaction
   - [ ] Edit item details (name, price, group, subcat)
   - [ ] Delete items from transaction
   - [ ] Items save with transaction

5. **Analytics/Trends:**
   - [ ] Pie chart renders correctly
   - [ ] Bar chart renders correctly
   - [ ] Toggle between chart types
   - [ ] Drill-down navigation (year → month → category)
   - [ ] Filters apply correctly
   - [ ] CSV export generates valid file

6. **History:**
   - [ ] Transaction list displays
   - [ ] Pagination works (20 per page)
   - [ ] Edit transaction from history
   - [ ] Delete transaction from history

7. **Settings:**
   - [ ] Language toggle (es/en)
   - [ ] Currency toggle (CLP/USD)
   - [ ] Theme toggle (light/dark)
   - [ ] Factory reset works

**Build Testing:**

1. **Development Build:**
   ```bash
   npm run dev
   # Test at http://localhost:5173
   ```
   - [ ] Hot Module Replacement works
   - [ ] No console errors
   - [ ] All features functional

2. **Production Build:**
   ```bash
   npm run build
   npm run preview
   # Test at http://localhost:4173
   ```
   - [ ] Build succeeds without errors
   - [ ] Preview serves correctly
   - [ ] All features functional in production mode
   - [ ] No console errors

**Deployment Testing:**

1. **Firebase Hosting:**
   ```bash
   firebase deploy --only hosting
   ```
   - [ ] Deployment succeeds
   - [ ] Application accessible via Firebase URL
   - [ ] All features work in deployed environment
   - [ ] HTTPS works
   - [ ] No CORS issues

**Performance Testing:**

- [ ] Initial page load < 3 seconds
- [ ] Time to interactive < 3 seconds
- [ ] Receipt scanning completes < 5 seconds
- [ ] Chart rendering is instant
- [ ] No memory leaks (check Chrome DevTools)

---

## Deployment Strategy

### Deployment Steps

**Initial Deployment (First Time):**

1. **Prepare Production Build:**
   ```bash
   npm run build
   ```
   - Vite creates optimized build in `dist/`
   - TypeScript compiled to JavaScript
   - Assets minified and optimized

2. **Initialize Firebase Hosting:**
   ```bash
   firebase login
   firebase init hosting
   ```
   - Select existing Firebase project
   - Set public directory: `dist`
   - Configure as single-page app: Yes
   - Don't overwrite index.html

3. **Deploy to Firebase:**
   ```bash
   firebase deploy --only hosting
   ```
   - Uploads dist/ folder to Firebase CDN
   - Returns deployment URL
   - Typically: `https://PROJECT_ID.web.app`

4. **Verify Deployment:**
   - Open deployment URL in browser
   - Test all critical features
   - Check Firebase Console > Hosting for activity

**Subsequent Deployments:**

```bash
npm run deploy
```
This single command:
1. Runs `npm run build` (creates production build)
2. Runs `firebase deploy --only hosting` (deploys to Firebase)

**Alternative: Manual Deployment:**

```bash
npm run build
firebase deploy --only hosting
```

**Staging Deployment (Optional):**

```bash
npm run build
firebase hosting:channel:deploy staging
```
- Creates temporary staging URL
- Test before production deployment
- Expires after 7 days (default)

### Rollback Plan

**If Deployment Has Issues:**

**Option 1: Firebase Console Rollback (Recommended)**
1. Go to Firebase Console > Hosting
2. Find previous successful deployment
3. Click three-dot menu > "Rollback"
4. Confirm rollback
5. Verify application works

**Option 2: Redeploy Previous Version**
1. Git checkout previous commit:
   ```bash
   git checkout <previous-commit-hash>
   ```
2. Build and deploy:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```
3. Return to latest code:
   ```bash
   git checkout main
   ```

**Option 3: Emergency Rollback via Git**
1. Revert problematic commit:
   ```bash
   git revert <bad-commit-hash>
   git push origin main
   ```
2. Redeploy:
   ```bash
   npm run deploy
   ```

**Rollback Testing:**
- Always test rollback procedure in staging first
- Document which deployment version is known-good
- Keep deployment history in Firebase Console

### Monitoring

**Firebase Console Monitoring:**

1. **Hosting Activity:**
   - Console > Hosting > Dashboard
   - View deployment history
   - Monitor bandwidth usage
   - Check request counts

2. **Performance Monitoring (Future):**
   - Console > Performance
   - Page load times
   - Network latency
   - User experience metrics

3. **Firestore Usage:**
   - Console > Firestore Database > Usage
   - Read/write counts
   - Storage used
   - Monitor for quota limits

4. **Authentication:**
   - Console > Authentication > Users
   - Active user count
   - Sign-in methods usage

**Application Monitoring:**

1. **Browser Console:**
   - Check for JavaScript errors
   - Monitor network requests
   - Watch for failed API calls

2. **Gemini API Usage:**
   - Google Cloud Console > APIs & Services
   - Monitor API quota usage
   - Set billing alerts
   - Track request counts

3. **Error Tracking (Future Enhancement):**
   - Consider: Sentry, LogRocket, or Firebase Crashlytics
   - Track client-side errors
   - User session replay

**Key Metrics to Monitor:**

- **Uptime:** Should be 99.9%+ (Firebase SLA)
- **Page Load Time:** Target < 3 seconds
- **API Success Rate:** Gemini API > 95%
- **Firestore Read/Write Quota:** Monitor for free tier limits
- **User Growth:** Track active users
- **Deployment Frequency:** How often deploying

**Alert Thresholds:**

- API errors > 5% → Investigate immediately
- Page load > 5 seconds → Performance issue
- Firestore quota at 80% → Consider upgrade
- Any deployment rollback → Post-mortem required

**Monitoring Tools:**

- **Firebase Console:** Primary monitoring dashboard
- **Google Cloud Console:** Gemini API and advanced metrics
- **Browser DevTools:** Development and debugging
- **Lighthouse:** Performance audits (run monthly)
