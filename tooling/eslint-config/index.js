import globals from "globals";
import tseslint from "typescript-eslint";
import jsonc from "eslint-plugin-jsonc";
import yml from "eslint-plugin-yml";

export default [
  // 1. Глобальные игнорирования
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/.next/**",
      "**/out/**",
      "**/.nuxt/**",
      "**/.output/**",
      "**/.vercel/**",
      "**/*.log",
      "**/*.tmp",
      "**/*.swp",
      "**/*.backup.*",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
      "**/yarn.lock",
      "**/.DS_Store",
      "**/Thumbs.db",
      "**/ai-*.md",
      "**/ai-*.txt",
      "**/output.json",
      "**/output.dot",
      "**/output.svg",
      "**/report.html",
      "**/vue-analysis.json",
      "**/module-analysis.json",
      "**/fs/fs.json",
      "**/logs/**",
      "**/verification-reports/**",
      "**/cicd-reports/**",
      "**/semantic-reports/**",
      "Directory/10/**",
      "Directory/11/**",
      "Directory/12/**",
      "Directory/13/**",
      "Directory/typescript-sdk/**",
    ],
  },

  // 2. JavaScript файлы
  {
    name: "@newkind/eslint-config/javascript",
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
        },
      ],
      "no-use-before-define": ["error", { functions: false, classes: true }],

      // Функции
      "arrow-parens": ["error", "as-needed"],
      "arrow-body-style": ["error", "as-needed"],
      "prefer-arrow-callback": "error",

      // Массивы и объекты
      "array-bracket-spacing": ["error", "never"],
      "object-curly-spacing": ["error", "always"],
      "object-shorthand": ["error", "always"],

      // Импорты
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
  },

  // 3. TypeScript файлы
  ...tseslint.configs.recommended,
  {
    name: "@newkind/eslint-config/typescript",
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: "module",
        project: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
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
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/array-type": ["error", { default: "array" }],
    },
  },

  // 4. JSON файлы
  ...jsonc.configs["recommended-with-jsonc"],
  {
    name: "@newkind/eslint-config/json",
    files: ["**/*.json", "**/*.jsonc", "**/*.json5"],
    rules: {
      "jsonc/indent": ["error", 2],
      "jsonc/quotes": ["error", "double"],
      "jsonc/comma-dangle": ["error", "never"],
      "jsonc/array-bracket-spacing": ["error", "never"],
      "jsonc/object-curly-spacing": ["error", "always"],
    },
  },

  // Специальные правила для package.json
  {
    name: "@newkind/eslint-config/package-json",
    files: ["**/package.json"],
    rules: {
      "jsonc/no-comments": "off",
    },
  },

  // Специальные правила для tsconfig.json
  {
    name: "@newkind/eslint-config/tsconfig-json",
    files: ["**/tsconfig*.json"],
    rules: {
      "jsonc/no-comments": "off",
      "jsonc/comma-dangle": "off",
    },
  },

  // 5. YAML файлы
  ...yml.configs.recommended,
  {
    name: "@newkind/eslint-config/yaml",
    files: ["**/*.{yaml,yml}"],
    rules: {
      "yml/indent": ["error", 2],
      "yml/quotes": ["error", { prefer: "single", avoidEscape: true }],
      "yml/block-mapping": ["error", "always"],
      "yml/block-sequence": ["error", "always"],
      "yml/key-spacing": ["error", { beforeColon: false, afterColon: true }],
      "yml/no-empty-mapping-value": "error",
      "yml/no-empty-sequence-entry": "error",
      "yml/no-irregular-whitespace": "error",
      "yml/no-multiple-empty-lines": ["error", { max: 1 }],
      "yml/no-tab-indent": "error",
      "yml/require-string-key": "error",
      "yml/spaced-comment": ["error", "always"],
    },
  },

  // 6. Тестовые файлы (переопределения)
  {
    name: "@newkind/eslint-config/tests",
    files: [
      "**/__tests__/**/*.{js,ts}",
      "**/*.test.{js,ts}",
      "**/*.spec.{js,ts}",
    ],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },

  // 7. Скрипты (переопределения)
  {
    name: "@newkind/eslint-config/scripts",
    files: ["scripts/**/*.{js,mjs}", "**/*.config.{js,mjs}"],
    rules: {
      "no-console": "off",
    },
  },
];
