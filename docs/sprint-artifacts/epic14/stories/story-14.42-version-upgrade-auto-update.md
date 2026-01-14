# Story 14.42: Version Upgrade & Automatic Update Detection

## Story

**As a** user of Gastify
**I want** to know when a new version is available and easily update
**So that** I always have the latest features and bug fixes without manually checking

## Status

| Field | Value |
|-------|-------|
| **Epic** | 14 - UI/UX Refinement |
| **Points** | 3 |
| **Priority** | High |
| **Status** | Ready for Dev |

## Context

### Current State

1. **Version Display**: App version is shown in Settings → App via `__APP_VERSION__` (currently `9.6.1`)
2. **PWA Update Infrastructure**:
   - `usePWAUpdate.ts` hook detects service worker updates
   - `PWAUpdatePrompt.tsx` shows a **bottom** notification when updates are available
   - `vite-plugin-pwa` with `registerType: 'autoUpdate'` handles SW registration

### Problem

- Version number is outdated (`9.6.1`) after many significant changes (Epic 14, 14d complete)
- Update prompt is positioned at the **bottom** of the screen - less visible
- User request: Top banner prompt with "Hay una actualización. ¿Quieres actualizar?" message

### Solution

1. **Bump version** to reflect the substantial changes
2. **Reposition update prompt** to top of screen as a banner
3. **Spanish translations** for update message
4. **Improved UX**: Clear "Actualizar" and "Después" (Dismiss) buttons

## Acceptance Criteria

### AC1: Version Update
- [ ] Update `package.json` version to `1.0.0-beta.1` (pre-launch beta milestone for expanded test users)
- [ ] Version displays correctly in Settings → App
- [ ] Version displays correctly in TopHeader profile dropdown

### AC2: Top Banner Update Prompt
- [ ] When service worker detects a new version, show a **top banner** (not bottom toast)
- [ ] Banner appears at the top of the screen, below any fixed headers
- [ ] Banner is non-blocking (user can continue using the app)
- [ ] Banner has appropriate styling matching app theme (light/dark)

### AC3: Update Banner Content
- [ ] Spanish message: "Hay una actualización disponible. ¿Quieres actualizar?"
- [ ] English message: "There is an update available. Do you want to update?"
- [ ] Two buttons:
  - "Actualizar" / "Update" - Triggers service worker update and reload
  - "Después" / "Dismiss" - Closes the banner (user can update from Settings later)

### AC4: Banner Behavior
- [ ] Banner persists until user action (Update or Dismiss)
- [ ] Dismiss stores preference in localStorage to not show again for this session
- [ ] Update triggers `updateServiceWorker(true)` and reloads the app
- [ ] Banner shows again on next app load if user dismissed and update is still pending

### AC5: Test Coverage
- [ ] Unit tests for banner component (render, click handlers)
- [ ] Unit tests for dismiss persistence logic
- [ ] Test coverage ≥80% for new/modified files

## Technical Design

### Files to Modify

| File | Change |
|------|--------|
| `package.json` | Bump `version` from `9.6.1` to `1.0.0-beta.1` |
| `src/components/PWAUpdatePrompt.tsx` | Reposition to top, update styling, add translations |
| `src/utils/translations.ts` | Add translation keys for update banner |
| `src/App.tsx` | Move `<PWAUpdatePrompt />` position if needed |

### Files to Create

| File | Purpose |
|------|---------|
| `tests/unit/components/PWAUpdatePrompt.test.tsx` | Unit tests for update banner |

### Implementation Notes

1. **Banner Positioning**:
   ```tsx
   // Change from fixed bottom-4 to fixed top-0 (or below TopHeader)
   className="fixed top-16 left-0 right-0 z-50 px-4"
   ```

2. **Session Dismiss Logic**:
   ```typescript
   const DISMISS_KEY = 'pwa-update-dismissed-session';

   // On dismiss
   sessionStorage.setItem(DISMISS_KEY, 'true');

   // Check on render
   const wasDismissed = sessionStorage.getItem(DISMISS_KEY) === 'true';
   ```

3. **Translation Keys**:
   ```typescript
   // In translations.ts
   updateAvailableTitle: "Update Available",
   updateAvailableMessage: "There is an update available. Do you want to update?",
   updateNow: "Update",
   updateLater: "Later",

   // Spanish
   updateAvailableTitle: "Actualización Disponible",
   updateAvailableMessage: "Hay una actualización disponible. ¿Quieres actualizar?",
   updateNow: "Actualizar",
   updateLater: "Después",
   ```

### UI Mockup (Concept)

```
┌─────────────────────────────────────────────────────┐
│ [TopHeader - Gastify logo, profile avatar]          │
├─────────────────────────────────────────────────────┤
│ 🔄 Hay una actualización disponible.               │
│    ¿Quieres actualizar?                             │
│                           [Actualizar] [Después]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│            [Normal app content below]               │
│                                                     │
```

## Dependencies

- None - uses existing `usePWAUpdate` hook and PWA infrastructure

## Out of Scope

- Automatic background updates without user consent
- Version changelog display (future epic)
- Force update for critical security patches (future consideration)

## Testing Strategy

### Unit Tests
- Banner renders when `needRefresh` is true
- Banner does not render when `needRefresh` is false
- Update button calls `update()` function
- Dismiss button calls `close()` and sets sessionStorage
- Banner respects sessionStorage dismiss flag

### Manual Testing
1. Deploy to staging with incremented version
2. Open app, verify no banner initially
3. Deploy again with new version
4. Refresh app, verify banner appears at top
5. Click "Dismiss", verify banner closes
6. Refresh, verify banner reappears (new session)
7. Click "Update", verify app reloads with new version

## Story Points Rationale

**3 points** - Straightforward UI change:
- Repositioning existing component
- Adding translation strings
- Session storage for dismiss
- Unit tests

---

## Changelog

| Date | Author | Change |
|------|--------|--------|
| 2026-01-13 | Atlas | Created story for Epic 14 completion |
