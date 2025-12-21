# Story 11.4 Context: Trust Merchant System

## Quick Reference

| Field | Value |
|-------|-------|
| Story | [story-11.4-trust-merchant-system.md](./story-11.4-trust-merchant-system.md) |
| Epic | 11 - Quick Save & Scan Flow Optimization |
| Points | 5 |
| Status | Ready for Dev |
| Depends On | 11.2 (Quick Save Card) |
| Parallel | 11.3 (Animated Item Reveal) |

## Key Files to Create

- `src/services/merchantTrustService.ts` - Trust CRUD operations
- `src/components/scan/TrustMerchantCard.tsx` - Trust prompt
- `src/components/settings/TrustedMerchantsSection.tsx` - Settings panel
- `src/types/trust.ts` - TypeScript interfaces

## Key Files to Modify

- `src/views/ScanView.tsx` - Trust check/prompt flow
- `src/views/SettingsView.tsx` - Trusted merchants section
- `src/utils/translations.ts` - Trust strings
- `firestore.rules` - merchantTrust collection rules

## Architecture Alignment

- Follow existing merchantMappingService patterns
- Hybrid storage: Firestore for persistence, localStorage for cache
- Async side-effect pattern (trust tracking doesn't block save)

## Firestore Schema

**Path**: `users/{userId}/merchantTrust/{merchantId}`

```typescript
interface MerchantTrustRecord {
  merchantName: string;
  scanCount: number;
  editCount: number;
  lastScanned: Timestamp;
  trusted: boolean;
  trustedAt?: Timestamp;
  declinedAt?: Timestamp;
}
```

## Critical Implementation Notes

1. **Trust criteria**: 3+ scans, <10% edit rate
2. **Decline cooldown**: 30 days (don't ask again)
3. **Auto-save flow**: Trusted + high confidence = skip QuickSaveCard
4. **Merchant normalization**: lowercase, replace non-alphanumeric with underscore

## Firestore Rules to Add

```javascript
match /artifacts/{appId}/users/{userId}/merchantTrust/{merchantId} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}
```

## Test Focus

- recordScan increments counts correctly
- shouldPromptTrust criteria enforced
- Trust/decline flows work
- Settings display and untrust
