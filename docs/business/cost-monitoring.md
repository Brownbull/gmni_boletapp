# Firestore Cost Monitoring

> **Last Updated:** 2026-01-22
> **Story:** 14c-refactor.16

## Overview

This document describes the cost monitoring infrastructure for BoletApp's Firestore database and Google Cloud Platform services. Monitoring was established after a cost spike during Epic 14c (Shared Groups) where weekly costs increased from ~$1/week to ~$19/week due to unlimited listeners and full-refetch patterns.

## Cost History

| Period | Weekly Cost | Status | Cause |
|--------|-------------|--------|-------|
| Pre-Epic 14 | ~$3-5/week | Normal | Various listener patterns |
| Epic 14c (Shared Groups) | ~$19/week | **SPIKE** | Unlimited listeners + full refetch |
| Post-Story 14.25-14.27 | ~$1/week | Optimized | `LISTENER_LIMITS` constant |
| Current (14c-refactor) | ~$1/week | Target | Shared groups stubbed out |

## Budget Configuration

### GCP Budget Alerts

**Location:** Google Cloud Console → Billing → Budgets & alerts

**Budget:** $93,846/month (GCP account-wide allocation)

> **Note:** This is the GCP account-wide budget. For a beta product like BoletApp with ~50 users, Firestore costs should remain well under $5/week (~$20/month). The account-wide alerts provide organizational visibility, but developers should monitor the Firestore-specific dashboard metrics below to catch application-level cost issues early.

| Threshold | Percentage | Action |
|-----------|------------|--------|
| 10% | ~$9,385 | Early indicator |
| 25% | ~$23,462 | Monitor trend |
| **50%** | ~$46,923 | **Investigate if trending up** |
| **75%** | ~$70,385 | **Action required** |
| **90%** | ~$84,461 | **Critical - review immediately** |

**Trigger Type:** Actual spend (not forecasted)

**Notifications:** Email alerts to billing admins and users

### Threshold Rationale

- **10-25%:** Early warning for unexpected usage spikes. Useful for catching issues early in the month.
- **50%:** Mid-month checkpoint. If reached before the 15th, investigate recent deployments.
- **75%:** Action required. Review all active features and consider disabling problematic ones.
- **90%:** Critical. Likely indicates a cost explosion. May need emergency rollback.

## Cloud Monitoring Dashboard

### Dashboard Location

**Name:** gastify 001
**Location:** Google Cloud Console → Monitoring → Dashboards → gastify 001

### Metrics Tracked

| Metric | Chart Name | Description |
|--------|------------|-------------|
| `firestore.googleapis.com/document/read_count` | read_count | Document reads per second |
| `firestore.googleapis.com/document/write_count` | write_count | Document writes per second |
| `firestore.googleapis.com/document/delete_count` | delete_count | Document deletes per second |
| `firestore.googleapis.com/storage/size` | data_and_index_storage_bytes | Total storage used |

> **Note:** Delete operations are typically low-frequency in BoletApp. The delete_count metric is included for completeness but is less critical for cost monitoring than reads.

### Current Baseline Metrics (2026-01-22)

| Metric | Value | Notes |
|--------|-------|-------|
| Storage | ~2.24 MiB | Stable |
| Read rate (peak) | ~4/s | During active usage |
| Read rate (idle) | ~0.5/s | Background listeners |
| Write rate | ~0.1/s | Low frequency |

### Understanding the Charts

**Read Count Spikes:**
- Normal: Spikes when users navigate between views
- Suspicious: Sustained high reads (>10/s) without user activity
- Problematic: Constant reads without listeners being cleaned up

**Storage Growth:**
- Expected: Gradual increase with new transactions
- Suspicious: Sharp increases without corresponding transaction saves
- Problematic: Exponential growth (indicates data duplication bug)

## Firestore Pricing Reference (2026)

| Operation | Price (nam5 region) | Notes |
|-----------|---------------------|-------|
| Document reads | $0.06 / 100,000 | Listeners count per snapshot |
| Document writes | $0.18 / 100,000 | Includes creates/updates |
| Document deletes | $0.02 / 100,000 | Cascade deletes count |
| Storage | $0.18 / GB / month | Includes indexes |

### Cost Estimation Examples

| Scenario | Operations/day | Daily Cost | Monthly Cost |
|----------|----------------|------------|--------------|
| Normal usage (50 users) | ~50,000 reads | ~$0.03 | ~$1 |
| High usage (100 users) | ~200,000 reads | ~$0.12 | ~$4 |
| Cost spike (broken listener) | ~5,000,000 reads | ~$3.00 | ~$90 |

## Runbook: Cost Alert Response

### When a Budget Alert Fires

1. **Identify the Time Range**
   - Note when the alert was triggered
   - Check if it correlates with a recent deployment

2. **Check the Dashboard**
   - Open gastify 001 dashboard
   - Look for spike patterns in read/write counts
   - Compare with previous day/week

3. **Identify the Cause**

   **Common Causes:**

   | Pattern | Symptom | Likely Cause |
   |---------|---------|--------------|
   | Sustained reads | Constant high read rate | Missing `limit()` on query |
   | Read spikes | Periodic spikes every few seconds | Listener reconnecting repeatedly |
   | Write burst | Sudden write spike | Batch operation without throttling |
   | Storage jump | Sudden storage increase | Data duplication bug |

4. **Check Recent Deployments**
   ```bash
   # Check recent commits to main
   git log --oneline --since="7 days ago" origin/main

   # Check Firebase deployment history
   firebase hosting:channel:list
   ```

5. **Review Listener Code**

   Look for violations of `LISTENER_LIMITS` pattern:
   ```typescript
   // Good: Uses LISTENER_LIMITS
   query(collection(db, 'transactions'),
         where('userId', '==', userId),
         limit(LISTENER_LIMITS.TRANSACTIONS))

   // Bad: No limit (fetches entire collection)
   query(collection(db, 'transactions'),
         where('userId', '==', userId))
   ```

6. **Emergency Mitigation**

   If costs are spiking uncontrollably:

   ```bash
   # Option 1: Roll back to previous deployment
   firebase hosting:rollback

   # Option 2: Disable problematic feature via feature flag
   # (if applicable - update relevant feature flag in Firestore)
   ```

### Post-Incident Actions

1. **Root Cause Analysis**
   - Document what caused the spike
   - Update Atlas lessons learned (06-lessons.md)

2. **Prevention**
   - Add code review checklist item for query limits
   - Consider adding CI check for missing `limit()` calls

3. **Monitoring Enhancement**
   - If pattern was new, add specific alert for it
   - Update this runbook with the new scenario

## LISTENER_LIMITS Pattern Reference

From `src/config/constants.ts`:

```typescript
export const LISTENER_LIMITS = {
    TRANSACTIONS: 100,
    GROUPS: 50,
    TRUSTED_MERCHANTS: 200,
    MAPPINGS: 500,
} as const;
```

**Rule:** Every Firestore `onSnapshot` listener MUST include a `limit()` clause using these constants.

## Related Documentation

- [Architecture](../architecture/architecture.md) - System architecture including Firestore patterns
- [Firestore Optimization Stories](../sprint-artifacts/epic14/stories/) - Stories 14.25-14.27 that implemented LISTENER_LIMITS

## Access & Permissions

| Resource | Required Role | Notes |
|----------|---------------|-------|
| Budget alerts | Billing Admin | Can view and edit budgets |
| Monitoring dashboard | Monitoring Viewer | Read-only access to metrics |
| Firebase Console | Firebase Admin | Full project access |

---

*This document satisfies AC1-AC12 of Story 14c-refactor.16*
