/**
 * Centralized Firestore Collection Path Builders
 *
 * Story 15-1b: Single source of truth for all Firestore paths.
 * All services import path builders from here instead of defining inline.
 *
 * Pattern: artifacts/{appId}/users/{userId}/{collection}
 */

// =============================================================================
// AppId Validation (Story 15-TD-8: Input Validation Hardening)
// =============================================================================

const APP_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const MAX_APP_ID_LENGTH = 64;

function assertValidAppId(appId: string): void {
    if (!appId || appId.length > MAX_APP_ID_LENGTH || !APP_ID_PATTERN.test(appId)) {
        throw new Error('Invalid appId format');
    }
}

// =============================================================================
// Collection Paths (return string paths for collection() calls)
// =============================================================================

export function transactionsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/transactions`;
}

export function merchantMappingsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/merchant_mappings`;
}

export function categoryMappingsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/category_mappings`;
}

export function subcategoryMappingsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/subcategory_mappings`;
}

export function itemNameMappingsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/item_name_mappings`;
}

export function trustedMerchantsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/trusted_merchants`;
}

export function airlocksPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/airlocks`;
}

export function personalRecordsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/personalRecords`;
}

export function notificationsPath(appId: string, userId: string): string {
    assertValidAppId(appId);
    return `artifacts/${appId}/users/${userId}/notifications`;
}

// =============================================================================
// Document Paths (return [collection, ...segments] for doc() calls)
// =============================================================================

export function preferencesDocSegments(appId: string, userId: string) {
    assertValidAppId(appId);
    return ['artifacts', appId, 'users', userId, 'preferences', 'settings'] as const;
}

export function creditsDocSegments(appId: string, userId: string) {
    assertValidAppId(appId);
    return ['artifacts', appId, 'users', userId, 'credits', 'balance'] as const;
}

export function insightProfileDocSegments(appId: string, userId: string) {
    assertValidAppId(appId);
    return ['artifacts', appId, 'users', userId, 'insightProfile', 'profile'] as const;
}

// =============================================================================
// Transaction Document Path (for doc() calls with known ID)
// =============================================================================

export function transactionDocSegments(appId: string, userId: string, transactionId: string) {
    assertValidAppId(appId);
    return ['artifacts', appId, 'users', userId, 'transactions', transactionId] as const;
}

export function notificationDocSegments(appId: string, userId: string, notificationId: string) {
    assertValidAppId(appId);
    return ['artifacts', appId, 'users', userId, 'notifications', notificationId] as const;
}
