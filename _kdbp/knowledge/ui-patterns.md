# UI Pattern Manifest

> **Source:** Codebase audit (2026-03-12)
> **Purpose:** Enforce UX consistency — new screens MUST reuse existing components and patterns
> **Usage:** Loaded by `kdbp-dev-story` (planner context) and `kdbp-code-review` (UI reviewer)

---

## Rule: No New Primitives

Before creating ANY new UI component, check if an existing one can be reused or extended.
If a new component is truly needed, it MUST follow the patterns documented here.

**Verification:** `grep -rn "import.*from" <new-file> | grep -v "shared\|components\|features"` — imports should reference existing shared/component paths.

---

## Theming: CSS Variables (MANDATORY)

All colors MUST use CSS custom properties. Never hardcode hex/rgb values.

| Token | Purpose | Light | Dark |
|-------|---------|-------|------|
| `--primary` | Brand / main actions | `#4a7c59` | inverted |
| `--secondary` | Supporting actions | `#5b8fa8` | inverted |
| `--accent` | Highlights | `#e8a87c` | inverted |
| `--success` / `--warning` / `--error` | Semantic feedback | green/amber/red | inverted |
| `--bg` | Page background | `#f5f0e8` (warm cream) | dark |
| `--surface` | Card/panel background | `#ffffff` | dark |
| `--bg-tertiary` | Subtle backgrounds (pills, chips) | `#f1dbb16` | dark |
| `--text-primary` | Main text | `#2d3a4a` | light |
| `--text-secondary` | Supporting text | `#4a5568` | light |
| `--border-light` / `--border-medium` | Borders | peach tones | dark |

**Source:** `index.html` (CSS variable definitions, 3 theme variants: normal, professional, mono)

**Application pattern:**
```tsx
// CORRECT: inline style with CSS variables
<div style={{ backgroundColor: 'var(--surface)', color: 'var(--text-primary)' }}>

// WRONG: hardcoded colors
<div style={{ backgroundColor: '#ffffff', color: '#2d3a4a' }}>
```

**Dark mode:** `.dark` class on root + CSS variable overrides. Every component MUST support both modes.

---

## Typography & Icons

| Element | Value |
|---------|-------|
| Font | Outfit (primary), Baloo 2 (wordmark only) |
| Icon library | **Lucide React** (0.460.0) — no other icon libraries |
| Icon usage | `<IconName size={16} strokeWidth={2} style={{color: 'var(--text-tertiary)'}} />` |
| Common icons | Check, X, AlertTriangle, Trash2, ChevronDown, Upload, Loader2, Camera, Zap |

---

## Layout Constraints

| Constraint | Value | Reason |
|------------|-------|--------|
| Max width | `max-w-md` (448px) | Mobile-first PWA |
| Main height | `h-screen h-[100dvh]` | Dynamic viewport (PWA) |
| Safe areas | `var(--safe-top/bottom/left/right)` | Notch + home indicator |
| Touch targets | **44px minimum** (`min-w-10 min-h-10`) | Accessibility |
| Content padding | `p-3` or `p-4` | Consistent spacing |

---

## Component Patterns (Reuse These)

### 1. Modals / Dialogs

**Primary pattern:** `ConfirmationDialog` (`src/components/shared/ConfirmationDialog.tsx`)
- Focus trap (Tab cycles within dialog)
- ESC key to cancel
- Body scroll lock
- Focus restoration on close
- Destructive variant (red button)
- `data-testid` attributes for E2E

**Opening modals:** Via `ModalManager` + Zustand store
```tsx
const { openModal } = useModalActions();
openModal('myModalType', { ...props });
```

**Backdrop pattern:**
```tsx
<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
<div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
```

**RULE:** All new modals MUST register in `ModalManager` modal registry.

### 2. Cards

**Transaction cards:** `TransactionCard` (`src/components/transactions/TransactionCard.tsx`)
- Category badge overlay, merchant name, amount, meta pills
- Expandable items section
- Selection mode with checkbox

**Card structure:**
```tsx
<div className="rounded-lg overflow-hidden border" style={{backgroundColor: 'var(--surface)'}}>
```

**Meta pill pattern:**
```tsx
<span className="inline-flex items-center gap-[3px] px-[6px] py-[3px] rounded-full text-xs"
      style={{backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)'}}>
```

### 3. Buttons

| Type | Classes |
|------|---------|
| Primary | `py-3 px-4 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors` |
| Secondary | `border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors` |
| Destructive | `bg-red-600 hover:bg-red-700 text-white` |
| Icon | `min-w-10 min-h-10 p-2 rounded-lg flex items-center justify-center` |

### 4. Forms

**Input pattern:**
```tsx
<div>
  <label className="block text-sm font-medium mb-2">Label</label>
  <input className="w-full px-3 py-2 rounded-lg border border-gray-300" />
</div>
```

**Searchable dropdown:** `CategoryCombobox` (`src/features/transaction-editor/components/CategoryCombobox.tsx`)
- Keyboard navigation (ArrowUp/Down, Enter, Escape)
- Click-outside to close

### 5. Progress / Loading

**Non-blocking overlay:** `ScanOverlay` (`src/features/scan/components/ScanOverlay.tsx`)
- Circular progress (SVG-based `CircularProgress`)
- Upload progress 0-100%
- State-driven: uploading → processing → ready → error

**Toast feedback:** `Toast` (`src/shared/ui/Toast.tsx`) via `useToast()`
- Types: success, info, error, warning
- Fixed bottom position with safe area

### 6. Animation Constants

**Source:** `src/components/animation/constants.ts`
```
DURATION.FAST: 150ms    — quick interactions
DURATION.NORMAL: 300ms  — standard transitions
DURATION.SLOW: 500ms    — complex animations
EASING.SPRING: cubic-bezier(0.34, 1.56, 0.64, 1)
```

---

## Accessibility Requirements

| Pattern | Implementation |
|---------|---------------|
| Dialog | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Live regions | `role="status"`, `aria-live="polite"` (or `"assertive"` for errors) |
| Icon buttons | `aria-label={description}` |
| Form inputs | `<label htmlFor>` + `id` on input |
| Focus management | Focus trap in modals, ESC closes, Enter/Space activates |

---

## i18n

- **Spanish primary, English secondary** — all strings via `src/utils/translations.ts`
- Never hardcode user-facing strings in JSX
- Pattern: `t('key')` from translation utility

---

## State Management

| Pattern | Tool |
|---------|------|
| Client state | Zustand stores |
| Server/Firestore | TanStack Query |
| Modals | `ModalManager` + Zustand |
| Settings | `useSettingsStore` (theme, font, language, currency) |

**RULE:** Never introduce new state management libraries (no Redux, no MobX, no Jotai).

---

## Checklist for UI Stories

Before marking a UI story as review-ready:
- [ ] Uses CSS variables for all colors (no hardcoded hex)
- [ ] Supports dark mode (test with `.dark` class)
- [ ] Touch targets ≥ 44px
- [ ] All strings via translations (ES + EN)
- [ ] Icons from Lucide React only
- [ ] Modals registered in ModalManager
- [ ] Accessibility: ARIA labels, focus management, keyboard navigation
- [ ] Reuses existing components (Toast, ConfirmationDialog, TransactionCard, CategoryCombobox)
- [ ] Follows `max-w-md` mobile-first layout
- [ ] Animation uses constants from `animation/constants.ts`
