# Architectural Decision Records (ADR) Index

**Last Updated:** January 19, 2026
**Purpose:** Navigation hub for all architectural decisions

---

## Quick Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-modular-monolith.md) | Modular Monolith Architecture | ✅ Accepted |
| [ADR-002](./ADR-002-ddd-strict-boundaries.md) | Domain-Driven Design with Strict Boundaries | ✅ Accepted |
| [ADR-003](./ADR-003-hierarchical-di-containers.md) | Hierarchical DI Containers | ✅ Accepted |
| [ADR-004](./ADR-004-event-driven-communication.md) | Event-Driven Cross-Context Communication | ✅ Accepted |
| [ADR-005](./ADR-005-repository-pattern.md) | Repository Pattern for Data Access | ✅ Accepted |
| [ADR-006](./ADR-006-framework-classes.md) | Framework Classes as Base Implementation | ✅ Accepted |
| [ADR-007](./ADR-007-npm-workspaces.md) | npm Workspaces for Package Separation | ✅ Accepted |
| [ADR-008](./ADR-008-custom-loaders.md) | Custom Loaders for Import Resolution | ✅ Accepted |

---

## Decision Topics by Category

### Architecture & Organization

- **[ADR-001: Modular Monolith](./ADR-001-modular-monolith.md)** — Monolith vs microservices
- **[ADR-002: DDD Strict Boundaries](./ADR-002-ddd-strict-boundaries.md)** — Bounded context isolation
- **[ADR-007: npm Workspaces](./ADR-007-npm-workspaces.md)** — Package organization

### Dependency Management

- **[ADR-003: Hierarchical DI](./ADR-003-hierarchical-di-containers.md)** — Container structure
- **[ADR-006: Framework Classes](./ADR-006-framework-classes.md)** — Base class design

### Communication Patterns

- **[ADR-004: Event-Driven](./ADR-004-event-driven-communication.md)** — Cross-context events
- **[ADR-005: Repository Pattern](./ADR-005-repository-pattern.md)** — Data access abstraction

### Developer Experience

- **[ADR-008: Custom Loaders](./ADR-008-custom-loaders.md)** — Import clarity

---

## Reading These ADRs

### For New Team Members

**Recommended Order:**
1. [ADR-001: Modular Monolith](./ADR-001-modular-monolith.md) — Understand overall architecture choice
2. [ADR-002: DDD Strict Boundaries](./ADR-002-ddd-strict-boundaries.md) — Understand code organization
3. [ADR-003: Hierarchical DI](./ADR-003-hierarchical-di-containers.md) — Understand dependency injection
4. [ADR-004: Event-Driven](./ADR-004-event-driven-communication.md) — Understand communication patterns

**Time:** ~30 minutes

---

### For Architecture Decisions

Read the **Context** and **Rationale** sections to understand:
- What problem we're solving
- Why this was the best approach
- What alternatives were considered

---

### For Implementation

Read the **Implementation** section for:
- Code examples
- How to apply the decision in practice
- Configuration details

---

### For Design Reviews

Check the **Trade-offs** section to evaluate:
- Advantages and disadvantages
- Impact on the system
- Risk mitigations

---

## ADR Format

Each ADR document includes:

- **Date** — When the decision was made
- **Status** — Accepted, Pending, Superseded, etc.
- **Decision** — One-sentence summary
- **Context** — Problem we're solving
- **Rationale** — Why this is the best approach
- **Implementation** — How to build this
- **Trade-offs** — Advantages and disadvantages
- **Related ADRs** — Connected decisions
- **References** — Documentation links

---

## Adding New ADRs

### When to Create an ADR

Create an ADR when:
- ✅ Making a significant architectural decision
- ✅ Decision affects multiple contexts
- ✅ Decision has long-term implications
- ✅ Need to record rationale for future team members

### ADR Numbering

Use sequential numbers:
- ADR-001 through ADR-008 (existing)
- ADR-009 for next decision
- etc.

### Creating a New ADR

1. **Copy the template** (see below)
2. **Fill in sections** (Context, Rationale, Implementation, Trade-offs)
3. **Add to this index** (update Quick Index table)
4. **Get approval** from architecture team
5. **Add related ADR links** in existing documents if applicable

### Template

```markdown
# ADR-XXX: [Title]

**Date:** [YYYY-MM-DD]
**Status:** Accepted / Pending / Superseded
**Decision:** [One-sentence decision statement]

---

## Context

[What problem are we solving? What constraints exist?]

---

## Rationale

[Why is this the best approach? What alternatives were considered?]

---

## Implementation

[How do we actually build this? Code examples? Configuration?]

---

## Trade-offs

### Advantages
[What benefits does this decision provide?]

### Disadvantages
[What are we giving up?]

### Mitigations
[How do we reduce the downsides?]

---

## Related ADRs

- [ADR-XXX: ...](./ADR-XXX-*.md)
- [ADR-YYY: ...](./ADR-YYY-*.md)

---

## Decision Record

**Decided:** [Date]
**Decision Makers:** [Names/roles]
**Approval:** [TBD or approved]

---

## References

- [Related documentation]
```

---

## ADR Dependencies

```
ADR-001 (Monolith)
    ├─ ADR-002 (DDD) ──┬─ ADR-004 (Events)
    │                  └─ ADR-005 (Repositories)
    │
    ├─ ADR-003 (DI) ──┬─ ADR-006 (Framework Classes)
    │                 └─ ADR-005 (Repositories)
    │
    ├─ ADR-007 (npm Workspaces)
    │
    └─ ADR-008 (Custom Loaders)
        └─ ADR-006 (Framework Classes)
```

### Key Dependencies

- **ADR-001** (Monolith choice) leads to → **ADR-002** (DDD boundaries)
- **ADR-002** (DDD boundaries) leads to → **ADR-004** (Events) and **ADR-005** (Repositories)
- **ADR-003** (DI containers) enables → **ADR-006** (Framework classes)
- **ADR-006** (Framework classes) works with → **ADR-008** (Custom loaders)

---

## Superseded ADRs

None yet.

---

## Decision Timeline

| Date | ADR | Decision |
|------|-----|----------|
| 2026-01-19 | ADR-001 to ADR-008 | Initial architecture decided |

---

## How to Use These ADRs

### In Code Reviews

Ask:
- "Does this change align with ADR-002 (strict boundaries)?"
- "Does this follow ADR-005 (repository pattern)?"
- "Should we emit an event per ADR-004?"

### In Architecture Discussions

Reference:
- "ADR-001 supports extracting this as a microservice later"
- "ADR-003 shows us how to set up the DI container"
- "ADR-004 says we should use events for this"

### In Documentation

Link to relevant ADRs:
- "See ADR-002 for why we enforce strict boundaries"
- "ADR-005 explains the repository pattern used here"
- "ADR-008 documents why we use custom import loaders"

---

## Questions About ADRs?

| Question | Answer |
|----------|--------|
| Why so much documentation? | These decisions affect years of development. Recording rationale prevents re-litigating them. |
| Can we change an ADR? | Yes. Create a new ADR that supersedes it and explain why. |
| Do I need to follow all ADRs? | Yes. They're architectural constraints, not suggestions. |
| What if an ADR conflicts with requirements? | Escalate to architecture team. May need a new ADR. |

---

## Related Documents

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System overview
- [ARCHITECTURAL_DECISIONS.md](../ARCHITECTURAL_DECISIONS.md) — Historical index
- [PACKAGES.md](../PACKAGES.md) — Package architecture
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) — Quick lookup
- [PROJECT.md](../../PROJECT.md) — Project policies

---

**Last Updated:** January 19, 2026
**Maintained By:** Architecture Team
