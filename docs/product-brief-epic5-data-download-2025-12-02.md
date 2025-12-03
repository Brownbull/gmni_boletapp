# Product Brief: Epic 5 - Data Download

**Date:** 2025-12-02
**Author:** Gabe
**Context:** Brownfield Feature Epic (Boletapp)

---

## Executive Summary

Epic 5 enables Pro and Max subscription users to download their expense data from Boletapp. The download behavior adapts based on the current analytics view: transaction-level downloads for granular views (month/week/day), and yearly aggregated statistics for broader views (quarter/year). This feature supports user data portability and enables external analysis while respecting subscription tiers.

---

## Core Vision

### Problem Statement

Users who pay for Boletapp (Pro/Max tiers) need the ability to export their expense data for external use - whether for tax preparation, personal budgeting in spreadsheets, or backup purposes. Currently, user data is locked within the application with no way to extract it. This limits the value proposition for paying subscribers who expect data portability as a premium feature.

### Proposed Solution

Implement a context-aware download system that adapts based on the user's current analytics view:

**Transaction Downloads (Month/Week/Day views):**
- Download all transactions for the **current month** regardless of which granular view (day, week, or month)
- Include complete transaction details: categories, prices, item names, subcategories, groups, receipt associations, and all scanned metadata

**Aggregated Statistics Downloads (Quarter/Year views):**
- Download **yearly aggregated statistics only** for both quarter and year views
- No transaction-level data available in these views

**Visual Feedback:**
- Download icon changes based on view type to indicate what will be downloaded
- One icon style for transaction downloads (month/week/day views)
- Different icon style for aggregated statistics (quarter/year views)

**Access Control:**
- Feature gated behind Pro and Max subscription tiers
- Free and Basic users cannot access download functionality

---

## Target Users

### Primary Users

**Pro and Max Subscribers** - Paying users who have invested in Boletapp for serious expense tracking and expect premium features like data export. These users:
- Track expenses regularly and want to analyze data externally
- May need data for tax preparation or accounting purposes
- Value data portability and ownership
- Are willing to pay for advanced features

---

## MVP Scope

### Core Features

1. **Subscription-Gated Access**
   - Download feature only available to Pro and Max subscription tiers
   - Free/Basic users see upgrade prompt when attempting to download

2. **Context-Aware Download Behavior**
   - Month/Week/Day views → Download current month's transactions
   - Quarter/Year views → Download yearly aggregated statistics only

3. **Transaction Export (Month/Week/Day views)**
   - All transactions for the current month
   - Complete data: category, price, item name, subcategory, group, receipt ID, and all scanned metadata
   - Single export format (CSV or format TBD in PRD)

4. **Aggregated Statistics Export (Quarter/Year views)**
   - Yearly statistics only (even from quarter view)
   - Summary data without individual transaction details

5. **Dynamic Download Icon**
   - Visual indicator changes based on current view
   - Transaction icon for month/week/day views
   - Statistics/aggregate icon for quarter/year views

### Out of Scope for MVP

- Download at weekly or daily granularity (always downloads full month)
- Quarterly aggregated statistics (only yearly available)
- Multiple export formats (single format only for MVP)
- Scheduled/automated exports
- Email delivery of exports
- Cloud storage integration (Google Drive, Dropbox)
- PDF report generation
- Receipt image export (images remain in-app only)

---

## Technical Preferences

- **Platform:** Web PWA (existing Boletapp architecture)
- **Stack:** React, TypeScript, Firebase (existing)
- **Export Library:** TBD during architecture phase (xlsx, csv-stringify, or similar)
- **File Download:** Browser native download API

---

## Dependencies & Assumptions

### Epic 7 Dependency (Subscription System)

**Current State:** Epic 7 (Subscription & Monetization) is not yet implemented.

**Approach:** Implement Epic 5 with a **mock/placeholder subscription check**:
- Create a subscription check utility (e.g., `canAccessDownload()` or `useSubscriptionTier()`)
- For now, returns `true` for all users (everyone can download during testing phase)
- Designed to be easily replaced when Epic 7 implements real subscription infrastructure
- When Epic 7 lands, update the utility to check actual subscription tier (Pro/Max = allowed, Free/Basic = blocked)

**Rationale:** The application is currently in testing. All users should have access to the download feature now, but the code structure should anticipate future paywall restrictions.

### Assumptions

1. All authenticated users can download during testing phase
2. Subscription gating will be enforced after Epic 7 completion
3. No backend validation of subscription tier needed for MVP (client-side check sufficient during testing)

---

_This Product Brief captures the vision and requirements for Epic 5 - Data Download._

_It was created through collaborative discovery and reflects the unique needs of this brownfield feature project._

_Next: PRD workflow will transform this brief into detailed planning artifacts._
