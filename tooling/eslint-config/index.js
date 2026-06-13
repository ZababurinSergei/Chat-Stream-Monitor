/**
 * ESLint Configuration for Monorepo
 *
 * Общая конфигурация ESLint для всех пакетов монорепозитория.
 * Поддерживает TypeScript, JavaScript, Vue и современный ESNext.
 */

export default {
  root: true,

  // Окружения
  env: {
    node: true,
    es2022: true,
    browser: true,
    jest: true,
    vitest: true,
  },

  // Базовые настройки
  parser: "@typescript-eslint/parser",

  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
      impliedStrict: true,
    },
    // TypeScript project configuration (опционально)
    project: [
      "./tsconfig.json",
      "./packages/*/tsconfig.json",
      "./Directory/*/tsconfig.json",
      "./apps/*/tsconfig.json",
    ],
    tsconfigRootDir: process.cwd(),
    extraFileExtensions: [".vue"],
  },

  // Плагины
  plugins: ["@typescript-eslint", "import", "unicorn"],

  // Расширения конфигурации
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:unicorn/recommended",
  ],

  // Настройки для импортов
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: [
          "./tsconfig.json",
          "./packages/*/tsconfig.json",
          "./Directory/*/tsconfig.json",
        ],
      },
      node: {
        extensions: [".js", ".jsx", ".ts", ".tsx", ".vue", ".mjs", ".cjs"],
      },
    },
    "import/extensions": [".js", ".jsx", ".ts", ".tsx", ".vue"],
    "import/ignore": ["node_modules", "\\.(css|scss|less|json)$"],
  },

  // Правила
  rules: {
    // ============================================
    // ОСНОВНЫЕ ПРАВИЛА
    // ============================================

    // Отключаем console.log в production (но разрешаем в dev)
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
    "no-alert": "warn",

    // Стиль кода
    semi: ["error", "always"],
    quotes: [
      "error",
      "single",
      { avoidEscape: true, allowTemplateLiterals: true },
    ],
    "comma-dangle": ["error", "always-multiline"],
    indent: ["error", 2, { SwitchCase: 1, ignoredNodes: ["TemplateLiteral"] }],
    "no-trailing-spaces": "error",
    "eol-last": ["error", "always"],
    "no-multiple-empty-lines": ["error", { max: 2, maxEOF: 1, maxBOF: 0 }],
    "space-before-function-paren": [
      "error",
      {
        anonymous: "always",
        named: "never",
        asyncArrow: "always",
      },
    ],
    "keyword-spacing": ["error", { before: true, after: true }],
    "space-infix-ops": "error",
    "brace-style": ["error", "1tbs", { allowSingleLine: true }],

    // Переменные
    "no-unused-vars": "off", // Используем TypeScript версию
    "no-var": "error",
    "prefer-const": [
      "error",
      { destructuring: "all", ignoreReadBeforeAssign: false },
    ],
    "prefer-template": "error",
    "prefer-arrow-callback": "error",
    "prefer-spread": "error",
    "prefer-rest-params": "error",
    "prefer-destructuring": [
      "warn",
      {
        array: false,
        object: true,
      },
    ],

    // Функции
    "arrow-body-style": ["error", "as-needed"],
    "arrow-parens": ["error", "always"],
    "arrow-spacing": "error",
    "no-param-reassign": ["error", { props: false }],
    "func-style": ["error", "declaration", { allowArrowFunctions: true }],

    // Сравнения
    eqeqeq: ["error", "always", { null: "ignore" }],
    "no-else-return": ["error", { allowElseIf: false }],

    // Обработка ошибок
    "handle-callback-err": "error",
    "no-throw-literal": "error",
    "no-useless-catch": "error",
    "no-useless-return": "error",

    // Импорты
    "import/no-unresolved": "error",
    "import/named": "error",
    "import/default": "error",
    "import/namespace": "error",
    "import/no-duplicates": "error",
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
          "object",
          "type",
        ],
        "newlines-between": "always",
        alphabetize: { order: "asc", caseInsensitive: true },
        pathGroups: [
          {
            pattern: "@newkind/**",
            group: "internal",
            position: "after",
          },
          {
            pattern: "@/**",
            group: "internal",
            position: "after",
          },
          {
            pattern: "./*.css",
            group: "index",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
      },
    ],
    "import/no-cycle": ["error", { maxDepth: 5, ignoreExternal: true }],
    "import/no-self-import": "error",
    "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
    "import/newline-after-import": "error",

    // ============================================
    // TYPESCRIPT СПЕЦИФИЧНЫЕ ПРАВИЛА
    // ============================================

    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
      },
    ],
    "@typescript-eslint/explicit-function-return-type": [
      "warn",
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
      },
    ],
    "@typescript-eslint/explicit-module-boundary-types": [
      "warn",
      {
        allowArgumentsExplicitlyTypedAsAny: true,
        allowDirectConstAssertionInArrowFunctions: true,
        allowedNames: [],
        allowHigherOrderFunctions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    "@typescript-eslint/no-inferrable-types": [
      "error",
      {
        ignoreParameters: true,
        ignoreProperties: true,
      },
    ],
    "@typescript-eslint/array-type": [
      "error",
      { default: "array", readonly: "array" },
    ],
    "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
        fixStyle: "separate-type-imports",
      },
    ],
    "@typescript-eslint/no-non-null-assertion": "warn",
    "@typescript-eslint/no-empty-interface": "warn",
    "@typescript-eslint/no-empty-function": [
      "error",
      { allow: ["arrowFunctions"] },
    ],
    "@typescript-eslint/no-for-in-array": "error",
    "@typescript-eslint/no-require-imports": "error",
    "@typescript-eslint/no-unnecessary-condition": "warn",
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    "@typescript-eslint/prefer-as-const": "error",
    "@typescript-eslint/prefer-for-of": "warn",
    "@typescript-eslint/prefer-nullish-coalescing": "warn",
    "@typescript-eslint/prefer-optional-chain": "warn",
    "@typescript-eslint/prefer-readonly": "warn",
    "@typescript-eslint/prefer-reduce-type-parameter": "warn",
    "@typescript-eslint/prefer-string-starts-ends-with": "error",
    "@typescript-eslint/require-await": "warn",
    "@typescript-eslint/restrict-plus-operands": "error",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
        allowBoolean: true,
        allowAny: false,
        allowNullish: false,
        allowRegExp: false,
      },
    ],
    "@typescript-eslint/switch-exhaustiveness-check": "error",
    "@typescript-eslint/unbound-method": ["error", { ignoreStatic: true }],
    "@typescript-eslint/no-floating-promises": [
      "error",
      { ignoreVoid: true, ignoreIIFE: true },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: false },
    ],

    // ============================================
    // UNICORN ПРАВИЛА
    // ============================================

    "unicorn/filename-case": [
      "error",
      {
        cases: {
          camelCase: true,
          pascalCase: true,
          kebabCase: true,
        },
        ignore: ["README.md", "\\.test\\.ts$", "\\.spec\\.ts$"],
      },
    ],
    "unicorn/prevent-abbreviations": "off", // Слишком строгое правило
    "unicorn/no-null": "off", // null иногда полезен
    "unicorn/no-useless-undefined": "off",
    "unicorn/no-array-reduce": "off", // reduce полезен
    "unicorn/prefer-module": "off",
    "unicorn/consistent-destructuring": "warn",
    "unicorn/consistent-function-scoping": "warn",
    "unicorn/no-array-for-each": "off",
    "unicorn/no-await-in-promise-methods": "warn",
    "unicorn/no-console-spaces": "warn",
    "unicorn/no-document-cookie": "error",
    "unicorn/no-empty-file": "warn",
    "unicorn/no-hex-escape": "warn",
    "unicorn/no-instanceof-array": "error",
    "unicorn/no-invalid-remove-event-listener": "error",
    "unicorn/no-keyword-prefix": "off",
    "unicorn/no-lonely-if": "error",
    "unicorn/no-magic-array-flat-depth": "warn",
    "unicorn/no-negated-condition": "warn",
    "unicorn/no-nested-ternary": "warn",
    "unicorn/no-new-array": "error",
    "unicorn/no-new-buffer": "error",
    "unicorn/no-object-as-default-parameter": "warn",
    "unicorn/no-process-exit": "off",
    "unicorn/no-static-only-class": "warn",
    "unicorn/no-thenable": "error",
    "unicorn/no-this-assignment": "error",
    "unicorn/no-unnecessary-polyfills": "error",
    "unicorn/no-unreadable-array-destructuring": "warn",
    "unicorn/no-unreadable-iife": "warn",
    "unicorn/no-unsafe-regex": "warn",
    "unicorn/no-unused-properties": "warn",
    "unicorn/no-useless-fallback-in-spread": "error",
    "unicorn/no-useless-length-check": "error",
    "unicorn/no-useless-promise-resolve-reject": "error",
    "unicorn/no-useless-spread": "error",
    "unicorn/no-useless-switch-case": "error",
    "unicorn/number-literal-case": "error",
    "unicorn/numeric-separators-style": "error",
    "unicorn/prefer-add-event-listener": "error",
    "unicorn/prefer-array-find": "error",
    "unicorn/prefer-array-flat": "error",
    "unicorn/prefer-array-flat-map": "error",
    "unicorn/prefer-array-index-of": "error",
    "unicorn/prefer-array-some": "error",
    "unicorn/prefer-at": "error",
    "unicorn/prefer-blob-reading-methods": "error",
    "unicorn/prefer-code-point": "error",
    "unicorn/prefer-date-now": "error",
    "unicorn/prefer-default-parameters": "error",
    "unicorn/prefer-dom-node-append": "error",
    "unicorn/prefer-dom-node-dataset": "error",
    "unicorn/prefer-dom-node-remove": "error",
    "unicorn/prefer-dom-node-text-content": "error",
    "unicorn/prefer-export-from": "error",
    "unicorn/prefer-includes": "error",
    "unicorn/prefer-json-parse-buffer": "off",
    "unicorn/prefer-keyboard-event-key": "error",
    "unicorn/prefer-logical-operator-over-ternary": "warn",
    "unicorn/prefer-math-trunc": "error",
    "unicorn/prefer-modern-dom-apis": "error",
    "unicorn/prefer-modern-math-apis": "error",
    "unicorn/prefer-negative-index": "warn",
    "unicorn/prefer-node-protocol": "error",
    "unicorn/prefer-number-properties": "error",
    "unicorn/prefer-object-from-entries": "error",
    "unicorn/prefer-optional-catch-binding": "error",
    "unicorn/prefer-prototype-methods": "error",
    "unicorn/prefer-query-selector": "error",
    "unicorn/prefer-reflect-apply": "error",
    "unicorn/prefer-regexp-test": "error",
    "unicorn/prefer-set-has": "warn",
    "unicorn/prefer-spread": "error",
    "unicorn/prefer-string-replace-all": "error",
    "unicorn/prefer-string-slice": "error",
    "unicorn/prefer-string-starts-ends-with": "error",
    "unicorn/prefer-string-trim-start-end": "error",
    "unicorn/prefer-switch": "warn",
    "unicorn/prefer-ternary": "warn",
    "unicorn/prefer-top-level-await": "warn",
    "unicorn/prefer-type-error": "error",
    "unicorn/relative-url-style": ["error", "always"],
    "unicorn/require-array-join-separator": "error",
    "unicorn/require-number-to-fixed-digits-argument": "error",
    "unicorn/require-post-message-target-origin": "error",
    "unicorn/string-content": "off",
    "unicorn/throw-new-error": "error",
  },

  // Переопределения для конкретных типов файлов
  overrides: [
    // Тестовые файлы
    {
      files: [
        "**/*.test.ts",
        "**/*.test.js",
        "**/*.spec.ts",
        "**/*.spec.js",
        "**/__tests__/**/*.ts",
      ],
      env: {
        jest: true,
        vitest: true,
      },
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/unbound-method": "off",
        "unicorn/no-useless-undefined": "off",
        "unicorn/consistent-function-scoping": "off",
        "import/no-cycle": "off",
      },
    },

    // Vue файлы
    {
      files: ["**/*.vue"],
      parser: "vue-eslint-parser",
      parserOptions: {
        parser: "@typescript-eslint/parser",
        ecmaVersion: 2022,
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      extends: ["plugin:vue/vue3-recommended"],
      rules: {
        "vue/multi-word-component-names": "warn",
        "vue/no-v-html": "warn",
        "vue/require-default-prop": "warn",
        "vue/require-explicit-emits": "error",
        "vue/component-tags-order": [
          "error",
          {
            order: ["script", "template", "style"],
          },
        ],
        "vue/attributes-order": [
          "error",
          {
            order: [
              "DEFINITION",
              "LIST_RENDERING",
              "CONDITIONALS",
              "RENDER_MODIFIERS",
              "GLOBAL",
              "UNIQUE",
              "TWO_WAY_BINDING",
              "OTHER_DIRECTIVES",
              "OTHER_ATTR",
              "EVENTS",
              "CONTENT",
            ],
          },
        ],
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
      },
    },

    // Конфигурационные файлы
    {
      files: [
        "*.config.js",
        "*.config.ts",
        ".eslintrc.js",
        "vite.config.ts",
        "vitest.config.ts",
      ],
      env: {
        node: true,
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
        "@typescript-eslint/no-require-imports": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/explicit-function-return-type": "off",
        "import/no-default-export": "off",
        "unicorn/prefer-module": "off",
      },
    },

    // Скрипты и утилиты
    {
      files: ["scripts/**/*.js", "scripts/**/*.ts", "**/cli*.ts", "**/cli*.js"],
      rules: {
        "no-console": "off",
        "@typescript-eslint/no-var-requires": "off",
        "unicorn/no-process-exit": "off",
        "@typescript-eslint/no-require-imports": "off",
      },
    },

    // TypeScript declaration files
    {
      files: ["**/*.d.ts"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-empty-interface": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
      },
    },

    // AST Analyzer специфичные файлы
    {
      files: [
        "Directory/ast-analyzer/src/**/*.ts",
        "packages/ast-analyzer/**/*.ts",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "no-console": "off",
        "import/no-cycle": "off",
      },
    },
  ],

  // Игнорируемые файлы
  ignorePatterns: [
    "node_modules/",
    "dist/",
    "build/",
    "coverage/",
    ".turbo/",
    ".next/",
    ".nuxt/",
    ".output/",
    ".vercel/",
    "**/*.min.js",
    "**/*.d.ts",
    "Directory/10/",
    "Directory/11/",
    "Directory/12/",
    "Directory/13/",
    "Directory/typescript-sdk/",
    "**/__tests__/fixtures/**",
    "**/fixtures/**",
    "logs/",
    "fs/",
    "*.backup.*",
    "**/modules/",
    "temp/",
    "tmp/",
  ],

  // Отчеты
  reportUnusedDisableDirectives: true,
  reportUnusedInlineConfigs: true,
};
