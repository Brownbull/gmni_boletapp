#!/bin/bash
#
# Security Audit Script for Boletapp
# Story 4.3: Combined security scanning for local development
#
# Usage: ./scripts/security-audit.sh
#
# This script runs all security checks in one command:
# 1. npm audit - Scans dependencies for known vulnerabilities
# 2. gitleaks - Scans for secrets in git history and staged files
# 3. ESLint security - Static analysis for security anti-patterns
#

set -e  # Exit on first error

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              Boletapp Security Audit                             ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║  Running comprehensive security checks...                        ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Track overall status
FAILED=0

# ============================================================================
# 1. NPM AUDIT - Dependency vulnerability scanning
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 [1/3] Running npm audit (dependency vulnerabilities)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npm audit --audit-level=high 2>/dev/null; then
    echo "✅ npm audit: PASSED (no HIGH/CRITICAL vulnerabilities)"
else
    echo "❌ npm audit: FAILED (HIGH/CRITICAL vulnerabilities found)"
    FAILED=1
fi
echo ""

# ============================================================================
# 2. GITLEAKS - Secrets detection in git history
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 [2/3] Running gitleaks (secrets detection)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
    echo "⚠️  gitleaks: SKIPPED (not installed)"
    echo "   Install with: brew install gitleaks (macOS) or download from GitHub"
else
    if gitleaks detect --source . --verbose 2>/dev/null; then
        echo "✅ gitleaks: PASSED (no secrets detected)"
    else
        echo "❌ gitleaks: FAILED (secrets detected in repository)"
        FAILED=1
    fi
fi
echo ""

# ============================================================================
# 3. ESLINT SECURITY - Static code analysis for security patterns
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 [3/3] Running ESLint security rules (static analysis)..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if npx eslint -c eslint.config.security.mjs src/ 2>/dev/null; then
    echo "✅ ESLint security: PASSED (no security violations)"
else
    # ESLint returns non-zero for warnings too, check if it's just warnings
    LINT_OUTPUT=$(npx eslint -c eslint.config.security.mjs src/ 2>&1 || true)
    ERROR_COUNT=$(echo "$LINT_OUTPUT" | grep -c "error" || echo "0")

    if [ "$ERROR_COUNT" -gt 0 ]; then
        echo "❌ ESLint security: FAILED (security errors found)"
        FAILED=1
    else
        echo "✅ ESLint security: PASSED (warnings only, no errors)"
    fi
fi
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    AUDIT SUMMARY                                 ║"
echo "╠══════════════════════════════════════════════════════════════════╣"

if [ $FAILED -eq 0 ]; then
    echo "║  ✅ ALL SECURITY CHECKS PASSED                                  ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "║  ❌ SECURITY ISSUES DETECTED - Review output above              ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    exit 1
fi
