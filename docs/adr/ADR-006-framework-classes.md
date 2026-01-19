# ADR-006: Framework Classes as Base Implementation

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Provide framework base classes (EVASBase*) for common components rather than generating them.

---

## Context

Each application component (Surface, Middleware, Repository) has common concerns:
- Lifecycle management (initialization, cleanup)
- Dependency resolution
- Error handling
- Event emission
- API registration

We needed to avoid:
- Boilerplate repetition across contexts
- Inconsistent patterns
- Hidden framework magic

---

## Rationale

### Why Base Classes?

**1. Consistent Lifecycle:**

```javascript
// All middlewares follow same init/destroy pattern
export default class MyMiddleware extends EVASBaseMiddleware {
  async initialize() {
    // Setup code - called once at startup
  }

  async uninitialize() {
    // Cleanup code - called at shutdown
  }
}
```

**2. Automatic Dependency Resolution:**

```javascript
// Base class provides DI access
export default class MyMiddleware extends EVASBaseMiddleware {
  async execute(request) {
    // Automatically injected via constructor
    const repository = this.dependencyInjectionContainer.resolve(
      'userRepository'
    );
  }
}
```

**3. Event Emission:**

```javascript
export default class MyMiddleware extends EVASBaseMiddleware {
  async createUser(data) {
    const user = await this.repository.save(data);

    // Base class provides event bus
    this.emit('user:created', { userId: user.id });

    return user;
  }
}
```

**4. API Registry Integration:**

```javascript
export default class MySurface extends EVASBaseSurface {
  async execute(request, response) {
    // Base class provides API registry access
    const middleware = this.apiRegistry.resolveAPI(
      'profile.update',
      this.boundedContextId
    );
  }
}
```

---

## Implementation

### Framework Classes Provided

| Class | Purpose | Provides |
|-------|---------|----------|
| `EVASBaseFactory` | Component creation | Lifecycle hooks, logging |
| `EVASBaseMiddleware` | Business logic | API registry, DI, events |
| `EVASBaseSurface` | HTTP handlers | Request context, auth |
| `EVASBaseRepository` | Data access | DataStore access, logging |
| `EVASBaseEventHandler` | Event reactions | Event type matching, emit |
| `EVASBaseLifecycleManager` | Orchestration | Startup/shutdown sequences |

### Design Philosophy

**Explicit over Magical:**
- Framework classes are **not** factories that create instances
- Subclasses explicitly extend and override
- All behavior visible in subclass code
- No hidden hooks or magic methods

**Non-Invasive:**
- Framework classes are libraries, not frameworks
- Subclasses can override anything
- No annotations or decorators required
- Plain JavaScript classes

### Base Class Hierarchy

```
┌─────────────────────────────┐
│   EVASBaseClass             │
│ • Lifecycle hooks           │
│ • Logger                    │
│ • Error handling            │
└────────┬────────────────────┘
         │
    ┌────┴────┬─────────┬─────────┬──────────┐
    ↓         ↓         ↓         ↓          ↓
Factory   Middleware  Surface   Repository EventHandler
```

---

## Trade-offs

### Advantages

✅ Reduces boilerplate code
✅ Ensures consistent patterns
✅ Easy to evolve framework consistently
✅ Simplifies common tasks (DI, events, logging)
✅ Makes code more readable

### Disadvantages

❌ Introduces framework coupling
❌ Requires understanding base class behaviors
❌ Can hide implementation details
❌ Tempting to add too much to base classes

---

## Guidelines

### What Belongs in Base Classes

✅ Lifecycle hooks (init, cleanup)
✅ Common dependency access (DI, registry, logger)
✅ Standard error handling
✅ Event emission interface
✅ Logging utilities

### What Does NOT Belong in Base Classes

❌ Business logic (belongs in subclasses)
❌ Data transformation (belongs in repositories)
❌ HTTP routing logic (belongs in surfaces)
❌ Event handling logic (belongs in handlers)

---

## Related ADRs

- [ADR-003: Hierarchical DI Containers](./ADR-003-hierarchical-di-containers.md)
- [ADR-002: Domain-Driven Design with Strict Boundaries](./ADR-002-ddd-strict-boundaries.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [PACKAGES.md](../PACKAGES.md) — Framework Classes section
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) — Code patterns
