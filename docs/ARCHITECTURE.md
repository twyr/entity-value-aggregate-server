# Entity Value Aggregate Server - Architecture Guide

**Document Version:** 1.0
**Last Updated:** January 19, 2026
**Audience:** Architecture reviewers, new team members, domain engineers

---
https://github.com/bmad-code-org/BMAD-METHOD?tab=readme-ov-file
## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Monorepo Structure](#monorepo-structure)
4. [Architectural Layers](#architectural-layers)
5. [Domain-Driven Design](#domain-driven-design)
6. [Data Flow Patterns](#data-flow-patterns)
7. [Key Components](#key-components)
8. [Boundaries & Constraints](#boundaries--constraints)
9. [Common Patterns](#common-patterns)
10. [Extension Guide](#extension-guide)

---

## Overview

**Entity Value Aggregate Server** is a backend SaaS system built on **Domain-Driven Design (DDD)** principles using a **Modular Monolith** architecture. The system separates concerns across layers, enforces bounded contexts, and uses an event-driven architecture for system-wide coordination.

### Core Characteristics

- **Language:** Node.js with ES modules
- **Architecture Pattern:** Modular Monolith + DDD
- **Database:** PostgreSQL (relational) + MongoDB (document) + Redis (cache)
- **API Protocol:** REST (via Koa)
- **Package Manager:** npm workspaces
- **Event Model:** Event-driven with hierarchical event publishing

---

## Design Philosophy

This system optimizes for **correctness** and **long-term evolvability** over initial speed.

### Guiding Principles

1. **Clarity over Cleverness** — Code should express intent clearly, not showcase advanced techniques
2. **Explicit over Implicit** — No framework magic; logic is traceable
3. **Correctness First** — All domain invariants are testable and verifiable
4. **Isolation by Design** — Bounded contexts are strict and enforced at compile-time
5. **Event-Driven Coordination** — Cross-context communication happens exclusively via events
6. **Hierarchical Composition** — Containers and registries support inheritance chains

---

## Monorepo Structure

```
entity-value-aggregate-server/
├── packages/                    # Shared domain-centric libraries
│   ├── api-registry/           # API Registry for bounded contexts
│   ├── error-serializer/       # Error serialization utilities
│   ├── framework-classes/      # Base classes for domain building blocks
│   └── server-dependency-manager/  # IoC/DI container
│
├── servers/                     # Application servers
│   └── rest-api-server/        # Main REST API server
│       ├── source/
│       │   ├── index.js                 # Entry point
│       │   ├── application-server.js    # Server orchestration
│       │   ├── ingress_surfaces/        # HTTP entry points
│       │   ├── domains/                 # Domain implementations
│       │   ├── repositories/            # Data access layer
│       │   └── bounded_contexts/        # Cross-domain contexts (if any)
│       ├── custom_loaders/              # Custom module resolution
│       ├── base_classes/                # Server-specific base classes
│       └── tests/                       # Integration tests
│
└── docs/                        # Generated and reference documentation
    ├── ARCHITECTURE.md          # This file
    ├── REST-API-SERVER-DESIGN.md  # Implementation details
    └── rest-api-server/         # JSDoc-generated API reference
```

### Workspace Organization

- **`packages/`** contains **reusable, in-memory domain logic**
  - Must be side-effect free
  - Preferred test approach: unit and property-based tests
  - Zero external I/O (no DB, network, filesystem access)

- **`servers/`** contains **application orchestration and I/O handling**
  - Wires domain logic to HTTP, messaging, databases
  - Handles serialization, deserialization, configuration
  - Preferred test approach: integration tests
  - Assumption: running in production; changes must be backward-compatible

---

## Architectural Layers

The system is organized in **five core layers**, stacked vertically:

```
┌──────────────────────────────────────────────────────────┐
│  HTTP Clients (External)                                 │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  [1] Ingress Surfaces (REST API)                         │
│     • Input validation                                   │
│     • Authorization checks                               │
│     • Route handling                                     │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  [2] Domain Boundaries                                   │
│     • No cross-context imports                           │
│     • Each domain has isolated IoC/DI container          │
│     • Events flow outward; no direct calls inward        │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  [3] Middlewares (Business Logic)                        │
│     • Domain invariants enforced                         │
│     • State mutations happen here                        │
│     • Access data via Repository APIs                    │
│     • Emit domain events                                 │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  [4] Repositories (Data Access)                          │
│     • Database queries                                   │
│     • Cache operations                                   │
│     • External system integration                        │
│     • Transaction coordination                           │
└──────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────┐
│  [5] External Systems (Data & Services)                  │
│     • PostgreSQL / MongoDB                               │
│     • Redis cache                                        │
│     • Third-party APIs                                   │
└──────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

| Layer | Owns | Does NOT Own |
|-------|------|---|
| **Ingress Surfaces** | HTTP routing, input validation, auth | Business rules, data access |
| **Middlewares** | Business rules, domain invariants, state mutations | HTTP concerns, database queries |
| **Repositories** | Data access, external system integration | Business logic, invariant enforcement |
| **Models** | Value objects, aggregates, entities | State mutations, I/O |
| **Event Handlers** | Reactions to domain events | Event generation, business logic |

---

## Domain-Driven Design

### Domain Structure

```
domain/
├── models/                 # Domain entities, aggregates, value objects
│   └── relational/         # Relational representations
│
├── bounded_contexts/       # Isolated business areas
│   ├── context_a/
│   │   ├── surfaces/       # REST API entry points
│   │   │   ├── command/    # Command handlers (mutations)
│   │   │   └── query/      # Query handlers (reads)
│   │   ├── middlewares/    # Business logic
│   │   └── event_handlers/ # Event reactions
│   │
│   └── context_b/
│       └── ...
│
├── repositories/           # Data access interfaces
├── templates/              # EJS templates (email, rendering)
└── base_classes/           # Domain-specific base classes
```

### Bounded Contexts

A **Bounded Context** is an isolated domain area with:

- **Clear responsibility boundary** — specific business capability
- **Independent models** — its own entity definitions
- **No cross-context imports** — enforced at architecture level
- **Event-based communication** — contexts coordinate via events
- **Hierarchical IoC/DI** — own container with parent fallback

#### Example: Server Users Domain

```
server_users/
├── models/                          # User, Session aggregates
│   └── relational/
│       ├── ServerUser.js            # User aggregate
│       └── ServerUserSession.js     # Session aggregate
│
├── bounded_contexts/
│   ├── profile/                     # User profile management
│   │   ├── surfaces/
│   │   │   ├── command/main.js      # Update profile command
│   │   │   ├── command/contact.js   # Manage contacts command
│   │   │   └── query/main.js        # Fetch profile query
│   │   ├── middlewares/
│   │   │   ├── basics.js            # Basic profile logic
│   │   │   ├── contacts.js          # Contact management
│   │   │   └── locales.js           # Localization
│   │   └── index.js                 # Bounded context setup
│   │
│   └── session_manager/             # Session lifecycle
│       ├── surfaces/
│       │   └── command/main.js      # Session commands
│       ├── middlewares/
│       │   └── session.js           # Session logic
│       ├── event_handlers/
│       │   └── session.js           # Session events
│       └── index.js                 # Bounded context setup
│
└── repositories/
    └── server_user_repository.js    # User data access
```

### Key DDD Concepts in This Codebase

| Concept | Implementation | Location |
|---------|---|---|
| **Aggregate** | Class with validation & invariants | `models/relational/` |
| **Value Object** | Immutable, equality by value | `models/relational/` |
| **Entity** | Identity-based, mutable | `models/relational/` |
| **Repository** | Data access interface | `repositories/` |
| **Middleware** | Business rule orchestration | `bounded_contexts/*/middlewares/` |
| **Surface** | API entry point | `bounded_contexts/*/surfaces/` |
| **Event Handler** | Reaction to domain events | `bounded_contexts/*/event_handlers/` |
| **Domain Event** | Immutable, timestamped fact | Emitted by middlewares |

---

## Data Flow Patterns

### Request Flow (Happy Path)

```
Client HTTP Request
    ↓
[Ingress Surface]
├─ Parse HTTP request
├─ Validate input data (Joi schema)
├─ Authorize request
└─ Delegate to middleware
    ↓
[Middleware - Business Logic]
├─ Fetch domain models via Repository
├─ Enforce business rules
├─ Mutate state
├─ Emit domain events
└─ Return result to Surface
    ↓
[Ingress Surface]
├─ Serialize result
└─ Send HTTP response
    ↓
Client HTTP Response
```

### Event Flow (Cross-Context Communication)

```
[Middleware A] ─ Emits Event X ─→ Event Bus
                                    ↓
                        [Event Handler Y listens]
                                    ↓
                        Triggers logic in Middleware B
                                    ↓
                        Middleware B may emit Event Z
                                    ↓
                        [Other handlers react to Z]
```

### Data Access Flow

```
[Middleware]
    ↓
[Repository Interface]
    ↓
[Concrete Repository]
├─ Query builder
├─ ORM/Query execution
├─ Result mapping
└─ Cache operations
    ↓
[External Data Store]
```

---

## Key Components

### 1. API Registry (`packages/api-registry`)

**Purpose:** Central registry for all APIs exposed by middlewares and services.

**Key Features:**
- Hierarchical lookup (child → parent)
- Context-aware API resolution
- Prevents circular dependencies
- Enables clean middleware composition

**Usage Pattern:**
```javascript
// Middleware registers its API
apiRegistry.registerAPI(
  contextId,
  apiName,
  apiImplementation
);

// Another middleware queries it
const api = apiRegistry.resolveAPI(apiName, contextId);
```

### 2. IoC/DI Container (`packages/server-dependency-manager`)

**Purpose:** Inversion of Control and Dependency Injection across the system.

**Key Features:**
- Hierarchical containers (domain → bounded context → service)
- Lazy initialization
- Singleton and transient lifecycles
- Parent container fallback

**Usage Pattern:**
```javascript
// Register in domain container
diContainer.register(
  'repositoryName',
  RepositoryClass,
  { lifecycle: 'singleton' }
);

// Inject in middleware
const repository = diContainer.resolve('repositoryName');
```

### 3. Framework Classes (`packages/framework-classes`)

**Purpose:** Reusable base classes for common domain building blocks.

**Includes:**
- `EVASBaseFactory` — Factory pattern base
- `EVASBaseMiddleware` — Middleware base class
- `EVASBaseSurface` — API surface base class
- `EVASBaseRepository` — Data access base class
- `EVASBaseEventHandler` — Event handler base class
- `EVASBaseLifecycleManager` — Lifecycle orchestration
- And many more...

**Design:** All are abstract; subclasses implement concrete behavior.

### 4. Error Serializer (`packages/error-serializer`)

**Purpose:** Consistent error serialization across the system.

**Key Features:**
- Process-safe error capturing
- JSON-friendly error representation
- Stack trace preservation
- Custom error types support

### 5. REST API Server (`servers/rest-api-server`)

**Purpose:** Main application server orchestrating domains, services, and HTTP handling.

**Key Files:**
- `index.js` — Entry point, environment setup
- `application-server.js` — Server orchestration, startup/shutdown
- `ingress_surfaces/rest_api/` — HTTP routing via Koa

---

## Boundaries & Constraints

### Non-Negotiable Rules

These rules are enforced architecturally and must never be violated:

#### Rule 1: No Cross-Context Imports
```javascript
// ❌ FORBIDDEN
import { Profile } from '../other_context/models.js';

// ✅ CORRECT
// Use repositories or event handlers for cross-context data
```

#### Rule 2: Authorization & Validation in Surfaces ONLY
```javascript
// ❌ FORBIDDEN (middleware)
if (!user.hasRole('admin')) throw new Error('Forbidden');

// ✅ CORRECT (surface)
const middlewares = apiRegistry.resolveAPI('profile.update', context);
return middlewares.execute(validatedData);
```

#### Rule 3: Business Logic in Middlewares ONLY
```javascript
// ❌ FORBIDDEN (surface)
if (newBalance < 0) throw new Error('Insufficient funds');

// ✅ CORRECT (middleware)
const balance = await repository.getBalance(userId);
if (balance < amount) throw new InsufficientFundsError();
```

#### Rule 4: Data Access via Repositories ONLY
```javascript
// ❌ FORBIDDEN (middleware)
const user = await db.query(`SELECT * FROM users WHERE id = ?`, [id]);

// ✅ CORRECT (middleware)
const user = await userRepository.findById(id);
```

#### Rule 5: No Shared Mutable State Between Contexts
```javascript
// ❌ FORBIDDEN
export const sharedCache = new Map(); // across contexts

// ✅ CORRECT
// Each context has its own cache via DI container
const cacheService = diContainer.resolve('cacheService');
```

#### Rule 6: Events Are Public Contracts
```javascript
// ❌ FORBIDDEN (breaking event schema)
event.userId = null;  // was previously always present
event.timestamp = undefined;

// ✅ CORRECT (additive changes)
event.metadata = { newField: value };  // new optional fields
```

---

## Common Patterns

### Pattern 1: Adding a New Bounded Context

**Step 1:** Create directory structure
```
bounded_contexts/new_feature/
├── surfaces/
│   ├── command/
│   │   ├── create.js
│   │   ├── update.js
│   │   └── delete.js
│   └── query/
│       ├── fetchOne.js
│       └── fetchMany.js
├── middlewares/
│   └── business_logic.js
├── event_handlers/
│   └── reactions.js
└── index.js
```

**Step 2:** Create the Surface (HTTP handler)
```javascript
// surfaces/command/create.js
import { EVASBaseSurface } from '@twyr/framework-classes';

export default class CreateFeatureSurface extends EVASBaseSurface {
  get serviceName() { return 'feature'; }
  get apiEndpoint() { return 'POST /features'; }

  async execute(request, response) {
    const { data } = this.request.body;
    this.request.body = { ...data };

    const middlewares = this.apiRegistry.resolveAPI(
      'feature.create',
      this.boundedContextId
    );

    return middlewares.execute(this.request);
  }
}
```

**Step 3:** Create the Middleware (business logic)
```javascript
// middlewares/business_logic.js
import { EVASBaseMiddleware } from '@twyr/framework-classes';

export default class FeatureMiddleware extends EVASBaseMiddleware {
  async create(request, response) {
    const { featureName, description } = request.body;

    // Validate business rules
    if (!featureName) throw new Error('Name required');

    // Access data
    const repository = this.dependencyInjectionContainer.resolve(
      'featureRepository'
    );

    // Persist
    const feature = await repository.create({
      name: featureName,
      description
    });

    // Emit event
    this.emit('feature:created', {
      featureId: feature.id,
      name: feature.name
    });

    return feature;
  }
}
```

**Step 4:** Register in bounded context index
```javascript
// index.js
export default class FeatureBoundedContext extends EVASBaseBoundedContext {
  // Initialization and setup
}
```

### Pattern 2: Cross-Context Communication via Events

**Context A emits an event:**
```javascript
// In middleware
this.emit('user:registered', {
  userId: user.id,
  email: user.email,
  timestamp: new Date()
});
```

**Context B listens and reacts:**
```javascript
// event_handlers/user_registered.js
export default class UserRegisteredHandler extends EVASBaseEventHandler {
  async handle(event) {
    // React to user registration
    await this.sendWelcomeEmail(event.email);
  }
}
```

### Pattern 3: Repository Pattern for Data Access

**Define repository interface:**
```javascript
// repositories/user_repository.js
export default class UserRepository extends EVASBaseRepository {
  async findById(id) {
    return this.dataStore.query()
      .from('users')
      .where('id', id)
      .first();
  }

  async save(user) {
    return this.dataStore.query()
      .insert(user)
      .into('users');
  }
}
```

**Inject into middleware:**
```javascript
// In DI container setup
diContainer.register(
  'userRepository',
  UserRepository,
  { lifecycle: 'singleton' }
);

// In middleware
const userRepository = this.dependencyInjectionContainer.resolve(
  'userRepository'
);
```

---

## Extension Guide

### Adding a New Domain

1. **Create domain directory** under `domains/`
2. **Define models** in `models/relational/`
3. **Create bounded contexts** under `bounded_contexts/`
4. **Implement surfaces** for HTTP entry points
5. **Implement middlewares** for business logic
6. **Define repositories** for data access
7. **Add event handlers** for reactions
8. **Register in application-server.js**

### Adding a New Repository (Data Source)

1. **Create repository class** extending `EVASBaseRepository`
2. **Register in DI container** at domain level
3. **Inject into middlewares** that need it
4. **Never call repository directly from surfaces**

### Adding a New Event

1. **Define event in middleware**
```javascript
this.emit('domain:action:occurred', {
  aggregateId: id,
  timestamp: new Date(),
  // ... event data
});
```

2. **Create event handler** in target context
3. **Register handler** in bounded context

### Testing Strategy

**Unit Tests (for packages/):**
```javascript
// Test domain logic in isolation
describe('UserAggregate', () => {
  it('enforces email uniqueness', () => {
    const user1 = new User({ email: 'test@example.com' });
    const user2 = new User({ email: 'test@example.com' });
    expect(() => {
      // Compare
    }).toThrow('Email already registered');
  });
});
```

**Integration Tests (for servers/):**
```javascript
// Test full request flow
describe('POST /users', () => {
  it('creates user and publishes event', async () => {
    const response = await request
      .post('/users')
      .send({ email: 'new@example.com' });

    expect(response.status).toBe(201);
    expect(eventBus.emitted).toContainEqual(
      expect.objectContaining({
        type: 'user:created'
      })
    );
  });
});
```

---

## Decision Records

### Why Modular Monolith?

- **Deployment simplicity:** Single deployable unit
- **Shared resources:** One database, one cache, one runtime
- **Incremental microservices:** Can extract contexts to microservices later
- **Simpler debugging:** All code in one place during development

### Why Strict Bounded Contexts?

- **Prevents tangled dependencies:** Each context is independently testable
- **Scales with team:** Teams can own contexts without stepping on each other
- **Event-driven coordination:** Loose coupling via pub/sub
- **Enforces contracts:** Events become public interfaces between contexts

### Why Hierarchical DI Containers?

- **Scoped isolation:** Each context has its own dependency scope
- **Automatic fallback:** Parent container provides shared services
- **Testability:** Easy to replace dependencies with test doubles
- **Resource efficiency:** Singletons at domain level, transients at surface level

---

## Troubleshooting

### Issue: "Cannot resolve API X"

**Cause:** API not registered in correct context
**Fix:** Ensure middleware registers API with correct bounded context ID

### Issue: Cross-context import detected

**Cause:** Importing directly from another bounded context
**Fix:** Use events or repository interfaces instead

### Issue: Circular dependency warning

**Cause:** Two contexts depend on each other directly
**Fix:** Create shared repository or use event-based communication

### Issue: Business logic in surface layer

**Cause:** Authorization/validation mixed with business rules
**Fix:** Extract to middleware; surfaces should be thin routers

---

## Related Documentation

- [PROJECT.md](../PROJECT.md) — Project policies and safety rules
- [AGENTS.md](../AGENTS.md) — Agent operating manual
- [REST-API-SERVER-DESIGN.md](../docs/rest-api-server/REST-API-SERVER-DESIGN.md) — Implementation specifics
- [CONTRIBUTING.md](../CONTRIBUTING.md) — Development setup
