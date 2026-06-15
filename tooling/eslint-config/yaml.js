import yml from "eslint-plugin-yml";

export default {
  name: "@repo/eslint-config/yaml",

  files: ["**/*.{yaml,yml}"],

  plugins: {
    yml,
  },

  rules: {
    // YAML базовые правила
    "yml/no-empty-mapping-value": "error",
    "yml/no-empty-sequence-entry": "error",
    "yml/no-irregular-whitespace": "error",
    "yml/no-multiple-empty-lines": ["error", { max: 1 }],
    "yml/no-tab-indent": "error",
    "yml/valid-schema": "off",
    "yml/require-string-key": "error",

    // Стиль
    "yml/block-mapping": ["error", "always"],
    "yml/block-sequence": ["error", "always"],
    "yml/indent": ["error", 2],
    "yml/key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "yml/no-extra-keys": "off",
    "yml/quotes": ["error", { prefer: "single", avoidEscape: true }],
    "yml/sort-keys": "off",
    "yml/spaced-comment": ["error", "always"],

    // Лучшие практики
    "yml/flow-mapping-curly-spacing": ["error", "never"],
    "yml/flow-sequence-bracket-spacing": ["error", "never"],
    "yml/no-c-style-comment": "warn",
    "yml/no-unclosed-bracket": "error",
    "yml/no-unclosed-flow-collection": "error",
  },
};
