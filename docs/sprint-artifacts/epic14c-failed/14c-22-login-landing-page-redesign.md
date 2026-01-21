# Story 14c.22: Login/Landing Page Redesign with Logo Options

**Status**: backlog
**Points**: 8
**Priority**: Medium
**Dependencies**: None (standalone UX story)

---

## Story

As a user opening the app for the first time,
I want to see an attractive, welcoming login/landing page with a distinctive logo,
So that I have a positive first impression of the app and understand what it offers before signing in.

---

## Background

The current LoginScreen is functional but basic:
- Dark gradient background
- Generic Receipt icon in a gradient box
- "Expense Tracker" title
- "Smart Receipt Scanning & Analytics" tagline
- Google sign-in button

This story involves a **two-phase approach**:
1. **Phase 1 (UX Design)**: Create multiple design options for both the login screen and the logo
2. **Phase 2 (Implementation)**: Implement the chosen design after user review

### Current State

```
┌────────────────────────────────┐
│                                │
│      [Receipt Icon Box]        │
│                                │
│     Expense Tracker            │
│   Smart Receipt Scanning       │
│       & Analytics              │
│                                │
│      [ Sign In Button ]        │
│                                │
└────────────────────────────────┘
```

---

## Acceptance Criteria

### Phase 1: UX Design

#### AC1: Login Screen Design Options
- Given the UX design phase
- When creating mockups
- Then create at least 3 different login/landing page design options
- And each option should have a distinct visual style
- And document the design rationale for each option

#### AC2: Logo Design Options
- Given the UX design phase
- When creating logo mockups
- Then create at least 3 different logo concepts
- And each logo should work at multiple sizes (favicon, header, splash)
- And consider both light and dark backgrounds
- And the logo should reflect the app's purpose (expense/receipt tracking)

#### AC3: Design Documentation
- Given the design options are complete
- When presenting to stakeholder
- Then provide side-by-side comparison
- And include pros/cons for each option
- And recommend a preferred option with rationale

### Phase 2: Implementation

#### AC4: Selected Design Implementation
- Given a design option has been chosen
- When implementing the login screen
- Then match the approved mockup exactly
- And ensure responsive layout (mobile, tablet, desktop)
- And maintain accessibility standards

#### AC5: Logo Integration
- Given a logo has been chosen
- When implementing the logo
- Then replace the generic Receipt icon with the new logo
- And update favicon if different from current
- And ensure logo looks good on both light/dark backgrounds

#### AC6: Animation & Polish
- Given the login screen is implemented
- When the page loads
- Then add subtle entrance animations (following existing animation system)
- And ensure smooth transitions
- And maintain performance (no layout shift)

---

## Tasks / Subtasks

### Task 1: UX Research & Inspiration (Phase 1)

- [ ] 1.1 Research modern fintech/expense app login screens
- [ ] 1.2 Identify key visual elements (gradients, illustrations, icons)
- [ ] 1.3 Document inspiration sources

### Task 2: Logo Design Options (Phase 1)

- [ ] 2.1 Create Logo Option A: Abstract/geometric approach
- [ ] 2.2 Create Logo Option B: Icon-based approach (receipt/money themed)
- [ ] 2.3 Create Logo Option C: Typography-focused approach
- [ ] 2.4 Create variations for each (color, monochrome, small/large)
- [ ] 2.5 Test logos at different sizes (16px favicon, 48px header, 120px splash)

### Task 3: Login Screen Design Options (Phase 1)

- [ ] 3.1 Create Screen Option A: Minimalist/clean
- [ ] 3.2 Create Screen Option B: Illustrated/friendly
- [ ] 3.3 Create Screen Option C: Bold/gradient-focused
- [ ] 3.4 Include each logo option in screen mockups
- [ ] 3.5 Consider mobile-first responsive layouts

### Task 4: Design Review & Selection

- [ ] 4.1 Present options to stakeholder
- [ ] 4.2 Gather feedback and iterate if needed
- [ ] 4.3 Document final selection with rationale
- [ ] 4.4 Create final high-fidelity mockup

### Task 5: Implementation (Phase 2)

- [ ] 5.1 Update LoginScreen.tsx with new design
- [ ] 5.2 Add new logo component or asset
- [ ] 5.3 Update favicon and PWA icons if needed
- [ ] 5.4 Add entrance animations
- [ ] 5.5 Test on multiple screen sizes

### Task 6: Tests & Verification (Phase 2)

- [ ] 6.1 Visual regression test for login screen
- [ ] 6.2 Accessibility audit (contrast, touch targets)
- [ ] 6.3 Performance check (no CLS, fast LCP)

---

## Design Considerations

### Logo Requirements

1. **Scalability**: Must work from 16px (favicon) to 200px+ (splash)
2. **Versatility**: Good on light, dark, and colored backgrounds
3. **Memorability**: Distinctive but professional
4. **Relevance**: Conveys expense tracking, receipts, or financial awareness
5. **Simplicity**: Recognizable at small sizes

### Login Screen Requirements

1. **First Impression**: Welcoming, trustworthy, professional
2. **Clear CTA**: Sign-in button should be prominent
3. **Brand Identity**: Consistent with app theme/colors
4. **Information Hierarchy**: App name > value prop > sign-in action
5. **Accessibility**: Min 4.5:1 contrast ratio, 44px touch targets

### Suggested Design Themes

| Theme | Description | Vibe |
|-------|-------------|------|
| **Clean Modern** | White/light background, subtle gradients, minimalist | Professional, trustworthy |
| **Friendly Illustrated** | Soft colors, simple illustrations, rounded shapes | Approachable, fun |
| **Bold Gradient** | Vivid gradients, strong typography, geometric | Energetic, modern |
| **Cozy Finance** | Warm colors, comforting imagery, soft shadows | Personal, non-intimidating |

---

## Mockup Locations

Phase 1 deliverables should be placed in:
```
docs/uxui/mockups/login-redesign/
├── logos/
│   ├── option-a-geometric.svg
│   ├── option-b-icon.svg
│   ├── option-c-typography.svg
│   └── variations/
├── screens/
│   ├── option-a-minimalist.html
│   ├── option-b-illustrated.html
│   ├── option-c-bold.html
│   └── responsive-variations/
└── comparison-summary.md
```

---

## App Name Consideration

The current app uses "Expense Tracker" as a generic name. Consider whether the redesign should:
1. Keep "Expense Tracker" (generic, descriptive)
2. Use "BoletApp" (project codename, means "Receipt App" in Spanish)
3. Introduce a new brand name (requires separate discussion)

**Note**: This story focuses on visual design. Renaming is out of scope but the design should accommodate the chosen name.

---

## Definition of Done

### Phase 1 (UX Design)
- [ ] At least 3 logo design options created
- [ ] At least 3 login screen design options created
- [ ] Design comparison document completed
- [ ] User has reviewed and selected preferred option
- [ ] Final mockup approved

### Phase 2 (Implementation)
- [ ] LoginScreen.tsx updated with new design
- [ ] New logo integrated
- [ ] Favicon/PWA icons updated if needed
- [ ] Entrance animations added
- [ ] Responsive on all screen sizes
- [ ] Accessibility standards met
- [ ] Code review approved

---

## File List (Implementation Phase)

| File | Change |
|------|--------|
| `src/views/LoginScreen.tsx` | Redesigned UI |
| `public/favicon.ico` | Updated if logo changes |
| `public/logo*.png` | PWA icons if logo changes |
| `src/assets/logo.svg` | **NEW** - Vector logo asset |
| `docs/uxui/mockups/login-redesign/` | **NEW** - Design mockups |

---

## Notes

- This is a creative story that requires iteration between design and stakeholder
- Phase 1 should be completed before Phase 2 begins
- Consider using the existing design-system-mockup-builder workflow for consistency
- The logo may be used elsewhere in the app (header, splash screen, about page)

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-20 | Story created | User + Claude |
