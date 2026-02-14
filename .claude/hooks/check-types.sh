#!/bin/bash
# Run tsc after Claude edits/writes TypeScript files (async, non-blocking)
# Runs on: PostToolUse (Edit, Write) — async: true

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check TypeScript files
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Run type check, show first 20 lines of errors
ERRORS=$(bun tsc --noEmit --pretty 2>&1 | head -20)

if [ $? -ne 0 ]; then
  echo "Type errors detected after editing $FILE_PATH:" >&2
  echo "$ERRORS" >&2
fi

# Always exit 0 — this is informational only, never blocks
exit 0
