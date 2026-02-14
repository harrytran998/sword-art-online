#!/bin/bash
# Run oxfmt after Claude edits/writes a file
# Runs on: PostToolUse (Edit, Write)

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only format TypeScript files
if [[ "$FILE_PATH" == *.ts || "$FILE_PATH" == *.tsx ]]; then
  oxfmt "$FILE_PATH" 2>/dev/null
fi

exit 0
