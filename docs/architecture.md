# Architecture Document - Boletapp

## Executive Summary

Boletapp is a Progressive Web Application (PWA) for expense tracking with AI-powered receipt scanning. Built as a single-file React application, it emphasizes simplicity and rapid deployment while leveraging cloud services for authentication, storage, and machine learning.

**Key Architectural Decisions:**
- **Single-File Architecture** - Entire app in one 621-line `main.tsx` file
- **Serverless Backend** - Firebase handles auth, database, and hosting
- **AI Integration** - Google Gemini API for receipt OCR and data extraction
- **Real-time Sync** - Firestore listeners for instant data updates
- **Progressive Enhancement** - Works offline with cached data

**Target Users:** Individuals and families tracking household expenses
**Primary Use Case:** Scan receipts → Auto-categorize → Analyze spending patterns

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.x | UI framework |
| | TypeScript/JSX | ES6+ | Component syntax |
| | Lucide React | Latest | Icon library |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS (via CDN) |
| **State Management** | React Hooks | Built-in | `useState`, `useEffect`, `useRef` |
| **Authentication** | Firebase Auth | 10.x | Google OAuth 2.0 |
| **Database** | Cloud Firestore | 10.x | NoSQL document store |
| **AI/ML** | Google Gemini | 2.5-flash | Multimodal vision API |
| **Deployment** | Firebase Hosting | N/A | Static file hosting |
| **Build Tool** | None | N/A | No build step required |

---

## Architecture Pattern

### Single-File SPA (Single-Page Application)

**Definition:** All application code (components, logic, utilities) exists in one file (`main.tsx`) that runs directly in the browser.

**Benefits:**
- **Zero Build Complexity** - No webpack, rollup, or bundler configuration
- **Instant Development** - Edit → Save → Refresh workflow
- **Easy Deployment** - Upload one file to any static host
- **Self-Contained** - No dependency management or version conflicts

**Trade-offs:**
- **Scalability Limit** - Becomes unwieldy beyond ~1000 lines
- **Code Organization** - Harder to navigate than multi-file projects
- **Collaboration** - Merge conflicts more likely with one file
- **Testing** - Requires extracting components to test in isolation

**When This Pattern Works:**
- MVP/prototype projects
- Small teams (1-3 developers)
- Apps with <20 components
- Projects prioritizing speed over structure

---

## Component Architecture

### Component Hierarchy

```
App (Root)
├── ErrorBoundary (Class)
│   └── MainApp (Functional)
│       ├── LoginScreen (Conditional)
│       ├── DashboardView (Conditional)
│       ├── ScanView (Conditional)
│       ├── EditView (Conditional)
│       ├── TrendsView (Conditional)
│       │   ├── SimplePieChart
│       │   └── GroupedBarChart
│       ├── HistoryView (Conditional)
│       ├── SettingsView (Conditional)
│       └── Nav (Always Rendered)
│           └── CategoryBadge (Reusable)
```

### Component Responsibilities

**Separation of Concerns:**
- **Presentational Components** - Pure rendering (charts, badges)
- **Container Components** - State management and logic (`MainApp`)
- **View Components** - Page-level sections (inline JSX)
- **Utility Functions** - Pure functions (formatting, parsing)

**Example: SimplePieChart (Presentational)**
- Receives data via props
- No internal state
- Calls `onSliceClick` callback for interactions
- Theme-aware styling

**Example: MainApp (Container)**
- Manages 20+ state variables
- Handles Firebase subscriptions
- Orchestrates API calls
- Passes data to child components

---

## Data Flow

### Unidirectional Data Flow

```
User Action → Event Handler → State Update → Component Re-render → DOM Update
     ↑                                                                   ↓
     └─────────────────── Optional Callback ──────────────────────────┘
```

**Example: Scan Workflow**
```
[User clicks Scan]
    ↓
triggerScan() sets view='scan'
    ↓
MainApp re-renders with ScanView
    ↓
[User selects image]
    ↓
handleFileSelect() updates scanImages state
    ↓
ScanView shows image preview
    ↓
[User clicks Process]
    ↓
processScan() calls Gemini API
    ↓
API response → setCurrentTransaction()
    ↓
setView('edit') → EditView renders with pre-filled data
```

### State Management Strategy

**No External State Library** - All state managed by React Hooks

**State Categories:**

1. **Authentication State**
   ```javascript
   const [user, setUser] = useState(null);
   const [services, setServices] = useState(null);
   ```
   - Source: Firebase `onAuthStateChanged` listener
   - Lifetime: Session-persistent (survives refresh)

2. **UI State**
   ```javascript
   const [view, setView] = useState('dashboard');
   const [editingItemIndex, setEditingItemIndex] = useState(null);
   ```
   - Source: User interactions
   - Lifetime: Component-scoped (lost on refresh)

3. **Data State**
   ```javascript
   const [transactions, setTransactions] = useState([]);
   ```
   - Source: Firestore `onSnapshot` listener
   - Lifetime: Real-time sync (updates automatically)

4. **Settings State**
   ```javascript
   const [lang, setLang] = useState('es');
   const [currency, setCurrency] = useState('CLP');
   const [theme, setTheme] = useState('light');
   ```
   - Source: User preferences
   - Lifetime: Component-scoped (reset on refresh)
   - **Enhancement Opportunity:** Persist to localStorage

### Props vs. State

**Rule:** Props flow down, events flow up.

```jsx
// Parent passes data down
<SimplePieChart
    data={pieData}
    theme={theme}
    onSliceClick={(label) => setSelectedCategory(label)}
/>

// Child calls callback up
const SimplePieChart = ({ data, theme, onSliceClick }) => {
    return (
        <path onClick={() => onSliceClick(slice.label)} />
    );
};
```

---

## State Management

### React Hooks Used

| Hook | Count | Purpose |
|------|-------|---------|
| `useState` | 20+ | Local state variables |
| `useEffect` | 2 | Firebase initialization and data sync |
| `useRef` | 1 | File input DOM reference |

### Effect Lifecycle

**Effect 1: Firebase Initialization**
```javascript
useEffect(() => {
    // Runs once on mount
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    setServices({ auth, db, appId });

    onAuthStateChanged(auth, setUser);
}, []); // Empty dependency array
```

**Effect 2: Firestore Listener**
```javascript
useEffect(() => {
    if (!user || !services) return;

    const q = collection(db, 'artifacts', appId, 'users', user.uid, 'transactions');
    const unsubscribe = onSnapshot(q, (snap) => {
        setTransactions(snap.docs.map(/* ... */));
    });

    return unsubscribe; // Cleanup on unmount
}, [user, services]); // Re-run when user or services change
```

### State Derivation

**Pattern:** Compute derived state in render (don't store it)

```javascript
// ❌ Bad: Storing derived data
const [totalSpent, setTotalSpent] = useState(0);
useEffect(() => {
    setTotalSpent(transactions.reduce((a, b) => a + b.total, 0));
}, [transactions]);

// ✅ Good: Computing on demand
const totalSpent = transactions.reduce((a, b) => a + b.total, 0);
```

**Benefits:**
- No sync issues
- Less state to manage
- Simpler code

**Complex Derivation:**
`getTrendsData()` function (lines 424-469) computes analytics data:
- Filters transactions by date/category
- Aggregates spending by category
- Formats data for charts
- Returns `{ pieData, barData, total, filteredTrans }`

Called every render, but only when `transactions` or filters change.

---

## External Integrations

### Firebase Authentication

**Provider:** Google OAuth 2.0
**Flow:** Popup-based sign-in

```
[User clicks "Sign in with Google"]
    ↓
signInWithPopup() opens OAuth popup
    ↓
User selects Google account
    ↓
Firebase Auth token received
    ↓
onAuthStateChanged fires → setUser()
    ↓
App renders authenticated UI
```

**Session Persistence:**
- Token stored in IndexedDB
- Auto-refresh every hour
- Survives browser restarts

**Security:**
- Firestore rules enforce user isolation
- API keys restricted to authorized domains

### Firebase Firestore

**Architecture:** NoSQL document database
**Data Model:** Hierarchical collections

```
/artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

**Real-time Sync:**
```javascript
onSnapshot(query, (snapshot) => {
    // Fires immediately with existing data
    // Fires again on any create/update/delete
});
```

**Benefits:**
- No polling required
- Instant updates across devices
- Offline support (local cache)

**Query Performance:**
- All queries scoped by `userId` (indexed automatically)
- No complex joins or aggregations
- Suitable for <10,000 transactions per user

### Google Gemini AI

**API:** REST-based multimodal AI
**Model:** `gemini-2.5-flash-preview-09-2025`

**Request Format:**
```json
{
    "contents": [{
        "parts": [
            { "text": "Analyze receipt..." },
            { "inlineData": {
                "mimeType": "image/jpeg",
                "data": "<base64>"
            }}
        ]
    }]
}
```

**Response Parsing:**
1. Extract text from `candidates[0].content.parts[0].text`
2. Strip markdown formatting with `cleanJson()`
3. Parse JSON to object
4. Validate and sanitize fields

**Error Handling:**
- Network errors → Show "Retry" button
- API errors → Display error message
- Invalid JSON → Log error, show manual entry option

---

## Security Model

### Authentication

**Method:** Firebase Authentication with Google OAuth

**Security Features:**
- No password storage (delegated to Google)
- Token-based sessions (JWT)
- Automatic token refresh
- Device-level persistence

### Authorization

**Firestore Security Rules:**
```javascript
match /artifacts/{appId}/users/{userId}/transactions/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

**Rule Breakdown:**
- `request.auth != null` → User must be signed in
- `request.auth.uid == userId` → User can only access own data
- `{document=**}` → Applies to all sub-documents

**Client-Side Enforcement:**
- All queries include `user.uid` in path
- Prevents accidental cross-user access

### API Key Security

**Current Implementation:** API keys hardcoded in source

**Risks:**
- Keys visible in browser devtools
- Quota abuse by malicious users
- API key scraping from hosted site

**Mitigations:**
1. **Firebase Security Rules** - Limit database access
2. **API Key Restrictions** - Whitelist domains in Google Cloud Console
3. **Quota Monitoring** - Set billing alerts
4. **App Check** (recommended) - Verify requests from legitimate app

**Future Enhancement:** Proxy Gemini API calls through Firebase Functions to hide API key

### Data Privacy

**User Data:**
- Scoped by Firebase UID (impossible to guess)
- No cross-user queries possible
- Not shared with third parties

**Image Data:**
- Sent to Gemini API (Google processes and deletes per terms)
- Not stored in Firestore
- Temporarily cached in browser memory

**GDPR Compliance:**
- User can delete all data via "Factory Reset"
- Google's privacy policy applies to auth/storage

---

## Error Handling Strategy

### Layered Error Handling

**Layer 1: Error Boundary (React)**
```jsx
<ErrorBoundary>
    {/* Catches all React rendering errors */}
</ErrorBoundary>
```
- Displays error screen with reload button
- Prevents white screen of death

**Layer 2: Try-Catch (API Calls)**
```javascript
try {
    await analyzeWithGemini(images, currency);
} catch (e) {
    setScanError("Failed: " + e.message);
}
```
- Graceful degradation
- User-friendly error messages

**Layer 3: Data Validation (Input Sanitization)**
```javascript
// Ensures numbers are always integers
const total = parseStrictNumber(input);

// Ensures dates are always valid
const date = getSafeDate(input);
```
- Prevents malformed data from entering system
- Auto-repairs corrupted data on read

**Layer 4: Defensive Programming**
```javascript
// Always check for null/undefined
if (!user || !services) return;

// Provide default values
const items = Array.isArray(data.items) ? data.items : [];
```

### Error UX

**Scan Errors:**
- Red text below scan button
- "Retry" option available
- Manual entry as fallback

**Network Errors:**
- Firebase SDK auto-retries
- User sees "Connecting..." message
- Works offline with cached data

**Validation Errors:**
- Real-time validation (e.g., date picker prevents invalid dates)
- Silent corrections (e.g., negative numbers → 0)

---

## Performance Optimizations

### Current Optimizations

1. **Single HTTP Request**
   - All code in one file → One download
   - No bundle splitting needed

2. **Real-time Subscriptions**
   - No polling overhead
   - Firestore pushes changes via WebSocket

3. **Pagination**
   - History view shows 20 items per page
   - Prevents DOM bloat with large datasets

4. **Native SVG Charts**
   - No heavy charting library (e.g., Chart.js)
   - Renders with browser's native SVG engine

5. **Lazy Data Computation**
   - `getTrendsData()` only runs when needed
   - Filters applied on-demand

6. **Strict Number Parsing**
   - Converts strings to integers early
   - Avoids repeated type coercion

### Performance Bottlenecks

**Identified Issues:**
- Large transaction lists (>500) cause slow renders
- Gemini API calls take 2-4 seconds (user must wait)
- Re-renders entire `MainApp` on any state change

**Optimization Opportunities:**
1. **React.memo** - Memoize chart components
2. **Virtualization** - Render only visible transactions
3. **Web Workers** - Offload data processing
4. **Service Worker** - Cache Gemini responses
5. **Code Splitting** - Load views on-demand (requires build step)

---

## Deployment Architecture

### Hosting Options

**Option 1: Firebase Hosting (Recommended)**
```bash
firebase deploy --only hosting
```
- **CDN:** Global edge caching
- **HTTPS:** Free SSL certificate
- **Custom Domain:** Map your domain
- **Rollback:** One-click previous version

**Option 2: Static Hosting**
- Netlify, Vercel, GitHub Pages, AWS S3
- Upload `main.tsx` + index.html
- Configure HTTPS (required for PWA features)

### Build Pipeline

**Vite 5.x with TypeScript** - Modern build tooling

```bash
# Development
npm run dev        # Start dev server with HMR

# Production
npm run build      # Outputs optimized bundle to dist/
npm run preview    # Preview production build locally
```

**Deployment Checklist:**
1. ✅ Firebase config added to `.env`
2. ✅ Gemini API key added to `.env`
3. ✅ Firestore security rules deployed
4. ✅ Authentication providers enabled
5. ✅ Domain whitelisted in Firebase Console
6. ✅ Git repository initialized and pushed to GitHub

### Environment Configuration

**Environment Variables via `.env`**
- `.env` - Local credentials (git-ignored)
- `.env.example` - Template with placeholders (committed)
- Access via `import.meta.env.VITE_*`

**Required Variables:**
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_GEMINI_API_KEY=
```

### Version Control

**Repository:** https://github.com/Brownbull/gmni_boletapp

**Git Workflow:**
```bash
git clone https://github.com/Brownbull/gmni_boletapp.git
cd gmni_boletapp
npm install
cp .env.example .env
# Configure .env with credentials
npm run dev
```

---

## Scalability Considerations

### Current Limits

| Resource | Limit | Mitigation |
|----------|-------|------------|
| Firestore reads | 50,000/day (free tier) | Enable caching |
| Gemini API calls | 60/minute (free tier) | Add rate limiting |
| Browser memory | ~500MB | Paginate transactions |
| File size | 621 lines | Refactor if grows beyond 1000 lines |

### Scaling Strategy

**Vertical Scaling (More features in one file):**
- Acceptable up to ~1000 lines
- Beyond that, architecture refactor required

**Horizontal Scaling (More users):**
- Firebase scales automatically
- No server infrastructure to manage
- Firestore supports millions of users

**Data Scaling (More transactions per user):**
- Current design works for <10,000 transactions
- Beyond that:
  - Add Firestore indexes for complex queries
  - Implement data archiving (move old transactions to cold storage)
  - Use Firestore query cursors for efficient pagination

---

## Testing Strategy

### Current State

**No Automated Tests**
- No unit tests
- No integration tests
- No end-to-end tests

**Manual Testing Approach:**
1. Load app in browser
2. Click through all views
3. Test scan with sample receipt
4. Verify Firestore writes in console
5. Test cross-browser compatibility

### Recommended Testing Approach

**For MVP Stage:**
- Manual testing sufficient
- Focus on core user flows
- Test on target devices (mobile browsers)

**For Production Stage:**
1. **Unit Tests** (Jest + React Testing Library)
   - Test utility functions (`parseStrictNumber`, `getSafeDate`)
   - Test color generation functions
   - Test data validation logic

2. **Component Tests**
   - Extract components to separate files
   - Test props → render output
   - Test click handlers

3. **Integration Tests** (Playwright/Cypress)
   - Test full scan workflow
   - Test authentication flow
   - Test data persistence

**Testing Challenges:**
- Single-file architecture makes mocking difficult
- Firebase and Gemini dependencies require emulators

---

## Future Architecture Improvements

### Short-Term (MVP → v1.0)

1. **Persistent Settings**
   ```javascript
   useEffect(() => {
       localStorage.setItem('settings', JSON.stringify({ lang, currency, theme }));
   }, [lang, currency, theme]);
   ```

2. **Service Worker (PWA)**
   - Cache app for offline use
   - Background sync for pending transactions

3. **Loading States**
   - Skeleton screens while data loads
   - Progress indicators for long operations

### Medium-Term (v1.0 → v2.0)

1. **Multi-File Architecture**
   ```
   src/
   ├── components/
   │   ├── Nav.tsx
   │   ├── charts/
   │   └── views/
   ├── utils/
   ├── hooks/
   └── App.tsx
   ```

2. **State Management Library** (Zustand or Jotai)
   - Centralized state
   - Better debugging

3. **Backend Proxy**
   - Firebase Cloud Function to call Gemini
   - Hides API key from client

### Long-Term (v2.0+)

1. **Real Backend** (Node.js + Express)
   - Custom business logic
   - Advanced analytics
   - Admin dashboard

2. **Mobile Apps** (React Native)
   - Share codebase with web
   - Native camera integration

3. **Multi-User Features**
   - Shared households
   - Budget collaboration

---

## Architecture Decision Records (ADRs)

### ADR-001: Single-File Architecture

**Decision:** Build entire app in one `main.tsx` file
**Context:** MVP for personal use, need rapid iteration
**Consequences:**
- ✅ Fast development
- ✅ Easy deployment
- ❌ Limited scalability
- ❌ Hard to test

**Status:** Accepted for MVP, revisit at 1000 lines

---

### ADR-002: Firebase as Backend

**Decision:** Use Firebase for auth and database
**Context:** No backend development resources
**Consequences:**
- ✅ Zero infrastructure management
- ✅ Real-time sync out of box
- ❌ Vendor lock-in
- ❌ Limited query capabilities

**Status:** Accepted, migration path exists if needed

---

### ADR-003: Gemini AI for OCR

**Decision:** Use Gemini 2.5 Flash instead of traditional OCR
**Context:** Need structured data extraction, not just text
**Consequences:**
- ✅ Intelligent parsing (handles tables, multi-column)
- ✅ Category classification included
- ❌ API cost (though minimal)
- ❌ Network dependency

**Status:** Accepted, manual entry available as fallback

---

### ADR-004: Vite Build Pipeline

**Decision:** Migrate from no-build to Vite 5.x with TypeScript
**Context:** Need proper TypeScript support, faster HMR, and production optimization
**Consequences:**
- ✅ TypeScript type checking enabled
- ✅ Hot Module Replacement (HMR) for fast development
- ✅ Optimized production builds with tree-shaking
- ✅ Environment variable support via import.meta.env
- ❌ Requires node_modules and npm install

**Status:** Accepted (Epic 1, Story 1.1)

---

### ADR-005: Git Version Control with GitHub

**Decision:** Initialize Git repository and host on GitHub
**Context:** Need version control for collaboration, backup, and deployment automation
**Consequences:**
- ✅ Full commit history and code backup
- ✅ Collaboration-ready with branch workflows
- ✅ GitHub Actions CI/CD integration possible
- ✅ Easy rollback to previous versions
- ❌ Requires Git knowledge for team members

**Repository:** https://github.com/Brownbull/gmni_boletapp
**Branch Strategy:** Main branch for production-ready code
**Status:** Accepted (Epic 1, Story 1.3)

### ADR-006: Production Deployment with Firestore Security Rules

**Decision:** Deploy to Firebase Hosting with mandatory Firestore security rules
**Context:** Production deployment requires data persistence, user isolation, and secure access control
**Consequences:**
- ✅ Production app live at https://boletapp-d609f.web.app
- ✅ HTTPS automatically enabled by Firebase CDN
- ✅ User data isolated via security rules pattern
- ✅ Global CDN distribution for fast loading
- ✅ One-click rollback capability in Firebase Console
- ⚠️ Firestore rules required or data access denied by default
- ❌ Cold start latency for Firestore connections

**Security Model:**
```
/artifacts/{appId}/users/{userId}/**
  → allow read, write: if request.auth.uid == userId
```

**Deployment Process:**
1. Build: `npm run build` → creates optimized dist/
2. Deploy Hosting: `firebase deploy --only hosting`
3. Deploy Rules: `firebase deploy --only firestore:rules` (critical!)
4. Verify: Test all features in production
5. Monitor: Firebase Console for errors and metrics

**Production URL:** https://boletapp-d609f.web.app
**Deployment Date:** 2025-11-21
**Status:** Accepted (Epic 1, Story 1.5)

**Critical Learning:** Firestore security rules MUST be deployed alongside the application. Without rules, Firestore denies all access by default, causing data persistence failures. Always include `firestore:rules` in initial deployment.

---

## Conclusion

Boletapp's architecture prioritizes **simplicity and speed** over enterprise-grade structure. The single-file SPA pattern enables rapid iteration and deployment, making it ideal for MVP development and small-scale applications.

**Key Strengths:**
- Zero infrastructure complexity
- Real-time data sync
- AI-powered automation
- Progressive enhancement

**Known Limitations:**
- Limited scalability beyond 1000 lines of code
- Manual testing only
- Client-side API key exposure
- No offline-first design

**Recommended Evolution Path:**
```
MVP (Current) → Multi-file SPA → Full-stack App → Mobile Apps
```

This architecture is appropriate for the current stage (MVP) and provides clear paths forward as requirements grow.

---

**Generated by BMAD Document Project Workflow**
*Date: 2025-11-20*
