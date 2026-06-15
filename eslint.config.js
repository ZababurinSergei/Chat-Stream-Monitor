import eslintConfig from "@repo/eslint-config";

export default [
  ...eslintConfig,
  {
    // Игнорируем ненужные файлы и директории
    ignores: [
      // Системные директории
      "**/Directory/**",
      "**/fs/**",
      "**/logs/**",
      "**/cicd-reports/**",
      "**/semantic-reports/**",
      "**/verification-reports/**",

      // Тестовые файлы (не включаем в линтинг с проверкой типов)
      "**/__tests__/**",
      "**/*.test.ts",
      "**/*.spec.ts",
      "**/*.test.tsx",
      "**/*.spec.tsx",
      "**/refactor/__tests__/**",

      // Конфигурационные файлы
      "**/vitest.config.ts",
      "**/vitest.setup.ts",
      "**/esbuild.config.js",

      // Временные и резервные файлы
      "**/*.backup.*",
      "**/modules/**",
      "**/test-temp-*/**",

      // Скомпилированные файлы
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/*.d.ts",
    ],
  },
  {
    // Для тестов отключаем строгую проверку типов
    files: ["**/__tests__/**/*.ts", "**/*.test.ts"],
    languageOptions: {
      parserOptions: {
        project: null, // Отключаем проверку проекта для тестов
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Для конфигурационных файлов
    files: [
      "**/*.config.ts",
      "**/*.config.js",
      "vitest.config.ts",
      "vitest.setup.ts",
    ],
    languageOptions: {
      parserOptions: {
        project: null,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  {
    // Специальные правила только для packages
    files: ["packages/**/*.{ts,tsx,js,jsx}"],
    rules: {
      // Здесь можно добавить специфичные для пакетов правила
    },
  },
  {
    // Специальные правила только для tooling
    files: ["tooling/**/*.{js,mjs}"],
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];
