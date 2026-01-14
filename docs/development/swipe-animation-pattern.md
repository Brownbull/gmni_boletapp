# Live Swipe Animation Pattern

> **Created**: 2026-01-08
> **Story**: 14.13 Analytics Explorer Redesign
> **Status**: Production-ready pattern

## Overview

This document describes the implementation pattern for interactive swipe gestures with live visual feedback. The content follows the user's finger during drag and snaps to the final position on release.

**Use cases:**
- Month navigation (swipe to change months)
- Carousel slides (swipe between diagrams/charts)
- Filter tabs (swipe between filter options)
- Any horizontal navigation element

---

## Quick Start

### 1. Add State Variables

```typescript
// Touch tracking
const [touchStart, setTouchStart] = useState<number | null>(null);
const [swipeOffset, setSwipeOffset] = useState(0); // Live offset in pixels
```

### 2. Create Touch Handlers

```typescript
const minSwipeDistance = 50; // Minimum pixels to trigger navigation

const onTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeOffset(0);
};

const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    setSwipeOffset(currentX - touchStart);
};

const onTouchEnd = () => {
    if (touchStart === null) return;
    const distance = -swipeOffset; // Negative offset = left swipe

    if (distance > minSwipeDistance) {
        goToNext(); // Swipe left = next
    } else if (distance < -minSwipeDistance) {
        goToPrev(); // Swipe right = previous
    }

    // Reset state
    setTouchStart(null);
    setSwipeOffset(0);
};
```

### 3. Apply to JSX Element

```tsx
<div
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
    style={{
        transform: `translateX(${swipeOffset}px)`,
        transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
        touchAction: 'pan-y' // Allow vertical scroll, capture horizontal
    }}
>
    {/* Your content */}
</div>
```

**Key insight:** `transition: none` during drag makes content follow finger instantly. `ease-out` on release creates smooth snap animation.

---

## Pattern Variants

### A. Simple Content Slide (Carousel)

Content slides with finger, snaps back or navigates on release.

```tsx
// Single slide that moves with swipe
{currentSlide === 0 && (
    <div
        style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none'
        }}
    >
        <SlideContent />
    </div>
)}
```

**Used in:** DashboardView carousel (treemap, radar, bump chart)

### B. Text Navigation with Prev/Next Preview

Shows previous and next values sliding in from sides.

```tsx
<div
    className="relative overflow-hidden"
    style={{ width: '80px', height: '24px', touchAction: 'pan-y' }}
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
>
    {/* Previous (slides in from left when swiping right) */}
    <span
        className="absolute"
        style={{
            transform: `translateX(${swipeOffset - 80}px)`,
            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
            opacity: swipeOffset > 0 ? Math.min(swipeOffset / 50, 1) : 0
        }}
    >
        {prevValue}
    </span>

    {/* Current */}
    <span
        className="absolute"
        style={{
            transform: `translateX(${swipeOffset}px)`,
            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none'
        }}
    >
        {currentValue}
    </span>

    {/* Next (slides in from right when swiping left) */}
    <span
        className="absolute"
        style={{
            transform: `translateX(${swipeOffset + 80}px)`,
            transition: touchStart === null ? 'transform 0.2s ease-out' : 'none',
            opacity: swipeOffset < 0 ? Math.min(-swipeOffset / 50, 1) : 0
        }}
    >
        {nextValue}
    </span>
</div>
```

**Used in:** DashboardView month navigation ("Ene '26" ← → "Feb '26")

### C. With Boundary Resistance

Provides "stuck" feedback when user can't swipe further.

```typescript
const onTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const currentX = e.targetTouches[0].clientX;
    const offset = currentX - touchStart;

    // Apply resistance at boundaries
    if (offset < 0 && !canGoNext) {
        setSwipeOffset(offset * 0.2); // 20% movement = resistance feel
    } else if (offset > 0 && !canGoPrev) {
        setSwipeOffset(offset * 0.2);
    } else {
        setSwipeOffset(offset);
    }
};
```

**Used in:** Month navigation (can't swipe to future months)

---

## Implementation Examples

### DashboardView.tsx Reference

```typescript
// State (lines 387-392)
const [touchStart, setTouchStart] = useState<number | null>(null);
const [touchEnd, setTouchEnd] = useState<number | null>(null);
const [carouselSwipeOffset, setCarouselSwipeOffset] = useState(0);
const [monthTouchStart, setMonthTouchStart] = useState<number | null>(null);
const [monthSwipeOffset, setMonthSwipeOffset] = useState(0);

// Carousel handlers (lines 606-634)
// Month handlers (lines 701-732)
// Header JSX (lines 1454-1502)
// Slide JSX (lines 1561-1570, 1732-1742, 2110-2120)
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Content stacks vertically instead of horizontally | Flex container without proper child widths | Each slide needs `width: 100%; minWidth: 100%; flexShrink: 0` |
| Animation is janky/laggy | CSS transition active during drag | Set `transition: 'none'` when `touchStart !== null` |
| Can't swipe past boundaries | Missing boundary checks | Add `canGoNext`/`canGoPrev` state and check in handlers |
| Swipe triggers too easily | Low threshold | Increase `minSwipeDistance` (50px recommended) |
| Vertical scroll doesn't work | Touch events captured | Add `touchAction: 'pan-y'` to container |
| Content "jumps" on release | Missing transition on release | Ensure `transition: '0.2s ease-out'` when `touchStart === null` |

---

## Testing Considerations

### Unit Tests

```typescript
it('should navigate on swipe gesture', () => {
    render(<Component />);
    const element = screen.getByTestId('swipeable-element');

    // Simulate swipe right (go to previous)
    fireEvent.touchStart(element, { targetTouches: [{ clientX: 100 }] });
    fireEvent.touchMove(element, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchEnd(element);

    expect(/* previous item shown */);
});

it('should not navigate past boundaries', () => {
    render(<Component />); // Already at first item
    const element = screen.getByTestId('swipeable-element');

    // Try to swipe right (no previous)
    fireEvent.touchStart(element, { targetTouches: [{ clientX: 200 }] });
    fireEvent.touchMove(element, { targetTouches: [{ clientX: 300 }] });
    fireEvent.touchEnd(element);

    expect(/* still at first item */);
});
```

### Manual Testing Checklist

- [ ] Swipe left navigates to next
- [ ] Swipe right navigates to previous
- [ ] Small swipe (<50px) snaps back
- [ ] Content follows finger during drag
- [ ] Smooth animation on release
- [ ] Boundary resistance feels natural
- [ ] Works on iOS Safari
- [ ] Works on Android Chrome
- [ ] Vertical scrolling still works

---

## Future Enhancements

1. **Velocity-based navigation**: Fast swipes trigger navigation even with small distance
2. **Snap points**: Multiple positions to snap to (not just prev/next)
3. **Infinite scroll**: Loop back to start when reaching end
4. **Gesture library**: Extract to reusable hook (`useSwipeGesture`)

---

## Related Documentation

- Atlas Memory: `_bmad/agents/atlas/atlas-sidecar/knowledge/04-architecture.md` (Live Swipe Animation Pattern section)
- Story: `docs/sprint-artifacts/epic14/stories/story-14.13-analytics-polygon-integration.md`
- Motion Design System: `docs/uxui/mockups/00_motion-design-system.md`
