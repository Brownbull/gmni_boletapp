# Scripts Directory

Utility scripts for administration, testing, development, and maintenance.

## Directory Structure

```
scripts/
├── admin/          # User administration (credits, subscriptions)
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
```

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
