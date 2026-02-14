import { defineConfig } from "oxlint"

export default defineConfig({
  plugins: ["typescript"],
  rules: {
    // Core rules
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

    // Type-aware rules (typescript plugin)
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/await-thenable": "error",
    "typescript/no-for-in-array": "error",
    "typescript/no-unsafe-argument": "warn",
    "typescript/no-unsafe-assignment": "warn",
    "typescript/no-unsafe-call": "warn",
    "typescript/no-unsafe-member-access": "warn",
    "typescript/no-unsafe-return": "warn",
    "typescript/no-unnecessary-type-assertion": "warn",
    "typescript/no-unnecessary-condition": "warn",
    "typescript/no-base-to-string": "warn",
    "typescript/require-await": "warn",
    "typescript/switch-exhaustiveness-check": "warn",
    "typescript/prefer-nullish-coalescing": "warn",
    "typescript/prefer-optional-chain": "warn",
    "typescript/prefer-includes": "warn",
    "typescript/prefer-find": "warn",
    "typescript/require-array-sort-compare": "warn",
    "typescript/unbound-method": "error",
  },
  ignorePatterns: ["node_modules", "dist", ".moon"],
})
