# Package-Level Agent Rules: servers/

This directory contains **application and infrastructure code**.

All rules from the root `AGENTS.md` and `PROJECT.md` apply.
This file adds **local clarifications**.

---

## Default Role

When working under `servers/`, the default role is:

**domain-engineer**

For request handling or orchestration logic, the role must be stated explicitly.

---

## Responsibilities

Code in this directory may:

- Wire domain logic to transport layers (HTTP, messaging)
- Handle I/O, serialization, and deserialization
- Manage configuration and runtime concerns
- Contain business rules
- Emit and handle events

Code in this directory must NOT:

- Re-implement domain invariants
- Bypass domain APIs

---

## Surfaces / Handlers

- Must be thin
- Must contain input data validation and authorization only
- Must delegate immediately to middlewares
- Must not contain conditional business logic

---

## Middlewares

- Must contain business logic
- Must persist data via **repositories only**
- Must not contain functionality reserved for the **surfaces**

---

## Repositories

- Must contain code to access external systems (DB, caches, queues)
- Must not contain functionality reserved for **surfaces** and **middlewares**

---

## Tests in servers/

- Prefer integration tests over unit tests
- Mock external systems only when unavoidable
- Focus on behavior, not implementation details

---

## Change Safety

- Assume servers are running in production
- Prefer backward-compatible changes
- Always consider rollout and rollback paths
- Communicate breaking changes clearly and in advance
- Follow deployment protocols strictly, including linting rules, code styles, et al
- Propose changes **before** implementing them
