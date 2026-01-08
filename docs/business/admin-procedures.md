# Admin Procedures: Credits & Subscription Management

**Version:** 1.1
**Last Updated:** 2026-01-06
**Status:** Active

---

## Overview

This document describes the administrative procedures for managing user credits and subscriptions in Boletapp. These operations are performed via command-line scripts that directly interact with the Firestore database.

**Available Tools:**
1. **Config File Approach (Recommended)**: Apply batch changes via YAML file
2. **Individual Commands**: Make single-user changes via CLI

---

## Quick Start: Configuration File Approach

The fastest way to apply credit/subscription changes is using a YAML configuration file.

### Step 1: Create Configuration File

```bash
# Copy the example file
cp scripts/admin/admin-user-config.example.yaml my-changes.yaml
```

### Step 2: Edit the Configuration

```yaml
# my-changes.yaml
users:
  # Set exact credit values
  - email: "user1@example.com"
    credits:
      mode: "set"        # "set" = absolute, "add" = increment
      normal: 500        # Set to 500 normal credits
      super: 50          # Set to 50 super credits

  # Add credits to existing balance
  - email: "user2@example.com"
    credits:
      mode: "add"
      normal: 100        # Add 100 normal credits
      super: 10          # Add 10 super credits

  # Grant subscription
  - email: "user3@example.com"
    subscription:
      tier: "pro"        # free, basic, pro, max
      days: 30           # Duration (omit for lifetime)
      reason: "Beta tester"

  # Full setup (credits + subscription)
  - email: "vip@example.com"
    credits:
      mode: "set"
      normal: 1000
      super: 100
    subscription:
      tier: "max"
      days: 365
      reason: "VIP annual"

metadata:
  admin: "your.name@company.com"
  ticket: "SUPPORT-1234"
  notes: "Q1 2026 promotional credits"
```

### Step 3: Preview Changes (Dry Run)

```bash
npx tsx scripts/admin/admin-apply-config.ts my-changes.yaml --dry-run
```

This shows what would be changed without making any modifications.

### Step 4: Apply Changes

```bash
npx tsx scripts/admin/admin-apply-config.ts my-changes.yaml
```

### Example Output

```
======================================================================
🔧 Admin Configuration Processor
======================================================================
Project:     boletapp-prod
App ID:      boletapp
Config File: my-changes.yaml
Mode:        ⚡ LIVE (applying changes)
Users:       4

Metadata:
  Admin:    your.name@company.com
  Ticket:   SUPPORT-1234
======================================================================

Processing users...

  [1/4] user1@example.com... ✅
  [2/4] user2@example.com... ✅
  [3/4] user3@example.com... ✅
  [4/4] vip@example.com... ✅

======================================================================
✅ EXECUTION RESULTS
======================================================================

✅ Successful: 4

  📧 user1@example.com
     User ID: abc123
     • Normal credits: 1200 → 500
     • Super credits: 100 → 50

  📧 user2@example.com
     User ID: def456
     • Normal credits: 850 + 100 = 950
     • Super credits: 95 + 10 = 105

  📧 user3@example.com
     User ID: ghi789
     • Subscription: PRO for 30 days (until 2026-02-06)

  📧 vip@example.com
     User ID: jkl012
     • Normal credits: 500 → 1000
     • Super credits: 50 → 100
     • Subscription: MAX for 365 days (until 2027-01-06)

======================================================================
Total: 4 | Success: 4 | Failed: 0
======================================================================
```

---

## Prerequisites

### 1. Firebase Admin SDK Authentication

Before running any admin scripts, you must authenticate with Firebase:

**Option A: Service Account (Recommended for Production)**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Option B: Application Default Credentials (Development)**
```bash
gcloud auth application-default login
```

### 2. Environment Configuration

```bash
# Set the target Firebase project (default: boletapp-prod)
export FIREBASE_PROJECT_ID="boletapp-prod"

# Set the app ID (default: boletapp)
export BOLETAPP_APP_ID="boletapp"
```

---

## Credit Management

### Firestore Data Structure

**Path:** `artifacts/{appId}/users/{userId}/credits/balance`

```typescript
{
  remaining: number,       // Normal credits available for scanning
  used: number,            // Lifetime normal credits consumed
  superRemaining: number,  // Super credits available (premium tier)
  superUsed: number,       // Lifetime super credits consumed
  updatedAt: Timestamp,    // Last modification timestamp
  createdAt: Timestamp     // Initial creation timestamp
}
```

### Credit Types

| Credit Type | Description | Default Allocation | Display Location |
|-------------|-------------|-------------------|------------------|
| **Normal Credits** | Standard scan credits | 1,200 | Nav FAB (bottom-right, theme color) |
| **Super Credits** | Premium tier-2 credits | 100 | Nav FAB (bottom-left, amber/gold) |

### Commands

#### View User Credits
```bash
npx tsx scripts/admin/admin-user-credits.ts get <userId>
```

**Example Output:**
```
===========================================
User ID: abc123xyz
===========================================

Normal Credits:
  Remaining: 850
  Used:      350

Super Credits:
  Remaining: 95
  Used:      5

Last Updated: 2026-01-06T10:30:00.000Z
Created:      2026-01-01T00:00:00.000Z
===========================================
```

#### Set Credits (Absolute Value)
```bash
# Set normal credits to 500
npx tsx scripts/admin/admin-user-credits.ts set <userId> --credits 500

# Set super credits to 50
npx tsx scripts/admin/admin-user-credits.ts set <userId> --super 50

# Set both
npx tsx scripts/admin/admin-user-credits.ts set <userId> --credits 500 --super 50
```

#### Add Credits (Relative)
```bash
# Add 100 normal credits
npx tsx scripts/admin/admin-user-credits.ts add <userId> --credits 100

# Add 10 super credits
npx tsx scripts/admin/admin-user-credits.ts add <userId> --super 10

# Add both
npx tsx scripts/admin/admin-user-credits.ts add <userId> --credits 100 --super 10
```

#### Reset to Defaults
```bash
npx tsx scripts/admin/admin-user-credits.ts reset <userId>
```

Resets to: 1,200 normal credits, 100 super credits, 0 used counts.

---

## Subscription Management

### Firestore Data Structure

**Path:** `artifacts/{appId}/users/{userId}/subscription/current`

```typescript
{
  tier: 'free' | 'basic' | 'pro' | 'max',
  startDate: Timestamp,           // When subscription started
  endDate: Timestamp | null,      // Expiration (null = lifetime)
  paymentProvider: string | null, // 'mercado_pago', 'admin_grant', etc.
  subscriptionId: string | null,  // External provider reference
  grantedBy: string | null,       // Admin who granted (for manual)
  grantReason: string | null,     // Reason for manual action
  updatedAt: Timestamp,
  createdAt: Timestamp
}
```

### Subscription Tiers

| Tier | Price (CLP) | Scans/Month | Image Retention | Features |
|------|-------------|-------------|-----------------|----------|
| **Free** | $0 | 30 | 2 months | Basic analytics |
| **Basic** | $2,000-3,000 | 30 | 12 months | CSV export |
| **Pro** | $4,000-5,000 | 300 | 12 months | Full analytics |
| **Max** | $10,000 | 900 | 24 months | Excel export, priority support |

### Commands

#### View User Subscription
```bash
npx tsx scripts/admin/admin-user-subscription.ts get <userId>
```

**Example Output:**
```
===========================================
User ID: abc123xyz
===========================================

Current Tier: PRO
  Scans/Month: 300
  Retention:   12 months

Subscription Started: 2026-01-01T00:00:00.000Z
Expires: 2026-02-01T00:00:00.000Z
Status: ACTIVE (26 days remaining)

Payment Provider: mercado_pago
Subscription ID: mp-sub-123456

Last Updated: 2026-01-01T00:00:00.000Z
===========================================
```

#### Set Subscription Tier
```bash
# Change tier (immediate effect)
npx tsx scripts/admin/admin-user-subscription.ts set <userId> --tier pro

# Set tier with expiration date
npx tsx scripts/admin/admin-user-subscription.ts set <userId> --tier pro --expires 2026-12-31

# Add audit information
npx tsx scripts/admin/admin-user-subscription.ts set <userId> --tier max --admin "john.doe" --reason "VIP customer"
```

#### Grant Subscription (Time-Limited)
```bash
# Grant 30 days (default)
npx tsx scripts/admin/admin-user-subscription.ts grant <userId> --tier pro

# Grant specific duration
npx tsx scripts/admin/admin-user-subscription.ts grant <userId> --tier max --days 90

# Grant with documentation
npx tsx scripts/admin/admin-user-subscription.ts grant <userId> --tier pro --days 60 --admin "jane.smith" --reason "Beta tester reward"
```

#### Revoke Subscription
```bash
# Revoke (sets to free tier immediately)
npx tsx scripts/admin/admin-user-subscription.ts revoke <userId>

# Revoke with reason
npx tsx scripts/admin/admin-user-subscription.ts revoke <userId> --admin "admin" --reason "Payment dispute"
```

#### List Premium Subscribers
```bash
npx tsx scripts/admin/admin-user-subscription.ts list-premium
```

**Example Output:**
```
Found 3 premium subscribers:

  user123: Pro (expires: 2026-02-15)
  user456: Max (expires: Never)
  user789: Basic (expires: 2026-01-20)
```

---

## Common Use Cases

### 1. Customer Support: User Ran Out of Credits

**Situation:** User contacted support saying they can't scan receipts.

**Steps:**
```bash
# 1. Check current credits
npx tsx scripts/admin/admin-user-credits.ts get user123

# 2. If depleted, add credits as goodwill gesture
npx tsx scripts/admin/admin-user-credits.ts add user123 --credits 30

# 3. Verify the change
npx tsx scripts/admin/admin-user-credits.ts get user123
```

### 2. Promotional Campaign: Grant Premium Trial

**Situation:** Marketing wants to give 100 users a free 14-day Pro trial.

**Steps:**
```bash
# For each user in the campaign list:
npx tsx scripts/admin/admin-user-subscription.ts grant <userId> --tier pro --days 14 --admin "marketing" --reason "Q1 2026 promo campaign"
```

### 3. Payment Failed: Downgrade User

**Situation:** Payment provider reports failed subscription renewal.

**Steps:**
```bash
# 1. Check current subscription
npx tsx scripts/admin/admin-user-subscription.ts get user123

# 2. Downgrade to free tier
npx tsx scripts/admin/admin-user-subscription.ts revoke user123 --admin "billing-system" --reason "Payment failed - auto-downgrade"

# 3. Optionally reset credits to free tier limits
npx tsx scripts/admin/admin-user-credits.ts set user123 --credits 30
```

### 4. VIP Customer: Lifetime Max Subscription

**Situation:** CEO wants to give a partner lifetime max access.

**Steps:**
```bash
# Grant max tier without expiration
npx tsx scripts/admin/admin-user-subscription.ts set user123 --tier max --admin "ceo" --reason "Strategic partner - lifetime access"

# Note: When --expires is not specified, endDate will not be set (lifetime)
```

### 5. Bug Compensation: Add Super Credits

**Situation:** User lost data due to a bug, compensate with super credits.

**Steps:**
```bash
npx tsx scripts/admin/admin-user-credits.ts add user123 --super 20 --reason "Compensation for data loss incident #1234"
```

---

## Audit Trail

All admin operations are tracked in the Firestore documents:

1. **Credits:** `updatedAt` timestamp shows when last modified
2. **Subscriptions:** `grantedBy` and `grantReason` fields track who made changes and why
3. **Payment Provider:** Set to `admin_grant`, `admin_revoke`, or `admin_manual` for manual operations

**Recommendation:** Always use `--admin` and `--reason` flags for audit compliance:
```bash
npx tsx scripts/admin/admin-user-subscription.ts grant user123 --tier pro --days 30 \
  --admin "your.name" \
  --reason "Support ticket #12345"
```

---

## Security Considerations

1. **Access Control:** Only authorized personnel should have access to:
   - Service account keys
   - Firebase console
   - Production server access

2. **Logging:** Consider implementing Cloud Functions to log all credit/subscription changes to a separate audit collection.

3. **Rate Limiting:** Be cautious when running batch operations to avoid Firestore rate limits.

4. **Data Validation:** The scripts validate tier names but trust numeric inputs - double-check values before execution.

---

## Troubleshooting

### Authentication Error
```
Failed to initialize Firebase Admin SDK.
```
**Solution:** Ensure GOOGLE_APPLICATION_CREDENTIALS is set or run `gcloud auth application-default login`.

### User Not Found
```
Status: No credits document found (new user)
```
**Solution:** This is normal for users who haven't scanned yet. Use `set` or `reset` to create their credits document.

### Invalid Tier
```
Invalid tier: premium
Valid tiers: free, basic, pro, max
```
**Solution:** Use one of the valid tier names: `free`, `basic`, `pro`, or `max`.

---

## Change Log

| Date | Version | Change |
|------|---------|--------|
| 2026-01-06 | 1.0 | Initial admin procedures documentation |
