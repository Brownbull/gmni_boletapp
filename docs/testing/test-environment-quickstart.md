# Test Environment Quick Start Guide

**Last Updated:** 2025-11-22
**Purpose:** Quick reference for starting Firebase emulators and running test data reset

> **⚠️ WSL Users:** The Firebase Emulator UI (web interface) may not work in WSL due to networking limitations. Use the CLI Data Viewer instead (see Step 4, Option A).

---

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** - `node --version`
- ✅ **Java 11+** - `java -version` (required for Firebase emulators)
- ✅ **Firebase CLI** - `firebase --version`
- ✅ **Dependencies installed** - `npm install`

### Install Java (if needed)

```bash
# WSL/Linux
sudo apt update && sudo apt install -y default-jre

# macOS
brew install openjdk@11

# Verify installation
java -version
```

---

## Quick Start: 4 Steps (WSL-Compatible)

### Step 1: Start Firebase Emulators

Open a terminal and run:

```bash
npm run emulators
```

**Expected Output:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect.         │
│                                                             │
│ View Emulator UI at http://127.0.0.1:4000                  │
└─────────────────────────────────────────────────────────────┘

┌────────────────┬────────────────┬─────────────────────────────────┐
│ Emulator       │ Host:Port      │ View in Emulator UI             │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Authentication │ localhost:9099 │ http://localhost:4000/auth      │
├────────────────┼────────────────┼─────────────────────────────────┤
│ Firestore      │ localhost:8080 │ http://localhost:4000/firestore │
└────────────────┴────────────────┴─────────────────────────────────┘
```

**What's Running:**
- 🔐 **Authentication Emulator** - Port 9099
- 🗄️ **Firestore Emulator** - Port 8080
- 🖥️ **Emulator UI** - Port 4000 (http://localhost:4000)

**Note:** Keep this terminal window open. The emulators will continue running until you press `Ctrl+C`.

---

### Step 2: Open Emulator UI (Optional)

Open your browser and navigate to:

```
http://localhost:4000
```

You should see the **Firebase Emulator Suite** dashboard showing:
- Authentication emulator: **On** (port 9099)
- Firestore emulator: **On** (port 8080)
- Other emulators: **Off** (not configured)

> **⚠️ WSL Note:** If you get a blank page or CORS errors, skip this step and use the CLI Data Viewer in Step 4 instead.

---

### Step 3: Populate Test Data

Open a **NEW terminal window** (keep emulators running in the first one) and run:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

**What This Does:**
1. Connects to the Firestore emulator (NOT production)
2. Deletes any existing test user data
3. Creates 18 fixture transactions:
   - 10 transactions for `test-user-1-uid`
   - 8 transactions for `test-user-2-uid`
4. Verifies data integrity

**Expected Output:**

```
============================================================
RESET TEST DATA SCRIPT
============================================================

============================================================
SAFETY CHECK
============================================================
Target Users:
  - test-user-1-uid
  - test-user-2-uid

Safety Validations:
✓ Only test-user-*-uid patterns will be modified
✓ Admin user will NOT be touched
✓ Production users will NOT be touched

============================================================
PROCESSING TEST USERS
============================================================

Processing: test-user-1-uid
Step 1: Deleting existing transactions...
  Found 0 existing transactions
  ✓ Deleted 0 transactions
Step 2: Adding fixture transactions...
  Adding 10 fixture transactions
  ✓ Added 10 transactions
Step 3: Verifying data integrity...
  ✓ Verification passed: 10 transactions with valid structure

Processing: test-user-2-uid
Step 1: Deleting existing transactions...
  Found 0 existing transactions
  ✓ Deleted 0 transactions
Step 2: Adding fixture transactions...
  Adding 8 fixture transactions
  ✓ Added 8 transactions
Step 3: Verifying data integrity...
  ✓ Verification passed: 8 transactions with valid structure

============================================================
RESET COMPLETE
============================================================
Total Deleted: 0
Total Added: 18
Test Users Reset: 2

✓ Test data reset successful!

Idempotence Check:
You can run this script multiple times safely.
Each run will produce the same fixture state.

Script completed successfully
```

---

## Step 4: Verify Test Data

Choose one of the following methods to verify your test data:

### Option A: CLI Data Viewer (Recommended for WSL)

Run the CLI data viewer script:

```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data
```

**Expected Output:**

```
============================================================
EMULATOR DATA VIEWER
============================================================

User: test-user-1-uid
----------------------------------------
  Total transactions: 10

  1. Whole Foods - $127.45 (groceries)
     Date: 2025-11-20T10:30:00.000Z
     Items: 12

  2. Starbucks - $8.75 (dining)
     Date: 2025-11-20T08:15:00.000Z
     Items: 2

  3. Shell Gas Station - $52.3 (transport)
     Date: 2025-11-19T17:45:00.000Z
     Items: 1

  [... 7 more transactions ...]

User: test-user-2-uid
----------------------------------------
  Total transactions: 8

  1. Amazon - $89.99 (shopping)
     Date: 2025-11-20T14:20:00.000Z
     Items: 3

  [... 7 more transactions ...]

============================================================
View complete!
============================================================
```

**What You're Seeing:**
- ✅ `test-user-1-uid`: 10 transactions (groceries, dining, transport, etc.)
- ✅ `test-user-2-uid`: 8 transactions (different spending pattern)
- ✅ Each transaction shows: merchant, amount, category, date, and item count

---

### Option B: Emulator UI (May Not Work in WSL)

Back in your browser (http://localhost:4000):

1. Click **"Go to firestore emulator"** on the Firestore card
2. Navigate the data tree:
   ```
   artifacts
   └── boletapp-gmni-001
       └── users
           ├── test-user-1-uid
           │   └── transactions (10 documents)
           └── test-user-2-uid
               └── transactions (8 documents)
   ```
3. Click on any transaction document to view its data

**You should see:**
- `test-user-1-uid`: 10 transactions (groceries, dining, transport, etc.)
- `test-user-2-uid`: 8 transactions (different spending pattern)

> **⚠️ WSL Limitation:** If you encounter CORS errors or blank pages in the Emulator UI, this is a known limitation of Firebase Emulator UI in WSL environments. Use the CLI Data Viewer (Option A) instead.

---

## Common Commands

### Start Emulators
```bash
npm run emulators
```

### Reset Test Data
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

### View Test Data (CLI - WSL-Compatible)
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data
```

### Stop Emulators
Press `Ctrl+C` in the terminal where emulators are running.

### View Emulator UI (May Not Work in WSL)
```
http://localhost:4000
```

### Check Emulator Status
All emulators:
```
http://localhost:4000
```

Authentication emulator:
```
http://localhost:4000/auth
```

Firestore emulator:
```
http://localhost:4000/firestore
```

---

## Test Users Reference

| User | UID | Email | Transactions | Purpose |
|------|-----|-------|--------------|---------|
| Admin | `test-admin-uid` | `admin@boletapp.test` | 0 | Future admin testing |
| Test User 1 | `test-user-1-uid` | `test-user-1@boletapp.test` | 10 | Primary test user |
| Test User 2 | `test-user-2-uid` | `test-user-2@boletapp.test` | 8 | Secondary test user |

---

## Troubleshooting

### Error: "Could not spawn java -version"

**Problem:** Java is not installed.

**Solution:**
```bash
# Install Java
sudo apt update && sudo apt install -y default-jre

# Verify
java -version
```

---

### Error: "Port 9099 already in use"

**Problem:** Another process is using emulator ports.

**Solution:**
```bash
# Find and kill process using port 9099
lsof -ti:9099 | xargs kill -9

# Then restart emulators
npm run emulators
```

---

### Error: Reset script fails with "Missing required Firebase environment variables"

**Problem:** Script is trying to connect to production instead of emulator.

**Solution:** Always include the environment variable:
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

---

### Emulator UI shows "No data" or blank page (WSL)

**Problem:** Reset script hasn't been run yet, emulators were restarted, or WSL networking limitations.

**Solution 1 - Use CLI Data Viewer (Recommended for WSL):**
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:view-data
```

**Solution 2 - Reset and try UI again:**
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test:reset-data
```

**Note:** Emulator data is **ephemeral** - it's cleared when emulators stop. You'll need to run the reset script each time you restart the emulators.

**WSL Note:** If the Emulator UI continues to show blank pages or CORS errors, this is a known limitation in WSL environments. The CLI Data Viewer (Solution 1) is the reliable alternative.

---

## Testing Workflow

For a complete testing session:

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

4. **Run your tests** (Terminal 2):
   ```bash
   # Example: Run unit tests with emulator
   FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test
   ```

5. **Stop emulators** when done (Terminal 1):
   ```
   Press Ctrl+C
   ```

---

## Important Notes

### ⚠️ Data is Ephemeral

Emulator data is cleared when you stop the emulators. Always run the reset script after restarting emulators.

### ✅ Safe for Development

The emulators are completely isolated from production. You can:
- Create/delete data freely
- Test security rules
- Run destructive operations
- Reset to clean state anytime

### 🔒 Production Safety

The reset script has built-in safety checks:
- Only targets `test-user-*-uid` patterns
- Displays 5-second warning if running against production
- Validates operations before execution

**Best Practice:** Always use `FIRESTORE_EMULATOR_HOST=localhost:8080` prefix when running the reset script.

---

## Related Documentation

- **[Test Environment Guide](./test-environment.md)** - Comprehensive guide with advanced topics
- **[Test Strategy](./test-strategy.md)** - Testing approach and risk analysis
- **[Architecture](./architecture.md)** - System architecture and data flows
- **[Development Guide](./development-guide.md)** - Full development setup

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

# 5. Stop emulators
Ctrl+C
```

**Ports:**
- Auth: 9099
- Firestore: 8080
- UI: 4000

**Test Users:**
- test-user-1-uid (10 transactions)
- test-user-2-uid (8 transactions)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Epic:** Epic 2 - Testing Infrastructure & Documentation
