# Story 14c-refactor.11: App.tsx Decomposition - Components

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **App.tsx layout, routing, and provider composition extracted into components**,
So that **App.tsx becomes a simple composition root (~200-300 lines), making the codebase more maintainable and easier to understand**.

## Acceptance Criteria

### Core Functionality

1. **Given** App.tsx contains inline JSX for providers, routing, and layout
   **When** this story is completed
   **Then:**
   - Create `src/components/App/` directory with:
     - `AppProviders.tsx` - Composes all context providers **including ScanContext**
     - `AppRoutes.tsx` - Route definitions and view navigation (switch/case logic)
     - `AppLayout.tsx` - Main layout wrapper (TopHeader, content area, Nav)
     - `AppErrorBoundary.tsx` - Top-level error handling with recovery UI
   - Each component is self-contained with clear props interface
   - **ScanContext provider composition preserved** from main.tsx
   - Barrel export via `src/components/App/index.ts`

2. **Given** the components are created
   **When** App.tsx uses these components
   **Then:**
   - App.tsx becomes ~200-300 lines max (from current ~5100 lines)
   - All routes continue to work
   - Error boundaries catch and display errors properly
   - **ScanContext functionality fully preserved**
   - No TypeScript errors

3. **Given** the provider composition follows documented patterns
   **When** examining AppProviders.tsx
   **Then:**
   - Provider composition order (outer to inner):
     ```tsx
     <QueryClientProvider>      {/* React Query - already in main.tsx */}
       <ViewModeProvider>       {/* View mode - already in main.tsx */}
         <ScanProvider>         {/* PRESERVE - from Epic 14d-old */}
           <AuthContext>        {/* Auth state - from 14c.9 */}
             <ThemeContext>     {/* Theme/dark mode - from 14c.9 */}
               <AnalyticsProvider>
                 <HistoryFiltersProvider>
                   <NavigationContext>
                     <AppStateContext>
                       {children}
                     </AppStateContext>
                   </NavigationContext>
                 </HistoryFiltersProvider>
               </AnalyticsProvider>
             </ThemeContext>
           </AuthContext>
         </ScanProvider>
       </ViewModeProvider>
     </QueryClientProvider>
     ```
   - Note: Some providers stay in main.tsx (QueryClientProvider, ViewModeProvider, ScanProvider)
   - AppProviders wraps remaining contexts from Stories 14c.9

### Atlas Workflow Impact Requirements

4. **Given** the Auth → Scan → Save Critical Path (#1)
   **When** provider composition is changed
   **Then:**
   - ScanContext MUST be inside a provider that has access to auth state
   - Test: Scan persistence must still access `user.uid` correctly
   - Test: Verify scan state survives logout/login cycle

5. **Given** Deep Link Flow (Story 14c.17) requires route handling
   **When** AppRoutes extracts routing logic
   **Then:**
   - `/join/:shareCode` deep links continue to work
   - Session storage pattern for unauthenticated join codes preserved
   - Manual test: Open `/join/abc123` in incognito, verify "Coming soon" message

6. **Given** the Error Boundary placement affects error recovery
   **When** AppErrorBoundary is implemented
   **Then:**
   - Top-level errors show recovery UI with "Reload" button
   - Error state includes error message and optional stack trace (dev only)
   - Error boundary catches but doesn't swallow errors for logging

7. **Given** filter persistence across navigation (Story 14.13b)
   **When** AppRoutes handles view transitions
   **Then:**
   - Filter clearing logic from App.tsx (lines 1031-1057) is preserved
   - HistoryFiltersContext integration maintained
   - Navigation from analytics to history with drillDownPath works

### Dependencies

8. **Given** this story depends on prior refactoring
   **When** starting implementation
   **Then:**
   - Story 14c-refactor.9 (Contexts) MUST be completed first
   - Story 14c-refactor.10 (Hooks) MUST be completed first
   - Extracted contexts and hooks are used by AppProviders and App.tsx

## Tasks / Subtasks

### Task 1: Create `src/components/App/` Directory Structure (AC: #1)

- [ ] 1.1 Create `src/components/App/` directory
- [ ] 1.2 Create `index.ts` barrel file for exports
- [ ] 1.3 Create `types.ts` for shared component props interfaces

### Task 2: Create `AppErrorBoundary.tsx` (AC: #1, #6)

- [ ] 2.1 Create error boundary component with class-based React pattern
- [ ] 2.2 Implement error state with message display
- [ ] 2.3 Add "Reload" recovery button
- [ ] 2.4 Show stack trace only in development
- [ ] 2.5 Add error logging before render (preserve existing ErrorBoundary patterns)
- [ ] 2.6 Add unit tests

### Task 3: Create `AppProviders.tsx` (AC: #1, #3, #4)

- [ ] 3.1 Analyze current provider composition in main.tsx and App.tsx
- [ ] 3.2 Identify which providers to compose in AppProviders vs main.tsx:
  - **main.tsx keeps:** QueryClientProvider, ViewModeProvider, ScanProvider
  - **AppProviders adds:** AnalyticsProvider, HistoryFiltersProvider, contexts from 14c.9
- [ ] 3.3 Create AppProviders component with correct nesting order
- [ ] 3.4 Define props interface:
  ```typescript
  interface AppProvidersProps {
    children: React.ReactNode;
  }
  ```
- [ ] 3.5 Add JSDoc explaining provider order rationale
- [ ] 3.6 Add unit tests verifying provider nesting
- [ ] 3.7 Test: Scan persistence still works after refactor

### Task 4: Create `AppRoutes.tsx` (AC: #1, #5, #7)

- [ ] 4.1 Extract view rendering switch/case from App.tsx return statement
- [ ] 4.2 Identify all view types used:
  ```typescript
  type View = 'dashboard' | 'scan' | 'scan-result' | 'edit' | 'transaction-editor' |
              'trends' | 'insights' | 'settings' | 'alerts' | 'batch-capture' |
              'batch-review' | 'history' | 'reports' | 'items' | 'statement-scan' |
              'recent-scans';
  ```
- [ ] 4.3 Define props interface:
  ```typescript
  interface AppRoutesProps {
    view: View;
    // Props needed for each view (to be extracted from App.tsx)
  }
  ```
- [ ] 4.4 Extract view-specific props from App.tsx
- [ ] 4.5 Preserve filter clearing logic on navigation (lines 1031-1057)
- [ ] 4.6 Add unit tests for route resolution
- [ ] 4.7 Manual test: Navigate through all views

### Task 5: Create `AppLayout.tsx` (AC: #1)

- [ ] 5.1 Extract layout structure from App.tsx:
  - TopHeader component wrapper
  - Main content area with safe area padding
  - Nav component wrapper
  - View mode switcher overlay
- [ ] 5.2 Define props interface:
  ```typescript
  interface AppLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showNav?: boolean;
    view: View;
    // Header and Nav props
  }
  ```
- [ ] 5.3 Preserve CSS custom properties and theme integration
- [ ] 5.4 Preserve safe area insets (PWA support)
- [ ] 5.5 Add unit tests for layout rendering

### Task 6: Refactor App.tsx (AC: #2, #8)

- [ ] 6.1 Import new components from `src/components/App/`
- [ ] 6.2 Replace inline layout with `<AppLayout>`
- [ ] 6.3 Replace view switch with `<AppRoutes>`
- [ ] 6.4 Wrap with `<AppProviders>` (coordinate with main.tsx)
- [ ] 6.5 Remove dead code after extraction
- [ ] 6.6 Verify App.tsx line count is ~200-300 lines
- [ ] 6.7 Run TypeScript compiler - no errors

### Task 7: Testing and Verification (AC: #2, #4, #5, #6, #7)

- [ ] 7.1 Run full test suite: `npm test`
- [ ] 7.2 Run build: `npm run build`
- [ ] 7.3 Manual smoke test checklist:
  - [ ] App loads without errors
  - [ ] Login/logout works
  - [ ] Navigation between all views works
  - [ ] Scan receipt flow works (single and batch)
  - [ ] Deep link `/join/abc123` shows "Coming soon"
  - [ ] Filter persistence from analytics to history works
  - [ ] Error boundary shows recovery UI (test with deliberate error)
  - [ ] Theme switching works
  - [ ] PWA viewport and safe areas correct
- [ ] 7.4 Verify no console errors
- [ ] 7.5 Count lines in App.tsx - MUST be ~200-300 lines

## Dev Notes

### Current App.tsx Structure (~5143 lines)

| Lines (approx) | Content | Action |
|----------------|---------|--------|
| 1-260 | Imports and helpers | Keep minimal imports |
| 260-500 | Hook calls | Keep in App.tsx (orchestration) |
| 500-830 | Event handlers | Keep in App.tsx (event coordination) |
| 830-1100 | useEffects | Mostly extracted in 14c.10 |
| 1100-2000 | More handlers | Keep essential ones |
| 2000-5143 | **JSX return** | Extract to AppLayout + AppRoutes |

### Component Extraction Strategy

**AppErrorBoundary:**
- Uses existing `src/components/ErrorBoundary.tsx` as reference
- Class component pattern required for componentDidCatch

**AppProviders:**
- Coordinates with main.tsx to avoid duplicate providers
- main.tsx: QueryClientProvider, ViewModeProvider, ScanProvider
- AppProviders: AnalyticsProvider, HistoryFiltersProvider, new contexts from 14c.9

**AppRoutes:**
- Extracts the massive switch statement from App.tsx return
- Each view case becomes a render function or lazy component
- Props drilling kept to minimum via contexts

**AppLayout:**
- Wraps content with TopHeader, Nav, safe areas
- Handles view-specific layout differences (some views hide nav)

### Existing Components to Preserve

Do NOT modify these (already in correct locations):
- `src/components/ErrorBoundary.tsx` - Keep as reference, new boundary is App-specific
- `src/contexts/ScanContext.tsx` - PRESERVE from Epic 14d-old
- `src/contexts/ViewModeContext.tsx` - Already in main.tsx

### Provider Placement Rationale

```
main.tsx (outer)                    | AppProviders (inner)
------------------------------------|------------------------------------
QueryClientProvider                 | AnalyticsProvider
  └── ViewModeProvider              |   └── HistoryFiltersProvider
        └── ScanProvider            |         └── (contexts from 14c.9)
              └── AppProviders      |
```

**Why this order?**
1. QueryClient needed for all React Query hooks
2. ViewMode needed for group context
3. ScanContext needs to be app-wide for FAB and state machine
4. Auth/Theme/Navigation are feature contexts that depend on the above

### Testing Standards

- Unit tests for each new component
- Mock providers for isolated testing
- Use `vi.fn()` for callbacks
- Test error boundary with deliberate throw
- Minimum 80% coverage for new code

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md#Part-2] - Architecture spec
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.11] - Story definition
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md#Scan-State-Machine] - ScanContext patterns
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Workflow dependencies
- [Source: src/main.tsx] - Current provider composition
- [Source: src/App.tsx:2000-5143] - JSX to extract

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Auth → Scan → Save Critical Path (#1)**: Provider composition order is CRITICAL - ScanContext must access auth state for `user.uid` persistence
- **Scan Receipt Flow (#1)**: ScanProvider placement affects all scan operations - must remain app-wide
- **Analytics Navigation Flow (#4)**: AnalyticsProvider placement affects chart navigation and drill-down
- **History Filter Flow (#6)**: HistoryFiltersProvider placement affects filter state across views
- **Deep Link Flow (#14c.17)**: Route handling in AppRoutes must preserve `/join/` URL handling

### Downstream Effects to Consider

- If provider order changes, scan persistence may fail (needs user.uid from AuthContext)
- Error boundary placement affects which errors are caught at what level
- Routing changes could break deep links to `/join/` and transaction views
- Filter clearing logic must be preserved during navigation

### Testing Implications

- **Existing tests to verify:** Auth flow tests, scan state persistence tests (14d.4d), deep link tests (14c.17), filter persistence tests (14.13b)
- **New scenarios to add:** Provider composition tests, error boundary isolation tests, route resolution tests, layout rendering tests

### Workflow Chain Visualization

```
[main.tsx providers]
        ↓
[AppProviders] → Composes feature contexts
        ↓
[AppLayout] → Header + Content + Nav structure
        ↓
[AppRoutes] → View-based routing (switch/case)
        ↓
[Individual Views] → Dashboard, Trends, History, etc.
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

**To Create:**
- `src/components/App/index.ts`
- `src/components/App/types.ts`
- `src/components/App/AppErrorBoundary.tsx`
- `src/components/App/AppProviders.tsx`
- `src/components/App/AppRoutes.tsx`
- `src/components/App/AppLayout.tsx`
- `tests/unit/components/App/AppErrorBoundary.test.tsx`
- `tests/unit/components/App/AppProviders.test.tsx`
- `tests/unit/components/App/AppRoutes.test.tsx`
- `tests/unit/components/App/AppLayout.test.tsx`

**To Modify:**
- `src/App.tsx` - Import and use new components, reduce to ~200-300 lines
- `src/main.tsx` - Potentially adjust provider composition
