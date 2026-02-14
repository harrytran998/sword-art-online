---
paths:
  - "**/*"
---

# Git Conventions

## Commit Messages

Use conventional commits format with imperative mood:

```
<type>: <subject>
```

- **Subject**: max 72 characters, imperative mood ("add" not "added"), no period at end
- **Body** (optional): explain WHY, not WHAT — separated by a blank line

### Types

| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build, CI, tooling, dependencies |
| `perf` | Performance improvement |
| `style` | Formatting, whitespace (no logic change) |

### Scope (optional)

Use module name as scope when the change is module-specific:

```
feat(combat): add sword skill cooldown system
fix(economy): prevent col duplication in trades
refactor(identity): extract session validation to port
```

## Branch Naming

```
feat/<short-description>
fix/<short-description>
refactor/<short-description>
docs/<short-description>
```

## Rules

- One logical change per commit
- Do NOT commit `.env`, credentials, or secrets
- Do NOT force-push to `main`
- Keep commits atomic — each commit should build and pass tests
