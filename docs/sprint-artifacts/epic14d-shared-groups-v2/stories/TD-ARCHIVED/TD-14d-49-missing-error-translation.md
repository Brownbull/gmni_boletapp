# Tech Debt Story TD-14d-49: Add Missing transactionSharingError Translation Key

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** LOW (has working fallback)
> **Estimated Effort:** XS (< 15 min)
> **Risk:** LOW (i18n consistency)

## Story

As a **developer**,
I want **the `transactionSharingError` key defined in translations.ts**,
So that **all translation keys are centralized and not scattered as inline fallbacks**.

## Problem Statement

The error message for failed transaction sharing toggle uses an inline fallback instead of a proper translation key:

**Current Code (GruposView.tsx:489-493):**
```typescript
t('transactionSharingError') ||
    (lang === 'es'
        ? 'Error al actualizar configuracion. Intenta de nuevo.'
        : 'Failed to update setting. Please try again.'),
```

The `transactionSharingError` key is not defined in `translations.ts`, so it always falls back to the inline string.

## Acceptance Criteria

- [ ] AC1: Add `transactionSharingError` key to EN translations
- [ ] AC2: Add `transactionSharingError` key to ES translations
- [ ] AC3: Remove inline fallback from GruposView.tsx
- [ ] AC4: Translation matches existing inline text

## Tasks / Subtasks

- [ ] 1.1 Add translation keys to `translations.ts`
- [ ] 1.2 Simplify GruposView.tsx to just use `t('transactionSharingError')`
- [ ] 1.3 Verify toast shows correct message in both languages

## Dev Notes

### Proposed Change

```typescript
// translations.ts - EN
transactionSharingError: 'Failed to update setting. Please try again.',

// translations.ts - ES
transactionSharingError: 'Error al actualizar configuración. Intenta de nuevo.',
```

```typescript
// GruposView.tsx - simplified
onShowToast(t('transactionSharingError'), 'error');
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| Functionality impact | None (has fallback) | None |
| Code quality | Improved consistency | Acceptable |

**Recommendation:** Quick fix, consolidate with other translation work

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
