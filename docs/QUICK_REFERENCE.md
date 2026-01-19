# Architecture Quick Reference

**Document Version:** 1.0
**Last Updated:** January 19, 2026
**Purpose:** Fast lookup for common architectural questions

---

## Quick Decision Tree

### "I need to build a new feature. Where do I start?"

```
❓ Does this feature require new business domain logic?
├─ YES  →  See: "Creating a New Bounded Context" (below)
└─ NO   →  Skip to HTTP handler

❓ Will this feature share data with existing contexts?
├─ YES  →  Use Repository or Events
└─ NO   →  Create new repositories

❓ Is this feature HTTP-exposed?
├─ YES  →  Create Surface (HTTP handler) + Middleware
└─ NO   →  Create Middleware + Event Handler only
```

### "I need to modify existing behavior. What layer?"

```
❓ Is this input validation or authorization?
├─ YES  →  Surface layer (HTTP handler)
└─ NO   →  Continue...

❓ Is this business rule logic?
├─ YES  →  Middleware layer
└─ NO   →  Continue...

❓ Is this database/cache query?
├─ YES  →  Repository layer
└─ NO   →  Domain model layer
```

---

## Anti-Patterns Checklist

### 🔴 FORBIDDEN Patterns

| Pattern | Location | Impact | Fix |
|---|---|---|---|
| Direct cross-context imports | ANY | Breaks DDD boundaries | Use events/repositories |
| Business logic in surfaces | Surface | Mixed concerns | Move to middleware |
| Database queries in middleware | Middleware | Hard to test | Use repositories |
| Authorization in middleware | Middleware | Late validation | Move to surface |
| Shared mutable state | Context-level | Race conditions | Use DI containers |
| Circular dependencies | ANY | Impossible to refactor | Restructure or use events |

---

## File Location Guide

### Where should I put...?

| Thing | Location | Example Path |
|---|---|---|
| Domain model | `domains/{domain}/models/` | `domains/server_users/models/relational/ServerUser.js` |
| Bounded context | `domains/{domain}/bounded_contexts/` | `domains/server_users/bounded_contexts/profile/` |
| HTTP handler | `.../surfaces/{command\|query}/` | `.../profile/surfaces/query/main.js` |
| Business logic | `.../middlewares/` | `.../profile/middlewares/basics.js` |
| Data access | `.../repositories/` | `.../repositories/user_repository.js` |
| Event handler | `.../event_handlers/` | `.../event_handlers/user_created.js` |
| Shared lib | `packages/{name}/` | `packages/api-registry/index.js` |
| Config | `servers/rest-api-server/` | `.env`, `.env.development` |

---

## Common Code Patterns

### Pattern 1: Create New Bounded Context

```javascript
// 1. Create directory
servers/rest-api-server/source/domains/server_users/bounded_contexts/my_feature/
├── surfaces/
│   ├── command/
│   │   └── create.js
│   └── query/
│       └── list.js
├── middlewares/
│   └── business_logic.js
├── event_handlers/
│   └── reactions.js
└── index.js

// 2. Create Surface (HTTP entry point)
// surfaces/command/create.js
import { EVASBaseSurface } from '@twyr/framework-classes';

export default class CreateFeatureSurface extends EVASBaseSurface {
  get serviceName() { return 'feature'; }
  get apiEndpoint() { return 'POST /features'; }

  async execute(request, response) {
    const { data } = request.body;

    const middleware = this.apiRegistry.resolveAPI(
      'feature.create',
      this.boundedContextId
    );

    return middleware(request);
  }
}

// 3. Create Middleware (business logic)
// middlewares/business_logic.js
import { EVASBaseMiddleware } from '@twyr/framework-classes';

export default class FeatureMiddleware extends EVASBaseMiddleware {
  async setupAPIs() {
    this.apiRegistry.registerAPI(
      this.boundedContextId,
      'feature.create',
      this.create.bind(this)
    );
  }

  async create(request) {
    const { name } = request.body;

    // Validate
    if (!name) throw new ValidationError('Name required');

    // Access repository
    const repo = this.dependencyInjectionContainer
      .resolve('featureRepository');

    // Persist
    const feature = await repo.save({ name });

    // Emit event
    this.emit('feature:created', { featureId: feature.id });

    return feature;
  }
}

// 4. Create Event Handler (if needed)
// event_handlers/user_created.js
import { EVASBaseEventHandler } from '@twyr/framework-classes';

export default class FeatureCreatedHandler extends EVASBaseEventHandler {
  get eventType() { return 'feature:created'; }

  async handle(event) {
    // React to event
    console.log(`Feature ${event.featureId} created`);
  }
}

// 5. Create Bounded Context index
// index.js
import { EVASBaseBoundedContext } from '@twyr/framework-classes';
import FeatureMiddleware from './middlewares/business_logic.js';
import FeatureCreatedHandler from './event_handlers/user_created.js';

export default class FeatureBoundedContext extends EVASBaseBoundedContext {
  constructor(options) {
    super(options);
    this.featureMiddleware = new FeatureMiddleware(options);
    this.featureEventHandler = new FeatureCreatedHandler(options);
  }
}
```

### Pattern 2: Call Another Middleware's API

```javascript
// In your middleware
class ProfileMiddleware extends EVASBaseMiddleware {
  async getProfileWithAuth(request) {
    // Call Auth middleware's verify API
    const authAPI = this.apiRegistry.resolveAPI(
      'auth.verify',
      request.boundedContextId  // Could be different context
    );

    const verified = await authAPI(request);
    if (!verified) throw new ForbiddenError();

    // Get profile
    return this.getProfile(request);
  }
}
```

### Pattern 3: Emit and Handle Events

```javascript
// In middleware (event emitter)
class OrderMiddleware extends EVASBaseMiddleware {
  async placeOrder(request) {
    const order = await this.orderRepository.create(request.body);

    // Emit event - doesn't know who listens
    this.emit('order:placed', {
      orderId: order.id,
      customerId: order.customerId,
      amount: order.total,
      timestamp: new Date()
    });

    return order;
  }
}

// In event handler (event listener)
// different context entirely
class InventoryUpdatedHandler extends EVASBaseEventHandler {
  get eventType() { return 'order:placed'; }

  async handle(event) {
    // Inventory context reacts to order event
    await this.inventoryRepository.decrementStock(event.orderId);

    // Can emit follow-up event
    this.emit('inventory:updated', {
      orderId: event.orderId,
      status: 'decreased'
    });
  }
}
```

### Pattern 4: Add New Repository

```javascript
// repositories/feature_repository.js
import { EVASBaseRepository } from '@twyr/framework-classes';

export default class FeatureRepository extends EVASBaseRepository {
  async findById(id) {
    return this.dataStore.query('features')
      .where('id', id)
      .first();
  }

  async findAll() {
    return this.dataStore.query('features').select();
  }

  async save(feature) {
    if (feature.id) {
      return this.dataStore('features')
        .where('id', feature.id)
        .update(feature);
    }
    return this.dataStore('features').insert(feature);
  }

  async delete(id) {
    return this.dataStore('features').where('id', id).delete();
  }
}

// In bounded context index.js - register in DI
export default class FeatureBoundedContext extends EVASBaseBoundedContext {
  async initialize() {
    // Register repository in DI
    this.dependencyInjectionContainer.register(
      'featureRepository',
      FeatureRepository,
      { lifecycle: 'singleton' }
    );

    // Now middleware can resolve it
    await super.initialize();
  }
}
```

### Pattern 5: Inject and Use in Tests

```javascript
import { expect } from 'chai';
import sinon from 'sinon';
import ProfileMiddleware from '../middlewares/business_logic.js';

describe('ProfileMiddleware', () => {
  let middleware, mockRepository, mockRegistry;

  beforeEach(() => {
    // Setup mocks
    mockRepository = {
      findById: sinon.stub().returns({ id: '1', name: 'Alice' })
    };

    mockRegistry = {
      registerAPI: sinon.stub(),
      resolveAPI: sinon.stub()
    };

    // Create test container
    const testContainer = {
      resolve: (name) => {
        if (name === 'userRepository') return mockRepository;
      }
    };

    // Inject mocks into middleware
    middleware = new ProfileMiddleware({
      boundedContextId: 'profile',
      dependencyInjectionContainer: testContainer,
      apiRegistry: mockRegistry
    });
  });

  it('fetches profile from repository', async () => {
    const profile = await middleware.getProfile({ userId: '1' });
    expect(profile.name).to.equal('Alice');
    expect(mockRepository.findById.calledWith('1')).to.be.true;
  });

  it('throws when user not found', async () => {
    mockRepository.findById.returns(null);

    try {
      await middleware.getProfile({ userId: '1' });
      throw new Error('Should have thrown');
    } catch (error) {
      expect(error.message).to.include('not found');
    }
  });
});
```

---

## Dependency Lookup Order

### When resolving a service:

```
Request: diContainer.resolve('userRepository')

1. Check child container cache
   └─ Not found

2. Check parent container
   └─ Not found

3. Check grandparent container
   └─ Found! Return instance

Resolution chain: BC → Domain → Root
```

### Lifecycle implications:

```
Singleton (one instance forever):
  Root Container → All children see same instance

Transient (new instance per request):
  Each resolve() call → New instance
  Useful for: per-request state, temporary objects

Query: diContainer.resolve('userRepository', { lifecycle: 'transient' })
```

---

## Event Communication Flow

```
Timeline of a cross-context event:

T1: Feature Middleware
    ├─ Process business logic
    ├─ Mutate state via repository
    └─ Emit event
        this.emit('feature:created', { featureId: 123 })

T2: Event Bus receives event
    ├─ Routes to all registered handlers
    └─ Calls handler.handle(event)

T3: Inventory Handler (different context)
    ├─ Receives 'feature:created' event
    ├─ Reacts to event
    └─ May emit new events

T4: Other handlers react to new events
    └─ ... chain continues
```

### Key points:

- Emitter doesn't wait for handlers (or does it?)
- Handlers don't know about each other
- Order of handlers is not guaranteed
- Events are immutable facts (can't be unsent)

---

## Test Structure

### Unit Test (packages/)

```javascript
// File: packages/api-registry/tests/registry.test.js
import { expect } from 'chai';
import { APIRegistry } from '../index.js';

describe('APIRegistry', () => {
  let registry;

  beforeEach(() => {
    registry = new APIRegistry();
  });

  it('registers and resolves APIs', () => {
    const api = () => 'result';
    registry.registerAPI('context1', 'api.foo', api);

    const resolved = registry.resolveAPI('api.foo', 'context1');
    expect(resolved()).to.equal('result');
  });

  it('falls back to parent registry', () => {
    const parentRegistry = new APIRegistry();
    const api = () => 'parent result';
    parentRegistry.registerAPI('context1', 'api.foo', api);

    const childRegistry = parentRegistry.createChildRegistry();
    const resolved = childRegistry.resolveAPI('api.foo', 'context1');

    expect(resolved()).to.equal('parent result');
  });
});
```

### Integration Test (servers/)

```javascript
// File: servers/rest-api-server/tests/integration/profile.test.js
import request from 'supertest';
import { expect } from 'chai';
import app from '../../source/index.js';

describe('GET /profiles/:id', () => {
  it('returns profile for authenticated user', async () => {
    const response = await request(app)
      .get('/profiles/user-1')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).to.equal(200);
    expect(response.body).to.have.property('id', 'user-1');
    expect(response.body).to.have.property('email');
  });

  it('returns 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/profiles/nonexistent')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).to.equal(404);
  });

  it('returns 401 for unauthenticated request', async () => {
    const response = await request(app)
      .get('/profiles/user-1');

    expect(response.status).to.equal(401);
  });
});
```

---

## Debugging Tips

### Issue: "Cannot resolve API X"

**Debug steps:**
1. Check middleware registered the API: `apiRegistry.registerAPI(...)`
2. Verify bounded context ID matches: `this.boundedContextId`
3. Check API name matches: `'profile.update'` vs `'profile.get'`
4. Trace the call: Add logging in middleware `setupAPIs()`

### Issue: Circular Dependency

**Debug steps:**
1. Run: `npm run stats` (shows dependency graph)
2. Find cycle: `A → B → A`
3. Break it: Use events instead of direct calls

### Issue: Test fails with "Cannot resolve XXX"

**Debug steps:**
1. Check mock registration: `testContainer.register(...)`
2. Verify DI is injected: `{ dependencyInjectionContainer: testContainer }`
3. Check lifecycle: Singleton vs transient matters

### Issue: Event not being handled

**Debug steps:**
1. Check event name: `emit('user:created')` vs `get eventType() { return 'user:registered' }`
2. Verify handler registered: Check bounded context initialization
3. Add logging: `handler.handle()` may not be called
4. Check event bus: Is it connected?

---

## Performance Considerations

### API Registry

- **O(1)** lookup after registration
- Minimal memory overhead
- Hierarchical lookup adds minimal cost (usually 1-2 levels)

### DI Container

- **O(n)** resolution (n = chain length)
- Typically 3 levels max (root → domain → BC)
- Singletons cached; transients created fresh

### Event Bus

- **O(n)** handler dispatch (n = number of handlers)
- Async handlers don't block each other
- Consider rate limiting if >1000 events/sec

---

## Scaling Guidelines

### Within Monolith

**Good:**
- ✅ Add new bounded contexts (horizontal)
- ✅ Add event handlers (scale reactions)
- ✅ Optimize database queries

**Avoid:**
- ❌ Huge contexts (split into smaller contexts)
- ❌ Synchronous cross-context calls (use events)
- ❌ Shared mutable state (use DI isolation)

### Extraction to Microservices

**When ready:**
1. Identify context to extract
2. Create separate repository
3. Copy context code + dependencies
4. Replace with HTTP/gRPC client
5. Publish events to message bus

---

## Related Guides

| Document | When to Read |
|---|---|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Deep understanding of system design |
| [ARCHITECTURAL_DECISIONS.md](./ARCHITECTURAL_DECISIONS.md) | Why decisions were made |
| [PACKAGES.md](./PACKAGES.md) | How to use shared libraries |
| [PROJECT.md](../PROJECT.md) | Project policies & safety rules |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | Setup & development |

---

## Checklists

### Before Creating New Context

- [ ] Clearly define the domain area it covers
- [ ] Identify external dependencies (other contexts)
- [ ] Design event contracts (what it emits)
- [ ] Plan repositories needed
- [ ] Sketch Surface/Middleware/Handler structure

### Before Merging PR

- [ ] No cross-context imports
- [ ] Authorization/validation in surfaces only
- [ ] Business logic in middlewares only
- [ ] Data access via repositories only
- [ ] Events are immutable & additive
- [ ] Tests pass (unit + integration)
- [ ] No console.log (use logger)

### Before Deploying

- [ ] All tests passing
- [ ] Events are backward compatible
- [ ] Database migrations included
- [ ] Configuration documented
- [ ] Rollback plan ready

---

## Common Mistakes

### ❌ Mistake 1: Direct Cross-Context Imports

```javascript
// WRONG
import { Profile } from '../session_manager/models.js';
```

**Fix:** Use repositories or events instead.

### ❌ Mistake 2: Business Logic in Surface

```javascript
// WRONG
async execute(request) {
  if (user.balance < amount) {
    throw new Error('Insufficient funds');
  }
}
```

**Fix:** Move to middleware and call via API.

### ❌ Mistake 3: Database Query in Middleware

```javascript
// WRONG
const user = await db.query('SELECT * FROM users...');
```

**Fix:** Use repository interface.

### ❌ Mistake 4: Shared Mutable Cache

```javascript
// WRONG
export const userCache = new Map();
```

**Fix:** Register in DI container with `singleton` lifecycle.

---

## Quick Command Reference

```bash
# Development
npm install                    # Install dependencies
npm start                      # Start server in dev mode
npm test                       # Run all tests
npm run lint                   # Check code style
npm run build                  # Build all packages

# Database
npm run db:migrate            # Apply migrations
npm run db:rollback           # Undo migrations
npm run db:seed               # Populate test data

# Documentation
npm run stats                 # Generate stats & dependency graph
npm run docs                  # Generate JSDoc HTML
```

---

**Last Updated:** January 19, 2026
**Maintained By:** Architecture Team
