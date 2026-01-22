# Story 14c-refactor.18: Integration Testing

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **QA engineer**,
I want **full app smoke testing completed after the refactoring**,
So that **we have confidence no regressions were introduced and the app is ready for Epic 14d (Shared Groups v2)**.

## Acceptance Criteria

### Core Smoke Test Requirements

1. **Given** significant refactoring has been done across 17 stories
   **When** this story is completed
   **Then:**
   - Manual smoke test checklist completed with all items passing
   - All critical user workflows verified end-to-end
   - No blocking issues found or all issues documented and triaged

2. **Given** the app should load correctly after refactoring
   **When** testing app initialization
   **Then:**
   - [ ] App loads without JavaScript errors
   - [ ] Console shows no uncaught exceptions
   - [ ] All providers initialize correctly (Auth, Theme, Scan, Navigation)
   - [ ] Service workers register correctly (PWA mode)

3. **Given** authentication is a critical security feature
   **When** testing auth flows
   **Then:**
   - [ ] Google Sign-In works correctly
   - [ ] User session persists across page refresh
   - [ ] Logout clears user state completely
   - [ ] Protected routes redirect to login when unauthenticated
   - [ ] Auth state is accessible in all app contexts

### Transaction CRUD Testing

4. **Given** transaction management is core functionality
   **When** testing transaction operations
   **Then:**
   - [ ] Create new transaction manually (+ button)
   - [ ] Edit existing transaction (tap card → edit)
   - [ ] Delete transaction (swipe or edit view delete)
   - [ ] Transaction appears immediately in History view
   - [ ] Transaction totals update in Dashboard
   - [ ] Data persists after page refresh

### Receipt Scanning Testing

5. **Given** receipt scanning is the primary user flow
   **When** testing scan functionality
   **Then:**
   - [ ] Single scan: Camera opens, captures image, processes OCR
   - [ ] Scan result shows in EditView with extracted data
   - [ ] Currency detection works (CLP primary, foreign currencies detected)
   - [ ] Quick Save card appears when confidence >= 85%
   - [ ] Save transaction from scan result works correctly

6. **Given** batch mode was preserved from Epic 14d-old
   **When** testing batch scanning
   **Then:**
   - [ ] Long-press FAB shows mode selector
   - [ ] Batch mode captures multiple images (2-3 for test)
   - [ ] Parallel processing shows progress for each image
   - [ ] Batch review queue displays all results
   - [ ] Save all from batch works correctly

7. **Given** scan state persists across navigation (Epic 14d-old)
   **When** testing scan state persistence
   **Then:**
   - [ ] Start scan → navigate away → return → scan state preserved
   - [ ] Pending scan survives app close and reopen
   - [ ] FAB shows correct icon/color for active scan state

### Learning System Testing

8. **Given** learning system helps users categorize faster
   **When** testing learning flows
   **Then:**
   - [ ] Edit merchant name → learning prompt appears → confirm → saved
   - [ ] Edit category → learning prompt appears → confirm → saved
   - [ ] New scan with learned merchant → auto-applies category
   - [ ] Settings → Learned Merchants shows saved mappings
   - [ ] Settings → Learned Categories shows saved mappings
   - [ ] Delete mapping from settings works

### Analytics & History Testing

9. **Given** analytics provides spending insights
   **When** testing analytics navigation
   **Then:**
   - [ ] TrendsView loads with current month data
   - [ ] Temporal drill-down works (Year → Quarter → Month → Week → Day)
   - [ ] Category drill-down works (Store → Item categories)
   - [ ] Charts render correctly (pie, bar, stacked, polygon)
   - [ ] Swipe left/right navigates time periods
   - [ ] Transaction count badge navigates to filtered History

10. **Given** history view shows transaction list
    **When** testing history functionality
    **Then:**
    - [ ] History view loads with transactions
    - [ ] Temporal filter works (This month, This week, etc.)
    - [ ] Category filter works (select category from filter bar)
    - [ ] Location filter works (select location from filter bar)
    - [ ] Tap transaction → opens detail/edit view
    - [ ] Pagination works (Load more button if >100 transactions)

### Shared Groups Disabled State Testing (Atlas Workflow Impact)

11. **Given** Epic 14c-refactor disabled shared group features
    **When** testing shared groups UI
    **Then:**
    - [ ] ViewModeSwitcher shows only "Personal" mode active
    - [ ] Group options in ViewModeSwitcher show "Coming soon" tooltip
    - [ ] TransactionGroupSelector is disabled with tooltip
    - [ ] Settings → Groups shows "Coming soon" or empty state
    - [ ] No console errors when navigating to group-related screens
    - [ ] No network calls to sharedGroups or pendingInvitations collections

### React Query Caching Testing (Atlas Workflow Impact)

12. **Given** React Query migration (Story 14.29) changed caching
    **When** testing data caching behavior
    **Then:**
    - [ ] Transactions load from cache on repeat visits (fast load)
    - [ ] Cache invalidation works after save (new transaction appears)
    - [ ] Cache invalidation works after update (changes reflect)
    - [ ] Cache invalidation works after delete (transaction removed)
    - [ ] Stale time (~5 min) doesn't cause stale data issues
    - [ ] Offline mode shows cached data when network unavailable

### Settings & Theme Testing

13. **Given** settings provide user customization
    **When** testing settings functionality
    **Then:**
    - [ ] Settings page loads without errors
    - [ ] Theme switching works (Normal/Professional/Mono)
    - [ ] Dark mode toggle works
    - [ ] Language switching works (if implemented)
    - [ ] Push notification toggle works
    - [ ] Export data function works

### PWA & Push Notification Testing

14. **Given** app supports PWA installation
    **When** testing PWA features
    **Then:**
    - [ ] App installable on mobile (Add to Home Screen)
    - [ ] Service worker caches assets for offline use
    - [ ] App loads when offline (shows cached data)
    - [ ] Push notifications received (if configured)
    - [ ] Notification tap opens correct view

### Deep Linking Testing

15. **Given** deep links enable sharing
    **When** testing deep link handling
    **Then:**
    - [ ] `/join/{shareCode}` shows "Feature temporarily unavailable" message
    - [ ] Direct URL to app loads correctly
    - [ ] No crashes on invalid deep link URLs

### Performance & Error Testing

16. **Given** performance should be acceptable
    **When** testing app performance
    **Then:**
    - [ ] Initial load < 3 seconds on good network
    - [ ] Navigation between views < 500ms
    - [ ] No visible jank during animations
    - [ ] Memory usage stable (no leaks during normal use)

17. **Given** errors should be handled gracefully
    **When** testing error scenarios
    **Then:**
    - [ ] Network error shows user-friendly message
    - [ ] Invalid data doesn't crash app
    - [ ] Error boundaries catch component errors
    - [ ] Recovery possible after error (navigate away, retry)

### Dependencies

18. **Given** this story validates all prior refactoring
    **When** starting implementation
    **Then:**
    - Stories 14c-refactor.1-8 (cleanup) MUST be completed
    - Story 14c-refactor.9 (contexts) MUST be completed
    - Story 14c-refactor.10 (hooks) MUST be completed
    - Story 14c-refactor.11 (components) MUST be completed
    - Story 14c-refactor.17 (test suite cleanup) SHOULD be completed
    - All unit tests passing: `npm test`
    - Build succeeds: `npm run build`

## Tasks / Subtasks

### Task 1: Pre-Testing Verification (AC: #18)

- [ ] 1.1 Verify all prior stories are completed
- [ ] 1.2 Run full unit test suite: `npm test`
- [ ] 1.3 Run TypeScript check: `npm run typecheck`
- [ ] 1.4 Run production build: `npm run build`
- [ ] 1.5 Deploy to staging environment (or run locally with `npm run preview`)

### Task 2: App Initialization Testing (AC: #2)

- [ ] 2.1 Open app in Chrome DevTools
- [ ] 2.2 Check Console tab for errors during load
- [ ] 2.3 Verify Network tab shows successful API calls
- [ ] 2.4 Check Application tab for service worker registration
- [ ] 2.5 Document any warnings or errors found

### Task 3: Authentication Flow Testing (AC: #3)

- [ ] 3.1 Test Google Sign-In flow
- [ ] 3.2 Verify user info displays correctly after login
- [ ] 3.3 Refresh page and verify session persists
- [ ] 3.4 Test logout functionality
- [ ] 3.5 Verify protected routes redirect when logged out
- [ ] 3.6 Document any auth issues found

### Task 4: Transaction CRUD Testing (AC: #4)

- [ ] 4.1 Create new transaction via manual entry
- [ ] 4.2 Edit the created transaction
- [ ] 4.3 Delete the transaction
- [ ] 4.4 Verify History view updates correctly
- [ ] 4.5 Verify Dashboard totals update correctly
- [ ] 4.6 Refresh page and verify data persists
- [ ] 4.7 Document any transaction issues found

### Task 5: Receipt Scanning Testing (AC: #5, #6, #7)

- [ ] 5.1 Test single receipt scan (use test receipt image)
- [ ] 5.2 Verify OCR extracts merchant, items, total
- [ ] 5.3 Test Quick Save flow (if confidence >= 85%)
- [ ] 5.4 Test manual save from EditView
- [ ] 5.5 Test batch mode (long-press FAB → select Batch)
- [ ] 5.6 Capture 2-3 images in batch mode
- [ ] 5.7 Verify parallel processing and batch review
- [ ] 5.8 Save all from batch and verify transactions created
- [ ] 5.9 Test scan state persistence (start scan → navigate → return)
- [ ] 5.10 Document any scanning issues found

### Task 6: Learning System Testing (AC: #8)

- [ ] 6.1 Edit merchant name on transaction → verify learning prompt
- [ ] 6.2 Confirm learning → verify mapping saved
- [ ] 6.3 Scan new receipt with same merchant → verify auto-apply
- [ ] 6.4 Navigate to Settings → Learned Merchants → verify mapping visible
- [ ] 6.5 Delete a mapping → verify removed
- [ ] 6.6 Repeat for category learning
- [ ] 6.7 Document any learning issues found

### Task 7: Analytics Testing (AC: #9)

- [ ] 7.1 Navigate to TrendsView (Analytics tab)
- [ ] 7.2 Test temporal drill-down (tap year → quarter → month → week)
- [ ] 7.3 Test category drill-down (tap store category → item category)
- [ ] 7.4 Verify charts render (pie, bar, stacked, polygon)
- [ ] 7.5 Test swipe navigation (left/right for time periods)
- [ ] 7.6 Tap transaction count badge → verify History filter applied
- [ ] 7.7 Document any analytics issues found

### Task 8: History View Testing (AC: #10)

- [ ] 8.1 Navigate to History tab
- [ ] 8.2 Test temporal filter (This month, This week, All time)
- [ ] 8.3 Test category filter (IconFilterBar)
- [ ] 8.4 Test location filter (if transactions have locations)
- [ ] 8.5 Tap transaction card → verify opens edit view
- [ ] 8.6 Test pagination if >100 transactions
- [ ] 8.7 Document any history issues found

### Task 9: Shared Groups Disabled Testing (AC: #11)

- [ ] 9.1 Locate ViewModeSwitcher (tap logo or settings)
- [ ] 9.2 Verify only "Personal" mode selectable
- [ ] 9.3 Verify "Coming soon" tooltips on disabled group options
- [ ] 9.4 Navigate to Settings → Groups (if accessible)
- [ ] 9.5 Verify empty state or "Coming soon" message
- [ ] 9.6 Check Network tab for shared group API calls (should be none)
- [ ] 9.7 Check Console for shared group related errors (should be none)
- [ ] 9.8 Document any shared group issues found

### Task 10: React Query Caching Testing (AC: #12)

- [ ] 10.1 Load transactions → note load time
- [ ] 10.2 Navigate away → return → verify faster load (cached)
- [ ] 10.3 Create transaction → verify appears immediately
- [ ] 10.4 Update transaction → verify changes reflect
- [ ] 10.5 Delete transaction → verify removed
- [ ] 10.6 Test offline mode (DevTools → Network → Offline)
- [ ] 10.7 Verify cached data displays when offline
- [ ] 10.8 Document any caching issues found

### Task 11: Settings & Theme Testing (AC: #13)

- [ ] 11.1 Navigate to Settings
- [ ] 11.2 Test theme switching (Normal → Professional → Mono)
- [ ] 11.3 Test dark mode toggle
- [ ] 11.4 Test push notification toggle
- [ ] 11.5 Test export data function (if available)
- [ ] 11.6 Document any settings issues found

### Task 12: PWA Testing (AC: #14)

- [ ] 12.1 Open app on mobile device (or Chrome mobile emulation)
- [ ] 12.2 Check for "Add to Home Screen" prompt
- [ ] 12.3 Install app and open from home screen
- [ ] 12.4 Test offline mode (airplane mode)
- [ ] 12.5 Verify cached content loads offline
- [ ] 12.6 Document any PWA issues found

### Task 13: Deep Linking Testing (AC: #15)

- [ ] 13.1 Test `/join/TESTCODE` URL → verify "temporarily unavailable" message
- [ ] 13.2 Test direct app URL navigation
- [ ] 13.3 Test invalid URL handling
- [ ] 13.4 Document any deep link issues found

### Task 14: Performance Testing (AC: #16)

- [ ] 14.1 Measure initial load time (target < 3s)
- [ ] 14.2 Measure view navigation time (target < 500ms)
- [ ] 14.3 Check for animation jank (scroll, transitions)
- [ ] 14.4 Monitor memory usage in DevTools Performance tab
- [ ] 14.5 Document any performance issues found

### Task 15: Error Handling Testing (AC: #17)

- [ ] 15.1 Test network error scenario (DevTools → Network → Offline while action)
- [ ] 15.2 Verify user-friendly error message displayed
- [ ] 15.3 Verify app recoverable after error (can navigate, retry)
- [ ] 15.4 Check error boundary catches component errors
- [ ] 15.5 Document any error handling issues found

### Task 16: Documentation & Sign-off (AC: #1)

- [ ] 16.1 Compile all test results into summary
- [ ] 16.2 Categorize issues: Blocking / Major / Minor / Cosmetic
- [ ] 16.3 Create follow-up stories for any issues found
- [ ] 16.4 Update this story with completion notes
- [ ] 16.5 Mark story as complete if no blocking issues

## Dev Notes

### Test Environment Setup

**Local Testing:**
```bash
# Build and preview production build
npm run build
npm run preview
# App available at http://localhost:4173
```

**Staging Testing:**
```bash
# Deploy to staging
npm run deploy:staging
# Or use existing staging URL
```

### Browser DevTools Tips

- **Console tab:** Watch for errors/warnings during all operations
- **Network tab:** Verify API calls, check for failed requests
- **Application tab:** Check service worker, localStorage, IndexedDB
- **Performance tab:** Monitor memory, check for leaks
- **Lighthouse:** Run audit for PWA, performance, accessibility

### Test Data Recommendations

- Create 3-5 test transactions across different categories
- Use mix of dates (today, this week, this month, older)
- Include transactions with different currencies if testing foreign currency
- Use test receipt images for scan testing (varied stores, receipt types)

### Known Limitations (Expected Behavior)

| Feature | Expected Behavior | Reason |
|---------|-------------------|--------|
| Shared Groups | Disabled/"Coming soon" | Epic 14c-refactor cleanup |
| `/join/{code}` URL | "Temporarily unavailable" | Shared groups disabled |
| Group mode in ViewModeSwitcher | Disabled with tooltip | Waiting for Epic 14d |
| Cross-user transaction access | Blocked by security rules | Simplified rules |

### Critical Path Verification

The following paths MUST work without issues:

1. **New User Path:** Sign in → First scan → Save → View in History
2. **Returning User Path:** Open app → View cached data → Make changes → Sync
3. **Power User Path:** Batch scan → Review → Edit → Save all → Analytics

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.18] - Story definition
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/05-testing.md] - Testing patterns
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md] - Critical user journeys
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md] - Architecture patterns
- [Source: docs/sprint-artifacts/epic14c-refactor/tech-context-epic14c-refactor.md] - Epic technical context

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **Auth → Scan → Save Critical Path (#1)** | MUST verify full authentication flow, then scan, then save - the core app value proposition |
| **Scan Receipt Flow (#1)** | MUST verify camera capture, Gemini OCR, mapping application, EditView, and save |
| **Quick Save Flow (#6)** | MUST verify 85% confidence threshold triggers QuickSaveCard vs EditView |
| **Batch Processing Flow (#3)** | MUST verify multi-image capture and parallel processing |
| **Learning Flow (#5)** | MUST verify user edits → learning prompt → mapping saved → auto-apply |
| **Analytics Navigation Flow (#4)** | MUST verify TrendsView → drill-down → charts → filtered History |
| **History Filter Flow (#6)** | MUST verify temporal, category, and location filters work |
| **CI/CD Test Pipeline** | This story is the FINAL validation gate before deployment |

### Downstream Effects to Consider

- **Deployment Readiness:** This is the last validation story before Epic 14c-refactor is complete
- **Epic 14d Enablement:** Clean codebase validation enables starting Shared Groups v2
- **Regression Prevention:** Smoke tests catch any subtle breakages from Stories 14c-refactor.1-17
- **Documentation:** Test results document the state of the app post-refactor

### Testing Implications

- **Existing tests to verify:** All 3,252+ unit tests should pass before smoke testing
- **New scenarios:** Manual E2E verification of full user journeys
- **Critical areas:** Authentication, transaction CRUD, receipt scanning, analytics navigation

### Workflow Chain Visualization

```
[Stories 14c-refactor.1-17] → Code refactored → [THIS STORY: Validate everything works]
                                                            ↓
                                                    [No blocking issues?]
                                                            ↓
                                    ┌───────────────────────┴───────────────────────┐
                                    ↓                                               ↓
                            [YES: Epic complete]                         [NO: Create fix stories]
                                    ↓                                               ↓
                            [Epic 14d ready to start]               [Fix → Retest → Complete]
```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### Test Results Summary

| Area | Pass/Fail | Notes |
|------|-----------|-------|
| App Initialization | | |
| Authentication | | |
| Transaction CRUD | | |
| Receipt Scanning | | |
| Batch Mode | | |
| Learning System | | |
| Analytics | | |
| History View | | |
| Shared Groups Disabled | | |
| React Query Caching | | |
| Settings & Themes | | |
| PWA | | |
| Deep Links | | |
| Performance | | |
| Error Handling | | |

### Issues Found

| Issue | Severity | Story Created |
|-------|----------|---------------|
| (none yet) | | |

### File List

**No files created/modified** - This is a testing/validation story.

**Test artifacts to create:**
- Screenshots of any issues found (optional)
- Performance report (optional)
- Lighthouse audit results (optional)
