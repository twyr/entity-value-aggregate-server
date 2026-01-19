# ADR-004: Event-Driven Cross-Context Communication

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Use event-driven architecture for all cross-context (and cross-domain) communication.

---

## Context

Bounded contexts must remain independent, but sometimes need to react to changes in other contexts. We needed a mechanism that:
- Decouples contexts completely
- Allows multiple handlers per event
- Enables asynchronous reactions
- Provides audit trail of what happened

---

## Rationale

### Event-Driven vs Direct Calls

| Aspect | Event-Driven | Direct Calls |
|--------|---|---|
| **Coupling** | Loose (context doesn't know who listens) | Tight (A depends on B) |
| **Scalability** | Easy to add handlers | All callers must be updated |
| **Async Reactions** | Natural | Awkward |
| **Audit Trail** | Built-in | Manual logging |
| **Order Dependency** | None required | Fragile |
| **Circuit Breaking** | Can be added to bus | Complex in direct calls |

### Event Flow Example

**CONTEXT A: Profile Bounded Context**

```javascript
class UpdateProfileMiddleware {
  async updateProfile(userId, changes) {
    // Update profile
    const profile = await userRepository.update(userId, changes);

    // Emit event - context A doesn't know/care who listens
    this.emit('profile:updated', {
      userId: profile.id,
      changes: changes,
      timestamp: new Date(),
      version: 1
    });

    return profile;
  }
}
```

**CONTEXT B: Session Bounded Context (Different Domain)**

```javascript
class ProfileUpdatedHandler extends EVASBaseEventHandler {
  get eventType() {
    return 'profile:updated';
  }

  async handle(event) {
    // Invalidate session cache when profile changes
    await sessionCache.invalidate(event.userId);

    // Optionally emit a new event for others
    this.emit('session:invalidated', {
      userId: event.userId,
      reason: 'profile_updated'
    });
  }
}
```

---

## Implementation

### Event Contracts (Public API)

Events are **public contracts** between contexts. Breaking them is like breaking an API.

#### ✅ GOOD: Additive Changes

```javascript
event.metadata = {
  initiatedBy: 'web_app',
  ipAddress: '192.168.1.1'
};
```

#### ✅ GOOD: New Optional Fields

```javascript
event.correlationId = UUID.v4();
```

#### ❌ BAD: Removing Existing Fields

```javascript
// Before: event.timestamp always present
event.timestamp = undefined;
```

#### ❌ BAD: Changing Field Semantics

```javascript
// Before: event.userId is UUID
event.userId = user.email;  // Now it's an email
```

### Event Sourcing Readiness

This structure makes event sourcing upgrades seamless:

```javascript
// Today: Events are reactive triggers
this.emit('profile:updated', { userId, changes });

// Tomorrow: Events stored in event store
const eventStore = diContainer.resolve('eventStore');
eventStore.append('profile:updated', { userId, changes });

// Handlers still work identically - they consume the same event
```

---

## Trade-offs

### Advantages

✅ Complete decoupling between contexts
✅ Easy to add new event handlers
✅ Natural support for async operations
✅ Automatic audit trail
✅ Event sourcing-ready
✅ Enables future message-driven architecture

### Disadvantages

❌ Eventual consistency (lag between event and reactions)
❌ Debugging is more complex (distributed logic)
❌ Error handling requires careful design
❌ Testing event flows requires special setup

### Mitigations

| Challenge | Mitigation |
|---|---|
| **Eventual consistency** | Accept lag; use query cache for read-after-write |
| **Debugging** | Centralized event log; correlationId tracking |
| **Testing** | Event bus can emit to test listeners during tests |
| **Error handling** | Dead letter queue; retry policies |

---

## Related ADRs

- [ADR-002: Domain-Driven Design with Strict Boundaries](./ADR-002-ddd-strict-boundaries.md)
- [ADR-001: Modular Monolith Architecture](./ADR-001-modular-monolith.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [ARCHITECTURE.md](../ARCHITECTURE.md) — Data Flow Patterns section
- [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) — Event communication flow
