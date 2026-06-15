import js from "@eslint/js";
import globals from "globals";

export default {
  name: "@repo/eslint-config/base",

  files: ["**/*.{js,mjs,cjs}"],

  languageOptions: {
    ecmaVersion: 2024,
    sourceType: "module",
    globals: {
      ...globals.node,
      ...globals.browser,
      ...globals.es2024,
    },
  },

  rules: {
    // Лучшие практики
    eqeqeq: ["error", "always"],
    curly: ["error", "all"],
    "no-console": ["warn", { allow: ["warn", "error"] }],
    "no-debugger": "error",
    "no-alert": "warn",

    // Стиль кода
    semi: ["error", "always"],
    quotes: ["error", "single", { avoidEscape: true }],
    "comma-dangle": ["error", "always-multiline"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "no-multi-spaces": "error",
    "key-spacing": ["error", { beforeColon: false, afterColon: true }],
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
    "no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],

    // Переменные
    "prefer-const": "error",
    "no-var": "error",
    "no-unused-vars": [
      "warn",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "no-use-before-define": [
      "error",
      { functions: false, classes: true, variables: true },
    ],

    // Функции
    "arrow-parens": ["error", "as-needed"],
    "arrow-body-style": ["error", "as-needed"],
    "prefer-arrow-callback": "error",
    "no-param-reassign": ["warn", { props: false }],

    // Сравнения
    "strict-compare": "off", // ESLint 9 doesn't have this, use eqeqeq

    // Массивы и объекты
    "array-bracket-spacing": ["error", "never"],
    "object-curly-spacing": ["error", "always"],
    "object-shorthand": ["error", "always"],

    // Импорты
    "sort-imports": ["off"], // Используем separate plugin для сортировки
    "no-duplicate-imports": "error",

    // Комментарии
    "spaced-comment": [
      "warn",
      "always",
      {
        line: { markers: ["/"] },
        block: { balanced: true },
      },
    ],
  },
};
