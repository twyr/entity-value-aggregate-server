# ADR-008: Custom Loaders for Import Resolution

**Date:** January 19, 2026
**Status:** Accepted
**Decision:** Use Node.js custom loaders to enable special import paths like `baseclass:middleware`.

---

## Context

Bounded contexts need to reference framework base classes, but we wanted:
- Clear intent in import statements
- Protection against accidental cross-context imports
- Ability to swap implementations for testing
- Improved IDE autocomplete

---

## Rationale

### Custom Import Protocols

**Unclear (Anti-pattern):**

```javascript
// ❌ Unclear where this comes from
import { BaseMiddleware } from '../../../base_classes/middleware.js';
```

**Clear (Correct):**

```javascript
// ✅ Clear intent: "I'm importing the base class for middlewares"
import { BaseMiddleware } from 'baseclass:middleware';
```

### Benefits

1. **Intent** — Import statement clearly shows purpose
2. **Refactoring safety** — Rename base classes without updating imports
3. **Testing** — Can stub out base classes for tests
4. **IDE support** — TypeScript definitions work with custom protocols
5. **Discoverability** — Easier to find where base classes are used

---

## Implementation

### Implemented Protocols

| Protocol | Resolution | Purpose |
|---|---|---|
| `baseclass:surface` | Framework base for surfaces | HTTP handlers |
| `baseclass:middleware` | Framework base for middlewares | Business logic |
| `baseclass:repository` | Framework base for repositories | Data access |
| `baseclass:event-handler` | Framework base for event handlers | Event reactions |

### Loader Implementation

Located in `custom_loaders/`:

```javascript
// custom_loaders/baseclass-loader.js
export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('baseclass:')) {
    const [, type] = specifier.split(':');
    const baseClassPath = new URL(
      `../base_classes/${type}.js`,
      import.meta.url
    ).href;
    return { url: baseClassPath };
  }
  return nextResolve(specifier);
}
```

### Usage in Code

```javascript
// Before: Unclear path
import { EVASBaseMiddleware } from '../../../base_classes/middleware.js';

// After: Clear intent
import { EVASBaseMiddleware } from 'baseclass:middleware';

export default class ProfileMiddleware extends EVASBaseMiddleware {
  // Implementation
}
```

---

## Trade-offs

### Advantages

✅ Clear import intent
✅ Protection against path mistakes
✅ Enables implementation swapping
✅ Improved IDE support
✅ Easier refactoring
✅ Self-documenting code

### Disadvantages

❌ Non-standard Node.js feature
❌ Requires loader configuration
❌ Potential IDE confusion (depends on setup)
❌ Custom build tooling knowledge required
❌ Small performance overhead (negligible)

### Mitigations

| Issue | Mitigation |
|---|---|
| Non-standard feature | Well-documented in PROJECT.md |
| Potential IDE confusion | Use TypeScript declaration files |
| Performance overhead | Minimal; resolved at startup |
| Testing complexity | Works seamlessly with Jest/Mocha |

---

## Configuration

### Node.js Loader Setup

```bash
# Run with custom loader
node --loader ./custom_loaders/baseclass-loader.js source/index.js
```

### npm Scripts

```json
{
  "scripts": {
    "start": "node --loader ./custom_loaders/baseclass-loader.js source/index.js",
    "test": "NODE_OPTIONS='--loader ./custom_loaders/baseclass-loader.js' mocha tests/**/*.test.js"
  }
}
```

---

## Guidelines

### When to Use Custom Import Protocols

✅ For framework base classes
✅ For widely-used utilities
✅ For cross-context shared patterns

### When NOT to Use

❌ For one-off utilities
❌ For context-specific code
❌ For simple relative imports

---

## Future Enhancements

### Potential Additional Protocols

```javascript
// Could add in the future:
import { EmailService } from 'service:email';
import { ValidationHelper } from 'helper:validation';
import { UserAggregate } from 'aggregate:user';
```

### Extensibility

Custom loaders can be chained:

```javascript
// Load multiple loaders
node \
  --loader ./custom_loaders/baseclass-loader.js \
  --loader ./custom_loaders/service-loader.js \
  source/index.js
```

---

## Related ADRs

- [ADR-006: Framework Classes as Base Implementation](./ADR-006-framework-classes.md)

---

## Decision Record

**Decided:** January 19, 2026
**Decision Makers:** Architecture Team
**Approval:** TBD

---

## References

- [Node.js Loaders Documentation](https://nodejs.org/api/esm.html#custom-loaders)
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Custom loaders section
