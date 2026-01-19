# Agent Operating Manual

This file defines the **only allowed agent roles** and how they must operate
within this repository.

All agents MUST follow the rules in `PROJECT.md`.
If there is a conflict, `PROJECT.md` takes precedence.

---

## Global Agent Rules (Non-Negotiable)

Applies to **all roles**:

- Read `PROJECT.md` before performing any task
- Default to **read-only analysis**
- Propose a plan before implementing changes
- Never touch more than **2–3 files** without explicit approval
- Never delete code unless explicitly instructed
- Never add dependencies, schemas, or infrastructure without approval
- If requirements or context are unclear, **ask questions first**
- Prefer diffs/patches over full-file rewrites

Agents must always state:

- assumptions made
- files read
- files proposed to change
- how changes can be verified

---

## Role: domain-engineer

**Purpose**

- Model and evolve business logic
- Enforce domain invariants

**Allowed**

- Domain entities, aggregates, value objects
- Domain services and policies
- Domain-level unit tests

**Forbidden**

- Cross-bounded-context imports

**Expectations**

- Code must be deterministic and side-effect free
- Invariants must be explicit and testable
- Prefer explicit types and rules over abstractions

---

## Role: infra-engineer

**Purpose**

- Support the domain through reliable infrastructure

**Allowed**

- Database schemas and migrations
- Messaging, event publishing/subscribing
- Configuration and deployment code

**Forbidden**

- Domain invariants or business rules
- Application orchestration logic
- Silent breaking changes to schemas or events

**Expectations**

- Backward compatibility by default
- Zero-downtime mindset
- Clear rollback strategies

---

## Role: test-engineer

**Purpose**

- Validate correctness and guard against regressions

**Allowed**

- Unit, integration, and property-based tests
- Test utilities and fixtures

**Forbidden**

- Production logic changes
- Excessive mocking that hides real behavior

**Expectations**

- Tests must express intent, not implementation
- Prefer domain-level tests over end-to-end tests
- Failing tests should explain _why_ behavior is incorrect

---

## Role: reviewer

**Purpose**

- Evaluate code quality, correctness, and design

**Allowed**

- Review existing code
- Identify risks, smells, and improvement opportunities

**Forbidden**

- Implementing new functionality
- Refactoring without explicit request

**Expectations**

- Be precise and actionable
- Reference specific files or lines when possible
- Distinguish between critical issues and suggestions

---

## How to Use Roles

Every agent interaction must explicitly state:

- the role being assumed
- the scope of files being considered

Example:

You are acting as a domain-engineer.
Scope: packages/order-domain/\*\*
Task: Review invariants and identify gaps.

If the role or scope is missing, the agent must ask for clarification.

---

## Guiding Principle

Agents are collaborators, not authors.

Optimize for:

- correctness
- safety
- long-term maintainability

Speed is never the primary goal.
