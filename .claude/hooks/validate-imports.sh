#!/bin/bash
# Block cross-module imports in server code
# Runs on: PreToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty')

# Only check server module files
if [[ "$FILE_PATH" != *"packages/server/src/modules/"* ]]; then
  exit 0
fi

# Extract current module name
CURRENT_MODULE=$(echo "$FILE_PATH" | sed -n 's|.*modules/\([^/]*\)/.*|\1|p')

# Check for imports from other modules (using grep -P for lookahead)
if echo "$NEW_CONTENT" | grep -qP "from ['\"].*modules/(?!${CURRENT_MODULE}/)" 2>/dev/null; then
  echo "BLOCKED: Cross-module import detected in $FILE_PATH." >&2
  echo "Modules communicate ONLY through EventBus. Import from 'shared/kernel/' for shared types." >&2
  exit 2
fi

exit 0
