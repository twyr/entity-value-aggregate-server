# ADR-002: Domain-Driven Design with Strict Boundaries

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Use Domain-Driven Design with strict boundary enforcement between bounded contexts. No cross-context imports allowed.

---

## Context

In a monolithic codebase, it's easy for dependencies to bleed across domain boundaries. We needed:
- Automatic prevention of architectural violations
- Clear ownership of code
- Independence testing of contexts
- Safe refactoring within contexts

---

## Rationale

### Why DDD?

- Reflects real business organization
- Forces explicit modeling of complex domains
- Enables teams to own complete features
- Creates a shared language (Ubiquitous Language) across business and engineering

### Why Strict Boundaries?

- **Compile-time enforcement:** Import statements make violations visible immediately
- **Safe refactoring:** Move entities within context without affecting others
- **Parallel development:** Teams modify contexts independently
- **Testability:** Can test context in isolation with mock external contexts
- **Clear contracts:** Events and repositories become explicit interfaces

### Anti-Patterns Prevented

```javascript
// ❌ ANTI-PATTERN 1: Direct imports across contexts
// profile/middlewares/profile.js
import { Session } from '../session_manager/models/Session.js';
// Problem: Profile context now depends on SessionManager internals

// ✅ CORRECT: Use repositories or events
// Middleware communicates via sessionRepository interface
const session = await sessionRepository.findById(sessionId);

// ❌ ANTI-PATTERN 2: Shared utility bleeding across contexts
// shared/utils.js - used by many contexts
export function validateEmail(email) { ... }
// Problem: Changes here affect all contexts; unclear dependency

// ✅ CORRECT: Each context has isolated utilities
// profile/validators.js - owned by profile context
export function validateEmail(email) { ... }

// ❌ ANTI-PATTERN 3: Cross-context state mutation
// global context cache shared between profile and session
// Problem: Race conditions, debugging nightmare

// ✅ CORRECT: Each context has its own DI container
const cache = diContainer.resolve('cacheService');
```

---

## Implementation

### Directory Structure

```
domains/
├── server_users/                # Domain
│   ├── bounded_contexts/
│   │   ├── profile/             # Bounded Context A
│   │   │   ├── models/
│   │   │   ├── middlewares/
│   │   │   ├── surfaces/
│   │   │   └── repositories/    # Profile's own data access
│   │   │
│   │   └── session_manager/     # Bounded Context B
│   │       ├── models/
│   │       ├── middlewares/
│   │       ├── event_handlers/
│   │       └── repositories/    # Session's own data access
│   │
│   └── repositories/            # Domain-level shared repositories
│       └── user_repository.js   # Shared by all contexts in domain
```

### Boundary Enforcement Mechanisms

1. **Directory Structure:** Isolation by organization
2. **Import Statements:** Violations caught at parse time
3. **Code Review:** Manual verification of ADR compliance
4. **Testing:** Integration tests validate context isolation

### Communication Patterns

**Between Contexts in Same Domain:**
- Direct method calls via API Registry
- Repositories for data access
- Events for cross-context reactions

**Between Contexts in Different Domains:**
- Events only (loose coupling)
- Repositories for current domain queries only

---

## Trade-offs

### Advantages

✅ Prevents architectural erosion
✅ Makes team ownership explicit
✅ Enables parallel development
✅ Supports safe refactoring
✅ Easier to extract as microservices later

### Disadvantages

❌ Requires discipline to maintain
❌ Initially slower feature development
❌ More code duplication (isolated utilities)
❌ Cross-context operations require events

---

## Related ADRs

- [ADR-001: Modular Monolith Architecture](./ADR-001-modular-monolith.md)
- [ADR-004: Event-Driven Cross-Context Communication](./ADR-004-event-driven-communication.md)
- [ADR-005: Repository Pattern for Data Access](./ADR-005-repository-pattern.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System overview
- [PACKAGES.md](../PACKAGES.md) — Package architecture
