# Story 14.13.3 - Session Continuation Notes

**Date:** 2026-01-11
**Context:** 92% used, continuing in new session
**Status:** Phase 5.1 in progress

---

## Outstanding Issues (Priority Order)

### Issue 1: Icon Nodes Not Appearing on Load
**Severity:** High
**Description:** The category emoji icons (SankeyIconNode components) are not rendering when the diagram first loads. Only the flow lines and thin bars appear.

**Root Cause Analysis:**
- Icons are rendered via React overlay in `SankeyChart.tsx:602-631`
- They depend on `nodePositions.length > 0` condition
- `nodePositions` is calculated in a useEffect that runs after chart renders
- The useEffect at lines 355-424 calculates positions based on chart dimensions
- **Likely issue:** The `chartRef.current.getEchartsInstance()` may not be ready, or the `finished` event isn't firing

**Files to Investigate:**
- `src/components/analytics/SankeyChart.tsx` lines 355-424 (position calculation useEffect)
- `src/components/analytics/SankeyIconNode.tsx` (the icon component itself)

**Suggested Fix:**
1. Add console.log to verify if useEffect is running and getting chart instance
2. Check if `nodePositions` state is being set
3. May need to use `onChartReady` callback from echarts-for-react instead of `finished` event
4. Alternative: Calculate positions from data directly instead of relying on chart layout

### Issue 2: Icon Misalignment with Category Bars
**Severity:** Medium
**Description:** When icons do appear, they don't align properly with the node bars in the Sankey diagram.

**Root Cause Analysis:**
- Position calculation at lines 382-408 uses percentage-based padding
- ECharts uses its own layout algorithm which may differ from our calculation
- Current calculation: `paddingTop = chartHeight * 0.08 + titleOffset`
- Current calculation: `paddingX = chartWidth * 0.10`

**Suggested Fix:**
1. Use ECharts `getModel()` API to get actual node positions after render
2. Or use ECharts `convertToPixel` to convert data coordinates to pixel positions
3. Adjust the overlay div positioning (currently `top: showTitle ? '24px' : '0'`)

### Issue 3: Click-to-Highlight Feature (New)
**Severity:** Medium
**Description:** When clicking a category node, highlight all related flows and dim unrelated sections.

**Requirements:**
- Click node → highlight that node + all connected flows
- Dim/soften all unrelated nodes and flows
- Visual feedback for selected state
- Click again or click elsewhere to reset

**Implementation Approach:**
1. ECharts has built-in `emphasis.focus: 'adjacency'` - already configured at line 493
2. Need to trigger this programmatically on click, not just hover
3. Use ECharts `dispatchAction` API:
   ```typescript
   chartInstance.dispatchAction({
       type: 'highlight',
       seriesIndex: 0,
       dataIndex: nodeIndex
   });
   ```
4. Track selected node in state
5. On click: if same node, unhighlight; if different node, switch highlight

---

## Current Configuration Summary

```typescript
// SankeyChart.tsx current settings
height = 380
nodeWidth = useIconNodes ? 8 : 20
nodeGap = 12
lineStyle.opacity = activeMode === 'dark' ? 0.5 : 0.6
itemStyle.opacity = 0.9 (in icon mode)
emphasis.focus = 'adjacency'
```

---

## Key Code Sections

### Icon Overlay Render (lines 602-631)
```tsx
{useIconNodes && nodePositions.length > 0 && (
    <div className="absolute inset-0 pointer-events-none"
         style={{ top: showTitle ? '24px' : '0' }}>
        {nodePositions.map(({ node, x, y, percent }) => (
            <div key={node.name}
                 className="absolute pointer-events-auto"
                 style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}>
                <SankeyIconNode
                    emoji={getNodeEmoji(node.originalName, node.level, mode)}
                    percent={percent}
                    color={node.itemStyle.color}
                    size={36}
                    isSelected={selectedNodeName === node.originalName}
                    onClick={() => handleNodeClick(node)}
                />
            </div>
        ))}
    </div>
)}
```

### Position Calculation useEffect (lines 355-424)
```tsx
useEffect(() => {
    if (!useIconNodes || !chartRef.current) return;

    const instance = chartRef.current.getEchartsInstance();
    if (!instance) return;

    const updatePositions = () => {
        // ... calculates positions based on chart dimensions
        // Groups nodes by level, calculates Y positions, X positions
        setNodePositions(positions);
    };

    const timerId = setTimeout(updatePositions, 100);
    instance.on('finished', updatePositions);

    return () => {
        clearTimeout(timerId);
        instance.off('finished', updatePositions);
    };
}, [useIconNodes, sankeyData.nodes, mode, totalValue, showTitle]);
```

---

## Files Modified in This Session

| File | Changes |
|------|---------|
| `src/components/analytics/SankeyChart.tsx` | Height, nodeGap, opacity, title handler |
| `src/views/TrendsView.tsx` | Height prop |
| `docs/sprint-artifacts/epic14/stories/story-14.13.3-tendencia-sankey-diagram.md` | Session documentation |
| `_bmad/agents/atlas/atlas-sidecar/knowledge/02-features.md` | Sankey feature docs |
| `_bmad/agents/atlas/atlas-sidecar/knowledge/09-sync-history.md` | Session log |

---

## Test Status

- ✅ 29/29 sankeyDataBuilder tests pass
- ✅ 29/29 TrendsView.polygon tests pass
- ✅ No TypeScript errors

---

## Next Session Action Items

1. **Debug icon rendering:**
   - Add logging to position calculation useEffect
   - Verify `nodePositions` state is populated
   - Test alternative approaches (onChartReady, direct calculation)

2. **Fix alignment:**
   - Consider using ECharts API to get actual node positions
   - Or calculate positions directly from data without relying on chart

3. **Implement click-to-highlight:**
   - Use `dispatchAction` for highlight/downplay
   - Track selected state
   - Add visual feedback

---

## Reference Links

- ECharts Sankey: https://echarts.apache.org/examples/en/editor.html?c=sankey-vertical
- echarts-for-react: https://github.com/hustcc/echarts-for-react
- Story doc: `docs/sprint-artifacts/epic14/stories/story-14.13.3-tendencia-sankey-diagram.md`
