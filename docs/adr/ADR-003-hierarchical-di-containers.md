# ADR-003: Hierarchical DI Containers

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Implement hierarchical Dependency Injection containers at domain, bounded context, and service levels.

---

## Context

Large monolithic applications need:
- Scoped resource management (connections, caches, session state)
- Efficient sharing of expensive-to-create resources
- Isolation between test scenarios
- Easy dependency substitution for testing

---

## Rationale

### Hierarchical Model

```
┌─────────────────────────────────────┐
│    Root IoC/DI Container            │
│  (database, global services)        │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┬────────────┐
        ↓                  ↓            ↓
    Domain A         Domain B      Domain C
    Container        Container     Container
        │                │            │
    ┌───┴───┐        ┌───┴────┐  ┌───┴───┐
    ↓       ↓        ↓        ↓  ↓       ↓
  BC-1    BC-2    BC-3    BC-4  BC-5  BC-6
```

### Lifecycle Benefits

| Level | Scope | Lifetime | Example |
|-------|-------|----------|---------|
| Root | Application | Process lifetime | Database connection pool |
| Domain | Domain | Process lifetime | Domain repositories |
| BC (Bounded Context) | Feature | Request lifetime | Session cache, current user |
| Service | Method | Method lifetime | Temporary state |

### Key Advantages

**1. Resource Efficiency:**
- Database connection pool created once at root
- Reused across all contexts
- No N+1 connection problems

**2. Isolation:**
- Each context has its own cache scope
- Test double repositories per context
- Zero interference between parallel tests

**3. Lookup Fallback:**
- BC container looks in domain container if service not found
- Domain container looks in root
- Automatic fallback prevents duplication

**4. Configuration Variance:**
- Production: Full services at all levels
- Testing: Mock repositories at BC level, real DB at root
- Development: In-memory stubs at all levels

---

## Implementation

### Root Container Setup

```javascript
const rootContainer = new DependencyInjectionContainer();
rootContainer.register(
  'database',
  DatabaseConnection,
  { lifecycle: 'singleton' }
);
```

### Domain Container Inheritance

```javascript
const domainContainer = rootContainer.createChildContainer();
domainContainer.register(
  'userRepository',
  UserRepository,
  { lifecycle: 'singleton' }
);
```

### Bounded Context Container

```javascript
const bcContainer = domainContainer.createChildContainer();
bcContainer.register(
  'sessionCache',
  SessionCache,
  { lifecycle: 'transient' }  // New instance per request
);
```

### Middleware Resolution

```javascript
class ProfileMiddleware {
  constructor(diContainer) {
    // Resolves: BC level → Domain level → Root level
    this.sessionCache = diContainer.resolve('sessionCache');
    this.userRepository = diContainer.resolve('userRepository');
    this.database = diContainer.resolve('database');
  }
}
```

### Test Isolation Example

```javascript
describe('Profile Context', () => {
  let testContainer;
  let mockUserRepository;

  beforeEach(() => {
    // Create isolated test container
    testContainer = domainContainer.createChildContainer();

    // Register mocks at BC level (overrides domain registration)
    mockUserRepository = sinon.stub();
    testContainer.register('userRepository', mockUserRepository, {
      lifecycle: 'singleton'
    });
  });

  it('fetches profile via stubbed repository', async () => {
    mockUserRepository.findById.returns({
      id: 'user-1',
      email: 'test@example.com'
    });

    const middleware = new ProfileMiddleware(testContainer);
    const profile = await middleware.getProfile('user-1');

    expect(profile.email).toBe('test@example.com');
  });
});
```

---

## Trade-offs

### Advantages

✅ Scoped resource management
✅ Efficient resource sharing
✅ Easy test isolation
✅ Simple parent fallback mechanism
✅ Clear ownership at each level

### Disadvantages

❌ Additional complexity in setup
❌ Resolution overhead (though minimal)
❌ Requires careful lifecycle management
❌ Can hide cascading dependencies

---

## Related ADRs

- [ADR-005: Repository Pattern for Data Access](./ADR-005-repository-pattern.md)
- [ADR-006: Framework Classes as Base Implementation](./ADR-006-framework-classes.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [PACKAGES.md](../PACKAGES.md) — Package 4: Server Dependency Manager
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) — Dependency lookup order
