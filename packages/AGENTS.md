# Package-Level Agent Rules: packages/

This directory contains **domain-centric packages**.

All rules from the root `AGENTS.md` and `PROJECT.md` apply.
This file adds **stricter local constraints**.

---

## Default Role

When working under `packages/`, the default role is:

**domain-engineer**

If another role is intended, it must be stated explicitly.

---

## Responsibilities

- Packages are intended to be in-memory functionality only
- Code must be deterministic and side-effect free

---

## Tests in packages/

- Prefer unit and property-based tests
- Avoid integration tests that require external services
- Test domain invariants directly

---

## Common Mistakes to Avoid

- Introducing application workflows into packages
- Adding I/O, serialization, or transport logic
