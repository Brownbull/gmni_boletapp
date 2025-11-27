# boletapp - Technical Specification

**Author:** Gabe
**Date:** 2025-11-26
**Project Level:** Quick Flow
**Change Type:** Security Enhancement
**Development Context:** Brownfield (Existing Production Application)

---

## Context

### Available Documents

**Loaded via INDEX_GUIDED strategy from `docs/index.md`:**

| Document | Purpose | Key Insights |
|----------|---------|--------------|
| `docs/index.md` | Master documentation index | Post-Epic 3 complete, 67 tests passing |
| `docs/architecture/architecture.md` | System architecture + 7 ADRs | Security model documented, Gemini key exposure noted |
| `docs/planning/epics.md` | Epic 4-8 definitions | Security Hardening scope defined |
| `firestore.rules` | Firestore security rules | User isolation implemented |
| `.github/workflows/test.yml` | CI/CD pipeline (19 steps) | No security scanning currently |
| `package.json` | Dependencies | No security-focused dev dependencies yet |

**Not Found (Not Required):**
- Product briefs (Epic 4 scope defined in retrospective)
- Research documents (Security requirements clear)

### Project Stack

**Runtime & Framework:**
| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js | 20.x (LTS) | Runtime environment |
| React | 18.3.1 | UI framework |
| TypeScript | 5.3.3 | Type-safe development |
| Vite | 5.4.0 | Build tool with HMR |

**Backend Services:**
| Service | Version | Purpose |
|---------|---------|---------|
| Firebase | 10.14.1 | Auth, Firestore, Hosting |
| Firebase Auth | 10.14.1 | Google OAuth 2.0 |
| Cloud Firestore | 10.14.1 | NoSQL database |
| Firebase Hosting | N/A | Static hosting + CDN |

**AI Integration:**
| Service | Model | Purpose |
|---------|-------|---------|
| Google Gemini | 2.5-flash | Receipt OCR (⚠️ API key exposed in client) |

**Testing Infrastructure:**
| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.0.13 | Unit + Integration tests |
| Playwright | 1.56.1 | E2E tests |
| @firebase/rules-unit-testing | 3.0.4 | Firestore rules testing |
| @axe-core/playwright | 4.11.0 | Accessibility testing |

**CI/CD:**
| Platform | Configuration | Status |
|----------|---------------|--------|
| GitHub Actions | `.github/workflows/test.yml` | 19 steps, no security scanning |

### Existing Codebase Structure

**Architecture:** Modular SPA with 31 TypeScript files across 7 logical layers

```
src/
├── config/          # Configuration (3 files)
│   ├── constants.ts     # App constants
│   ├── firebase.ts      # Firebase init (⚠️ API keys via env vars)
│   └── gemini.ts        # Gemini config (⚠️ API key exposed)
├── types/           # TypeScript definitions (2 files)
├── services/        # External APIs (2 files)
│   ├── firestore.ts     # Firestore CRUD
│   └── gemini.ts        # Gemini AI (⚠️ client-side API call)
├── hooks/           # Custom React hooks (2 files)
├── utils/           # Pure functions (7 files)
├── components/      # Reusable UI (5 files)
├── views/           # Page components (7 files)
├── App.tsx          # Main orchestrator
└── main.tsx         # Entry point
```

**Security-Relevant Files:**
- `firestore.rules` - User isolation rules (✅ implemented)
- `.env` - Environment variables (✅ git-ignored)
- `.env.example` - Template (✅ no secrets)
- `src/config/gemini.ts` - Gemini API key (⚠️ exposed in client bundle)
- `src/services/gemini.ts` - Direct API calls (⚠️ no server proxy)

---

## The Change

### Problem Statement

Boletapp is a production expense tracker handling sensitive financial data. While Epics 1-3 established solid foundations (modular architecture, testing infrastructure, quality gates), the application lacks comprehensive security hardening:

1. **API Key Exposure:** The Gemini API key is embedded in client-side JavaScript bundle, visible to anyone inspecting network traffic or source code. This creates risk of:
   - Unauthorized API usage and billing
   - Rate limit exhaustion by malicious actors
   - Potential API key theft and abuse

2. **No Secrets Scanning:** Git history may contain accidentally committed secrets. No automated detection prevents future accidental commits.

3. **No Security Automation:** The 19-step CI/CD pipeline includes tests, coverage, and performance checks but zero security scanning (npm audit, static analysis, secrets detection).

4. **Dependency Vulnerabilities:** No automated npm audit means vulnerable packages could be introduced without detection.

5. **Missing Security Documentation:** No formal security audit, OWASP checklist validation, or documented security practices for ongoing development.

### Proposed Solution

Implement a 4-story security hardening epic that addresses these gaps:

| Story | Solution |
|-------|----------|
| **4.1: Secrets Detection** | Install gitleaks, scan git history for leaked secrets, add pre-commit hook, integrate into CI |
| **4.2: Gemini API Protection** | Create Firebase Cloud Function to proxy Gemini API calls, remove client-side key exposure |
| **4.3: Dependency & Static Security** | Automate npm audit in CI, add eslint-plugin-security, fix existing vulnerabilities |
| **4.4: Security Documentation** | Document findings, create OWASP Top 10 checklist, establish ongoing security practices |

**Outcome:** Zero secrets in git history, protected API keys, automated security scanning in CI, documented security posture.

### Scope

**In Scope:**

- ✅ Secrets detection and prevention (gitleaks + pre-commit hooks)
- ✅ Git history scanning for accidentally committed secrets
- ✅ Firebase Cloud Function for Gemini API proxy (removes client-side key exposure)
- ✅ npm audit automation in CI pipeline
- ✅ eslint-plugin-security for static code analysis
- ✅ CI/CD security steps (secrets scanning, npm audit, static analysis)
- ✅ Security documentation (audit report, OWASP checklist, practices guide)
- ✅ Fix any HIGH/CRITICAL npm audit vulnerabilities found

**Out of Scope:**

- ❌ OWASP ZAP dynamic application security testing (deferred to future epic)
- ❌ External professional penetration testing
- ❌ SOC 2 / ISO 27001 compliance documentation
- ❌ Advanced threat modeling
- ❌ Bug bounty program setup
- ❌ Expanding Firestore security rules tests (existing tests sufficient)
- ❌ OAuth flow security (Firebase Auth handles this)
- ❌ Rate limiting implementation (beyond Cloud Function basic limits)

---

## Implementation Details

### Source Tree Changes

**Story 4.1: Secrets Detection & Prevention**
```
CREATE  .gitleaks.toml                    # Gitleaks configuration
CREATE  .husky/pre-commit                 # Pre-commit hook for secrets scanning
CREATE  scripts/scan-secrets.sh           # Manual secrets scanning script
MODIFY  .github/workflows/test.yml        # Add secrets scanning step (Step 20)
MODIFY  package.json                      # Add husky, gitleaks dependencies
CREATE  docs/security/secrets-scan-report.md  # Initial scan findings
```

**Story 4.2: Gemini API Protection (Cloud Function)**
```
CREATE  functions/                        # Firebase Functions directory
CREATE  functions/package.json            # Functions dependencies
CREATE  functions/tsconfig.json           # TypeScript config for functions
CREATE  functions/src/index.ts            # Cloud Function entry point
CREATE  functions/src/analyzeReceipt.ts   # Gemini proxy function
MODIFY  firebase.json                     # Add functions configuration
MODIFY  src/services/gemini.ts            # Call Cloud Function instead of direct API
MODIFY  src/config/gemini.ts              # Remove VITE_GEMINI_API_KEY usage
MODIFY  .env.example                      # Remove GEMINI_API_KEY (now server-side)
DELETE  (reference) VITE_GEMINI_API_KEY   # Remove from client env vars
```

**Story 4.3: Dependency & Static Security**
```
CREATE  .eslintrc.security.json           # Security-focused ESLint rules
MODIFY  package.json                      # Add eslint-plugin-security
MODIFY  .github/workflows/test.yml        # Add npm audit step (Step 21)
MODIFY  .github/workflows/test.yml        # Add eslint security step (Step 22)
CREATE  scripts/security-audit.sh         # Combined security audit script
```

**Story 4.4: Security Documentation**
```
CREATE  docs/security/README.md           # Security practices overview
CREATE  docs/security/owasp-checklist.md  # OWASP Top 10 validation
CREATE  docs/security/audit-report.md     # Epic 4 security audit findings
CREATE  docs/security/incident-response.md # Basic incident response plan
MODIFY  docs/index.md                     # Add security documentation section
MODIFY  CONTRIBUTING.md                   # Add security guidelines for contributors
```

### Technical Approach

**Story 4.1: Secrets Detection - gitleaks**

Tool Selection: **gitleaks v8.18.x** (industry standard, fast, CI-friendly)

```bash
# Install gitleaks (macOS)
brew install gitleaks

# Install gitleaks (Linux/CI)
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz
tar -xzf gitleaks_8.18.4_linux_x64.tar.gz
```

Configuration (`.gitleaks.toml`):
```toml
[extend]
useDefault = true

[[rules]]
id = "firebase-api-key"
description = "Firebase API Key"
regex = '''VITE_FIREBASE_API_KEY\s*=\s*['"]?[A-Za-z0-9_-]{39}['"]?'''
keywords = ["firebase"]

[[rules]]
id = "gemini-api-key"
description = "Gemini API Key"
regex = '''VITE_GEMINI_API_KEY\s*=\s*['"]?[A-Za-z0-9_-]{39}['"]?'''
keywords = ["gemini"]

[allowlist]
paths = [
  ".env.example",
  "docs/**/*.md"
]
```

Pre-commit Hook (using husky):
```bash
npx husky install
npx husky add .husky/pre-commit "npx gitleaks protect --staged --verbose"
```

**Story 4.2: Gemini API Protection - Firebase Cloud Function**

Architecture Change:
```
BEFORE: Browser → Gemini API (API key in client bundle)
AFTER:  Browser → Cloud Function → Gemini API (API key server-side only)
```

Cloud Function Implementation (`functions/src/analyzeReceipt.ts`):
```typescript
import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const analyzeReceipt = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  // Rate limiting: 10 requests per minute per user
  // (Implement with Firebase Extensions or custom logic)

  const { images, currency } = data;
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

  // Process receipt (existing logic from src/services/gemini.ts)
  const result = await model.generateContent([...]);

  return result.response.text();
});
```

Client-side change (`src/services/gemini.ts`):
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const analyzeReceiptFn = httpsCallable(functions, 'analyzeReceipt');

export async function analyzeReceipt(images: string[], currency: string) {
  const result = await analyzeReceiptFn({ images, currency });
  return result.data;
}
```

**Story 4.3: Dependency & Static Security**

npm audit automation:
```yaml
# .github/workflows/test.yml - Step 21
- name: Run npm audit
  run: |
    npm audit --audit-level=high
    if [ $? -ne 0 ]; then
      echo "⚠️ HIGH/CRITICAL vulnerabilities found"
      exit 1
    fi
```

eslint-plugin-security configuration:
```json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-possible-timing-attacks": "warn"
  }
}
```

**Story 4.4: Security Documentation**

OWASP Top 10 (2021) Checklist Focus:
1. **A01: Broken Access Control** → Firestore rules enforce user isolation ✅
2. **A02: Cryptographic Failures** → HTTPS enforced, no custom crypto ✅
3. **A03: Injection** → No SQL, Firestore SDK prevents injection ✅
4. **A04: Insecure Design** → Review in audit
5. **A05: Security Misconfiguration** → Review Firebase settings
6. **A06: Vulnerable Components** → npm audit addresses this
7. **A07: Auth Failures** → Firebase Auth handles this ✅
8. **A08: Data Integrity** → Review in audit
9. **A09: Logging Failures** → Review monitoring
10. **A10: SSRF** → Cloud Function mitigates (no client-side API calls)

### Existing Patterns to Follow

**From existing codebase:**

1. **Service Pattern** (`src/services/*.ts`):
   - Export async functions
   - Use Firebase SDK patterns
   - Return typed responses
   - Handle errors with try/catch

2. **Configuration Pattern** (`src/config/*.ts`):
   - Initialize services at module load
   - Use environment variables via `import.meta.env`
   - Export configured instances

3. **Test Pattern** (`tests/integration/*.test.ts`):
   - Use Vitest with `describe`/`it` blocks
   - Setup/teardown with `beforeEach`/`afterEach`
   - Use Firebase emulator for integration tests
   - Assert with `expect()`

4. **CI/CD Pattern** (`.github/workflows/test.yml`):
   - Sequential steps with clear naming
   - Environment variables for Firebase config
   - `continue-on-error: false` for blocking steps
   - Artifact uploads for reports

5. **Documentation Pattern** (`docs/**/*.md`):
   - Markdown with tables and code blocks
   - Cross-references via relative links
   - Index files for navigation

### Integration Points

**Firebase Cloud Functions:**
- New dependency: `firebase-functions` package
- Deployment: `firebase deploy --only functions`
- Environment: Functions use `process.env` (set via Firebase CLI)
- Authentication: `context.auth` provides user info from Firebase Auth

**CI/CD Pipeline:**
- Add 3 new steps to `.github/workflows/test.yml`:
  - Step 20: Secrets scanning (gitleaks)
  - Step 21: npm audit
  - Step 22: ESLint security rules
- All steps should be blocking (`continue-on-error: false`)

**Pre-commit Hooks:**
- Husky manages git hooks
- gitleaks runs on staged files before commit
- Developers must have gitleaks installed locally

**Environment Variables:**
- Remove: `VITE_GEMINI_API_KEY` from client
- Add: `GEMINI_API_KEY` to Firebase Functions environment
- Update: `.env.example` to reflect changes

---

## Development Context

### Relevant Existing Code

**Security-Related Files to Review:**

| File | Lines | Purpose | Action |
|------|-------|---------|--------|
| `src/config/gemini.ts` | 1-15 | Gemini API initialization | MODIFY - Remove API key |
| `src/services/gemini.ts` | 1-80 | Direct Gemini API calls | MODIFY - Use Cloud Function |
| `firestore.rules` | 1-15 | User isolation rules | REVIEW - Validate coverage |
| `.env.example` | 1-10 | Environment template | MODIFY - Remove Gemini key |
| `.github/workflows/test.yml` | 1-221 | CI pipeline | MODIFY - Add security steps |

**Existing Security Patterns:**
- `src/hooks/useAuth.ts` - Firebase Auth integration (leave unchanged)
- `tests/integration/firestore-rules.test.ts` - Rules testing (reference for patterns)
- `tests/integration/data-isolation.test.ts` - User isolation tests (reference)

### Dependencies

**Framework/Libraries:**

**Existing (No Changes):**
| Package | Version | Purpose |
|---------|---------|---------|
| firebase | ^10.14.1 | Auth, Firestore, Hosting |
| react | ^18.3.1 | UI framework |
| typescript | ^5.3.3 | Type safety |
| vitest | ^4.0.13 | Testing |
| @playwright/test | ^1.56.1 | E2E testing |

**New Dependencies (Story 4.1):**
| Package | Version | Purpose |
|---------|---------|---------|
| husky | ^9.0.0 | Git hooks management |
| gitleaks | v8.18.4 | Secrets detection (binary, not npm) |

**New Dependencies (Story 4.2 - functions/):**
| Package | Version | Purpose |
|---------|---------|---------|
| firebase-functions | ^4.5.0 | Cloud Functions SDK |
| firebase-admin | ^12.0.0 | Admin SDK for functions |
| @google/generative-ai | ^0.2.0 | Gemini AI SDK (server-side) |

**New Dependencies (Story 4.3):**
| Package | Version | Purpose |
|---------|---------|---------|
| eslint | ^8.57.0 | Linting (if not present) |
| eslint-plugin-security | ^2.1.0 | Security-focused ESLint rules |

**Internal Modules:**

| Module | Path | Relevance |
|--------|------|-----------|
| Gemini Service | `src/services/gemini.ts` | Primary modification target |
| Gemini Config | `src/config/gemini.ts` | Remove API key exposure |
| Firebase Config | `src/config/firebase.ts` | Add Functions initialization |
| ScanView | `src/views/ScanView.tsx` | Consumer of Gemini service |

### Configuration Changes

**Firebase Configuration (`firebase.json`):**
```json
{
  "hosting": { /* existing */ },
  "firestore": { /* existing */ },
  "functions": {
    "source": "functions",
    "codebase": "default",
    "ignore": ["node_modules", ".git"],
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  }
}
```

**Environment Variables:**

| Variable | Before | After |
|----------|--------|-------|
| `VITE_GEMINI_API_KEY` | Client-side (.env) | REMOVED |
| `GEMINI_API_KEY` | N/A | Functions environment (Firebase CLI) |

**Firebase Functions Environment:**
```bash
# Set via Firebase CLI (never committed)
firebase functions:config:set gemini.api_key="YOUR_ACTUAL_KEY"
```

**Git Hooks (.husky/pre-commit):**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

gitleaks protect --staged --verbose
```

### Existing Conventions (Brownfield)

**Code Style (Conform to existing):**
- ✅ TypeScript strict mode
- ✅ No semicolons (ESM style)
- ✅ Single quotes for strings
- ✅ 2-space indentation
- ✅ kebab-case for file names
- ✅ PascalCase for components/types
- ✅ camelCase for functions/variables

**Import Organization:**
```typescript
// External packages first
import { getFunctions, httpsCallable } from 'firebase/functions'

// Internal modules second
import { app } from '../config/firebase'

// Types last
import type { ReceiptData } from '../types/transaction'
```

**Error Handling Pattern:**
```typescript
try {
  const result = await someAsyncOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw error // Re-throw for caller to handle
}
```

### Test Framework & Standards

**Testing Stack:**
| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.0.13 | Unit + Integration tests |
| @testing-library/react | 16.3.0 | Component testing |
| Playwright | 1.56.1 | E2E tests |
| @firebase/rules-unit-testing | 3.0.4 | Firestore rules testing |

**Test File Naming:**
- Unit tests: `tests/unit/**/*.test.ts`
- Integration tests: `tests/integration/**/*.test.tsx`
- E2E tests: `tests/e2e/**/*.spec.ts`

**Coverage Thresholds (from vite.config.ts):**
- Lines: 45%
- Branches: 30%
- Functions: 25%
- Statements: 40%

**Test Commands:**
```bash
npm run test:unit        # Vitest unit tests
npm run test:integration # Vitest integration tests
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Coverage with thresholds
```

---

## Implementation Stack

**Client Application (Existing):**
| Layer | Technology | Version |
|-------|------------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | React | 18.3.1 |
| Language | TypeScript | 5.3.3 |
| Build | Vite | 5.4.0 |
| Styling | Tailwind CSS | 3.x (CDN) |

**Backend Services (Existing + New):**
| Service | Technology | Version | Status |
|---------|------------|---------|--------|
| Authentication | Firebase Auth | 10.14.1 | Existing ✅ |
| Database | Cloud Firestore | 10.14.1 | Existing ✅ |
| Hosting | Firebase Hosting | N/A | Existing ✅ |
| **Functions** | **Firebase Functions** | **4.5.0** | **NEW (Story 4.2)** |

**Security Tooling (New):**
| Tool | Version | Purpose |
|------|---------|---------|
| gitleaks | 8.18.4 | Secrets detection |
| husky | 9.0.0 | Git hooks |
| eslint-plugin-security | 2.1.0 | Static analysis |

**Testing (Existing):**
| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.0.13 | Unit/Integration |
| Playwright | 1.56.1 | E2E |
| c8 | 10.1.3 | Coverage |

---

## Technical Details

### Story 4.1: Secrets Detection Deep Dive

**Git History Scan:**
```bash
# Full repository scan (run once during Story 4.1)
gitleaks detect --source . --verbose --report-path secrets-report.json

# If secrets found in history, options:
# 1. Rotate the exposed credentials immediately
# 2. Use git-filter-repo to remove from history (optional, disruptive)
# 3. Document findings and remediation in audit report
```

**Pre-commit Integration:**
- Husky v9 uses `.husky/` directory for hooks
- gitleaks `protect` mode scans staged files only (fast)
- Blocks commit if secrets detected
- Developer can override with `--no-verify` (discouraged)

**CI Integration:**
```yaml
- name: Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Story 4.2: Cloud Function Architecture

**Function Design:**
```typescript
// functions/src/analyzeReceipt.ts

interface AnalyzeReceiptRequest {
  images: string[]  // Base64 encoded images
  currency: string  // e.g., "CLP"
}

interface AnalyzeReceiptResponse {
  merchant: string
  date: string
  total: number
  category: string
  items: Array<{
    name: string
    price: number
    category?: string
  }>
}
```

**Security Measures in Cloud Function:**
1. **Authentication Required:** `context.auth` must exist
2. **Input Validation:** Validate images array, currency string
3. **Rate Limiting:** Consider Firebase App Check or custom limits
4. **Error Handling:** Don't leak internal errors to client

**Deployment:**
```bash
# Deploy functions only
firebase deploy --only functions

# Set environment variable
firebase functions:config:set gemini.api_key="AIza..."

# View current config
firebase functions:config:get
```

**Local Development:**
```bash
# Functions emulator
firebase emulators:start --only functions

# Test with curl
curl -X POST http://localhost:5001/boletapp-d609f/us-central1/analyzeReceipt \
  -H "Content-Type: application/json" \
  -d '{"data": {"images": ["..."], "currency": "CLP"}}'
```

### Story 4.3: Static Analysis Details

**eslint-plugin-security Rules:**

| Rule | Severity | Description |
|------|----------|-------------|
| detect-object-injection | warn | Prevent `obj[var]` attacks |
| detect-non-literal-regexp | warn | Prevent ReDoS |
| detect-unsafe-regex | error | Block exponential regex |
| detect-eval-with-expression | error | Block eval() usage |
| detect-no-csrf-before-method-override | error | CSRF protection |
| detect-possible-timing-attacks | warn | Timing attack prevention |

**npm audit Workflow:**
```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Force fix (may break semver)
npm audit fix --force

# Generate report
npm audit --json > audit-report.json
```

### Story 4.4: OWASP Checklist Details

**Validation Matrix:**

| OWASP Category | Boletapp Status | Evidence |
|----------------|-----------------|----------|
| A01: Broken Access Control | ✅ PASS | Firestore rules, user isolation tests |
| A02: Cryptographic Failures | ✅ PASS | HTTPS only, no custom crypto |
| A03: Injection | ✅ PASS | Firestore SDK, no raw queries |
| A04: Insecure Design | ⚠️ REVIEW | Document threat model |
| A05: Security Misconfiguration | ⚠️ REVIEW | Firebase settings audit |
| A06: Vulnerable Components | ✅ PASS | npm audit automated |
| A07: Auth Failures | ✅ PASS | Firebase Auth + Google OAuth |
| A08: Data Integrity | ⚠️ REVIEW | Validate Firestore writes |
| A09: Logging Failures | ⚠️ REVIEW | Add security logging |
| A10: SSRF | ✅ PASS | Cloud Function proxies API |

---

## Development Setup

**Prerequisites:**
1. Node.js 20.x LTS
2. npm 10.x
3. Firebase CLI (`npm install -g firebase-tools`)
4. gitleaks binary (see installation below)
5. Access to boletapp-d609f Firebase project

**gitleaks Installation:**

macOS:
```bash
brew install gitleaks
```

Linux:
```bash
# Download binary
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.4/gitleaks_8.18.4_linux_x64.tar.gz
tar -xzf gitleaks_8.18.4_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

Windows (WSL recommended):
```bash
# Same as Linux, or use WSL
```

**Local Development Steps:**
```bash
# 1. Clone and install
git clone https://github.com/Brownbull/gmni_boletapp.git
cd gmni_boletapp
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your values

# 3. Start Firebase emulators
npm run emulators

# 4. Start dev server
npm run dev

# 5. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e
```

**Cloud Functions Development:**
```bash
# Navigate to functions directory
cd functions
npm install

# Build TypeScript
npm run build

# Deploy to Firebase
firebase deploy --only functions

# Test locally
firebase emulators:start --only functions
```

---

## Implementation Guide

### Setup Steps

**Before Starting Any Story:**

1. ✅ Ensure on `develop` branch with latest changes
2. ✅ Run existing tests to confirm baseline: `npm run test:all`
3. ✅ Verify Firebase CLI is authenticated: `firebase login`
4. ✅ Confirm access to boletapp-d609f project: `firebase projects:list`

**Story-Specific Setup:**

| Story | Additional Setup |
|-------|------------------|
| 4.1 | Install gitleaks binary locally |
| 4.2 | Enable Firebase Functions in console, setup billing (Blaze plan required) |
| 4.3 | No additional setup |
| 4.4 | No additional setup |

### Implementation Steps

**Story 4.1: Secrets Detection & Prevention**

| Step | Task | Verification |
|------|------|--------------|
| 1 | Install husky: `npm install -D husky` | package.json updated |
| 2 | Initialize husky: `npx husky install` | .husky/ directory created |
| 3 | Add prepare script to package.json | `"prepare": "husky install"` |
| 4 | Create `.gitleaks.toml` configuration | File exists with rules |
| 5 | Add pre-commit hook: `npx husky add .husky/pre-commit "gitleaks protect --staged"` | Hook executes on commit |
| 6 | Scan git history: `gitleaks detect --source . --verbose` | Report generated |
| 7 | Document findings in `docs/security/secrets-scan-report.md` | Report created |
| 8 | Add CI step to `.github/workflows/test.yml` | Pipeline passes |
| 9 | If secrets found: rotate credentials immediately | Credentials rotated |

**Story 4.2: Gemini API Protection**

| Step | Task | Verification |
|------|------|--------------|
| 1 | Create `functions/` directory structure | Directory exists |
| 2 | Initialize functions: `firebase init functions` | functions/package.json created |
| 3 | Install dependencies in functions/ | node_modules/ exists |
| 4 | Create `functions/src/analyzeReceipt.ts` | TypeScript compiles |
| 5 | Set Gemini API key: `firebase functions:config:set gemini.api_key="..."` | Config set |
| 6 | Deploy function: `firebase deploy --only functions` | Function visible in console |
| 7 | Update `src/services/gemini.ts` to call Cloud Function | Client code updated |
| 8 | Remove `VITE_GEMINI_API_KEY` from `.env` and `.env.example` | Variable removed |
| 9 | Test receipt scanning end-to-end | Scanning works via function |
| 10 | Update `firebase.json` with functions config | Config complete |

**Story 4.3: Dependency & Static Security**

| Step | Task | Verification |
|------|------|--------------|
| 1 | Run npm audit: `npm audit` | Report generated |
| 2 | Fix vulnerabilities: `npm audit fix` | Zero HIGH/CRITICAL |
| 3 | Install eslint-plugin-security: `npm install -D eslint eslint-plugin-security` | Package installed |
| 4 | Create `.eslintrc.security.json` | Config file exists |
| 5 | Run security lint: `npx eslint --config .eslintrc.security.json src/` | No errors |
| 6 | Add npm audit step to CI | CI step passes |
| 7 | Add eslint security step to CI | CI step passes |
| 8 | Create `scripts/security-audit.sh` | Script runs successfully |

**Story 4.4: Security Documentation**

| Step | Task | Verification |
|------|------|--------------|
| 1 | Create `docs/security/` directory | Directory exists |
| 2 | Create `docs/security/README.md` | Overview documented |
| 3 | Create `docs/security/owasp-checklist.md` | All 10 items reviewed |
| 4 | Create `docs/security/audit-report.md` | Findings documented |
| 5 | Create `docs/security/incident-response.md` | Basic plan documented |
| 6 | Update `docs/index.md` with security section | Links added |
| 7 | Update `CONTRIBUTING.md` with security guidelines | Guidelines added |
| 8 | Review and validate all documentation | Complete and accurate |

### Testing Strategy

**Story 4.1 Testing:**
- ✅ Manual: Attempt to commit file with fake API key → should be blocked
- ✅ Manual: Run `gitleaks detect` → should find test secrets
- ✅ CI: gitleaks action should pass on clean repo

**Story 4.2 Testing:**
- ✅ Unit: Mock Cloud Function response in Vitest
- ✅ Integration: Test function with Firebase emulator
- ✅ E2E: Full receipt scan flow via Playwright
- ✅ Manual: Verify API key not in browser network tab

**Story 4.3 Testing:**
- ✅ CI: npm audit returns 0 exit code
- ✅ CI: eslint security rules pass
- ✅ Manual: Verify no HIGH/CRITICAL in npm audit

**Story 4.4 Testing:**
- ✅ Manual: Review all documentation for completeness
- ✅ Manual: Verify OWASP checklist has evidence for each item
- ✅ Manual: Confirm docs/index.md links work

### Acceptance Criteria

**Epic 4 Success Criteria (from epics.md):**

| # | Criterion | Story | Verification |
|---|-----------|-------|--------------|
| 1 | Zero HIGH or CRITICAL vulnerabilities in npm audit | 4.3 | `npm audit` returns 0 |
| 2 | Firebase Security Rules pass all penetration tests | N/A | Existing tests pass (deferred expansion) |
| 3 | No secrets or API keys exposed in source code | 4.1, 4.2 | gitleaks scan clean, Gemini key server-side |
| 4 | OWASP Top 10 checklist validated | 4.4 | Documentation complete with evidence |
| 5 | Security scanning integrated into CI/CD pipeline | 4.1, 4.3 | CI steps pass |
| 6 | Security documentation created | 4.4 | docs/security/ complete |

**Story-Specific Acceptance Criteria:**

**Story 4.1:**
- [ ] gitleaks configuration file exists
- [ ] Pre-commit hook blocks commits with secrets
- [ ] Git history scanned and findings documented
- [ ] CI step runs gitleaks on every PR

**Story 4.2:**
- [ ] Firebase Cloud Function deployed and working
- [ ] Gemini API key no longer in client bundle
- [ ] Receipt scanning works end-to-end
- [ ] Function requires authentication

**Story 4.3:**
- [ ] npm audit shows zero HIGH/CRITICAL vulnerabilities
- [ ] eslint-plugin-security installed and configured
- [ ] CI runs npm audit on every PR
- [ ] CI runs security lint on every PR

**Story 4.4:**
- [ ] docs/security/README.md exists
- [ ] OWASP Top 10 checklist complete with evidence
- [ ] Audit report documents all findings
- [ ] docs/index.md updated with security section

---

## Developer Resources

### File Paths Reference

**New Files (Epic 4):**
```
.gitleaks.toml                           # Story 4.1 - Gitleaks config
.husky/pre-commit                        # Story 4.1 - Pre-commit hook
scripts/scan-secrets.sh                  # Story 4.1 - Manual scan script
functions/                               # Story 4.2 - Cloud Functions
functions/package.json                   # Story 4.2 - Functions deps
functions/tsconfig.json                  # Story 4.2 - Functions TS config
functions/src/index.ts                   # Story 4.2 - Functions entry
functions/src/analyzeReceipt.ts          # Story 4.2 - Gemini proxy
.eslintrc.security.json                  # Story 4.3 - Security lint config
scripts/security-audit.sh                # Story 4.3 - Audit script
docs/security/README.md                  # Story 4.4 - Security overview
docs/security/owasp-checklist.md         # Story 4.4 - OWASP validation
docs/security/audit-report.md            # Story 4.4 - Audit findings
docs/security/secrets-scan-report.md     # Story 4.1 - Scan results
docs/security/incident-response.md       # Story 4.4 - Incident plan
```

**Modified Files:**
```
package.json                             # Add husky, eslint deps
firebase.json                            # Add functions config
.github/workflows/test.yml               # Add security steps 20-22
src/config/gemini.ts                     # Remove API key usage
src/services/gemini.ts                   # Use Cloud Function
.env.example                             # Remove GEMINI_API_KEY
docs/index.md                            # Add security section
CONTRIBUTING.md                          # Add security guidelines
```

### Key Code Locations

| Location | Purpose | Story |
|----------|---------|-------|
| `src/config/gemini.ts:1-15` | Gemini initialization (MODIFY) | 4.2 |
| `src/services/gemini.ts:1-80` | Gemini API calls (MODIFY) | 4.2 |
| `src/views/ScanView.tsx:50-100` | Receipt scanning UI (no change) | Reference |
| `.github/workflows/test.yml:175-221` | CI steps to extend | 4.1, 4.3 |
| `firestore.rules:1-15` | Security rules (review) | Reference |

### Testing Locations

| Test Type | Location | Purpose |
|-----------|----------|---------|
| Secrets CI | `.github/workflows/test.yml` Step 20 | gitleaks action |
| npm audit CI | `.github/workflows/test.yml` Step 21 | Dependency scan |
| Security lint CI | `.github/workflows/test.yml` Step 22 | eslint-plugin-security |
| Cloud Function | `functions/src/__tests__/` | Unit tests (optional) |
| E2E Scan Flow | `tests/e2e/` | Receipt scanning (existing) |

### Documentation to Update

| Document | Update | Story |
|----------|--------|-------|
| `docs/index.md` | Add Security Documentation section | 4.4 |
| `CONTRIBUTING.md` | Add security guidelines for PRs | 4.4 |
| `docs/architecture/architecture.md` | Add ADR-008: Security Hardening | 4.4 |
| `README.md` | Add security setup instructions | 4.4 |

---

## UX/UI Considerations

**No UI/UX Impact** - Epic 4 is a backend/infrastructure security enhancement.

- ✅ Receipt scanning flow remains unchanged (user experience preserved)
- ✅ No new UI components required
- ✅ No changes to navigation or user workflows
- ✅ Cloud Function is transparent to end users

**Developer Experience Impact:**
- Pre-commit hook may slow commits slightly (gitleaks scan)
- Developers need gitleaks installed locally
- CI pipeline adds ~30-60 seconds for security steps

---

## Testing Approach

**Automated Testing:**

| Layer | Tool | Scope |
|-------|------|-------|
| Secrets Detection | gitleaks (CI) | Git history + staged files |
| Dependency Audit | npm audit (CI) | package.json vulnerabilities |
| Static Analysis | eslint-plugin-security (CI) | Source code patterns |
| Cloud Function | Vitest + Firebase Emulator | Function logic |
| E2E | Playwright | Receipt scanning flow |

**Manual Testing:**

| Test | Steps | Expected Result |
|------|-------|-----------------|
| Pre-commit blocks secrets | Create file with fake API key, attempt commit | Commit blocked |
| Cloud Function auth | Call function without auth token | 401 Unauthenticated |
| API key not exposed | Inspect browser Network/Sources | No Gemini API key visible |
| Receipt scanning works | Upload receipt image | Transaction extracted correctly |

**Security-Specific Tests:**
- Verify Gemini API key not in production bundle (`dist/assets/*.js`)
- Verify Cloud Function rejects unauthenticated requests
- Verify gitleaks catches known secret patterns

---

## Deployment Strategy

### Deployment Steps

**Story 4.1 (Secrets Detection):**
1. Merge PR with gitleaks config and CI step
2. Verify CI passes on develop branch
3. No production deployment required (dev tooling only)

**Story 4.2 (Cloud Function):**
1. Deploy Cloud Function: `firebase deploy --only functions`
2. Set API key: `firebase functions:config:set gemini.api_key="..."`
3. Verify function in Firebase Console
4. Deploy client update: `npm run build && firebase deploy --only hosting`
5. Test receipt scanning in production
6. Monitor Firebase Functions logs for errors

**Story 4.3 (Dependency Security):**
1. Merge PR with npm audit fixes and eslint config
2. Verify CI passes with new security steps
3. No production deployment required (CI tooling only)

**Story 4.4 (Documentation):**
1. Merge PR with security documentation
2. Verify docs render correctly on GitHub
3. No production deployment required

### Rollback Plan

**Cloud Function Rollback (Story 4.2):**
```bash
# If Cloud Function fails, revert to client-side Gemini calls:

# 1. Restore VITE_GEMINI_API_KEY in .env
# 2. Revert src/services/gemini.ts to previous version
# 3. Deploy: npm run build && firebase deploy --only hosting

# Keep Cloud Function deployed but unused until fixed
```

**CI Rollback (Stories 4.1, 4.3):**
```bash
# If security steps cause CI failures:
# 1. Set steps to continue-on-error: true temporarily
# 2. Investigate and fix issues
# 3. Re-enable blocking behavior
```

### Monitoring

**Cloud Function Monitoring:**
- Firebase Console > Functions > Logs
- Monitor for:
  - Function invocation count
  - Error rates
  - Latency (P50, P95)
  - Cold start frequency

**Security Monitoring:**
- CI pipeline: Watch for gitleaks/npm audit failures
- GitHub: Review Dependabot alerts (if enabled)
- Firebase Console: Monitor auth failures

**Alerts to Configure:**
- Function error rate > 5%
- Function latency P95 > 10s
- npm audit HIGH/CRITICAL found

---

## Appendix: Story Summary

| Story | Title | Priority | Dependencies |
|-------|-------|----------|--------------|
| 4.1 | Secrets Detection & Prevention | HIGH | None |
| 4.2 | Gemini API Protection | HIGH | Firebase Blaze plan |
| 4.3 | Dependency & Static Security | MEDIUM | None |
| 4.4 | Security Documentation | MEDIUM | 4.1, 4.2, 4.3 complete |

**Recommended Order:** 4.1 → 4.2 → 4.3 → 4.4

Story 4.4 should be last as it documents findings from other stories.

---

**Document Version:** 1.0
**Created:** 2025-11-26
**Epic:** 4 (Security Hardening & Penetration Testing)
**Status:** Ready for Development
