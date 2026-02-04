# Staging Environment Testing

Scripts and E2E tests for the Firebase staging environment (`boletapp-staging`).

## Quick Start

```bash
# 1. Ensure you have the service account key
# Download from: https://console.firebase.google.com/project/boletapp-staging/settings/serviceaccounts/adminsdk
# Save as: scripts/keys/serviceAccountKey.staging.json

# 2. Start the staging dev server
npm run dev:staging

# 3. Seed test data (idempotent - safe to run multiple times)
npm run staging:seed

# 4. Add current month transactions (optional, also idempotent)
npm run staging:add-current

# 5. Run Playwright tests
npm run staging:test
```

## Available npm Scripts

| Script | Purpose |
|--------|---------|
| `npm run staging:seed` | Seed 30-60 transactions per user (past 90 days) |
| `npm run staging:add-current` | Add 3-5 transactions for current month |
| `npm run staging:verify` | Check transaction counts per user |
| `npm run staging:clear` | Delete all transactions (for re-seeding) |
| `npm run staging:inspect` | Debug: inspect transaction data format |
| `npm run staging:debug-path` | Debug: verify Firestore path structure |
| `npm run staging:test` | Run Playwright E2E tests against staging |

## Idempotency

All seeding scripts are **idempotent** - they check for existing data before adding:

- `staging:seed` - Skips users who already have transactions
- `staging:add-current` - Skips users who already have 5+ current month transactions

This means you can safely run these scripts multiple times without creating duplicates.

## Test Users

| User | Email | Role | Password |
|------|-------|------|----------|
| Alice | alice@boletapp.test | Group Owner | test-password-123! |
| Bob | bob@boletapp.test | Group Member | test-password-123! |
| Charlie | charlie@boletapp.test | Invitee | test-password-123! |
| Diana | diana@boletapp.test | Observer | test-password-123! |

## Directory Structure

```
tests/staging/
├── README.md                 # This file
├── scripts/
│   ├── seed-staging-transactions.ts
│   ├── add-current-month-transactions.ts
│   ├── verify-staging-transactions.ts
│   ├── clear-staging-transactions.ts
│   ├── inspect-transactions.ts
│   └── debug-path.ts
tests/e2e/staging/
└── verify-staging-ui.spec.ts # Playwright E2E tests
```

## Critical Data Format Requirements

When seeding transaction data, you MUST follow these requirements to match the app's expectations:

### 1. Firestore Path Structure

```
artifacts/{projectId}/users/{userId}/transactions/{transactionId}
```

**Important**: The `{projectId}` is `boletapp-staging` (from `firebaseConfig.projectId`), NOT the Firebase App ID.

```typescript
// CORRECT - uses project ID
const STAGING_APP_ID = 'boletapp-staging';
db.collection('artifacts').doc(STAGING_APP_ID).collection('users')...

// WRONG - uses Firebase App ID
const STAGING_APP_ID = '1:660389690821:web:44df423653740399e39fac';
```

This is defined in `src/contexts/AuthContext.tsx`:
```typescript
const appId = firebaseConfig.projectId; // Line 140
```

### 2. Field Names

The Transaction type (`src/types/transaction.ts`) expects specific field names:

```typescript
// CORRECT
{
  merchant: 'Starbucks',      // NOT storeName
  category: 'Restaurant',     // NOT storeCategory
  total: 7850,
  date: '2026-02-03',         // ISO string
  items: [],
  type: 'personal',
  period: '2026-02',
  currency: 'CLP',
}

// WRONG
{
  storeName: 'Starbucks',     // App expects 'merchant'
  storeCategory: 'Restaurant', // App expects 'category'
  date: new Date(),           // App expects string, not Date
}
```

### 3. Date Format

The `date` field MUST be a string in ISO format (`YYYY-MM-DD`), NOT a JavaScript Date object:

```typescript
// CORRECT - ISO string
const date = new Date();
const dateString = date.toISOString().split('T')[0]; // "2026-02-03"
{ date: dateString }

// WRONG - Date object becomes Firestore Timestamp
{ date: new Date() }  // Causes "dateString.split is not a function" error
```

## Troubleshooting

### "dateString.split is not a function" Error

**Cause**: The `date` field was stored as a Firestore Timestamp instead of a string.

**Fix**: Clear and re-seed with ISO date strings:
```bash
npm run staging:clear
npm run staging:seed
```

### Transactions Not Showing in UI

1. **Check Firestore path**: Run `npm run staging:debug-path`
2. **Check field names**: Run `npm run staging:inspect`
3. **Check security rules**: Deploy with `firebase deploy --only firestore:rules --project boletapp-staging`

### Login Works but Dashboard Shows $0

This usually means the data is at the wrong path or has wrong field names. Verify:
1. Path uses `boletapp-staging` (project ID), not Firebase App ID
2. Fields are `merchant`/`category`, not `storeName`/`storeCategory`
3. Date is a string, not a Timestamp

## Environment Setup

### Required Files

1. **Service Account Key**: `scripts/keys/serviceAccountKey.staging.json`
   - Download from Firebase Console → Project Settings → Service Accounts
   - This file is gitignored for security

2. **Environment File**: `.env.staging` (already in repo)
   - Contains Firebase staging project credentials
   - `VITE_E2E_MODE=production` (connects to real Firebase, not emulator)

### Related npm Scripts

```json
{
  "dev:staging": "bash -c 'unset ${!VITE_FIREBASE_*} ... && vite --mode staging'",
  "build:staging": "... vite build --mode staging",
  "deploy:staging": "npm run build:staging && firebase deploy --only hosting --project boletapp-staging"
}
```

Note: The `dev:staging` script unsets shell environment variables to ensure `.env.staging` is used.

## Security Rules

The staging project needs matching security rules:

```bash
firebase deploy --only firestore:rules --project boletapp-staging
```

Rules allow read/write for authenticated users on their own data:
```
match /artifacts/{appId}/users/{userId}/transactions/{transactionId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```
