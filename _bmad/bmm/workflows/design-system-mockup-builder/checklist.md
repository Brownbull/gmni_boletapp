# Design System Mockup Builder - Validation Checklist

Use this checklist to validate all mockup screens before saving.

## CRITICAL (Must Pass)

- [ ] **Nav Labels Spanish:** Inicio, Analíticas, Ideas, Ajustes
  - NOT: Home, Analytics, History, Settings

- [ ] **Center Button Camera Icon:** Path starts with `M14.5 4h-5L7 7H4`
  - NOT: Scan/barcode icon (M3 7V5...)

- [ ] **Colors CSS Variables Only:** All colors use `var(--name)` syntax
  - NOT: Hardcoded hex (#0d9488), rgb(), hsl()

- [ ] **Scan Center Position:** `margin-top: -56px`
  - NOT: -32px or any other value

## HIGH PRIORITY

- [ ] **Components From Reference:** All used components exist in design-system-reference.md
  - NOT: Any invented or modified components

- [ ] **HTML Structure Match:** HTML tags and nesting match reference exactly
  - NOT: Custom wrappers or restructured elements

- [ ] **CSS Classes Match:** All class names from reference
  - NOT: Custom class names or inline styles

- [ ] **SVG Icons Canonical:** All icons use exact paths from icon catalog
  - NOT: Alternative icons or modified paths

## MEDIUM PRIORITY

- [ ] **Typography Font Family:** Uses `var(--font-family)` for body text
  - Body: 'Outfit', sans-serif

- [ ] **Logo Font:** Uses 'Baloo 2' for G logo and title
  - NOT: Outfit or other fonts for logo

- [ ] **Spacing Variables:** Uses `var(--space-N)` for margins/padding
  - NOT: Hardcoded px values (except component-specific)

- [ ] **Border Radius Variables:** Uses `var(--radius-*)` for corners
  - NOT: Hardcoded px values

## LOW PRIORITY

- [ ] **Shadow Variables:** Uses `var(--shadow-*)` for box shadows
  - NOT: Hardcoded shadow values

- [ ] **Status Bar Time:** Shows 9:41 (standard mockup time)
  - NOT: Other times or missing status bar

- [ ] **Lang Attribute:** `<html lang="es">`
  - NOT: lang="en" or missing attribute

## INTERACTIVE MOCKUP PATTERNS (When Adding JavaScript)

These patterns apply when building mockups with interactive elements (dropdowns, modals, etc.).
Reference: Atlas Lessons #31-34 from Story 13.9

- [ ] **Unique Animation Keyframe Names:** Each `@keyframes` has a unique name
  - CORRECT: `@keyframes modalFadeIn`, `@keyframes cardSlideUp`
  - NOT: Generic `@keyframes fadeIn` that may conflict with existing animations
  - WHY: Later definitions override earlier ones, causing positioning bugs

- [ ] **JavaScript Style Reset Restores Defaults:** Close/reset functions restore original styles
  - CORRECT: `el.style.border = '1px solid var(--border-medium)';`
  - NOT: `el.style.border = '';` (clears styling entirely)
  - WHY: Empty string removes inline styles, may lose intentional styling

- [ ] **Nested Element Contrast:** Pills/tags inside cards have visible contrast
  - CORRECT: `background: var(--bg-primary); border: 1px solid var(--border-medium);`
  - NOT: `background: var(--bg-tertiary);` alone (may be too similar to card)
  - WHY: Border provides visual distinction when backgrounds are similar

- [ ] **Centered Modal Pattern:** Centered modals use correct positioning
  - CORRECT: `top: 50%; left: 50%; transform: translate(-50%, -50%);`
  - CORRECT: Animation keyframes INCLUDE the transform: `from { transform: translate(-50%, -50%) scale(0.95); }`
  - NOT: Bottom sheet positioning for centered dialogs
  - NOT: Animation that loses the centering transform

- [ ] **Bottom Sheet Pattern:** Bottom sheets use correct positioning
  - CORRECT: `bottom: 0; left: 0; right: 0;` with `border-radius: var(--radius-xl) var(--radius-xl) 0 0;`
  - CORRECT: Includes drag handle (gray bar at top)
  - CORRECT: Uses `animation: slideUp` with `translateY(100%)` start

## Validation Commands

### Quick Check - Nav Labels
Search for any English labels:
```
grep -E "Home|Analytics|History|Settings" [file.html]
```
Expected: No matches

### Quick Check - Hex Colors
Search for hardcoded colors:
```
grep -E "#[0-9a-fA-F]{3,6}" [file.html] | grep -v "fonts.googleapis"
```
Expected: No matches (except font URLs)

### Quick Check - Center Icon
Verify camera icon present:
```
grep "M14.5 4h-5L7 7H4" [file.html]
```
Expected: 1 match

## Failure Actions

### If CRITICAL Check Fails
1. STOP - Do not save the file
2. Identify the violation
3. Fix using exact snippet from reference
4. Re-run validation

### If HIGH Check Fails
1. Identify which component is wrong
2. Load design-system-reference.md
3. Copy exact component from reference
4. Replace incorrect component
5. Re-run validation

### If MEDIUM/LOW Check Fails
1. Note the issue
2. Fix if simple
3. Can proceed with warning to user
