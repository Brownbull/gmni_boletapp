# Build Mockup Screen - Validation Checklist

Use this checklist to validate that a mockup screen correctly uses the design system.

## Pre-Build Validation

- [ ] Design system file was loaded BEFORE any building started
- [ ] All components used exist in the design system
- [ ] No new components were invented during the build

## Design Token Usage

### Colors
- [ ] All colors reference CSS variables (--primary, --secondary, etc.)
- [ ] No hardcoded hex colors in component styles
- [ ] Theme variables are used correctly

### Spacing
- [ ] Spacing uses --space-X variables where defined
- [ ] Consistent with design system spacing scale

### Typography
- [ ] Font family uses --font-family variable
- [ ] Font sizes match design system scale
- [ ] Font weights match design system definitions

### Border & Shadow
- [ ] Border radii use --radius-X variables
- [ ] Shadows use --shadow-X variables
- [ ] Border colors use --border-X variables

## Navigation Components

### Bottom Navigation
- [ ] Uses exact .bottom-nav class from design system
- [ ] Uses exact .nav-item class structure
- [ ] Labels are in SPANISH: Inicio, Analíticas, Ideas, Ajustes
- [ ] Center button uses CAMERA icon (not scan/barcode)
- [ ] Camera icon SVG path: `M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z` + `circle cx="12" cy="13" r="3"`
- [ ] Ideas icon uses lightbulb SVG from design system
- [ ] Ajustes icon uses sun/settings SVG from design system
- [ ] scan-center margin-top is -56px (top-aligned)

### Top Bar
- [ ] Uses exact .top-bar class from design system
- [ ] G logo: 28px, rounded, gradient background, Baloo 2 font
- [ ] Gastify wordmark: 20px, Baloo 2 font, var(--text-primary)
- [ ] Menu button: 36x36px, var(--bg-secondary), var(--radius-md)
- [ ] Hamburger icon: 18x18px, stroke var(--text-primary)

## Component Structure

### HTML Structure
- [ ] Component HTML matches design system exactly
- [ ] No extra wrapper divs added
- [ ] No missing required elements
- [ ] Correct element nesting

### CSS Classes
- [ ] All class names match design system
- [ ] No invented class names
- [ ] Active states use correct classes (.active)

### SVG Icons
- [ ] All icons use exact SVG paths from design system
- [ ] ViewBox is 0 0 24 24 (or as specified)
- [ ] Stroke and fill attributes match design system

## Content Validation

### Text Content
- [ ] Placeholder text is appropriate
- [ ] Labels match design system language (Spanish where specified)
- [ ] No Lorem Ipsum where real content is defined

### Layout
- [ ] Screen uses defined layout patterns
- [ ] Component spacing matches design system
- [ ] Responsive considerations followed (if any)

## Final Checks

- [ ] File renders correctly in browser
- [ ] No console errors
- [ ] Visual appearance matches design system reference
- [ ] Theme switching works (if implemented)

## Common Violations to Watch For

| Violation | Correct Solution |
|-----------|------------------|
| English nav labels | Use: Inicio, Analíticas, Ideas, Ajustes |
| Barcode/scan icon | Use: Camera icon with lens |
| History/clock icon | Use: Lightbulb for Ideas |
| Gear icon for settings | Use: Sun icon for Ajustes |
| Hardcoded colors | Use: CSS variables |
| margin-top: -32px | Use: margin-top: -56px for scan-center |
| padding: 12px 16px | Use: padding: 14px 16px for top-bar |
| Inventing new styles | Copy exactly from design system |

## Severity Levels

**CRITICAL** - Must fix before saving:
- Wrong nav labels (language mismatch)
- Wrong icons
- Inventing components not in design system

**HIGH** - Should fix:
- Hardcoded colors instead of variables
- Wrong spacing values
- Missing CSS classes

**MEDIUM** - Consider fixing:
- Minor spacing differences
- Extra wrapper elements

**LOW** - Optional:
- Code formatting
- Comment style
