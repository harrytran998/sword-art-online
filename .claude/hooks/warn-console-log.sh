#!/bin/bash
# Warn when console.log is added to server source code
# Runs on: PostToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty')

# Only check TypeScript files in src/ directories
if [[ "$FILE_PATH" != *.ts && "$FILE_PATH" != *.tsx ]]; then
  exit 0
fi

# Skip test files and scripts
if [[ "$FILE_PATH" == *"__tests__"* || "$FILE_PATH" == *".test."* || "$FILE_PATH" == *".spec."* || "$FILE_PATH" == *"scripts/"* ]]; then
  exit 0
fi

# Check if the new content contains console.log
if echo "$NEW_CONTENT" | grep -q "console\.log"; then
  echo "Warning: console.log detected in $FILE_PATH — use Effect.log for server code, or remove before committing." >&2
fi

# Always exit 0 — this is a warning, never blocks
exit 0
