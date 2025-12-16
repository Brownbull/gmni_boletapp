# Story 10.99 Context: Epic Release Deployment

**Purpose:** This document aggregates all relevant codebase context for Epic 10 release deployment.

---

## Pre-Deployment Checklist

### All Epic 10 Stories Must Be Complete

| Story | Description | Status |
|-------|-------------|--------|
| 10.0 | Foundation Sprint | ⬜ |
| 10.1 | Insight Engine Core | ⬜ |
| 10.2 | Scan Complete Insights | ⬜ |
| 10.3 | Weekly Summary View | ⬜ |
| 10.4 | Monthly Summary View | ⬜ |
| 10.5 | Analytics Insight Cards | ⬜ |
| 10.6 | Push Notification Integration | ⬜ |
| 10.7 | Pattern Detection Engine | ⬜ |

---

## Build & Test Commands

```bash
# Full test suite (977+ existing tests + new)
npm run test

# Build production bundle
npm run build

# Type checking
npm run typecheck

# Lint
npm run lint

# Check bundle size
npm run analyze  # if available, or check dist/ folder size
```

---

## Current Test Infrastructure

```
Location: /home/khujta/projects/bmad/boletapp/tests/

Structure:
  tests/
    unit/
      components/
      hooks/
      services/
      utils/
      views/
    integration/
    e2e/

Current test count: 977+ tests
Framework: Vitest

Run: npm run test
Watch: npm run test:watch
Coverage: npm run test:coverage
```

---

## New E2E Tests to Add

```typescript
// tests/e2e/epic10/insight-engine.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Epic 10: Insight Engine', () => {

  test('shows insight toast after scan', async ({ page }) => {
    // Login
    await page.goto('/');
    await loginTestUser(page);

    // Scan a receipt
    await page.click('[data-testid="scan-button"]');
    await uploadTestReceipt(page, 'restaurant-receipt.jpg');

    // Wait for processing
    await page.waitForSelector('[data-testid="edit-view"]');

    // Save transaction
    await page.click('[data-testid="save-button"]');

    // Verify insight toast appears
    const toast = page.locator('[data-testid="insight-toast"]');
    await expect(toast).toBeVisible();

    // Verify toast auto-dismisses
    await expect(toast).not.toBeVisible({ timeout: 5000 });
  });

  test('shows weekly summary in reports section', async ({ page }) => {
    await page.goto('/');
    await loginTestUser(page);

    // Navigate to reports section
    const reportsSection = page.locator('[data-testid="reports-section"]');
    await expect(reportsSection).toBeVisible();

    // Click weekly report
    await page.click('[data-testid="weekly-report-card"]');

    // Verify weekly summary opens
    const summary = page.locator('[data-testid="weekly-summary"]');
    await expect(summary).toBeVisible();

    // Verify data displayed
    await expect(page.locator('[data-testid="total-spent"]')).toBeVisible();
    await expect(page.locator('[data-testid="top-categories"]')).toBeVisible();
  });

  test('navigates from summary to analytics', async ({ page }) => {
    await page.goto('/');
    await loginTestUser(page);

    // Open weekly summary
    await page.click('[data-testid="weekly-report-card"]');

    // Click "View detailed analysis"
    await page.click('[data-testid="view-analysis-button"]');

    // Verify navigated to analytics with date filter
    await expect(page).toHaveURL(/\/trends/);
    // Verify date filter is set
    const dateFilter = page.locator('[data-testid="date-filter"]');
    await expect(dateFilter).toContainText(/Dec/);  // Current week
  });

  test('notification settings toggle works', async ({ page }) => {
    await page.goto('/');
    await loginTestUser(page);

    // Navigate to settings
    await page.click('[data-testid="settings-button"]');

    // Find notification section
    const notifSection = page.locator('[data-testid="notification-settings"]');
    await expect(notifSection).toBeVisible();

    // Toggle master switch
    await page.click('[data-testid="notifications-enabled-toggle"]');

    // Verify individual toggles appear/disappear
    const scanToggle = page.locator('[data-testid="scan-complete-toggle"]');
    await expect(scanToggle).toBeVisible();
  });

});
```

---

## Firebase Deployment Commands

```bash
# Deploy to staging
firebase use staging
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only functions
firebase deploy --only functions

# Deploy only rules
firebase deploy --only firestore:rules
firebase deploy --only storage

# Deploy to production
firebase use production
firebase deploy

# Deploy with specific functions
firebase deploy --only functions:notifyScanComplete,functions:sendWeeklyDigests,functions:sendMonthlySummaries
```

---

## Firebase Projects

```
Staging Project: boletapp-staging (or similar)
Production Project: boletapp-prod (or similar)

Firebase config in:
  - .firebaserc (project aliases)
  - firebase.json (deployment configuration)
```

---

## Rollback Procedure

```bash
# 1. Check deployment history
firebase hosting:releases:list

# 2. Rollback to previous version
firebase hosting:rollback

# 3. If functions need rollback, redeploy from previous commit
git checkout <previous-commit>
firebase deploy --only functions

# 4. Notify team
# Post in #engineering channel about rollback
```

---

## Rollback Triggers

When to rollback:
- Error rate > 1% increase (check Firebase Crashlytics or logs)
- Performance degradation > 25% (check Core Web Vitals)
- Critical user-reported bugs
- Cloud Function failures (check Functions logs)
- Unexpected Firestore rule denials

---

## Performance Benchmarks

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Insight generation | <500ms | Chrome DevTools, Performance tab |
| Summary load | <1s | Network timing |
| Toast render | <100ms | React DevTools |
| Scheduled function | <30s | Functions logs |
| Bundle size increase | <50KB | `npm run build`, check dist/ |

```bash
# Lighthouse audit
npx lighthouse https://boletapp.web.app --view

# Key metrics to check:
# - First Contentful Paint (FCP)
# - Largest Contentful Paint (LCP)
# - Time to Interactive (TTI)
# - Total Blocking Time (TBT)
```

---

## Manual QA Checklist

### Insight Engine
- [ ] Scan receipt → Insight toast appears
- [ ] Toast shows relevant insight type
- [ ] Toast auto-dismisses after 4s
- [ ] "Ver más" action works (if shown)
- [ ] Fallback message shows when no specific insight

### Weekly Summary
- [ ] Reports Section visible on dashboard
- [ ] Weekly report card clickable
- [ ] Summary data accurate
- [ ] Top categories calculated correctly
- [ ] Week comparison shows correct change
- [ ] "Ver análisis" navigates to Analytics

### Monthly Summary
- [ ] Monthly report card visible
- [ ] Celebration animation triggers (if applicable)
- [ ] Category comparisons accurate
- [ ] Highlights (biggest increase/decrease) shown
- [ ] Respects reduced motion preference

### Analytics Insight Cards
- [ ] Cards appear on Analytics view
- [ ] Cards refresh when filters change
- [ ] Dismiss (X) removes card
- [ ] Dismissed cards don't reappear (session)
- [ ] Max 2 cards shown

### Push Notifications
- [ ] Settings toggles work
- [ ] Permission request appears on enable
- [ ] Scan complete notification (when backgrounded)
- [ ] Deep link from notification works

### Pattern Detection
- [ ] Pattern insights appear (with sufficient data)
- [ ] Minimum data points respected (20)
- [ ] Patterns integrated with Insight Engine

---

## Monitoring After Deployment

```bash
# Firebase Console monitoring
# 1. Go to Firebase Console > Functions
# 2. Check execution counts and errors
# 3. Review logs for any issues

# Cloud Logging
firebase functions:log --only notifyScanComplete
firebase functions:log --only sendWeeklyDigests
firebase functions:log --only sendMonthlySummaries

# Error reporting
# Check Firebase Crashlytics (if configured)
# Or check browser console reports
```

---

## Release Notes Template

```markdown
# Boletapp v2.x.x - Epic 10 Release

## What's New

### Insight Engine 💡
- Personalized insights after every scan
- 5 insight types: frequency, concentration, growth, improvement, milestones
- Pattern detection: time-of-day, day-of-week, spending velocity

### Weekly & Monthly Summaries 📊
- New Reports Section on home screen
- Weekly digest every Friday at 7pm
- Monthly celebration with full breakdown
- Compare your spending to previous periods

### Analytics Enhancements
- Insight cards on Analytics screen
- Contextual insights based on your filters

### Push Notifications 🔔
- Get notified when your reports are ready
- Scan complete notifications when app is backgrounded
- Full control in Settings

## Technical Improvements
- Refactored analytics for better performance
- New transaction query service
- Improved state management

## Known Issues
- None

## Upgrade Notes
- No user action required
- Clear cache if you experience issues
```

---

## Post-Deployment Tasks

- [ ] Verify all Cloud Functions deployed
- [ ] Verify Firestore rules deployed
- [ ] Test scheduled functions (manually trigger in emulator)
- [ ] Monitor error logs for 30 minutes
- [ ] Check user feedback channels
- [ ] Update project documentation
- [ ] Notify stakeholders of release
- [ ] Create GitHub release tag

---

## Environment Variables Required

```bash
# Frontend (.env.production)
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_FIREBASE_VAPID_KEY=xxx  # NEW for push notifications

# Functions (set via Firebase Functions config or .env)
# No additional env vars needed for Epic 10
```

---

## Team Communication

After successful deployment:

```
🚀 Epic 10 Deployed to Production

Features:
- Insight Engine with 5+ insight types
- Weekly/Monthly summaries in Reports Section
- Push notifications for reports
- Pattern detection engine
- Analytics insight cards

Key endpoints to monitor:
- /summary/weekly/*
- /summary/monthly/*
- Functions: notifyScanComplete, sendWeeklyDigests, sendMonthlySummaries

Please report any issues to #boletapp-bugs
```
