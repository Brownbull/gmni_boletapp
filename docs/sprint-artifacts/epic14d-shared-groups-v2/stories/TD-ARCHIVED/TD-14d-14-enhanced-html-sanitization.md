# Tech Debt Story TD-14d-14: Enhanced HTML Sanitization for Summary Fields

Status: ready-for-dev

> **Source:** ECC Security Review (2026-02-04) on story 14d-v2-1-8b
> **Priority:** LOW (defense-in-depth, client-side is primary defense)
> **Estimated Effort:** Small (1-2 hours)
> **Risk:** LOW (basic sanitization exists, client must also escape)

## Story

As a **security engineer**,
I want **more robust HTML sanitization in changelog summary fields**,
So that **XSS bypass attempts are blocked at the server level (defense-in-depth)**.

## Problem Statement

The current `sanitizeString` function uses a basic regex to strip HTML tags:

```typescript
// functions/src/changelogWriter.ts:140-149
function sanitizeString(
  value: string | undefined | null,
  maxLength: number,
  fallback: string
): string {
  if (!value || typeof value !== 'string') return fallback;
  // Remove HTML tags (basic XSS prevention - client should also escape)
  const sanitized = value.replace(/<[^>]*>/g, '').trim();
  return sanitized.slice(0, maxLength) || fallback;
}
```

This can be bypassed with certain payloads:
- `<img src=x onerror=alert(1)` (unclosed tag - actually caught by regex)
- `javascript:alert(1)` (protocol handler - not caught)
- HTML entities like `&lt;script&gt;` that decode to script tags

**Current Defense:** Code comment states client must also sanitize (defense-in-depth).

## Acceptance Criteria

1. **Given** a merchant name with JavaScript protocol handler
   **When** the changelog entry is created
   **Then** the protocol handler is stripped or encoded

2. **Given** a merchant name with HTML entities
   **When** the changelog entry is created
   **Then** entities are preserved (not decoded) or double-encoded

3. **Given** valid merchant names with special characters
   **When** the changelog entry is created
   **Then** the name is preserved correctly (no false positives)

## Tasks / Subtasks

- [ ] **Task 1: Evaluate sanitization approaches**
  - [ ] 1.1: Research `sanitize-html` npm package for Node.js
  - [ ] 1.2: Research HTML entity encoding approach
  - [ ] 1.3: Document chosen approach and rationale

- [ ] **Task 2: Implement enhanced sanitization**
  - [ ] 2.1: Update `sanitizeString()` to handle protocol handlers
  - [ ] 2.2: Add tests for XSS bypass attempts
  - [ ] 2.3: Verify no false positives on valid merchant names

- [ ] **Task 3: Documentation**
  - [ ] 3.1: Update code comment to reflect enhanced sanitization
  - [ ] 3.2: Keep client-side escaping requirement documented

## Dev Notes

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Security improvement | Marginal (client is primary defense) | Same |
| Complexity | Adds dependency or regex complexity | Simple |
| Sprint capacity | Uses ~1-2 hours | Scheduled for later |
| Accumulation risk | None | None |

**Recommendation:** Defer - Client-side escaping is the primary defense, and current sanitization blocks most attacks.

### Implementation Options

**Option 1: HTML Entity Encoding (Recommended)**
```typescript
function sanitizeString(value: string | null | undefined, maxLength: number, fallback: string): string {
  if (!value || typeof value !== 'string') return fallback;
  // Encode HTML entities (safer than stripping)
  const encoded = value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
  return encoded.slice(0, maxLength) || fallback;
}
```
Pro: No dependencies, predictable output
Con: Changes displayed text (entities visible if client doesn't decode)

**Option 2: Allowlist Characters**
```typescript
function sanitizeString(value: string | null | undefined, maxLength: number, fallback: string): string {
  if (!value || typeof value !== 'string') return fallback;
  // Keep only allowed characters
  const sanitized = value.replace(/[^\w\s\-.,!?@#$%&*()]/g, '').trim();
  return sanitized.slice(0, maxLength) || fallback;
}
```
Pro: Simple, predictable
Con: May strip valid international characters

**Option 3: Use sanitize-html library**
Pro: Comprehensive, battle-tested
Con: Adds dependency to Cloud Functions

### Files Affected

| File | Action |
|------|--------|
| `functions/src/changelogWriter.ts` | MODIFY (update sanitizeString) |
| `functions/src/__tests__/changelogWriter.test.ts` | MODIFY (add XSS tests) |
| `functions/package.json` | MODIFY (if adding dependency) |

### References

- [14d-v2-1-8b](./14d-v2-1-8b-changelog-writer-validation.md) - Source of this tech debt item
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [CWE-79](https://cwe.mitre.org/data/definitions/79.html) - XSS vulnerability
