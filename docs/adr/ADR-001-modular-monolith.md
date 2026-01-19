# ADR-001: Modular Monolith Architecture

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Build as a single deployable unit with modular boundaries between domains, rather than as a microservices architecture.

---

## Context

We needed an architecture that:
- Allows multiple teams to work independently
- Scales to handle complex business logic
- Provides a clear upgrade path to microservices
- Minimizes operational complexity during development
- Enables efficient debugging and local development

---

## Rationale

### Advantages of Modular Monolith over Microservices

| Aspect | Modular Monolith | Microservices |
|--------|---|---|
| **Deployment** | Single release cycle | Complex orchestration |
| **Debugging** | All code locally available | Network calls, timeouts |
| **Development** | Quick setup, full IDE support | Multiple runtime configs |
| **Refactoring** | Easy cross-context changes | Breaking contracts immediately |
| **Database** | Shared schema, transactions | Distributed transactions, saga patterns |
| **Team Onboarding** | Single codebase to understand | Multiple services to configure |

### Advantages of Modular Monolith over Monolithic Ball of Mud

- Clear bounded contexts prevent tangled dependencies
- Each domain can be deployed/updated independently within single release
- Event-driven communication prevents hard coupling
- Hierarchical DI enables context-scoped resources
- Strict architectural rules enforced at design time

---

## Trade-offs

### Acceptable Constraints

- Vertical scaling limits (eventual max ~500 developers per context)
- Cannot independently scale specific domains (they scale together)
- Shared database means schema changes affect all contexts
- Slower than microservices for specific high-performance domains

### Mitigation Strategies

- Extracted contexts can become microservices when needed
- Future: Sidecar architecture for independent scaling of hot contexts
- Event store can provide eventual consistency if needed

---

## Implementation

- Each domain has isolated IoC/DI container
- Bounded contexts live within domains
- Event bus coordinates cross-context communication
- API Registry prevents circular dependencies
- Single entry point: REST API Server

---

## Related ADRs

- [ADR-002: Domain-Driven Design with Strict Boundaries](./ADR-002-ddd-strict-boundaries.md)
- [ADR-004: Event-Driven Cross-Context Communication](./ADR-004-event-driven-communication.md)

---

## Consequences

### Positive

✅ Simpler operational model during early growth
✅ Faster local development and debugging
✅ Easy refactoring across contexts
✅ Clear path to microservices extraction
✅ Teams can work independently with minimal coordination

### Negative

❌ Cannot independently scale specific domains
❌ Shared database requires coordination
❌ All teams deploy together (coordination overhead)
❌ Risk of boundaries eroding over time

### Neutral

~ Different scaling model than microservices
~ Requires strict architectural discipline
~ API contracts critical at context boundaries

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System overview
- [ARCHITECTURAL_DECISIONS.md](../ARCHITECTURAL_DECISIONS.md) — Decision index
- [Project.md](../../PROJECT.md) — Project policies
