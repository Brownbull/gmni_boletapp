# Tech Debt Story TD-14d-48: Fix Cooldown Message Pluralization

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11c
> **Priority:** LOW (UX edge case)
> **Estimated Effort:** XS (< 30 min)
> **Risk:** LOW (i18n improvement)

## Story

As a **user**,
I want **grammatically correct cooldown messages**,
So that **the UI shows "1 minute" instead of "1 minutes"**.

## Problem Statement

When the cooldown timer shows exactly 1 minute remaining, the message displays "Please wait 1 minutes" (plural) instead of "Please wait 1 minute" (singular).

**Current Code:**
```typescript
// TransactionSharingToggle.tsx:91-92
const message = t('transactionSharingCooldownActive');
return message.replace('{minutes}', String(cooldownResult.waitMinutes));
```

**Evidence:** Test at line 520 confirms: `expect(cooldownMessage).toHaveTextContent('1 minutes');`

## Acceptance Criteria

- [ ] AC1: When `waitMinutes === 1`, show "1 minute" (singular)
- [ ] AC2: When `waitMinutes > 1`, show "X minutes" (plural)
- [ ] AC3: Both EN and ES translations handle singular/plural correctly
- [ ] AC4: Update test to verify singular form

## Tasks / Subtasks

- [ ] 1.1 Add singular translation keys to `translations.ts`:
  - `transactionSharingCooldownActiveSingular` (EN)
  - `transactionSharingCooldownActiveSingular` (ES)
- [ ] 1.2 Update `getMessage()` to select singular/plural key based on `waitMinutes`
- [ ] 1.3 Update test expectation for 1-minute case

## Dev Notes

### Proposed Change

```typescript
// TransactionSharingToggle.tsx
if (cooldownResult.reason === 'cooldown' && cooldownResult.waitMinutes !== undefined) {
    const key = cooldownResult.waitMinutes === 1
        ? 'transactionSharingCooldownActiveSingular'
        : 'transactionSharingCooldownActive';
    const message = t(key);
    return message.replace('{minutes}', String(cooldownResult.waitMinutes));
}
```

### Translation Keys

```typescript
// translations.ts
transactionSharingCooldownActive: 'Please wait {minutes} minutes before changing this setting',
transactionSharingCooldownActiveSingular: 'Please wait 1 minute before changing this setting',
// ES
transactionSharingCooldownActive: 'Por favor espera {minutes} minutos antes de cambiar esta configuración',
transactionSharingCooldownActiveSingular: 'Por favor espera 1 minuto antes de cambiar esta configuración',
```

### Tradeoff Analysis

| Factor | Do Now | Defer |
|--------|--------|-------|
| Merge conflict risk | Low | Low |
| User impact | Low (edge case when exactly 1 min) | Acceptable |
| Complexity | Simple | N/A |

**Recommendation:** Low priority - only affects UX when cooldown is exactly 1 minute

### References

- [14d-v2-1-11c](./14d-v2-1-11c-ui-components-integration.md) - Source story
