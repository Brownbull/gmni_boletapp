# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Sync: 2026-01-07
> Last Optimized: 2026-01-06 (Generation 1)
> Sources: Epic retrospectives, code reviews, Story 14.22, Story 14.14b, Story 14.15b, Story 14.23

## What Worked Well

| Lesson | Context | Source |
|--------|---------|--------|
| PRD + Tech-Spec Workflow | Essential for UX-heavy epics | Epic 7, 9 |
| Story-to-Story Knowledge Transfer | Dev records enable pattern reuse | Epic 8, 9 |
| Code Review Discipline | All stories get adversarial reviews | All Epics |
| High Velocity | 7+ points/day with good planning | Epic 8, 9 |
| Parallel CI Jobs | 63% faster after Epic 8 optimization | Epic 8 |
| Mockup-First Workflow | Design before implementation for UX | Epic 13 |
| Persona-Driven Design | María, Diego, Rosa, Tomás inform decisions | Epic 13 |
| Single Source of Truth Schema | Categories/currencies in shared/schema/ | Story 14.15b |
| Token Optimization | V3 prompt 21% smaller than V2 | Story 14.15b |
| Unified View Pattern | Consolidate similar views with mode prop | Story 14.23 |

## What Failed / What to Avoid

| Failure | Root Cause | Prevention |
|---------|------------|------------|
| Git Branch Divergence | Squash merges create sync issues | Merge commits for sync PRs |
| Bundle Size Growth | At 2.0 MB, CRITICAL | Code-splitting (deferred to Epic 15) |
| Unsafe Regex Patterns | ReDoS in sanitize.ts | Use simple non-greedy patterns |
| API Key Leak | Hardcoded in code | Always use env variables |
| Scope Creep | Epics grow 7→21 stories | Better upfront scoping |

## Hard-Won Wisdom

### Security
- **API Key Leaks**: Create fresh branch, don't rewrite history. GitGuardian checks full history.
- **ReDoS Prevention**: Avoid nested quantifiers. BAD: `(?:(?!<\/script>)<[^<]*)*`. GOOD: `[\s\S]*?`

### Git Strategy
- **3-Branch Workflow**: `feature/* → develop → staging → main`
- Merge commits for sync PRs (not squash)
- Hotfixes backported immediately to all branches

### Firestore
- **Defensive Timestamps**: Always use try/catch with `?.toDate?.()?.getTime?.()`
- **serverTimestamp()**: Use separate `*Create` interface with `FieldValue` for writes

### Time Period Navigation (Story 14.14b)
- **Cascade on Granularity Change**: When user switches from coarse to fine granularity (e.g., Quarter→Month), set to FIRST unit of current period, not first unit of year
  - Q3 → Month = **July** (first month of Q3), not January
  - Year → Quarter = Q1; Year → Month = January
  - Month → Week = Week 1 of current month
- **Preserve Context on Drill-Up**: When going from fine to coarse (Month→Year), keep current values
- **Reference**: `TrendsView.tsx` `setTimePeriod()` callback (~lines 1840-1943)

### CI/CD (Story 14.22)
- **Gitleaks Parallelized**: Separate job runs ~8s alongside setup (~3min)
- Setup uses shallow clone; only gitleaks needs `fetch-depth: 0`
- Total PR time: ~6 min

### AI Prompt Optimization (Story 14.15b)
- **V3 Prompt Production**: 21% token reduction (~229 tokens/scan) vs V2
- **Currency Auto-Detection**: AI detects from receipt symbols/text, no app hint needed
- **Single Source of Truth**: Categories in `shared/schema/categories.ts` (36 store + 39 item)
- **Rule #10 Pattern**: "MUST have at least one item" - handles parking, utilities, single-charge receipts
- **Legacy Normalization**: Map old categories at read time (Fresh Food → Produce, Drinks → Beverages)
- **Prebuild Pattern**: `functions/package.json` copies prompts + schema, fixes import paths via sed
- **Cost Savings**: ~$17/month at 1M scans
- **Reference**: `prompt-testing/TOKEN-ANALYSIS.md`, `story-14.15b-v3-prompt-integration.md`

### Unified View Pattern (Story 14.23)
- **Mode Prop Pattern**: Use `mode: 'new' | 'existing'` to differentiate behaviors in single component
- **State Machine for UI**: Scan button states (idle→pending→scanning→complete→error) drive visual feedback
- **Gradual Migration**: Comment out old views with deprecation notice, don't delete immediately
- **Preserve Navigation State**: Check `pendingScan.status` to restore correct state when user returns
- **Parent-Managed State**: Keep transaction/scan state in App.tsx, pass callbacks to view
- **Reference**: `src/views/TransactionEditorView.tsx`, `story-14.23-unified-transaction-editor.md`

### Single Active Transaction Pattern (Story 14.24 - Planned)
- **One Transaction Rule**: Only one transaction can be in edit mode at any time
- **Credit Reserve Pattern**: Reserve credit when scan starts, confirm on success, refund on error
- **State Persistence**: Form changes and images persist across navigation
- **Conflict Detection**: Show dialog when user tries to edit while another is active
- **Read-Only First**: Transaction list opens read-only view; "Edit" button to enter edit mode
- **Reference**: `story-14.24-persistent-transaction-state.md`

---

## Pattern Reference (92 patterns consolidated)

### Animation & Motion (#35-48, #56-64)
| Pattern | Summary |
|---------|---------|
| Duration Constants | Use `DURATION.FAST/NORMAL/SLOWER` from constants.ts |
| No CSS Transition with RAF | requestAnimationFrame provides interpolation; don't double up |
| Reduced Motion | Check `useReducedMotion()` before all animations |
| Global CSS Keyframes | Define in index.html, not inline JSX (performance) |
| Entry Animation | Use `isVisible` state + useEffect with small delay |
| Staggered Reveal | TransitionChild with indices 0-N, cap at MAX_DURATION |
| useCountUp Hook | Animates 0→target with ease-out, respects reduced motion |

### React Patterns (#17-27, #53-55, #67-69)
| Pattern | Summary |
|---------|---------|
| Extract Shared Utils | If >2 components use same logic, create shared util |
| Single Canonical Type | Define once in hook, re-export from components |
| useCallback for Convenience | Wrap hook functions with proper deps |
| Unused State with Refs | Prefix with underscore: `_batchCancelRequested` |
| Hook Wrapper for Services | Service = pure logic, hook = React state |
| **Time Period Cascade** | When switching granularity, adjust related values (Q3→Month = July, not January) |

### SVG & Charts (#49-52, #62-64)
| Pattern | Summary |
|---------|---------|
| Unique SVG IDs | Use `useMemo(() => \`prefix-${random}\`, [])` for gradients/filters |
| Transform Origin | Set `transformOrigin: 'center center'` for scaling |
| Keyboard Navigation | If onClick exists, add onKeyDown for Enter/Space |
| Test Keyboard A11y | `fireEvent.keyDown(el, { key: 'Enter' })` must trigger action |

### CSS & Theming (#70-72, #87-90)
| Pattern | Summary |
|---------|---------|
| Safe Area Insets | `env(safe-area-inset-top/bottom)` for fixed headers/nav |
| Header Variants | Use variant prop (`home|detail|settings`) not boolean flags |
| Mono Theme | `--accent` MUST be grayscale (zinc-600/400) |
| Three Themes | `:root`, `.dark`, `[data-theme="X"]`, `[data-theme="X"].dark` |
| Viewport Units | Use `h-[100dvh]` not `min-h-dvh` for fixed viewport |

### Testing (#23-27)
| Pattern | Summary |
|---------|---------|
| localStorage Mock | Use `vi.stubGlobal('localStorage', mockObj)` in happy-dom |
| Timestamp Mock | Create factory with `toDate()`, `seconds`, `nanoseconds` |
| Test New Components | Every new `.tsx` file needs corresponding test file |
| Verify App.tsx Integration | Components exist but may be unreachable without routing |

### Mobile/PWA (#20-22, #65-69)
| Pattern | Summary |
|---------|---------|
| Haptic Feedback | `navigator.vibrate(10)` with reduced motion check |
| Swipe Direction Lock | Lock after 10px movement to prevent scroll conflict |
| Long-press Detection | Use pointer events, store timeout in useRef |

### Mockup/Design (#28-34, #74)
| Pattern | Summary |
|---------|---------|
| Gastify Branding | User-facing app is "Gastify", not "Boletapp" |
| CLP Format | Dot separator: $45.200 (not $45,200) |
| Carousel Integration | 3-level: container → wrapper (overflow:hidden) → track + indicator |
| Centered Modal | `top:50%; left:50%; transform:translate(-50%,-50%)` with matching keyframes |
| Canonical Mockup | Reference home-dashboard.html as source of truth |

### Documentation (#85-86)
| Pattern | Summary |
|---------|---------|
| AC Claims Match Implementation | Update ACs when mockup-driven changes relocate features |
| Story Artifacts Accuracy | Update file lists, test counts, section headers on review |

---

## UX Design Principles (Epics 13-15)

### The Gastify Voice
- **Observes without judging**: "Restaurants up 23%" not "You overspent"
- **Reveals opportunity**: Trade-off visibility without guilt
- **Celebrates progress**: Personal records, milestones
- **Normalizes setbacks**: "La vida es rara. Los datos también."

### Key Design Patterns
- **Dynamic Polygon**: 3-6 sided spending shape
- **Expanding Lava**: Inner polygon = spending, outer = budget (inverted)
- **"Everything Breathes"**: Motion system with subtle animations
- **"Intentional or Accidental?"**: Non-judgmental spending prompts

---

## Team Agreements

1. Pre-flight sync check before epic deployments
2. Hotfixes backported immediately to all branches
3. Merge commits for sync PRs (not squash)
4. Architecture decisions before UX changes
5. Mockups before implementation for UX work
6. Every epic ends with deployment story
7. Brainstorming before major UX redesigns

---

## Sync Notes

- **Generation 1 Optimization (2026-01-06)**: Consolidated 92 patterns from 67KB to ~15KB
- Patterns organized by category with summary tables
- Full pattern details available in backup: `backups/v1/knowledge/06-lessons.md`
- Code examples removed (reference source files instead)
