# Story 14.22: Settings View Redesign

**Status:** in-progress
**Points:** 8
**Epic:** 14 - Core Implementation
**Dependencies:** Story 14.1 (Animation Framework), Story 14.2 (Screen Transitions)
**Mockup:** [settings.html](../../../uxui/mockups/01_views/settings.html)

---

## Story

**As a** user accessing app settings,
**I want to** see a redesigned settings view with organized sub-sections and intuitive navigation,
**So that** I can easily find and manage my preferences, learned data, and account settings.

---

## Context

The settings.html mockup shows a completely redesigned Settings view with:
- **Hierarchical menu structure**: 7 main sections that drill down to sub-views
- **Back header navigation**: Each sub-view has a back button and title
- **New features**: Spending limits management (global and per-category)
- **Reorganized content**: Existing features grouped logically into sub-sections
- **Profile section**: Avatar with initials, editable name/phone, read-only Google-linked email
- **Subscription display**: Current plan card with credits progress bar

This story transforms the current flat SettingsView into a multi-view hierarchical structure.

---

## Acceptance Criteria

### AC #1: Main Settings Menu
- [ ] Display 7 menu items with icons, titles, and subtitles:
  1. **Limites de Gasto** (red alert icon) - "Limites mensuales por categoria"
  2. **Perfil** (user icon) - "Foto, nombre, email, telefono"
  3. **Preferencias** (gear icon) - "Idioma, fecha, tema"
  4. **Escaneo** (camera icon) - "Moneda y ubicacion por defecto"
  5. **Suscripcion** (credit card icon) - "Plan actual, creditos de escaneo"
  6. **Datos Aprendidos** (book icon) - "Grupos, comercios, subcategorias"
  7. **App** (phone icon) - "Instalacion PWA, notificaciones"
  8. **Datos y Cuenta** (database icon) - "Exportar, restablecer, cerrar sesion"
- [ ] Each item navigates to its sub-view on tap
- [ ] Menu items use design system styling (rounded cards, icon backgrounds)

### AC #2: Sub-View Navigation Pattern
- [ ] Each sub-view has back header with left arrow and title
- [ ] Back button returns to main settings menu
- [ ] Sub-view content scrolls independently
- [ ] Consistent padding and spacing across all sub-views

### AC #3: Limites de Gasto Sub-View (NEW FEATURE - Placeholder)
- [ ] Show "Proximamente" placeholder card
- [ ] Brief description: "Establece limites mensuales para controlar tus gastos"
- [ ] Note: Full implementation deferred to Epic 15 (Learned Thresholds)

### AC #4: Perfil Sub-View
- [ ] Profile avatar with user initials (96px circle)
- [ ] Edit button overlay on avatar (camera icon)
- [ ] Editable "Nombre Completo" text field
- [ ] Read-only "Correo Electronico" with Google icon and "Vinculado" badge
- [ ] Editable "Telefono" with country code selector (+56 Chile default)

### AC #5: Preferencias Sub-View
- [ ] Language toggle (EN/ES) - uses existing onSetLang
- [ ] Currency toggle (CLP/USD) - uses existing onSetCurrency
- [ ] Date format toggle (31/12 LatAm / 12/31 US) - uses existing onSetDateFormat
- [ ] Theme toggle (Light/Dark) - uses existing onSetTheme
- [ ] Color theme dropdown (Mono/Normal/Professional) - uses existing onSetColorTheme
- [ ] Font color mode dropdown (Colorful/Plain) - uses existing onSetFontColorMode

### AC #6: Escaneo Sub-View
- [ ] Default scan currency dropdown (CLP/USD/EUR/etc.) - uses existing onSetDefaultScanCurrency
- [ ] Default location selectors (Country/City) - uses existing LocationSelect component

### AC #7: Suscripcion Sub-View
- [ ] Plan card showing current plan name (e.g., "Gratuito", "Pro")
- [ ] Credits progress bar showing used/available scan credits
- [ ] Credits text: "X de Y creditos disponibles"
- [ ] Uses existing subscription/credit service data

### AC #8: Datos Aprendidos Sub-View
- [ ] Expandable sections for each learned data type:
  - Learned Categories (CategoryMappingsList)
  - Learned Merchants (MerchantMappingsList)
  - Learned Subcategories (SubcategoryMappingsList)
  - Trusted Merchants (TrustedMerchantsList)
- [ ] Each section shows count badge and chevron
- [ ] Expand/collapse animation
- [ ] "Ver todo" link in each section footer

### AC #9: App Sub-View
- [ ] PWA installation section (PWASettingsSection component)
- [ ] Push notifications settings (NotificationSettings component)

### AC #10: Datos y Cuenta Sub-View
- [ ] Export data button (CSV) - uses existing onExportAll
- [ ] Wipe data button (destructive red styling) - uses existing onWipeDB
- [ ] Sign out button - uses existing onSignOut
- [ ] Appropriate confirmation dialogs for destructive actions

### AC #11: Existing Learned Data Accessible (Atlas)
- [ ] All existing learned category/merchant/subcategory mappings remain viewable
- [ ] Edit and delete functionality preserved for all mapping types
- [ ] No data loss during migration to new UI structure

### AC #12: Trusted Merchants List Accessible (Atlas)
- [ ] TrustedMerchantsList functionality preserved in "Datos Aprendidos" section
- [ ] Revoke trust action works as before

### AC #13: Existing Props Compatibility (Atlas)
- [ ] SettingsView continues to accept all existing props from App.tsx
- [ ] No breaking changes to parent component integration
- [ ] Props passed down to appropriate sub-components

### AC #14: Animation Framework Integration (Atlas)
- [ ] Main settings view uses PageTransition wrapper
- [ ] Sub-view transitions use slide animation (left/right)
- [ ] Staggered entry for menu items on initial load
- [ ] Respects prefers-reduced-motion

### AC #15: Theme Consistency (Atlas)
- [ ] All new UI elements use CSS variables:
  - `--bg-primary`, `--bg-secondary`, `--bg-tertiary`
  - `--text-primary`, `--text-secondary`, `--text-tertiary`
  - `--border-light`, `--border-medium`
  - `--primary`, `--primary-light`, `--primary-hover`
- [ ] Works correctly in Light/Dark modes
- [ ] Works correctly with all color themes (Mono/Normal/Professional)

---

## Tasks / Subtasks

- [ ] **Task 1: Create Settings Navigation State** (AC: #1, #2)
  - [ ] Add `activeSettingsView` state to track current sub-view
  - [ ] Create `SettingsSubView` type union for all sub-views
  - [ ] Implement `navigateToSubView()` and `navigateBack()` handlers

- [ ] **Task 2: Create SettingsMenuItem Component** (AC: #1)
  - [ ] Reusable menu item with icon, title, subtitle, chevron
  - [ ] Support different icon background colors
  - [ ] onClick handler for navigation

- [ ] **Task 3: Create SettingsBackHeader Component** (AC: #2)
  - [ ] Back arrow button with title
  - [ ] Consistent styling across all sub-views

- [ ] **Task 4: Refactor Main Settings View** (AC: #1, #14)
  - [ ] Replace flat list with menu item grid
  - [ ] Add PageTransition wrapper
  - [ ] Add staggered entry animation for menu items

- [ ] **Task 5: Create Limites Placeholder Sub-View** (AC: #3)
  - [ ] "Proximamente" card with description
  - [ ] Consistent sub-view layout

- [ ] **Task 6: Create Perfil Sub-View** (AC: #4)
  - [ ] ProfileAvatar component with initials
  - [ ] Form fields for name, email (read-only), phone
  - [ ] Country code selector component

- [ ] **Task 7: Create Preferencias Sub-View** (AC: #5)
  - [ ] Migrate language, currency, date format, theme toggles
  - [ ] Migrate color theme and font mode dropdowns
  - [ ] Consistent card styling

- [ ] **Task 8: Create Escaneo Sub-View** (AC: #6)
  - [ ] Migrate default scan currency dropdown
  - [ ] Migrate LocationSelect for default location

- [ ] **Task 9: Create Suscripcion Sub-View** (AC: #7)
  - [ ] Plan card component with gradient background
  - [ ] Credits progress bar component
  - [ ] Integration with existing subscription data

- [ ] **Task 10: Create DatosAprendidos Sub-View** (AC: #8, #11, #12)
  - [ ] Expandable section wrapper component
  - [ ] Integrate existing list components
  - [ ] Add count badges to section headers

- [ ] **Task 11: Create App Sub-View** (AC: #9)
  - [ ] Migrate PWASettingsSection
  - [ ] Migrate NotificationSettings

- [ ] **Task 12: Create DatosCuenta Sub-View** (AC: #10)
  - [ ] Migrate export, wipe, sign out actions
  - [ ] Destructive action styling

- [ ] **Task 13: Add Tests** (AC: All)
  - [ ] Unit tests for new components (MenuItem, BackHeader, subviews)
  - [ ] Integration tests for navigation flow
  - [ ] Verify existing functionality not broken

---

## Dev Notes

### Architecture Approach

**Option A: Single Component with Conditional Rendering**
```typescript
// SettingsView.tsx manages all state
const [activeView, setActiveView] = useState<SettingsSubView>('main');

return activeView === 'main' ? <MainMenu /> : <SubViewRenderer view={activeView} />;
```

**Option B: Route-Based Sub-Views** (Recommended if using React Router)
```typescript
// Separate routes: /settings, /settings/profile, /settings/preferences
```

**Recommendation:** Option A (single component) maintains compatibility with existing App.tsx integration.

### Existing Props to Preserve

The current SettingsView accepts 40+ props. These should be organized into logical groups and passed to appropriate sub-components:

```typescript
// Preferencias props
lang, currency, dateFormat, theme, colorTheme, fontColorMode
onSetLang, onSetCurrency, onSetDateFormat, onSetTheme, onSetColorTheme, onSetFontColorMode

// Escaneo props
defaultScanCurrency, defaultCountry, defaultCity
onSetDefaultScanCurrency, onSetDefaultCountry, onSetDefaultCity

// Datos Aprendidos props
mappings, mappingsLoading, onDeleteMapping, onEditMapping
merchantMappings, merchantMappingsLoading, onDeleteMerchantMapping, onEditMerchantMapping
subcategoryMappings, subcategoryMappingsLoading, onDeleteSubcategoryMapping, onUpdateSubcategoryMapping
trustedMerchants, trustedMerchantsLoading, onRevokeTrust

// App props
db, userId, appId, onShowToast

// Datos y Cuenta props
wiping, exporting, onExportAll, onWipeDB, onSignOut

// Translation
t
```

### Component Organization

```
src/components/settings/
├── SettingsMenuItem.tsx        # Menu item component
├── SettingsBackHeader.tsx      # Back navigation header
├── SettingsSubViewWrapper.tsx  # Common wrapper for sub-views
├── subviews/
│   ├── LimitesView.tsx         # Placeholder for spending limits
│   ├── PerfilView.tsx          # Profile editing
│   ├── PreferenciasView.tsx    # Language, theme, etc.
│   ├── EscaneoView.tsx         # Scan defaults
│   ├── SuscripcionView.tsx     # Plan and credits
│   ├── DatosAprendidosView.tsx # Learned data management
│   ├── AppView.tsx             # PWA and notifications
│   └── DatosCuentaView.tsx     # Export, wipe, sign out
└── index.ts                    # Barrel export
```

### Testing Standards

- Unit tests for each new component
- Integration test for navigation flow (main → sub → back)
- Snapshot tests for UI consistency
- Accessibility tests (focus management on navigation)

### Project Structure Notes

- Follows existing pattern of view-specific components in `src/components/`
- Maintains existing `src/views/SettingsView.tsx` as main entry point
- New sub-components extracted for reusability

### References

- [Mockup: settings.html](../../../uxui/mockups/01_views/settings.html)
- [Design System: design-system-final.html](../../../uxui/mockups/00_components/design-system-final.html)
- [Motion Design: motion-design-system.md](../../../uxui/motion-design-system.md)
- [Current SettingsView: src/views/SettingsView.tsx](../../../../src/views/SettingsView.tsx)
- [Story 14.1: Animation Framework](./story-14.1-animation-framework.md)
- [Story 14.2: Screen Transitions](./story-14.2-screen-transition-system.md)

---

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis

### Affected Workflows

| Workflow | Impact |
|----------|--------|
| **#3: Learning Flow** | Settings view displays Learned Categories, Merchants, Subcategories - mockup consolidates these into "Datos Aprendidos" sub-section |
| **#7: Trust Merchant Flow** | TrustedMerchantsList currently in Settings, moves to "Datos Aprendidos" sub-section |
| **Navigation Flow** | Settings now uses hierarchical drill-down pattern with back headers instead of flat list |

### Downstream Effects to Consider

- Props interface unchanged but internal structure reorganized
- Existing test mocks for SettingsView may need sub-component awareness
- Users familiar with old layout will need to learn new navigation

### Testing Implications

- **Existing tests to verify:** SettingsView.test.tsx, CategoryMappingsList.test.tsx, MerchantMappingsList.test.tsx, SubcategoryMappingsList.test.tsx, TrustedMerchantsList.test.tsx
- **New scenarios to add:** Sub-view navigation, back button behavior, expandable section toggle, state persistence

### Workflow Chain Visualization

```
[User opens Settings] → [Main Menu] → [Select Category] → [Sub-View] → [Perform Action] → [Back to Main]
                                            ↓
                              [Datos Aprendidos] → [Expand Section] → [Edit/Delete Mapping]
```

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript compilation: No errors
- Unit tests: 2749 passed (new settings component tests included)
- 3 pre-existing test failures unrelated to this story

### Completion Notes List

1. **Auth Bug Fix (User Request)**: Fixed city/country settings being wiped on re-login
   - Extended `UserPreferences` interface to include `defaultCountry`, `defaultCity`, `displayName`, `phoneNumber`
   - Migrated from localStorage to Firestore persistence via `useUserPreferences` hook
   - Settings now persist across sessions and devices

2. **Settings Hierarchical Redesign**: Complete implementation of AC #1-13
   - Created `SettingsMenuItem` component for navigation
   - Created `SettingsBackHeader` component for sub-view navigation
   - Created 8 sub-views: Limites, Perfil, Preferencias, Escaneo, Suscripcion, DatosAprendidos, App, Cuenta
   - All existing functionality preserved and reorganized

3. **Animation**: AC #14 not implemented (depends on Story 14.1/14.2 completion)

4. **Theme Consistency**: AC #15 implemented - all components use CSS variables

### File List

**New Files:**
- `src/components/settings/SettingsMenuItem.tsx`
- `src/components/settings/SettingsBackHeader.tsx`
- `src/components/settings/index.ts`
- `src/components/settings/subviews/LimitesView.tsx`
- `src/components/settings/subviews/PerfilView.tsx`
- `src/components/settings/subviews/PreferenciasView.tsx`
- `src/components/settings/subviews/EscaneoView.tsx`
- `src/components/settings/subviews/SuscripcionView.tsx`
- `src/components/settings/subviews/DatosAprendidosView.tsx`
- `src/components/settings/subviews/AppView.tsx`
- `src/components/settings/subviews/CuentaView.tsx`
- `src/components/settings/subviews/index.ts`
- `tests/unit/components/settings/SettingsMenuItem.test.tsx`
- `tests/unit/components/settings/SettingsBackHeader.test.tsx`

**Modified Files:**
- `src/views/SettingsView.tsx` - Complete rewrite with hierarchical navigation
- `src/types/settings.ts` - Added `SettingsSubView` type and config interface
- `src/services/userPreferencesService.ts` - Extended UserPreferences interface
- `src/hooks/useUserPreferences.ts` - Added setters for new fields
- `src/App.tsx` - Updated to use Firestore-backed location settings
- `src/utils/translations.ts` - Added translation keys for settings menu items
- `src/components/TopHeader.tsx` - Settings variant: ChevronLeft icon, left-aligned title, profile avatar

---

## Session Progress Log

### Session 2025-01-05: PerfilView Complete Redesign

**Completed Work:**

#### 1. PerfilView Enhancement (AC #4) - COMPLETE ✅

**Implemented Features:**
- **Header Breadcrumb Navigation**: TopHeader now shows "Ajustes > Perfil" breadcrumb style when in subview
  - Added `settingsSubview` prop to TopHeader
  - Lifted subview state from SettingsView to App.tsx for breadcrumb display
  - Back button returns to main settings when in subview, dashboard when in main settings

- **Birth Date Field**: Added native date picker (`type="date"`)
  - Uses ISO format (YYYY-MM-DD) internally
  - Extended `UserPreferences` interface with `birthDate?: string`
  - Added `setBirthDate` to `useUserPreferences` hook
  - Persists to Firestore

- **CUENTA VINCULADA Section**: Google account card with:
  - Google multi-color "G" icon SVG
  - Email display
  - "Conectado" badge with green checkmark

- **Guardar Cambios Button**: Primary green button
  - Uses `var(--primary)` (same green as camera button)
  - Disabled state at 50% opacity when no changes
  - Shows loading state while saving
  - Toast notification on save success/error

- **Tailwind UI Input Patterns**: Redesigned all form fields
  - "Input with label" pattern for Name, Email, Birth Date
  - "Input with inline leading dropdown" pattern for Phone with country code
  - Phone + Birth Date on same responsive row (`grid-cols-1 sm:grid-cols-2`)

- **Country Code Selector**: Inline dropdown with country codes
  - Options: CL +56, US +1, ES +34, MX +52, AR +54, BR +55, CO +57, PE +51

**Files Modified:**
- `src/components/settings/subviews/PerfilView.tsx` - Complete rewrite with Tailwind patterns
- `src/components/TopHeader.tsx` - Added `settingsSubview` prop for breadcrumb
- `src/views/SettingsView.tsx` - Added controlled navigation state props
- `src/App.tsx` - Added `settingsSubview` state, wired to TopHeader and SettingsView
- `src/services/userPreferencesService.ts` - Added `birthDate` field
- `src/hooks/useUserPreferences.ts` - Added `setBirthDate` setter
- `src/utils/translations.ts` - Added translation keys for new elements
- `tests/unit/components/settings/PerfilView.test.tsx` - Updated for new patterns (25 tests pass)

**Translation Keys Added (EN/ES):**
- `birthDate` / `Fecha de Nacimiento`
- `optional` / `opcional`
- `linkedAccountSection` / `Cuenta Vinculada`
- `connected` / `Conectado`
- `saveChanges` / `Guardar Cambios`
- `changesSaved` / `Cambios guardados`
- `errorSavingChanges` / `Error al guardar cambios`
- `changeProfilePhoto` / `Cambiar foto de perfil`

**Test Results:**
- All 34 settings component tests pass
- TypeScript compiles without errors

---

## Session 2026-01-05: Settings Refinements

### Completed Work

#### 1. Short Breadcrumb Titles ✅
Fixed breadcrumb titles to avoid two-line displays in TopHeader:
- Added `*Short` translation keys for all settings subviews
- Updated App.tsx to use short keys for breadcrumb display

| Subview | Full Title (ES) | Short Title (ES) |
|---------|-----------------|------------------|
| Limites | Limites de Gasto | **Limites** |
| Perfil | Perfil | Perfil |
| Preferencias | Preferencias | Preferencias |
| Escaneo | Escaneo | Escaneo |
| Suscripcion | Suscripcion | **Plan** |
| Datos | Datos Aprendidos | **Memoria** |
| App | App | App |
| Cuenta | Datos y Cuenta | **Mis Datos** |

#### 2. Removed Redundant SettingsBackHeader ✅
Since TopHeader now shows breadcrumb navigation ("Ajustes > Section"), the `SettingsBackHeader` inside each subview was redundant:
- Removed `SettingsBackHeader` from all 8 subviews
- Removed `onBack` prop from all subview interfaces
- Removed unused `handleBack` function from SettingsView.tsx

#### 3. Theme-Aware Toast Notifications ✅
Updated the global toast notification in App.tsx:
- Uses `var(--primary)` for success (theme green)
- Uses `var(--accent)` for info messages
- Uses `var(--font-family)` for consistent typography
- Added icons: checkmark for success, info circle for other

### Deployment In Progress

**PR #138**: https://github.com/Brownbull/gmni_boletapp/pull/138

**CI Status**: Tests running (as of session end)

**Test Fixes Applied:**
1. `settings-export.test.tsx`: Tests `CuentaView` directly instead of old flat SettingsView
2. `FilterChips.test.tsx`: Uses aria-label for Clear All button (now X icon), fixed category translation
3. `analytics-workflows.test.tsx`: Added `HistoryFiltersProvider` wrapper for TrendsView
4. `DashboardView.test.tsx`: Updated duplicate detection test for carousel layout

**Files Changed in This Session:**
- `src/utils/translations.ts` - Added `*Short` translation keys
- `src/App.tsx` - Updated breadcrumb to use short keys, theme-aware toast
- `src/views/SettingsView.tsx` - Removed `handleBack` function
- `src/components/settings/subviews/*.tsx` - All 8 subviews: removed SettingsBackHeader
- `tests/integration/settings-export.test.tsx` - Test CuentaView directly
- `tests/unit/components/history/FilterChips.test.tsx` - Fixed Clear All and category tests
- `tests/integration/analytics-workflows.test.tsx` - Added HistoryFiltersProvider
- `tests/unit/views/DashboardView.test.tsx` - Updated duplicate detection test

---

## Next Session: Items to Tackle

### 1. Complete Deployment
- Monitor PR #138 CI status
- Merge to develop once tests pass
- Promote to staging → main for production
- Update Atlas memory with deployment lessons

### 2. Version Update in Settings
- Update app version displayed in settings
- Consider adding to Suscripcion or App subview

### 3. Animation Framework Integration (AC #14)
Still pending - depends on Story 14.1/14.2:
- PageTransition wrapper for main settings
- Slide animation for sub-view transitions
- Staggered entry for menu items

### 4. Mark Story Complete
Once deployment is verified:
- Update story status to "done"
- Run retrospective if needed
