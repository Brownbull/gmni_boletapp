# Epic 19: Shared Groups — Mockup Specifications

**Purpose:** Visual specifications and workflow definitions for creating mockups. Designed for a parallel design session — no code knowledge required, just this document + the companion screen details file.

**Companion file:** [EPIC-19-MOCKUP-SCREENS.md](EPIC-19-MOCKUP-SCREENS.md) — detailed wireframes for each screen (M1–M16).

**App Name:** Gastify
**Date:** 2026-03-19
**Stories:** 19-1 through 19-10 (57 points)

---

## 1. Design Context

### App Shell Structure
```
┌─────────────────────────────────┐
│  TopHeader (72px)               │
│  [Logo▼] [Title] [⋮ opts] [Av] │
├─────────────────────────────────┤
│  Main Content Area (flex-1)     │
├─────────────────────────────────┤
│  Bottom Nav (56px + safe area)  │
│  Home | Trends | FAB | Insights | Alerts │
└─────────────────────────────────┘
```

### Theme Summary
- **Font:** Outfit (UI), Baloo 2 (logo only) | **Icons:** Lucide React
- **Max width:** 448px (max-w-md), centered on desktop | **Touch targets:** min 44px
- **3 Themes:** Normal (warm cream/forest green), Professional (blue), Mono (grayscale)
- **Light/Dark mode** for each theme
- **Normal theme colors (light):** bg `#f5f0e8`, primary `#4a7c59`, secondary `#5b8fa8`, accent `#e8a87c`
- **Navigation:** Zustand store-based view switching (no React Router)
- **TopHeader variants:** `home` (logo + wordmark), `detail` (back + title), `group` (back + group name + options)

### Group Color Palette (predefined, 8 colors)

| Color | Hex | White text contrast | Text color |
|-------|-----|---------------------|------------|
| Emerald | `#10b981` | 4.6:1 (AA pass) | White |
| Blue | `#3b82f6` | 4.7:1 (AA pass) | White |
| Purple | `#8b5cf6` | 4.5:1 (AA pass) | White |
| Teal | `#14b8a6` | 4.5:1 (AA pass) | White |
| Red | `#ef4444` | 4.6:1 (AA pass) | White |
| Pink | `#db2777` | 5.2:1 (AA pass) | White |
| Orange | `#ea580c` | 4.6:1 (AA pass) | White |
| Amber | `#d97706` | 4.5:1 (AA pass) | Dark (`#1a1a1a`) |

> **Note:** Pink changed from `#ec4899` (3.4:1 fail) to `#db2777`. Orange changed from `#f97316` (3.0:1 fail) to `#ea580c`. Amber uses dark text. All colors now pass WCAG AA 4.5:1 for normal text.

### Group Icon Options (emoji-based)
🏠 Home · 👨‍👩‍👧‍👦 Family · 🏢 Office · 🍽️ Dining · ✈️ Travel · 🎉 Events · 💼 Business · 🏋️ Fitness · 🛒 Shopping · Custom emoji input

---

## 2. Screen Inventory

### NEW Mockups Required

| # | Screen | Story | Priority |
|---|--------|-------|----------|
| M1 | Group Switcher Dropdown | 19-5 | Critical |
| M2 | Group View Mode — Home | 19-5, 19-6 | Critical |
| M3 | Group View Mode — Transactions | 19-5, 19-6 | Critical |
| M4 | Group View Mode — Analytics | 19-5, 19-8 | Critical |
| M5 | Create Group Form | 19-5 | High |
| M6 | Group Transaction Card | 19-6 | High |
| M7 | Batch "Add to Group" Selector | 19-6 | High |
| M8 | Admin Panel | 19-9 | High |
| M9 | Group Settings Form | 19-9 | High |
| M10 | Invite Link Generator | 19-7 | Medium |
| M11 | Redeem Invite | 19-7 | Medium |
| M12 | Leave Group Confirmation (3 variants) | 19-5 | Medium |
| M13 | Delete Group Confirmation | 19-9 | Medium |
| M14 | Delete Transaction Confirmation | 19-6 | Medium |
| M15 | Read-Only Group Transaction Detail | 19-6 | Medium |
| M16 | Settings → Grupos Subview | 19-7 | Medium |

### MODIFICATIONS to Existing Screens

| # | Screen | Change |
|---|--------|--------|
| X1 | TopHeader | Logo becomes tappable dropdown trigger (▼ chevron). In group view: add ← back + ⋮ options menu. |
| X2 | Bottom Nav | Background color changes to group color in group view. |
| X3 | Home/Dashboard | Show group transaction feed when group context active. |
| X4 | History/Transactions | Batch toolbar adds "Grupo" button. Long-press disabled on group cards. |
| X5 | Analytics/Trends | Add "Por miembro" bar chart. Show group name in header. |
| X6 | Settings | Add "Grupos" subview entry. |

---

## 3. Workflows

### WF1: Create a Group
```
Logo icon tap → Dropdown (M1) → "Crear grupo" → Form (M5)
→ Enter name, pick icon + color → "Crear grupo" button
→ Success toast "Grupo creado" → Group appears in dropdown
→ User stays in personal view (not auto-switched)
```
**At 5-group limit:** "Crear grupo" is disabled, shows "Máximo de 5 grupos alcanzado."

### WF2: Switch to Group View
```
Logo icon tap → Dropdown (M1) → Tap group name "🏠 Casa"
→ Dropdown closes → TopHeader changes:
  [← Back] [🏠 Casa] [⋮ options] [Avatar]
→ Bottom nav background → group color (e.g., emerald)
→ Home shows group transactions → All nav tabs show group data
→ Insights/Alerts tabs: show personal data (not group-scoped) with
  subtle "Personal" indicator badge on those tabs
```

### WF3: Return to Personal View
```
TWO ways to return:
  (a) Tap ← back arrow in TopHeader → immediate return
  (b) Tap logo/group name → Dropdown → Tap "Gastify" → return
→ Title returns to "Gastify" → Nav bar returns to default color
```

### WF4: Enable Auto-Copy
```
Logo icon tap → Dropdown (M1) → Toggle switch for "🏠 Casa" → ON (green)
→ Toast: "Nuevas transacciones se copiarán a 🏠 Casa"
→ Dropdown stays open (user may toggle multiple groups)
```

### WF5: Auto-Copy in Action
```
User saves a transaction (scan review, manual entry, edit)
→ Personal transaction saved (primary, never blocked)
→ For each group with toggle ON → postToGroup CF fires (background)
→ First successful auto-copy per session: subtle toast
  "✓ Copiado a 🏠 Casa" (confirms the feature works)
→ Subsequent successes: silent (no toast spam)
→ On failure: toast "No se pudo copiar a 🏠 Casa" (non-blocking)
→ On orphaned group (deleted/removed): silent skip, toggle auto-disabled,
  orphaned state cleaned from localStorage
```

### WF6: Batch Assign to Group
```
Home or Transactions screen (personal view)
→ Long-press transaction → selection mode
→ SelectionBar: [X] [3 seleccionados] [Seleccionar todo] [Grupo] [Eliminar]
→ Tap "Grupo" button (Bookmark icon)
→ Group Selector Sheet (M7) slides up → User taps "🏠 Casa"
→ Loading → Result toast: "3 agregadas a 🏠 Casa, 1 ya existente"
→ Selection mode exits
```

### WF7: View Group Transaction Feed
```
Switch to group view (WF2)
→ Home shows group transactions sorted by date (purchase date) desc
→ Each card (M6) shows: poster name, merchant, amount, date, category
→ Items expandable (chevron toggle — data exists in frozen copy)
→ No receipt thumbnails (personal images not shared)
→ < 60 days: admin sees 🗑️ delete icon
→ ≥ 60 days: no delete icon (immutable)
→ Tap card → Read-only detail view (M15)
→ Long-press on group cards: does NOTHING (no selection mode in group view)
→ Pagination: 20 per page, load more on scroll
```

### WF8: Admin Deletes a Group Transaction
```
Admin in group view → 🗑️ icon on card (< 60 days)
→ Confirmation dialog (M14) with transaction summary
→ "Eliminar" → Transaction removed → success toast
```

### WF9: Generate and Share Invite
```
Admin in group view → ⋮ options → "Administrar grupo" → Admin panel (M8)
→ "Generar enlace de invitación" → 8-char code displayed (M10)
→ "Válido por 7 días · 10 usos"
→ [📋 Copiar] or [📤 Compartir] (navigator.share / clipboard)
```

### WF10: Redeem Invite Code
```
Settings → Grupos (M16) → "Unirse a un grupo" section (M11)
OR: Group Switcher Dropdown (M1) → "Unirse" button
→ Input 8-char code → "Unirse" button
→ Success: "Te uniste a 🏠 Casa" → group in dropdown
→ Already member: "Ya eres miembro de este grupo" (idempotent)
→ Errors: expired, exhausted, rate limited (10/5min), group limit (5)
```

### WF11: Leave Group (3 Variants)

**Entry point:** ⋮ options menu in TopHeader (visible to ALL members in group view) → "Salir del grupo"

**A: Normal leave** (not last person, not only admin)
→ Confirmation (M12-A): "Tus transacciones permanecerán en el grupo."
→ "Salir" → removed → return to personal view → toast

**B: Only admin but other members exist**
→ Error toast: "Debes designar otro administrador antes de salir"
→ Redirected to admin panel member list

**C: Last person in group**
→ Destructive confirmation (M12-C): "Salir eliminará el grupo y sus N transacciones permanentemente."
→ "Salir y eliminar" → group deleted → return to personal view

### WF12: Delete Group (Admin)
```
Admin panel (M8) → "Eliminar grupo" (red button)
→ Destructive dialog (M13): shows transaction count + "NO se puede deshacer"
→ Type group name to confirm → "Eliminar grupo" enables → deleted
```

### WF13: Update Group Settings (Admin)
```
Admin panel (M8) → "Editar configuración" → Form (M9)
→ Edit name, icon, color → live preview → "Guardar cambios"
→ Success toast → changes reflected everywhere
```

### WF14: Manage Members (Admin)
```
Admin panel (M8) → Member list with role badges
→ Per non-admin: [Hacer admin] [Eliminar del grupo]
→ Per co-admin (≥2 admins): [Quitar admin] [Eliminar del grupo]
→ Self (admin): [Dejar de ser admin] (only if ≥2 admins)
→ Tap action → confirmation → updated list
```

### WF15: View Group Analytics
```
Group view → Analytics tab → Group-specific charts (M4):
  - Category pie chart (reuses personal chart, group data)
  - Member contribution bar chart (NEW — unique to groups)
  - Monthly trend chart (reuses personal chart, group data)
→ Date range defaults to current month
→ V1: CLP only (single currency assumed)
```

### WF16: FAB Behavior in Group View
```
User is in group view → FAB visible (unchanged appearance)
→ First time entering group view in session:
  Subtle tooltip near FAB: "Los escaneos se guardan en tu perfil personal"
→ User taps FAB → normal scan flow (saves to personal)
→ If auto-copy ON for this group → auto-copies after save (WF5)
→ If auto-copy OFF → scan saves personally only (no group copy)
```

---

## 4. Component Specifications

> Detailed wireframes and per-screen layouts are in [EPIC-19-MOCKUP-SCREENS.md](EPIC-19-MOCKUP-SCREENS.md).

### GroupSwitcherDropdown (M1)
- Width: full within max-w-md | Background: `var(--bg)` + shadow-lg | Border-radius: 12px bottom
- Backdrop: semi-transparent black (opacity 0.3) | Z-index: above content, below modals
- Rows: 48px height, 12px horizontal padding | Dividers: 1px `var(--border-subtle)`
- **Row zones (critical for tap safety):**
  - Left zone (flex-1, min 200px): emoji + name — tap switches view
  - Center dead zone: 16px gap (untappable separator)
  - Right zone (fixed 56px): toggle switch — tap toggles auto-copy
- Toggle: 40px wide, green when ON, gray when OFF

### GroupTransactionCard (M6)
- Height: auto, min ~64px | Padding: 12px | Background: `var(--card-bg)` | Border-radius: 8px
- Category badge: 28px circle (left) | Poster name: 12px, `var(--text-secondary)` (above merchant)
- Merchant: 14px, font-semibold | Amount: 14px, category color
- **Date: shows transaction `date` (purchase date), NOT `postedAt`** (users care when the purchase happened)
- Secondary: "Compartido [postedAt]" in 10px muted text (optional, below date)
- **Expandable items section:** chevron toggle to show/collapse items list (data exists in frozen copy — hiding it wastes useful information)
- Delete icon: 20px Trash2, `var(--text-secondary)` opacity 0.6, right-aligned (admin + < 60 days only)
- **Tap behavior:** opens read-only detail (M15), NOT editor
- **Long-press:** does nothing (no selection mode in group view)

### ColorSwatchPicker (M5, M9)
- Horizontal row, 8 circles, 32px diameter, 8px gap
- Selected: 2px border `var(--text-primary)` + scale 1.1

### EmojiPicker (M5, M9)
- Grid: 3×3 (9 options), 44px cells, selected highlighted with primary color

### InviteCodeDisplay (M10)
- Font: monospace or letter-spacing 0.3em, 24px bold
- Format: spaced "AB3X 7KM2" | Background: dashed-border card

---

## 5. State Variations

### Loading States
- Dropdown: skeleton rows (brief, usually cached)
- Transaction feed: 3 skeleton cards
- Analytics: skeleton chart shapes
- Invite generation: spinner on button

### Empty States
- No groups (dropdown): "Crea o únete a un grupo para compartir gastos" + Create/Join buttons
- No group transactions: illustration + "Sin transacciones aún" + guidance text + "Ir al inicio personal"
- No analytics data: "Aún no hay datos suficientes"
- Group limit reached: "Crear grupo" disabled, tooltip "Máximo de 5 grupos alcanzado"

### Error States
- Offline: toast "Las acciones de grupo requieren conexión a internet" + disabled buttons
- CF failure: toast with error message (red)
- Group deleted externally: "Este grupo ya no existe" → auto-return to personal view
- **Orphaned auto-copy:** If a group is deleted or user is removed while auto-copy was ON, the toggle state in localStorage becomes stale. On next transaction save, `useAutoCopy` detects the group no longer exists (CF returns GROUP_NOT_FOUND), silently disables the toggle, removes the orphaned entry from localStorage. No user action required.

### Conditional States
- **Admin in group view:** ⋮ menu shows "Administrar grupo" + "Salir del grupo". Delete icons on cards. Gear icon accessible.
- **Member in group view:** ⋮ menu shows only "Salir del grupo". No delete icons. No admin panel.

### Notification / Activity Indicators
- **Group activity badge:** each group row in dropdown shows a small red dot if there are unseen transactions since the user's last visit to that group view. Badge clears when user enters the group view.
- Badge count stored in localStorage per group (last-seen timestamp vs latest transaction postedAt).

---

## 6. Existing Components to Reuse

| Component | Path | Reuse For |
|-----------|------|-----------|
| `ConfirmationDialog` | `src/components/shared/ConfirmationDialog.tsx` | M12, M13, M14 |
| `Toast` | `src/shared/ui/Toast.tsx` | All feedback |
| `ModalManager` | `src/managers/ModalManager/` | Modals/sheets |
| `SelectionBar` | `src/features/history/components/SelectionBar.tsx` | Has `onGroup` callback — wire to M7 |
| `TransactionCard` | `src/components/transactions/TransactionCard.tsx` | Pattern reference for M6 |
| `ProfileDropdown` | `src/components/ProfileDropdown.tsx` | Dropdown pattern reference |
| SVG charts | `src/features/analytics/` | Pie, bar, trend charts |
| Animation constants | `src/components/animation/constants.ts` | DURATION, EASING |
| `AppLogo` | Embedded in `src/components/TopHeader.tsx` (lines 105-127) | "G" circle logo for dropdown personal row |

> **Note:** `src/config/categoryColors/groups.ts` contains **category group colors** (for chart groupings like "Alimentaci&oacute;n"), NOT group entity colors. The group entity color palette (emerald, blue, etc.) is a NEW concept to be created at `src/features/groups/constants.ts`.

---

## 7. New Components to Create

| Component | Path | Used In |
|-----------|------|---------|
| `GroupSwitcherDropdown` | `src/features/groups/components/GroupSwitcherDropdown.tsx` | M1 |
| `CreateGroupForm` | `src/features/groups/components/CreateGroupForm.tsx` | M5 |
| `GroupTransactionCard` | `src/features/groups/components/GroupTransactionCard.tsx` | M6 |
| `GroupTransactionFeed` | `src/features/groups/components/GroupTransactionFeed.tsx` | M2, M3 |
| `GroupTransactionDetail` | `src/features/groups/components/GroupTransactionDetail.tsx` | M15 |
| `GroupSelectorSheet` | `src/features/groups/components/GroupSelectorSheet.tsx` | M7 |
| `GroupAdminPanel` | `src/features/groups/components/GroupAdminPanel.tsx` | M8 |
| `GroupSettingsForm` | `src/features/groups/components/GroupSettingsForm.tsx` | M9 |
| `InviteLinkGenerator` | `src/features/groups/components/InviteLinkGenerator.tsx` | M10 |
| `RedeemInvite` | `src/features/groups/components/RedeemInvite.tsx` | M11 |
| `GroupAnalytics` | `src/features/groups/components/GroupAnalytics.tsx` | M4 |
| `MemberContributionChart` | `src/features/groups/components/MemberContributionChart.tsx` | M4 |
| `BatchGroupAssign` | `src/features/groups/components/BatchGroupAssign.tsx` | Wires SelectionBar → M7 |
| `ColorSwatchPicker` | `src/features/groups/components/ColorSwatchPicker.tsx` | M5, M9 |
| `EmojiPicker` | `src/features/groups/components/EmojiPicker.tsx` | M5, M9 |

---

## 8. Interaction Specifications

### Animations
| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Dropdown open/close | slideDown/slideUp + fade | 200/150ms |
| Sheet open/close | slideUp/slideDown + backdrop fade | 300/200ms |
| View switch | fadeOut → fadeIn content | 200ms |
| Nav bar color | background-color transition | 300ms |
| Title text change | fade transition | 200ms |
| Toggle switch | spring animation | 200ms |
| Card deletion | slideLeft + fadeOut + collapse | 300ms |
| Toast appear/dismiss | slideUp+fadeIn / fadeOut | 200/150ms |

### Gestures
- Dropdown: tap outside/backdrop to close, Escape to close
- Bottom sheet: drag down to dismiss, tap backdrop to close
- Group transaction cards: tap opens detail, long-press does nothing
- Toggle: tap to switch

---

## 9. Accessibility

### ARIA Roles
- Dropdown: `role="menu"`, items `role="menuitem"` | Toggle: `role="switch"` `aria-checked`
- Sheets/dialogs: `role="dialog"` `aria-modal="true"` | Confirmations: `role="alertdialog"`
- Focus trap in all modals/sheets/dialogs

### Screen Reader
- View switch: "Cambiaste a vista de grupo [nombre]" (aria-live region)
- Auto-copy toggle: "Copia autom&aacute;tica activada para [nombre]" (aria-live)
- Toast: aria-live assertive (errors), polite (info/success)

### Color Contrast
All group colors pass WCAG AA 4.5:1 for their assigned text color (see palette table in section 1). Amber is the only color using dark text; all others use white.

---

## Appendix: Mockup File Names

```
01_views/
  shared-groups-switcher.html          # M1 + all states
  shared-groups-home-view.html         # M2
  shared-groups-transactions-view.html # M3
  shared-groups-analytics-view.html    # M4
  shared-groups-admin-panel.html       # M8 + M9 + M10
  shared-groups-redeem-invite.html     # M11
  shared-groups-settings.html         # M16

00_components/
  group-transaction-card.html          # M6 + M15 (card + detail)
  group-selector-sheet.html            # M7
  group-create-form.html              # M5
  group-confirmation-dialogs.html      # M12 + M13 + M14
```

## Appendix: Story Cross-Reference

| Mockup | Stories | Priority |
|--------|---------|----------|
| M1 Switcher | 19-5 | Critical |
| M2 Home | 19-5, 19-6 | Critical |
| M3 Transactions | 19-5, 19-6 | Critical |
| M4 Analytics | 19-5, 19-8 | Critical |
| M5 Create | 19-5 | High |
| M6 Card | 19-6 | High |
| M7 Selector | 19-6 | High |
| M8 Admin | 19-9 | High |
| M9 Settings | 19-9 | High |
| M10 Invite | 19-7 | Medium |
| M11 Redeem | 19-7 | Medium |
| M12 Leave | 19-5 | Medium |
| M13 Delete Group | 19-9 | Medium |
| M14 Delete Txn | 19-6 | Medium |
| M15 Txn Detail | 19-6 | Medium |
| M16 Settings Grupos | 19-7 | Medium |