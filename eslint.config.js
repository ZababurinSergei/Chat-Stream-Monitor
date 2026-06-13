// eslint.config.js
import js from "@eslint/js";
import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  // Базовые настройки для JavaScript файлов
  js.configs.recommended,

  // Настройки для JavaScript/JSX файлов
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-debugger": "warn",
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      semi: ["warn", "always"],
      quotes: ["warn", "single", { avoidEscape: true }],
      "comma-dangle": ["warn", "always-multiline"],
    },
  },

  // Настройки для TypeScript/TSX файлов
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript правила
      ...tseslint.configs.recommended.rules,

      // Отключаем дублирующиеся правила
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      "no-console": "off",
      "no-debugger": "warn",

      // Стилистические правила
      eqeqeq: ["error", "always"],
      "no-var": "error",
      "prefer-const": "warn",
      semi: ["warn", "always"],
      quotes: ["warn", "single", { avoidEscape: true }],
      "comma-dangle": ["warn", "always-multiline"],

      // TypeScript специфичные правила
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "warn",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-exports": "warn",

      // Правила для безопасности
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
    },
  },

  // Общие правила для всех файлов
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-console": "off",
      "no-debugger": "warn",
    },
  },

  // Специальные правила для тестов
  {
    files: [
      "**/*.test.{js,ts}",
      "**/*.spec.{js,ts}",
      "**/__tests__/**/*.{js,ts}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },

  // Игнорируемые файлы и директории
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".turbo/**",
      ".next/**",
      ".nuxt/**",
      ".output/**",
      "*.config.js",
      "*.config.ts",
      "**/*.d.ts",
      "**/*.backup.*",
    ],
  },
];
