# Scripts Directory

Utility scripts for administration, testing, development, and maintenance.

## Directory Structure

```
scripts/
├── admin/          # User administration (credits, subscriptions)
├── archive/        # Completed one-time migration/cleanup scripts
├── ci/             # CI/CD pipeline scripts
├── data/           # Data generation and fixtures
├── dev/            # Development utilities
├── security/       # Security scanning and auditing
└── testing/        # Test setup and emulator scripts
```

## Folders

### `admin/` - Administration Scripts

Scripts for managing users, credits, and subscriptions in production.

| Script | Description |
|--------|-------------|
| `admin-apply-config.ts` | Apply batch changes from YAML config file |
| `admin-user-credits.ts` | Manage individual user credits |
| `admin-user-subscription.ts` | Manage individual user subscriptions |
| `admin-user-config.example.yaml` | Example configuration file |

**Documentation:** See [docs/business/admin-procedures.md](../docs/business/admin-procedures.md)

**Usage:**
```bash
# Config file approach (recommended)
npx tsx scripts/admin/admin-apply-config.ts config.yaml --dry-run
npx tsx scripts/admin/admin-apply-config.ts config.yaml

# Individual commands
npx tsx scripts/admin/admin-user-credits.ts get <userId>
npx tsx scripts/admin/admin-user-subscription.ts grant <userId> --tier pro --days 30
```

---

### `ci/` - CI/CD Scripts

Scripts used by the CI/CD pipeline.

| Script | Description |
|--------|-------------|
| `check-bundle-size.sh` | Check build bundle size against thresholds |

---

### `data/` - Data Generation

Scripts for generating test and demo data.

| Script | Description |
|--------|-------------|
| `generate-yearly-transactions.ts` | Generate realistic yearly transaction data |
| `generated-data/` | Output directory for generated data files |

**Usage:**
```bash
npx tsx scripts/data/generate-yearly-transactions.ts
```

---

### `dev/` - Development Utilities

Helper scripts for local development.

| Script | Description |
|--------|-------------|
| `cleanup-claude-sessions.sh` | Clean up Claude Code session files |
| `lighthouse-auth.js` | Lighthouse authentication helper |

---

### `security/` - Security Scripts

Scripts for security scanning and auditing.

| Script | Description |
|--------|-------------|
| `scan-secrets.sh` | Scan codebase for exposed secrets |
| `security-audit.sh` | Run comprehensive security audit |

**Usage:**
```bash
./scripts/security/scan-secrets.sh
./scripts/security/security-audit.sh
```

---

### `testing/` - Testing Scripts

Scripts for test setup and Firebase emulator operations.

| Script | Description |
|--------|-------------|
| `create-test-user.ts` | Create test users in emulator |
| `reset-e2e-cooldowns.ts` | Reset toggle cooldown fields in staging (E2E) |
| `reset-test-data.ts` | Reset emulator to clean state |
| `test-data-fixtures.ts` | Load test fixtures into emulator |
| `test-local.sh` | Run tests with local emulator |
| `view-emulator-data.ts` | View data in emulator |

**Usage:**
```bash
# Start emulators first, then:
npx tsx scripts/testing/create-test-user.ts
npx tsx scripts/testing/reset-test-data.ts
./scripts/testing/test-local.sh

# Reset E2E cooldowns (staging only, requires service account key):
npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id <id> --execute
npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id <id> --user-email bob@boletapp.test --execute
```

---

---

### `archive/` - Completed One-Time Scripts

Scripts that have been run and are no longer needed for active use.

| Script | Description |
|--------|-------------|
| `archive/add-sharedGroupIds-field.ts` | Add `sharedGroupIds` field to all transactions |
| `archive/fix-duplicate-sharedGroupIds.ts` | Remove duplicate entries from `sharedGroupIds` arrays |
| `archive/migrate-createdAt-admin.cjs` | Standardize `createdAt` field format (CommonJS) |
| `archive/migrate-createdAt-admin.js` | Standardize `createdAt` field format (ES module) |
| `archive/migrate-createdAt.ts` | Standardize `createdAt` field format (TypeScript) |
| `archive/cleanup-shared-groups.ts` | Remove all shared group data from Firestore (Epic 14c-refactor) |

---

## Prerequisites

Most TypeScript scripts require:
- Node.js 18+
- Firebase Admin SDK credentials (for admin scripts)

```bash
# For admin scripts targeting production
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
export FIREBASE_PROJECT_ID="boletapp-prod"

# For testing scripts (uses emulator)
export FIRESTORE_EMULATOR_HOST="localhost:8080"
export FIREBASE_AUTH_EMULATOR_HOST="localhost:9099"
```

### Firebase Admin Authentication (for migration scripts)

**Option A: Service Account Key (Recommended)**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `scripts/serviceAccountKey.json`
4. **Never commit this file** (it's in .gitignore)

**Option B: Google Cloud CLI**
```bash
gcloud auth application-default login
```

**Option C: Environment Variable**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```
