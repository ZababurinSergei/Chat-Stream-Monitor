import js from "@eslint/js/index.js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  // Базовые рекомендованные правила ESLint
  js.configs.recommended,

  // Глобальные игнорирования
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/coverage/",
      "**/.turbo/",
      "**/.next/",
      "**/out/",
      "**/Directory/ast-analyzer/dist/",
      "**/Directory/ast-analyzer/build/",
      "**/Directory/ast-analyzer/coverage/",
      "**/Directory/ast-analyzer/modules/",
      "**/Directory/ast-analyzer/*.backup.*",
      "**/packages/*/dist/",
      "**/packages/*/build/",
      "**/apps/*/dist/",
      "**/apps/*/.next/",
      "**/tooling/*/node_modules/",
      "**/fs/",
      "**/logs/",
      "**/*.config.js",
      "**/*.config.mjs",
      "**/*.config.ts",
      "**/__tests__/fixtures/",
      "**/test-temp-*/",
      "ai-*.txt",
      "ai-*.md",
      "*.json",
      "*.log",
    ],
  },

  // Конфигурация для JavaScript файлов
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.jest,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-undef": "error",
      "no-empty": "warn",
      "no-prototype-builtins": "off",
    },
  },

  // Конфигурация для TypeScript файлов
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: "./tsconfig.base.json",
        tsconfigRootDir: process.cwd(),
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"]?.rules,

      // Правила для TypeScript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/ban-types": "warn",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Отключаем некоторые строгие правила для гибкости
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/await-thenable": "off",

      // Общие правила
      "no-console": "off",
    },
  },

  // Конфигурация для тестовых файлов (менее строгая)
  {
    files: ["**/*.test.ts", "**/*.spec.ts", "**/__tests__/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: null, // Отключаем type checking для тестов
      },
      globals: {
        ...globals.node,
        ...globals.es2022,
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        vi: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
    },
  },

  // Конфигурация для скриптов в корне (CLI скрипты)
  {
    files: ["*.mjs", "*.js", "scripts/**/*.mjs", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2022,
      },
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-var-requires": "off",
    },
  },

  // Конфигурация для пакета ast-analyzer (специфичные правила)
  {
    files: ["Directory/ast-analyzer/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "no-console": "off",
    },
  },

  // Конфигурация для shared-types пакета
  {
    files: ["packages/shared-types/src/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
    },
  },

  // Конфигурация для конфигурационных файлов
  {
    files: [
      "**/turbo.json",
      "**/pnpm-workspace.yaml",
      "**/*.config.{js,mjs,ts}",
    ],
    rules: {
      "no-console": "off",
    },
  },
];
