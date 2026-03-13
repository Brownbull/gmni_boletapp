# Product Stages — Finding Classification Taxonomy

> **Purpose:** Classify deferred review findings by the product stage where they deliver value.
> **Usage:** Loaded by `kdbp-code-review` step-05 (triage) and step-06 (debt tracking).
> **Scope:** Project-agnostic — applicable to any project using KDBP workflows.

---

## Stage Definitions

### MVP — Minimum Viable Product

The current phase's ship-blocking functionality. Without this, the feature doesn't work or is unsafe.

**Classification criteria:**
- Directly required by the story's acceptance criteria or its parent epic
- Breaks user-facing functionality if missing
- Creates a safety or data integrity risk (e.g., allergen filtering for a food app, auth bypass)
- Type safety that prevents runtime errors in the current feature

**Action:** TD story created in the **same epic**. Prioritized for immediate development.

---

### PROD — Production Readiness

Not required for the feature to function, but required before real users depend on it at scale. Infrastructure, resilience, and operational concerns.

**Classification criteria:**
- Rate limiting, retry logic, circuit breakers
- Persistent storage for ephemeral state (e.g., in-memory → database-backed)
- Input hardening beyond basic validation (ReDoS guards, injection prevention on non-user-facing inputs)
- Monitoring, alerting, and operational runbooks
- Performance optimization for known bottlenecks
- CI/CD guards and deployment safety

**Action:** TD story created in the **same epic** or **deferred to backlog**, depending on project config (see Configurable Triage Modes below).

---

### SCALE — Enterprise / Growth

Needed when the product reaches significant user volume, multi-tenant requirements, or enterprise compliance. Not justified until growth triggers the need.

**Classification criteria:**
- Horizontal scaling, sharding, distributed rate limiting
- Advanced observability (distributed tracing, SLO dashboards)
- Multi-region deployment, data residency
- Compliance certifications (SOC2, GDPR audit trails)
- Advanced operational tooling (canary deployments, feature flags at scale)
- Performance optimization for hypothetical load (no current evidence of bottleneck)

**Action:** TD story **deferred to backlog** (outside current epic). Tagged for future epic planning.

---

## Configurable Triage Modes

Projects configure which stages are included in the current epic vs deferred to backlog. This is set per-project and determines the recommended triage option.

### Mode 1: MVP-only (early-stage projects)
- **In-epic:** MVP findings only
- **Backlog:** PROD + SCALE findings
- **Recommended triage:** `[Q] Quick + Defer MVP + Postpone PROD/SCALE`
- **Use when:** Pre-launch, prototype, or MVP phase

### Mode 2: MVP + PROD (pre-production projects)
- **In-epic:** MVP + PROD findings
- **Backlog:** SCALE findings only
- **Recommended triage:** `[Q] Quick + Defer MVP/PROD + Postpone SCALE`
- **Use when:** Approaching production launch, real users imminent

### Mode 3: All stages (production projects)
- **In-epic:** MVP + PROD + SCALE findings
- **Backlog:** Nothing deferred automatically
- **Recommended triage:** `[Q] Quick + Defer MVP/PROD/SCALE`
- **Use when:** Production system with active users, all hardening is justified

### Project Configuration

Set in the project's sprint-status.yaml or equivalent project config:

```yaml
# Project-level triage configuration
triage:
  mode: 1          # 1 = MVP-only, 2 = MVP+PROD, 3 = All stages
  current_phase: MVP  # Human-readable label for the current product phase
```

When not configured, **Mode 1 (MVP-only)** is the default.

---

## Stage Classification Guide

When classifying a finding, ask these questions in order:

1. **Does the feature break or become unsafe without this fix?** → `MVP`
2. **Would this cause an incident with real users at current scale?** → `PROD`
3. **Is this only needed at 10x-100x current scale or for compliance?** → `SCALE`
4. **Is this a style preference or speculative improvement?** → Consider `archive` (no story)

**Edge cases:**
- Security findings are almost always `MVP` or `PROD`, never `SCALE`
- Test coverage gaps: `MVP` if the untested code path is user-facing, `PROD` otherwise
- Documentation: `PROD` if operational (runbooks, monitoring), `SCALE` if architectural (design docs for future teams)
- Type safety: `MVP` if it prevents runtime errors, `PROD` if it's compile-time hygiene only

---

## Backlog Tracking

Findings deferred to backlog (outside epic) are tracked differently from in-epic TD stories:

- **In-epic TD stories:** Created as `TD-{epic}-{n}` files in `sprint-artifacts/{epic}/stories/`
- **Backlog findings:** Appended to a `deferred-findings.md` file in `sprint-artifacts/` (project-wide), grouped by stage (PROD, SCALE). Each entry includes source story, finding description, and stage classification.

This ensures deferred findings remain visible without polluting the current epic's story count.

---

*Source: Retrospective analysis of cascading review findings — deferred items that expanded epic scope beyond the current product phase.*
