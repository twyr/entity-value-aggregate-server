# Package Architecture Guide

**Document Version:** 1.0
**Last Updated:** January 19, 2026
**Audience:** Package maintainers, domain engineers

---

## Overview

The `packages/` directory contains **reusable, domain-centric libraries** that provide infrastructure for the modular monolith. These packages are designed to be:

- **Side-effect free** — Deterministic, no I/O
- **Fully testable** — No external dependencies required
- **Well-scoped** — Single responsibility
- **Future-proof** — Can be extracted as standalone npm modules

---

## Package Directory Structure

```
packages/
├── api-registry/                 # API Resolution for middlewares
├── error-serializer/             # Error serialization utilities
├── framework-classes/            # Base classes for DDD building blocks
└── server-dependency-manager/    # IoC/DI container implementation
```

---

## Package 1: API Registry (`packages/api-registry`)

### Purpose

Central registry for all APIs (methods) exposed by middlewares and services. Enables hierarchical lookup with parent fallback.

### When to Use

- **Do use:** When middleware needs to call another middleware's API
- **Don't use:** For direct function calls within same context
- **Example:** Profile middleware calls Auth middleware API

### API

```javascript
import { APIRegistry } from '@twyr/api-registry';

const registry = new APIRegistry();

// Register an API
registry.registerAPI(
  contextId,        // 'profile' or 'session_manager'
  apiName,          // 'profile.update' or 'auth.verify'
  apiImplementation // The actual function/middleware
);

// Resolve an API
const api = registry.resolveAPI(apiName, contextId);

// Create child registry (for bounded contexts)
const childRegistry = registry.createChildRegistry();
```

### Usage Pattern

```javascript
// In Profile Middleware (bounded context)
class ProfileMiddleware extends EVASBaseMiddleware {
  async setupAPIs() {
    // Register my APIs
    this.apiRegistry.registerAPI(
      this.boundedContextId,
      'profile.get',
      this.getProfile.bind(this)
    );

    this.apiRegistry.registerAPI(
      this.boundedContextId,
      'profile.update',
      this.updateProfile.bind(this)
    );
  }

  async getProfile(request) {
    // Implementation
  }

  async updateProfile(request) {
    // Implementation
  }
}

// In Surface (HTTP handler)
class UpdateProfileSurface extends EVASBaseSurface {
  async execute(request, response) {
    // Get the middleware API
    const middlewareAPI = this.apiRegistry.resolveAPI(
      'profile.update',
      this.boundedContextId
    );

    // Call it
    return middlewareAPI(request);
  }
}
```

### Key Properties

| Property | Description |
|----------|---|
| **Hierarchical** | Child registries inherit from parent |
| **Scoped** | APIs belong to specific contexts |
| **Recursive lookup** | Falls back to parent if not found |
| **Lazy resolution** | No registration order required |

### Design Rationale

**Why not just call functions directly?**
- Enables middleware composition dynamically
- Supports swapping implementations for testing
- Clear API contracts between middlewares
- Prevents circular dependencies

---

## Package 2: Error Serializer (`packages/error-serializer`)

### Purpose

Serialize and deserialize errors consistently across the system in a process-safe way. Ensures errors can be logged as JSON without losing information.

### When to Use

- **Do use:** Before logging errors to files/services
- **Do use:** When sending errors over network
- **Don't use:** During exception handling (just throw native Errors)

### API

```javascript
import { errorSerializer } from '@twyr/error-serializer';

// Serialize error to JSON-safe object
const serialized = errorSerializer.serialize(error);
console.log(JSON.stringify(serialized));

// Deserialize back to Error (in another process)
const deserialized = errorSerializer.deserialize(serialized);
throw deserialized;
```

### Usage Pattern

```javascript
// In middleware
try {
  const user = await userRepository.findById(userId);
} catch (error) {
  // Serialize for logging
  const errorInfo = errorSerializer.serialize(error);

  logger.error('User fetch failed', {
    error: errorInfo,
    userId: userId,
    timestamp: new Date()
  });

  // Send error-safe response to client
  response.status(500).json({
    message: 'Internal server error',
    errorId: errorInfo.id
  });
}
```

### Supported Error Types

```javascript
// Native JavaScript errors
try {
  throw new Error('Something went wrong');
} catch (error) {
  errorSerializer.serialize(error); // ✅ Works
}

// Custom errors
class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

const error = new ValidationError('Invalid email', 'email');
errorSerializer.serialize(error); // ✅ Works, preserves custom properties
```

### Key Properties

| Property | Description |
|---|---|
| **Process-safe** | No circular refs, serializable |
| **Lossless** | Preserves stack trace, message, type |
| **Custom types** | Supports Error subclasses |
| **Performance** | Minimal overhead |

---

## Package 3: Framework Classes (`packages/framework-classes`)

### Purpose

Base classes that provide common functionality for domain building blocks. Establishes patterns for lifecycle management, dependency resolution, event emission, and API registration.

### When to Use

**Always extend these for:**
- ✅ Middlewares
- ✅ Surfaces (HTTP handlers)
- ✅ Repositories
- ✅ Event Handlers
- ✅ Lifecycle Managers

**Don't extend for:**
- ❌ Domain models (pure business logic)
- ❌ Value Objects (simple data holders)
- ❌ Utilities and helpers

### Core Classes

#### EVASBaseFactory

**Purpose:** Consistent factory pattern for creating components

```javascript
import { EVASBaseFactory } from '@twyr/framework-classes';

export default class MiddlewareFactory extends EVASBaseFactory {
  async create(options = {}) {
    // Return instance of middleware
    return new ProfileMiddleware(options);
  }

  async destroy(instance) {
    // Cleanup
    await instance.uninitialize();
  }
}
```

#### EVASBaseMiddleware

**Purpose:** Base for business logic layers

```javascript
import { EVASBaseMiddleware } from '@twyr/framework-classes';

export default class ProfileMiddleware extends EVASBaseMiddleware {
  // Lifecycle
  async initialize() {
    // Called once at startup
    this.logger.info('Initializing ProfileMiddleware');
  }

  async uninitialize() {
    // Called at shutdown
    this.logger.info('Shutting down ProfileMiddleware');
  }

  // API setup
  async setupAPIs() {
    this.apiRegistry.registerAPI(
      this.boundedContextId,
      'profile.get',
      this.getProfile.bind(this)
    );
  }

  // Business logic
  async getProfile(request) {
    const user = await this.dependencyInjectionContainer
      .resolve('userRepository')
      .findById(request.userId);

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }
}
```

**Provides:**
- `this.apiRegistry` — API Registry instance
- `this.dependencyInjectionContainer` — DI container for this context
- `this.emit(eventType, eventData)` — Event emission
- `this.logger` — Structured logger
- `this.boundedContextId` — Current context ID

#### EVASBaseSurface

**Purpose:** Base for HTTP/REST API handlers

```javascript
import { EVASBaseSurface } from '@twyr/framework-classes';

export default class GetProfileSurface extends EVASBaseSurface {
  // HTTP metadata
  get serviceName() { return 'profile'; }
  get apiEndpoint() { return 'GET /profiles/:id'; }

  // Request handler
  async execute(request, response) {
    // Input validation
    if (!request.params.id) {
      throw new ValidationError('Missing profile ID');
    }

    // Authorization
    if (request.user.role !== 'admin' && request.user.id !== request.params.id) {
      throw new ForbiddenError('Cannot view others profiles');
    }

    // Delegate to middleware
    const middleware = this.apiRegistry.resolveAPI(
      'profile.get',
      this.boundedContextId
    );

    return middleware(request);
  }
}
```

**Provides:**
- `this.apiRegistry` — For middleware lookup
- `this.request` — Current HTTP request
- `this.response` — Current HTTP response
- `this.logger` — Structured logger

#### EVASBaseRepository

**Purpose:** Base for data access abstraction

```javascript
import { EVASBaseRepository } from '@twyr/framework-classes';

export default class UserRepository extends EVASBaseRepository {
  async findById(id) {
    return this.dataStore.query('users')
      .where('id', id)
      .first();
  }

  async save(user) {
    return this.dataStore('users').insert(user);
  }

  async delete(id) {
    return this.dataStore('users').where('id', id).delete();
  }
}
```

**Provides:**
- `this.dataStore` — Database/cache abstraction
- `this.logger` — Structured logger
- Lifecycle hooks: `initialize()`, `uninitialize()`

#### EVASBaseEventHandler

**Purpose:** Base for event reactions

```javascript
import { EVASBaseEventHandler } from '@twyr/framework-classes';

export default class UserCreatedEventHandler extends EVASBaseEventHandler {
  get eventType() {
    return 'user:created';
  }

  async handle(event) {
    // React to user:created event
    const { userId, email } = event;

    // Send welcome email
    await this.emailService.sendWelcome(email);

    // Update analytics
    this.analytics.track('user_signup', { userId });

    // Emit follow-up event
    this.emit('email:welcome_sent', { userId, email });
  }
}
```

**Provides:**
- `this.eventType` — Declares which events this handler listens to
- `this.emit()` — Emit follow-up events
- `this.logger` — Structured logger

#### EVASBaseLifecycleManager

**Purpose:** Orchestrate component initialization and shutdown

```javascript
import { EVASBaseLifecycleManager } from '@twyr/framework-classes';

export default class DomainLifecycleManager extends EVASBaseLifecycleManager {
  async initialize() {
    // 1. Initialize repositories
    await this.initializeRepositories();

    // 2. Initialize middlewares
    await this.initializeMiddlewares();

    // 3. Register event handlers
    await this.registerEventHandlers();

    // 4. Setup APIs
    await this.setupAPIs();
  }

  async uninitialize() {
    // Reverse order
    await this.unregisterEventHandlers();
    await this.uninitializeMiddlewares();
    await this.uninitializeRepositories();
  }
}
```

**Key Pattern:** Initialize dependencies in order; uninitialize in reverse.

### Inheritance Hierarchy

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

### Testing with Framework Classes

```javascript
describe('ProfileMiddleware', () => {
  let middleware, mockRepository, mockApiRegistry;

  beforeEach(() => {
    // Create mocks
    mockRepository = sinon.stub();
    mockApiRegistry = sinon.stub();

    // Inject mocks
    middleware = new ProfileMiddleware({
      boundedContextId: 'profile',
      dependencyInjectionContainer: {
        resolve: (name) => {
          if (name === 'userRepository') return mockRepository;
        }
      },
      apiRegistry: mockApiRegistry
    });
  });

  it('fetches profile via repository', async () => {
    mockRepository.findById.returns({ id: '1', name: 'Alice' });

    const request = { userId: '1' };
    const profile = await middleware.getProfile(request);

    expect(profile.name).toBe('Alice');
  });
});
```

---

## Package 4: Server Dependency Manager (`packages/server-dependency-manager`)

### Purpose

Inversion of Control / Dependency Injection container for hierarchical resource management.

### When to Use

- **Do use:** When registering application services
- **Do use:** When resolving dependencies
- **Don't use:** For simple property passing
- **Don't use:** When direct instantiation is clearer

### API

```javascript
import { DependencyInjectionContainer } from '@twyr/server-dependency-manager';

// Create container
const container = new DependencyInjectionContainer();

// Register service
container.register(
  'serviceName',
  ServiceClass,  // or ServiceFactory function
  {
    lifecycle: 'singleton'  // or 'transient'
  }
);

// Resolve service
const service = container.resolve('serviceName');

// Create child container
const childContainer = container.createChildContainer();
```

### Registration Patterns

#### Pattern 1: Class-based Registration

```javascript
container.register(
  'userRepository',
  UserRepository,  // Class
  { lifecycle: 'singleton' }
);

// Resolves as: new UserRepository(dependencies)
const repo = container.resolve('userRepository');
```

#### Pattern 2: Factory Function Registration

```javascript
container.register(
  'database',
  () => {
    const db = new Database();
    db.connect();  // Side effect during construction
    return db;
  },
  { lifecycle: 'singleton' }
);

const db = container.resolve('database');
```

#### Pattern 3: Instance Registration

```javascript
const configInstance = { debug: true, maxConnections: 100 };
container.register('config', configInstance);

const config = container.resolve('config');  // Same instance
```

### Lifecycle Options

| Lifecycle | Behavior | Use Case |
|---|---|---|
| `singleton` | Single instance, forever | Database, cache, logger |
| `transient` | New instance per resolve | Temporary state, request data |

### Parent Container Fallback

```javascript
const rootContainer = new DependencyInjectionContainer();
rootContainer.register('database', DatabaseConnection, {
  lifecycle: 'singleton'
});
rootContainer.register('logger', Logger, {
  lifecycle: 'singleton'
});

// Child container (domain level)
const domainContainer = rootContainer.createChildContainer();
domainContainer.register('userRepository', UserRepository, {
  lifecycle: 'singleton'
});

// Resolve chain:
// 1. Look in domainContainer
// 2. If not found, look in rootContainer
// 3. Throw if not found anywhere

const repo = domainContainer.resolve('userRepository');      // ✅ Found in domain
const db = domainContainer.resolve('database');             // ✅ Found in root (fallback)
const logger = domainContainer.resolve('logger');           // ✅ Found in root (fallback)
const unknown = domainContainer.resolve('unknown');         // ❌ Throws error
```

### Dependency Injection Convention

Framework classes use DI container to pass dependencies to constructors:

```javascript
class ProfileMiddleware extends EVASBaseMiddleware {
  constructor(options) {
    super(options);

    // Access injected container
    const repo = this.dependencyInjectionContainer.resolve(
      'userRepository'
    );
  }
}
```

### Testing with DI

```javascript
describe('ProfileMiddleware', () => {
  it('uses injected repository', async () => {
    const mockRepo = sinon.stub();
    mockRepo.findById.returns({ id: '1' });

    const testContainer = new DependencyInjectionContainer();
    testContainer.register('userRepository', mockRepo);

    // Middleware resolves mock
    const middleware = new ProfileMiddleware({
      dependencyInjectionContainer: testContainer
    });

    const user = await middleware.getProfile({ userId: '1' });
    expect(user.id).toBe('1');
  });
});
```

---

## Package Dependency Graph

```
┌──────────────────────────────────────────┐
│  framework-classes                       │
│  (Base classes for all components)       │
│  └─ Depends on: error-serializer         │
└──────────────────────────────────────────┘
         ↑                        ↑
         │                        │
┌────────┴──────────┐    ┌────────┴─────────┐
│  api-registry     │    │ server-dependency │
│  (Middleware API  │    │ -manager (DI)     │
│   resolution)     │    │                   │
│  └─ Depends on:   │    │ └─ Depends on:    │
│     (none)        │    │    (none)         │
└───────────────────┘    └───────────────────┘
         ↑                         ↑
         └─────────┬───────────────┘
                   │
         ┌─────────┴────────────┐
         │  rest-api-server     │
         │  (Uses all packages) │
         └──────────────────────┘
```

**Rule:** Packages have zero inter-package dependencies.

---

## Package Maintenance Guidelines

### When to Add a New Package

Create a new package when:

- ✅ Logic is domain-centric (not application-specific)
- ✅ Multiple applications might need it
- ✅ It can be extracted as standalone npm module
- ✅ It's deterministic and side-effect free

**Don't create a package if:**
- ❌ It's specific to one server
- ❌ It requires I/O (database, HTTP, filesystem)
- ❌ It depends on other packages in circular way

### Publishing Guidelines

When a package matures and achieves stability:

1. Create separate repository (e.g., `github.com/twyr/api-registry`)
2. Publish to npm registry
3. Update monorepo to reference published version
4. Update documentation

---

## Inter-Package Communication

### ✅ Allowed: Import from Packages

```javascript
// In rest-api-server
import { EVASBaseMiddleware } from '@twyr/framework-classes';
import { APIRegistry } from '@twyr/api-registry';
import { errorSerializer } from '@twyr/error-serializer';
import { DependencyInjectionContainer } from '@twyr/server-dependency-manager';
```

### ❌ Forbidden: Cross-Package Imports

```javascript
// ❌ DO NOT DO THIS
// In server-dependency-manager:
import { errorSerializer } from '@twyr/error-serializer';

// Why? Creates coupling; breaks independent package extraction
```

### ✅ Allowed: Using Shared Types

If packages define TypeScript interfaces or types:

```javascript
import type { MiddlewareAPI } from '@twyr/api-registry';

// Use for type checking only; no runtime dependency
export function registerAPI(api: MiddlewareAPI) { ... }
```

---

## Quality Standards for Packages

### Must Satisfy

- [ ] **No external side effects** — Deterministic behavior
- [ ] **100% unit tested** — All logic has tests
- [ ] **JSDoc comments** — Public API documented
- [ ] **TypeScript types** — If using TypeScript (or .d.ts files)
- [ ] **Consistent style** — Matches project linting rules
- [ ] **Zero package dependencies** — Only dev dependencies allowed
- [ ] **Error handling** — All errors properly caught/thrown
- [ ] **Performance** — No unnecessary memory allocation

### Code Review Checklist

```markdown
- [ ] No cross-package imports
- [ ] No I/O (database, network, filesystem)
- [ ] All public functions documented
- [ ] Tests cover happy path and edge cases
- [ ] Error messages are clear
- [ ] No circular dependencies
- [ ] Matches naming conventions
- [ ] README is up to date
```

---

## Adding New Package

### Checklist

1. **Create directory:**
   ```bash
   mkdir packages/new-package
   cd packages/new-package
   ```

2. **Create `package.json`:**
   ```json
   {
     "name": "@twyr/new-package",
     "version": "0.1.0",
     "private": true,
     "main": "index.js",
     "type": "module",
     "keywords": ["twyr"],
     "license": "MITNFA"
   }
   ```

3. **Create `index.js`:**
   ```javascript
   export { /* exports */ };
   ```

4. **Create README.md:**
   - Purpose
   - Usage example
   - API reference

5. **Create tests:**
   ```
   tests/
   └── unit.test.js
   ```

6. **Update root `package.json` workspaces:**
   ```json
   "workspaces": [
     "packages/*",
     "servers/*"
   ]
   ```

7. **Update ARCHITECTURE.md**

---

## Troubleshooting

### Issue: Cannot resolve package

```javascript
import { Something } from '@twyr/new-package';  // ❌ Error
```

**Solution:** Check `package.json` exports field:
```json
{
  "exports": "./index.js"
}
```

### Issue: Package works locally but fails in CI

**Cause:** Missing `files` field in `package.json`

**Solution:**
```json
{
  "files": ["index.js", "lib", "README.md"]
}
```

### Issue: Cannot use package in tests

**Cause:** Accessing internal exports

**Solution:** Only import from `index.js` (public API)

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Overall architecture
- [ARCHITECTURAL_DECISIONS.md](./ARCHITECTURAL_DECISIONS.md) — Design decisions
- [PROJECT.md](../PROJECT.md) — Project policies
