# Boletapp Security Documentation

**Last Updated:** 2025-11-27 (Epic 4 Complete)

This directory contains comprehensive security documentation for the Boletapp expense tracking application.

---

## Security Overview

Boletapp is built with security as a core principle, implementing defense-in-depth across multiple layers:

### Security Philosophy

1. **Principle of Least Privilege** - Users can only access their own data
2. **Defense in Depth** - Multiple security layers protect against various attack vectors
3. **Secure by Default** - Restrictive settings that require explicit enablement
4. **Shift Left Security** - Security checks integrated early in development lifecycle

### Security Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Security Layers             │
                    ├─────────────────────────────────────┤
                    │  [1] Authentication (Firebase Auth) │
                    │  [2] Authorization (Firestore Rules)│
                    │  [3] API Protection (Cloud Function)│
                    │  [4] Transport (HTTPS/TLS)          │
                    │  [5] Input Validation               │
                    │  [6] Dependency Scanning            │
                    │  [7] Secrets Detection              │
                    └─────────────────────────────────────┘
```

---

## Key Security Measures

### Authentication & Authorization

| Measure | Implementation | Status |
|---------|----------------|--------|
| User Authentication | Firebase Auth with Google OAuth 2.0 | Active |
| Session Management | Firebase Auth tokens (auto-refresh) | Active |
| User Data Isolation | Firestore security rules | Active |
| API Key Protection | Server-side via Cloud Functions | Active |

### API Security

| API | Protection | Details |
|-----|------------|---------|
| Firebase Auth | OAuth 2.0 | Google-managed |
| Firestore | Security Rules | User isolation |
| Gemini AI | Cloud Function Proxy | Server-side API key |

### Data Security

- **At Rest:** Firestore encryption (Google-managed)
- **In Transit:** HTTPS/TLS enforced
- **User Isolation:** Each user can only access their own data
- **No Shared Data:** No cross-user data visibility

---

## Security Tools & Automation

### Pre-commit Hooks

Secrets detection runs automatically before every commit:

```bash
# Automatic - blocks commits with secrets
git commit -m "your message"

# Manual scan
./scripts/scan-secrets.sh
```

### CI/CD Security Steps

The GitHub Actions pipeline includes security gates:

| Step | Tool | Purpose |
|------|------|---------|
| Step 2 | gitleaks | Secrets detection |
| Step 21 | npm audit | Dependency vulnerabilities |
| Step 22 | ESLint security | Static code analysis |

### Local Security Audit

Run all security checks locally:

```bash
# Full security audit
npm run security:audit

# Security linting only
npm run security:lint
```

---

## Quick Reference

### For Developers

1. **Before committing:** Ensure no secrets in code (pre-commit hook helps)
2. **New dependencies:** Run `npm audit` after adding packages
3. **API keys:** Never put API keys in client code; use Cloud Functions
4. **User data:** Always validate user owns data via Firestore rules

### For Security Review

| Document | Purpose |
|----------|---------|
| [OWASP Checklist](./owasp-checklist.md) | OWASP Top 10 validation |
| [Audit Report](./audit-report.md) | Epic 4 security findings |
| [Incident Response](./incident-response.md) | Security incident procedures |
| [Secrets Scan Report](./secrets-scan-report.md) | Initial secrets scan results |

### For Compliance

- **OWASP Top 10 (2021):** Documented in [owasp-checklist.md](./owasp-checklist.md)
- **Security Audit:** Documented in [audit-report.md](./audit-report.md)
- **Dependency Tracking:** Automated via `npm audit` in CI

---

## Security Contacts

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** create a public GitHub issue
2. **Do** contact the maintainers directly
3. **Include:** Description, steps to reproduce, potential impact
4. **Wait:** For acknowledgment before disclosure

### Maintainers

- Repository: https://github.com/Brownbull/gmni_boletapp
- Contact: Via GitHub repository

---

## Security Checklist for Contributors

Before submitting a PR:

- [ ] No secrets, API keys, or credentials in code
- [ ] Input validation for user-provided data
- [ ] Authentication checks where required
- [ ] `npm audit` shows no HIGH/CRITICAL vulnerabilities
- [ ] ESLint security rules pass (`npm run security:lint`)
- [ ] Sensitive operations use Cloud Functions (not client-side)

---

## Document Index

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | This file - Security overview |
| [owasp-checklist.md](./owasp-checklist.md) | OWASP Top 10 (2021) validation |
| [audit-report.md](./audit-report.md) | Epic 4 security audit findings |
| [incident-response.md](./incident-response.md) | Incident response procedures |
| [secrets-scan-report.md](./secrets-scan-report.md) | Secrets scan results (Story 4.1) |

---

**Version:** 1.0
**Epic:** 4 - Security Hardening & Penetration Testing
**Story:** 4.4 - Security Documentation
