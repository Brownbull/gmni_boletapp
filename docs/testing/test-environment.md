# Test Environment Guide

**Last Updated:** 2026-02-05
**Epic:** Epic 2 - Testing Infrastructure & Documentation
**Purpose:** Guide for managing test users, fixtures, and Firebase emulator environment

---

## Overview

This document explains how to set up and use the Boletapp test environment. The test environment uses Firebase Emulators to provide isolated, repeatable testing without affecting production data.

> **WSL Users:** The Firebase Emulator UI (web interface) may not work in WSL due to networking limitations. Use the CLI Data Viewer as an alternative (see [Verifying Test Data](#verifying-test-data)).

### Key Components

1. **Firebase Emulator Suite** - Local Auth + Firestore emulation
2. **Test Users** - 3 predefined test accounts with specific UIDs
3. **Transaction Fixtures** - 18 realistic transaction records
4. **Reset Script** - Idempotent script to restore fixture state
5. **CLI Data Viewer** - Terminal-based data inspector (WSL-compatible)

---

## Prerequisites

### System Requirements

- **Node.js:** 18+ (for running scripts and emulators)
- **Java:** 11+ (required for Firebase emulators)
- **Firebase CLI:** Latest version (`npm install -g firebase-tools`)
- **npm:** 9+ (for managing dependencies)

### Installation Check

```bash
# Check Node.js version
node --version  # Should be v18+

# Check Java version
java -version   # Should be 11+

# Check Firebase CLI
firebase --version  # Should be latest

# If Java is not installed (WSL/Linux):
sudo apt update && sudo apt install -y default-jre

# If Java is not installed (macOS):
brew install openjdk@11
```

---

## Firebase Emulator Suite

### What are Firebase Emulators?

Firebase Emulators provide a local development environment that simulates Firebase services (Auth, Firestore, etc.) without connecting to production. Benefits:

- **Fast** - No network latency, instant operations
- **Safe** - No risk of affecting production data
- **Free** - No quota limits or billing concerns
- **Offline** - Works without internet connection
- **Isolated** - Each test run starts with clean state

### Emulator Configuration

Configured in `firebase.json`:

```json
{
  "emulators": {
    "auth": {
      "port": 9099
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Ports:**
- **Auth Emulator:** Port 9099
- **Firestore Emulator:** Port 8080
- **Emulator UI:** Port 4000 (http://localhost:4000)

### Starting the Emulators

```bash
# Start emulators (Auth + Firestore)
npm run emulators

# Expected output:
# ┌─────────────────────────────────────────────────────────────┐
# │ All emulators ready! It is now safe to connect.             │
# │                                                             │
# │ View Emulator UI at http://127.0.0.1:4000                  │
# └─────────────────────────────────────────────────────────────┘
```

**Emulator UI Features:**
- Visual interface at http://localhost:4000
- View Auth users
- Browse Firestore collections
- Inspect data in real-time
- Clear data between test runs

> **WSL Note:** If the Emulator UI shows a blank page or CORS errors, this is a known WSL networking limitation. Use the CLI Data Viewer instead (see [Verifying Test Data](#verifying-test-data)).

### Stopping the Emulators

Press `Ctrl+C` in the terminal where emulators are running.

---

## Test Users

### User Accounts

Three test users are defined for different testing scenarios:

| User | UID | Email | Transactions | Purpose |
|------|-----|-------|--------------|---------|
| Admin | `test-admin-uid` | `admin@boletapp.test` | 0 | Future admin testing |
| Test User 1 | `test-user-1-uid` | `test-user-1@boletapp.test` | 10 | Primary test user |
| Test User 2 | `test-user-2-uid` | `test-user-2@boletapp.test` | 8 | Secondary test user |

**Test User 1 Pattern:** Balanced spending across categories (groceries, dining, transport, utilities, shopping, entertainment)

**Test User 2 Pattern:** More dining/entertainment focus, different merchant mix

### Test User UIDs

**IMPORTANT:** Test user UIDs are hardcoded in fixtures and reset script:

```typescript
const TEST_USER_UIDS = [
    'test-user-1-uid',  // User 1
    'test-user-2-uid'   // User 2
];
```

**Production vs. Emulator:**
- **Emulator:** Test users exist only in emulator session (recreated on each start)
- **Production (NOT RECOMMENDED):** If testing against production, create these users manually in Firebase Console with exact UIDs

### User Credentials

**Emulator Mode:**
- No passwords needed - emulator accepts any password
- Use Firebase Emulator UI to create test user sessions

**Production Mode (NOT RECOMMENDED):**
- Store passwords securely (e.g., LastPass, 1Password)
- **DO NOT commit passwords to Git**

---

## Transaction Fixtures

### Fixture Overview

Total of 18 transaction fixtures across 2 test users, defined in [`scripts/testing/test-data-fixtures.ts`](../../scripts/testing/test-data-fixtures.ts).

### Test User 1 Fixtures (10 transactions)

| Date | Category | Merchant | Total |
|------|----------|----------|-------|
| Today - 1 day | Supermarket | Whole Foods Market | $87.43 |
| Today - 3 days | Transport | Uber | $24.50 |
| Today - 5 days | Restaurant | Pizza Palace | $42.00 |
| Today - 7 days | Supermarket | Trader Joes | $63.21 |
| Today - 10 days | Services | Cinema 10 | $28.00 |
| Today - 12 days | Services | City Electric Utility | $120.00 |
| Today - 14 days | Restaurant | Starbucks | $8.75 |
| Today - 16 days | Transport | Shell Gas Station | $55.00 |
| Today - 18 days | Technology | Amazon | $134.99 |
| Today - 20 days | Supermarket | Safeway | $72.18 |

**Total:** $635.06 | **Categories:** 6 | **Average:** $63.51

### Test User 2 Fixtures (8 transactions)

| Date | Category | Merchant | Total |
|------|----------|----------|-------|
| Today - 2 days | Restaurant | The Steakhouse | $95.00 |
| Today - 4 days | Supermarket | Local Market | $48.30 |
| Today - 8 days | Transport | City Parking | $15.00 |
| Today - 11 days | Services | Concert Hall | $85.00 |
| Today - 13 days | Other | Fashion Boutique | $120.50 |
| Today - 15 days | Services | Internet Provider | $79.99 |
| Today - 17 days | Restaurant | Brunch Cafe | $52.00 |
| Today - 19 days | Supermarket | Farmers Market | $35.75 |

**Total:** $531.54 | **Categories:** 5 | **Average:** $66.44

### Fixture Data Structure

Fixtures match the `Transaction` type from [`src/types/transaction.ts`](../../src/types/transaction.ts):

```typescript
interface Transaction {
    id?: string;                  // Auto-generated by Firestore
    date: string;                 // ISO format: YYYY-MM-DD
    merchant: string;             // Store name
    alias?: string;               // Optional display name
    category: StoreCategory;      // One of the valid categories
    total: number;                // Total amount
    items: TransactionItem[];     // Line items
    createdAt?: any;              // Firestore server timestamp
    updatedAt?: any;              // Firestore server timestamp
}
```

**Design Principles:**
- Realistic data based on actual spending patterns
- Covers all major transaction categories
- Recent dates (last 30 days) for analytics testing
- Each transaction includes itemized breakdown
- Varied totals from $8.75 to $134.99

---

## Database Reset Script

### Purpose

The reset script ([`scripts/testing/reset-test-data.ts`](../../scripts/testing/reset-test-data.ts)) ensures test data is in a known, consistent state before test runs. It is **idempotent** - can be run multiple times with the same result.

### Usage

```bash
# Reset test data in Firebase Emulator
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

### What the Script Does

1. **Safety Check:** Confirms targeting only test users (test-user-1-uid, test-user-2-uid)
2. **Delete:** Removes all existing transactions for test users
3. **Recreate:** Adds fixture transactions from `test-data-fixtures.ts`
4. **Verify:** Validates data integrity (correct count, required fields)
5. **Report:** Displays summary (deleted count, added count, verification status)

### Safety Features

- **Only Test Users:** Script refuses to touch data outside test-user-*-uid pattern
- **Production Warning:** 5-second delay if running against production Firebase
- **Admin Protection:** Admin user (test-admin-uid) is NOT modified
- **Verification:** Post-reset integrity check ensures correct state
- **Idempotent:** Running 3x produces same result as running 1x

### When to Run Reset Script

- **Before Test Runs:** Ensure clean, known state
- **After Manual Testing:** Restore fixture state after manual data changes
- **CI/CD Pipeline:** Reset before automated test execution
- **After Emulator Restart:** Emulator data is ephemeral - cleared on stop

---

## Verifying Test Data

### Option A: CLI Data Viewer (Recommended for WSL)

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data
```

Shows all test user transactions in the terminal with merchant, amount, category, date, and item count.

### Option B: Emulator UI

Open http://localhost:4000 and navigate to the Firestore emulator to browse the data tree:

```
artifacts
  └── boletapp-gmni-001
      └── users
          ├── test-user-1-uid
          │   └── transactions (10 documents)
          └── test-user-2-uid
              └── transactions (8 documents)
```

> **WSL Limitation:** If the Emulator UI shows blank pages or CORS errors, this is a known WSL networking issue. Use the CLI Data Viewer (Option A) instead.

---

## Development Workflow

### Complete Testing Session

1. **Start emulators** (Terminal 1):
   ```bash
   npm run emulators
   ```

2. **Reset test data** (Terminal 2):
   ```bash
   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
   ```

3. **Verify test data** (Terminal 2):
   ```bash
   # WSL-compatible CLI viewer
   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data

   # OR open Emulator UI (may not work in WSL)
   # http://localhost:4000
   ```

4. **Run tests** (Terminal 2):
   ```bash
   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test
   ```

5. **Stop emulators** when done (Terminal 1): `Ctrl+C`

### Best Practices

- Always use emulators for local testing
- Reset data before test runs for consistency
- Verify emulators are running before debugging test failures
- Use Emulator UI or CLI Data Viewer to inspect data during debugging
- Never run tests against production Firebase
- Never commit test user passwords to Git
- Always prefix reset/view commands with `FIRESTORE_EMULATOR_HOST=localhost:8080`

### CI/CD Integration

For automated test pipelines (GitHub Actions, etc.):

```yaml
- name: Start Firebase Emulators
  run: npm run emulators &

- name: Reset Test Data
  run: |
    export FIRESTORE_EMULATOR_HOST=localhost:8080
    npm run test:reset-data

- name: Run Tests
  run: |
    export FIRESTORE_EMULATOR_HOST=localhost:8080
    npm run test
```

---

## Troubleshooting

### Emulators Won't Start

**Error:** `Could not spawn java -version`

**Solution:** Install Java:
```bash
# WSL/Linux
sudo apt update && sudo apt install -y default-jre

# macOS
brew install openjdk@11

# Verify installation
java -version
```

**Error:** `Port 9099 already in use`

**Solution:**
```bash
# Find and kill process using port 9099
lsof -ti:9099 | xargs kill -9

# Then restart emulators
npm run emulators
```

### Reset Script Fails

**Error:** `Missing required Firebase environment variables`

**Solution:** Ensure you include the emulator host prefix:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

**Error:** `Verification FAILED: Expected 10, got 0`

**Solution:** Firestore emulator might not be running. Start emulators first, then reset in another terminal.

### Emulator UI Blank Page or CORS Errors (WSL)

**Problem:** WSL networking limitations prevent the Emulator UI from loading.

**Solution:** Use the CLI Data Viewer:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data
```

### Test Users Not Appearing

**Issue:** Test users not visible in Emulator UI.

**Solution:** Emulator Auth users are ephemeral - recreated on each emulator start. Create test user sessions via:
1. Open Emulator UI: http://localhost:4000
2. Navigate to Authentication tab
3. Add test users manually OR run app and sign in with test emails

---

## Configuration Files

### Firebase Configuration

- **firebase.json** - Emulator ports and UI settings
- **.env** - Firebase project credentials (git-ignored)

### Test Infrastructure

- **scripts/test-data-fixtures.ts** - Transaction fixture definitions
- **scripts/reset-test-data.ts** - Database reset script
- **package.json** - npm scripts (`emulators`, `test:reset-data`, `test:view-data`)

---

## FAQ

**Q: Can I use production Firebase for testing?**
A: **Not recommended.** Use emulators to avoid production data pollution and accidental data loss.

**Q: Do test users persist across emulator restarts?**
A: No. Emulator Auth users are ephemeral. Use the reset script to recreate fixture data after each restart.

**Q: How do I add more test users?**
A: Update `test-data-fixtures.ts` with new user UID and fixtures, then update reset script.

**Q: Can I modify fixture data?**
A: Yes. Edit `scripts/test-data-fixtures.ts` and run reset script to apply changes.

**Q: What if I accidentally run reset against production?**
A: The script has a 5-second warning delay and only targets test-user-*-uid patterns. However, **always use emulators** to avoid risk.

**Q: The Emulator UI does not work in WSL. What do I do?**
A: Use the CLI Data Viewer: `FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data`

---

## Quick Reference Card

```bash
# 1. Start emulators
npm run emulators

# 2. Reset data (in new terminal)
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data

# 3. View data (WSL-compatible CLI viewer)
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data

# 4. Open UI (optional - may not work in WSL)
http://localhost:4000

# 5. Run tests
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test

# 6. Stop emulators
Ctrl+C
```

**Ports:** Auth: 9099 | Firestore: 8080 | UI: 4000

**Test Users:** test-user-1-uid (10 txns) | test-user-2-uid (8 txns)

---

## Related Documentation

- [Testing Guide](./testing-guide.md) - Test patterns, conventions, and guidelines
- [Architecture](../architecture/architecture.md) - System architecture and data flows
- [Development Guide](../development/development-guide.md) - Local development setup
- [API Contracts](../architecture/api-contracts.md) - Firebase Auth and Firestore APIs

---

**Last Updated:** 2026-02-05
**Maintainer:** TEA (Test Engineering & Automation)
**Epic:** Epic 2 - Testing Infrastructure & Documentation
