---
description: Record a lesson or solution to docs/solutions/
allowed-tools: Read, Write, Glob
---

Record a lesson learned or solution to the project knowledge base.

## Process

1. Ask the user what topic/problem this lesson is about (if not already specified)
2. Determine the filename: `docs/solutions/<topic-slug>.md`
3. If the file exists, append the new lesson under a new `##` heading with today's date
4. If the file doesn't exist, create it with a title and the lesson content

## Lesson Format

```markdown
## <Brief Title> — YYYY-MM-DD

**Problem:** What went wrong or what was unclear
**Solution:** What fixed it or what we learned
**Context:** Which module/file/pattern this applies to
```

## Rules

- Keep lessons concise — 3-5 sentences max per section
- Use code snippets if they clarify the solution
- Tag the relevant module or area (e.g., `[combat]`, `[effect-ts]`, `[database]`)
- Create `docs/solutions/` directory if it doesn't exist yet
