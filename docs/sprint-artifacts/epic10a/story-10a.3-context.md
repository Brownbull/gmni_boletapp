# Story 10a.3 Context: Nav Tab Rename

**Story:** 10a.3 - Nav Tab Rename (Receipts → Insights)
**Points:** 1
**Status:** Ready for Development

---

## Implementation Summary

Change the Receipts tab to Insights tab with a new icon and label.

---

## File Changes

### 1. `src/components/Nav.tsx`

**Current imports (line 2):**
```typescript
import { Camera, Home, ListIcon, BarChart3, Settings } from 'lucide-react';
```

**New imports:**
```typescript
import { Camera, Home, Lightbulb, BarChart3, Settings } from 'lucide-react';
```

**Current Receipts button (around line 64-72):**
```tsx
<button
    onClick={() => setView('list')}
    className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
    style={getNavItemStyle('list')}
>
    <ListIcon size={24} strokeWidth={2} />
    <span className="text-[10px] font-medium">{t('receipts')}</span>
</button>
```

**New Insights button:**
```tsx
<button
    onClick={() => setView('insights')}
    className="min-w-11 min-h-11 flex flex-col items-center justify-center gap-1"
    style={getNavItemStyle('insights')}
>
    <Lightbulb size={24} strokeWidth={2} />
    <span className="text-[10px] font-medium">{t('insights')}</span>
</button>
```

---

### 2. `src/utils/translations.ts`

Add new translation key for 'insights':

```typescript
// Find the translations object and add:
insights: {
  en: 'Insights',
  es: 'Ideas',
},
```

---

### 3. `src/App.tsx`

**Update View type (around line 65):**
```typescript
// Current:
type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'list' | 'settings';

// New:
type View = 'dashboard' | 'scan' | 'edit' | 'trends' | 'insights' | 'settings';
```

**Update getNavItemStyle references** if any reference 'list'.

**Note:** The actual InsightsView component will be added in Story 10a.4. For now, the tab can navigate to a placeholder or continue showing HistoryView temporarily.

---

## Testing Checklist

- [ ] Lightbulb icon appears in nav bar
- [ ] "Insights" label shows in English
- [ ] "Ideas" label shows in Spanish
- [ ] Tab highlights correctly when active
- [ ] No TypeScript errors

---

## Estimated Time

~15 minutes
