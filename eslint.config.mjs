// ESLint flat config for this repo's own JS (the adapter engine, shims, install
// scripts, the quality runner, the tests). The STANDARD recommended ruleset,
// made stricter — never looser — than default: code is brought to the standard,
// the standard is not bent to the code. Any deviation is a deliberate Operator
// decision, not the author's convenience. Generated/vendored trees are not
// linted — they are byte-for-byte outputs of a source that IS linted.
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".opencode/plugins/**", // generated from src/adapter/opencode/plugin-entry.mjs
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.node },
    },
    rules: {
      // Stricter than recommended, never looser:
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "smart"],
    },
  },
];
