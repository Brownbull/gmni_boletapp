# Story 4.3: Dependency & Static Security

**Status:** ready-for-dev

---

## User Story

As a **developer**,
I want **automated dependency vulnerability scanning and static code security analysis in CI**,
So that **vulnerable packages and insecure code patterns are detected before they reach production**.

---

## Acceptance Criteria

**AC1: npm audit Passes**
- **Given** the project dependencies in package.json
- **When** `npm audit` is run
- **Then** zero HIGH or CRITICAL vulnerabilities are reported
- **And** any moderate vulnerabilities are documented

**AC2: npm audit in CI**
- **Given** a PR is opened
- **When** the CI pipeline runs
- **Then** npm audit is executed with `--audit-level=high`
- **And** the pipeline fails if HIGH/CRITICAL vulnerabilities exist

**AC3: eslint-plugin-security Installed**
- **Given** the project's ESLint configuration
- **When** security rules are configured
- **Then** dangerous patterns (eval, unsafe regex, etc.) are detected
- **And** the source code passes security linting

**AC4: Security Lint in CI**
- **Given** a PR is opened
- **When** the CI pipeline runs
- **Then** ESLint security rules are executed
- **And** the pipeline fails if security violations are found

**AC5: Security Audit Script**
- **Given** a developer wants to run all security checks locally
- **When** they run `scripts/security-audit.sh`
- **Then** npm audit, gitleaks, and eslint security all execute
- **And** a combined report is generated

---

## Implementation Details

### Tasks / Subtasks

- [ ] **Task 1: Run and fix npm audit**
  - [ ] Run `npm audit` to see current state
  - [ ] Run `npm audit fix` to fix auto-fixable issues
  - [ ] Manually update packages with HIGH/CRITICAL if needed
  - [ ] Document any unfixable vulnerabilities with justification
  - [ ] Verify `npm audit --audit-level=high` returns 0

- [ ] **Task 2: Install eslint-plugin-security**
  - [ ] Check if ESLint is already installed
  - [ ] Install: `npm install -D eslint eslint-plugin-security`
  - [ ] Verify installation in package.json

- [ ] **Task 3: Create security ESLint config**
  - [ ] Create `.eslintrc.security.json` with security rules
  - [ ] Configure recommended ruleset
  - [ ] Set appropriate severity levels (error vs warn)
  - [ ] Test: `npx eslint --config .eslintrc.security.json src/`

- [ ] **Task 4: Fix any security lint violations**
  - [ ] Run security lint and review findings
  - [ ] Fix legitimate security issues
  - [ ] Add eslint-disable comments for false positives (with justification)
  - [ ] Verify all files pass

- [ ] **Task 5: Add npm audit CI step**
  - [ ] Add Step 21 to `.github/workflows/test.yml`
  - [ ] Use `npm audit --audit-level=high`
  - [ ] Set `continue-on-error: false`
  - [ ] Test pipeline locally or on branch

- [ ] **Task 6: Add ESLint security CI step**
  - [ ] Add Step 22 to `.github/workflows/test.yml`
  - [ ] Run eslint with security config
  - [ ] Set `continue-on-error: false`
  - [ ] Test pipeline locally or on branch

- [ ] **Task 7: Create combined security audit script**
  - [ ] Create `scripts/security-audit.sh`
  - [ ] Include npm audit, gitleaks detect, eslint security
  - [ ] Generate combined report
  - [ ] Make executable: `chmod +x scripts/security-audit.sh`
  - [ ] Add to package.json scripts (optional)

- [ ] **Task 8: Update documentation**
  - [ ] Document security audit process
  - [ ] Add to CONTRIBUTING.md
  - [ ] Note any known/accepted vulnerabilities

### Technical Summary

**npm audit:**
- Scans `package-lock.json` for known vulnerabilities
- Uses GitHub Advisory Database
- `--audit-level=high` fails on HIGH or CRITICAL only
- Can be auto-fixed with `npm audit fix`

**eslint-plugin-security:**
- Static analysis for common security anti-patterns
- Detects: eval(), unsafe regex, object injection, timing attacks
- Configurable severity (error/warn/off)
- Zero runtime impact (dev-time only)

**Key Rules:**
| Rule | Severity | Description |
|------|----------|-------------|
| detect-eval-with-expression | error | Blocks eval() usage |
| detect-unsafe-regex | error | Blocks exponential regex |
| detect-object-injection | warn | Warns on `obj[var]` patterns |
| detect-possible-timing-attacks | warn | Warns on timing-sensitive comparisons |

### Project Structure Notes

- **Files to create:**
  - `.eslintrc.security.json`
  - `scripts/security-audit.sh`
- **Files to modify:**
  - `package.json` (add eslint, eslint-plugin-security)
  - `.github/workflows/test.yml` (add Steps 21-22)
- **Expected test locations:** CI pipeline verification
- **Prerequisites:** Story 4.1 (gitleaks) for combined audit script

### Key Code References

**Existing CI Pattern** (`.github/workflows/test.yml`):
```yaml
# Step 8: Run unit tests
- name: Run unit tests
  run: npm run test:unit
  continue-on-error: false
```

**New npm audit Step:**
```yaml
# Step 21: Run npm audit
- name: Run npm audit
  run: |
    npm audit --audit-level=high
    if [ $? -ne 0 ]; then
      echo "⚠️ HIGH/CRITICAL vulnerabilities found"
      exit 1
    fi
```

**New ESLint Security Step:**
```yaml
# Step 22: Run ESLint security rules
- name: Run security lint
  run: npx eslint --config .eslintrc.security.json src/
```

**ESLint Security Config:**
```json
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-eval-with-expression": "error"
  }
}
```

---

## Context References

**Tech-Spec:** [tech-spec.md](./tech-spec.md) - Primary context document containing:
- npm audit workflow details
- eslint-plugin-security configuration
- CI integration patterns
- Rule severity recommendations

**Architecture:** [docs/architecture/architecture.md](../../architecture/architecture.md)
- Technology Stack section (for dependency versions)

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
