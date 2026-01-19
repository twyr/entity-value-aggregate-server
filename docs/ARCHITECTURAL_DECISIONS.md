# Architectural Decision Records (ADR)

**Document Version:** 2.0
**Last Updated:** January 19, 2026
**Purpose:** Index of significant architectural decisions and their rationale

---

## 📁 All ADRs are in the `adr/` directory

Each ADR has been split into its own document for easier reference and navigation:

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./adr/ADR-001-modular-monolith.md) | Modular Monolith Architecture | ✅ Accepted |
| [ADR-002](./adr/ADR-002-ddd-strict-boundaries.md) | Domain-Driven Design with Strict Boundaries | ✅ Accepted |
| [ADR-003](./adr/ADR-003-hierarchical-di-containers.md) | Hierarchical DI Containers | ✅ Accepted |
| [ADR-004](./adr/ADR-004-event-driven-communication.md) | Event-Driven Cross-Context Communication | ✅ Accepted |
| [ADR-005](./adr/ADR-005-repository-pattern.md) | Repository Pattern for Data Access | ✅ Accepted |
| [ADR-006](./adr/ADR-006-framework-classes.md) | Framework Classes as Base Implementation | ✅ Accepted |
| [ADR-007](./adr/ADR-007-npm-workspaces.md) | npm Workspaces for Package Separation | ✅ Accepted |
| [ADR-008](./adr/ADR-008-custom-loaders.md) | Custom Loaders for Import Resolution | ✅ Accepted |

---

## 📖 Start Here

👉 **Go to [adr/README.md](./adr/README.md)** for:
- Navigation guides
- Reading order recommendations
- How to add new ADRs
- ADR templates

---

## Quick Reference

### By Category

**Architecture & Organization:**
- [ADR-001: Modular Monolith](./adr/ADR-001-modular-monolith.md)
- [ADR-002: DDD Strict Boundaries](./adr/ADR-002-ddd-strict-boundaries.md)
- [ADR-007: npm Workspaces](./adr/ADR-007-npm-workspaces.md)

**Dependency Management:**
- [ADR-003: Hierarchical DI](./adr/ADR-003-hierarchical-di-containers.md)
- [ADR-006: Framework Classes](./adr/ADR-006-framework-classes.md)

**Communication Patterns:**
- [ADR-004: Event-Driven](./adr/ADR-004-event-driven-communication.md)
- [ADR-005: Repository Pattern](./adr/ADR-005-repository-pattern.md)

**Developer Experience:**
- [ADR-008: Custom Loaders](./adr/ADR-008-custom-loaders.md)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System overview
- [PACKAGES.md](./PACKAGES.md) — Package architecture
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) — Quick lookup
- [PROJECT.md](../PROJECT.md) — Project policies

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-19 | Architecture Team | Initial creation |

## How to Use This Document

1. **When making architectural decisions:** Reference the relevant ADR
2. **When proposing changes:** Check if an ADR conflicts
3. **When onboarding:** Read ADRs 001–004 first
4. **When implementing features:** Follow patterns in ADR-006

## How to Add a New ADR

1. Choose next number (e.g., ADR-009)
2. Copy template below
3. Get review from architecture reviewers
4. Add entry to Table of Contents
5. Update Revision History

### Template

```markdown
## ADR-XXX: [Title]

**Decision:** [One-sentence decision statement]

### Context
[What problem are we solving? What constraints exist?]

### Rationale
[Why is this the best approach? What alternatives were considered?]

### Trade-offs
[What are we giving up? How do we mitigate risks?]

### Implementation
[How do we actually build this?]

### Related ADRs
[Links to related decisions]
```
