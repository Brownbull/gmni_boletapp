# Story 11.4: Trust Merchant System

**Epic:** Epic 11 - Quick Save & Scan Flow Optimization
**Status:** Draft
**Story Points:** 5
**Dependencies:** Story 11.2 (Quick Save Card Component)

---

## User Story

As a **user**,
I want **the app to learn which merchants I trust**,
So that **future scans from trusted merchants can be auto-saved**.

---

## Acceptance Criteria

- [ ] **AC #1:** System tracks edit rate per merchant per user
- [ ] **AC #2:** After 3 successful scans with <10% edit rate, suggest trust prompt
- [ ] **AC #3:** Trust prompt: "¿Confiar en {merchant}? Las próximas boletas se guardarán automáticamente"
- [ ] **AC #4:** User can accept or decline trust
- [ ] **AC #5:** Trusted merchants auto-save on scan completion (skip Quick Save Card)
- [ ] **AC #6:** Users can view and manage trusted merchants in Settings
- [ ] **AC #7:** Users can revoke trust at any time
- [ ] **AC #8:** Trust data stored per-user in Firestore

---

## Tasks / Subtasks

### Task 1: Design Trust Data Model (0.5h)
- [ ] Create Firestore schema for merchant trust:
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
- [ ] Store in user's subcollection: `users/{uid}/trustedMerchants/{merchantId}`

### Task 2: Implement Merchant Tracking Service (1h)
- [ ] Create `src/services/merchantTrustService.ts`
- [ ] Track each scan:
  ```typescript
  async function recordScan(merchant: string, wasEdited: boolean): Promise<void>
  ```
- [ ] Calculate edit rate after each scan
- [ ] Determine if trust prompt should show
- [ ] Handle merchant name normalization

### Task 3: Create Trust Prompt Component (1h)
- [ ] Create `src/components/TrustMerchantPrompt.tsx`
- [ ] Design prompt dialog:
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
- [ ] Localize for EN/ES

### Task 4: Integrate Trust Prompt into Scan Flow (0.5h)
- [ ] Check trust eligibility after save (not before)
- [ ] Show prompt after insight toast (Story 10.2)
- [ ] Record response (trusted/declined)
- [ ] Only show prompt once per merchant (don't nag)

### Task 5: Implement Auto-Save for Trusted Merchants (0.5h)
- [ ] Check if merchant is trusted before showing Quick Save Card
- [ ] Trusted merchant: auto-save → insight toast → home
- [ ] Show brief "Auto-guardado" indicator
- [ ] Handle edge case: trusted merchant with low confidence scan

### Task 6: Create Trusted Merchants Settings Section (1h)
- [ ] Add "Comercios de Confianza" section to SettingsView
- [ ] List all trusted merchants with scan count
- [ ] "Remove trust" action per merchant
- [ ] Empty state when no trusted merchants

### Task 7: Testing (0.5h)
- [ ] Unit tests for merchant trust service
- [ ] Unit tests for trust prompt component
- [ ] Integration test for trust flow
- [ ] Test auto-save behavior
- [ ] Test trust revocation

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

- [ ] All 8 acceptance criteria verified
- [ ] Merchant tracking working
- [ ] Trust prompt appears at right time
- [ ] Auto-save works for trusted merchants
- [ ] Settings UI complete
- [ ] Trust revocation works
- [ ] Tests passing
- [ ] Code review approved

---

## Dev Agent Record

### Agent Model Used
<!-- Will be populated during dev-story execution -->

### Completion Notes
<!-- Will be populated during dev-story execution -->

### Files Modified
<!-- Will be populated during dev-story execution -->

### Test Results
<!-- Will be populated during dev-story execution -->

---

### Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-16 | 1.0 | Story drafted from Epic 11 definition |
