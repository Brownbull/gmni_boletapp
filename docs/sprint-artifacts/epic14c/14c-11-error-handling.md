# Story 14c.11: Error Handling

Status: done

## Story

As a user,
I want clear error messages when shared group operations fail,
so that I know what went wrong and how to fix it.

## Acceptance Criteria

1. **AC1: User Not Found Error (Email Invitation)**
   - Given I try to invite someone by email
   - When the email doesn't match any registered user
   - Then I see "User Not Found" error
   - And I see "No user found with this email. They must sign up first."
   - And I can try a different email address

2. **AC2: Invitation Expired Error**
   - Given I try to accept an expired invitation
   - When the expiration check fails
   - Then I see "Invitation Expired" error
   - And I see "Ask the group owner to send a new invitation"
   - And the invitation is shown grayed out

3. **AC3: Group Full Error**
   - Given I try to join a group that has 10 members
   - When the join attempt fails
   - Then I see "Group is Full" error
   - And I see "This group has reached the maximum of 10 members"
   - And there may be a "Contact Owner" suggestion

4. **AC4: Network Error with Offline Fallback**
   - Given network connectivity is lost
   - When any shared group operation fails due to network
   - Then I see "Connection Error" message
   - And I see "Check your internet connection"
   - And cached data remains visible (if available)
   - And a "Retry" button is available

5. **AC5: IndexedDB Quota Exceeded**
   - Given IndexedDB storage is full
   - When cache write fails
   - Then I see a warning toast (not blocking error)
   - And the message suggests clearing old data
   - And the app continues to function with reduced caching

## Tasks / Subtasks

- [x] Task 1: Create Error Display Components (AC: #1, #2, #3)
  - [x] 1.1 Create `SharedGroupError.tsx` - unified error display
  - [x] 1.2 Create error type enum: USER_NOT_FOUND, INVITATION_EXPIRED, GROUP_FULL, etc.
  - [x] 1.3 Design error illustrations per mockup (emoji icons)
  - [x] 1.4 Add "Try Again" button for recoverable errors
  - [x] 1.5 Add contextual help text for each error type

- [x] Task 2: Implement Invitation Error Handling (AC: #1, #2, #3)
  - [x] 2.1 Detect user not found when sending invitation
  - [x] 2.2 Detect expired invitation via `expiresAt` check
  - [x] 2.3 Detect group full via `members.length >= 10`
  - [x] 2.4 Show appropriate error in invitation UI (leveraged existing PendingInvitationsSection patterns)

- [x] Task 3: Implement Network Error Handling (AC: #4)
  - [x] 3.1 Catch network errors in all shared group operations
  - [x] 3.2 Show connection error UI with retry option
  - [x] 3.3 Preserve cached data visibility during offline
  - [x] 3.4 Auto-retry when connection restored (optional - via React Query)

- [x] Task 4: Implement Storage Error Handling (AC: #5)
  - [x] 4.1 Catch IndexedDB quota exceeded errors
  - [x] 4.2 Show non-blocking toast warning
  - [x] 4.3 Trigger cache cleanup if needed (cleanupOldCacheEntries)
  - [x] 4.4 Fall back to in-memory caching (writeToCacheWithRetry)

- [x] Task 5: Error Boundaries (AC: all)
  - [x] 5.1 Create `SharedGroupErrorBoundary.tsx`
  - [x] 5.2 Wrap shared group views with error boundary (integrated into SettingsView.tsx for GruposView)
  - [x] 5.3 Display graceful error UI on component crash
  - [x] 5.4 Log errors for debugging

- [x] Task 6: i18n Translations
  - [x] 6.1 Add all error message strings (EN + ES)
  - [x] 6.2 Add help text strings
  - [x] 6.3 Add button label strings

- [x] Task 7: Component Tests
  - [x] 7.1 Test invalid code error display
  - [x] 7.2 Test expired code error display
  - [x] 7.3 Test group full error display
  - [x] 7.4 Test network error handling
  - [x] 7.5 Test quota exceeded handling

## Dev Notes

### Architecture Context

**Error Categories:**
1. **Recoverable** - User can fix (invalid code → try different code)
2. **Non-recoverable** - Requires external action (expired → ask owner)
3. **Temporary** - May self-resolve (network → retry)
4. **Degraded** - App continues with limitations (storage quota)

### Existing Code to Leverage

**Error Handling Patterns:**
- Existing toast system for non-blocking errors
- Error boundary patterns if exist
- React Query error states

**Toast System:**
- Check `src/components/Toast.tsx` or toast library
- Use for non-blocking warnings

### Project Structure Notes

**New files to create:**
```
src/
├── components/
│   └── shared-groups/
│       ├── SharedGroupError.tsx          # Error display component
│       └── SharedGroupErrorBoundary.tsx  # React error boundary
├── lib/
│   └── sharedGroupErrors.ts              # Error types and utilities
```

**Files to modify:**
```
src/components/views/JoinGroupPage.tsx     # Add error handling
src/hooks/useSharedGroupTransactions.ts    # Add error states
src/lib/sharedGroupCache.ts                # Add storage error handling
```

### Error Types Definition

```typescript
// src/lib/sharedGroupErrors.ts
export enum SharedGroupErrorType {
  USER_NOT_FOUND = 'USER_NOT_FOUND',       // Email doesn't match any user
  INVITATION_EXPIRED = 'INVITATION_EXPIRED', // Invitation past expiresAt
  GROUP_FULL = 'GROUP_FULL',
  ALREADY_MEMBER = 'ALREADY_MEMBER',
  ALREADY_INVITED = 'ALREADY_INVITED',     // Pending invitation exists
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_QUOTA = 'STORAGE_QUOTA',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN = 'UNKNOWN',
}

export interface SharedGroupError {
  type: SharedGroupErrorType;
  message: string;
  recoverable: boolean;
  retryAction?: () => void;
}

export function classifyError(error: unknown): SharedGroupError {
  if (error instanceof FirebaseError) {
    if (error.code === 'unavailable' || error.code === 'network-request-failed') {
      return {
        type: SharedGroupErrorType.NETWORK_ERROR,
        message: t('networkError'),
        recoverable: true,
      };
    }
    if (error.code === 'permission-denied') {
      return {
        type: SharedGroupErrorType.PERMISSION_DENIED,
        message: t('permissionDenied'),
        recoverable: false,
      };
    }
  }

  if (error instanceof DOMException && error.name === 'QuotaExceededError') {
    return {
      type: SharedGroupErrorType.STORAGE_QUOTA,
      message: t('storageQuotaExceeded'),
      recoverable: true,  // Degraded mode
    };
  }

  return {
    type: SharedGroupErrorType.UNKNOWN,
    message: t('unknownError'),
    recoverable: false,
  };
}
```

### Error Display Component

```typescript
// src/components/shared-groups/SharedGroupError.tsx
interface SharedGroupErrorProps {
  error: SharedGroupError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const errorConfigs: Record<SharedGroupErrorType, {
  icon: string;
  title: string;
  colorClass: string;
}> = {
  [SharedGroupErrorType.USER_NOT_FOUND]: {
    icon: '❓',
    title: t('userNotFound'),
    colorClass: 'bg-yellow-50 border-yellow-200',
  },
  [SharedGroupErrorType.INVITATION_EXPIRED]: {
    icon: '⏰',
    title: t('invitationExpired'),
    colorClass: 'bg-gray-50 border-gray-200',
  },
  [SharedGroupErrorType.GROUP_FULL]: {
    icon: '👥',
    title: t('groupIsFull'),
    colorClass: 'bg-gray-50 border-gray-200',
  },
  [SharedGroupErrorType.NETWORK_ERROR]: {
    icon: '📡',
    title: t('connectionError'),
    colorClass: 'bg-blue-50 border-blue-200',
  },
  // ... other types
};

export function SharedGroupError({ error, onRetry, onDismiss }: SharedGroupErrorProps) {
  const config = errorConfigs[error.type];

  return (
    <div className={cn('p-6 rounded-lg border text-center', config.colorClass)}>
      <div className="text-4xl mb-4">{config.icon}</div>
      <h2 className="text-lg font-semibold mb-2">{config.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{error.message}</p>

      <div className="flex gap-3 justify-center">
        {error.recoverable && onRetry && (
          <Button onClick={onRetry}>{t('tryAgain')}</Button>
        )}
        {onDismiss && (
          <Button variant="ghost" onClick={onDismiss}>{t('dismiss')}</Button>
        )}
      </div>
    </div>
  );
}
```

### Join Page Error Integration

```typescript
// In JoinGroupPage.tsx
function JoinGroupPage() {
  const { shareCode } = useParams();
  const { data: group, error, isLoading } = useSharedGroupByCode(shareCode);
  const [joinError, setJoinError] = useState<SharedGroupError | null>(null);

  // Classify errors
  useEffect(() => {
    if (error) {
      setJoinError(classifyError(error));
    } else if (group && isCodeExpired(group.shareCodeExpiresAt)) {
      setJoinError({
        type: SharedGroupErrorType.EXPIRED_CODE,
        message: t('askOwnerForNewLink'),
        recoverable: false,
      });
    } else if (group && group.members.length >= 10) {
      setJoinError({
        type: SharedGroupErrorType.GROUP_FULL,
        message: t('maxMembersReached'),
        recoverable: false,
      });
    }
  }, [error, group]);

  if (joinError) {
    return (
      <SharedGroupError
        error={joinError}
        onRetry={joinError.recoverable ? () => navigate('/') : undefined}
      />
    );
  }

  // ... normal join flow
}
```

### Network Error Handling

```typescript
// In useSharedGroupTransactions hook
export function useSharedGroupTransactions({ groupId }: { groupId: string }) {
  const queryResult = useQuery({
    queryKey: ['sharedGroupTransactions', groupId],
    queryFn: () => fetchSharedGroupTransactions(groupId),
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    networkMode: 'offlineFirst',  // Use cached data when offline
  });

  // Handle network errors gracefully
  const error = queryResult.error
    ? classifyError(queryResult.error)
    : null;

  return {
    ...queryResult,
    error,
    hasNetworkError: error?.type === SharedGroupErrorType.NETWORK_ERROR,
    showOfflineBanner: !navigator.onLine && queryResult.data?.length > 0,
  };
}
```

### Storage Quota Handling

```typescript
// In sharedGroupCache.ts
export async function writeToCache(
  groupId: string,
  transactions: Transaction[]
): Promise<void> {
  try {
    const db = await openSharedGroupDB();
    // ... write operations
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Non-blocking warning
      toast.warn(t('storageLimited'));

      // Attempt cache cleanup
      try {
        await cleanupOldCacheEntries();
        // Retry write after cleanup
        await writeToCache(groupId, transactions);
      } catch {
        // Fall back to in-memory only
        console.warn('IndexedDB unavailable, using in-memory cache only');
      }
    } else {
      throw error;
    }
  }
}
```

### UX Mockup Reference

See mockup: `docs/uxui/mockups/01_views/shared-groups.html` → "Error States" tab
- Invalid code error card
- Expired code error card
- Group full error card
- Network error card

### Error Message Copy

| Error | Title | Message |
|-------|-------|---------|
| User Not Found | "User Not Found" | "No user found with this email. They must sign up first." |
| Invitation Expired | "Invitation Expired" | "This invitation has expired. Ask the group owner to send a new one." |
| Group Full | "Group is Full" | "This group has reached the maximum of 10 members." |
| Already Invited | "Already Invited" | "An invitation was already sent to this email." |
| Network Error | "Connection Error" | "Unable to connect. Check your internet and try again." |
| Storage Quota | "Storage Limited" (toast) | "Offline data may be limited. Consider clearing old data." |

### References

- [Epic 14C Architecture]: docs/sprint-artifacts/epic14/epic-14c-household-sharing.md
- [Brainstorming - Error Scenarios]: docs/analysis/brainstorming-session-2026-01-15.md
- [UX Mockup - Error States]: docs/uxui/mockups/01_views/shared-groups.html
- [React Query Error Handling]: https://tanstack.com/query/latest/docs/react/guides/error-handling
- [IndexedDB Quota]: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Browser_storage_limits_and_eviction_criteria

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

1. Created unified error classification system in `src/lib/sharedGroupErrors.ts` with:
   - 16 error types covering all shared group operation failures
   - `classifyError()` function to automatically detect Firebase, network, storage quota, and permission errors
   - `getErrorConfig()` for UI configuration per error type
   - Helper functions: `isNetworkRelated()`, `isStorageRelated()`, `shouldShowAsToast()`

2. Created `SharedGroupError.tsx` component with:
   - Full card mode for blocking errors
   - Compact inline mode for non-blocking errors
   - Network status indicator for connection errors
   - Retry button for recoverable errors
   - Navigate home button for non-recoverable errors
   - Dark/light theme support
   - ARIA accessibility (role="alert")

3. Created `SharedGroupErrorBoundary.tsx` React error boundary with:
   - Graceful error UI on component crashes
   - Retry functionality to reset error state
   - Navigate home callback
   - Custom fallback support
   - Error logging with component stack

4. Enhanced IndexedDB cache with storage quota handling:
   - `isQuotaExceededError()` detection
   - `cleanupOldCacheEntries()` for aggressive cache eviction
   - `writeToCacheWithRetry()` for automatic cleanup and retry
   - Partial write support when quota exceeded mid-operation

5. Added comprehensive i18n translations (EN + ES):
   - 16 error title keys
   - 16 error message keys
   - 8 UI label keys (retry, dismiss, offline status, etc.)

6. Created 89 unit tests across 3 test files:
   - `tests/unit/lib/sharedGroupErrors.test.ts` (41 tests)
   - `tests/unit/components/SharedGroups/SharedGroupError.test.tsx` (32 tests)
   - `tests/unit/components/SharedGroups/SharedGroupErrorBoundary.test.tsx` (16 tests)

### File List

**New Files Created:**
- `src/lib/sharedGroupErrors.ts` - Error types and classification utilities
- `src/components/SharedGroups/SharedGroupError.tsx` - Error display component
- `src/components/SharedGroups/SharedGroupErrorBoundary.tsx` - React error boundary
- `tests/unit/lib/sharedGroupErrors.test.ts` - Error utilities tests
- `tests/unit/components/SharedGroups/SharedGroupError.test.tsx` - Error component tests
- `tests/unit/components/SharedGroups/SharedGroupErrorBoundary.test.tsx` - Error boundary tests

**Modified Files:**
- `src/lib/sharedGroupCache.ts` - Added quota exceeded handling, cleanup functions
- `src/hooks/useSharedGroupTransactions.ts` - Added writeToCacheWithRetry import
- `src/utils/translations.ts` - Added error handling translations (EN + ES)
- `docs/sprint-artifacts/sprint-status.yaml` - Updated story status to in-progress
- `docs/sprint-artifacts/epic14c/14c-11-error-handling.md` - Updated with notes
- `src/components/SharedGroups/index.ts` - Added exports for error components

### Review Follow-ups (AI)
- [x] [AI-Review][HIGH] Integrate SharedGroupErrorBoundary into shared group views (App.tsx or view components)
  - Integrated in `src/views/SettingsView.tsx` wrapping GruposView
- [x] [AI-Review][HIGH] Integrate classifyError() into PendingInvitationsSection (replace manual switch/case)
  - Updated `src/components/SharedGroups/PendingInvitationsSection.tsx` to use classifyError() and getErrorConfig()
- [x] [AI-Review][MEDIUM] Add SharedGroupError component usage for AC2 expired invitation display
  - Added expired invitation help text using error config in PendingInvitationsSection

### Second Implementation Session Notes

7. Addressed all code review follow-ups:
   - Integrated `SharedGroupErrorBoundary` into `SettingsView.tsx` wrapping `GruposView`
   - Replaced manual switch/case error handling with `classifyError()` and `getErrorConfig()` in `PendingInvitationsSection`
   - Added expired invitation help text using `SharedGroupErrorType.INVITATION_EXPIRED` error config for AC2

8. All 109 tests passing:
   - 41 error utility tests
   - 32 error component tests
   - 16 error boundary tests
   - 20 shared group transactions hook tests

9. Build successful with no TypeScript errors in modified files

### Additional Files Modified (Second Session)
- `src/views/SettingsView.tsx` - Wrapped GruposView with SharedGroupErrorBoundary
- `src/components/SharedGroups/PendingInvitationsSection.tsx` - Integrated classifyError() and added AC2 expired message

