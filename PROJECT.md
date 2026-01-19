# Project Mental Model

This is a backend SaaS system built for long-term evolution and correctness.

## Architecture

This monorepo has two major components to it, organized into npm workspaces:

- The `packages/` directory contains shared libraries
- The `servers/` directory contains the actual RESTful API Server

The `packages` folder contains 4 modules:

- API Registry: Registry for all APIs in a bounded context. If this registry
  cannot resolve an API, it looks it up first in any child registries, then in
  the parent registry. This is recursive till the top-level registry is reached.

- IoC/DI Container: Inversion of Control / Dependency Injection container for managing
  dependencies across the system. It supports hierarchical containers, so each domain
  has it's own IoC/DI container. If this container cannot resolve a dependency, it
  looks it up in any parent containers, recursively, till the root container is
  reached.

- Framework Classes: Base classes for building surfaces, middlewares, repositories,
  and event handlers. And their lifecycle managers

- Error Serializer: Contains utilities for serializing and deserializing errors
  across the system in a way that is consistent and process-safe. Allows the errors
  to be serialized in to JSON for clean logging.

Under the `servers/rest-api-server/` directory, the code is organized into:

- **source/domains/**: all interactions by a specific type of User lives here.
  The `patients` domain is for regular users of the system, for example.

- **source/repositories/**: data access layer implementations, one per external
  system - database, cache, etc.

Domains consist of:

- **bounded_contexts/**: within each domain, these contexts encapsulate a set of
  related interactions and data.

- **models/**: domain models representing core business entities.

- **templates/**: EJS templates to be used for offline user communication - emails,
  etc.
- **repositories/**: Domain specific data access interfaces.

Bounded contexts encapsulate:

- **surfaces/**: Command / Query surfaces for exposing REST API.
- **middlewares/**: Business Logic Layers.
- **event_handlers/**: Routines to react to events emitted by this or other bounded contexts.

At runtime, the system is structured into trees:

- **surfaces/**: Register their REST API with the Application Router, found in the
  `ingress_surfaces/rest_api` code.
- **middlewares/**: Register their API with the API Registry - one per bounded_context
- **repositories/**: Register their services with the IoC/DI - one per domain.

The REST API exposed by the **surfaces** do not interact with each other, at all.
They limit themselves to performing authorization, input data validation, and invoking
**middleware** for executing the business logic via the API Registry.

The **middleware** API can also invoke each other via the API Registry, whenever
they need data from other middlewares anywhere in the system.

Both **surfaces** and **middlewares** can emit events, which are handled by the
event handlers anywhere in the system.

**repositories** are used by **surfaces**, **middlewares**, and other **repositories**
to access data storage or external systems - via the IoC/DI container.

### Layering Rules

- **Domain**: encapsulate all interactions with a specific user type
- **Bounded Context**: encapsulate all related interactions and data within that domain
- **Surfaces**: where the REST API is exposed
- **Middlewares**: where business logic lives
- **Event Handlers**: where reactions to events are handled
- **Repositories**: where data access logic lives

---

## Non-Negotiables

- Authorization and input data validations must live in the **surfaces only**.
- Business rules must live in the **middleware only**.
- No cross-context imports
- No shared mutable state between contexts
- Favour clarity over cleverness
- Prefer explicit code over implicit framework magic

---

## Safety & Change Rules

- Propose changes **before** implementing
- Default to touching **no more than 2–3 files**
- Never delete code unless explicitly instructed
- Never add dependencies, schemas, or infra without approval
- If requirements are ambiguous, ask questions before coding

---

## Events & Compatibility

- Events are **public contracts**
- Do not break existing event schemas
- Prefer additive changes over breaking changes
- Version events explicitly if semantics change

---

## How to Change Things

1. Explain current understanding
2. State assumptions
3. Propose a small, incremental plan
4. Wait for confirmation
5. Implement
6. Explain how to verify the change

---

## Verification Expectations

Every change must include:

- How correctness is verified (tests, checks, or reasoning)
- What was intentionally **not** changed

If verification is not possible, say so explicitly.

---

## Guiding Principle

Optimize for:

- correctness first
- clarity second
- speed last

This system is expected to evolve for years.

## Agent Role Selection Checklist

Before starting any task, select **exactly one** agent role:

- **domain-engineer**
    - Changing business rules, invariants, or domain models
    - Adding or refining domain behavior

- **infra-engineer**
    - Databases, migrations, messaging, configuration, deployment
    - Performance, scalability, reliability concerns

- **test-engineer**
    - Writing or improving tests
    - Validating domain or infrastructure behavior

- **reviewer**
    - Evaluating existing code
    - Identifying risks, smells, or design issues

If a task appears to require multiple roles:

- Stop
- Split the work into separate steps
- Execute each step with a single role

Agents must not proceed without an explicit role declaration.
