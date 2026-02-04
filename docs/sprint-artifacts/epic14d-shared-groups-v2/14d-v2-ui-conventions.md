# Epic 14d-v2 UI Conventions & Standards

> **Purpose:** Ensure consistent theming, translations, styling, and accessibility across all Shared Groups UI components.
> **Created:** 2026-02-02
> **Status:** Active - All UI stories MUST follow these conventions

## Quick Reference

All UI stories in Epic 14d-v2 MUST:

1. Use CSS custom properties for ALL colors (no hardcoded values except `#ef4444` for errors)
2. Add ALL user-facing text to `src/utils/translations.ts` (English + Spanish)
3. Support all 3 color themes (mono, normal, professional) + dark mode
4. Include `data-testid` attributes on all interactive elements
5. Follow accessibility requirements (aria attributes, keyboard nav, focus management)
6. Use Lucide React icons only (`lucide-react` package)
7. Follow existing component patterns from `CreateGroupDialog.tsx`
8. **[FSD] Place components in `src/features/shared-groups/components/`** (NOT `src/components/SharedGroups/`)
9. **[Zustand] Use Zustand store pattern for state management** (NOT useState calls)

---

## 0. Architecture Compliance (CRITICAL)

> **Added 2026-02-03:** Tech debt stories TD-14d-1 and TD-14d-2 were created because earlier stories did not follow these patterns. Future stories MUST comply.

### Component File Locations (FSD)

Per `04-architecture.md`, all shared-groups components MUST be placed in the feature module:

| Component Type | CORRECT Location | WRONG Location |
|---------------|-----------------|----------------|
| Dialogs | `src/features/shared-groups/components/MyDialog.tsx` | ~~`src/components/SharedGroups/MyDialog.tsx`~~ |
| Views | `src/features/shared-groups/components/MyView.tsx` | ~~`src/components/SharedGroups/MyView.tsx`~~ |
| Toggles | `src/features/shared-groups/components/MyToggle.tsx` | ~~`src/components/SharedGroups/MyToggle.tsx`~~ |

**Barrel exports:**
```typescript
// src/features/shared-groups/components/index.ts
export { MyDialog } from './MyDialog';

// src/features/shared-groups/index.ts
export { MyDialog } from './components';
```

**Consumer imports:**
```typescript
// ✅ CORRECT
import { MyDialog } from '@/features/shared-groups';

// ❌ WRONG
import { MyDialog } from '@/components/SharedGroups';
```

### State Management (Zustand)

Per `04-architecture.md`, all state management MUST use Zustand with devtools:

| Pattern | CORRECT | WRONG |
|---------|---------|-------|
| Dialog state | `useDialogStore` (Zustand) | ~~Multiple useState calls~~ |
| Feature state | `useFeatureStore` (Zustand) | ~~useState + useReducer~~ |

**Zustand store pattern:**
```typescript
// src/features/shared-groups/store/useMyStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const useMyStore = create<State & Actions>()(
  devtools(
    (set) => ({
      isOpen: false,
      openDialog: () => set({ isOpen: true }, false, 'dialog/open'),
      closeDialog: () => set({ isOpen: false }, false, 'dialog/close'),
    }),
    { name: 'my-store', enabled: import.meta.env.DEV }
  )
);
```

### Architectural Compliance Acceptance Criteria

Every UI story MUST include these ACs:

```markdown
**AC-FSD:** Components are placed in `src/features/shared-groups/components/` and exported via feature barrel
**AC-Zustand:** New state management uses Zustand store pattern with devtools (no useState for dialog/feature state)
```

---

## 1. Color System - CSS Custom Properties

### REQUIRED: Use These Variables

```css
/* Backgrounds */
--bg              /* Main background */
--bg-secondary    /* Cards, inputs, secondary surfaces */
--bg-tertiary     /* Icon containers, chips, subtle backgrounds */
--surface         /* Modal/dialog surfaces */

/* Text Colors */
--text-primary    /* Main text (headings, body) */
--text-secondary  /* Secondary/muted text */
--text-tertiary   /* Disabled, hints, placeholders */

/* Primary Brand Color */
--primary         /* Buttons, links, active states */
--primary-hover   /* Hover state for primary */
--primary-light   /* Light tint (backgrounds with primary) */

/* Borders */
--border-light    /* Subtle borders (inputs, cards) */
--border-medium   /* Medium emphasis borders */

/* Semantic Colors */
--success         /* Success states */
--warning         /* Warning states */
--error           /* Error states - OR use #ef4444 */
```

### Theme Compatibility

The app has 3 color themes that users can select:
- **mono** (default) - Zinc grays, minimal color
- **normal** - Warm palette with forest greens and creams
- **professional** - Cool blue corporate look

**Plus dark mode** via `.dark` class.

### FORBIDDEN

```tsx
// ❌ NEVER hardcode colors (except #ef4444 for errors)
backgroundColor: '#10b981'
color: 'rgb(100, 100, 100)'
borderColor: 'gray'

// ✅ ALWAYS use CSS variables
backgroundColor: 'var(--primary)'
color: 'var(--text-secondary)'
borderColor: 'var(--border-light)'
```

---

## 2. Translation System

### File Location
`src/utils/translations.ts`

### Structure
```typescript
export const TRANSLATIONS = {
    en: {
        // English translations
        myKey: "English text",
        myKeyWithParam: "Hello {name}!",
    },
    es: {
        // Spanish translations (REQUIRED for all keys)
        myKey: "Texto en español",
        myKeyWithParam: "¡Hola {name}!",
    }
}
```

### Usage in Components
```tsx
interface MyComponentProps {
    t: (key: string, params?: Record<string, string | number>) => string;
    lang?: 'en' | 'es';
}

function MyComponent({ t, lang }: MyComponentProps) {
    // Always provide fallback text
    const texts = {
        title: t('myKey') || (lang === 'es' ? 'Texto predeterminado' : 'Default text'),
        greeting: t('myKeyWithParam', { name: 'User' }),
    };

    return <h1>{texts.title}</h1>;
}
```

### Existing Shared Groups Keys

Already defined (use these, don't duplicate):
- `sharedGroups`, `sharedGroupsDescription`
- `createGroup`, `groupName`, `groupNamePlaceholder`
- `transactionSharing`, `transactionSharingDescription`
- `create`, `creating`, `cancel`, `close`
- `discardGroupCreation`, `discardGroupBody`, `keepEditing`, `discard`
- `groupLimitReached`, `groupLimitTooltip`
- `deleteGroupTitle`, `deleteGroupWarning`
- `leaveGroupTitle`, `leaveGroupWarning`

### Keys Needed for Upcoming Stories

| Story | Keys to Add |
|-------|-------------|
| 14d-v2-1-5c | `inviteMembers`, `inviteMembersDescription`, `emailAddress`, `sendInvitation`, `copyInviteLink`, `linkCopied`, `invitationSent` |
| 14d-v2-1-6c-1 | `pendingInvitations`, `noPendingInvitations`, `invitedBy`, `expiresIn` |
| 14d-v2-1-6c-2 | `acceptInvitation`, `declineInvitation`, `joinGroup`, `invitedToJoin` |
| 14d-v2-1-6d | `shareMyTransactions`, `shareMyTransactionsDescription`, `optInRequired`, `privacyNote` |
| 14d-v2-1-7d | `leaveGroup`, `transferOwnership`, `selectNewOwner`, `confirmLeave`, `confirmTransfer` |
| 14d-v2-1-7e | `deleteGroup`, `deleteGroupPermanent`, `typeGroupNameToConfirm`, `cannotBeUndone` |
| 14d-v2-1-10b/c | `viewingPersonal`, `viewingGroup`, `switchToPersonal`, `switchToGroup` |
| 14d-v2-1-11c/12c | `transactionSharingEnabled`, `transactionSharingDisabled`, `cooldownActive`, `toggleLimitReached` |
| 14d-v2-1-14a | `joinGroupOptIn`, `shareTransactionsQuestion`, `optInLater`, `optInNow` |

---

## 3. Component Patterns

### Dialog/Modal Template

```tsx
import { X } from 'lucide-react';

function MyDialog({ isOpen, onClose, t, lang }: Props) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            data-testid="my-dialog"
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50"
                aria-hidden="true"
                onClick={onClose}
                data-testid="my-dialog-backdrop"
            />

            {/* Content */}
            <div
                className="relative z-10 w-full max-w-sm mx-4 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl shadow-xl"
                style={{ backgroundColor: 'var(--surface)' }}
            >
                {/* Header with close button */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-light)' }}>
                    <h2 id="dialog-title" className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {texts.title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-colors"
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}
                        aria-label={texts.close}
                        data-testid="my-dialog-close-btn"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4">
                    {/* Content here */}
                </div>

                {/* Footer with actions */}
                <div className="p-4 border-t flex gap-3" style={{ borderColor: 'var(--border-light)' }}>
                    <button
                        className="flex-1 py-3 px-4 rounded-xl border text-sm font-medium"
                        style={{
                            borderColor: 'var(--border-light)',
                            color: 'var(--text-primary)',
                            backgroundColor: 'var(--bg-secondary)',
                        }}
                        onClick={onClose}
                        data-testid="my-dialog-cancel-btn"
                    >
                        {texts.cancel}
                    </button>
                    <button
                        className="flex-1 py-3 px-4 rounded-xl text-white text-sm font-medium"
                        style={{ backgroundColor: 'var(--primary)' }}
                        data-testid="my-dialog-confirm-btn"
                    >
                        {texts.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
}
```

### Form Input Template

```tsx
<div className="space-y-2">
    <label
        htmlFor="input-id"
        className="block text-sm font-medium"
        style={{ color: 'var(--text-primary)' }}
    >
        {texts.label}
    </label>
    <input
        id="input-id"
        type="text"
        className="w-full px-4 py-3 rounded-xl border text-sm transition-colors"
        style={{
            backgroundColor: 'var(--bg-secondary)',
            borderColor: hasError ? '#ef4444' : 'var(--border-light)',
            color: 'var(--text-primary)',
        }}
        placeholder={texts.placeholder}
        data-testid="my-input"
    />
    {hasError && (
        <p className="text-xs" style={{ color: '#ef4444' }}>
            {texts.errorMessage}
        </p>
    )}
</div>
```

### Toggle Switch Template

```tsx
<button
    role="switch"
    aria-checked={isEnabled}
    onClick={() => setIsEnabled(!isEnabled)}
    className="relative w-12 h-7 rounded-full transition-colors disabled:opacity-50"
    style={{
        backgroundColor: isEnabled ? 'var(--primary)' : 'var(--border-light)',
    }}
    disabled={isDisabled}
    data-testid="my-toggle"
>
    <span
        className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
        style={{ left: isEnabled ? '26px' : '4px' }}
    />
</button>
```

### Button Variants

```tsx
// Primary Action
<button
    className="py-3 px-4 rounded-xl text-white text-sm font-medium shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    style={{ backgroundColor: 'var(--primary)' }}
>
    <Plus size={16} />
    {texts.create}
</button>

// Secondary Action
<button
    className="py-3 px-4 rounded-xl border text-sm font-medium transition-colors"
    style={{
        borderColor: 'var(--border-light)',
        color: 'var(--text-primary)',
        backgroundColor: 'var(--bg-secondary)',
    }}
>
    {texts.cancel}
</button>

// Destructive Action
<button
    className="py-3 px-4 rounded-xl text-white text-sm font-medium"
    style={{ backgroundColor: '#ef4444' }}
>
    {texts.delete}
</button>
```

---

## 4. Icons

### Library
Use **Lucide React** exclusively: `lucide-react`

### Common Icons for Shared Groups

```tsx
import {
    X,              // Close
    Plus,           // Add/Create
    Users,          // Group/Members
    UserPlus,       // Invite
    UserMinus,      // Remove member
    Edit3,          // Edit
    Trash2,         // Delete
    Check,          // Confirm/Success
    AlertTriangle,  // Warning
    Info,           // Information
    Loader2,        // Loading spinner (use with animate-spin)
    Copy,           // Copy to clipboard
    Link,           // Share link
    LogOut,         // Leave group
    Crown,          // Owner indicator
    Eye,            // View/Visible
    EyeOff,         // Hidden
    RefreshCw,      // Sync/Refresh
    ChevronRight,   // Navigate
    ChevronDown,    // Expand
} from 'lucide-react';
```

### Icon Sizes
- Small (badges, inline): `size={14}` or `size={16}`
- Medium (buttons, cards): `size={18}` or `size={20}`
- Large (empty states, dialogs): `size={24}` or larger

---

## 5. Accessibility Requirements

### ARIA Attributes

```tsx
// Dialogs
role="dialog"
aria-modal="true"
aria-labelledby="dialog-title-id"

// Buttons with icons only
aria-label="Close dialog"

// Toggle switches
role="switch"
aria-checked={isEnabled}

// Loading states
aria-busy="true"
aria-live="polite"
```

### Keyboard Navigation

- **Escape** key must close dialogs
- **Tab** key must cycle through focusable elements
- Focus should be trapped inside open dialogs
- First focusable element should receive focus when dialog opens

### Focus Management

```tsx
// Auto-focus first input on dialog open
useEffect(() => {
    if (isOpen && inputRef.current) {
        inputRef.current.focus();
    }
}, [isOpen]);

// Trap focus in dialog
// Consider using @headlessui/react Dialog component
```

---

## 6. Test ID Conventions

### Naming Pattern
`{component-name}-{element-type}`

### Examples

```tsx
// Dialogs
data-testid="invite-members-dialog"
data-testid="invite-members-dialog-backdrop"
data-testid="invite-members-dialog-close-btn"

// Inputs
data-testid="email-input"
data-testid="group-name-input"

// Buttons
data-testid="send-invitation-btn"
data-testid="cancel-btn"
data-testid="confirm-btn"

// Lists
data-testid="pending-invitations-list"
data-testid={`invitation-item-${invitation.id}`}

// Toggles
data-testid="transaction-sharing-toggle"
data-testid="user-sharing-preference-toggle"

// Views/Sections
data-testid="grupos-view"
data-testid="grupos-empty-state"
```

---

## 7. Loading & Error States

### Loading Spinner

```tsx
import { Loader2 } from 'lucide-react';

// Inline loading
<Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--primary)' }} />

// Button loading state
<button disabled={isLoading}>
    {isLoading ? (
        <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {texts.loading}
        </>
    ) : (
        texts.submit
    )}
</button>
```

### Error Alert

```tsx
import { AlertTriangle } from 'lucide-react';

<div
    className="p-3 rounded-xl flex items-start gap-3"
    style={{
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
    }}
    role="alert"
>
    <AlertTriangle size={18} style={{ color: '#ef4444' }} className="flex-shrink-0 mt-0.5" />
    <p className="text-sm" style={{ color: '#ef4444' }}>
        {errorMessage}
    </p>
</div>
```

### Info/Warning Box

```tsx
import { Info } from 'lucide-react';

<div
    className="p-3 rounded-xl flex items-start gap-3"
    style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px solid var(--border-light)',
    }}
>
    <Info size={18} style={{ color: 'var(--text-secondary)' }} className="flex-shrink-0 mt-0.5" />
    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {infoMessage}
    </p>
</div>
```

---

## 8. Typography

### Font Sizes (Tailwind)
- `text-xs` - 12px (hints, badges)
- `text-sm` - 14px (body text, inputs)
- `text-base` - 16px (default)
- `text-lg` - 18px (subheadings)
- `text-xl` - 20px (headings)

### Font Weights
- `font-normal` - Regular text
- `font-medium` - Emphasis
- `font-semibold` - Subheadings
- `font-bold` - Headings

### Common Patterns

```tsx
// Dialog title
<h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>

// Section heading
<h3 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>

// Body text
<p className="text-sm" style={{ color: 'var(--text-secondary)' }}>

// Small hint
<span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
```

---

## 9. Emoji Display

For consistent emoji rendering across platforms:

```tsx
style={{
    fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Android Emoji", "EmojiSymbols", sans-serif',
}}
```

---

## 10. Reference Files

| Purpose | Path |
|---------|------|
| CSS Variables/Themes | `index.html` |
| Translations | `src/utils/translations.ts` |
| Theme Context | `src/contexts/ThemeContext.tsx` |
| Example Dialog | `src/components/SharedGroups/CreateGroupDialog.tsx` |
| Example View | `src/components/settings/subviews/GruposView.tsx` |
| Color Picker | `src/components/SharedGroups/ColorPicker.tsx` |
| Emoji Picker | `src/components/SharedGroups/EmojiPicker.tsx` |

---

## UI Checklist (Copy to Each Story)

Add this checklist to each UI story's Tasks section:

```markdown
- [ ] **Architecture Compliance** (Reference: 14d-v2-ui-conventions.md Section 0)
  - [ ] Components placed in `src/features/shared-groups/components/` (NOT src/components/SharedGroups/)
  - [ ] Components exported via feature barrel (`src/features/shared-groups/index.ts`)
  - [ ] New state management uses Zustand store with devtools (no useState for dialog/feature state)
  - [ ] Tests placed in `tests/unit/features/shared-groups/components/`

- [ ] **UI Standards Compliance** (Reference: 14d-v2-ui-conventions.md)
  - [ ] All colors use CSS custom properties (no hardcoded colors except #ef4444)
  - [ ] All user-facing text added to translations.ts (en + es)
  - [ ] Component tested with all 3 themes (mono, normal, professional)
  - [ ] Component tested in dark mode
  - [ ] All interactive elements have data-testid attributes
  - [ ] Accessibility: aria attributes, keyboard nav, focus management
  - [ ] Icons from lucide-react only
  - [ ] Follows existing component patterns (see CreateGroupDialog.tsx)
```
