#!/bin/bash
# Prevent edits to files that should only change through specific processes
# Runs on: PreToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

PROTECTED=(
  ".env"
  ".env.local"
  "package-lock.json"
  "bun.lock"
  "bun.lockb"
  ".moon/toolchain.yml"
  "CLAUDE.md"
)

for pattern in "${PROTECTED[@]}"; do
  if [[ "$FILE_PATH" == *"$pattern"* ]]; then
    echo "BLOCKED: $FILE_PATH is a protected file. Modify it manually." >&2
    exit 2
  fi
done

exit 0
