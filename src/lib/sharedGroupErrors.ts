/**
 * Shared Group Error Types and Utilities
 *
 * Epic 14c: Shared Groups (Household Sharing)
 *
 * Provides unified error classification for shared group operations.
 * Errors are categorized by recoverability and user action required.
 *
 * Error Categories:
 * 1. Recoverable - User can fix (invalid code → try different code)
 * 2. Non-recoverable - Requires external action (expired → ask owner)
 * 3. Temporary - May self-resolve (network → retry)
 * 4. Degraded - App continues with limitations (storage quota)
 */

/**
 * Error types for shared group operations
 */
export enum SharedGroupErrorType {
    // Invitation errors
    USER_NOT_FOUND = 'USER_NOT_FOUND',
    INVITATION_EXPIRED = 'INVITATION_EXPIRED',
    INVITATION_NOT_FOUND = 'INVITATION_NOT_FOUND',
    ALREADY_INVITED = 'ALREADY_INVITED',

    // Group errors
    GROUP_FULL = 'GROUP_FULL',
    GROUP_NOT_FOUND = 'GROUP_NOT_FOUND',
    ALREADY_MEMBER = 'ALREADY_MEMBER',
    NOT_A_MEMBER = 'NOT_A_MEMBER',
    OWNER_CANNOT_LEAVE = 'OWNER_CANNOT_LEAVE',
    NOT_OWNER = 'NOT_OWNER',
    CANNOT_TRANSFER_TO_SELF = 'CANNOT_TRANSFER_TO_SELF',
    TARGET_NOT_MEMBER = 'TARGET_NOT_MEMBER',

    // Share code errors
    CODE_NOT_FOUND = 'CODE_NOT_FOUND',
    CODE_EXPIRED = 'CODE_EXPIRED',

    // Infrastructure errors
    NETWORK_ERROR = 'NETWORK_ERROR',
    STORAGE_QUOTA = 'STORAGE_QUOTA',
    PERMISSION_DENIED = 'PERMISSION_DENIED',

    // Fallback
    UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error object for shared group operations
 */
export interface SharedGroupError {
    /** Error type classification */
    type: SharedGroupErrorType;
    /** User-facing message (should be translated) */
    message: string;
    /** Whether user can take action to recover */
    recoverable: boolean;
    /** Optional callback to retry the operation */
    retryAction?: () => void;
    /** Original error for debugging */
    originalError?: unknown;
}

/**
 * Configuration for each error type
 */
interface ErrorConfig {
    /** Icon to display (emoji) */
    icon: string;
    /** CSS color class for styling */
    colorClass: string;
    /** Whether the error is recoverable */
    recoverable: boolean;
    /** Translation key for the title */
    titleKey: string;
    /** Translation key for the message */
    messageKey: string;
}

/**
 * Error configurations for UI display
 */
export const ERROR_CONFIGS: Record<SharedGroupErrorType, ErrorConfig> = {
    [SharedGroupErrorType.USER_NOT_FOUND]: {
        icon: '❓',
        colorClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
        recoverable: true,
        titleKey: 'errorUserNotFoundTitle',
        messageKey: 'errorUserNotFoundMessage',
    },
    [SharedGroupErrorType.INVITATION_EXPIRED]: {
        icon: '⏰',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'errorInvitationExpiredTitle',
        messageKey: 'errorInvitationExpiredMessage',
    },
    [SharedGroupErrorType.INVITATION_NOT_FOUND]: {
        icon: '🔍',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'errorInvitationNotFoundTitle',
        messageKey: 'invitationNotFound',
    },
    [SharedGroupErrorType.ALREADY_INVITED]: {
        icon: '📧',
        colorClass: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
        recoverable: false,
        titleKey: 'errorAlreadyInvitedTitle',
        messageKey: 'errorAlreadyInvitedMessage',
    },
    [SharedGroupErrorType.GROUP_FULL]: {
        icon: '👥',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'errorGroupFullTitle',
        messageKey: 'errorGroupFullMessage',
    },
    [SharedGroupErrorType.GROUP_NOT_FOUND]: {
        icon: '🔍',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'groupNotFound',
        messageKey: 'errorGroupNotFoundMessage',
    },
    [SharedGroupErrorType.ALREADY_MEMBER]: {
        icon: '✓',
        colorClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700',
        recoverable: false,
        titleKey: 'errorAlreadyMemberTitle',
        messageKey: 'alreadyMember',
    },
    [SharedGroupErrorType.NOT_A_MEMBER]: {
        icon: '🚫',
        colorClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
        recoverable: false,
        titleKey: 'errorNotMemberTitle',
        messageKey: 'errorNotMemberMessage',
    },
    [SharedGroupErrorType.OWNER_CANNOT_LEAVE]: {
        icon: '👑',
        colorClass: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700',
        recoverable: true,
        titleKey: 'ownerLeaveWarningTitle',
        messageKey: 'ownerLeaveWarningDesc',
    },
    [SharedGroupErrorType.NOT_OWNER]: {
        icon: '🔒',
        colorClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
        recoverable: false,
        titleKey: 'errorNotOwnerTitle',
        messageKey: 'errorNotOwnerMessage',
    },
    [SharedGroupErrorType.CANNOT_TRANSFER_TO_SELF]: {
        icon: '🔄',
        colorClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
        recoverable: true,
        titleKey: 'errorCannotTransferToSelfTitle',
        messageKey: 'errorCannotTransferToSelfMessage',
    },
    [SharedGroupErrorType.TARGET_NOT_MEMBER]: {
        icon: '👤',
        colorClass: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700',
        recoverable: true,
        titleKey: 'errorTargetNotMemberTitle',
        messageKey: 'errorTargetNotMemberMessage',
    },
    [SharedGroupErrorType.CODE_NOT_FOUND]: {
        icon: '🔗',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: true,
        titleKey: 'errorCodeNotFoundTitle',
        messageKey: 'errorCodeNotFoundMessage',
    },
    [SharedGroupErrorType.CODE_EXPIRED]: {
        icon: '⏰',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'errorCodeExpiredTitle',
        messageKey: 'errorCodeExpiredMessage',
    },
    [SharedGroupErrorType.NETWORK_ERROR]: {
        icon: '📡',
        colorClass: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700',
        recoverable: true,
        titleKey: 'errorNetworkTitle',
        messageKey: 'errorNetworkMessage',
    },
    [SharedGroupErrorType.STORAGE_QUOTA]: {
        icon: '💾',
        colorClass: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-700',
        recoverable: true,
        titleKey: 'errorStorageQuotaTitle',
        messageKey: 'errorStorageQuotaMessage',
    },
    [SharedGroupErrorType.PERMISSION_DENIED]: {
        icon: '🔐',
        colorClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700',
        recoverable: false,
        titleKey: 'errorPermissionDeniedTitle',
        messageKey: 'errorPermissionDeniedMessage',
    },
    [SharedGroupErrorType.UNKNOWN]: {
        icon: '⚠️',
        colorClass: 'bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-600',
        recoverable: false,
        titleKey: 'errorUnknownTitle',
        messageKey: 'errorUnknownMessage',
    },
};

/**
 * Map of error message strings to error types
 * These match the error messages thrown by sharedGroupService.ts
 */
const ERROR_MESSAGE_MAP: Record<string, SharedGroupErrorType> = {
    // From joinByShareCode
    CODE_NOT_FOUND: SharedGroupErrorType.CODE_NOT_FOUND,
    CODE_EXPIRED: SharedGroupErrorType.CODE_EXPIRED,

    // From acceptInvitation
    INVITATION_NOT_FOUND: SharedGroupErrorType.INVITATION_NOT_FOUND,
    INVITATION_EXPIRED: SharedGroupErrorType.INVITATION_EXPIRED,

    // Common group errors
    GROUP_NOT_FOUND: SharedGroupErrorType.GROUP_NOT_FOUND,
    GROUP_FULL: SharedGroupErrorType.GROUP_FULL,
    ALREADY_MEMBER: SharedGroupErrorType.ALREADY_MEMBER,
    NOT_A_MEMBER: SharedGroupErrorType.NOT_A_MEMBER,

    // Ownership errors
    OWNER_CANNOT_LEAVE: SharedGroupErrorType.OWNER_CANNOT_LEAVE,
    NOT_OWNER: SharedGroupErrorType.NOT_OWNER,
    CANNOT_TRANSFER_TO_SELF: SharedGroupErrorType.CANNOT_TRANSFER_TO_SELF,
    TARGET_NOT_MEMBER: SharedGroupErrorType.TARGET_NOT_MEMBER,
};

/**
 * Check if an error is a Firebase network error
 */
function isNetworkError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as { code?: string; message?: string };

    // Firebase error codes for network issues
    const networkErrorCodes = [
        'unavailable',
        'network-request-failed',
        'failed-precondition',
    ];

    if (err.code && networkErrorCodes.includes(err.code)) {
        return true;
    }

    // Check error message for network-related text
    if (err.message) {
        const msg = err.message.toLowerCase();
        return (
            msg.includes('network') ||
            msg.includes('offline') ||
            msg.includes('connection') ||
            msg.includes('fetch')
        );
    }

    return false;
}

/**
 * Check if an error is a storage quota exceeded error
 */
function isStorageQuotaError(error: unknown): boolean {
    if (error instanceof DOMException) {
        return error.name === 'QuotaExceededError';
    }

    if (error && typeof error === 'object') {
        const err = error as { name?: string; message?: string };
        if (err.name === 'QuotaExceededError') return true;
        if (err.message?.includes('QuotaExceeded')) return true;
    }

    return false;
}

/**
 * Check if an error is a Firebase permission denied error
 */
function isPermissionError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;

    const err = error as { code?: string; message?: string };

    if (err.code === 'permission-denied') return true;
    if (err.message?.toLowerCase().includes('permission')) return true;

    return false;
}

/**
 * Classify an error into a SharedGroupError
 *
 * @param error - The error to classify (can be Error, string, or unknown)
 * @param defaultMessage - Fallback message for unknown errors
 * @returns Classified SharedGroupError
 */
export function classifyError(
    error: unknown,
    defaultMessage = 'An unexpected error occurred'
): SharedGroupError {
    // Handle null/undefined
    if (error == null) {
        return {
            type: SharedGroupErrorType.UNKNOWN,
            message: defaultMessage,
            recoverable: false,
            originalError: error,
        };
    }

    // Check infrastructure errors first
    if (isNetworkError(error)) {
        return {
            type: SharedGroupErrorType.NETWORK_ERROR,
            message: 'errorNetworkMessage',
            recoverable: true,
            originalError: error,
        };
    }

    if (isStorageQuotaError(error)) {
        return {
            type: SharedGroupErrorType.STORAGE_QUOTA,
            message: 'errorStorageQuotaMessage',
            recoverable: true,
            originalError: error,
        };
    }

    if (isPermissionError(error)) {
        return {
            type: SharedGroupErrorType.PERMISSION_DENIED,
            message: 'errorPermissionDeniedMessage',
            recoverable: false,
            originalError: error,
        };
    }

    // Extract error message
    let errorMessage: string;
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    } else {
        errorMessage = String(error);
    }

    // Check against known error codes
    const errorType = ERROR_MESSAGE_MAP[errorMessage];
    if (errorType) {
        const config = ERROR_CONFIGS[errorType];
        return {
            type: errorType,
            message: config.messageKey,
            recoverable: config.recoverable,
            originalError: error,
        };
    }

    // Fallback to unknown error
    return {
        type: SharedGroupErrorType.UNKNOWN,
        message: errorMessage || defaultMessage,
        recoverable: false,
        originalError: error,
    };
}

/**
 * Get the error configuration for an error type
 */
export function getErrorConfig(type: SharedGroupErrorType): ErrorConfig {
    return ERROR_CONFIGS[type];
}

/**
 * Check if error type is related to network/connection
 */
export function isNetworkRelated(type: SharedGroupErrorType): boolean {
    return type === SharedGroupErrorType.NETWORK_ERROR;
}

/**
 * Check if error type is related to storage
 */
export function isStorageRelated(type: SharedGroupErrorType): boolean {
    return type === SharedGroupErrorType.STORAGE_QUOTA;
}

/**
 * Check if an error should be shown as a toast (non-blocking)
 * vs a full-page error display
 */
export function shouldShowAsToast(type: SharedGroupErrorType): boolean {
    // Storage quota and some recoverable errors show as toast
    return type === SharedGroupErrorType.STORAGE_QUOTA;
}
