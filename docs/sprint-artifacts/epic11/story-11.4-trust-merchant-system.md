# Story 11.4: Trust Merchant System

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Dev Complete
**Story Points:** 5
**Dependencies:** Story 11.2 (Quick Save Card Component)
**Parallel With:** Story 11.3 (Animated Item Reveal)
**Tech Context:** [tech-context-epic11.md](./tech-context-epic11.md)

---

## User Story

As a **user**,
I want **the app to learn which merchants I trust**,
So that **future scans from trusted merchants can be auto-saved**.

---

## Acceptance Criteria

- [x] **AC #1:** System tracks edit rate per merchant per user
- [x] **AC #2:** After 3 successful scans with <10% edit rate, suggest trust prompt
- [x] **AC #3:** Trust prompt: "¿Confiar en {merchant}? Las próximas boletas se guardarán automáticamente"
- [x] **AC #4:** User can accept or decline trust
- [x] **AC #5:** Trusted merchants auto-save on scan completion (skip Quick Save Card)
- [x] **AC #6:** Users can view and manage trusted merchants in Settings
- [x] **AC #7:** Users can revoke trust at any time
- [x] **AC #8:** Trust data stored per-user in Firestore

---

## Tasks / Subtasks

### Task 1: Design Trust Data Model (0.5h)
- [x] Create Firestore schema for merchant trust:
  ```typescript
  interface TrustedMerchant {
    merchantName: string;
    normalizedName: string;
    scanCount: number;
    editCount: number;
    editRate: number; // editCount / scanCount
    trusted: boolean;
    trustedAt?: Date;
    lastScan: Date;
  }
  ```
- [x] Store in user's subcollection: `artifacts/{appId}/users/{uid}/trusted_merchants/{merchantId}`

### Task 2: Implement Merchant Tracking Service (1h)
- [x] Create `src/services/merchantTrustService.ts`
- [x] Track each scan:
  ```typescript
  async function recordScan(merchant: string, wasEdited: boolean): Promise<void>
  ```
- [x] Calculate edit rate after each scan
- [x] Determine if trust prompt should show
- [x] Handle merchant name normalization

### Task 3: Create Trust Prompt Component (1h)
- [x] Create `src/components/TrustMerchantPrompt.tsx`
- [x] Design prompt dialog:
  ```
  ┌─────────────────────────────────────────┐
  │  🤝 ¿Confiar en Líder?                  │
  │                                         │
  │  Has escaneado 3 boletas de Líder       │
  │  sin editar. Las próximas boletas       │
  │  se guardarán automáticamente.          │
  │                                         │
  │  ┌─────────────┐  ┌─────────────┐      │
  │  │ Sí, confiar │  │  No ahora   │      │
  │  └─────────────┘  └─────────────┘      │
  └─────────────────────────────────────────┘
  ```
- [x] Localize for EN/ES

### Task 4: Integrate Trust Prompt into Scan Flow (0.5h)
- [x] Check trust eligibility after save (not before)
- [x] Show prompt after Quick Save completion
- [x] Record response (trusted/declined)
- [x] Only show prompt once per merchant (don't nag)

### Task 5: Implement Auto-Save for Trusted Merchants (0.5h)
- [x] Check if merchant is trusted before showing Quick Save Card
- [x] Trusted merchant: auto-save → insight toast → home
- [x] Show brief "Auto-guardado" indicator
- [x] Handle edge case: trusted merchant with low confidence scan (falls back to Quick Save)

### Task 6: Create Trusted Merchants Settings Section (1h)
- [x] Add "Comercios de Confianza" section to SettingsView
- [x] List all trusted merchants with scan count
- [x] "Remove trust" action per merchant
- [x] Empty state when no trusted merchants

### Task 7: Testing (0.5h)
- [x] Unit tests for merchant trust service
- [x] Unit tests for trust prompt component
- [x] Unit tests for trusted merchants list component
- [x] Unit tests for useTrustedMerchants hook
- [x] All 1695 tests passing

---

## Technical Summary

The Trust Merchant System accelerates the scan flow for repeat merchants by learning user behavior. After 3 scans from the same merchant with minimal edits, the system suggests trusting that merchant for auto-save.

**Trust Criteria:**
- Minimum 3 scans from merchant
- Edit rate < 10%
- User confirms trust

**Auto-Save Behavior:**
```
Scan → Is trusted merchant?
  Yes + High confidence: Auto-save → Insight toast → Home
  Yes + Low confidence: Show Quick Save Card (safety net)
  No: Show Quick Save Card or Edit View
```

**Privacy:**
- Trust data is per-user
- No cross-user trust sharing
- User can revoke at any time

---

## Project Structure Notes

- **Files to create:**
  - `src/services/merchantTrustService.ts`
  - `src/components/TrustMerchantPrompt.tsx`
  - `src/types/trust.ts`

- **Files to modify:**
  - `src/views/SettingsView.tsx` - Add trusted merchants section
  - `src/views/ScanView.tsx` - Integrate trust check and auto-save
  - `src/utils/translations.ts` - Add trust strings

- **Estimated effort:** 5 story points (~8 hours)
- **Prerequisites:** Story 11.2 (Quick Save Card)

---

## Key Code References

**From habits loops.md - Trust Merchant System:**
```typescript
interface TrustedMerchant {
  merchantName: string;
  normalizedName: string;
  scanCount: number;
  editCount: number;
  editRate: number;
  lastScan: Date;
  autoSaveEnabled: boolean;
  suggestedAt?: Date;
  confirmedAt?: Date;
}

function shouldSuggestTrust(merchant: TrustedMerchant): boolean {
  return (
    merchant.scanCount >= 3 &&
    merchant.editRate < 0.1 &&
    !merchant.autoSaveEnabled &&
    !merchant.suggestedAt
  );
}

// Prompt shown after 3rd successful scan with no edits
const trustPrompt = {
  title: "¿Confiar en {merchant}?",
  body: "Las próximas boletas de {merchant} se guardarán automáticamente",
  confirmText: "Sí, confiar",
  cancelText: "No, revisar siempre"
};
```

**Merchant Trust Service:**
```typescript
// src/services/merchantTrustService.ts
export class MerchantTrustService {
  constructor(private userId: string) {}

  async recordScan(merchant: string, wasEdited: boolean): Promise<void> {
    const normalized = this.normalizeMerchant(merchant);
    const docRef = doc(db, `users/${this.userId}/trustedMerchants/${normalized}`);

    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const data = existing.data() as TrustedMerchant;
      await updateDoc(docRef, {
        scanCount: data.scanCount + 1,
        editCount: data.editCount + (wasEdited ? 1 : 0),
        editRate: (data.editCount + (wasEdited ? 1 : 0)) / (data.scanCount + 1),
        lastScan: serverTimestamp()
      });
    } else {
      await setDoc(docRef, {
        merchantName: merchant,
        normalizedName: normalized,
        scanCount: 1,
        editCount: wasEdited ? 1 : 0,
        editRate: wasEdited ? 1 : 0,
        trusted: false,
        lastScan: serverTimestamp()
      });
    }
  }

  async isTrusted(merchant: string): Promise<boolean> {
    const normalized = this.normalizeMerchant(merchant);
    const doc = await getDoc(doc(db, `users/${this.userId}/trustedMerchants/${normalized}`));
    return doc.exists() && doc.data()?.trusted === true;
  }

  private normalizeMerchant(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }
}
```

---

## UI Specifications

**Trust Prompt:**
- Modal overlay with dimmed background
- Width: 300px
- Padding: 24px
- Border radius: 12px
- Centered vertically and horizontally

**Settings - Trusted Merchants:**
- List style matching existing settings sections
- Each merchant shows: name, scan count, last scan date
- "Remove" action on swipe or tap

---

## Context References

**PRD:** [epics.md](../../planning/epics.md) - Epic 11 Trust Merchant scope
**Research:** [habits loops.md](../../uxui/research/habits%20loops.md) - Section 4.3 Trust Merchant System

---

## Definition of Done

- [x] All 8 acceptance criteria verified
- [x] Merchant tracking working
- [x] Trust prompt appears at right time
- [x] Auto-save works for trusted merchants
- [x] Settings UI complete
- [x] Trust revocation works
- [x] Tests passing (2534 tests)
- [x] Code review approved

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes
Story 11.4 Trust Merchant System implemented successfully. The system:
- Tracks merchant scan history per user in Firestore
- Shows trust prompt after 3+ scans with <10% edit rate
- Auto-saves scans from trusted merchants (skips Quick Save Card)
- Provides Settings UI for viewing and revoking trust
- Includes comprehensive unit tests for all components

### Files Created
- `src/types/trust.ts` - TrustedMerchant type and constants
- `src/services/merchantTrustService.ts` - Firestore operations for trust tracking
- `src/components/TrustMerchantPrompt.tsx` - Trust prompt modal component
- `src/components/TrustedMerchantsList.tsx` - Settings list component
- `src/hooks/useTrustedMerchants.ts` - React hook for trust management
- `tests/unit/types/trust.test.ts`
- `tests/unit/services/merchantTrustService.test.ts`
- `tests/unit/components/TrustMerchantPrompt.test.tsx`
- `tests/unit/components/TrustedMerchantsList.test.tsx`
- `tests/unit/hooks/useTrustedMerchants.test.ts`

### Files Modified
- `src/App.tsx` - Integrated trust system into scan flow
- `src/views/SettingsView.tsx` - Added Trusted Merchants section
- `src/utils/translations.ts` - Added EN/ES translations for trust features

### Test Results
- All 1695 tests passing
- New tests added: 49 tests across 5 test files
- Build successful

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
| 2025-12-21 | 2.0 | Dev Complete - All ACs implemented, tests passing |
| 2025-12-22 | 2.1 | Code Review - Fixed HIGH issue (serverTimestamp typing), fixed LOW issue (trustedMerchantsLoading) |
