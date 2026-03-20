# Design System Playbook — Portable Template

**Version:** 1.0.0
**Origin:** Gustify (Khujta AI) — first validated run 2026-03-19
**Purpose:** Replicate the full mockup-to-design-system workflow for any new app.

---

## How to Use

1. Copy this file + `_templates/` folder into your new project's `docs/design/`
2. Replace `{{APP_NAME}}`, `{{APP_DOMAIN}}`, `{{SCREENS}}` placeholders
3. Follow the phases in order — each has a GATE before proceeding

---

## Phase 0: Setup (30 min)

**Input:** PRD or feature list with screen inventory
**Output:** Customized MOCKUP-PLAN.md + style prompts

### Steps
1. List all screens from the PRD (existing + planned)
2. Copy `_templates/MOCKUP-PLAN-TEMPLATE.md` → `docs/mockups/MOCKUP-PLAN.md`
3. Fill in the screen inventory, replacing Gustify screens with yours
4. Copy `_templates/styles/` → `docs/mockups/styles/`
5. Edit each `.prompt` file: replace app name, domain language, navigation structure

### Files to create
```
docs/mockups/
  MOCKUP-PLAN.md
  styles/
    organic.prompt
    neobrutalism.prompt
    playfulgeometric.prompt
    botanical.prompt
    sketch.prompt
    bauhaus.prompt
```

---

## Phase 1: Style Discovery (1 session)

**Input:** 6 style prompts + 1 representative screen
**Output:** 6 HTML mockups → 3 finalists → stress test → 1 winner
**GATE:** User picks the winning style

### Steps
1. Pick 1 screen that represents the app's core (data + interaction + emotion)
2. Generate that screen in all 6 styles (parallel agents, one per style)
3. User reviews → picks 3 finalists
4. Stress test: generate 3 more screens (one data-dense, one visual, one form-heavy) in each finalist style = 9 mockups
5. User picks the winner

### Agent prompt template
```
Generate a self-contained HTML mockup of the {{SCREEN_NAME}} screen for {{APP_NAME}}.
Use the design system defined in this prompt file: [paste style prompt content]
The mockup should:
- Be inside a phone frame (420px max-width) on a dark background
- Include multiple data states (hero + empty + error)
- Be fully interactive (click to toggle, etc.)
- Use Spanish/[target language] labels
- Include interaction notes as an HTML comment at the bottom
```

### Decision record
```markdown
**Style Decision:** {{STYLE_NAME}}
**Date:** {{DATE}}
**Stress tested on:** {{SCREEN_1}}, {{SCREEN_2}}, {{SCREEN_3}}
**Runner-up:** {{RUNNER_UP}}
**Reason:** {{WHY_THIS_ONE}}
```

---

## Phase 2: User Flows (1 session)

**Input:** App's primary user journeys (3-5)
**Output:** Interactive HTML flow diagrams

### Steps
1. Identify 3-5 primary user journeys from the PRD
2. For each flow, define: entry point → screens visited → decision points → success state
3. Generate each as a self-contained HTML diagram (parallel agents)
4. Review for completeness — does every screen appear in at least one flow?

### Standard flows to consider
| Flow | Pattern | Example |
|------|---------|---------|
| First-time user | Onboarding → first success | Sign up → setup → first action |
| Daily use | Quick task completion | Open → do thing → close |
| Discovery | Exploration of features | Browse → find → engage |
| External trigger | Data arrives from outside | Notification → review → act |
| Recovery | Something needs fixing | Alert → diagnose → resolve |

---

## Phase 3: Screen Mockups (1-2 sessions)

**Input:** Screen inventory + winning style
**Output:** All screens as HTML mockups with data states

### Steps
1. Generate existing/implemented screens first (parallel agents, one per screen)
2. Mini-review: do they feel cohesive? Same nav, same spacing, same palette?
3. Generate planned/future screens
4. Each mockup must include:
   - Hero state (most common)
   - Empty state
   - Loading state
   - Error state (where applicable)
   - Interaction notes

### Data states checklist per screen
```
[ ] Hero (populated, typical use)
[ ] Empty (first-time / no data)
[ ] Loading (skeleton or spinner)
[ ] Error (API failure, timeout)
[ ] Edge case (long text, many items, zero results)
```

---

## Phase 4: Brand & Identity (1 session)

**Input:** App name, domain, personality
**Output:** Logo, typography, icon system decisions

### Steps
1. **Logo exploration** — generate 6+ concepts (Gemini or CSS/SVG)
   - Create an icon iteration playground for interactive refinement
   - Decide on: concept, color, text overlay, effects
2. **Typography exploration** — test 15+ fonts for app name + brand mark
   - Create a typography playground with live text input + case options
3. **Icon system** — decide on generation approach
   - Options: emoji, pixel art (PixelLab), vector, icon library
   - For custom: define style, size, generation pipeline
4. **Generate production assets** — favicon.svg, PWA icons, apple-touch-icon

### Decision records to capture
- Logo: concept + color + text + typography + effects
- Typography: app name font, brand font, UI heading font
- Icon system: style + generation method + inventory
- Color palette: primary, secondary, accent, semantic colors

---

## Phase 5: Design Hub (30 min)

**Input:** All mockups, flows, explorations, decisions
**Output:** `index.html` — the living design system hub

### Structure (4 sections)
1. **Decisions** — logo preview, typography stack, color swatches, links to explorations
2. **Screen Design Progress** — 4-pass tracking matrix (P1-P4 dots per screen)
3. **User Flows** — links to flow diagrams
4. **Design Explorations** — links to interactive playgrounds

### Copy the hub template
Copy `_templates/design-hub-template.html` → `docs/mockups/{{style-name}}/index.html`

---

## Phase 6: 4-Pass Refinement (ongoing)

**Input:** Each screen mockup at Pass 1
**Output:** Screens refined through all 4 passes

### The 4 passes
| Pass | Focus | Deliverable |
|------|-------|-------------|
| **1. Structure** | Layout, sections, component slots, hierarchy | Grey-box wireframe with correct IA |
| **2. Design System** | Tokens applied: colors, spacing, typography, Tailwind | Styled mockup matching design system |
| **3. Polish** | Alignment, whitespace, visual hierarchy, shadows | Pixel-refined mockup |
| **4. UX Details** | States, hover, transitions, micro-interactions | Production-ready reference |

### When to advance a screen
- P1 → P2: when the layout is approved (component slots are right)
- P2 → P3: when tokens match the design system (no invented colors/spacing)
- P3 → P4: when a developer could implement it without guessing
- P4 → Done: when loading/empty/error states + interactions are specified

---

## Adversarial Reviews (at each gate)

Run these reviews at transitions between phases:

### UX Designer checklist
- [ ] User flows defined before screens?
- [ ] Empty/error/loading states for every screen?
- [ ] Cross-screen navigation consistency?
- [ ] Mobile-specific patterns (safe areas, thumb zones, gestures)?
- [ ] Content stress test (long names, many items)?

### QA Tester checklist
- [ ] Data state matrix defined per screen?
- [ ] Visual regression baseline exists?
- [ ] E2E test requirements identified upfront?
- [ ] Accessibility validation (contrast, touch targets, ARIA)?

---

## Recommended Tooling

Tools that proved valuable during the Gustify run, ranked by impact.

### Essential (used on every project)

| Tool | Phase | What it does | Cost | Setup |
|------|-------|-------------|------|-------|
| **Claude Code agents** | All | Parallel HTML mockup generation, adversarial reviews, code generation | Claude subscription | Already available |
| **Google Fonts** | Brand | Typography exploration and loading | Free | CDN link |
| **Web Asset Generator** skill | Brand | Favicon, PWA icons, apple-touch-icon from SVG | Free | `/web-asset-generator` skill |

### Recommended (used on most projects)

| Tool | Phase | What it does | Cost | Setup |
|------|-------|-------------|------|-------|
| **Penpot** + MCP | Polish, Collaboration | Open-source design canvas, CSS export, collaborative editing | Free | `penpot-mcp` server on localhost:4401 |
| **PixelLab MCP** (Pixflux) | Icons | Custom pixel-art icon generation at 32x32 | Free tier (40 fast/day) | `.mcp.json` config |
| **Pencil.dev** | In-IDE design | .pen files in VS Code, AI-assisted design | Free (early access) | VS Code extension |

### Optional (situational)

| Tool | Phase | What it does | Cost | Setup |
|------|-------|-------------|------|-------|
| **21st.dev Magic MCP** | Components | React component generation/refinement | API key | `npx @21st-dev/magic` |
| **remove.bg API** | Brand | Background removal for logo cleanup | Free tier (50/mo) | API key in env |

### Not recommended (tested, low value)

| Tool | Why not | Alternative |
|------|---------|-------------|
| **Nanobanana + Gemini image gen** | Logo output too generic, required heavy iteration; the CSS/SVG icon playground produced better results faster | Use the Icon Iteration Playground (custom HTML) for logo work |

---

## Reference Materials from Gustify

These Gustify artifacts serve as **living examples** for future projects. Copy and adapt, don't recreate from scratch.

### Design Hub & Index
| Reference | Location | Reuse as |
|-----------|----------|----------|
| Design Hub (production) | `gustify/docs/mockups/playful-geometric/index.html` | Template for any app's design system hub |

### Screen Mockups (patterns to copy)
| Reference | Location | Why it's useful |
|-----------|----------|-----------------|
| Home Dashboard | `playful-geometric/screens/playfulgeometric-home.html` | Proficiency card, expiring carousel, recipe suggestions — common dashboard pattern |
| Pantry (5 states) | `playful-geometric/screens/playfulgeometric-pantry.html` | Best example of hero + empty + loading + error + filtered states |
| Login (4 states) | `playful-geometric/screens/playfulgeometric-login.html` | First-time welcome, loading, error, default — auth screen pattern |
| Map Items (3 states) | `playful-geometric/screens/playfulgeometric-map-items.html` | Data import/mapping flow — picker modal, progress, success celebration |

### User Flows (patterns to copy)
| Reference | Location | Why it's useful |
|-----------|----------|-----------------|
| First-time user journey | `playful-geometric/flows/flow-01-first-cook.html` | Best template for onboarding flows: phases, decision diamonds, key moments |
| Cross-app integration | `playful-geometric/flows/flow-04-gastify-update.html` | Auto-resolve vs manual mapping branching pattern |
| Urgency/rescue flow | `playful-geometric/flows/flow-05-expiring-rescue.html` | Emotional arc: concern → action → satisfaction |

### Design Explorations (interactive playgrounds)
| Reference | Location | Why it's useful |
|-----------|----------|-----------------|
| Icon Iteration Playground | `playful-geometric/explorations/exploration-icon-iterations.html` | Logo customizer with color picker, text overlay, effects, steam patterns, live preview — reuse for any logo refinement |
| Typography Exploration | `playful-geometric/explorations/exploration-typography.html` | Live text input, 6 case options, 15+ fonts, login preview — reuse for brand typography |
| Icon Styles Explorer | `playful-geometric/explorations/exploration-icon-styles.html` | Dual-style icon system comparison — reuse for icon system decisions |
| CSS Icon Concepts | `playful-geometric/explorations/exploration-login-icons.html` | 12 pure CSS/SVG icon concepts — quick logo brainstorming without AI image generation |

### Style Prompts
| Reference | Location | Why it's useful |
|-----------|----------|-----------------|
| 6 style prompt files | `docs/mockups/styles/*.prompt` | Complete design system specifications — drop into any agent prompt |
| Style stress test outputs | `docs/mockups/styles/output/` | See how each style handles different screen types (data-dense, visual, form) |

---

## Template Files Reference

```
_templates/
  MOCKUP-PLAN-TEMPLATE.md    — Screen inventory + phase tracking
  design-hub-template.html   — Design hub index page
  styles/                    — 6 style prompt files
    organic.prompt
    neobrutalism.prompt
    playfulgeometric.prompt
    botanical.prompt
    sketch.prompt
    bauhaus.prompt
```

---

## Value: V7 — Visible Kitchen

This playbook serves V7: *"If you can see the dish before you cook, you won't burn it."*

The value is about the user experiencing ONE coherent app. The playbook is the skill that delivers it. Every screen gets designed before it's built. Every design follows the same tokens. Every developer has a reference to build against.

Without V7, each screen is a gamble. With V7, the design system is the contract.
