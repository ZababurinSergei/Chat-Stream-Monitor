import json from "eslint-plugin-json";
import jsonc from "eslint-plugin-jsonc";

export default {
  name: "@repo/eslint-config/json",

  files: ["**/*.json", "**/*.jsonc", "**/*.json5"],

  plugins: {
    json,
    jsonc,
  },

  rules: {
    // JSON правила
    "json/undefined": "error",
    "json/enforce-quotes": ["error", "double"],
    "json/require-stringify": "off",

    // JSONC правила
    "jsonc/no-bigint-literals": "error",
    "jsonc/no-binary-expression": "error",
    "jsonc/no-binary-numeric-literals": "error",
    "jsonc/no-comments": "off", // Разрешаем комментарии в JSONC
    "jsonc/no-escape-sequence-in-identifier": "error",
    "jsonc/no-hexadecimal-numeric-literals": "error",
    "jsonc/no-infinity": "error",
    "jsonc/no-multi-str": "error",
    "jsonc/no-nan": "error",
    "jsonc/no-number-props": "error",
    "jsonc/no-octal": "error",
    "jsonc/no-octal-escape": "error",
    "jsonc/no-parenthesized": "error",
    "jsonc/no-plus-sign": "error",
    "jsonc/no-regexp-literals": "error",
    "jsonc/no-template-literals": "error",
    "jsonc/no-undefined-value": "error",
    "jsonc/no-unicode-codepoint-escapes": "error",
    "jsonc/valid-json-number": "error",
    "jsonc/array-bracket-spacing": ["error", "never"],
    "jsonc/comma-dangle": ["error", "never"],
    "jsonc/comma-style": ["error", "last"],
    "jsonc/indent": ["error", 2],
    "jsonc/key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "jsonc/object-curly-newline": ["error", { consistent: true }],
    "jsonc/object-curly-spacing": ["error", "always"],
    "jsonc/object-property-newline": [
      "error",
      { allowMultiplePropertiesPerLine: true },
    ],
    "jsonc/quote-props": ["error", "consistent-as-needed"],
    "jsonc/quotes": ["error", "double", { avoidEscape: true }],
    "jsonc/sort-keys": "off",
    "jsonc/space-unary-ops": "error",
  },
};
