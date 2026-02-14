---
description: Quick WIP commit to save current progress
allowed-tools: Bash
---

Save current progress with a WIP commit.

## Process

1. Run `git status` and `git diff --stat` to show what will be committed
2. Stage all changes: `git add -A`
3. Commit with message: `wip: checkpoint`
4. Show the commit hash and summary

## Rules

- This is a work-in-progress commit — it will be squashed or amended later
- Do NOT push to remote
- If there are no changes, report "Nothing to checkpoint" and stop
