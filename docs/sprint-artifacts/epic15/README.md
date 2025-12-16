# Epic 15: Tags & Grouping

**Epic Status:** Planning Complete
**Total Story Points:** ~18 points
**Estimated Duration:** 2 weeks

---

## Epic Summary

Epic 15 enables user-defined tags for transactions to support trip tracking, project expenses, and business expense categorization beyond AI-detected categories.

**User Request:** "If you want to group all the transactions for a given trip, it won't be enough to group them by city."

---

## Story Map

```
Epic 15: Tags & Grouping (~18 points)
│
├── Story 15.1: Tag Data Model (3 points)
│   Dependencies: Epic 10.0 (generalized change detection)
│   Deliverable: Firestore schema, tag CRUD, multi-tag support
│
├── Story 15.2: Tag Assignment UI (5 points)
│   Dependencies: Story 15.1
│   Deliverable: Add/remove tags in Edit view, quick tag in scan flow
│
├── Story 15.3: Tag-based Filtering (5 points)
│   Dependencies: Story 15.1
│   Deliverable: Filter history and analytics by tag
│
├── Story 15.4: Tag Statistics View (3 points)
│   Dependencies: Stories 15.2, 15.3
│   Deliverable: Per-tag spending aggregate, tag comparison
│
└── Story 15.99: Epic Release Deployment (2 points)
    Dependencies: All previous stories
    Deliverable: Production deployment
```

---

## Stories Summary

| Story | Title | Points | Key Deliverable |
|-------|-------|--------|-----------------|
| 15.1 | Tag Data Model | 3 | Firestore schema, tag CRUD, multi-tag per transaction |
| 15.2 | Tag Assignment UI | 5 | Edit view tags, quick tag during scan, autocomplete |
| 15.3 | Tag-based Filtering | 5 | History filter, analytics filter, combine with date/category |
| 15.4 | Tag Statistics View | 3 | Aggregate per tag, tag comparison (Trip A vs Trip B) |
| 15.99 | Epic Release Deployment | 2 | Production deployment |

---

## Use Cases

| Type | Example |
|------|---------|
| Personal | Trip expenses, event costs, gift tracking |
| Business | Project expenses, client billing, tax categories |

---

## Data Model

```typescript
// User tags collection
interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: Date;
  usageCount: number;
}

// Transaction → Tags relationship
interface Transaction {
  // ... existing fields
  tags: string[]; // Array of tag IDs
}
```

---

## Key Decisions

1. **Flat Tags:** No hierarchy (simple MVP)
2. **Multi-Tag:** One transaction can have multiple tags
3. **User-Only:** No shared/family tags (future feature)
4. **No Auto-Suggest:** User creates tags manually

---

## Dependencies

- **Epic 10.0:** Generalized change detection for edit flow
- **Epic 10:** Insight Engine for tag-based insights

---

## Created

- **Date:** 2025-12-16
- **Author:** PM Agent (John) via BMAD Framework
