# ADR-005: Repository Pattern for Data Access

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Use Repository pattern for all data access. No direct database queries outside repositories.

---

## Context

We needed to:
- Isolate data access logic from business logic
- Enable easy swapping of data sources (SQL, NoSQL, cache)
- Provide consistent query interface across domains
- Support testing without real database

---

## Rationale

### Repository as Data Access Abstraction

**Without Repository (Anti-pattern):**

```javascript
class ProfileMiddleware {
  async getProfile(userId) {
    // Business logic mixed with data access
    const user = await database.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    // Problem: Middleware knows about SQL, table structure
    // Problem: Impossible to test without real database
    // Problem: Switching databases requires rewriting this
  }
}
```

**With Repository (Correct):**

```javascript
class ProfileMiddleware {
  async getProfile(userId) {
    // Business logic only
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}

class UserRepository extends EVASBaseRepository {
  async findById(userId) {
    // Data access implementation (can be SQL, NoSQL, REST API, etc.)
    return this.dataStore.query('users')
      .where('id', userId)
      .first();
  }

  // Repository is the only place that knows about database structure
}
```

### Repository Patterns Supported

**Pattern 1: Aggregate Repository (One per Aggregate)**

```javascript
class UserRepository {
  async findById(id) { ... }
  async save(user) { ... }
  async remove(id) { ... }
}
```

**Pattern 2: Query Repository (Read-optimized)**

```javascript
class UserQueryRepository {
  async findWithDetails(id) { ... }
  async searchByEmail(email) { ... }
  async findActiveUsers() { ... }
}
```

**Pattern 3: Event Repository (Event Sourcing)**

```javascript
class UserEventRepository {
  async appendEvent(event) { ... }
  async getAllEvents(aggregateId) { ... }
  async getState(aggregateId) { ... }
}
```

---

## Implementation

### Basic Repository Pattern

```javascript
export default class UserRepository extends EVASBaseRepository {
  async findById(id) {
    return this.dataStore.query('users')
      .where('id', id)
      .first();
  }

  async findAll() {
    return this.dataStore.query('users').select();
  }

  async save(user) {
    if (user.id) {
      return this.dataStore('users')
        .where('id', user.id)
        .update(user);
    }
    return this.dataStore('users').insert(user);
  }

  async delete(id) {
    return this.dataStore('users').where('id', id).delete();
  }
}
```

### Testability Example

```javascript
describe('Profile Middleware', () => {
  let middleware, mockUserRepository;

  beforeEach(() => {
    mockUserRepository = {
      findById: sinon.stub()
    };

    middleware = new ProfileMiddleware(mockUserRepository);
  });

  it('returns user profile', async () => {
    mockUserRepository.findById.returns({
      id: 'user-1',
      name: 'Alice'
    });

    const profile = await middleware.getProfile('user-1');
    expect(profile.name).toBe('Alice');
  });

  it('throws when user not found', async () => {
    mockUserRepository.findById.returns(null);

    await expect(middleware.getProfile('user-1'))
      .rejects
      .toThrow(UserNotFoundError);
  });
});
```

---

## Trade-offs

### Advantages

✅ Clean separation of concerns
✅ Easy to test without database
✅ Simple to swap data sources
✅ Consistent interface across domains
✅ Supports both SQL and NoSQL
✅ Natural fit for DDD aggregates

### Disadvantages

❌ Requires careful interface design
❌ Can lead to N+1 query problems if not careful
❌ Tempting to leak implementation details
❌ Query-specific repositories can proliferate

---

## Guidelines

### When to Create a Repository

✅ For domain aggregates (one-to-one mapping)
✅ For read-optimized queries (QueryRepository)
✅ For cross-aggregate data access
✅ When switching implementations might happen

### When NOT to Create a Repository

❌ For simple lookups (use existing repository)
❌ For temporary/throwaway queries
❌ For infrastructure concerns (logging, caching)

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

- [PACKAGES.md](../PACKAGES.md) — Framework Classes
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) — Common patterns
