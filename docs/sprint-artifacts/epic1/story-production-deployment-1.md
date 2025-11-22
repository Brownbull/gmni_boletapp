# Story 1.1: Refactor to Modular Architecture

**Status:** Draft

---

## User Story

As a developer,
I want the single-file application refactored into a modular component structure,
So that the codebase is maintainable, testable, and follows modern development practices.

---

## Acceptance Criteria

**AC #1:** All code from main.tsx extracted into logical modules
- Utilities in src/utils/ (currency.ts, date.ts, csv.ts, color.ts, validation.ts)
- Services in src/services/ (firebase.ts, gemini.ts, firestore.ts)
- Hooks in src/hooks/ (useAuth.ts, useTransactions.ts)
- Components in src/components/ (views/, charts/, common/)
- Types in src/types/index.ts
- Constants in src/config/constants.ts

**AC #2:** Vite development server runs successfully
- `npm run dev` starts server at localhost:5173
- Hot Module Replacement (HMR) works for code changes
- No build errors or warnings

**AC #3:** TypeScript compilation succeeds with no errors
- `tsc` command completes without errors
- All imports resolve correctly
- Type definitions are properly exported and imported

**AC #4:** All existing features work identically to original main.tsx
- Authentication (Google Sign-in, sign-out, session persistence)
- Receipt scanning (image upload, Gemini API processing)
- Transaction CRUD (create, read, update, delete)
- Analytics/Trends (charts, drill-down, CSV export)
- History (pagination, editing, deletion)
- Settings (language, currency, theme toggles)

**AC #5:** No console errors in browser devtools during normal operation
- No runtime errors
- No warning messages
- Clean console during all user flows

---

## Implementation Details

### Tasks / Subtasks

- [ ] Create project structure directories (src/components/, src/utils/, src/hooks/, src/services/, src/types/, src/config/, public/) (AC: #1)
- [ ] Initialize package.json with dependencies (react, react-dom, firebase, lucide-react) and devDependencies (vite, typescript, @vitejs/plugin-react) (AC: #2)
- [ ] Create tsconfig.json with appropriate TypeScript configuration (AC: #3)
- [ ] Create vite.config.ts with React plugin configuration (AC: #2)
- [ ] Extract utility functions to src/utils/:
  - [ ] currency.ts (formatCurrency function) (AC: #1, #4)
  - [ ] date.ts (formatDate, getSafeDate functions) (AC: #1, #4)
  - [ ] csv.ts (exportToCSV function) (AC: #1, #4)
  - [ ] color.ts (generateColor function) (AC: #1, #4)
  - [ ] validation.ts (cleanJson, parseStrictNumber functions) (AC: #1, #4)
- [ ] Extract constants to src/config/constants.ts (STORE_CATEGORIES, ITEMS_PER_PAGE) (AC: #1)
- [ ] Create TypeScript type definitions in src/types/index.ts (Transaction, TransactionItem, FirebaseConfig, View, Currency, Language, Theme) (AC: #1, #3)
- [ ] Extract services to src/services/:
  - [ ] firebase.ts (Firebase initialization) (AC: #1, #4)
  - [ ] gemini.ts (analyzeWithGemini function) (AC: #1, #4)
  - [ ] firestore.ts (CRUD operations wrapper) (AC: #1, #4)
- [ ] Extract custom hooks to src/hooks/:
  - [ ] useAuth.ts (Firebase Auth state management) (AC: #1, #4)
  - [ ] useTransactions.ts (Firestore data sync with real-time listeners) (AC: #1, #4)
- [ ] Create public/index.html template with proper meta tags and Tailwind CSS CDN (AC: #1, #2)
- [ ] Extract presentational components:
  - [ ] src/components/ErrorBoundary.tsx (AC: #1, #4)
  - [ ] src/components/common/CategoryBadge.tsx (AC: #1, #4)
  - [ ] src/components/common/Nav.tsx (bottom navigation) (AC: #1, #4)
  - [ ] src/components/charts/SimplePieChart.tsx (AC: #1, #4)
  - [ ] src/components/charts/GroupedBarChart.tsx (AC: #1, #4)
- [ ] Extract view components:
  - [ ] src/components/views/LoginScreen.tsx (AC: #1, #4)
  - [ ] src/components/views/DashboardView.tsx (AC: #1, #4)
  - [ ] src/components/views/ScanView.tsx (AC: #1, #4)
  - [ ] src/components/views/EditView.tsx (AC: #1, #4)
  - [ ] src/components/views/TrendsView.tsx (AC: #1, #4)
  - [ ] src/components/views/HistoryView.tsx (AC: #1, #4)
  - [ ] src/components/views/SettingsView.tsx (AC: #1, #4)
- [ ] Create src/App.tsx (main application component with state management) (AC: #1, #4)
- [ ] Create src/main.tsx (application entry point with React rendering) (AC: #1, #2)
- [ ] Run `npm install` to install all dependencies (AC: #2)
- [ ] Start development server: `npm run dev` (AC: #2, #5)
- [ ] Test all features systematically against original main.tsx:
  - [ ] Authentication flow (AC: #4)
  - [ ] Receipt scanning workflow (AC: #4)
  - [ ] Transaction CRUD operations (AC: #4)
  - [ ] Analytics and charting (AC: #4)
  - [ ] History pagination (AC: #4)
  - [ ] Settings toggles (AC: #4)
- [ ] Fix any import errors or runtime issues (AC: #3, #5)
- [ ] Verify no console errors during testing (AC: #5)
- [ ] Compare side-by-side with original main.tsx to confirm identical behavior (AC: #4)

### Technical Summary

This story transforms the 621-line single-file application into a modular, maintainable codebase using Vite as the build tool. The refactoring follows an incremental extraction strategy:

1. **Phase 1 (Low Risk):** Extract pure functions (utilities, constants, types)
2. **Phase 2 (Medium Risk):** Extract services and custom hooks
3. **Phase 3 (Higher Risk):** Extract React components

Vite 5.x provides fast development with Hot Module Replacement and optimized production builds. TypeScript 5.3.3 ensures type safety. All existing patterns are preserved:
- React Hooks for state management
- Functional components with TypeScript/JSX
- Tailwind CSS utility classes
- Firebase SDK integration
- Gemini API REST calls

The refactored structure improves:
- **Maintainability:** Smaller files with clear responsibilities
- **Testability:** Isolated functions and components
- **IDE Support:** Better autocomplete and navigation
- **Collaboration:** Reduced merge conflicts

**No functionality changes** - this is purely structural refactoring.

### Project Structure Notes

- **Files to modify:**
  - Original: main.tsx (extract from, keep as backup)
  - Create: 28 new files in src/ and public/ directories
  - Create: package.json, tsconfig.json, vite.config.ts

- **Expected test locations:**
  - No test files in this story (testing deferred)
  - Manual testing via browser at localhost:5173

- **Estimated effort:** 5 story points (3-5 days)

- **Prerequisites:** None (first story in epic)

### Key Code References

**Reference the original main.tsx for extraction:**

- Lines 71-135: Utility functions → src/utils/
- Lines 136-250: Gemini AI integration → src/services/gemini.ts
- Lines 251-308: Firebase initialization → src/services/firebase.ts
- Lines 316-402: Firestore operations → src/services/firestore.ts
- Lines 30-48: Constants → src/config/constants.ts
- Components (inline in main.tsx) → src/components/

**Patterns to preserve:**
- Component structure: Functional components with props destructuring
- State management: useState, useEffect, useRef
- Error handling: Try-catch with user-friendly messages
- Data validation: Strict number parsing, safe date handling
- Firebase operations: User-scoped paths, real-time listeners
- Styling: Tailwind CSS classes, dark mode support

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Complete brownfield codebase analysis (main.tsx structure)
- Existing patterns and conventions to follow
- Framework versions: React 18.2.0, Vite 5.0.8, TypeScript 5.3.3, Firebase 10.7.1
- Integration points: Firebase Auth, Firestore, Gemini AI
- Step-by-step refactoring strategy
- Complete file structure and paths reference

**Architecture:** [architecture.md](../architecture.md) - Current single-file SPA architecture

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
