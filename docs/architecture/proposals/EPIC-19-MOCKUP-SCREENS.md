# Epic 19: Shared Groups — Screen Specifications

**Companion to:** [EPIC-19-MOCKUP-SPECS.md](EPIC-19-MOCKUP-SPECS.md) (workflows, component specs, state variations, accessibility)

---

## M1: Group Switcher Dropdown

**Trigger:** Tap logo icon (AppLogo "G" circle) in TopHeader
**Position:** Below TopHeader, full width within max-w-md, overlaying content
**Animation:** slideDown + fadeIn (200ms) | Close: slideUp + fadeOut (150ms)

```
┌─────────────────────────────────┐
│  TopHeader (logo tapped ▼)      │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [G] Gastify        ← active │ │  ← AppLogo "G" circle + name (NO emoji)
│ ├─────────────────────────────┤ │     Highlighted = currently in personal view
│ │ 🏠 Casa    [16px] [toggle] │ │  ← Name zone | dead zone | auto-copy toggle
│ │                         🔴  │ │  ← Red dot = unseen activity badge
│ ├─────────────────────────────┤ │
│ │ 👨‍👩‍👧 Familia  [16px] [toggle] │ │
│ ├─────────────────────────────┤ │
│ │ 🏢 Oficina  [16px] [toggle] │ │
│ ├─────────────────────────────┤ │
│ │ + Crear grupo               │ │  ← Disabled + tooltip at 5 group limit
│ │ 🔖 Unirse                   │ │  ← Opens M11 redeem flow (hidden at 5 limit)
│ └─────────────────────────────┘ │
│  ░░ semi-transparent backdrop ░░ │
└─────────────────────────────────┘
```

**Row tap zones (critical for mobile — see SPECS section 4):**
- Left zone (flex-1, min 200px): emoji + name → tap switches to group view + closes dropdown
- Center dead zone (16px): untappable gap prevents accidental mis-taps
- Right zone (fixed 56px): toggle switch → tap toggles auto-copy, dropdown stays open

**Personal row ("Gastify"):** Uses AppLogo "G" circle (32px, same component as TopHeader), NOT a food emoji. Font-semibold. No toggle.

**Empty state (no groups):** Show "Gastify" row + both buttons + helper text: "Crea o únete a un grupo para compartir gastos"

**Activity badge:** Small red dot on group rows with unseen transactions since last visit. Clears when user enters that group view.

---

## M2: Group View Mode — Home

**TopHeader in group view (new `group` variant):**
```
┌─────────────────────────────────┐
│ [← Back] [🏠 Casa]  [⋮ opts] [Av]│
└─────────────────────────────────┘
```
- **← Back:** returns to personal view immediately (no dropdown needed)
- **🏠 Casa:** group icon + name as title. Tapping opens dropdown (M1).
- **⋮ options menu:** visible to ALL members (not just admin):
  - Admin sees: "Administrar grupo" (→ M8) + "Salir del grupo" (→ M12)
  - Member sees: "Salir del grupo" (→ M12)
- **[Av]:** Avatar (same as personal view)

**Content area:**
```
┌─────────────────────────────────┐
│ [← Back] [🏠 Casa]  [⋮] [Av]  │
├─────────────────────────────────┤
│                                 │
│  Transacciones del grupo        │
│                                 │
│  ┌─ GroupTransactionCard ─────┐ │
│  │ [Cat]  Sofia                │ │  ← Category badge + poster name (12px muted)
│  │        Lider Express        │ │  ← Merchant (14px bold)
│  │        $62,000      [▼][🗑️]│ │  ← Amount + expand + delete (admin <60d)
│  │        15 mar 2026          │ │  ← Transaction DATE (not postedAt)
│  │        Compartido 15 mar    │ │  ← postedAt as secondary (10px muted)
│  ├─ items (expanded) ─────────┤ │
│  │  Leche     $2,500           │ │  ← Expandable items section
│  │  Pan       $1,800           │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ GroupTransactionCard ─────┐ │
│  │ [Cat]  Matias               │ │
│  │        Homecenter           │ │
│  │        $15,000      [▼]    │ │  ← No 🗑️ (non-admin or ≥60d)
│  │        14 mar 2026          │ │
│  └────────────────────────────┘ │
│                                 │
│  (load more on scroll, 20/page) │
│                                 │
├─────────────────────────────────┤
│ Home│Trend│ FAB │Insig│Alert  │  ← GROUP COLOR background
└─────────────────────────────────┘
```

**FAB tooltip (first time in group view per session):**
Subtle floating tooltip near FAB: "Los escaneos se guardan en tu perfil personal" — dismisses on tap or after 5s.

**Insights/Alerts tabs in group view:**
- Insights: shows personal insights (not group-scoped). Subtle "Personal" pill badge on tab icon.
- Alerts: shows personal alerts. Subtle "Personal" pill badge on tab icon.
- Rationale: group insights are deferred. Personal alerts are always relevant.

**Empty state (new group, no transactions):**
```
  ┌─────────────────────────────┐
  │        📌                    │
  │  Sin transacciones aún      │
  │                             │
  │  Activa la copia automática │
  │  o agrega transacciones     │
  │  desde la selección por     │
  │  lotes en tu inicio.        │
  │                             │
  │  [← Ir al inicio personal] │
  └─────────────────────────────┘
```

---

## M3: Group View Mode — Transactions / History

Same TopHeader + nav bar as M2. Full transaction list with pagination.

**Key differences from personal History:**
- Uses GroupTransactionCard (M6), not personal TransactionCard
- Read-only cards — tap opens M15 (read-only detail), NOT editor
- Admin sees 🗑️ on < 60-day transactions
- Sort by transaction `date` descending (purchase date, not postedAt)
- Poster name visible on each card
- **Long-press does nothing** — no selection mode on group cards
- **No batch toolbar** — batch operations are for personal transactions only
- Items expandable via chevron (same as M2 cards)

---

## M4: Group View Mode — Analytics

```
┌─────────────────────────────────┐
│ [← Back] [🏠 Casa]  [⋮] [Av]  │
├─────────────────────────────────┤
│                                 │
│  [◀ Marzo 2026 ▶]              │  ← Month selector (same as personal)
│                                 │
│  ┌─ Por categoría ───────────┐ │
│  │  [Pie chart]               │ │  ← Reuses existing pie chart component
│  │  🛒 Supermercado  73%     │ │
│  │  🧹 Limpieza     18%     │ │
│  │  💊 Farmacia      9%     │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Por miembro ─────────────┐ │  ← NEW: unique to group analytics
│  │  [Horizontal bar chart]    │ │
│  │  Sofia      ████████ 73%  │ │  ← Sorted by contribution desc
│  │  Matias     ███      18%  │ │  ← Bar color = group color
│  │  Valentina  █         9%  │ │  ← Name from postedByName field
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Tendencia mensual ───────┐ │
│  │  [Line/bar chart]         │ │  ← Reuses existing trend component
│  │  Ene  Feb  Mar            │ │
│  └────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ Home│Trend│ FAB │Insig│Alert  │
└─────────────────────────────────┘
```

**"Por miembro" bar chart specs:**
- Horizontal bars, sorted by contribution descending
- Bar color: group's color (e.g., emerald for 🏠 Casa)
- Shows all members who posted ≥ 1 transaction in the selected period
- Empty: "No hay datos para este período"
- V1 assumes single currency (CLP)

---

## M5: Create Group Form

**Type:** Bottom sheet (preferred) or modal | **Trigger:** "Crear grupo" in dropdown (M1)

```
┌─────────────────────────────────┐
│  (drag handle)                  │
│  Crear grupo              [X]  │
├─────────────────────────────────┤
│                                 │
│  Nombre del grupo               │
│  ┌─────────────────────────────┐│
│  │ Mi casa                     ││  ← Max 100 chars, sanitized
│  └─────────────────────────────┘│
│                                 │
│  Ícono                          │
│  🏠 👨‍👩‍👧 🏢 🍽️ ✈️ 🎉 💼 🏋️ 🛒  │  ← 3x3 grid, 44px cells
│  [selected: 🏠 highlighted]    │
│                                 │
│  Color                          │
│  ● ● ● ● ● ● ● ●              │  ← 8 swatches, 32px circles
│  [selected: emerald outlined]   │
│                                 │
│  ┌─ Preview ─────────────────┐ │
│  │ 🏠 Mi casa                │ │  ← Live preview: icon + name
│  │ [emerald bar sample]      │ │  ← Nav bar color preview
│  └────────────────────────────┘ │
│                                 │
│  [      Crear grupo      ]      │  ← Disabled until name entered
│                                 │
└─────────────────────────────────┘
```

Defaults: icon 🏠, color emerald. Button disabled until name is entered.

---

## M6: Group Transaction Card

Simpler than personal TransactionCard. No receipt thumbnail, no alias. Shows poster name. Items expandable.

```
┌──────────────────────────────────────┐
│  [Category   Sofia                   │  ← 28px badge + poster name (12px muted)
│   badge]     Lider Express           │  ← Merchant (14px bold)
│              $62,000          [▼][🗑️]│  ← Amount (category color) + expand + delete
│              15 mar 2026             │  ← Transaction DATE (purchase date)
│              Compartido 15 mar       │  ← postedAt (10px muted, optional)
├─ items (when expanded) ─────────────┤
│  Leche entera 1L          $2,500    │
│  Pan integral              $1,800    │
│  Jamón pavo               $3,200    │
└──────────────────────────────────────┘
```

**Conditional elements:**
- 🗑️ delete icon: only if viewer is admin AND postedAt < 60 days
- ▼ expand chevron: only if items array is non-empty
- "Compartido" secondary date: optional (designer's call on visual weight)

**Visual differences from personal TransactionCard:**
- No receipt thumbnail column
- Poster name visible (not on personal cards)
- No selection checkbox
- Tap → M15 (read-only detail), NOT editor
- Long-press → nothing

---

## M7: Group Selector Sheet (Batch Assign)

**Type:** Bottom sheet | **Trigger:** "Grupo" button in SelectionBar

```
┌─────────────────────────────────┐
│  (drag handle)                  │
│  Agregar a grupo                │
│  3 transacciones seleccionadas  │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🏠 Casa              →     ││
│  ├─────────────────────────────┤│
│  │ 👨‍👩‍👧 Familia            →     ││
│  ├─────────────────────────────┤│
│  │ 🏢 Oficina             →     ││
│  └─────────────────────────────┘│
│                                 │
│  [Cancelar]                     │
└─────────────────────────────────┘
```

Tap group → batchPostToGroup → close → toast: "3 agregadas a 🏠 Casa, 1 ya existente"
No groups: "No tienes grupos. Crea uno primero." + "Crear grupo" button.

---

## M8: Admin Panel

**Type:** Full-screen subview | **Entry:** ⋮ options → "Administrar grupo" (admin only)

```
┌─────────────────────────────────┐
│  [←] Administrar 🏠 Casa       │
├─────────────────────────────────┤
│                                 │
│  ┌─ Configuración ────────────┐ │
│  │ Nombre: Casa               │ │
│  │ Ícono: 🏠  Color: ● emer.  │ │
│  │ [Editar configuración →]   │ │  ← Opens M9
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Miembros (3/50) ─────────┐ │
│  │ 📸 Valentina   Admin  [⋮] │ │  ← Photo + name + role + action menu
│  │ 📸 Matias      Admin  [⋮] │ │
│  │ 📸 Sofia       Miembro[⋮] │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─ Invitaciones ─────────────┐ │
│  │ [Generar enlace invitación]│ │  ← Expands to M10
│  └────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐│
│  │  🗑️ Eliminar grupo          ││  ← Red destructive button → M13
│  └─────────────────────────────┘│
└─────────────────────────────────┘
```

**Member action menu (⋮):**
- Non-admin member: "Hacer administrador" | "Eliminar del grupo"
- Co-admin (≥2 admins): "Quitar administrador" | "Eliminar del grupo"
- Self (admin, ≥2 admins): "Dejar de ser administrador"

---

## M9: Group Settings Form

**Type:** Inline edit or modal within Admin Panel (M8)

Same layout as M5 (Create Group Form) but pre-filled with current values: name, icon highlighted, color selected. Button text: "Guardar cambios" instead of "Crear grupo."

---

## M10: Invite Link Generator

**Type:** Expandable section within Admin Panel (M8)

```
┌─────────────────────────────────┐
│  Invitar miembros               │
│                                 │
│  ┌─────────────────────────────┐│
│  │     A B 3 X  7 K M 2       ││  ← 24px monospace, spaced
│  └─────────────────────────────┘│
│  Válido por 7 días · 10 usos   │
│                                 │
│  [📋 Copiar]  [📤 Compartir]   │  ← Side by side
│  [Generar nuevo código]         │  ← Secondary button
└─────────────────────────────────┘
```

---

## M11: Redeem Invite

**Type:** Section in M16 (Settings → Grupos) or accessible from dropdown "Unirse" button

```
┌─────────────────────────────────┐
│  Unirse a un grupo              │
│                                 │
│  Código de invitación           │
│  ┌─────────────────────────────┐│
│  │ ________                    ││  ← 8 chars, uppercase, monospace
│  └─────────────────────────────┘│
│                                 │
│  [     Unirse     ]             │
│                                 │
│  ── Success state ──            │
│  ✓ Te uniste a 🏠 Casa         │
│  Este grupo aparece en tu menú. │
│                                 │
│  ── Error states ──             │
│  ✗ Este código ha expirado      │
│  ✗ Este código ya no tiene usos │
│  ✗ Ya perteneces al máximo de   │
│    5 grupos                     │
│  ⏱ Demasiados intentos. Espera. │
│  ℹ Ya eres miembro de este      │
│    grupo (informational)        │
└─────────────────────────────────┘
```

---

## M12: Leave Group Confirmation (3 Variants)

**Variant A — Normal leave (not last person, not only admin):**
```
┌─────────────────────────────────┐
│  ¿Salir de 🏠 Casa?            │
│                                 │
│  Tus transacciones compartidas  │
│  permanecerán en el grupo.      │
│                                 │
│       [Cancelar]    [Salir]     │
└─────────────────────────────────┘
```

**Variant B — Only admin with other members:**
No dialog — error toast: "Debes designar otro administrador antes de salir" → redirect to admin panel member list.

**Variant C — Last person (destructive):**
```
┌─────────────────────────────────┐
│  ¿Salir y eliminar el grupo?    │
│                                 │
│  Eres el último miembro. Salir  │
│  eliminará 🏠 Casa y todas sus  │
│  47 transacciones               │
│  permanentemente.               │
│                                 │
│  [Cancelar]  [Salir y eliminar] │  ← RED button
└─────────────────────────────────┘
```

---

## M13: Delete Group Confirmation

**Type:** Destructive dialog with text input verification

```
┌─────────────────────────────────┐
│  ¿Eliminar 🏠 Casa?            │
│                                 │
│  Esta acción eliminará          │
│  permanentemente las 47         │
│  transacciones compartidas.     │
│  Esta acción NO se puede        │
│  deshacer.                      │
│                                 │
│  Escribe "Casa" para confirmar: │
│  ┌─────────────────────────────┐│
│  │ ________                    ││
│  └─────────────────────────────┘│
│                                 │
│  [Cancelar]  [Eliminar grupo]   │  ← RED, disabled until name matches
└─────────────────────────────────┘
```

---

## M14: Delete Transaction Confirmation

```
┌─────────────────────────────────┐
│  ¿Eliminar esta transacción?    │
│                                 │
│  Sofia · Lider · $62,000        │
│  15 mar 2026                    │
│                                 │
│  La transacción personal del    │
│  miembro no se verá afectada.   │
│                                 │
│       [Cancelar]  [Eliminar]    │  ← RED button
└─────────────────────────────────┘
```

---

## M15: Read-Only Group Transaction Detail

**Type:** Full-screen subview or modal | **Trigger:** Tap on GroupTransactionCard (M6)

```
┌─────────────────────────────────┐
│  [←] Detalle de transacción     │
├─────────────────────────────────┤
│                                 │
│  [Category badge large, 48px]   │
│                                 │
│  Lider Express                  │  ← Merchant (18px bold)
│  $62,000 CLP                   │  ← Amount (20px, category color)
│                                 │
│  ┌─────────────────────────────┐│
│  │ Categoría    🛒 Supermercado││
│  │ Fecha        15 mar 2026    ││  ← Transaction date (purchase)
│  │ Compartido   15 mar 2026    ││  ← postedAt
│  │ Publicado por  Sofia        ││  ← Poster name
│  └─────────────────────────────┘│
│                                 │
│  ┌─ Artículos (3) ────────────┐ │
│  │ Leche entera 1L    $2,500  │ │
│  │ Pan integral        $1,800  │ │
│  │ Jamón pavo         $3,200  │ │
│  └────────────────────────────┘ │
│                                 │
│  ┌─────────────────────────────┐│
│  │ 🗑️ Eliminar del grupo       ││  ← Only for admin, < 60 days
│  └─────────────────────────────┘│
│                                 │
│  Solo lectura · No editable     │  ← Footer disclaimer (12px muted)
│                                 │
└─────────────────────────────────┘
```

**What is NOT shown (personal data excluded):**
- No receipt image/thumbnail
- No alias
- No location
- No time (only date)
- No edit button, no rescan

---

## M16: Settings → Grupos Subview

**Type:** Settings subview | **Entry:** Settings → "Grupos" row

```
┌─────────────────────────────────┐
│  [←] Grupos                     │
├─────────────────────────────────┤
│                                 │
│  ┌─ Mis grupos (3/5) ─────────┐│
│  │ 🏠 Casa       Admin    [→] ││  ← Tap → enters group view
│  │ 👨‍👩‍👧 Familia    Miembro  [→] ││
│  │ 🏢 Oficina    Admin    [→] ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─ Unirse a un grupo ────────┐│
│  │ Código de invitación        ││
│  │ ┌─────────────────────────┐ ││
│  │ │ ________               │ ││
│  │ └─────────────────────────┘ ││
│  │ [      Unirse      ]       ││
│  └─────────────────────────────┘│
│                                 │
│  ┌─ Copia automática ─────────┐│
│  │ 🏠 Casa           [toggle] ││  ← Same toggles as in dropdown
│  │ 👨‍👩‍👧 Familia        [toggle] ││
│  │ 🏢 Oficina         [toggle] ││
│  └─────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

**Sections:**
1. **Mis grupos:** List of groups with role badge. Tap row → switches to that group's view. Shows count (3/5).
2. **Unirse a un grupo:** Inline redeem invite code flow (same as M11).
3. **Copia automática:** Auto-copy toggles for each group (mirrors dropdown toggles — same underlying store).

**Empty state (no groups):** "No perteneces a ningún grupo. Crea uno o únete con un código de invitación." + "Crear grupo" button.