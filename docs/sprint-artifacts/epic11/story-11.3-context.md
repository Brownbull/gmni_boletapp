# Story 11.3 Context: Animated Item Reveal

## Quick Reference

| Field | Value |
|-------|-------|
| Story | [story-11.3-animated-item-reveal.md](./story-11.3-animated-item-reveal.md) |
| Epic | 11 - Quick Save & Scan Flow Optimization |
| Points | 3 |
| Status | Ready for Dev |
| Depends On | 11.2 (Quick Save Card) |
| Parallel | 11.4 (Trust Merchant) |

## Key Files to Create

- `src/components/scan/AnimatedItemReveal.tsx` - Animation component
- `src/hooks/useStaggeredReveal.ts` - Animation hook
- `src/hooks/useReducedMotion.ts` - Accessibility hook

## Key Files to Modify

- `src/components/scan/QuickSaveCard.tsx` - Use AnimatedItemReveal
- `src/config/constants.ts` - Animation timing constants

## Architecture Alignment

- CSS-first animations (GPU-accelerated)
- Respects `prefers-reduced-motion`
- No blocking of user interaction

## Critical Implementation Notes

1. **Stagger timing**: 100ms between items
2. **Max animated**: 10 items (rest appear immediately)
3. **Animation duration**: 300ms per item
4. **Total max**: 1000ms
5. **Use CSS transforms + opacity** (GPU accelerated)

## Animation CSS

```css
@keyframes slideUpFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .animate-item-reveal { animation: none; opacity: 1; }
}
```

## Test Focus

- Items appear with stagger
- Reduced motion respected
- Performance (60fps)
- Empty array handled
