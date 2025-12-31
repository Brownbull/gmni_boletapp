# Story 13.13: Mockup - Settings

**Epic:** Epic 13 - UX Design & Mockups
**Status:** Ready for Dev
**Story Points:** 2
**Type:** Design/Mockup
**Dependencies:** Stories 13.1-13.3 (foundation docs)

---

## User Story

As a **user configuring the app**,
I want **simplified settings with progressive disclosure**,
So that **I can quickly adjust common options without being overwhelmed by power-user features**.

---

## Acceptance Criteria

- [ ] **AC #1:** Progressive disclosure mockup (simple default, expandable advanced)
- [ ] **AC #2:** Theme selector mockup (Lava, Cats, Dogs)
- [ ] **AC #3:** Simplified vs expanded states shown

---

## Key Elements to Design

### Progressive Disclosure
- **Default View:** Most common settings visible
- **Advanced View:** Power-user options hidden behind "Más opciones"
- Clear visual hierarchy
- Smart defaults reduce need for configuration

### Common Settings (Always Visible)
- Language selection
- Currency preference
- Theme selection
- Notifications toggle
- Data export

### Advanced Settings (Hidden by Default)
- Category mappings management
- Merchant mappings management
- Subcategory mappings
- Trusted merchants
- Data management (wipe, backup)

### Theme Selector
- Visual preview of each theme
- **Lava:** Warm gradients (default for Epic 13+)
- **Cats:** Chilean market theme
- **Dogs:** Chilean market theme
- Light/Dark mode toggle within theme

---

## Design States

### Simplified (Default)
- 5-6 visible settings
- "Más opciones" expander at bottom
- Clean, uncluttered

### Expanded
- All settings visible
- Grouped by category
- "Menos opciones" collapser

### Theme Preview
- Mini preview of each theme
- Current theme highlighted
- Apply button

---

## Motion Design Exception

Per Motion Design System (Story 13.3):
- Settings loads **instantly** (no animations)
- Efficiency over delight for utilitarian screens
- Transitions within settings still smooth

---

## Deliverable

**File:** `docs/uxui/mockups/settings.excalidraw` or Figma

**Include:**
- Simplified view mockup
- Expanded view mockup
- Theme selector modal/panel
- Theme preview cards

---

## Definition of Done

- [ ] Progressive disclosure designed
- [ ] Simplified and expanded states shown
- [ ] Theme selector complete
- [ ] Theme previews designed
- [ ] Reviewed by Gabe

---

## Context References

- **UX Spec Section 10.7:** Theme System Extension
- **Epic Definition:** Story 13.11 in [epic-13-ux-design-mockups.md](./epic-13-ux-design-mockups.md)
- **Motion Spec:** Story 13.3 (Settings exception)

---

## Change Log

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-23 | 1.0 | Story drafted |
