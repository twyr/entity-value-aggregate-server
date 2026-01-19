# ADR-007: npm Workspaces for Package Separation

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Use npm workspaces to separate reusable domain logic (packages/) from application code (servers/).

---

## Context

We needed to:
- Share domain logic across multiple applications
- Maintain separate versioning for packages
- Enable independent testing of packages
- Support future extraction of packages as standalone npm modules

---

## Rationale

### Why Workspaces?

- **Single repository:** Easier to make breaking changes across packages
- **Single dependency tree:** No version conflicts
- **Local development:** `npm link` behavior built-in
- **Parallel testing:** Dependencies can be tested independently
- **Future flexibility:** Easy to extract a package to separate repo

### Directory Strategy

```
entity-value-aggregate-server/
├── packages/                    # Reusable domain logic
│   ├── api-registry/           # Can be extracted to standalone npm module
│   ├── error-serializer/       # Useful in other Node.js projects
│   ├── framework-classes/      # Patterns for DDD systems
│   └── server-dependency-manager/  # General-purpose DI container
│
└── servers/                     # Application orchestration
    └── rest-api-server/        # Uses packages as dependencies
```

---

## Implementation

### Package Configuration

**Each package has:**
- Independent `package.json` with `"private": true`
- Clear `main` and `exports` entry points
- Dedicated `README.md` documentation
- Test coverage requirements

### Workspace Structure

```json
{
  "workspaces": [
    "packages/*",
    "servers/*"
  ]
}
```

### Package Characteristics

**Packages MUST be:**
- ✅ Deterministic (no I/O side effects)
- ✅ Fully testable in isolation
- ✅ Well-documented (internal APIs)
- ✅ Versioned (semver for future extraction)

**Packages MUST NOT be:**
- ❌ Application-specific (generic reuse)
- ❌ Database-dependent (side-effect free)
- ❌ HTTP-dependent (pure domain)
- ❌ Tightly coupled to server structure

---

## Extraction Path

### Today: Part of Monorepo

```bash
npm install @twyr/api-registry
```

### Tomorrow: Published to npm

```bash
npm install @twyr/api-registry@1.0.0
```

### Extraction Steps

1. Create separate repository (e.g., `github.com/twyr/api-registry`)
2. Copy package files from monorepo
3. Publish to npm registry
4. Update monorepo to reference published version
5. Update documentation

---

## Trade-offs

### Advantages

✅ Unified development environment
✅ Coordinated versioning during development
✅ Easy cross-package refactoring
✅ Shared CI/CD pipeline
✅ Clear extraction path

### Disadvantages

❌ Large monorepo (grows with packages)
❌ All packages deployed together
❌ Requires coordination across teams
❌ Harder to version packages independently during dev

---

## Package Responsibilities

### What Makes a Good Package?

- Has a single, well-defined purpose
- Can be used standalone
- Has zero runtime dependencies on other packages
- Follows npm package standards (package.json, README, LICENSE)
- Includes comprehensive tests
- Can be published to npm without modification

### Quality Standards

```markdown
Packages must satisfy:
- [ ] No external side effects
- [ ] 100% unit tested
- [ ] JSDoc comments for public API
- [ ] TypeScript types or .d.ts files
- [ ] Consistent style (eslint passing)
- [ ] Zero package dependencies
- [ ] Clear error handling
- [ ] Performance-conscious
```

---

## Related ADRs

- [ADR-001: Modular Monolith Architecture](./ADR-001-modular-monolith.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [PACKAGES.md](../PACKAGES.md) — Package architecture guide
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v8/using-npm/workspaces)
