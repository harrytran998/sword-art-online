import { defineConfig } from "oxlint"

export default defineConfig({
  rules: {
    "no-unused-vars": "warn",
    "no-console": "warn",
    "no-debugger": "error",
    eqeqeq: "error",
    "no-var": "error",
    "prefer-const": "error",
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-new-func": "error",
    "no-return-await": "warn",
    "require-await": "warn",
    "no-throw-literal": "error",
    "no-duplicate-imports": "error",
  },
  ignorePatterns: ["node_modules", "dist", ".moon"],
})
