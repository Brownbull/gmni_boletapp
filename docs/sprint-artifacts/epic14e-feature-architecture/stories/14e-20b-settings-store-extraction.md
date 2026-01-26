# Story 14e.20b: Settings Store Extraction

Status: ready-for-dev

> **Part 2/2** of UI State Extraction split. See also: [14e-20a-toast-hook-extraction.md](./14e-20a-toast-hook-extraction.md)

## Story

As a **developer**,
I want **settings state extracted from App.tsx to a Zustand store**,
So that **settings are globally accessible and persist correctly via a single mechanism**.

## Acceptance Criteria

1. **Given** settings state in App.tsx (theme, colorTheme, fontColorMode, fontSize)
   **When** this story is completed
   **Then** settings state is managed by `src/shared/stores/useSettingsStore.ts`

2. **Given** localStorage persistence (separate keys for each setting)
   **When** this story is completed
   **Then** Zustand persist middleware handles all storage with migration from legacy keys

3. **Given** the new useSettingsStore
   **When** used by App.tsx and SettingsView
   **Then** all existing settings functionality works without regressions

4. **Given** legacy localStorage keys ('colorTheme', 'fontColorMode', 'fontSize')
   **When** store initializes
   **Then** values are migrated to Zustand storage and legacy keys are respected

5. **Given** state that must remain in App.tsx
   **When** this story is completed
   **Then** the remaining state is documented with rationale

## Tasks / Subtasks

- [ ] **Task 1: Create useSettingsStore** (AC: #1, #2, #4)
  - [ ] Create `src/shared/stores/useSettingsStore.ts`
  - [ ] Define state: `theme`, `colorTheme`, `fontColorMode`, `fontSize`
  - [ ] Add Zustand `persist` middleware with localStorage
  - [ ] Implement migration for legacy keys (ghibli->normal, default->professional)
  - [ ] Export selectors and actions
  - [ ] Write unit tests

- [ ] **Task 2: Update App.tsx** (AC: #3)
  - [ ] Remove settings useState calls (theme, colorTheme, fontColorMode, fontSize)
  - [ ] Remove corresponding localStorage persistence useEffects
  - [ ] Import and use store selectors/actions
  - [ ] Pass settings to components that need them

- [ ] **Task 3: Document remaining state** (AC: #5)
  - [ ] Document state that MUST remain in App.tsx with rationale
  - [ ] Verify no regressions: run tests, build, manual smoke test

## Dev Notes

### Implementation

```typescript
// src/shared/stores/useSettingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type ColorTheme = 'normal' | 'professional' | 'mono';
type FontColorMode = 'colorful' | 'plain';
type FontSize = 'small' | 'normal';

interface SettingsState {
  theme: Theme;
  colorTheme: ColorTheme;
  fontColorMode: FontColorMode;
  fontSize: FontSize;
}

interface SettingsActions {
  setTheme: (theme: Theme) => void;
  setColorTheme: (colorTheme: ColorTheme) => void;
  setFontColorMode: (mode: FontColorMode) => void;
  setFontSize: (size: FontSize) => void;
}

// Migration function for legacy localStorage keys
const migrateFromLegacy = (): Partial<SettingsState> => {
  const result: Partial<SettingsState> = {};

  // Migrate colorTheme (handles ghibli->normal, default->professional)
  const savedColorTheme = localStorage.getItem('colorTheme');
  if (savedColorTheme === 'ghibli') result.colorTheme = 'normal';
  else if (savedColorTheme === 'default') result.colorTheme = 'professional';
  else if (savedColorTheme === 'normal' || savedColorTheme === 'professional' || savedColorTheme === 'mono') {
    result.colorTheme = savedColorTheme;
  }

  // Migrate fontColorMode
  const savedFontColor = localStorage.getItem('fontColorMode');
  if (savedFontColor === 'colorful' || savedFontColor === 'plain') {
    result.fontColorMode = savedFontColor;
  }

  // Migrate fontSize
  const savedFontSize = localStorage.getItem('fontSize');
  if (savedFontSize === 'small' || savedFontSize === 'normal') {
    result.fontSize = savedFontSize;
  }

  return result;
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    (set) => ({
      // Defaults with legacy migration
      theme: 'light',
      colorTheme: 'mono',
      fontColorMode: 'colorful',
      fontSize: 'small',
      ...migrateFromLegacy(),

      setTheme: (theme) => set({ theme }),
      setColorTheme: (colorTheme) => set({ colorTheme }),
      setFontColorMode: (fontColorMode) => set({ fontColorMode }),
      setFontSize: (fontSize) => set({ fontSize }),
    }),
    {
      name: 'boletapp-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Convenience selectors (prevent unnecessary re-renders)
export const useTheme = () => useSettingsStore((s) => s.theme);
export const useColorTheme = () => useSettingsStore((s) => s.colorTheme);
export const useFontColorMode = () => useSettingsStore((s) => s.fontColorMode);
export const useFontSize = () => useSettingsStore((s) => s.fontSize);

// Actions (can be used outside React)
export const setTheme = (theme: Theme) => useSettingsStore.getState().setTheme(theme);
export const setColorTheme = (colorTheme: ColorTheme) => useSettingsStore.getState().setColorTheme(colorTheme);
```

### State to KEEP in App.tsx (Rationale)

| State | Rationale |
|-------|-----------|
| `view` / `previousView` | Central to routing, used by 20+ components |
| `settingsSubview` | View-specific, moves with SettingsView |
| `currentTransaction` | Tied to active editing flow |
| `transactionNavigationList` | ItemsView-specific, tight coupling |
| `lang` / `currency` / `dateFormat` | Used for data formatting, may move to settings store in future |
| Insight/session states | Tied to scan completion flow |
| Batch states | May move to batch-review feature (14e-15/16) |
| Trust/credit states | May move to credit feature (14e-18) |
| Navigation filter states | May move to features later |

### Files to Create

| File | Purpose |
|------|---------|
| `src/shared/stores/useSettingsStore.ts` | Settings state with Zustand persist |
| `src/shared/stores/useSettingsStore.test.ts` | Unit tests |
| `src/shared/stores/index.ts` | Barrel export |

### Files to Modify

| File | Change |
|------|--------|
| `src/App.tsx` | Remove settings state, use store |

### Testing Strategy

1. Initial state loads from legacy localStorage keys
2. Actions update state and persist to new storage
3. Selectors return correct values
4. Migration: 'ghibli' -> 'normal', 'default' -> 'professional'

## Atlas Workflow Analysis

### Affected Workflows

- Settings affect visual rendering across ALL views
- No functional workflow changes expected

### Risk Level: LOW

Settings extraction is a pure refactor with no behavior change. Migration handles legacy values.

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.20]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#ADR-018]
- [Source: src/App.tsx:512-538] - settings useState calls
- [Source: src/App.tsx:833-843] - localStorage persistence effects

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Completion Notes List

(To be filled on completion)

### File List

(To be filled on completion)
